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
import {
  createApp,
  onMounted,
  onUnmounted,
  ref,
  type App as VueApp,
  type Component,
} from 'vue';
import { VirtList } from '@virt-list/js';
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
let rowApps: VueApp[] = [];

const cleanupRowApps = () => {
  for (const app of rowApps) {
    app.unmount();
  }
  rowApps = [];
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

const vueAdapter = (RowComponent: Component<AdapterItemProps>) => {
  return (item: DemoItem): HTMLElement => {
    const row = document.createElement('div');
    const rowApp = createApp(RowComponent, { item });
    rowApp.mount(row);
    rowApps.push(rowApp);
    return row;
  };
};

const initVirtList = (): void => {
  if (!container.value) return;

  cleanupRowApps();
  if (virtList) {
    container.value.innerHTML = '';
  }

  virtList = new VirtList(container.value, {
    itemKey: 'id',
    itemPreSize: 50,
    itemRender: vueAdapter(Item as Component<AdapterItemProps>),
  });

  virtList.init(generateData());
};

onMounted(() => {
  initVirtList();
});

onUnmounted(() => {
  cleanupRowApps();
  if (virtList && container.value) {
    container.value.innerHTML = '';
  }
});
</script>
