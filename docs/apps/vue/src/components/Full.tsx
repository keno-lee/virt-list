import {
  createApp,
  type Component,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  type App as VueApp,
  type Ref,
} from 'vue';
import { VirtListDOM } from '@virt-list/dom';
import Item from './Item.vue';

interface DemoItem {
  id: number;
  avatar: string;
  content: string;
}

interface AdapterItemProps {
  item: DemoItem;
  tick: Ref<number>;
}

export default defineComponent({
  name: 'VueAdapterDemo',
  setup() {
    const container = ref<HTMLElement | null>(null);
    const tick = ref(0);
    let tickTimer: ReturnType<typeof setInterval> | null = null;
    let virtList: VirtListDOM<DemoItem> | null = null;
    let rowApps: VueApp[] = [];

    const cleanupRowApps = () => {
      for (const app of rowApps) {
        app.unmount();
      }
      rowApps = [];
    };

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

    const vueAdapter = (RowComponent: Component<AdapterItemProps>) => {
      return (item: DemoItem): HTMLElement => {
        const row = document.createElement('div');
        row.className = 'virt-item';
        row.style.backgroundColor = `hsl(${(item.id * 13) % 360} 75% 95%)`;

        const rowApp = createApp(RowComponent, {
          item,
          tick,
        });

        rowApp.mount(row);
        rowApps.push(rowApp);
        return row;
      };
    };

    const renderItem = vueAdapter(Item as Component<AdapterItemProps>);

    const initVirtList = (): void => {
      if (!container.value) return;

      cleanupRowApps();
      if (virtList) {
        virtList.destroy();
      }

      const renderStickyHeader = (): HTMLElement => {
        const el = document.createElement('div');
        el.innerHTML = '粘性头部';
        el.style.backgroundColor = 'cyan';
        el.style.padding = '10px';
        el.style.textAlign = 'center';
        el.style.fontWeight = 'bold';
        return el;
      };

      const renderHeader = (): HTMLElement => {
        const el = document.createElement('div');
        el.innerHTML = '普通头部';
        el.style.backgroundColor = 'fuchsia';
        el.style.padding = '10px';
        el.style.textAlign = 'center';
        el.style.color = 'white';
        return el;
      };

      const renderFooter = (): HTMLElement => {
        const el = document.createElement('div');
        el.innerHTML = '普通底部';
        el.style.backgroundColor = 'fuchsia';
        el.style.padding = '10px';
        el.style.textAlign = 'center';
        el.style.color = 'white';
        return el;
      };

      const renderStickyFooter = (): HTMLElement => {
        const el = document.createElement('div');
        el.innerHTML = '粘性底部';
        el.style.backgroundColor = 'cyan';
        el.style.padding = '10px';
        el.style.textAlign = 'center';
        el.style.fontWeight = 'bold';
        return el;
      };

      virtList = new VirtListDOM(container.value, {
        list: generateData(),
        itemKey: 'id',
        itemGap: 2,
        minSize: 50,
        renderItem,
        renderStickyHeader,
        renderHeader,
        renderFooter,
        renderStickyFooter,
      }, {
        toTop: (firstItem) => {
          console.log('到达顶部', firstItem);
        },
        toBottom: (lastItem) => {
          console.log('到达底部', lastItem);
        },
        rangeUpdate: (begin, end) => {
          console.log('渲染范围更新', begin, end);
        },
      });
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
      if (!virtList) return;
      cleanupRowApps();
      virtList.setList(generateData());
    };

    onMounted(() => {
      tickTimer = setInterval(() => {
        tick.value += 1;
      }, 1000);
      initVirtList();
    });

    onUnmounted(() => {
      if (tickTimer) {
        clearInterval(tickTimer);
      }
      cleanupRowApps();
      if (virtList) {
        virtList.destroy();
        virtList = null;
      }
    });

    return () => (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>
            VirtList Demo (Vue Adapter)
          </h3>
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
            <li style={{ margin: '5px 0' }}>✅ renderItem 返回 Vue 应用</li>
            <li style={{ margin: '5px 0' }}>✅ Tick 计数证明响应式更新</li>
            <li style={{ margin: '5px 0' }}>✅ 行内 Likes 按钮局部响应式</li>
            <li style={{ margin: '5px 0' }}>✅ 虚拟列表 (100项数据)</li>
          </ul>
        </div>
      </div>
    );
  },
});
