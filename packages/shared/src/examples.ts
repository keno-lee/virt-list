export type FrameworkKind = 'react' | 'vue' | 'js';

export interface ExampleItem {
  id: string;
  title: string;
  description: string;
}

export const examples: ExampleItem[] = [
  {
    id: 'button',
    title: '按钮交互',
    description: '展示按钮点击与消息反馈。',
  },
  {
    id: 'form',
    title: '表单输入',
    description: '展示输入框与受控状态同步。',
  },
  {
    id: 'virt-list',
    title: '虚拟列表',
    description: '展示大数据量列表的可视区域渲染。',
  },
];

export const defaultExampleId = examples[0]?.id ?? 'button';
