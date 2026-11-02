import type {
  RegisterInput,
  LoginInput,
  AuthResponse,
  RoomDto,
  MessageHistoryResponse,
  MessageDto,
  ReactionDto
} from '@corp-messenger/shared';

const BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Erro de comunicação' }));
      throw new Error(data.error || `Erro HTTP ${response.status}`);
    }

    return response.json();
  }

  async register(input: RegisterInput) {
    return this.request<AuthResponse['user']>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async login(input: LoginInput) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async listRooms() {
    return this.request<RoomDto[]>('/rooms');
  }

  async getOrCreateDm(targetUserId: string) {
    return this.request<RoomDto>('/rooms/dm', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
  }

  async getMessages(roomId: string, beforeMessageId?: string, limit = 50) {
    const params = new URLSearchParams();
    if (beforeMessageId) params.append('beforeMessageId', beforeMessageId);
    if (limit) params.append('limit', limit.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<MessageHistoryResponse>(`/messages/${roomId}${qs}`);
  }

  async updateMessage(messageId: string, text: string) {
    return this.request<MessageDto>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text })
    });
  }

  async deleteMessage(messageId: string) {
    return this.request<{ success: boolean }>(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  async toggleReaction(messageId: string, emoji: string) {
    return this.request<ReactionDto[]>(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  }
}

export const api = new ApiService();
