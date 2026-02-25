import './style.css';
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper';
import { VirtualList } from './virtual-list.js';

const list = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  content: `这是第 ${i + 1} 行内容，演示纯 JS 虚拟列表渲染。`,
}));

const template = `
  <div class="virt-list-controls">
    <div class="virt-list-control-group">
      <label for="scrollToIndexInput">滚动到索引:</label>
      <input type="number" id="scrollToIndexInput" placeholder="0" min="0" value="50" />
      <button class="virt-list-btn virt-list-btn-primary" id="btnScrollToIndex">滚动到索引</button>
    </div>
    <div class="virt-list-control-group">
      <label for="scrollToOffsetInput">滚动到偏移:</label>
      <input type="number" id="scrollToOffsetInput" placeholder="0" min="0" value="1000" />
      <button class="virt-list-btn virt-list-btn-secondary" id="btnScrollToOffset">滚动到偏移</button>
    </div>
    <div class="virt-list-control-group">
      <label for="scrollIntoViewInput">滚动到可视区域:</label>
      <input type="number" id="scrollIntoViewInput" placeholder="0" min="0" value="30" />
      <button class="virt-list-btn virt-list-btn-success" id="btnScrollIntoView">滚动到可视区域</button>
    </div>
  </div>
  <div class="virt-list-controls">
    <button class="virt-list-btn virt-list-btn-primary" id="btnTop">滚动到顶部</button>
    <button class="virt-list-btn virt-list-btn-primary" id="btnBottom">滚动到底部</button>
    <button class="virt-list-btn virt-list-btn-warning" id="btnRandom">随机滚动</button>
    <button class="virt-list-btn virt-list-btn-success" id="btnToggleScrollbar">切换真实滚动条</button>
  </div>
  <div id="status" class="status-text"></div>
  <div class="virt-list-container" id="virtListContainer"></div>
`;

function bootstrapJSApp(root) {
  root.innerHTML = template;

  const container = root.querySelector('#virtListContainer');
  const status = root.querySelector('#status');
  let hideNativeScrollbar = false;
  const listeners = [];

  const virtList = new VirtualList(container, {
    itemHeight: 72,
    overscan: 4,
    itemRender: (item) => {
      const row = document.createElement('div');
      row.className = 'virt-item';
      row.style.backgroundColor = `hsl(${(item.id * 13) % 360} 75% 95%)`;
      row.innerHTML = `
        <div style="font-weight:bold;">Item ${item.id}</div>
        <div style="color:#666;font-size:12px;">${item.content}</div>
        <div style="color:#999;font-size:10px;">Key: ${item.id} (Pure JS)</div>
      `;
      return row;
    },
  });

  virtList.init(list);

  const getNumber = (id) => Number.parseInt(root.querySelector(`#${id}`).value, 10);
  const setStatus = (text) => {
    status.textContent = text;
  };
  const on = (id, handler) => {
    const el = root.querySelector(`#${id}`);
    el.addEventListener('click', handler);
    listeners.push(() => el.removeEventListener('click', handler));
  };

  on('btnTop', () => {
    virtList.scrollToTop();
    setStatus('已滚动到顶部');
  });
  on('btnBottom', () => {
    virtList.scrollToBottom();
    setStatus('已滚动到底部');
  });
  on('btnScrollToIndex', () => {
    const index = getNumber('scrollToIndexInput');
    if (Number.isNaN(index) || index < 0 || index >= list.length) {
      setStatus('请输入有效索引 (0 - 999)');
      return;
    }
    virtList.scrollToIndex(index);
    setStatus(`已滚动到索引 ${index}`);
  });
  on('btnScrollToOffset', () => {
    const offset = getNumber('scrollToOffsetInput');
    if (Number.isNaN(offset) || offset < 0) {
      setStatus('请输入有效偏移值');
      return;
    }
    virtList.scrollToOffset(offset);
    setStatus(`已滚动到偏移 ${offset}`);
  });
  on('btnScrollIntoView', () => {
    const index = getNumber('scrollIntoViewInput');
    if (Number.isNaN(index) || index < 0 || index >= list.length) {
      setStatus('请输入有效索引 (0 - 999)');
      return;
    }
    virtList.scrollIntoView(index);
    setStatus(`已确保索引 ${index} 在可视区域`);
  });
  on('btnRandom', () => {
    const randomIndex = Math.floor(Math.random() * list.length);
    root.querySelector('#scrollToIndexInput').value = String(randomIndex);
    virtList.scrollToIndex(randomIndex);
    setStatus(`随机滚动到索引 ${randomIndex}`);
  });
  on('btnToggleScrollbar', () => {
    hideNativeScrollbar = !hideNativeScrollbar;
    container.classList.toggle('hide-native-scrollbar', hideNativeScrollbar);
    setStatus(hideNativeScrollbar ? '已隐藏真实滚动条' : '已显示真实滚动条');
  });

  setStatus('示例已就绪：1000 行虚拟列表');

  return () => {
    listeners.forEach((off) => off());
    root.innerHTML = '';
  };
}

let cleanup = null;

function render(props) {
  const root =
    (props?.container?.querySelector('#js-root')) ??
    document.getElementById('js-root');
  if (!root) return;
  cleanup?.();
  cleanup = bootstrapJSApp(root);
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
