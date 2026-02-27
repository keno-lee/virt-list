// import { Card, Typography } from '@arco-design/web-react';
// import { useMemo } from 'react';
import '@arco-design/web-react/dist/css/arco.css';
import Literal from './components/Literal.tsx';
import Adapter from './components/Adapter.tsx';

interface AppProps {
  exampleId?: string;
  onEvent?: (message: string) => void;
}

function App({ exampleId = '' }: AppProps) {
  // const current = useMemo(
  //   () =>
  //     examples.find((item) => item.id === exampleId) ?? {
  //       id: defaultExampleId,
  //       title: '默认示例',
  //       description: '回退示例',
  //     },
  //   [exampleId],
  // );
  const demoRenderMap = {
    'literal': () => <Literal />,
    'adapter': () => <Adapter />,
  };

  const renderCurrentDemo = () => {
    const renderer =
      demoRenderMap[exampleId as keyof typeof demoRenderMap] ?? demoRenderMap['literal'];
    return renderer();
  };

  return (
    // <Card title={`React / ${current.title}`} bordered={false}>
    //   <Typography.Paragraph>{current.description}</Typography.Paragraph>
    //   {renderCurrentDemo()}
    // </Card>
    renderCurrentDemo()
  );
}

export default App;
