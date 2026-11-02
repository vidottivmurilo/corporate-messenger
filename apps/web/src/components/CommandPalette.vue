<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    @click.self="close"
  >
    <div
      class="w-full max-w-lg bg-[#0F1420] border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col text-foreground animate-in zoom-in-95 duration-150"
      @keydown.down.prevent="navigate(1)"
      @keydown.up.prevent="navigate(-1)"
      @keydown.enter.prevent="selectCurrent"
      @keydown.esc.prevent="close"
    >
      <!-- Campo de Busca -->
      <div class="flex items-center px-4 py-3 border-b border-border/60 bg-surface/40">
        <span class="text-muted text-sm mr-3">🔍</span>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="Buscar canal ou colega... (ex: geral, suporte)"
          class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/60 focus:outline-none"
          autofocus
        />
        <kbd class="text-[10px] font-mono bg-surface border border-border px-1.5 py-0.5 rounded text-muted">
          ESC
        </kbd>
      </div>

      <!-- Lista de Resultados -->
      <div class="max-h-80 overflow-y-auto p-2 space-y-1">
        <div v-if="filteredItems.length === 0" class="p-6 text-center text-xs text-muted">
          Nenhum canal ou contato encontrado para "{{ query }}".
        </div>

        <template v-else>
          <div
            v-for="(item, index) in filteredItems"
            :key="item.id"
            @click="selectItem(item)"
            @mouseenter="selectedIndex = index"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left',
              selectedIndex === index
                ? 'bg-primary/20 text-white'
                : 'text-foreground/80 hover:bg-surface/60 hover:text-foreground'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <span
                v-if="item.type === 'channel'"
                class="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-muted font-bold text-xs"
              >
                #
              </span>
              <span
                v-else
                class="relative flex h-2.5 w-2.5 ml-1 mr-1.5"
              >
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
              </span>
              <span>{{ item.title }}</span>
            </div>

            <div class="flex items-center gap-2 text-[10px] text-muted">
              <span>{{ item.type === 'channel' ? 'Canal' : 'Colega' }}</span>
              <span v-if="selectedIndex === index" class="text-primary font-mono">↵ Abrir</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Rodapé do Modal -->
      <footer class="px-4 py-2 border-t border-border/40 bg-surface/20 flex items-center justify-between text-[11px] text-muted">
        <div class="flex items-center gap-3">
          <span><kbd class="px-1 py-0.5 rounded bg-surface border border-border text-[9px]">↑</kbd> <kbd class="px-1 py-0.5 rounded bg-surface border border-border text-[9px]">↓</kbd> Navegar</span>
          <span><kbd class="px-1 py-0.5 rounded bg-surface border border-border text-[9px]">Enter</kbd> Selecionar</span>
        </div>
        <span>Corporate Palette</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useChatStore } from '../stores/chat.js';
import { useAuthStore } from '../stores/auth.js';
import type { RoomDto } from '@corp-messenger/shared';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
}>();

const chatStore = useChatStore();
const authStore = useAuthStore();
const query = ref('');
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

interface PaletteItem {
  id: string;
  title: string;
  type: 'channel' | 'user';
  room?: RoomDto;
  userId?: string;
}

const items = computed<PaletteItem[]>(() => {
  const result: PaletteItem[] = [];

  // Canais
  for (const r of chatStore.rooms) {
    if (!r.isDirect) {
      result.push({
        id: `room-${r.id}`,
        title: r.name,
        type: 'channel',
        room: r
      });
    }
  }

  // Colegas Online (excluindo self)
  for (const u of chatStore.onlineUsers) {
    if (u.userId !== authStore.user?.id) {
      result.push({
        id: `user-${u.userId}`,
        title: u.name,
        type: 'user',
        userId: u.userId
      });
    }
  }

  return result;
});

const filteredItems = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter(item => item.title.toLowerCase().includes(q));
});

watch(filteredItems, () => {
  selectedIndex.value = 0;
});

watch(() => props.isOpen, (open) => {
  if (open) {
    query.value = '';
    selectedIndex.value = 0;
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

function close() {
  emit('update:isOpen', false);
}

function navigate(direction: number) {
  if (filteredItems.value.length === 0) return;
  const len = filteredItems.value.length;
  selectedIndex.value = (selectedIndex.value + direction + len) % len;
}

function selectCurrent() {
  const item = filteredItems.value[selectedIndex.value];
  if (item) {
    selectItem(item);
  }
}

async function selectItem(item: PaletteItem) {
  if (item.type === 'channel' && item.room) {
    await chatStore.selectRoom(item.room);
  } else if (item.type === 'user' && item.userId) {
    await chatStore.openDm(item.userId);
  }
  close();
}
</script>

