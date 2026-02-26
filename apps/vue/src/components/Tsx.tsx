import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { VirtList } from '@virt-list/js';

interface DemoItem {
  id: number;
  avatar: string;
  content: string;
}

export default defineComponent({
  name: 'TsxDemo',
  setup() {
    const container = ref<HTMLElement | null>(null);
    let virtList: InstanceType<typeof VirtList> | null = null;

    const generateRandomText = (): string => {
      const texts: [string, ...string[]] = [
        '这是一段很长的文本内容，用来测试虚拟列表的渲染效果。',
        '虚拟列表可以处理大量数据而不会影响性能。',
        '每个项目都有不同的高度，这样可以更好地测试滚动效果。',
        '滚动时只有可见的项目会被渲染到DOM中。',
        '这样可以大大提高页面的性能和响应速度。',
      ];
      return texts[Math.floor(Math.random() * texts.length)] ?? texts[0];
    };

    const generateData = (): DemoItem[] => {
      const data: DemoItem[] = [];
      for (let i = 0; i < 100; i += 1) {
        data.push({
          id: i,
          avatar: '',
          content: `这是第 ${i} 项内容。${generateRandomText()}`,
        });
      }
      return data;
    };

    const createSlots = (): {
      slotStickyHeader: HTMLDivElement;
      slotHeader: HTMLDivElement;
      slotFooter: HTMLDivElement;
      slotStickyFooter: HTMLDivElement;
    } => {
      const slotStickyHeader = document.createElement('div');
      slotStickyHeader.innerHTML = '粘性头部';
      slotStickyHeader.style.backgroundColor = 'cyan';
      slotStickyHeader.style.padding = '10px';
      slotStickyHeader.style.textAlign = 'center';
      slotStickyHeader.style.fontWeight = 'bold';

      const slotHeader = document.createElement('div');
      slotHeader.innerHTML = '普通头部';
      slotHeader.style.backgroundColor = 'fuchsia';
      slotHeader.style.padding = '10px';
      slotHeader.style.textAlign = 'center';
      slotHeader.style.color = 'white';

      const slotFooter = document.createElement('div');
      slotFooter.innerHTML = '普通底部';
      slotFooter.style.backgroundColor = 'fuchsia';
      slotFooter.style.padding = '10px';
      slotFooter.style.textAlign = 'center';
      slotFooter.style.color = 'white';

      const slotStickyFooter = document.createElement('div');
      slotStickyFooter.innerHTML = '粘性底部';
      slotStickyFooter.style.backgroundColor = 'cyan';
      slotStickyFooter.style.padding = '10px';
      slotStickyFooter.style.textAlign = 'center';
      slotStickyFooter.style.fontWeight = 'bold';

      return {
        slotStickyHeader,
        slotHeader,
        slotFooter,
        slotStickyFooter,
      };
    };

    const initVirtList = (): void => {
      if (!container.value) return;

      if (virtList) {
        container.value.innerHTML = '';
      }

      const slots = createSlots();

      virtList = new VirtList(container.value, {
        itemKey: 'id',
        itemGap: 2,
        itemPreSize: 50,
        slotStickyHeader: slots.slotStickyHeader,
        slotHeader: slots.slotHeader,
        slotFooter: slots.slotFooter,
        slotStickyFooter: slots.slotStickyFooter,
        itemRender: (item: DemoItem): HTMLElement => {
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
        scroll: (_e: Event) => {
          // console.log('滚动事件', e)
        },
        toTop: (firstItem: DemoItem | undefined) => {
          console.log('到达顶部', firstItem);
        },
        toBottom: (lastItem: DemoItem | undefined) => {
          console.log('到达底部', lastItem);
        },
        rangeUpdate: (begin: number, end: number) => {
          console.log('渲染范围更新', begin, end);
        },
      });

      virtList.init(generateData());
    };

    const scrollToTop = (): void => {
      virtList?.scrollToTop();
    };

    const scrollToBottom = (): void => {
      virtList?.scrollToBottom();
    };

    const scrollToIndex = (index: number): void => {
      virtList?.scrollToIndex(index);
    };

    const regenerateData = (): void => {
      if (virtList) {
        virtList.init(generateData());
      }
    };

    onMounted(() => {
      initVirtList();
    });

    onUnmounted(() => {
      if (virtList && container.value) {
        container.value.innerHTML = '';
      }
    });

    return () => (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>VirtList Demo</h3>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button onClick={scrollToTop}>滚动到顶部</button>
            <button onClick={scrollToBottom}>滚动到底部</button>
            <button onClick={() => scrollToIndex(50)}>滚动到第50项</button>
            <button onClick={regenerateData}>重新生成数据</button>
          </div>
        </div>

        <div
          ref={container}
          style={{
            width: '400px',
            height: '600px',
            border: '1px solid #000',
            margin: '20px auto',
          }}
        />

        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <p>
            <strong>功能演示：</strong>
          </p>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li style={{ margin: '5px 0' }}>✅ 粘性头部 (青色)</li>
            <li style={{ margin: '5px 0' }}>✅ 普通头部 (紫红色)</li>
            <li style={{ margin: '5px 0' }}>✅ 普通底部 (紫红色)</li>
            <li style={{ margin: '5px 0' }}>✅ 粘性底部 (青色)</li>
            <li style={{ margin: '5px 0' }}>✅ 虚拟列表 (100项数据)</li>
            <li style={{ margin: '5px 0' }}>✅ 动态内容生成</li>
          </ul>
        </div>
      </div>
    );
  },
});
