import { create } from 'zustand'
import type { Diary, CreateDiaryDTO } from '../types'
import { message } from 'antd'

interface DiaryStore {
  // 状态
  currentDiary: Diary | null
  diaries: Diary[] // 所有日记列表
  diaryDates: string[] // 所有有日记的日期列表
  loading: boolean
  saving: boolean

  // Actions
  fetchDiaryByDate: (date: string) => Promise<void>
  fetchAllDiaries: () => Promise<void>
  saveDiary: (data: CreateDiaryDTO) => Promise<void>
  deleteDiary: (date: string) => Promise<void>
  fetchAllDiaryDates: () => Promise<void>
  clearCurrentDiary: () => void
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  // 初始状态
  currentDiary: null,
  diaries: [],
  diaryDates: [],
  loading: false,
  saving: false,

  // 根据日期获取日记
  fetchDiaryByDate: async (date: string) => {
    set({ loading: true })
    try {
      const response = await window.api.diary.getByDate(date)
      set({ currentDiary: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch diary:', error)
      message.error('获取日记失败')
      set({ loading: false })
      throw error
    }
  },

  // 获取所有日记
  fetchAllDiaries: async () => {
    set({ loading: true })
    try {
      // 获取过去一年的日记
      const startDate = new Date()
      startDate.setFullYear(startDate.getFullYear() - 1)
      const endDate = new Date()
      
      const response = await window.api.diary.getByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      set({ diaries: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch all diaries:', error)
      message.error('获取日记列表失败')
      set({ loading: false })
      throw error
    }
  },

  // 保存日记（创建或更新）
  saveDiary: async (data: CreateDiaryDTO) => {
    set({ saving: true })
    try {
      const response = await window.api.diary.save(data)
      set({ currentDiary: response.data, saving: false })

      // 刷新日记日期列表
      await get().fetchAllDiaryDates()

      message.success('日记保存成功')
    } catch (error) {
      console.error('Failed to save diary:', error)
      message.error('保存日记失败')
      set({ saving: false })
      throw error
    }
  },

  // 删除日记
  deleteDiary: async (date: string) => {
    set({ loading: true })
    try {
      await window.api.diary.delete(date)
      set({ currentDiary: null, loading: false })

      // 刷新日记日期列表
      await get().fetchAllDiaryDates()

      message.success('日记删除成功')
    } catch (error) {
      console.error('Failed to delete diary:', error)
      message.error('删除日记失败')
      set({ loading: false })
      throw error
    }
  },

  // 获取所有有日记的日期
  fetchAllDiaryDates: async () => {
    try {
      const response = await window.api.diary.getAllDates()
      set({ diaryDates: response.data })
    } catch (error) {
      console.error('Failed to fetch diary dates:', error)
      // 不显示错误提示（静默失败）
    }
  },

  // 清空当前日记
  clearCurrentDiary: () => {
    set({ currentDiary: null })
  }
}))






