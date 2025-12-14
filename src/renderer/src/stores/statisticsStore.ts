import { create } from 'zustand'
import type { TodaySummary, OverallStatistics, WeeklyStats } from '../types/statistics'

interface StatisticsStore {
  // 今日摘要
  todaySummary: TodaySummary | null
  todaySummaryLoading: boolean
  todaySummaryError: Error | null

  // 总体统计
  overallStatistics: OverallStatistics | null
  overallStatisticsLoading: boolean
  overallStatisticsError: Error | null

  // 本周统计
  weeklyStatistics: WeeklyStats | null
  weeklyStatisticsLoading: boolean
  weeklyStatisticsError: Error | null

  // Actions
  fetchTodaySummary: () => Promise<void>
  fetchOverallStatistics: () => Promise<void>
  fetchWeeklyStatistics: () => Promise<void>
  refreshAllStatistics: () => Promise<void>
}

export const useStatisticsStore = create<StatisticsStore>((set, get) => ({
  // 初始状态
  todaySummary: null,
  todaySummaryLoading: false,
  todaySummaryError: null,

  overallStatistics: null,
  overallStatisticsLoading: false,
  overallStatisticsError: null,

  weeklyStatistics: null,
  weeklyStatisticsLoading: false,
  weeklyStatisticsError: null,

  // Actions
  fetchTodaySummary: async () => {
    set({ todaySummaryLoading: true, todaySummaryError: null })
    try {
      const response = await window.api.statistics.getTodaySummary()
      set({
        todaySummary: response.data,
        todaySummaryLoading: false
      })
    } catch (error) {
      set({
        todaySummaryError: error as Error,
        todaySummaryLoading: false
      })
      console.error('Failed to fetch today summary:', error)
    }
  },

  fetchOverallStatistics: async () => {
    set({ overallStatisticsLoading: true, overallStatisticsError: null })
    try {
      const response = await window.api.statistics.getOverallStatistics()
      set({
        overallStatistics: response.data,
        overallStatisticsLoading: false
      })
    } catch (error) {
      set({
        overallStatisticsError: error as Error,
        overallStatisticsLoading: false
      })
      console.error('Failed to fetch overall statistics:', error)
    }
  },

  fetchWeeklyStatistics: async () => {
    set({ weeklyStatisticsLoading: true, weeklyStatisticsError: null })
    try {
      const response = await window.api.statistics.getWeeklyStatistics()
      set({
        weeklyStatistics: response.data,
        weeklyStatisticsLoading: false
      })
    } catch (error) {
      set({
        weeklyStatisticsError: error as Error,
        weeklyStatisticsLoading: false
      })
      console.error('Failed to fetch weekly statistics:', error)
    }
  },

  refreshAllStatistics: async () => {
    await Promise.all([
      get().fetchTodaySummary(),
      get().fetchOverallStatistics(),
      get().fetchWeeklyStatistics()
    ])
  }
}))
