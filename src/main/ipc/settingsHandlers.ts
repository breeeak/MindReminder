import { ipcMain, app } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { getSettingsRepository } from '../database/repositories'
import { SettingsService } from '../services/SettingsService'
import log from '../utils/logger'
import type {
  ReviewSettings,
  ReminderSettings,
  SystemSettings,
  WindowState
} from '../database/types/Settings'

/**
 * 注册设置相关的 IPC 处理器
 */
export function registerSettingsHandlers(): void {
  // 获取所有设置
  ipcMain.handle(IPCChannel.SETTINGS_GET_ALL, async () => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const settings = service.getAllSettings()
      return { data: settings }
    } catch (error) {
      log.error('IPC settings:getAll failed:', error)
      throw error
    }
  })

  // 获取复习设置
  ipcMain.handle(IPCChannel.SETTINGS_GET_REVIEW, async () => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const settings = service.getReviewSettings()
      return { data: settings }
    } catch (error) {
      log.error('IPC settings:getReview failed:', error)
      throw error
    }
  })

  // 更新复习设置
  ipcMain.handle(IPCChannel.SETTINGS_UPDATE_REVIEW, async (_event, settings: Partial<ReviewSettings>) => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const updated = service.updateReviewSettings(settings)
      return { data: updated }
    } catch (error) {
      log.error('IPC settings:updateReview failed:', { settings, error })
      throw error
    }
  })

  // 获取提醒设置
  ipcMain.handle(IPCChannel.SETTINGS_GET_REMINDER, async () => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const settings = service.getReminderSettings()
      return { data: settings }
    } catch (error) {
      log.error('IPC settings:getReminder failed:', error)
      throw error
    }
  })

  // 更新提醒设置
  ipcMain.handle(IPCChannel.SETTINGS_UPDATE_REMINDER, async (_event, settings: Partial<ReminderSettings>) => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const updated = service.updateReminderSettings(settings)
      return { data: updated }
    } catch (error) {
      log.error('IPC settings:updateReminder failed:', { settings, error })
      throw error
    }
  })

  // 获取系统设置
  ipcMain.handle(IPCChannel.SETTINGS_GET_SYSTEM, async () => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const settings = service.getSystemSettings()
      return { data: settings }
    } catch (error) {
      log.error('IPC settings:getSystem failed:', error)
      throw error
    }
  })

  // 更新系统设置
  ipcMain.handle(IPCChannel.SETTINGS_UPDATE_SYSTEM, async (_event, settings: Partial<SystemSettings>) => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const updated = service.updateSystemSettings(settings)
      
      // 如果更新了开机自启动设置，立即应用
      if (settings.autoLaunch !== undefined) {
        app.setLoginItemSettings({
          openAtLogin: settings.autoLaunch,
          openAsHidden: settings.autoLaunch
        })
        log.info('Auto-launch setting updated:', settings.autoLaunch)
      }
      
      return { data: updated }
    } catch (error) {
      log.error('IPC settings:updateSystem failed:', { settings, error })
      throw error
    }
  })

  // 获取窗口状态
  ipcMain.handle(IPCChannel.SETTINGS_GET_WINDOW, async () => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const state = service.getWindowState()
      return { data: state }
    } catch (error) {
      log.error('IPC settings:getWindow failed:', error)
      throw error
    }
  })

  // 更新窗口状态
  ipcMain.handle(IPCChannel.SETTINGS_UPDATE_WINDOW, async (_event, state: Partial<WindowState>) => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const updated = service.updateWindowState(state)
      return { data: updated }
    } catch (error) {
      log.error('IPC settings:updateWindow failed:', { state, error })
      throw error
    }
  })

  // 重置为默认设置
  ipcMain.handle(IPCChannel.SETTINGS_RESET_DEFAULTS, async () => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const settings = service.resetToDefaults()
      return { data: settings }
    } catch (error) {
      log.error('IPC settings:resetDefaults failed:', error)
      throw error
    }
  })

  // 获取单个设置值
  ipcMain.handle(IPCChannel.SETTINGS_GET, async (_event, key: string) => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      const value = service.get(key)
      return { data: value }
    } catch (error) {
      log.error('IPC settings:get failed:', { key, error })
      throw error
    }
  })

  // 设置单个设置值
  ipcMain.handle(IPCChannel.SETTINGS_SET, async (_event, key: string, value: string) => {
    try {
      const repo = getSettingsRepository()
      const service = new SettingsService(repo)
      service.set(key, value)
      return { data: null }
    } catch (error) {
      log.error('IPC settings:set failed:', { key, value, error })
      throw error
    }
  })
}




