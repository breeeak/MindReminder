import { useEffect, useState } from 'react'
import { Button, List, Card, Space, Typography, Empty, Spin, Segmented } from 'antd'
import { PlusOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useKnowledgeStore } from '../stores'
import { KnowledgeEditDialog } from '../components/KnowledgeEditDialog'
import { KnowledgeListItem } from '../components/KnowledgeListItem'
import { SearchBar } from '../components/SearchBar'
import { AdvancedFilter } from '../components/AdvancedFilter'
import { FilterTags } from '../components/FilterTags'
import dayjs from 'dayjs'

const { Title } = Typography

/**
 * 知识点列表页面
 */
export const KnowledgeListPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [quickFilter, setQuickFilter] = useState<string>('all')

  // 使用 knowledgeStore
  const knowledgeList = useKnowledgeStore((state) => state.knowledgeList)
  const isLoading = useKnowledgeStore((state) => state.isLoading)
  const loadKnowledgeList = useKnowledgeStore((state) => state.loadKnowledgeList)
  const loadTags = useKnowledgeStore((state) => state.loadTags)
  const loadCategories = useKnowledgeStore((state) => state.loadCategories)
  const setFilters = useKnowledgeStore((state) => state.setFilters)
  const applyFilters = useKnowledgeStore((state) => state.applyFilters)
  const clearAllFilters = useKnowledgeStore((state) => state.clearAllFilters)

  // 组件挂载时加载标签和分类
  useEffect(() => {
    loadTags()
    loadCategories()
    
    // 初始化时检查URL参数
    const filter = searchParams.get('filter')
    if (filter === 'today') {
      handleQuickFilterChange('today')
    } else if (filter === 'review') {
      handleQuickFilterChange('review')
    } else {
      loadKnowledgeList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 处理快速筛选切换
  const handleQuickFilterChange = async (value: string) => {
    setQuickFilter(value)
    
    if (value === 'today') {
      // 今日知识点：今天新增的（使用本地时区）
      const todayStart = dayjs().startOf('day').valueOf()
      const todayEnd = dayjs().endOf('day').valueOf()
      setFilters({ dateFrom: todayStart.toString(), dateTo: todayEnd.toString() })
      // 等待状态更新后再应用筛选
      setTimeout(() => {
        applyFilters()
      }, 0)
      setSearchParams({ filter: 'today' })
    } else if (value === 'review') {
      // 今日需要复习的知识点：使用专门的API查询
      try {
        const response = await window.api.knowledge.findDueToday()
        useKnowledgeStore.setState({ knowledgeList: response.data, isLoading: false })
      } catch (error) {
        console.error('Failed to load due today knowledge:', error)
      }
      setSearchParams({ filter: 'review' })
    } else {
      // 全部
      clearAllFilters()
      setSearchParams({})
    }
  }

  // 处理创建成功
  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    loadKnowledgeList() // 重新加载列表
  }

  // 处理标签点击
  const handleTagClick = (tagName: string) => {
    // 可以在这里处理标签点击逻辑
    console.log('Tag clicked:', tagName)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Space direction="vertical" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} size="large">
        {/* 顶部标题和快速记录按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Title level={2} style={{ margin: 0 }}>
              我的知识点
            </Title>
            <Segmented
              value={quickFilter}
              onChange={handleQuickFilterChange}
              options={[
                { label: '全部', value: 'all' },
                { label: '今日知识点', value: 'today', icon: <CalendarOutlined /> },
                { label: '今日需复习', value: 'review', icon: <ClockCircleOutlined /> }
              ]}
            />
          </Space>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            快速记录
          </Button>
        </div>

        {/* 搜索栏 */}
        <SearchBar onOpenAdvancedFilter={() => setIsFilterDialogOpen(true)} />

        {/* 筛选标签 */}
        <FilterTags />

        {/* 知识点列表 */}
        <Card style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, overflow: 'auto' } }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : knowledgeList.length === 0 ? (
            <Empty description="未找到匹配的知识点" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                创建新知识点
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={knowledgeList}
              renderItem={(knowledge) => (
                <KnowledgeListItem
                  knowledge={knowledge}
                  onClick={() => navigate(`/knowledge/${knowledge.id}`)}
                  onTagClick={handleTagClick}
                />
              )}
            />
          )}
        </Card>
      </Space>

      {/* 创建知识点对话框 */}
      <KnowledgeEditDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 高级筛选对话框 */}
      <AdvancedFilter visible={isFilterDialogOpen} onClose={() => setIsFilterDialogOpen(false)} />
    </div>
  )
}
