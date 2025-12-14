import { ipcMain } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { StatisticsService } from '../services/StatisticsService'
import { getKnowledgeRepository, getReviewRepository } from '../database/repositories'
import log from '../utils/logger'

/**
 * 注册统计相关的IPC处理器
 */
export function registerStatisticsHandlers(): void {
  log.info('[IPC] Registering statistics handlers')

  const knowledgeRepository = getKnowledgeRepository()
  const reviewRepository = getReviewRepository()
  const statisticsService = new StatisticsService(knowledgeRepository, reviewRepository)

  // 获取月度活动数据
  ipcMain.handle(IPCChannel.STATISTICS_GET_MONTH, async (_event, year: number, month: number) => {
    try {
      log.debug('[IPC] statistics:getMonth', { year, month })
      const data = statisticsService.getMonthActivities(year, month)
      return { data }
    } catch (error) {
      log.error('[IPC] statistics:getMonth error:', error)
      throw error
    }
  })

  // 获取单日活动详情
  ipcMain.handle(IPCChannel.STATISTICS_GET_DAY, async (_event, date: string) => {
    try {
      log.debug('[IPC] statistics:getDay', { date })
      const data = statisticsService.getDayActivities(date)
      return { data }
    } catch (error) {
      log.error('[IPC] statistics:getDay error:', error)
      throw error
    }
  })

  // 获取周视图数据
  ipcMain.handle(IPCChannel.STATISTICS_GET_WEEK, async (_event, year: number, week: number) => {
    try {
      log.debug('[IPC] statistics:getWeek', { year, week })
      const data = statisticsService.getWeekData(year, week)
      return { data }
    } catch (error) {
      log.error('[IPC] statistics:getWeek error:', error)
      throw error
    }
  })

  // 获取年视图数据
  ipcMain.handle(IPCChannel.STATISTICS_GET_YEAR, async (_event, year: number) => {
    try {
      log.debug('[IPC] statistics:getYear', { year })
      const data = statisticsService.getYearData(year)

      // Map转换为对象以便序列化
      const serializedData = {
        ...data,
        heatmap: Object.fromEntries(data.heatmap)
      }

      return { data: serializedData }
    } catch (error) {
      log.error('[IPC] statistics:getYear error:', error)
      throw error
    }
  })

  // 获取今日摘要
  ipcMain.handle(IPCChannel.STATISTICS_GET_TODAY_SUMMARY, async () => {
    try {
      log.debug('[IPC] statistics:getTodaySummary')
      const data = statisticsService.getTodaySummary()
      return { data }
    } catch (error) {
      log.error('[IPC] statistics:getTodaySummary error:', error)
      throw error
    }
  })

  // 获取总体统计
  ipcMain.handle(IPCChannel.STATISTICS_GET_OVERALL, async () => {
    try {
      log.debug('[IPC] statistics:getOverallStatistics')
      const data = statisticsService.getOverallStatistics()
      return { data }
    } catch (error) {
      log.error('[IPC] statistics:getOverallStatistics error:', error)
      throw error
    }
  })

  // 获取本周统计
  ipcMain.handle(IPCChannel.STATISTICS_GET_WEEKLY, async () => {
    try {
      log.debug('[IPC] statistics:getWeeklyStatistics')
      const data = statisticsService.getWeeklyStatistics()
      return { data }
    } catch (error) {
      log.error('[IPC] statistics:getWeeklyStatistics error:', error)
      throw error
    }
  })

  log.info('[IPC] Statistics handlers registered successfully')
}



