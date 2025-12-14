import React from 'react'
import { Card, Row, Col, Statistic, Progress, Space, Typography, Alert } from 'antd'
import {
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import type { ReviewStats } from '../stores/reviewStore'

const { Text } = Typography

interface ReviewSummaryCardProps {
  stats: ReviewStats | null
}

const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({ stats }) => {
  if (!stats) {
    return null
  }

  // 根据完成率确定进度条颜色
  const getProgressColor = (rate: number) => {
    if (rate >= 70) return '#52c41a' // 绿色
    if (rate >= 30) return '#fa8c16' // 橙色
    return '#ff4d4f' // 红色
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Text strong style={{ fontSize: '18px' }}>
            今日复习任务
          </Text>
        </div>

        {/* 统计数据 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Statistic
              title="待复习总数"
              value={stats.todayTotal}
              suffix="个"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
            />
          </Col>

          <Col xs={12} sm={6}>
            <Statistic
              title="已完成"
              value={stats.todayCompleted}
              suffix="个"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>

          <Col xs={12} sm={6}>
            <Statistic
              title="剩余"
              value={stats.todayRemaining}
              suffix="个"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>

          {stats.overdueCount > 0 && (
            <Col xs={24} sm={6}>
              <Statistic
                title="超期"
                value={stats.overdueCount}
                suffix="个"
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          )}
        </Row>

        {/* 完成进度条 */}
        <div>
          <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
            完成进度
          </Text>
          <Progress
            percent={stats.completionRate}
            strokeColor={getProgressColor(stats.completionRate)}
            format={(percent) => `${percent}%`}
            strokeWidth={12}
          />
        </div>

        {/* 鼓励消息 */}
        {stats.completionRate === 100 && (
          <Alert message="🎉 太棒了！今日复习任务全部完成！" type="success" showIcon />
        )}
      </Space>
    </Card>
  )
}

export default React.memo(ReviewSummaryCard)



