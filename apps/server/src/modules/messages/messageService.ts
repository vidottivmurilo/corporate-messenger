import { eq, desc, and, lt, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { messages, users, messageReactions } from '../../db/schema.js';
import { roomService } from '../rooms/roomService.js';
import type { MessageDto, MessageHistoryResponse, ReactionDto } from '@corp-messenger/shared';

export class MessageService {
  async getMessageById(messageId: string) {
    return db.query.messages.findFirst({
      where: eq(messages.id, messageId)
    });
  }

  async saveMessage(roomId: string, senderId: string, text: string): Promise<MessageDto> {
    const [msg] = await db.insert(messages).values({
      roomId,
      senderId,
      text,
      isEdited: false,
      isDeleted: false
    }).returning();

    const sender = await db.query.users.findFirst({
      where: eq(users.id, senderId)
    });

    return {
      id: msg.id,
      roomId: msg.roomId,
      senderId,
      senderName: sender?.name || 'Desconhecido',
      text: msg.text,
      isEdited: false,
      isDeleted: false,
      reactions: [],
      createdAt: msg.createdAt.toISOString()
    };
  }

  async updateMessage(messageId: string, userId: string, newText: string): Promise<MessageDto> {
    const msg = await db.query.messages.findFirst({
      where: eq(messages.id, messageId)
    });

    if (!msg) {
      const error: any = new Error('Mensagem não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (msg.senderId !== userId) {
      const error: any = new Error('Apenas o autor pode editar esta mensagem');
      error.statusCode = 403;
      throw error;
    }

    const [updated] = await db.update(messages)
      .set({ text: newText, isEdited: true })
      .where(eq(messages.id, messageId))
      .returning();

    const sender = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    const reactions = await this.getReactionsForMessage(messageId);

    return {
      id: updated.id,
      roomId: updated.roomId,
      senderId: updated.senderId || '',
      senderName: sender?.name || 'Desconhecido',
      text: updated.text,
      isEdited: updated.isEdited,
      isDeleted: updated.isDeleted,
      reactions,
      createdAt: updated.createdAt.toISOString()
    };
  }

  async deleteMessage(messageId: string, userId: string): Promise<{ roomId: string }> {
    const msg = await db.query.messages.findFirst({
      where: eq(messages.id, messageId)
    });

    if (!msg) {
      const error: any = new Error('Mensagem não encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (msg.senderId !== userId) {
      const error: any = new Error('Apenas o autor pode excluir esta mensagem');
      error.statusCode = 403;
      throw error;
    }

    await db.update(messages)
      .set({ text: 'Esta mensagem foi apagada', isDeleted: true })
      .where(eq(messages.id, messageId));

    return { roomId: msg.roomId };
  }

  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<ReactionDto[]> {
    const msg = await db.query.messages.findFirst({
      where: eq(messages.id, messageId)
    });

    if (!msg) {
      const error: any = new Error('Mensagem não encontrada');
      error.statusCode = 404;
      throw error;
    }

    const allowedMembers = await roomService.getRoomMembers(msg.roomId);
    if (allowedMembers.length > 0 && !allowedMembers.includes(userId)) {
      const error: any = new Error('Acesso negado à sala desta mensagem');
      error.statusCode = 403;
      throw error;
    }

    const existing = await db.query.messageReactions.findFirst({
      where: and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    });

    if (existing) {
      await db.delete(messageReactions).where(eq(messageReactions.id, existing.id));
    } else {
      try {
        await db.insert(messageReactions).values({
          messageId,
          userId,
          emoji
        });
      } catch (err: any) {
        // Concorrência / Duplo clique: se violar unicidade de (message_id, user_id, emoji), ignora
        if (
          err?.code === '23505' ||
          err?.message?.includes('duplicate key') ||
          err?.message?.includes('msg_user_emoji_idx')
        ) {
          // Já inserido concorrentemente
        } else {
          throw err;
        }
      }
    }

    return this.getReactionsForMessage(messageId);
  }

  async getReactionsForMessage(messageId: string): Promise<ReactionDto[]> {
    const allReactions = await db.query.messageReactions.findMany({
      where: eq(messageReactions.messageId, messageId)
    });

    const reactionMap = new Map<string, string[]>();
    allReactions.forEach(r => {
      const users = reactionMap.get(r.emoji) || [];
      users.push(r.userId);
      reactionMap.set(r.emoji, users);
    });

    return Array.from(reactionMap.entries()).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users
    }));
  }

  async getMessages(roomId: string, beforeMessageId?: string, limit = 50): Promise<MessageHistoryResponse> {
    let cursorDate: Date | null = null;

    if (beforeMessageId) {
      const cursorMsg = await db.query.messages.findFirst({
        where: eq(messages.id, beforeMessageId)
      });
      if (cursorMsg) {
        cursorDate = cursorMsg.createdAt;
      }
    }

    const whereClause = cursorDate
      ? and(eq(messages.roomId, roomId), lt(messages.createdAt, cursorDate))
      : eq(messages.roomId, roomId);

    const result = await db.query.messages.findMany({
      where: whereClause,
      orderBy: [desc(messages.createdAt)],
      limit: limit + 1
    });

    const hasMore = result.length > limit;
    const items = hasMore ? result.slice(0, limit) : result;

    // Busca nomes dos remetentes
    const userIds = Array.from(new Set(items.map(m => m.senderId).filter(Boolean))) as string[];
    const userMap = new Map<string, string>();

    if (userIds.length > 0) {
      const foundUsers = await db.query.users.findMany({
        where: inArray(users.id, userIds)
      });
      foundUsers.forEach(u => userMap.set(u.id, u.name));
    }

    // Busca reações em lote
    const messageIds = items.map(m => m.id);
    const reactionsMap = new Map<string, ReactionDto[]>();

    if (messageIds.length > 0) {
      const rawReactions = await db.query.messageReactions.findMany({
        where: inArray(messageReactions.messageId, messageIds)
      });

      rawReactions.forEach(r => {
        const list = reactionsMap.get(r.messageId) || [];
        const existingEmojiGroup = list.find(g => g.emoji === r.emoji);
        if (existingEmojiGroup) {
          existingEmojiGroup.count++;
          existingEmojiGroup.users.push(r.userId);
        } else {
          list.push({ emoji: r.emoji, count: 1, users: [r.userId] });
        }
        reactionsMap.set(r.messageId, list);
      });
    }

    const formattedMessages: MessageDto[] = items.map(m => ({
      id: m.id,
      roomId: m.roomId,
      senderId: m.senderId || '',
      senderName: m.senderId ? (userMap.get(m.senderId) || 'Desconhecido') : 'Sistema',
      text: m.text,
      isEdited: m.isEdited,
      isDeleted: m.isDeleted,
      reactions: reactionsMap.get(m.id) || [],
      createdAt: m.createdAt.toISOString()
    }));

    const nextCursor = items.length > 0 ? items[items.length - 1].id : undefined;

    return {
      messages: formattedMessages,
      hasMore,
      nextCursor
    };
  }
}

export const messageService = new MessageService();
