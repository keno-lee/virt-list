import './style.css';
import {
  qiankunWindow,
  renderWithQiankun,
} from 'vite-plugin-qiankun/dist/helper';
import { bootstrapLiteral } from './literal.js';
import { bootstrapVirtList } from './virt-list.js';
import { bootstrapVirtGrid } from './virt-grid.js';
import { bootstrapBasic } from './basic.js';
import { bootstrapHugeData } from './huge-data.js';
import { bootstrapFixed } from './fixed.js';
import { bootstrapHorizontal } from './horizontal.js';
import { bootstrapSlots } from './slots.js';
import { bootstrapOperations } from './operations.js';
import { bootstrapResize } from './resize.js';
import { bootstrapDynamic } from './dynamic.js';
import { bootstrapTable } from './table.js';
import { bootstrapInfinity } from './infinity.js';
import { bootstrapChat } from './chat.js';
import { bootstrapAdvanced } from './advanced.js';
import { bootstrapPagination } from './pagination.js';
import { bootstrapKeepAlive } from './keep-alive.js';
import { bootstrapTreeBasic } from './virt-tree-basic.js';
import { bootstrapTreeCheckbox } from './virt-tree-checkbox.js';
import { bootstrapTreeExpand } from './virt-tree-expand.js';
import { bootstrapTreeFilter } from './virt-tree-filter.js';
import { bootstrapTreeSelect } from './virt-tree-select.js';
import { bootstrapTreeShowLine } from './virt-tree-showline.js';
import { bootstrapTreeContent } from './virt-tree-content.js';
import { bootstrapTreeDrag } from './virt-tree-drag.js';

const demoBootstrapMap = {
  literal: bootstrapLiteral,
  'virt-list': bootstrapVirtList,
  'virt-grid': bootstrapVirtGrid,
  basic: bootstrapBasic,
  'huge-data': bootstrapHugeData,
  fixed: bootstrapFixed,
  horizontal: bootstrapHorizontal,
  slots: bootstrapSlots,
  operations: bootstrapOperations,
  resize: bootstrapResize,
  dynamic: bootstrapDynamic,
  table: bootstrapTable,
  infinity: bootstrapInfinity,
  chat: bootstrapChat,
  advanced: bootstrapAdvanced,
  pagination: bootstrapPagination,
  'keep-alive': bootstrapKeepAlive,
  'virt-tree-basic': bootstrapTreeBasic,
  'virt-tree-checkbox': bootstrapTreeCheckbox,
  'virt-tree-expand': bootstrapTreeExpand,
  'virt-tree-filter': bootstrapTreeFilter,
  'virt-tree-select': bootstrapTreeSelect,
  'virt-tree-showline': bootstrapTreeShowLine,
  'virt-tree-content': bootstrapTreeContent,
  'virt-tree-drag': bootstrapTreeDrag,
};

let cleanup = null;

function render(props) {
  const root =
    props?.container?.querySelector('#js-root') ??
    document.getElementById('js-root');
  if (!root) return;
  const exampleId = props?.exampleId ?? 'virt-list';
  const bootstrap =
    demoBootstrapMap[exampleId] ?? demoBootstrapMap['virt-list'];
  cleanup?.();
  cleanup = bootstrap(root);
}

renderWithQiankun({
  bootstrap() {
    return Promise.resolve();
  },
  mount(props) {
    render(props);
    return Promise.resolve();
  },
  unmount() {
    cleanup?.();
    cleanup = null;
    return Promise.resolve();
  },
  update(props) {
    render(props);
    return Promise.resolve();
  },
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
