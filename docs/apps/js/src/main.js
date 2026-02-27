import './style.css';
import {
  qiankunWindow,
  renderWithQiankun,
} from 'vite-plugin-qiankun/dist/helper';
import { bootstrapLiteral } from './literal.js';
import { bootstrapVirtList } from './virt-list.js';

const demoBootstrapMap = {
  literal: bootstrapLiteral,
  'virt-list': bootstrapVirtList,
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
