import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../src/stores/auth.js';
import { api } from '../src/services/api.js';

// Mock de localStorage para ambiente Node no Vitest
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: storageMock, writable: true });

vi.mock('../src/services/websocket.js', () => ({
  wsClient: {
    connect: vi.fn(),
    disconnect: vi.fn()
  }
}));

describe('Frontend AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deve inicializar desautenticado quando localStorage estiver vazio', () => {
    const authStore = useAuthStore();
    expect(authStore.isAuthenticated()).toBe(false);
    expect(authStore.user).toBeNull();
  });

  it('deve salvar token e usuário no login com sucesso', async () => {
    const mockUser = {
      id: '123',
      name: 'Murilo',
      email: 'murilo@empresa.com',
      createdAt: '2026-11-02T12:00:00Z'
    };

    vi.spyOn(api, 'login').mockResolvedValue({
      token: 'mock-jwt-token',
      user: mockUser
    });

    const authStore = useAuthStore();
    await authStore.login({ email: 'murilo@empresa.com', password: 'senha' });

    expect(authStore.isAuthenticated()).toBe(true);
    expect(authStore.token).toBe('mock-jwt-token');
    expect(authStore.user?.name).toBe('Murilo');
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
  });

  it('deve limpar dados no logout', async () => {
    const authStore = useAuthStore();
    authStore.token = 'existing-token';
    authStore.user = { id: '1', name: 'Test', email: 'test@empresa.com', createdAt: '' };

    authStore.logout();

    expect(authStore.isAuthenticated()).toBe(false);
    expect(authStore.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
