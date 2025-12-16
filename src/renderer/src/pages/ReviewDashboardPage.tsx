import React, { useEffect } from 'react'
import { Space, Spin, Alert, Button } from 'antd'
import { RocketOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useReviewStore } from '../stores/reviewStore'
import ReviewSummaryCard from '../components/ReviewSummaryCard'
import ReviewTaskList from '../components/ReviewTaskList'

const ReviewDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const todayReviews = useReviewStore((state) => state.todayReviews)
  const reviewStats = useReviewStore((state) => state.reviewStats)
  const loading = useReviewStore((state) => state.loading)
  const error = useReviewStore((state) => state.error)

  const fetchTodayReviews = useReviewStore((state) => state.fetchTodayReviews)
  const refreshReviewStats = useReviewStore((state) => state.refreshReviewStats)
  const clearReviewData = useReviewStore((state) => state.clearReviewData)
  const startReviewSession = useReviewStore((state) => state.startReviewSession)

  useEffect(() => {
    // 加载今日任务和统计
    fetchTodayReviews()
    refreshReviewStats()

    return () => {
      clearReviewData()
    }
  }, [fetchTodayReviews, refreshReviewStats, clearReviewData])

  // 更新托盘待复习数量
  useEffect(() => {
    if (reviewStats) {
      window.api.tray.updateReviewCount(reviewStats.todayRemaining).catch(err => {
        console.error('Failed to update tray review count:', err)
      })
    }
  }, [reviewStats])

  const handleStartReview = () => {
    if (todayReviews.length === 0) {
      return
    }

    startReviewSession(todayReviews)
    navigate('/review/session')
  }

  if (loading && !todayReviews.length) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载今日复习任务..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="加载失败"
          description={error.message}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => fetchTodayReviews()}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', height: '100%', overflow: 'auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 复习汇总卡片 */}
        <ReviewSummaryCard stats={reviewStats} />

        {/* 开始复习按钮 */}
        {todayReviews.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleStartReview}
              style={{ height: '48px', padding: '0 48px', fontSize: '16px' }}
            >
              开始复习（{todayReviews.length}个任务）
            </Button>
          </div>
        )}

        {/* 复习任务列表 */}
        <ReviewTaskList tasks={todayReviews} />
      </Space>
    </div>
  )
}

export default ReviewDashboardPage







