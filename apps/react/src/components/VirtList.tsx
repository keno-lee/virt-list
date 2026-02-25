import { useMemo, useState } from 'react';

function VirtList() {
  const [scrollTop, setScrollTop] = useState(0);
  const listData = useMemo(
    () => Array.from({ length: 1000 }, (_, index) => `React Item #${index + 1}`),
    [],
  );
  const itemHeight = 36;
  const viewportHeight = 500;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(
    listData.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + 2,
  );
  const visibleItems = listData.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: viewportHeight, overflowY: 'auto', border: '1px solid #e5e6eb' }}
      onScroll={(event) => {
        setScrollTop((event.currentTarget as HTMLDivElement).scrollTop);
      }}
    >
      <div style={{ height: listData.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item) => (
            <div
              key={item}
              style={{
                height: itemHeight,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                borderBottom: '1px solid #f2f3f5',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtList;
