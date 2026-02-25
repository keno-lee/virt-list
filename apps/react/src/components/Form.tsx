import { Input, Space, Typography } from '@arco-design/web-react';
import { useState } from 'react';

interface FormProps {
  onEvent?: (message: string) => void;
}

function FormComponent({ onEvent }: FormProps) {
  const [text, setText] = useState('');

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        value={text}
        placeholder="输入任意内容"
        onChange={(value) => {
          setText(value);
          onEvent?.(`输入值变更：${value || '(空)'}`);
        }}
      />
      <Typography.Text>当前输入：{text || '(空)'}</Typography.Text>
    </Space>
  );
}

export default FormComponent;
