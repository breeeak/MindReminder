import { useState, useEffect } from 'react';
import { Button, Card, Space, List, Input, message, Spin, Tag } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useAppStore, useKnowledgeStore } from './stores';
import type { Knowledge } from './types';

function App() {
  const [newTitle, setNewTitle] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 使用 appStore
  const { currentView, theme, toggleTheme } = useAppStore();
  
  // 使用 knowledgeStore - 选择性订阅
  const knowledgeList = useKnowledgeStore((state) => state.knowledgeList);
  const isLoading = useKnowledgeStore((state) => state.isLoading);
  const error = useKnowledgeStore((state) => state.error);
  
  const loadKnowledgeList = useKnowledgeStore((state) => state.loadKnowledgeList);
  const createKnowledge = useKnowledgeStore((state) => state.createKnowledge);
  const deleteKnowledge = useKnowledgeStore((state) => state.deleteKnowledge);
  const searchKnowledge = useKnowledgeStore((state) => state.searchKnowledge);
  const clearError = useKnowledgeStore((state) => state.clearError);
  
  // 组件挂载时加载知识点列表
  useEffect(() => {
    loadKnowledgeList();
  }, [loadKnowledgeList]);
  
  // 显示错误消息
  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);
  
  // 创建新知识点
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      message.warning('请输入知识点标题');
      return;
    }
    
    try {
      await createKnowledge({
        title: newTitle,
        content: `这是${newTitle}的内容`,
        tags: ['测试', 'Zustand'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        frequencyCoefficient: 1.0,
      });
      message.success('创建成功！');
      setNewTitle('');
    } catch (error) {
      message.error('创建失败');
    }
  };
  
  // 删除知识点
  const handleDelete = async (id: string) => {
    try {
      await deleteKnowledge(id);
      message.success('删除成功！');
    } catch (error) {
      message.error('删除失败');
    }
  };
  
  // 搜索知识点
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadKnowledgeList();
      return;
    }
    
    await searchKnowledge(searchKeyword);
  };
  
  // 刷新列表
  const handleRefresh = () => {
    loadKnowledgeList();
    setSearchKeyword('');
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 顶部标题和主题切换 */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Zustand 状态管理测试</h1>
          <Space>
            <Tag color="blue">当前主题: {theme}</Tag>
            <Button onClick={toggleTheme}>切换主题</Button>
            <Tag color="green">当前视图: {currentView}</Tag>
          </Space>
        </div>
      </Card>
      
      {/* 创建知识点 */}
      <Card title="创建知识点" style={{ marginBottom: 20 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="输入知识点标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={handleCreate}
            disabled={isLoading}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
            loading={isLoading}
          >
            创建
          </Button>
        </Space.Compact>
      </Card>
      
      {/* 搜索和刷新 */}
      <Card style={{ marginBottom: 20 }}>
        <Space style={{ width: '100%' }}>
          <Space.Compact style={{ flex: 1 }}>
            <Input
              placeholder="搜索知识点标题"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              disabled={isLoading}
            />
            <Button 
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={isLoading}
            >
              搜索
            </Button>
          </Space.Compact>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            刷新
          </Button>
        </Space>
      </Card>
      
      {/* 知识点列表 */}
      <Card 
        title={`知识点列表 (共 ${knowledgeList.length} 个)`}
        extra={isLoading && <Spin />}
      >
        {knowledgeList.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无知识点数据，请创建新的知识点
          </div>
        ) : (
          <List
            dataSource={knowledgeList}
            renderItem={(item: Knowledge) => (
              <List.Item
                actions={[
                  <Button 
                    danger 
                    size="small" 
                    onClick={() => handleDelete(item.id)}
                    loading={isLoading}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={
                    <Space>
                      {item.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                      <span style={{ color: '#999' }}>
                        ID: {item.id.slice(0, 8)}...
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
      
      {/* 调试信息 */}
      <Card title="Store 状态调试" style={{ marginTop: 20 }}>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify({
            currentView,
            theme,
            knowledgeCount: knowledgeList.length,
            isLoading,
            hasError: !!error
          }, null, 2)}
        </pre>
        <p style={{ marginTop: 10, color: '#666' }}>
          💡 提示: 打开 Redux DevTools 可以查看状态变化历史和时间旅行调试
        </p>
      </Card>
    </div>
  );
}

export default App;
