import { VirtListDOM } from '@virt-list/dom';

function generateList(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    index: i,
    text: `可变窗口大小示例行 ${i}，请拖拽容器右下角调整大小。`,
  }));
}

const template = `
  <div class="demo-panel">
    <div id="stats" class="demo-stats"></div>
    <div class="demo-resize-container" id="listContainer"></div>
  </div>
`;

export function bootstrapResize(root) {
  root.innerHTML = template;

  const container = root.querySelector('#listContainer');
  const statsEl = root.querySelector('#stats');
  const list = generateList(2000);

  const virtList = new VirtListDOM(
    container,
    {
      list,
      itemKey: 'id',
      minSize: 40,
      buffer: 2,
      renderItem: (item) => {
        const row = document.createElement('div');
        row.className = 'demo-row-item';
        row.innerHTML = `
          <span class="demo-row-index">#${item.index}</span>
          <span class="demo-row-text">${item.text}</span>
        `;
        return row;
      },
    },
    {
      rangeUpdate: (begin, end) => {
        statsEl.textContent = `总数: ${list.length} | RenderBegin: ${begin} | RenderEnd: ${end}`;
      },
    },
  );

  statsEl.textContent = `总数: ${list.length} | 拖拽容器边框调整大小`;

  return () => {
    virtList.destroy();
    root.innerHTML = '';
  };
}
