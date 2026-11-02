<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-surface border border-border rounded-lg p-6 shadow-md relative">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold tracking-tight text-foreground">Novo Colaborador</h2>
        <button
          @click="$emit('close')"
          class="text-muted hover:text-foreground text-sm p-1 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div v-if="errorMessage" class="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2.5">
          {{ errorMessage }}
        </div>

        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Nome Completo</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="João Silva"
            class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">E-mail Corporativo</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="joao@empresa.com"
            class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Senha (mínimo 6 caracteres)</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="py-1.5 px-4 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
          >
            <span v-if="isLoading">Cadastrando...</span>
            <span v-else>Criar Cadastro</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const emit = defineEmits(['close']);
const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

async function handleRegister() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value
    });
    emit('close');
    router.push('/chat');
  } catch (err: any) {
    errorMessage.value = err.message || 'Erro ao registrar usuário';
  } finally {
    isLoading.value = false;
  }
}
</script>
