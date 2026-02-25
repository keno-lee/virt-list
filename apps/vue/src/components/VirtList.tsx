import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'VirtList',
  setup() {
    const scrollTop = ref(0);
    const listData = Array.from({ length: 1000 }, (_, index) => `Vue Item #${index + 1}`);
    const itemHeight = 36;
    const viewportHeight = 500;
    const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / itemHeight) - 2));
    const endIndex = computed(() =>
      Math.min(listData.length, Math.ceil((scrollTop.value + viewportHeight) / itemHeight) + 2),
    );
    const visibleItems = computed(() => listData.slice(startIndex.value, endIndex.value));

    const onScrollList = (event: Event) => {
      scrollTop.value = (event.currentTarget as HTMLDivElement).scrollTop;
    };

    return () => (
      <div
        style={{ height: `${viewportHeight}px`, overflowY: 'auto', border: '1px solid #e5e6eb' }}
        onScroll={onScrollList}
      >
        <div style={{ height: `${listData.length * itemHeight}px`, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: `${startIndex.value * itemHeight}px`,
              left: '0',
              right: '0',
            }}
          >
            {visibleItems.value.map((item) => (
              <div
                key={item}
                style={{
                  height: `${itemHeight}px`,
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
  },
});
