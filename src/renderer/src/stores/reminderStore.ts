import { create } from 'zustand'
import type { Reminder, CreateReminderDTO, UpdateReminderDTO, ReminderFilter } from '../types'
import { message } from 'antd'

interface ReminderStore {
  // 状态
  reminders: Reminder[]
  currentReminder: Reminder | null
  pendingCount: number
  loading: boolean
  saving: boolean

  // Actions
  fetchAll: (filter?: ReminderFilter) => Promise<void>
  fetchPending: () => Promise<void>
  fetchPendingCount: () => Promise<void>
  createReminder: (data: CreateReminderDTO) => Promise<void>
  updateReminder: (id: string, data: UpdateReminderDTO) => Promise<void>
  markComplete: (id: string) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  setCurrentReminder: (reminder: Reminder | null) => void
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  // 初始状态
  reminders: [],
  currentReminder: null,
  pendingCount: 0,
  loading: false,
  saving: false,

  // 获取所有提醒(支持筛选)
  fetchAll: async (filter?: ReminderFilter) => {
    set({ loading: true })
    try {
      const response = await window.api.reminder.getAll(filter)
      set({ reminders: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch reminders:', error)
      message.error('获取提醒失败')
      set({ loading: false })
      throw error
    }
  },

  // 获取未完成的提醒
  fetchPending: async () => {
    set({ loading: true })
    try {
      const response = await window.api.reminder.getPending()
      set({ reminders: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch pending reminders:', error)
      message.error('获取提醒失败')
      set({ loading: false })
      throw error
    }
  },

  // 获取未完成提醒数量
  fetchPendingCount: async () => {
    try {
      const response = await window.api.reminder.getPendingCount()
      set({ pendingCount: response.data })
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
      // 静默失败
    }
  },

  // 创建提醒
  createReminder: async (data: CreateReminderDTO) => {
    set({ saving: true })
    try {
      const response = await window.api.reminder.create(data)
      set((state) => ({
        reminders: [...state.reminders, response.data],
        saving: false
      }))

      // 刷新计数
      await get().fetchPendingCount()

      message.success('提醒创建成功')
    } catch (error) {
      console.error('Failed to create reminder:', error)
      
      // 提取错误信息并显示更友好的提示
      let errorMessage = '创建提醒失败'
      if (error instanceof Error) {
        if (error.message.includes('due date must be in the future')) {
          errorMessage = '提醒时间必须是未来的时间，不能选择过去的时间'
        } else if (error.message.includes('title cannot be empty')) {
          errorMessage = '提醒标题不能为空'
        } else {
          errorMessage = error.message || '创建提醒失败'
        }
      }
      
      message.error(errorMessage)
      set({ saving: false })
      throw error
    }
  },

  // 更新提醒
  updateReminder: async (id: string, data: UpdateReminderDTO) => {
    set({ saving: true })
    try {
      const response = await window.api.reminder.update(id, data)
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? response.data : r)),
        currentReminder: state.currentReminder?.id === id ? response.data : state.currentReminder,
        saving: false
      }))

      message.success('提醒更新成功')
    } catch (error) {
      console.error('Failed to update reminder:', error)
      message.error('更新提醒失败')
      set({ saving: false })
      throw error
    }
  },

  // 标记为已完成
  markComplete: async (id: string) => {
    set({ loading: true })
    try {
      const response = await window.api.reminder.markComplete(id)
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? response.data : r)),
        currentReminder: state.currentReminder?.id === id ? response.data : state.currentReminder,
        loading: false
      }))

      // 刷新计数
      await get().fetchPendingCount()

      message.success('已标记为完成')
    } catch (error) {
      console.error('Failed to mark complete:', error)
      message.error('标记失败')
      set({ loading: false })
      throw error
    }
  },

  // 删除提醒
  deleteReminder: async (id: string) => {
    set({ loading: true })
    try {
      await window.api.reminder.delete(id)
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id),
        currentReminder: state.currentReminder?.id === id ? null : state.currentReminder,
        loading: false
      }))

      // 刷新计数
      await get().fetchPendingCount()

      message.success('提醒删除成功')
    } catch (error) {
      console.error('Failed to delete reminder:', error)
      message.error('删除提醒失败')
      set({ loading: false })
      throw error
    }
  },

  // 设置当前提醒
  setCurrentReminder: (reminder: Reminder | null) => {
    set({ currentReminder: reminder })
  }
}))
