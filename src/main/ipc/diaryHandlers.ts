import { ipcMain } from 'electron'
import { getDiaryRepository } from '../database/repositories'
import { DiaryService } from '../services/DiaryService'
import log from '../utils/logger'

export function registerDiaryHandlers(): void {
  // 根据日期获取日记
  ipcMain.handle('diary:getByDate', async (_event, date: string) => {
    try {
      const repo = getDiaryRepository()
      const service = new DiaryService(repo)
      const diary = service.getByDate(date)
      return { data: diary }
    } catch (error) {
      log.error('IPC diary:getByDate failed:', { date, error })
      throw error
    }
  })

  // 获取日期范围内的日记
  ipcMain.handle('diary:getByDateRange', async (_event, startDate: string, endDate: string) => {
    try {
      const repo = getDiaryRepository()
      const service = new DiaryService(repo)
      const diaries = service.getByDateRange(startDate, endDate)
      return { data: diaries }
    } catch (error) {
      log.error('IPC diary:getByDateRange failed:', { startDate, endDate, error })
      throw error
    }
  })

  // 获取所有有日记的日期
  ipcMain.handle('diary:getAllDates', async () => {
    try {
      const repo = getDiaryRepository()
      const service = new DiaryService(repo)
      const dates = service.getAllDiaryDates()
      return { data: dates }
    } catch (error) {
      log.error('IPC diary:getAllDates failed:', error)
      throw error
    }
  })

  // 保存日记（创建或更新）
  ipcMain.handle('diary:save', async (_event, data: { date: string; content: string }) => {
    try {
      const repo = getDiaryRepository()
      const service = new DiaryService(repo)
      const diary = service.save(data)
      return { data: diary }
    } catch (error) {
      log.error('IPC diary:save failed:', { date: data.date, error })
      throw error
    }
  })

  // 删除日记
  ipcMain.handle('diary:delete', async (_event, date: string) => {
    try {
      const repo = getDiaryRepository()
      const service = new DiaryService(repo)
      service.delete(date)
      return { data: null }
    } catch (error) {
      log.error('IPC diary:delete failed:', { date, error })
      throw error
    }
  })

  // 获取日记预览
  ipcMain.handle('diary:getPreview', async (_event, date: string) => {
    try {
      const repo = getDiaryRepository()
      const service = new DiaryService(repo)
      const preview = service.getPreview(date)
      return { data: preview }
    } catch (error) {
      log.error('IPC diary:getPreview failed:', { date, error })
      throw error
    }
  })

  log.info('Diary IPC handlers registered')
}
