import React from 'react'
import { Card, Tag, Space, Typography, Badge } from 'antd'
import { ClockCircleOutlined, HistoryOutlined, WarningOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useReviewStore } from '../stores/reviewStore'
import type { ReviewTask } from '../stores/reviewStore'

const { Title, Text } = Typography

interface ReviewTaskCardProps {
  task: ReviewTask
}

const ReviewTaskCard: React.FC<ReviewTaskCardProps> = ({ task }) => {
  const navigate = useNavigate()
  const startReviewSession = useReviewStore((state) => state.startReviewSession)

  const handleClick = () => {
    // 点击卡片直接开始单个知识点的复习
    startReviewSession([task])
    navigate('/review/session')
  }

  // 根据优先级确定卡片样式
  const getCardStyle = () => {
    if (task.priority === 'overdue') {
      return {
        borderLeft: '4px solid #ff4d4f',
        backgroundColor: '#fff1f0'
      }
    }
    if (task.priority === 'due_today') {
      return {
        borderLeft: '4px solid #fa8c16'
      }
    }
    return {}
  }

  // 优先级标签
  const getPriorityTag = () => {
    if (task.priority === 'overdue') {
      return (
        <Tag color="error" icon={<WarningOutlined />}>
          超期 {task.daysOverdue}天
        </Tag>
      )
    }
    if (task.priority === 'due_today') {
      return <Tag color="warning">今日到期</Tag>
    }
    return <Tag color="default">提前复习</Tag>
  }

  // 获取复习次数（从knowledge对象中）
  const getReviewCount = () => {
    // 暂时返回0，实际需要从数据库查询
    return 0
  }

  return (
    <Badge.Ribbon
      text={task.priority === 'overdue' ? '紧急' : undefined}
      color={task.priority === 'overdue' ? 'red' : undefined}
    >
      <Card
        hoverable
        style={{
          marginBottom: '12px',
          ...getCardStyle(),
          cursor: 'pointer'
        }}
        onClick={handleClick}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* 标题 */}
          <Title level={4} style={{ margin: 0 }}>
            {task.title}
          </Title>

          {/* 标签和分类 */}
          <Space size="small" wrap>
            {getPriorityTag()}
            {task.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>

          {/* 复习信息 */}
          <Space size="large">
            <Text type="secondary">
              <ClockCircleOutlined /> 计划时间: {dayjs(task.dueTime).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Text type="secondary">
              <HistoryOutlined /> 已复习: {getReviewCount()}次
            </Text>
          </Space>
        </Space>
      </Card>
    </Badge.Ribbon>
  )
}

export default React.memo(ReviewTaskCard)






