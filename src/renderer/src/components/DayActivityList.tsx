import React from 'react'
import { List, Tag, Typography, Space, Empty } from 'antd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Text, Title } = Typography

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

interface DayActivityListProps {
  dayDetail: DayDetail | null
}

const RATING_EMOJIS = ['', '😟', '🤔', '😐', '😊', '🎯']

export const DayActivityList: React.FC<DayActivityListProps> = ({ dayDetail }) => {
  const navigate = useNavigate()

  if (!dayDetail) {
    return <Empty description="请选择日期查看详情" style={{ marginTop: 40 }} />
  }

  const { date, knowledgeList, reviewList } = dayDetail
  const hasActivity = knowledgeList.length > 0 || reviewList.length > 0

  if (!hasActivity) {
    return (
      <div>
        <Title level={4}>{dayjs(date).format('YYYY年MM月DD日')}</Title>
        <Empty description="当日无活动" style={{ marginTop: 40 }} />
      </div>
    )
  }

  return (
    <div>
      <Title level={4}>{dayjs(date).format('YYYY年MM月DD日')}</Title>

      {/* 新增知识点 */}
      {knowledgeList.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16 }}>
            新增知识点 ({knowledgeList.length})
          </Text>
          <List
            dataSource={knowledgeList}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                onClick={() => navigate(`/knowledge/${item.id}`)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <List.Item.Meta
                  title={item.title}
                  description={
                    <Space size={4}>
                      {item.tags.map((tag) => (
                        <Tag key={tag} color="blue" style={{ fontSize: 12 }}>
                          {tag}
                        </Tag>
                      ))}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.createdAt).format('HH:mm')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 复习记录 */}
      {reviewList.length > 0 && (
        <div>
          <Text strong style={{ fontSize: 16 }}>
            复习记录 ({reviewList.length})
          </Text>
          <List
            dataSource={reviewList}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                onClick={() => navigate(`/knowledge/${item.knowledgeId}`)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {item.knowledgeTitle}
                      <span style={{ fontSize: 18 }}>{RATING_EMOJIS[item.rating]}</span>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.reviewedAt).format('HH:mm')}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  )
}








