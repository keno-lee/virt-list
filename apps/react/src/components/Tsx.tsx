import { useCallback, useEffect, useRef } from 'react';
import { VirtList } from '@virt-list/js';

interface DemoItem {
  id: number;
  avatar: string;
  content: string;
}

function Tsx() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const virtListRef = useRef<InstanceType<typeof VirtList> | null>(null);

  const generateRandomText = useCallback((): string => {
    const texts = [
      '这是一段很长的文本内容，用来测试虚拟列表的渲染效果。',
      '虚拟列表可以处理大量数据而不会影响性能。',
      '每个项目都有不同的高度，这样可以更好地测试滚动效果。',
      '滚动时只有可见的项目会被渲染到DOM中。',
      '这样可以大大提高页面的性能和响应速度。',
    ];
    return texts[Math.floor(Math.random() * texts.length)] ?? texts[0];
  }, []);

  const generateData = useCallback((): DemoItem[] => {
    const data: DemoItem[] = [];
    for (let i = 0; i < 100; i += 1) {
      data.push({
        id: i,
        avatar: '',
        content: `这是第 ${i} 项内容。${generateRandomText()}`,
      });
    }
    return data;
  }, [generateRandomText]);

  const createSlots = useCallback(() => {
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
  }, []);

  const initVirtList = useCallback((): void => {
    const container = containerRef.current;
    if (!container) return;

    if (virtListRef.current) {
      container.innerHTML = '';
    }

    const slots = createSlots();
    const instance = new VirtList(container, {
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
      scroll: () => {},
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

    instance.init(generateData());
    virtListRef.current = instance;
  }, [createSlots, generateData]);

  const scrollToTop = () => {
    virtListRef.current?.scrollToTop();
  };

  const scrollToBottom = () => {
    virtListRef.current?.scrollToBottom();
  };

  const scrollToIndex = (index: number) => {
    virtListRef.current?.scrollToIndex(index);
  };

  const regenerateData = () => {
    if (!virtListRef.current) return;
    virtListRef.current.init(generateData());
  };

  useEffect(() => {
    initVirtList();
    const container = containerRef.current;
    return () => {
      if (virtListRef.current && container) {
        container.innerHTML = '';
      }
      virtListRef.current = null;
    };
  }, [initVirtList]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h3 style={{ marginBottom: 15, color: '#2c3e50' }}>VirtList Demo</h3>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={scrollToTop}>滚动到顶部</button>
          <button onClick={scrollToBottom}>滚动到底部</button>
          <button onClick={() => scrollToIndex(50)}>滚动到第50项</button>
          <button onClick={regenerateData}>重新生成数据</button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          width: 400,
          height: 600,
          border: '1px solid #000',
          margin: '20px auto',
        }}
      />

      <div style={{ marginTop: 20, padding: 15, background: '#f8f9fa', borderRadius: 8 }}>
        <p>
          <strong>功能演示：</strong>
        </p>
        <ul style={{ margin: '10px 0', paddingLeft: 20 }}>
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
}

export default Tsx;
