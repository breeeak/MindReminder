import { useEffect, useState } from 'react'
import { Button, List, Card, Space, Typography, Empty, Spin, Segmented, Tag } from 'antd'
import { PlusOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useReminderStore } from '../stores/reminderStore'
import { ReminderEditor } from '../components/reminder/ReminderEditor'
import type { Reminder } from '../types'
import dayjs from 'dayjs'
import ReactMarkdown from 'react-markdown'

const { Title } = Typography

/**
 * 提醒事项列表页面
 */
export const ReminderListPage = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all')

  const { reminders, loading, fetchAll, markComplete, deleteReminder } = useReminderStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // 根据状态筛选提醒
  const filteredReminders = reminders.filter((reminder) => {
    if (filterStatus === 'pending') return !reminder.completed
    if (filterStatus === 'completed') return reminder.completed
    return true
  })

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setIsEditorOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteReminder(id)
  }

  const handleMarkComplete = async (id: string) => {
    await markComplete(id)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingReminder(undefined)
    fetchAll()
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
        {/* 顶部标题和快速筛选 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Title level={2} style={{ margin: 0 }}>
              提醒事项
            </Title>
            <Segmented
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as any)}
              options={[
                { label: '全部', value: 'all' },
                { label: '待处理', value: 'pending', icon: <ClockCircleOutlined /> },
                { label: '已完成', value: 'completed', icon: <CheckCircleOutlined /> }
              ]}
            />
          </Space>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingReminder(undefined)
              setIsEditorOpen(true)
            }}
          >
            新增提醒
          </Button>
        </div>

        {/* 提醒列表 */}
        <Card
          style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, overflow: 'auto' } }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : filteredReminders.length === 0 ? (
            <Empty
              description="暂无提醒事项"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsEditorOpen(true)}
              >
                创建新提醒
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={filteredReminders}
              renderItem={(reminder) => {
                const isPast = reminder.dueDate < Date.now()
                const isToday = dayjs(reminder.dueDate).isSame(dayjs(), 'day')
                
                return (
                  <List.Item
                    key={reminder.id}
                    actions={[
                      !reminder.completed && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleMarkComplete(reminder.id)}
                        >
                          标记完成
                        </Button>
                      ),
                      <Button type="link" size="small" onClick={() => handleEdit(reminder)}>
                        编辑
                      </Button>,
                      <Button
                        type="link"
                        danger
                        size="small"
                        onClick={() => handleDelete(reminder.id)}
                      >
                        删除
                      </Button>
                    ].filter(Boolean)}
                    style={{
                      padding: '16px',
                      backgroundColor: reminder.completed ? '#f5f5f5' : 'white',
                      opacity: reminder.completed ? 0.7 : 1
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ fontSize: '32px', marginTop: '8px' }}>
                          {reminder.completed ? '✅' : '⏰'}
                        </div>
                      }
                      title={
                        <Space>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              textDecoration: reminder.completed ? 'line-through' : 'none'
                            }}
                          >
                            {reminder.title}
                          </span>
                          {isToday && !reminder.completed && (
                            <Tag color="blue">今天</Tag>
                          )}
                          {isPast && !reminder.completed && (
                            <Tag color="red">已过期</Tag>
                          )}
                          {reminder.completed && (
                            <Tag color="green">已完成</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: '8px', color: '#666' }}>
                            <ClockCircleOutlined />{' '}
                            {dayjs(reminder.dueDate).format('YYYY-MM-DD HH:mm')}
                            {reminder.completed && reminder.completedAt && (
                              <span style={{ marginLeft: '16px' }}>
                                <CheckCircleOutlined /> 完成于{' '}
                                {dayjs(reminder.completedAt).format('YYYY-MM-DD HH:mm')}
                              </span>
                            )}
                          </div>
                          {reminder.content && (
                            <div
                              style={{
                                fontSize: '14px',
                                color: '#666',
                                marginTop: '8px',
                                maxHeight: '100px',
                                overflow: 'hidden'
                              }}
                            >
                              <ReactMarkdown>{reminder.content}</ReactMarkdown>
                            </div>
                          )}
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

      {/* 提醒编辑器 */}
      <ReminderEditor
        reminder={editingReminder}
        open={isEditorOpen}
        onClose={handleCloseEditor}
      />
    </div>
  )
}





