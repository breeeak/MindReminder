import React from 'react'
import { Drawer, Button, Divider } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { DayActivityList } from './DayActivityList'
import { DiaryViewer } from './diary/DiaryViewer'
import { ReminderViewer } from './reminder/ReminderViewer'
import type { Diary, Reminder } from '../types'

interface DayDetail {
  date: string
  knowledgeList: Array<{
    id: string
    title: string
    tags: string[]
    createdAt: string
  }>
  reviewList: Array<{
    id: string
    knowledgeId: string
    knowledgeTitle: string
    rating: number
    reviewedAt: string
  }>
}

interface DaySidebarProps {
  open: boolean
  dayDetail: DayDetail | null
  onClose: () => void
  currentDiary: Diary | null
  onOpenDiaryEditor: () => void
  onDeleteDiary: () => void
  reminders: Reminder[]
  onOpenReminderEditor: () => void
  onEditReminder: (reminder: Reminder) => void
  onMarkComplete: (id: string) => void
  onDeleteReminder: (id: string) => void
}

export const DaySidebar: React.FC<DaySidebarProps> = ({
  open,
  dayDetail,
  onClose,
  currentDiary,
  onOpenDiaryEditor,
  onDeleteDiary,
  reminders,
  onOpenReminderEditor,
  onEditReminder,
  onMarkComplete,
  onDeleteReminder
}) => {
  return (
    <Drawer
      title="日期详情"
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <DayActivityList dayDetail={dayDetail} />

      {/* 日记部分 */}
      <Divider style={{ margin: '16px 0' }} />

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>📝 今日计划</h3>
        {currentDiary ? (
          <DiaryViewer diary={currentDiary} onEdit={onOpenDiaryEditor} onDelete={onDeleteDiary} />
        ) : (
          <Button type="dashed" block icon={<EditOutlined />} onClick={onOpenDiaryEditor}>
            写计划
          </Button>
        )}
      </div>

      {/* 提醒部分 */}
      <Divider style={{ margin: '16px 0' }} />

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
            ⏰ 提醒事项 ({reminders.filter((r) => !r.completed).length})
          </h3>
          <Button type="dashed" size="small" onClick={onOpenReminderEditor}>
            添加提醒
          </Button>
        </div>

        <div style={{ marginTop: 12 }}>
          {reminders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>暂无提醒</div>
          ) : (
            reminders.map((reminder) => (
              <ReminderViewer
                key={reminder.id}
                reminder={reminder}
                onEdit={() => onEditReminder(reminder)}
                onDelete={() => onDeleteReminder(reminder.id)}
                onMarkComplete={() => onMarkComplete(reminder.id)}
              />
            ))
          )}
        </div>
      </div>
    </Drawer>
  )
}
