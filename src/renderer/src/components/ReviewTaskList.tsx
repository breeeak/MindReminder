import React from 'react'
import { List, Empty, Button, Typography } from 'antd'
import { SmileOutlined, RocketOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ReviewTask } from '../stores/reviewStore'
import ReviewTaskCard from './ReviewTaskCard'

const { Text } = Typography

interface ReviewTaskListProps {
  tasks: ReviewTask[]
}

const ReviewTaskList: React.FC<ReviewTaskListProps> = ({ tasks }) => {
  const navigate = useNavigate()

  // 空状态
  if (tasks.length === 0) {
    return (
      <Empty
        image={<SmileOutlined style={{ fontSize: '64px', color: '#52c41a' }} />}
        description={
          <div>
            <Text strong style={{ fontSize: '18px', display: 'block', marginBottom: '8px' }}>
              🎉 今日无复习任务，干得好！
            </Text>
            <Text type="secondary">保持学习习惯，明天见！</Text>
          </div>
        }
      >
        <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/knowledge')}>
          浏览所有知识点
        </Button>
      </Empty>
    )
  }

  return (
    <List
      dataSource={tasks}
      renderItem={(task) => <ReviewTaskCard key={task.id} task={task} />}
      style={{ marginTop: '16px' }}
    />
  )
}

export default React.memo(ReviewTaskList)







