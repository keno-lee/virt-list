import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import qiankun from 'vite-plugin-qiankun'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), qiankun('vueDemo', { useDevMode: true })],
  resolve: {
    alias: {
      '@src': fileURLToPath(new URL('../../src', import.meta.url)),
      '@virt-list/js': fileURLToPath(new URL('../../packages/js/src/index.ts', import.meta.url)),
    },
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    outDir: '../../docs/public/micro-apps/vue',
    emptyOutDir: true,
  },
})
