import { eq, desc, and, lt, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { messages, users } from '../../db/schema.js';
import type { MessageDto, MessageHistoryResponse } from '@corp-messenger/shared';

export class MessageService {
  async saveMessage(roomId: string, senderId: string, text: string): Promise<MessageDto> {
    const [msg] = await db.insert(messages).values({
      roomId,
      senderId,
      text
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
      createdAt: msg.createdAt.toISOString()
    };
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

    // Busca limit + 1 para saber se hasMore é true
    const result = await db.query.messages.findMany({
      where: whereClause,
      orderBy: [desc(messages.createdAt)],
      limit: limit + 1
    });

    const hasMore = result.length > limit;
    const items = hasMore ? result.slice(0, limit) : result;

    // Busca os nomes dos remetentes
    const userIds = Array.from(new Set(items.map(m => m.senderId).filter(Boolean))) as string[];
    const userMap = new Map<string, string>();

    if (userIds.length > 0) {
      const foundUsers = await db.query.users.findMany({
        where: sql`${users.id} IN ${userIds}`
      });
      foundUsers.forEach(u => userMap.set(u.id, u.name));
    }

    const formattedMessages: MessageDto[] = items.map(m => ({
      id: m.id,
      roomId: m.roomId,
      senderId: m.senderId || '',
      senderName: m.senderId ? (userMap.get(m.senderId) || 'Desconhecido') : 'Sistema',
      text: m.text,
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
