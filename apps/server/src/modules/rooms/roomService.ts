import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { rooms, roomMembers, users } from '../../db/schema.js';
import type { RoomDto } from '@corp-messenger/shared';

export class RoomService {
  async ensureGeneralChannel(): Promise<RoomDto> {
    const existing = await db.query.rooms.findFirst({
      where: and(eq(rooms.name, 'geral'), eq(rooms.isDirect, false))
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        isDirect: existing.isDirect,
        createdAt: existing.createdAt.toISOString()
      };
    }

    const [created] = await db.insert(rooms).values({
      name: 'geral',
      isDirect: false
    }).returning();

    return {
      id: created.id,
      name: created.name,
      isDirect: created.isDirect,
      createdAt: created.createdAt.toISOString()
    };
  }

  async listPublicRooms(): Promise<RoomDto[]> {
    await this.ensureGeneralChannel();

    const result = await db.query.rooms.findMany({
      where: eq(rooms.isDirect, false)
    });

    return result.map(r => ({
      id: r.id,
      name: r.name,
      isDirect: r.isDirect,
      createdAt: r.createdAt.toISOString()
    }));
  }

  async getOrCreateDm(userAId: string, userBId: string): Promise<RoomDto> {
    if (userAId === userBId) {
      const error: any = new Error('Não é permitido criar DM consigo mesmo');
      error.statusCode = 400;
      throw error;
    }

    // Busca usuário B para saber o nome
    const userB = await db.query.users.findFirst({
      where: eq(users.id, userBId)
    });

    if (!userB) {
      const error: any = new Error('Usuário destinatário não encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Verifica se já existe uma sala direta compartilhada por ambos
    const query = sql`
      SELECT r.id, r.name, r.is_direct, r.created_at
      FROM rooms r
      JOIN room_members rm1 ON rm1.room_id = r.id AND rm1.user_id = ${userAId}
      JOIN room_members rm2 ON rm2.room_id = r.id AND rm2.user_id = ${userBId}
      WHERE r.is_direct = true
      LIMIT 1
    `;

    const existingResult: any = await db.execute(query);
    if (existingResult.rows && existingResult.rows.length > 0) {
      const row = existingResult.rows[0];
      return {
        id: row.id,
        name: userB.name,
        isDirect: true,
        createdAt: new Date(row.created_at).toISOString()
      };
    }

    // Cria nova sala direta
    const [createdRoom] = await db.insert(rooms).values({
      name: userB.name,
      isDirect: true
    }).returning();

    // Insere ambos os membros
    await db.insert(roomMembers).values([
      { roomId: createdRoom.id, userId: userAId },
      { roomId: createdRoom.id, userId: userBId }
    ]);

    return {
      id: createdRoom.id,
      name: userB.name,
      isDirect: true,
      createdAt: createdRoom.createdAt.toISOString()
    };
  }

  async getRoomMembers(roomId: string): Promise<string[]> {
    const isPublic = await db.query.rooms.findFirst({
      where: and(eq(rooms.id, roomId), eq(rooms.isDirect, false))
    });

    // Se for canal público, não precisa filtrar por room_members (todos têm acesso)
    if (isPublic) {
      return []; // Vazio sinaliza acesso global
    }

    const members = await db.query.roomMembers.findMany({
      where: eq(roomMembers.roomId, roomId)
    });

    return members.map(m => m.userId);
  }
}

export const roomService = new RoomService();
