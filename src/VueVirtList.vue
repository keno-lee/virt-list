<template>
  <div class="vue-virt-list">
    <!-- 控制面板 -->
    <div class="controls">
      <div class="control-group">
        <label>数据控制</label>
        <div class="button-group">
          <button @click="addItems" class="primary">添加1000条数据</button>
          <button @click="clearItems">清空数据</button>
          <button @click="resetList">重置列表</button>
        </div>
      </div>
      
      <div class="control-group">
        <label>滚动控制</label>
        <div class="button-group">
          <button @click="scrollToTop">滚动到顶部</button>
          <button @click="scrollToBottom">滚动到底部</button>
          <button @click="scrollToIndex(100)">滚动到第100项</button>
          <button @click="scrollToIndex(500)">滚动到第500项</button>
        </div>
      </div>
      
      <div class="control-group">
        <label>其他操作</label>
        <div class="button-group">
          <button @click="forceUpdate">强制更新</button>
          <button @click="toggleCustomRender">
            {{ useCustomRender ? '使用默认渲染' : '使用自定义渲染' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 虚拟列表容器 -->
    <div 
      ref="virtListContainer" 
      class="virt-list-container"
      :style="{ height: containerHeight + 'px' }"
    ></div>
    
    <!-- 状态信息 -->
    <div class="status">
      <h3>状态信息</h3>
      <div class="status-item">
        <span class="status-label">总数据量:</span>
        <span class="status-value">{{ items.length }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">可视范围:</span>
        <span class="status-value">{{ visibleRange.begin }} - {{ visibleRange.end }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">渲染范围:</span>
        <span class="status-value">{{ renderRange.begin }} - {{ renderRange.end }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">滚动偏移:</span>
        <span class="status-value">{{ reactiveData.offset }}px</span>
      </div>
      <div class="status-item">
        <span class="status-label">列表总高度:</span>
        <span class="status-value">{{ reactiveData.listTotalSize }}px</span>
      </div>
      <div class="status-item">
        <span class="status-label">选中项:</span>
        <span class="status-value">{{ selectedItem ? `ID: ${selectedItem.id}` : '无' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { VueVirtListWrapper, type VirtListProps, type ListItem, type ReactiveData } from './vue-wrapper';

// Props定义
interface Props {
  items?: ListItem[];
  containerHeight?: number;
  itemKey?: string;
  minSize?: number;
  itemGap?: number;
  horizontal?: boolean;
  scrollDistance?: number;
  start?: number;
  fixSelection?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  containerHeight: 400,
  itemKey: 'id',
  minSize: 60,
  itemGap: 2,
  horizontal: false,
  scrollDistance: 0,
  start: 0,
  fixSelection: false,
});

// Emits定义
const emit = defineEmits<{
  scroll: [offset: number];
  scrollToTop: [];
  scrollToBottom: [];
  rangeUpdate: [begin: number, end: number];
  itemClick: [item: ListItem, index: number];
  itemResize: [itemKey: string | number, size: number];
  listUpdate: [data: ReactiveData];
}>();

// 响应式数据
const virtListContainer = ref<HTMLElement | null>(null);
const virtListWrapper = ref<VueVirtListWrapper | null>(null);
const items = ref<ListItem[]>([...props.items]);
const reactiveData = ref<ReactiveData>({
  views: 0,
  offset: 0,
  listTotalSize: 0,
  virtualSize: 0,
  inViewBegin: 0,
  inViewEnd: 0,
  renderBegin: 0,
  renderEnd: 0,
  bufferTop: 0,
  bufferBottom: 0,
});
const selectedItem = ref<ListItem | null>(null);
const useCustomRender = ref(false);

// 计算属性
const visibleRange = computed(() => ({
  begin: reactiveData.value.inViewBegin,
  end: reactiveData.value.inViewEnd,
}));

const renderRange = computed(() => ({
  begin: reactiveData.value.renderBegin,
  end: reactiveData.value.renderEnd,
}));

// 生成测试数据
const generateItems = (count: number): ListItem[] => {
  const newItems: ListItem[] = [];
  for (let i = 0; i < count; i++) {
    newItems.push({
      id: i,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      content: `这是第 ${i} 项内容，包含一些较长的文本来测试虚拟列表的渲染效果。`,
    });
  }
  return newItems;
};

// 自定义渲染函数
const customRenderItem = (item: ListItem, index: number): string => {
  return `
    <div class="item-content">
      <div class="item-avatar">${item.id}</div>
      <div class="item-info">
        <div class="item-id">项目 #${item.id}</div>
        <div class="item-text">${item.content}</div>
      </div>
    </div>
  `;
};

// 事件处理器
const onScroll = (offset: number) => {
  emit('scroll', offset);
};

const onScrollToTop = () => {
  emit('scrollToTop');
};

const onScrollToBottom = () => {
  emit('scrollToBottom');
};

const onRangeUpdate = (begin: number, end: number) => {
  emit('rangeUpdate', begin, end);
};

const onItemClick = (item: ListItem, index: number) => {
  selectedItem.value = item;
  emit('itemClick', item, index);
};

const onItemResize = (itemKey: string | number, size: number) => {
  emit('itemResize', itemKey, size);
};

const onListUpdate = (data: ReactiveData) => {
  reactiveData.value = { ...data };
  emit('listUpdate', data);
};

// 方法
const addItems = () => {
  const newItems = generateItems(1000);
  items.value = [...items.value, ...newItems];
  if (virtListWrapper.value) {
    virtListWrapper.value.updateItems(items.value);
  }
};

const clearItems = () => {
  items.value = [];
  selectedItem.value = null;
  if (virtListWrapper.value) {
    virtListWrapper.value.updateItems([]);
  }
};

const resetList = () => {
  if (virtListWrapper.value) {
    virtListWrapper.value.reset();
  }
};

const scrollToTop = () => {
  if (virtListWrapper.value) {
    virtListWrapper.value.scrollToTop();
  }
};

const scrollToBottom = () => {
  if (virtListWrapper.value) {
    virtListWrapper.value.scrollToBottom();
  }
};

const scrollToIndex = (index: number) => {
  if (virtListWrapper.value) {
    virtListWrapper.value.scrollToIndex(index);
  }
};

const forceUpdate = () => {
  if (virtListWrapper.value) {
    virtListWrapper.value.forceUpdate();
  }
};

const toggleCustomRender = () => {
  useCustomRender.value = !useCustomRender.value;
  initVirtList();
};

// 初始化虚拟列表
const initVirtList = () => {
  if (!virtListContainer.value) return;
  
  // 销毁旧的实例
  if (virtListWrapper.value) {
    virtListWrapper.value.destroy();
  }
  
  // 创建新的实例
  const props: VirtListProps = {
    items: items.value,
    options: {
      itemKey: props.itemKey,
      minSize: props.minSize,
      itemGap: props.itemGap,
      horizontal: props.horizontal,
      scrollDistance: props.scrollDistance,
      start: props.start,
      fixSelection: props.fixSelection,
    },
    renderItem: useCustomRender.value ? customRenderItem : undefined,
    onScroll,
    onScrollToTop,
    onScrollToBottom,
    onRangeUpdate,
    onItemClick,
    onItemResize,
    onListUpdate,
  };
  
  virtListWrapper.value = new VueVirtListWrapper(virtListContainer.value, props);
};

// 监听props变化
watch(() => props.items, (newItems) => {
  items.value = [...newItems];
  if (virtListWrapper.value) {
    virtListWrapper.value.updateItems(items.value);
  }
}, { deep: true });

// 生命周期
onMounted(() => {
  // 如果没有传入items，生成默认数据
  if (items.value.length === 0) {
    items.value = generateItems(100);
  }
  initVirtList();
});

onUnmounted(() => {
  if (virtListWrapper.value) {
    virtListWrapper.value.destroy();
  }
});

// 暴露方法给父组件
defineExpose({
  addItems,
  clearItems,
  resetList,
  scrollToTop,
  scrollToBottom,
  scrollToIndex,
  forceUpdate,
  getReactiveData: () => reactiveData.value,
  getRenderRange: () => renderRange.value,
  getVisibleRange: () => visibleRange.value,
});
</script>

<style scoped>
.vue-virt-list {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.controls {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #495057;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

button:hover {
  background: #f0f0f0;
}

button.primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

button.primary:hover {
  background: #0056b3;
}

.virt-list-container {
  overflow-y: auto;
  position: relative;
  border-bottom: 1px solid #dee2e6;
}

.status {
  padding: 20px;
  background: #f8f9fa;
}

.status h3 {
  margin: 0 0 15px 0;
  color: #495057;
}

.status-item {
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 12px;
}

.status-label {
  font-weight: bold;
  color: #495057;
}

.status-value {
  color: #007bff;
}
</style>
