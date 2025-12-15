import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import { useReviewStore } from '../stores/reviewStore'
import ReviewCard from '../components/ReviewCard'

/**
 * ReviewSessionPage - 复习会话页面
 * 显示复习卡片，处理复习流程
 */
const ReviewSessionPage: React.FC = () => {
  const navigate = useNavigate()
  const currentSession = useReviewStore((state) => state.currentSession)
  const exitSession = useReviewStore((state) => state.exitSession)
  const sessionStats = useReviewStore((state) => state.sessionStats)

  // 会话结束后导航到完成页面
  useEffect(() => {
    if (!currentSession && sessionStats) {
      navigate('/review/complete')
    }
  }, [currentSession, sessionStats, navigate])

  // 无会话时重定向
  useEffect(() => {
    if (!currentSession && !sessionStats) {
      navigate('/review')
    }
  }, [currentSession, sessionStats, navigate])

  // 退出确认
  const handleExit = () => {
    Modal.confirm({
      title: '确定退出吗？',
      content: '当前进度将保存，未完成的知识点将保留在今日任务中',
      onOk: () => {
        exitSession()
        navigate('/review')
      }
    })
  }

  // 键盘快捷键（ESC退出）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!currentSession) {
    return null
  }

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: '#f5f5f5',
        position: 'relative',
        overflow: 'auto'
      }}
    >
      <ReviewCard session={currentSession} onExit={handleExit} />
    </div>
  )
}

export default ReviewSessionPage






