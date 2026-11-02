<template>
  <div class="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
    <div class="mb-8 text-center">
      <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary mb-3">
        💬
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">Corporate Messenger</h1>
      <p class="text-xs text-muted mt-1">Comunicação corporativa segura e instantânea em tempo real</p>
    </div>

    <LoginForm @open-register="showRegister = true" />

    <RegisterModal
      v-if="showRegister"
      @close="showRegister = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LoginForm from '../components/LoginForm.vue';
import RegisterModal from '../components/RegisterModal.vue';

const showRegister = ref(false);
</script>
