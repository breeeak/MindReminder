import { ipcMain } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { getReviewRepository } from '../database/repositories'
import { ReviewService } from '../services/ReviewService'
import log from '../utils/logger'

/**
 * 注册Review相关IPC处理器
 */
export function registerReviewHandlers(): void {
  // review:create - 创建复习记录
  ipcMain.handle(IPCChannel.REVIEW_CREATE, async (_event, knowledgeId: string, rating: number) => {
    try {
      log.info('IPC: review:create', { knowledgeId, rating })
      const repo = getReviewRepository()
      // 默认下次复习时间为明天
      const nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const review = repo.createReview(knowledgeId, rating, nextReviewDate)
      return { data: review }
    } catch (error) {
      log.error('IPC: review:create failed', { error, knowledgeId, rating })
      throw error
    }
  })

  // review:findDue - 查询到期复习记录
  ipcMain.handle(IPCChannel.REVIEW_FIND_DUE, async (_event, date: number) => {
    try {
      log.debug('IPC: review:findDue', { date })
      const repo = getReviewRepository()
      const reviews = repo.findDueReviews(new Date(date))
      return { data: reviews }
    } catch (error) {
      log.error('IPC: review:findDue failed', { error, date })
      throw error
    }
  })

  // review:findByKnowledge - 查询知识点的复习记录
  ipcMain.handle(IPCChannel.REVIEW_FIND_BY_KNOWLEDGE, async (_event, knowledgeId: string) => {
    try {
      log.debug('IPC: review:findByKnowledge', { knowledgeId })
      const repo = getReviewRepository()
      const reviews = repo.findByKnowledgeId(knowledgeId)
      return { data: reviews }
    } catch (error) {
      log.error('IPC: review:findByKnowledge failed', { error, knowledgeId })
      throw error
    }
  })

  // review:getByKnowledge - 获取知识点的复习历史（带limit）
  ipcMain.handle(
    IPCChannel.REVIEW_GET_BY_KNOWLEDGE,
    async (_event, knowledgeId: string, limit?: number) => {
      try {
        log.debug('IPC: review:getByKnowledge', { knowledgeId, limit })
        const repo = getReviewRepository()
        const reviews = repo.findByKnowledgeId(knowledgeId, limit)
        return { data: reviews }
      } catch (error) {
        log.error('IPC: review:getByKnowledge failed', { error, knowledgeId })
        throw error
      }
    }
  )

  // review:getStatistics - 获取复习统计
  ipcMain.handle(IPCChannel.REVIEW_GET_STATISTICS, async (_event, knowledgeId: string) => {
    try {
      log.debug('IPC: review:getStatistics', { knowledgeId })
      const repo = getReviewRepository()
      const stats = repo.getStatistics(knowledgeId)
      return { data: stats }
    } catch (error) {
      log.error('IPC: review:getStatistics failed', { error, knowledgeId })
      throw error
    }
  })

  // review:getTodayTasks - 获取今日复习任务列表
  ipcMain.handle(IPCChannel.REVIEW_GET_TODAY_TASKS, async (_event) => {
    try {
      log.info('IPC: review:getTodayTasks')
      const reviewService = ReviewService.getInstance()
      const tasks = reviewService.getTodayReviewTasks()
      log.info('IPC: review:getTodayTasks - success', { count: tasks.length })
      return { data: tasks }
    } catch (error) {
      log.error('IPC: review:getTodayTasks failed', { error })
      throw error
    }
  })

  // review:getStats - 获取复习统计
  ipcMain.handle(IPCChannel.REVIEW_GET_STATS, async (_event) => {
    try {
      log.info('IPC: review:getStats')
      const repo = getReviewRepository()
      const stats = repo.getReviewStats()
      return { data: stats }
    } catch (error) {
      log.error('IPC: review:getStats failed', { error })
      throw error
    }
  })

  // review:submitRating - 提交复习评分
  ipcMain.handle(
    IPCChannel.REVIEW_SUBMIT_RATING,
    async (_event, knowledgeId: string, rating: number, reviewedAt: number) => {
      try {
        log.info('IPC: review:submitRating', { knowledgeId, rating })
        const reviewService = ReviewService.getInstance()
        const result = reviewService.processReviewRating(knowledgeId, rating, reviewedAt)
        return { data: result }
      } catch (error) {
        log.error('IPC: review:submitRating failed', { error, knowledgeId, rating })
        throw error
      }
    }
  )

  // review:getSessionStats - 获取会话统计
  ipcMain.handle(
    IPCChannel.REVIEW_GET_SESSION_STATS,
    async (_event, completedIds: string[], startTime: number) => {
      try {
        log.info('IPC: review:getSessionStats', { count: completedIds.length })
        const reviewService = ReviewService.getInstance()
        const stats = reviewService.getSessionStats(completedIds, startTime)
        return { data: stats }
      } catch (error) {
        log.error('IPC: review:getSessionStats failed', { error })
        throw error
      }
    }
  )

  log.info('Review IPC handlers registered')
}
