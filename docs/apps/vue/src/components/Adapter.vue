<template>
  <div style="max-width: 800px; margin: 0 auto; padding: 20px">
    <div
      ref="container"
      style="
        width: 400px;
        height: 600px;
        border: 1px solid #000;
        margin: 20px auto;
      "
    />
  </div>
</template>

<script setup lang="ts">
import { faker } from '@faker-js/faker';
import { createApp, onMounted, onUnmounted, ref } from 'vue';
import { VirtList, vueAdapter } from '@virt-list/js';
import Item from './Item.vue';

interface DemoItem {
  id: number;
  content: string;
}

interface AdapterItemProps {
  item: DemoItem;
}

const container = ref<HTMLElement | null>(null);
let virtList: InstanceType<typeof VirtList> | null = null;
const adapter = vueAdapter<DemoItem, AdapterItemProps, typeof Item>(
  Item,
  (item) => ({ item }),
  { createApp },
);

const data = ref<DemoItem[]>([]);

const generateData = () => {
  for (let i = 0; i < 10000; i += 1) {
    data.value.push({
      id: i,
      content: faker.lorem.paragraph(),
    });
  }
};

generateData();

const initVirtList = (): void => {
  if (!container.value) return;

  adapter.cleanup();
  if (virtList) {
    container.value.innerHTML = '';
  }

  virtList = new VirtList(container.value, {
    itemKey: 'id',
    itemPreSize: 50,
    itemRender: adapter.itemRender,
    onItemUnmounted: adapter.onItemUnmounted,
  });

  virtList.init(data.value);
};

onMounted(() => {
  setTimeout(() => {
    data.value[0]!.content = '22222';
  }, 2000);
  initVirtList();
});

onUnmounted(() => {
  adapter.cleanup();
  if (virtList && container.value) {
    container.value.innerHTML = '';
  }
});
</script>
