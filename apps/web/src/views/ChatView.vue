<template>
  <div class="h-screen w-screen flex overflow-hidden bg-background">
    <Sidebar />
    <ChatArea />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useChatStore } from '../stores/chat.js';
import Sidebar from '../components/Sidebar.vue';
import ChatArea from '../components/ChatArea.vue';

const chatStore = useChatStore();

onMounted(() => {
  chatStore.loadRooms();
});
</script>
