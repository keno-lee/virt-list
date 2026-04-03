import { VirtListDOM } from '@virt-list/dom';

let uid = 0;

function generateList(count, startIndex = 0, delay = 0) {
  const items = Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i;
    return { id: uid++, index: idx, text: `无限加载行 ${idx}` };
  });
  if (delay <= 0) return Promise.resolve(items);
  return new Promise((resolve) => setTimeout(() => resolve(items), delay));
}

const template = `
  <div class="demo-panel">
    <div id="stats" class="demo-stats"></div>
    <div class="demo-list-container" id="listContainer"></div>
  </div>
`;

export function bootstrapInfinity(root) {
  root.innerHTML = template;

  const container = root.querySelector('#listContainer');
  const statsEl = root.querySelector('#stats');

  let list = [];
  let loading = false;
  let virtList = null;

  function updateStats(begin, end) {
    statsEl.textContent = `总数: ${list.length} | RenderBegin: ${begin ?? '-'} | RenderEnd: ${end ?? '-'}${loading ? ' | 加载中...' : ''}`;
  }

  async function loadMore() {
    if (loading) return;
    loading = true;
    updateStats();
    const newItems = await generateList(200, list.length, 1000);
    list = list.concat(newItems);
    loading = false;

    if (!virtList) {
      virtList = new VirtListDOM(
        container,
        {
          list,
          itemKey: 'id',
          minSize: 40,
          buffer: 2,
          renderFooter: () => {
            const el = document.createElement('div');
            el.className = 'demo-loading-bar';
            el.id = 'loadingBar';
            el.textContent = '加载中...';
            return el;
          },
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
          toBottom: () => loadMore(),
          rangeUpdate: (begin, end) => updateStats(begin, end),
        },
      );
    } else {
      virtList.setList(list);
      virtList.forceUpdate();
    }
    updateStats();
  }

  loadMore();

  return () => {
    if (virtList) virtList.destroy();
    root.innerHTML = '';
  };
}
