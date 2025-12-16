import React, { useEffect } from 'react'
import { Card, Button, Progress, Space, Typography, Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useReviewStore, ReviewSession } from '../stores/reviewStore'
import RatingSelector from './RatingSelector'
import ReactMarkdown from 'react-markdown'

const { Title, Text } = Typography

interface ReviewCardProps {
  session: ReviewSession
  onExit: () => void
}

/**
 * ReviewCard - 复习卡片组件
 * 显示问题、答案和评分选择器
 */
const ReviewCard: React.FC<ReviewCardProps> = ({ session, onExit }) => {
  const showAnswerAction = useReviewStore((state) => state.showAnswer)
  const currentTask = session.tasks[session.currentIndex]

  const progressPercent = ((session.currentIndex + 1) / session.tasks.length) * 100

  // 键盘快捷键（空格显示答案）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !session.showAnswer) {
        e.preventDefault()
        showAnswerAction()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [session.showAnswer, showAnswerAction])

  if (!currentTask) {
    return null
  }

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 顶部进度栏 */}
      <div style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text strong style={{ fontSize: '16px' }}>
              进度: {session.currentIndex + 1} / {session.tasks.length}
            </Text>
            <Button icon={<CloseOutlined />} onClick={onExit} type="text" danger>
              退出
            </Button>
          </div>
          <Progress
            percent={progressPercent}
            strokeColor="#52c41a"
            showInfo={false}
            strokeWidth={8}
          />
        </Space>
      </div>

      {/* 复习卡片 */}
      <Card
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        styles={{
          body: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '48px'
          }
        }}
      >
        {/* 问题显示 */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ fontSize: '32px', marginBottom: '24px' }}>
            {currentTask.title}
          </Title>

          {/* 标签 */}
          <Space size="small" wrap>
            {currentTask.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        </div>

        {/* 答案区域 */}
        {!session.showAnswer ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '48px'
            }}
          >
            <Button
              type="primary"
              size="large"
              onClick={() => showAnswerAction()}
              style={{
                height: '60px',
                fontSize: '18px',
                padding: '0 48px'
              }}
            >
              显示答案（空格键）
            </Button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 内容显示 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                backgroundColor: '#fafafa',
                borderRadius: '8px'
              }}
            >
              <ReactMarkdown>{currentTask.content || '无内容'}</ReactMarkdown>
            </div>

            {/* 评分选择器 */}
            <RatingSelector />
          </div>
        )}
      </Card>

      {/* 快捷键提示 */}
      {session.showAnswer && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">快捷键：数字 1-5 快速评分</Text>
        </div>
      )}
    </div>
  )
}

export default React.memo(ReviewCard)






