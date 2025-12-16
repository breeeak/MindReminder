import React, { useEffect } from 'react'
import { Card, Row, Col, Tag, Space, Typography, Progress, Empty, Spin } from 'antd'
import { useCalendarStore } from '../stores/calendarStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// 评分对应的表情符号
const getRatingEmoji = (rating: number): string => {
  const emojiMap: Record<number, string> = {
    1: '😟',
    2: '🤔',
    3: '😐',
    4: '😊',
    5: '🎯'
  }
  return emojiMap[rating] || '⭐'
}

// 星期名称
const getDayName = (dayOfWeek: number): string => {
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return dayNames[dayOfWeek] || ''
}

// 格式化日期显示
const formatDate = (dateStr: string): string => {
  return dayjs(dateStr).format('MM月DD日')
}

/**
 * 周视图组件
 * 显示一周7天的详细活动
 */
export const CalendarWeekView: React.FC = () => {
  const { weekData, loading, error, fetchWeekData } = useCalendarStore()

  useEffect(() => {
    fetchWeekData()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">{error}</Text>
      </div>
    )
  }

  if (!weekData) {
    return <Empty description="无数据" />
  }

  return (
    <div className="week-view" style={{ padding: '16px 0' }}>
      <Row gutter={[16, 16]}>
        {weekData.days.map((day) => {
          const hasActivity = day.knowledgeList.length > 0 || day.reviewList.length > 0

          return (
            <Col span={24} key={day.date}>
              <Card
                title={
                  <Space>
                    <Text strong>{formatDate(day.date)}</Text>
                    <Text type="secondary">{getDayName(day.dayOfWeek)}</Text>
                  </Space>
                }
                extra={
                  day.reviewList.length > 0 ? (
                    <Tag color={day.completionRate === 100 ? 'success' : 'warning'}>
                      复习完成 {day.reviewList.filter((r) => r.rating > 0).length}/
                      {day.reviewList.length}
                    </Tag>
                  ) : null
                }
                style={{
                  borderLeft: hasActivity ? '4px solid #1890ff' : '4px solid #f0f0f0'
                }}
              >
                {!hasActivity ? (
                  <Empty
                    description="今日无活动"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ margin: '20px 0' }}
                  />
                ) : (
                  <>
                    {/* 新增知识点 */}
                    {day.knowledgeList.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <Title level={5} style={{ marginBottom: 12 }}>
                          📚 新增知识点 ({day.knowledgeList.length})
                        </Title>
                        <Space wrap size="small">
                          {day.knowledgeList.map((k) => (
                            <Tag key={k.id} color="blue">
                              {k.title}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* 复习知识点 */}
                    {day.reviewList.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <Title level={5} style={{ marginBottom: 12 }}>
                          ✅ 复习记录 ({day.reviewList.length})
                        </Title>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {day.reviewList.map((r) => (
                            <div
                              key={r.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: '#fafafa',
                                borderRadius: '4px'
                              }}
                            >
                              <Text>{r.knowledgeTitle}</Text>
                              <Text>
                                评分:{' '}
                                <span style={{ fontSize: '18px' }}>{getRatingEmoji(r.rating)}</span>
                              </Text>
                            </div>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* 日记摘要 */}
                    {day.diary && (
                      <div style={{ marginBottom: 16 }}>
                        <Title level={5} style={{ marginBottom: 12 }}>
                          📝 日记
                        </Title>
                        <Text type="secondary">{day.diary.substring(0, 100)}...</Text>
                      </div>
                    )}

                    {/* 完成率进度条 */}
                    {day.reviewList.length > 0 && (
                      <Progress
                        percent={day.completionRate}
                        status={day.completionRate === 100 ? 'success' : 'active'}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068'
                        }}
                      />
                    )}
                  </>
                )}
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}






