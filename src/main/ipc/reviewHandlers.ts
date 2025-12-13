import { ipcMain } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { getReviewRepository } from '../database/repositories'
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
  
  log.info('Review IPC handlers registered')
}

