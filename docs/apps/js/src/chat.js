import { VirtListDOM } from '@virt-list/dom';

const PAGE_SIZE = 40;

let uid = 0;

function generatePage(page, pageSize) {
  const start = (page - 1) * pageSize;
  return Array.from({ length: pageSize }, (_, i) => {
    const idx = start + i;
    return {
      id: uid++,
      index: idx,
      text: `这是消息 #${idx}，来自聊天记录。翻到顶部可以加载更早的消息。`,
    };
  });
}

function asyncGeneratePage(page, pageSize) {
  return new Promise((resolve) =>
    setTimeout(() => resolve(generatePage(page, pageSize)), 800),
  );
}

const template = `
  <div class="demo-panel">
    <div id="stats" class="demo-stats"></div>
    <div class="demo-list-container" id="listContainer"></div>
  </div>
`;

export function bootstrapChat(root) {
  root.innerHTML = template;

  const container = root.querySelector('#listContainer');
  const statsEl = root.querySelector('#stats');

  let page = 5;
  let list = generatePage(page, PAGE_SIZE);
  let loading = false;
  let firstResize = true;

  const virtList = new VirtListDOM(
    container,
    {
      list,
      itemKey: 'id',
      minSize: 60,
      renderHeader: () => {
        const el = document.createElement('div');
        el.className = 'demo-loading-bar';
        el.id = 'chatLoadingBar';
        el.textContent = page > 1 ? '加载中...' : '没有更早的消息了';
        return el;
      },
      renderItem: (item) => {
        const row = document.createElement('div');
        row.className = 'demo-chat-message';
        row.innerHTML = `
          <div class="demo-chat-bubble">
            <div style="font-weight:bold;margin-bottom:2px;">消息 #${item.index}</div>
            <div>${item.text}</div>
          </div>
        `;
        return row;
      },
    },
    {
      toTop: async () => {
        if (loading || page <= 1) return;
        loading = true;
        statsEl.textContent += ' | 加载中...';
        const prevPage = await asyncGeneratePage(page - 1, PAGE_SIZE);
        page--;
        list = prevPage.concat(list);
        virtList.addedList2Top(prevPage);
        virtList.setList(list);
        virtList.forceUpdate();
        loading = false;
        updateStats();
      },
      itemResize: () => {
        if (firstResize) {
          firstResize = false;
          virtList.scrollToBottom();
        }
      },
      rangeUpdate: (begin, end) => {
        updateStats(begin, end);
      },
    },
  );

  function updateStats(begin, end) {
    statsEl.textContent = `总数: ${list.length} | Page: ${page} | RenderBegin: ${begin ?? '-'} | RenderEnd: ${end ?? '-'}`;
  }

  updateStats();

  return () => {
    virtList.destroy();
    root.innerHTML = '';
  };
}
