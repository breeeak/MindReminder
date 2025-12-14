import { ipcMain } from 'electron'
import { getReminderRepository } from '../database/repositories'
import log from '../utils/logger'

export function registerReminderHandlers(): void {
  // 根据ID获取提醒
  ipcMain.handle('reminder:getById', async (_event, id: string) => {
    try {
      const repo = getReminderRepository()
      const reminder = repo.findById(id)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:getById failed:', { id, error })
      throw error
    }
  })

  // 获取所有提醒(支持筛选)
  ipcMain.handle('reminder:getAll', async (_event, filter?: any) => {
    try {
      const repo = getReminderRepository()
      const reminders = repo.findAll(filter)
      return { data: reminders }
    } catch (error) {
      log.error('IPC reminder:getAll failed:', { filter, error })
      throw error
    }
  })

  // 获取未完成的提醒
  ipcMain.handle('reminder:getPending', async () => {
    try {
      const repo = getReminderRepository()
      const reminders = repo.findPending()
      return { data: reminders }
    } catch (error) {
      log.error('IPC reminder:getPending failed:', error)
      throw error
    }
  })

  // 创建提醒
  ipcMain.handle('reminder:create', async (_event, data: any) => {
    try {
      const repo = getReminderRepository()

      // 验证标题
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Reminder title cannot be empty')
      }

      // 验证时间
      if (!data.dueDate || data.dueDate <= Date.now()) {
        throw new Error('Reminder due date must be in the future')
      }

      const reminder = repo.create(data)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:create failed:', { data, error })
      throw error
    }
  })

  // 更新提醒
  ipcMain.handle('reminder:update', async (_event, id: string, data: any) => {
    try {
      const repo = getReminderRepository()

      // 验证时间(如果提供)
      if (data.dueDate !== undefined && data.dueDate <= Date.now()) {
        throw new Error('Reminder due date must be in the future')
      }

      const reminder = repo.update(id, data)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:update failed:', { id, data, error })
      throw error
    }
  })

  // 标记为已完成
  ipcMain.handle('reminder:markComplete', async (_event, id: string) => {
    try {
      const repo = getReminderRepository()
      const reminder = repo.markComplete(id)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:markComplete failed:', { id, error })
      throw error
    }
  })

  // 删除提醒
  ipcMain.handle('reminder:delete', async (_event, id: string) => {
    try {
      const repo = getReminderRepository()
      repo.delete(id)
      return { data: null }
    } catch (error) {
      log.error('IPC reminder:delete failed:', { id, error })
      throw error
    }
  })

  // 获取未完成提醒数量
  ipcMain.handle('reminder:getPendingCount', async () => {
    try {
      const repo = getReminderRepository()
      const count = repo.countPending()
      return { data: count }
    } catch (error) {
      log.error('IPC reminder:getPendingCount failed:', error)
      throw error
    }
  })

  log.info('Reminder IPC handlers registered')
}
