import { VirtListDOM } from '@virt-list/dom';

const template = `
  <div class="demo-panel">
    <div class="demo-toolbar">
      <button class="virt-list-btn virt-list-btn-secondary" id="btnLoad">生成 30w 数据</button>
      <span id="loadStatus" style="font-size:12px;color:#666;"></span>
    </div>
    <div id="stats" class="demo-stats"></div>
    <div class="demo-list-container" id="listContainer">
      <div id="emptyHint" style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">
        点击按钮生成海量数据
      </div>
    </div>
  </div>
`;

export function bootstrapHugeData(root) {
  root.innerHTML = template;

  const container = root.querySelector('#listContainer');
  const statsEl = root.querySelector('#stats');
  const btnLoad = root.querySelector('#btnLoad');
  const loadStatus = root.querySelector('#loadStatus');
  const emptyHint = root.querySelector('#emptyHint');

  let virtList = null;

  btnLoad.addEventListener('click', () => {
    btnLoad.disabled = true;
    loadStatus.textContent = '正在生成数据...';
    emptyHint.textContent = '数据生成中...';

    setTimeout(() => {
      const list = [];
      for (let i = 0; i < 300000; i++) {
        list.push({
          id: i,
          index: i,
          text: `Row ${i} - 这是一条海量数据中的记录，用于验证虚拟列表的高性能渲染能力。`,
        });
      }

      emptyHint.remove();
      loadStatus.textContent = `已生成 ${list.length.toLocaleString()} 条数据`;

      virtList = new VirtListDOM(
        container,
        {
          list,
          itemKey: 'id',
          minSize: 40,
          buffer: 5,
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
            statsEl.textContent = `总数: ${list.length.toLocaleString()} | RenderBegin: ${begin} | RenderEnd: ${end}`;
          },
        },
      );

      statsEl.textContent = `总数: ${list.length.toLocaleString()}`;
    }, 50);
  });

  return () => {
    if (virtList) virtList.destroy();
    root.innerHTML = '';
  };
}
