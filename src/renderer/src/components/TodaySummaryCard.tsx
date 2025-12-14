import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Button, Statistic, Spin, Space } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useStatisticsStore } from '../stores/statisticsStore'
import { useDiaryStore } from '../stores/diaryStore'
import { useReminderStore } from '../stores/reminderStore'
import { DiaryEditor } from './diary/DiaryEditor'
import { ReminderEditor } from './reminder/ReminderEditor'
import { KnowledgeEditDialog } from './KnowledgeEditDialog'
import ReactMarkdown from 'react-markdown'
import dayjs from 'dayjs'
import { useKnowledgeStore } from '../stores'

/**
 * 今日摘要卡片组件
 * 显示今日学习情况：新增知识点、待复习、已完成
 */
export const TodaySummaryCard: React.FC = () => {
  const navigate = useNavigate()
  const { todaySummary, todaySummaryLoading, fetchTodaySummary } = useStatisticsStore()
  const { fetchDiaryByDate, currentDiary } = useDiaryStore()
  const { fetchPending, reminders } = useReminderStore()
  const { loadKnowledgeList } = useKnowledgeStore()
  
  const [isDiaryEditorOpen, setIsDiaryEditorOpen] = useState(false)
  const [isReminderEditorOpen, setIsReminderEditorOpen] = useState(false)
  const [isKnowledgeCreateOpen, setIsKnowledgeCreateOpen] = useState(false)
  const today = dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    fetchTodaySummary()
    fetchDiaryByDate(today)
    fetchPending()
  }, [fetchTodaySummary, fetchDiaryByDate, fetchPending])

  if (todaySummaryLoading) {
    return (
      <Card>
        <Spin tip="加载今日摘要..." />
      </Card>
    )
  }

  if (!todaySummary) {
    return null
  }

  return (
    <div>
      <Card
        title={
          <span>
            <CalendarOutlined /> {todaySummary.date}
          </span>
        }
        extra={
          <Space size="middle">
            <Button icon={<EditOutlined />} onClick={() => setIsDiaryEditorOpen(true)}>
              今日计划
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setIsReminderEditorOpen(true)}>
              新增提醒
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setIsKnowledgeCreateOpen(true)}>
              新建知识点
            </Button>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate('/review')}>
              开始复习
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <div onClick={() => navigate('/knowledge?filter=today')} style={{ cursor: 'pointer' }}>
              <Statistic
                title="新增知识点"
                value={todaySummary.newKnowledgeCount}
                suffix="个"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </div>
          </Col>
          <Col span={8}>
            <div onClick={() => navigate('/review')} style={{ cursor: 'pointer' }}>
              <Statistic
                title="待复习"
                value={todaySummary.pendingReviewCount}
                suffix="个"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </div>
          </Col>
          <Col span={8}>
            <div onClick={() => navigate('/review/history?date=today')} style={{ cursor: 'pointer' }}>
              <Statistic
                title="已完成"
                value={todaySummary.completedReviewCount}
                suffix="个"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 今日日记和提醒事项 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={19}>
          <Card 
            title="📝 今日计划"
            style={{ height: '100%' }}
          >
            {currentDiary ? (
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                <ReactMarkdown>{currentDiary.content}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                暂无日记，点击上方"今日计划"按钮开始记录
              </div>
            )}
          </Card>
        </Col>
        <Col span={5}>
          <Card title="⏰ 提醒事项" style={{ height: '100%' }}>
            {reminders.length > 0 ? (
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {reminders.slice(0, 5).map((reminder) => (
                  <div key={reminder.id} style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{reminder.title}</div>
                    {reminder.content && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <ReactMarkdown>{reminder.content}</ReactMarkdown>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                      {dayjs(reminder.dueDate).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                暂无待处理的提醒事项
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 日记编辑器 */}
      <DiaryEditor
        date={today}
        open={isDiaryEditorOpen}
        onClose={() => {
          setIsDiaryEditorOpen(false)
          fetchDiaryByDate(today)
        }}
      />

      {/* 提醒编辑器 */}
      <ReminderEditor
        defaultDate={today}
        open={isReminderEditorOpen}
        onClose={() => {
          setIsReminderEditorOpen(false)
          fetchPending()
        }}
      />

      {/* 知识点创建对话框 */}
      <KnowledgeEditDialog
        open={isKnowledgeCreateOpen}
        onClose={() => {
          setIsKnowledgeCreateOpen(false)
          loadKnowledgeList()
          fetchTodaySummary()
        }}
      />
    </div>
  )
}



