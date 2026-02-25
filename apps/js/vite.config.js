import { defineConfig } from 'vite';
import qiankun from 'vite-plugin-qiankun';

export default defineConfig({
  plugins: [qiankun('jsDemo', { useDevMode: true })],
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    outDir: '../../docs/public/micro-apps/js',
    emptyOutDir: true,
  },
});
