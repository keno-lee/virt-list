import { defineComponent, ref, onMounted, onBeforeUnmount, h } from 'vue-demi';

export const ObserverItem = defineComponent({
  name: 'ObserverItem',
  props: {
    id: { type: [String, Number], required: true },
    resizeObserver: { type: Object, default: undefined },
  },
  setup(props, { slots }) {
    const elRef = ref<HTMLElement | null>(null);

    onMounted(() => {
      if (elRef.value && props.resizeObserver) {
        (props.resizeObserver as ResizeObserver).observe(elRef.value);
      }
    });

    onBeforeUnmount(() => {
      if (elRef.value && props.resizeObserver) {
        (props.resizeObserver as ResizeObserver).unobserve(elRef.value);
      }
    });

    return () =>
      h(
        'div',
        { ref: elRef, 'data-id': String(props.id) },
        slots.default?.(),
      );
  },
});
