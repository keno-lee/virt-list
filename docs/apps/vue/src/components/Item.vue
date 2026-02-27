<template>
  <div
    style="padding: 4px; border-bottom: 1px solid #eee; box-sizing: border-box"
  >
    <div style="font-weight: bold">Item {{ props.item.id }}</div>
    <div style="color: #666; font-size: 12px">{{ props.item.content }}</div>
    <div style="color: #999; font-size: 10px">
      Key: {{ props.item.id }} (Vue Adapter)
    </div>
  </div>
</template>

<script setup lang="ts">
interface DemoItem {
  id: number;
  content: string;
}

const props = defineProps<{
  item: DemoItem;
}>();
</script>
