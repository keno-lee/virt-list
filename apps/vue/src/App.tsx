import { defaultExampleId } from '@shared/examples';
import { defineComponent } from 'vue';
import Button from './components/Button';
import Form from './components/Form';
import VirtList from './components/VirtList';

type FrameworkKind = 'react' | 'vue';

export default defineComponent({
  name: 'VueTsxDemo',
  props: {
    exampleId: {
      type: String,
      default: defaultExampleId,
    },
    onEvent: {
      type: Function as unknown as () => ((payload: { framework: FrameworkKind; message: string }) => void) | undefined,
      default: undefined,
    },
  },
  setup(props) {
    const demoRenderMap = {
      button: () => (
        <Button onEvent={(message: string) => props.onEvent?.({ framework: 'vue', message })} />
      ),
      form: () => (
        <Form onEvent={(message: string) => props.onEvent?.({ framework: 'vue', message })} />
      ),
      'virt-list': () => <VirtList />,
    };

    const renderCurrentDemo = () => {
      const renderer =
        demoRenderMap[props.exampleId as keyof typeof demoRenderMap] ?? demoRenderMap['virt-list'];
      return renderer();
    };

    return () => (
      renderCurrentDemo()
    );
  },
});
