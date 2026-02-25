import { Input, Space, TypographyText } from '@arco-design/web-vue';
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'Form',
  props: {
    onEvent: {
      type: Function as unknown as () => ((message: string) => void) | undefined,
      default: undefined,
    },
  },
  setup(props) {
    const text = ref('');

    const onInputValue = (value: string) => {
      text.value = value;
      props.onEvent?.(`输入值变更：${value || '(空)'}`);
    };

    return () => (
      <Space direction="vertical" fill>
        <Input
          modelValue={text.value}
          placeholder="输入任意内容"
          onUpdate:modelValue={(value: string) => onInputValue(value)}
        />
        <TypographyText>{`当前输入：${text.value || '(空)'}`}</TypographyText>
      </Space>
    );
  },
});
