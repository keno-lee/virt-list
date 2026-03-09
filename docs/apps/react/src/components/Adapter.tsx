import { faker } from '@faker-js/faker';
import { useEffect, useRef } from 'react';
import { createElement } from 'react';
import { VirtList, reactAdapter } from '@virt-list/js';
import { createRoot } from 'react-dom/client';

interface DemoItem {
  id: number;
  content: string;
}

interface AdapterItemProps {
  item: DemoItem;
}

function Item({ item }: AdapterItemProps) {
  return (
    <div style={{ padding: '4px' }}>
      <div style={{ fontWeight: 'bold' }}>Item {item.id}</div>
      <div style={{ color: '#666', fontSize: '12px' }}>{item.content}</div>
      <div style={{ color: '#999', fontSize: '10px' }}>Key: {item.id} (React Adapter)</div>
    </div>
  );
}

function Adapter() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const virtListRef = useRef<InstanceType<typeof VirtList> | null>(null);
  const adapterRef = useRef(
    reactAdapter<DemoItem, AdapterItemProps>(Item, (item) => ({ item }), {
      createRoot,
      createElement,
    }),
  );

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
    const container = containerRef.current;
    const adapter = adapterRef.current;

    const initVirtList = () => {
      if (!container) return;

      adapter.cleanup();
      if (virtListRef.current) {
        container.innerHTML = '';
      }

      const instance = new VirtList(container, {
        itemKey: 'id',
        itemPreSize: 50,
        itemRender: adapter.itemRender,
      });

      instance.init(generateData());
      virtListRef.current = instance;
    };

    initVirtList();

    return () => {
      adapter.cleanup();
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

export default Adapter;
