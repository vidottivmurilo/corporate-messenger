import { z } from 'zod';

// ==========================================
// 1. Schemas & Tipos de Autenticação
// ==========================================
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

// ==========================================
// 2. Schemas & Tipos de Salas e Canais
// ==========================================
export const createDmSchema = z.object({
  targetUserId: z.string().uuid('ID de usuário inválido')
});

export type CreateDmInput = z.infer<typeof createDmSchema>;

export interface RoomDto {
  id: string;
  name: string;
  isDirect: boolean;
  createdAt: string;
  lastMessage?: string;
  updatedAt?: string;
}

// ==========================================
// 3. Schemas & Tipos de Mensagens & Reações
// ==========================================
export const sendMessageSchema = z.object({
  roomId: z.string().uuid('ID de sala inválido'),
  text: z.string().min(1, 'Mensagem não pode ser vazia').max(5000, 'Mensagem muito longa')
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const updateMessageSchema = z.object({
  text: z.string().trim().min(1, 'Mensagem não pode ser vazia').max(5000, 'Mensagem muito longa')
});

export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

export const toggleReactionSchema = z.object({
  emoji: z.string().trim().min(1, 'Emoji não pode ser vazio').max(16, 'Emoji muito longo')
});

export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;

export interface ReactionDto {
  emoji: string;
  count: number;
  users: string[]; // nomes ou IDs dos usuários que reagiram
}

export type MessageReactionDto = ReactionDto;

export interface MessageDto {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  reactions?: ReactionDto[];
  createdAt: string;
}

export interface MessageHistoryResponse {
  messages: MessageDto[];
  hasMore: boolean;
  nextCursor?: string;
}

// ==========================================
// 4. Protocolo de WebSocket em Tempo Real (v2)
// ==========================================
export type WsClientMessage =
  | { type: 'AUTH'; token: string }
  | { type: 'SEND_MESSAGE'; roomId: string; text: string }
  | { type: 'TYPING'; roomId: string }
  | { type: 'PING' };

export interface OnlineUserDto {
  userId: string;
  name: string;
}

export type WsServerMessage =
  | { type: 'AUTH_SUCCESS'; userId: string; name: string }
  | { type: 'AUTH_ERROR'; message: string }
  | { type: 'ONLINE_USERS'; users: OnlineUserDto[] }
  | { type: 'NEW_MESSAGE'; message: MessageDto }
  | { type: 'MESSAGE_UPDATED'; message: MessageDto }
  | { type: 'MESSAGE_DELETED'; messageId: string; roomId: string }
  | { type: 'USER_TYPING'; roomId: string; userId: string; userName: string }
  | { type: 'PONG' };
