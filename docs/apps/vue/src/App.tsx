import { defineComponent } from 'vue';
import Literal from './components/Literal.vue';
import Widget from './components/Widget.vue';

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
      'literal': () => <Literal />,
      'widget': () => <Widget />,
    };

    const renderCurrentDemo = () => {
      const renderer =
        demoRenderMap[props.exampleId as keyof typeof demoRenderMap] ?? demoRenderMap['literal'];
      return renderer();
    };

    return () => (
      renderCurrentDemo()
    );
  },
});
