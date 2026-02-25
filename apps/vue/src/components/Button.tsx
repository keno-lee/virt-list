import { Button, Space } from '@arco-design/web-vue';
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'Button',
  props: {
    onEvent: {
      type: Function as unknown as () => ((message: string) => void) | undefined,
      default: undefined,
    },
  },
  setup(props) {
    const count = ref(0);

    const onButtonClick = () => {
      count.value += 1;
      props.onEvent?.(`按钮被点击 ${count.value} 次`);
    };

    return () => (
      <Space direction="vertical">
        <Button type="primary" onClick={onButtonClick}>
          点击计数：{count.value}
        </Button>
      </Space>
    );
  },
});
