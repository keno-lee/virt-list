import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  title: 'virt-list',
  description: 'A high-performance virtual list component for JavaScript',
  themeConfig: {
    nav: [
      { text: 'JS 示例', link: '/js/literal', activeMatch: '^/js/' },
      { text: 'React 示例', link: '/react/literal', activeMatch: '^/react/' },
      { text: 'Vue 示例', link: '/vue/literal', activeMatch: '^/vue/' },
    ],
    sidebar: {
      '/js/': [
        {
          text: 'JS 示例',
          items: [
            { text: '模版字符串', link: '/js/literal' },
            { text: '虚拟列表', link: '/js/virt-list' },
          ],
        },
      ],
      '/react/': [
        {
          text: 'React 示例',
          items: [
            { text: '模版字符串', link: '/react/literal' },
            { text: 'VirtList 组件', link: '/react/widget' },
          ],
        },
      ],
      '/vue/': [
        {
          text: 'Vue 示例',
          items: [
            { text: '模版字符串', link: '/vue/literal' },
            { text: 'VirtList 组件', link: '/vue/widget' },
          ],
        },
      ],
    },
  },
  vite: {
    resolve: {
      alias: {
        '@virt-list/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
        '@virt-list/dom': fileURLToPath(new URL('../../packages/dom/src/index.ts', import.meta.url)),
        '@virt-list/react': fileURLToPath(new URL('../../packages/react/src/index.ts', import.meta.url)),
        '@virt-list/vue': fileURLToPath(new URL('../../packages/vue/src/index.ts', import.meta.url)),
        'vue-demi': 'vue',
      },
    },
  },
});
