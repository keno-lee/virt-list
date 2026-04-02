import { defineConfig } from 'vite';
import qiankun from 'vite-plugin-qiankun';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [qiankun('jsDemo', { useDevMode: true })],
  resolve: {
    alias: {
      '@virt-list/core': fileURLToPath(new URL('../../../packages/core/src/index.ts', import.meta.url)),
      '@virt-list/dom': fileURLToPath(new URL('../../../packages/dom/src/index.ts', import.meta.url)),
    },
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    outDir: '../../public/micro-apps/js',
    emptyOutDir: true,
  },
});
