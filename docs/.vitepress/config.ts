import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  title: 'virt-list',
  description: 'A high-performance virtual list component for JavaScript',
  themeConfig: {
    nav: [
      { text: 'Js 示例', link: '/js/virt-list', activeMatch: '^/js/' },
      { text: 'React 示例', link: '/react/virt-list', activeMatch: '^/react/' },
      { text: 'Vue 示例', link: '/vue/virt-list', activeMatch: '^/vue/' },
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
            // { text: '按钮交互', link: '/react/button' },
            // { text: '表单输入', link: '/react/form' },
            { text: 'TSX/JSX', link: '/react/virt-list' },
          ],
        },
      ],
      '/vue/': [
        {
          text: 'Vue 示例',
          items: [
            // { text: '按钮交互', link: '/vue/button' },
            // { text: '表单输入', link: '/vue/form' },
            { text: 'TSX/JSX', link: '/vue/virt-list' },
          ],
        },
      ],
      // '/guide/': [
      //   {
      //     text: '指南',
      //     items: [{ text: '总览', link: '/guide/playground' }],
      //   },
      // ],
    },
  },
  vite: {
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('../../packages/shared/src', import.meta.url)),
      },
    },
  },
});
