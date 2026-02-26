import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  title: 'virt-list',
  description: 'A high-performance virtual list component for JavaScript',
  themeConfig: {
    nav: [
      { text: 'Js 示例', link: '/js/virt-list', activeMatch: '^/js/' },
      { text: 'React 示例', link: '/react/tsx', activeMatch: '^/react/' },
      { text: 'Vue 示例', link: '/vue/tsx', activeMatch: '^/vue/' },
    ],
    sidebar: {
      '/js/': [
        {
          text: 'Js 示例',
          items: [
            { text: '虚拟列表', link: '/js/virt-list' },
          ],
        },
      ],
      '/react/': [
        {
          text: 'React 示例',
          items: [
            { text: 'TSX/JSX', link: '/react/tsx' },
          ],
        },
      ],
      '/vue/': [
        {
          text: 'Vue 示例',
          items: [
            { text: 'TSX/JSX', link: '/vue/tsx' },
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
