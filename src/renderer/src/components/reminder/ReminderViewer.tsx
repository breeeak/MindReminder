import React, { useMemo } from 'react'
import { Card, Button, Space, Tag, Popconfirm } from 'antd'
import {
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Reminder } from '../../types'
import './ReminderViewer.css'

interface ReminderViewerProps {
  reminder: Reminder
  onEdit: () => void
  onDelete: () => void
  onMarkComplete: () => void
}

export const ReminderViewer: React.FC<ReminderViewerProps> = ({
  reminder,
  onEdit,
  onDelete,
  onMarkComplete
}) => {
  const now = useMemo(() => Date.now(), [])
  const isOverdue = !reminder.completed && reminder.dueDate < now
  const dueDateFormatted = dayjs(reminder.dueDate).format('YYYY-MM-DD HH:mm')

  return (
    <Card
      className={`reminder-card ${reminder.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
      size="small"
    >
      <div className="reminder-header">
        <div className="reminder-title">
          {reminder.completed && <CheckCircleOutlined className="complete-icon" />}
          <span className={reminder.completed ? 'title-completed' : ''}>{reminder.title}</span>
        </div>
        <Space>
          {!reminder.completed && (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={onMarkComplete}>
              完成
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个提醒吗?"
            description="删除后将无法恢复"
            onConfirm={onDelete}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {reminder.content && <div className="reminder-content">{reminder.content}</div>}

      <div className="reminder-footer">
        <Space size="small">
          <ClockCircleOutlined />
          <span className={isOverdue ? 'overdue-text' : ''}>
            {dueDateFormatted}
            {isOverdue && ' (已过期)'}
          </span>
        </Space>

        {reminder.completed && <Tag color="success">已完成</Tag>}
      </div>
    </Card>
  )
}
