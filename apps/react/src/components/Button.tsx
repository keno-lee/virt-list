import { Button, Space } from '@arco-design/web-react';
import { useState } from 'react';

interface ButtonProps {
  onEvent?: (message: string) => void;
}

function ButtonComponent({ onEvent }: ButtonProps) {
  const [count, setCount] = useState(0);

  return (
    <Space direction="vertical">
      <Button
        type="primary"
        onClick={() => {
          const next = count + 1;
          setCount(next);
          onEvent?.(`按钮被点击 ${next} 次`);
        }}
      >
        点击计数：{count}
      </Button>
    </Space>
  );
}

export default ButtonComponent;
