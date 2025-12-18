import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@allowance': resolve(__dirname, 'src/modules/allowance')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
