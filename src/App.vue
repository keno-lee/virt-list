<template>
  <div class="app">
    <h1>Vue虚拟列表组件使用示例</h1>
    
    <!-- 使用VueVirtList组件 -->
    <VueVirtList
      ref="virtListRef"
      :items="listItems"
      :container-height="500"
      :min-size="80"
      :item-gap="4"
      @scroll="handleScroll"
      @scroll-to-top="handleScrollToTop"
      @scroll-to-bottom="handleScrollToBottom"
      @range-update="handleRangeUpdate"
      @item-click="handleItemClick"
      @item-resize="handleItemResize"
      @list-update="handleListUpdate"
    />
    
    <!-- 外部控制按钮 -->
    <div class="external-controls">
      <h3>外部控制</h3>
      <div class="button-group">
        <button @click="addMoreItems">添加更多数据</button>
        <button @click="scrollToSpecificIndex">滚动到特定位置</button>
        <button @click="getCurrentState">获取当前状态</button>
        <button @click="clearAllItems">清空所有数据</button>
      </div>
    </div>
    
    <!-- 事件日志 -->
    <div class="event-log">
      <h3>事件日志</h3>
      <div class="log-container">
        <div 
          v-for="(log, index) in eventLogs" 
          :key="index" 
          class="log-item"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-event">{{ log.event }}</span>
          <span class="log-data">{{ log.data }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import VueVirtList from './VueVirtList.vue';
import type { ListItem, ReactiveData } from './vue-wrapper';

// 组件引用
const virtListRef = ref<InstanceType<typeof VueVirtList> | null>(null);

// 数据
const listItems = ref<ListItem[]>([]);
const eventLogs = ref<Array<{ time: string; event: string; data: string }>>([]);

// 生成测试数据
const generateItems = (count: number, startId: number = 0): ListItem[] => {
  const items: ListItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: startId + i,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${startId + i}`,
      content: `这是第 ${startId + i} 项内容，包含一些较长的文本来测试虚拟列表的渲染效果。时间戳: ${new Date().toLocaleTimeString()}`,
    });
  }
  return items;
};

// 添加日志
const addLog = (event: string, data: any) => {
  eventLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    event,
    data: JSON.stringify(data),
  });
  
  // 限制日志数量
  if (eventLogs.value.length > 50) {
    eventLogs.value = eventLogs.value.slice(0, 50);
  }
};

// 事件处理器
const handleScroll = (offset: number) => {
  addLog('scroll', { offset });
};

const handleScrollToTop = () => {
  addLog('scrollToTop', {});
};

const handleScrollToBottom = () => {
  addLog('scrollToBottom', {});
};

const handleRangeUpdate = (begin: number, end: number) => {
  addLog('rangeUpdate', { begin, end });
};

const handleItemClick = (item: ListItem, index: number) => {
  addLog('itemClick', { itemId: item.id, index });
};

const handleItemResize = (itemKey: string | number, size: number) => {
  addLog('itemResize', { itemKey, size });
};

const handleListUpdate = (data: ReactiveData) => {
  addLog('listUpdate', {
    views: data.views,
    offset: data.offset,
    listTotalSize: data.listTotalSize,
    inViewBegin: data.inViewBegin,
    inViewEnd: data.inViewEnd,
  });
};

// 外部控制方法
const addMoreItems = () => {
  const currentLength = listItems.value.length;
  const newItems = generateItems(500, currentLength);
  listItems.value = [...listItems.value, ...newItems];
  addLog('addMoreItems', { added: 500, total: listItems.value.length });
};

const scrollToSpecificIndex = () => {
  if (virtListRef.value) {
    const randomIndex = Math.floor(Math.random() * Math.min(listItems.value.length, 1000));
    virtListRef.value.scrollToIndex(randomIndex);
    addLog('scrollToSpecificIndex', { index: randomIndex });
  }
};

const getCurrentState = () => {
  if (virtListRef.value) {
    const state = virtListRef.value.getReactiveData();
    const renderRange = virtListRef.value.getRenderRange();
    const visibleRange = virtListRef.value.getVisibleRange();
    
    addLog('getCurrentState', {
      state,
      renderRange,
      visibleRange,
    });
  }
};

const clearAllItems = () => {
  listItems.value = [];
  addLog('clearAllItems', {});
};

// 初始化
onMounted(() => {
  // 生成初始数据
  listItems.value = generateItems(2000);
  addLog('initialized', { itemsCount: listItems.value.length });
});
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.external-controls {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.external-controls h3 {
  margin: 0 0 15px 0;
  color: #495057;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  padding: 10px 20px;
  border: 1px solid #007bff;
  background: #007bff;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

button:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.event-log {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.event-log h3 {
  margin: 0 0 15px 0;
  color: #495057;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-family: monospace;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  min-width: 80px;
}

.log-event {
  color: #007bff;
  font-weight: bold;
  min-width: 120px;
}

.log-data {
  color: #333;
  flex: 1;
  word-break: break-all;
}
</style>
