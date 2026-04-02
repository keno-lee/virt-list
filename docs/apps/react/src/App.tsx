import '@arco-design/web-react/dist/css/arco.css';
import Literal from './components/Literal.tsx';
import Widget from './components/Widget.tsx';

interface AppProps {
  exampleId?: string;
  onEvent?: (message: string) => void;
}

function App({ exampleId = '' }: AppProps) {
  const demoRenderMap = {
    'literal': () => <Literal />,
    'widget': () => <Widget />,
  };

  const renderCurrentDemo = () => {
    const renderer =
      demoRenderMap[exampleId as keyof typeof demoRenderMap] ?? demoRenderMap['literal'];
    return renderer();
  };

  return (
    renderCurrentDemo()
  );
}

export default App;
