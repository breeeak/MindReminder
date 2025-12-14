import { create } from 'zustand'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

interface DayActivity {
  date: string
  knowledgeCount: number
  reviewCount: number
  totalActivity: number
  heatLevel: number
}

interface DayDetail {
  date: string
  knowledgeList: Array<{
    id: string
    title: string
    tags: string[]
    createdAt: string
  }>
  reviewList: Array<{
    id: string
    knowledgeId: string
    knowledgeTitle: string
    rating: number
    reviewedAt: string
  }>
}

interface DayData {
  date: string
  dayOfWeek: number
  knowledgeList: Array<{
    id: string
    title: string
    tags: string[]
  }>
  reviewList: Array<{
    id: string
    knowledgeTitle: string
    rating: number
  }>
  diary?: string
  completionRate: number
}

interface WeekData {
  year: number
  week: number
  days: DayData[]
}

interface YearStats {
  totalStudyDays: number
  longestStreak: number
  totalKnowledge: number
  totalReviews: number
}

interface YearData {
  year: number
  heatmap: Record<string, number>
  stats: YearStats
}

interface CalendarState {
  // State
  currentYear: number
  currentMonth: number
  currentWeek: number
  selectedDate: string | null

  // 视图模式
  viewMode: 'month' | 'week' | 'year'

  // 月视图数据
  monthActivities: DayActivity[]

  // 周视图数据
  weekData: WeekData | null

  // 年视图数据
  yearData: YearData | null

  // 日详情
  dayDetail: DayDetail | null

  loading: boolean
  error: string | null

  // Actions
  setCurrentMonth: (year: number, month: number) => void
  fetchMonthActivities: () => Promise<void>
  selectDate: (date: string) => Promise<void>
  clearSelection: () => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void

  // 视图切换
  setViewMode: (mode: 'month' | 'week' | 'year') => void

  // 周视图操作
  setCurrentWeek: (year: number, week: number) => void
  fetchWeekData: () => Promise<void>
  goToPreviousWeek: () => void
  goToNextWeek: () => void

  // 年视图操作
  setCurrentYear: (year: number) => void
  fetchYearData: () => Promise<void>
  goToPreviousYear: () => void
  goToNextYear: () => void
}

// 从localStorage读取视图模式
const getInitialViewMode = (): 'month' | 'week' | 'year' => {
  const saved = localStorage.getItem('calendarViewMode')
  if (saved === 'week' || saved === 'year') return saved
  return 'month'
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  currentYear: dayjs().year(),
  currentMonth: dayjs().month() + 1,
  currentWeek: dayjs().isoWeek(),
  selectedDate: null,
  viewMode: getInitialViewMode(),
  monthActivities: [],
  weekData: null,
  yearData: null,
  dayDetail: null,
  loading: false,
  error: null,

  // Set current month
  setCurrentMonth: (year: number, month: number) => {
    set({ currentYear: year, currentMonth: month })
    get().fetchMonthActivities()
  },

  // Fetch month activities
  fetchMonthActivities: async () => {
    const { currentYear, currentMonth } = get()
    set({ loading: true, error: null })

    try {
      const response = await window.api.statistics.getMonthActivities(currentYear, currentMonth)
      set({ monthActivities: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch month activities:', error)
      set({
        error: '获取月度数据失败',
        loading: false
      })
    }
  },

  // Select date and fetch detail
  selectDate: async (date: string) => {
    set({ selectedDate: date, loading: true, error: null })

    try {
      const response = await window.api.statistics.getDayActivities(date)
      set({ dayDetail: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch day activities:', error)
      set({
        error: '获取日期详情失败',
        loading: false
      })
    }
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedDate: null, dayDetail: null })
  },

  // Navigate to previous month
  goToPreviousMonth: () => {
    const { currentYear, currentMonth } = get()
    const newDate = dayjs(`${currentYear}-${currentMonth}-01`).subtract(1, 'month')
    get().setCurrentMonth(newDate.year(), newDate.month() + 1)
  },

  // Navigate to next month
  goToNextMonth: () => {
    const { currentYear, currentMonth } = get()
    const newDate = dayjs(`${currentYear}-${currentMonth}-01`).add(1, 'month')
    get().setCurrentMonth(newDate.year(), newDate.month() + 1)
  },

  // Go to today
  goToToday: () => {
    const today = dayjs()
    const { viewMode } = get()
    
    if (viewMode === 'month') {
      get().setCurrentMonth(today.year(), today.month() + 1)
    } else if (viewMode === 'week') {
      get().setCurrentWeek(today.year(), today.isoWeek())
    } else if (viewMode === 'year') {
      get().setCurrentYear(today.year())
    }
  },

  // Set view mode
  setViewMode: (mode: 'month' | 'week' | 'year') => {
    set({ viewMode: mode })
    localStorage.setItem('calendarViewMode', mode)

    // 加载对应数据
    if (mode === 'week') {
      get().fetchWeekData()
    } else if (mode === 'year') {
      get().fetchYearData()
    } else {
      get().fetchMonthActivities()
    }
  },

  // Set current week
  setCurrentWeek: (year: number, week: number) => {
    set({ currentYear: year, currentWeek: week })
    get().fetchWeekData()
  },

  // Fetch week data
  fetchWeekData: async () => {
    const { currentYear, currentWeek } = get()
    set({ loading: true, error: null })

    try {
      const response = await window.api.statistics.getWeekData(currentYear, currentWeek)
      set({ weekData: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch week data:', error)
      set({
        error: '获取周数据失败',
        loading: false
      })
    }
  },

  // Navigate to previous week
  goToPreviousWeek: () => {
    const { currentYear, currentWeek } = get()
    const currentDate = dayjs().year(currentYear).isoWeek(currentWeek)
    const newDate = currentDate.subtract(1, 'week')
    get().setCurrentWeek(newDate.year(), newDate.isoWeek())
  },

  // Navigate to next week
  goToNextWeek: () => {
    const { currentYear, currentWeek } = get()
    const currentDate = dayjs().year(currentYear).isoWeek(currentWeek)
    const newDate = currentDate.add(1, 'week')
    get().setCurrentWeek(newDate.year(), newDate.isoWeek())
  },

  // Set current year
  setCurrentYear: (year: number) => {
    set({ currentYear: year })
    get().fetchYearData()
  },

  // Fetch year data
  fetchYearData: async () => {
    const { currentYear } = get()
    set({ loading: true, error: null })

    try {
      const response = await window.api.statistics.getYearData(currentYear)
      set({ yearData: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch year data:', error)
      set({
        error: '获取年度数据失败',
        loading: false
      })
    }
  },

  // Navigate to previous year
  goToPreviousYear: () => {
    const { currentYear } = get()
    get().setCurrentYear(currentYear - 1)
  },

  // Navigate to next year
  goToNextYear: () => {
    const { currentYear } = get()
    get().setCurrentYear(currentYear + 1)
  }
}))


