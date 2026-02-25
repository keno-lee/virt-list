// import { Card, Typography } from '@arco-design/web-react';
import { defaultExampleId } from '@shared/examples';
// import { useMemo } from 'react';
import '@arco-design/web-react/dist/css/arco.css';
import Button from './components/Button';
import Form from './components/Form';
import VirtList from './components/VirtList';

interface AppProps {
  exampleId?: string;
  onEvent?: (message: string) => void;
}

function App({ exampleId = defaultExampleId, onEvent }: AppProps) {
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
    button: () => <Button onEvent={onEvent} />,
    form: () => <Form onEvent={onEvent} />,
    'virt-list': () => <VirtList />,
  };

  const renderCurrentDemo = () => {
    const renderer =
      demoRenderMap[exampleId as keyof typeof demoRenderMap] ?? demoRenderMap['virt-list'];
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
