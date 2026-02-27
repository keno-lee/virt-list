import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  title: 'virt-list',
  description: 'A high-performance virtual list component for JavaScript',
  themeConfig: {
    nav: [
      { text: 'JS 示例', link: '/js/virt-list', activeMatch: '^/js/' },
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
            { text: '适配器', link: '/react/adapter' },
          ],
        },
      ],
      '/vue/': [
        {
          text: 'Vue 示例',
          items: [
            { text: '模版字符串', link: '/vue/literal' },
            { text: '适配器', link: '/vue/adapter' },
          ],
        },
      ],
    },
  },
  vite: {
    resolve: {
      alias: {
      },
    },
  },
});
