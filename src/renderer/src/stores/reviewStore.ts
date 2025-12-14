import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { message } from 'antd'

// 导入类型定义
export interface ReviewTask {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  frequencyCoefficient: number
  priority: 'overdue' | 'due_today' | 'advance'
  daysOverdue?: number
  dueTime: number
}

export interface ReviewStats {
  todayTotal: number
  todayCompleted: number
  todayRemaining: number
  overdueCount: number
  completionRate: number
}

export interface ReviewSession {
  tasks: ReviewTask[]
  currentIndex: number
  showAnswer: boolean
  completedIds: string[]
  startTime: number
}

export interface ReviewSessionStats {
  totalCount: number
  averageRating: number
  duration: number
  ratingDistribution: {
    rating1: number
    rating2: number
    rating3: number
    rating4: number
    rating5: number
  }
  nextReviewPreview: {
    tomorrow: number
    nextWeek: number
  }
}

interface ReviewStore {
  // 今日复习任务
  todayReviews: ReviewTask[]
  reviewStats: ReviewStats | null
  loading: boolean
  error: Error | null

  // 复习会话状态
  currentSession: ReviewSession | null
  sessionStats: ReviewSessionStats | null
  submitting: boolean

  // 操作方法
  fetchTodayReviews: () => Promise<void>
  refreshReviewStats: () => Promise<void>
  markForImmediateReview: (id: string) => Promise<void>
  clearReviewData: () => void

  // 会话操作方法
  startReviewSession: (tasks: ReviewTask[]) => void
  showAnswer: () => void
  submitRating: (rating: number) => Promise<void>
  nextReview: () => void
  exitSession: () => void
  endSession: () => Promise<void>
}

export const useReviewStore = create<ReviewStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      todayReviews: [],
      reviewStats: null,
      loading: false,
      error: null,

      // 会话状态
      currentSession: null,
      sessionStats: null,
      submitting: false,

      // 获取今日复习任务
      fetchTodayReviews: async () => {
        set({ loading: true, error: null })
        try {
          const response = await window.api.review.getTodayTasks()
          set({
            todayReviews: response.data as ReviewTask[],
            loading: false
          })
        } catch (error) {
          console.error('Failed to fetch today reviews:', error)
          set({
            error: error as Error,
            loading: false
          })
          throw error
        }
      },

      // 刷新复习统计
      refreshReviewStats: async () => {
        try {
          const response = await window.api.review.getStats()
          set({ reviewStats: response.data })
        } catch (error) {
          console.error('Failed to refresh review stats:', error)
          throw error
        }
      },

      // 标记知识点为立即复习
      markForImmediateReview: async (id: string) => {
        try {
          await window.api.knowledge.markForReview(id)

          // 刷新今日任务列表和统计
          await Promise.all([get().fetchTodayReviews(), get().refreshReviewStats()])

          message.success('已加入今日复习任务')
        } catch (error) {
          console.error('Failed to mark for immediate review:', error)
          message.error('标记失败，请重试')
          throw error
        }
      },

      // 清除复习数据
      clearReviewData: () => {
        set({
          todayReviews: [],
          reviewStats: null,
          error: null
        })
      },

      // 开始复习会话
      startReviewSession: (tasks: ReviewTask[]) => {
        if (tasks.length === 0) {
          message.warning('没有待复习任务')
          return
        }

        set({
          currentSession: {
            tasks,
            currentIndex: 0,
            showAnswer: false,
            completedIds: [],
            startTime: Date.now()
          }
        })
      },

      // 显示答案
      showAnswer: () => {
        const session = get().currentSession
        if (!session) return

        set({
          currentSession: {
            ...session,
            showAnswer: true
          }
        })
      },

      // 提交评分
      submitRating: async (rating: number) => {
        const session = get().currentSession
        if (!session || !session.showAnswer || get().submitting) return

        const currentTask = session.tasks[session.currentIndex]
        if (!currentTask) return

        set({ submitting: true })

        try {
          // 调用IPC提交评分
          await window.api.review.submitRating(currentTask.id, rating, Date.now())

          // 显示反馈动画
          message.success({
            content: '✓ 已记录',
            duration: 0.5
          })

          // 等待动画完成
          await new Promise((resolve) => setTimeout(resolve, 500))

          // 进入下一题
          get().nextReview()
        } catch (error) {
          console.error('Failed to submit rating:', error)
          message.error('评分失败，请重试')
        } finally {
          set({ submitting: false })
        }
      },

      // 下一题
      nextReview: () => {
        const session = get().currentSession
        if (!session) return

        const currentTask = session.tasks[session.currentIndex]
        const newCompletedIds = [...session.completedIds, currentTask.id]
        const nextIndex = session.currentIndex + 1

        // 检查是否完成所有任务
        if (nextIndex >= session.tasks.length) {
          get().endSession()
          return
        }

        // 进入下一题
        set({
          currentSession: {
            ...session,
            currentIndex: nextIndex,
            showAnswer: false,
            completedIds: newCompletedIds
          }
        })
      },

      // 退出会话（不保存统计）
      exitSession: () => {
        set({ currentSession: null })
      },

      // 结束会话（保存统计）
      endSession: async () => {
        const session = get().currentSession
        if (!session) return

        try {
          // 获取会话统计
          const response = await window.api.review.getSessionStats(
            session.completedIds,
            session.startTime
          )

          set({
            sessionStats: response.data,
            currentSession: null
          })

          // 刷新今日任务和统计
          await Promise.all([get().fetchTodayReviews(), get().refreshReviewStats()])
        } catch (error) {
          console.error('Failed to end session:', error)
          message.error('结束会话失败')
        }
      }
    }),
    { name: 'ReviewStore' }
  )
)



