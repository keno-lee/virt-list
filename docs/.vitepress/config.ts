import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  title: 'virt-list',
  description: 'A high-performance virtual list component for JavaScript',
  themeConfig: {
    nav: [
      { text: 'JS 示例', link: '/js/basic', activeMatch: '^/js/' },
      { text: 'React 示例', link: '/react/literal', activeMatch: '^/react/' },
      { text: 'Vue 示例', link: '/vue/literal', activeMatch: '^/vue/' },
    ],
    sidebar: {
      '/js/': [
        // {
        //   text: 'JS 示例',
        //   items: [
        //     { text: '模版字符串', link: '/js/literal' },
        //     { text: '虚拟列表', link: '/js/virt-list' },
        //     { text: '网格布局', link: '/js/virt-grid' },
        //   ],
        // },
        {
          text: '虚拟列表示例',
          items: [
            { text: '基础示例', link: '/js/basic' },
            { text: '海量数据', link: '/js/huge-data' },
            { text: '固定高度', link: '/js/fixed' },
            { text: '水平滚动', link: '/js/horizontal' },
            { text: '插槽', link: '/js/slots' },
            { text: '各类操作', link: '/js/operations' },
            { text: '可变窗口大小', link: '/js/resize' },
            { text: '可变高度', link: '/js/dynamic' },
            { text: '表格', link: '/js/table' },
            { text: '无限加载', link: '/js/infinity' },
            { text: '聊天室', link: '/js/chat' },
            { text: '高阶用法', link: '/js/advanced' },
            { text: '上下分页', link: '/js/pagination' },
            { text: 'keep-alive', link: '/js/keep-alive' },
          ],
        },
        {
          text: '虚拟树',
          items: [
            { text: '基础', link: '/js/virt-tree-basic' },
            { text: '展开/折叠', link: '/js/virt-tree-expand' },
            { text: '复选框', link: '/js/virt-tree-checkbox' },
            { text: '选择', link: '/js/virt-tree-select' },
            { text: '过滤', link: '/js/virt-tree-filter' },
            { text: '自定义内容', link: '/js/virt-tree-content' },
            { text: '连接线', link: '/js/virt-tree-showline' },
            { text: '拖拽', link: '/js/virt-tree-drag' },
          ],
        },
        {
          text: '网格布局',
          items: [
            { text: '基础', link: '/js/virt-grid' }
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
    server: {
      port: 6173,
    },
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
