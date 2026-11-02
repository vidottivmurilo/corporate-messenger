import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import type { UserDto, RegisterInput, LoginInput } from '@corp-messenger/shared';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<UserDto | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  if (token.value) {
    api.setToken(token.value);
    wsClient.connect(token.value);
  }

  async function register(input: RegisterInput) {
    const created = await api.register(input);
    // Realiza login automático após registro
    await login({ email: input.email, password: input.password });
    return created;
  }

  async function login(input: LoginInput) {
    const response = await api.login(input);
    token.value = response.token;
    user.value = response.user;

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    api.setToken(response.token);
    wsClient.connect(response.token);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.setToken(null);
    wsClient.disconnect();
  }

  return {
    token,
    user,
    isAuthenticated: () => !!token.value,
    register,
    login,
    logout
  };
});
