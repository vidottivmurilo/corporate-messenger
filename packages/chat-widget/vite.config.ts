import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'CorporateChatWidget',
      fileName: (format) => `corporate-chat-widget.${format}.js`
    },
    rollupOptions: {
      external: ['vue', '@corp-messenger/shared'],
      output: {
        globals: {
          vue: 'Vue',
          '@corp-messenger/shared': 'CorpMessengerShared'
        }
      }
    }
  }
});
