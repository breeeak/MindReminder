import { useEffect, useState } from 'react'
import { Button, List, Card, Space, Typography, Empty, Spin, Input } from 'antd'
import { PlusOutlined, CalendarOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useDiaryStore } from '../stores/diaryStore'
import { DiaryEditor } from '../components/diary/DiaryEditor'
import type { Diary } from '../types'
import dayjs from 'dayjs'
import ReactMarkdown from 'react-markdown'

const { Title } = Typography
const { Search } = Input

/**
 * 日记列表页面
 */
export const DiaryListPage = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const { diaries, loading, fetchAllDiaries, deleteDiary } = useDiaryStore()

  useEffect(() => {
    fetchAllDiaries()
  }, [fetchAllDiaries])

  // 根据关键词筛选日记
  const filteredDiaries = diaries.filter((diary) => {
    if (!searchKeyword) return true
    return (
      diary.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      diary.date.includes(searchKeyword)
    )
  })

  const handleEdit = (date: string) => {
    setSelectedDate(date)
    setIsEditorOpen(true)
  }

  const handleDelete = async (date: string) => {
    await deleteDiary(date)
    await fetchAllDiaries()
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setSelectedDate('')
    fetchAllDiaries()
  }

  const handleCreateNew = () => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'))
    setIsEditorOpen(true)
  }

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Space
        direction="vertical"
        style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        size="large"
      >
        {/* 顶部标题和操作 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            我的日记
          </Title>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateNew}
          >
            写日记
          </Button>
        </div>

        {/* 搜索栏 */}
        <Search
          placeholder="搜索日记内容或日期"
          allowClear
          size="large"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: '100%' }}
        />

        {/* 日记列表 */}
        <Card
          style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, overflow: 'auto' }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : filteredDiaries.length === 0 ? (
            <Empty
              description={searchKeyword ? '未找到匹配的日记' : '暂无日记'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {!searchKeyword && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
                  写第一篇日记
                </Button>
              )}
            </Empty>
          ) : (
            <List
              dataSource={filteredDiaries.sort((a, b) => b.date.localeCompare(a.date))}
              renderItem={(diary) => {
                const isToday = diary.date === dayjs().format('YYYY-MM-DD')
                
                return (
                  <List.Item
                    key={diary.date}
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(diary.date)}
                      >
                        编辑
                      </Button>,
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(diary.date)}
                      >
                        删除
                      </Button>
                    ]}
                    style={{
                      padding: '16px',
                      backgroundColor: isToday ? '#e6f7ff' : 'white',
                      borderLeft: isToday ? '4px solid #1890ff' : 'none'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            fontSize: '32px',
                            marginTop: '8px'
                          }}
                        >
                          📝
                        </div>
                      }
                      title={
                        <Space>
                          <CalendarOutlined />
                          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            {dayjs(diary.date).format('YYYY年MM月DD日')}
                          </span>
                          {isToday && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#1890ff',
                                backgroundColor: '#e6f7ff',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              今天
                            </span>
                          )}
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            {dayjs(diary.date).format('dddd')}
                          </span>
                        </Space>
                      }
                      description={
                        <div
                          style={{
                            fontSize: '14px',
                            color: '#666',
                            marginTop: '12px',
                            maxHeight: '150px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          <div style={{ 
                            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                          }}>
                            <ReactMarkdown>{diary.content}</ReactMarkdown>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          )}
        </Card>
      </Space>

      {/* 日记编辑器 */}
      {selectedDate && (
        <DiaryEditor date={selectedDate} open={isEditorOpen} onClose={handleCloseEditor} />
      )}
    </div>
  )
}
