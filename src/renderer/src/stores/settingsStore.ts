import { create } from 'zustand'
import type {
  AppSettings,
  ReviewSettings,
  ReminderSettings,
  SystemSettings,
  WindowState
} from '../../../preload/index.d'

interface SettingsState {
  settings: AppSettings | null
  loading: boolean
  error: string | null

  // 操作
  loadAllSettings: () => Promise<void>
  updateReviewSettings: (settings: Partial<ReviewSettings>) => Promise<void>
  updateReminderSettings: (settings: Partial<ReminderSettings>) => Promise<void>
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>
  updateWindowState: (state: Partial<WindowState>) => Promise<void>
  resetToDefaults: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  /**
   * 加载所有设置
   */
  loadAllSettings: async () => {
    set({ loading: true, error: null })
    try {
      const response = await window.api.settings.getAll()
      set({ settings: response.data, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载设置失败'
      set({ error: errorMessage, loading: false })
      console.error('Failed to load settings:', error)
    }
  },

  /**
   * 更新复习设置
   */
  updateReviewSettings: async (settings: Partial<ReviewSettings>) => {
    set({ loading: true, error: null })
    try {
      const response = await window.api.settings.updateReview(settings)
      const currentSettings = get().settings
      if (currentSettings) {
        set({
          settings: {
            ...currentSettings,
            review: response.data
          },
          loading: false
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新复习设置失败'
      set({ error: errorMessage, loading: false })
      console.error('Failed to update review settings:', error)
      throw error
    }
  },

  /**
   * 更新提醒设置
   */
  updateReminderSettings: async (settings: Partial<ReminderSettings>) => {
    set({ loading: true, error: null })
    try {
      const response = await window.api.settings.updateReminder(settings)
      const currentSettings = get().settings
      if (currentSettings) {
        set({
          settings: {
            ...currentSettings,
            reminder: response.data
          },
          loading: false
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新提醒设置失败'
      set({ error: errorMessage, loading: false })
      console.error('Failed to update reminder settings:', error)
      throw error
    }
  },

  /**
   * 更新系统设置
   */
  updateSystemSettings: async (settings: Partial<SystemSettings>) => {
    set({ loading: true, error: null })
    try {
      const response = await window.api.settings.updateSystem(settings)
      const currentSettings = get().settings
      if (currentSettings) {
        set({
          settings: {
            ...currentSettings,
            system: response.data
          },
          loading: false
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新系统设置失败'
      set({ error: errorMessage, loading: false })
      console.error('Failed to update system settings:', error)
      throw error
    }
  },

  /**
   * 更新窗口状态
   */
  updateWindowState: async (state: Partial<WindowState>) => {
    set({ loading: true, error: null })
    try {
      const response = await window.api.settings.updateWindow(state)
      const currentSettings = get().settings
      if (currentSettings) {
        set({
          settings: {
            ...currentSettings,
            window: response.data
          },
          loading: false
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新窗口状态失败'
      set({ error: errorMessage, loading: false })
      console.error('Failed to update window state:', error)
      throw error
    }
  },

  /**
   * 重置为默认设置
   */
  resetToDefaults: async () => {
    set({ loading: true, error: null })
    try {
      const response = await window.api.settings.resetDefaults()
      set({ settings: response.data, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重置设置失败'
      set({ error: errorMessage, loading: false })
      console.error('Failed to reset settings:', error)
      throw error
    }
  }
}))




