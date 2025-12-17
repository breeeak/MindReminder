import React, { useEffect } from 'react'
import { Card, Row, Col, Statistic, Empty, Spin, Typography, Tooltip } from 'antd'
import { useCalendarStore } from '../stores/calendarStore'
import dayjs from 'dayjs'
import './CalendarYearView.css'

const { Text } = Typography

// 获取热力图级别
const getHeatmapLevel = (count: number): number => {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 10) return 3
  if (count <= 15) return 4
  return 5
}

// 获取月份的所有日期
const getDaysInMonth = (year: number, month: number): number[] => {
  const daysCount = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`).daysInMonth()
  return Array.from({ length: daysCount }, (_, i) => i + 1)
}

// 格式化日期键（YYYY-MM-DD）
const formatDateKey = (year: number, month: number, day: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

/**
 * 年视图组件
 * 显示全年365天的热力图和年度统计
 */
export const CalendarYearView: React.FC = () => {
  const { yearData, loading, error, fetchYearData } = useCalendarStore()

  useEffect(() => {
    fetchYearData()
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

  if (!yearData) {
    return <Empty description="无数据" />
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="year-view" style={{ padding: '16px 0' }}>
      {/* 年度统计卡片 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总学习天数"
              value={yearData.stats.totalStudyDays}
              suffix="天"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="最长连续天数"
              value={yearData.stats.longestStreak}
              suffix="天"
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总知识点数"
              value={yearData.stats.totalKnowledge}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总复习次数"
              value={yearData.stats.totalReviews}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 全年热力图 - 按月分组 */}
      <Card title="全年活动热力图">
        <div className="year-heatmap">
          {months.map((month) => (
            <div key={month} className="month-group">
              <div className="month-label">{month}月</div>
              <div className="month-heatmap">
                {getDaysInMonth(yearData.year, month).map((day) => {
                  const dateKey = formatDateKey(yearData.year, month, day)
                  const count = yearData.heatmap[dateKey] || 0
                  const level = getHeatmapLevel(count)

                  return (
                    <Tooltip key={day} title={`${dateKey}: ${count}个活动`} placement="top">
                      <div className={`day-cell level-${level}`} />
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 图例 */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text type="secondary" style={{ marginRight: 8 }}>
            活动强度:
          </Text>
          <div className="day-cell level-0" style={{ display: 'inline-block' }} />
          <Text type="secondary">0</Text>
          <div className="day-cell level-1" style={{ display: 'inline-block' }} />
          <Text type="secondary">1-2</Text>
          <div className="day-cell level-2" style={{ display: 'inline-block' }} />
          <Text type="secondary">3-5</Text>
          <div className="day-cell level-3" style={{ display: 'inline-block' }} />
          <Text type="secondary">6-10</Text>
          <div className="day-cell level-4" style={{ display: 'inline-block' }} />
          <Text type="secondary">11-15</Text>
          <div className="day-cell level-5" style={{ display: 'inline-block' }} />
          <Text type="secondary">16+</Text>
        </div>
      </Card>
    </div>
  )
}







