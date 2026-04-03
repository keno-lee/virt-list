import { VirtListDOM } from '@virt-list/dom';

function generateList(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    index: i,
    text: `Slots 示例行 ${i} 的内容。`,
  }));
}

function createSlotEl(text, style) {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#fff',
  });
  if (style) Object.assign(el.style, style);
  return el;
}

const template = `
  <div class="demo-panel">
    <div id="stats" class="demo-stats"></div>
    <div class="demo-list-container" id="listContainer"></div>
  </div>
`;

export function bootstrapSlots(root) {
  root.innerHTML = template;

  const container = root.querySelector('#listContainer');
  const statsEl = root.querySelector('#stats');
  const list = generateList(1000);

  const virtList = new VirtListDOM(
    container,
    {
      list,
      itemKey: 'id',
      minSize: 40,
      buffer: 2,
      stickyHeaderStyle: 'background:#2e8b57;height:50px;',
      renderStickyHeader: () => createSlotEl('Sticky Header（固定头部）'),
      renderHeader: () =>
        createSlotEl('Header（头部）', {
          background: '#3cb371',
          height: '40px',
        }),
      renderFooter: () =>
        createSlotEl('Footer（尾部）', {
          background: '#20b2aa',
          height: '40px',
        }),
      stickyFooterStyle: 'background:#008b8b;height:50px;',
      renderStickyFooter: () => createSlotEl('Sticky Footer（固定底部）'),
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

  statsEl.textContent = `总数: ${list.length} | 含 Sticky/Header/Footer 插槽`;

  return () => {
    virtList.destroy();
    root.innerHTML = '';
  };
}
