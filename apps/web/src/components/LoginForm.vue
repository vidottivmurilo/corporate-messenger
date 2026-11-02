<template>
  <div class="w-full max-w-sm bg-surface border border-border rounded-lg p-6 shadow-sm">
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-foreground">Acessar Conta</h2>
      <p class="text-xs text-muted mt-1">Digite seu e-mail corporativo e senha para entrar.</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="errorMessage" class="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2.5">
        {{ errorMessage }}
      </div>

      <div>
        <label class="block text-xs font-medium text-foreground mb-1.5">E-mail Corporativo</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="colaborador@empresa.com"
          class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-foreground mb-1.5">Senha</label>
        <input
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span v-if="isLoading">Entrando...</span>
        <span v-else>Entrar</span>
      </button>
    </form>

    <div class="mt-6 pt-4 border-t border-border/50 text-center">
      <p class="text-xs text-muted">
        Não possui conta?
        <button
          type="button"
          @click="$emit('open-register')"
          class="text-primary hover:underline font-medium ml-1"
        >
          Criar cadastro
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

defineEmits(['open-register']);

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await authStore.login({
      email: email.value,
      password: password.value
    });
    router.push('/chat');
  } catch (err: any) {
    errorMessage.value = err.message || 'Erro ao realizar login';
  } finally {
    isLoading.value = false;
  }
}
</script>
