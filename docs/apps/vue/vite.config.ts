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
      '@virt-list/core': fileURLToPath(new URL('../../../packages/core/src/index.ts', import.meta.url)),
      '@virt-list/dom': fileURLToPath(new URL('../../../packages/dom/src/index.ts', import.meta.url)),
      '@virt-list/vue': fileURLToPath(new URL('../../../packages/vue/src/index.ts', import.meta.url)),
    },
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    outDir: '../../public/micro-apps/vue',
    emptyOutDir: true,
  },
})
