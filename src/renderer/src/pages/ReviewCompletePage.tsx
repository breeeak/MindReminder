import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Space, Typography, Row, Col, Statistic, Progress } from 'antd'
import { TrophyOutlined, HomeOutlined, RocketOutlined } from '@ant-design/icons'
import { useReviewStore } from '../stores/reviewStore'

const { Title, Text } = Typography

/**
 * ReviewCompletePage - 复习完成页面
 * 显示复习统计和下次复习预告
 */
const ReviewCompletePage: React.FC = () => {
  const navigate = useNavigate()
  const sessionStats = useReviewStore((state) => state.sessionStats)

  if (!sessionStats) {
    navigate('/review')
    return null
  }

  const getRatingEmoji = (avgRating: number): string => {
    if (avgRating >= 4.5) return '🎯'
    if (avgRating >= 3.5) return '😊'
    if (avgRating >= 2.5) return '😐'
    if (avgRating >= 1.5) return '🤔'
    return '😟'
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  return (
    <div
      style={{
        padding: '40px 20px',
        maxWidth: '1000px',
        margin: '0 auto',
        height: '100%',
        overflow: 'auto'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 祝贺标题 */}
        <div style={{ textAlign: 'center' }}>
          <TrophyOutlined style={{ fontSize: '80px', color: '#faad14', marginBottom: '16px' }} />
          <Title level={1} style={{ marginBottom: '8px' }}>
            🎉 今日复习完成！
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            太棒了！坚持就是胜利！
          </Text>
        </div>

        {/* 统计卡片 */}
        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="复习数量"
                value={sessionStats.totalCount}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>

            <Col xs={24} sm={8}>
              <Statistic
                title="平均评分"
                value={sessionStats.averageRating}
                prefix={getRatingEmoji(sessionStats.averageRating)}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>

            <Col xs={24} sm={8}>
              <Statistic
                title="用时"
                value={formatDuration(sessionStats.duration)}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 评分分布 */}
        <Card title="评分分布">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {[
              {
                rating: 5,
                emoji: '🎯',
                label: '非常熟悉',
                count: sessionStats.ratingDistribution.rating5
              },
              {
                rating: 4,
                emoji: '😊',
                label: '记得还可以',
                count: sessionStats.ratingDistribution.rating4
              },
              {
                rating: 3,
                emoji: '😐',
                label: '记得一般',
                count: sessionStats.ratingDistribution.rating3
              },
              {
                rating: 2,
                emoji: '🤔',
                label: '记得一点',
                count: sessionStats.ratingDistribution.rating2
              },
              {
                rating: 1,
                emoji: '😟',
                label: '忘记了',
                count: sessionStats.ratingDistribution.rating1
              }
            ].map((item) => (
              <div key={item.rating} style={{ marginBottom: '12px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <Text>
                    {item.emoji} {item.label}: {item.count}个
                  </Text>
                </div>
                <Progress
                  percent={
                    sessionStats.totalCount > 0 ? (item.count / sessionStats.totalCount) * 100 : 0
                  }
                  showInfo={false}
                  strokeColor="#1890ff"
                />
              </div>
            ))}
          </Space>
        </Card>

        {/* 下次复习预告 */}
        <Card title="下次复习预告">
          <Space direction="vertical" size="small">
            <Text>
              📅 明天有{' '}
              <Text strong style={{ color: '#1890ff' }}>
                {sessionStats.nextReviewPreview.tomorrow}
              </Text>{' '}
              个知识点待复习
            </Text>
            <Text>
              📅 本周还有{' '}
              <Text strong style={{ color: '#fa8c16' }}>
                {sessionStats.nextReviewPreview.nextWeek}
              </Text>{' '}
              个知识点待复习
            </Text>
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate('/review')}
          >
            返回主页
          </Button>

          <Button size="large" icon={<RocketOutlined />} onClick={() => navigate('/knowledge')}>
            浏览知识点
          </Button>
        </Space>
      </Space>
    </div>
  )
}

export default ReviewCompletePage


