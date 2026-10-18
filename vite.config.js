import { defineConfig } from 'vite';
export default defineConfig({
  base: '/Fairy-Tail-RPG/',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
});
