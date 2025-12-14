import React, { useEffect } from 'react'
import { Row, Col, Card, Statistic, Spin, Empty, Progress } from 'antd'
import {
  TrophyOutlined,
  CheckCircleOutlined,
  FireOutlined,
  PercentageOutlined
} from '@ant-design/icons'
import { useStatisticsStore } from '../stores/statisticsStore'
import './StatisticsPage.css'

/**
 * 统计页面
 * 显示总体统计和本周学习趋势
 */
export const StatisticsPage: React.FC = () => {
  const {
    overallStatistics,
    overallStatisticsLoading,
    weeklyStatistics,
    weeklyStatisticsLoading,
    fetchOverallStatistics,
    fetchWeeklyStatistics
  } = useStatisticsStore()

  useEffect(() => {
    fetchOverallStatistics()
    fetchWeeklyStatistics()
  }, [fetchOverallStatistics, fetchWeeklyStatistics])

  if (overallStatisticsLoading || weeklyStatisticsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载统计数据..." />
      </div>
    )
  }

  if (!overallStatistics || !weeklyStatistics) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="暂无统计数据" />
      </div>
    )
  }

  // 计算本周最大值用于归一化
  const maxNewKnowledge = Math.max(...weeklyStatistics.newKnowledge, 1)
  const maxReviews = Math.max(...weeklyStatistics.reviews, 1)

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }} className="statistics-page">
      <h1>学习统计</h1>

      {/* 总体统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="知识点总数"
              value={overallStatistics.totalKnowledge}
              prefix={<TrophyOutlined />}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已掌握"
              value={overallStatistics.masteredKnowledge}
              suffix={`个 (${overallStatistics.masteredPercentage}%)`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="连续学习天数"
              value={overallStatistics.currentStreak}
              suffix={`天`}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              最长记录: {overallStatistics.longestStreak} 天
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均完成率"
              value={overallStatistics.averageCompletionRate}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 本周统计图表 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="本周新增知识点" bodyStyle={{ padding: '24px 24px 12px' }}>
            <div className="bar-chart">
              {weeklyStatistics.dates.map((date, index) => (
                <div key={date} className="bar-item">
                  <div className="bar-label">{date}</div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${(weeklyStatistics.newKnowledge[index] / maxNewKnowledge) * 100}%`,
                        backgroundColor: '#1890ff'
                      }}
                    >
                      <span className="bar-value">{weeklyStatistics.newKnowledge[index]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="本周复习数量" bodyStyle={{ padding: '24px 24px 12px' }}>
            <div className="bar-chart">
              {weeklyStatistics.dates.map((date, index) => (
                <div key={date} className="bar-item">
                  <div className="bar-label">{date}</div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${(weeklyStatistics.reviews[index] / maxReviews) * 100}%`,
                        backgroundColor: '#52c41a'
                      }}
                    >
                      <span className="bar-value">{weeklyStatistics.reviews[index]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="本周复习完成率">
            <div style={{ padding: '0 24px' }}>
              {weeklyStatistics.dates.map((date, index) => (
                <div key={date} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 4 }}>
                    {date} - {weeklyStatistics.completionRates[index]}%
                  </div>
                  <Progress
                    percent={weeklyStatistics.completionRates[index]}
                    strokeColor={{
                      '0%': '#ff4d4f',
                      '50%': '#faad14',
                      '100%': '#52c41a'
                    }}
                    status="active"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

