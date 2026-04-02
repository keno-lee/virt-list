import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qiankun from 'vite-plugin-qiankun'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), qiankun('reactDemo', { useDevMode: true })],
  resolve: {
    alias: {
      '@virt-list/core': fileURLToPath(new URL('../../../packages/core/src/index.ts', import.meta.url)),
      '@virt-list/dom': fileURLToPath(new URL('../../../packages/dom/src/index.ts', import.meta.url)),
      '@virt-list/react': fileURLToPath(new URL('../../../packages/react/src/index.ts', import.meta.url)),
    },
  },
  server: {
    cors: true,
    hmr: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    outDir: '../../public/micro-apps/react',
    emptyOutDir: true,
  },
})
