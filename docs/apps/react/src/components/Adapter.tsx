import { faker } from '@faker-js/faker';
import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { VirtList } from '@virt-list/js';

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
  const rowRootMapRef = useRef<Map<number, { root: Root; el: HTMLElement }>>(new Map());

  const cleanupRowRoots = () => {
    rowRootMapRef.current.forEach(({ root }) => root.unmount());
    rowRootMapRef.current.clear();
  };

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

  const reactAdapter = (RowComponent: React.ComponentType<AdapterItemProps>) => {
    return (item: DemoItem): HTMLElement => {
      const cached = rowRootMapRef.current.get(item.id);
      if (cached) {
        cached.root.render(<RowComponent item={item} />);
        return cached.el;
      }

      const row = document.createElement('div');
      const rowRoot = createRoot(row);
      rowRoot.render(<RowComponent item={item} />);
      rowRootMapRef.current.set(item.id, { root: rowRoot, el: row });
      return row;
    };
  };

  useEffect(() => {
    const container = containerRef.current;

    const initVirtList = () => {
      if (!container) return;

      cleanupRowRoots();
      if (virtListRef.current) {
        container.innerHTML = '';
      }

      const instance = new VirtList(container, {
        itemKey: 'id',
        itemPreSize: 50,
        itemRender: reactAdapter(Item),
      });

      instance.init(generateData());
      virtListRef.current = instance;
    };

    initVirtList();

    return () => {
      cleanupRowRoots();
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
