<template>
  <div class="h-screen w-screen flex overflow-hidden bg-background">
    <Sidebar @open-palette="isPaletteOpen = true" />
    <ChatArea @open-palette="isPaletteOpen = true" />

    <!-- Command Palette (Ctrl+K) -->
    <CommandPalette v-model:isOpen="isPaletteOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../stores/chat.js';
import Sidebar from '../components/Sidebar.vue';
import ChatArea from '../components/ChatArea.vue';
import CommandPalette from '../components/CommandPalette.vue';

const chatStore = useChatStore();
const isPaletteOpen = ref(false);

function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isPaletteOpen.value = !isPaletteOpen.value;
  }
}

onMounted(() => {
  chatStore.loadRooms();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
