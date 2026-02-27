import { faker } from '@faker-js/faker';
import { useEffect, useRef } from 'react';
import { VirtList } from '@virt-list/js';

interface DemoItem {
  id: number;
  content: string;
}

function Literal() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const virtListRef = useRef<InstanceType<typeof VirtList> | null>(null);

  const generateData = (): DemoItem[] => {
    const data: DemoItem[] = [];
    for (let i = 0; i < 100; i += 1) {
      data.push({
        id: i,
        content: faker.lorem.paragraph(),
      });
    }
    return data;
  };

  useEffect(() => {
    const initVirtList = (): void => {
      const container = containerRef.current;
      if (!container) return;

      if (virtListRef.current) {
        container.innerHTML = '';
      }

      const instance = new VirtList(container, {
        itemKey: 'id',
        itemPreSize: 50,
        itemRender: (item: DemoItem): HTMLElement => {
          const row = document.createElement('div');
          row.style.padding = '4px';
          row.innerHTML = `
            <div style="font-weight:bold;">Item ${item.id}</div>
            <div style="color:#666;font-size:12px;">${item.content}</div>
            <div style="color:#999;font-size:10px;">Key: ${item.id} (Pure JS)</div>
          `;
          return row;
        },
      });

      instance.init(generateData());
      virtListRef.current = instance;
    };

    initVirtList();
    const container = containerRef.current;
    return () => {
      if (virtListRef.current && container) {
        container.innerHTML = '';
      }
      virtListRef.current = null;
    };
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div
        ref={containerRef}
        style={{
          width: 400,
          height: 600,
          border: '1px solid #000',
          margin: '20px auto',
        }}
      />
    </div>
  );
}

export default Literal;
