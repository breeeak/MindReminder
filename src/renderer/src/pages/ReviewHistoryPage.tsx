import React, { useEffect, useState } from 'react'
import { Card, List, Typography, Spin, Empty, Tag } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface ReviewRecord {
  id: string
  knowledgeId: string
  knowledgeTitle: string
  rating: number
  reviewedAt: string
}

const getRatingColor = (rating: number): string => {
  if (rating >= 4) return 'success'
  if (rating === 3) return 'default'
  return 'warning'
}

const getRatingText = (rating: number): string => {
  const texts: Record<number, string> = {
    1: '完全不记得',
    2: '有点印象',
    3: '基本记得',
    4: '记得很清楚',
    5: '完全掌握'
  }
  return texts[rating] || '未知'
}

/**
 * 复习历史页面
 * 显示指定日期的复习记录
 */
export const ReviewHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const dateParam = searchParams.get('date')
  
  // 确定要查询的日期
  const date = dateParam === 'today' ? dayjs().format('YYYY-MM-DD') : (dateParam || dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      try {
        const response = await window.api.statistics.getDayActivities(date)
        setReviews(response.data.reviewList || [])
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [date])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载复习记录..." />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <ClockCircleOutlined /> 复习记录 - {date}
      </Title>

      <Card>
        {reviews.length === 0 ? (
          <Empty description="今天还没有完成任何复习" />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">共完成 {reviews.length} 次复习</Text>
            </div>
            <List
              dataSource={reviews}
              renderItem={(review) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                    title={
                      <div>
                        <Text strong>{review.knowledgeTitle}</Text>
                        <Tag color={getRatingColor(review.rating)} style={{ marginLeft: 8 }}>
                          {getRatingText(review.rating)}
                        </Tag>
                      </div>
                    }
                    description={
                      <Text type="secondary">
                        复习时间：{dayjs(review.reviewedAt).format('YYYY-MM-DD HH:mm:ss')}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Card>
    </div>
  )
}





