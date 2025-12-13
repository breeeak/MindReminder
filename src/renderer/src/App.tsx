import { Button, Space } from 'antd'

function App(): React.JSX.Element {
  return (
    <div style={{ padding: 24 }}>
      <h1>MindReminder</h1>
      <p>基于间隔重复算法的智能复习桌面应用</p>
      <Space>
        <Button type="primary">主按钮</Button>
        <Button>默认按钮</Button>
        <Button type="dashed">虚线按钮</Button>
      </Space>
    </div>
  )
}

export default App
