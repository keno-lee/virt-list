import { defineComponent } from 'vue';
import Button from './components/Button';
import Form from './components/Form';
import Tsx from './components/Tsx.tsx';

type FrameworkKind = 'react' | 'vue';

export default defineComponent({
  name: 'VueTsxDemo',
  props: {
    exampleId: {
      type: String,
      default: '',
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
      'tsx': () => <Tsx />,
    };

    const renderCurrentDemo = () => {
      const renderer =
        demoRenderMap[props.exampleId as keyof typeof demoRenderMap] ?? demoRenderMap['tsx'];
      return renderer();
    };

    return () => (
      renderCurrentDemo()
    );
  },
});
