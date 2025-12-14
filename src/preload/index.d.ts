import { ElectronAPI } from '@electron-toolkit/preload'

/**
 * Knowledge实体类型
 */
export interface Knowledge {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  frequencyCoefficient: number
}

/**
 * Tag实体类型
 */
export interface Tag {
  id: string
  name: string
  createdAt: number
}

/**
 * Category实体类型
 */
export interface Category {
  id: string
  name: string
  isCustom: boolean
  createdAt: number
}

/**
 * ReviewHistory实体类型
 */
export interface ReviewHistory {
  id: string
  knowledgeId: string
  rating: number
  reviewedAt: number
  nextReviewAt: number
}

/**
 * ReviewTask类型（扩展Knowledge，包含优先级信息）
 */
export interface ReviewTask extends Knowledge {
  priority: 'overdue' | 'due_today' | 'advance'
  daysOverdue?: number
  dueTime: number
}

/**
 * Review统计数据类型
 */
export interface ReviewStatistics {
  totalReviews: number
  avgRating: number
  lastReviewAt: number | null
}

/**
 * ReviewStats接口（今日任务统计）
 */
export interface ReviewStats {
  todayTotal: number
  todayCompleted: number
  todayRemaining: number
  overdueCount: number
  completionRate: number
}

/**
 * ReviewRatingResult接口
 */
export interface ReviewRatingResult {
  knowledge: Knowledge
  nextReviewAt: number
  intervalDays: number
  reviewHistory: ReviewHistory
}

/**
 * ReviewSessionStats接口
 */
export interface ReviewSessionStats {
  totalCount: number
  averageRating: number
  duration: number
  ratingDistribution: {
    rating1: number
    rating2: number
    rating3: number
    rating4: number
    rating5: number
  }
  nextReviewPreview: {
    tomorrow: number
    nextWeek: number
  }
}

/**
 * Diary实体类型
 */
export interface Diary {
  id: string
  date: string // YYYY-MM-DD
  content: string
  createdAt: number
  updatedAt: number
  syncStatus?: string
}

/**
 * DiaryPreview类型
 */
export interface DiaryPreview {
  date: string
  preview: string
  hasFullContent: boolean
}

/**
 * Reminder实体类型
 */
export interface Reminder {
  id: string
  title: string
  content?: string
  dueDate: number
  completed: boolean
  completedAt?: number
  createdAt: number
  updatedAt: number
  syncStatus?: string
}

/**
 * CreateReminderDTO类型
 */
export interface CreateReminderDTO {
  title: string
  content?: string
  dueDate: number
}

/**
 * UpdateReminderDTO类型
 */
export interface UpdateReminderDTO {
  title?: string
  content?: string
  dueDate?: number
}

/**
 * ReminderFilter类型
 */
export interface ReminderFilter {
  completed?: boolean
  startDate?: number
  endDate?: number
}

/**
 * DayActivity接口（热力图数据）
 */
export interface DayActivity {
  date: string
  knowledgeCount: number
  reviewCount: number
  totalActivity: number
  heatLevel: number
}

/**
 * DayDetail接口（日期详情）
 */
export interface DayDetail {
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

/**
 * WeekData接口（周视图数据）
 */
export interface WeekData {
  year: number
  week: number
  days: DayData[]
}

/**
 * DayData接口（周视图单日数据）
 */
export interface DayData {
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

/**
 * YearData接口（年视图数据）
 */
export interface YearData {
  year: number
  heatmap: Record<string, number> // 日期 -> 活动数
  stats: YearStats
}

/**
 * YearStats接口（年度统计）
 */
export interface YearStats {
  totalStudyDays: number
  longestStreak: number
  totalKnowledge: number
  totalReviews: number
}

/**
 * TodaySummary接口（今日摘要）
 */
export interface TodaySummary {
  date: string
  newKnowledgeCount: number
  pendingReviewCount: number
  completedReviewCount: number
  completionRate: number
}

/**
 * OverallStatistics接口（总体统计）
 */
export interface OverallStatistics {
  totalKnowledge: number
  masteredKnowledge: number
  masteredPercentage: number
  currentStreak: number
  longestStreak: number
  averageCompletionRate: number
}

/**
 * WeeklyStats接口（本周统计）
 */
export interface WeeklyStats {
  dates: string[]
  newKnowledge: number[]
  reviews: number[]
  completionRates: number[]
}

/**
 * IPC响应格式
 */
export interface IPCResponse<T> {
  data: T
}

/**
 * Knowledge API接口
 */
export interface KnowledgeAPI {
  create: (data: Partial<Knowledge>) => Promise<IPCResponse<Knowledge>>
  update: (id: string, data: Partial<Knowledge>) => Promise<IPCResponse<Knowledge>>
  delete: (id: string) => Promise<IPCResponse<boolean>>
  findById: (id: string) => Promise<IPCResponse<Knowledge | null>>
  getById: (id: string) => Promise<IPCResponse<Knowledge>>
  findAll: () => Promise<IPCResponse<Knowledge[]>>
  search: (keyword: string) => Promise<IPCResponse<Knowledge[]>>
  filter: (filters: {
    tags?: string[]
    categoryId?: string
    status?: 'learning' | 'mastered'
    dateFrom?: string
    dateTo?: string
    keyword?: string
  }) => Promise<IPCResponse<Knowledge[]>>
  findDueToday: () => Promise<IPCResponse<Knowledge[]>>
  addTags: (knowledgeId: string, tagIds: string[]) => Promise<IPCResponse<boolean>>
  removeTags: (knowledgeId: string, tagIds: string[]) => Promise<IPCResponse<boolean>>
  getTags: (knowledgeId: string) => Promise<IPCResponse<Tag[]>>
  filterByTags: (tagIds: string[]) => Promise<IPCResponse<Knowledge[]>>
  filterByCategory: (categoryId: string) => Promise<IPCResponse<Knowledge[]>>
  updateFrequency: (id: string, frequency: number) => Promise<IPCResponse<Knowledge>>
  markForReview: (id: string) => Promise<IPCResponse<Knowledge>>
}

/**
 * Tag API接口
 */
export interface TagAPI {
  getAll: () => Promise<IPCResponse<Tag[]>>
  findOrCreate: (names: string[]) => Promise<IPCResponse<Tag[]>>
  getUsageCount: (tagId: string) => Promise<IPCResponse<number>>
}

/**
 * Category API接口
 */
export interface CategoryAPI {
  getAll: () => Promise<IPCResponse<Category[]>>
  createCustom: (name: string) => Promise<IPCResponse<Category>>
  deleteCustom: (id: string) => Promise<IPCResponse<boolean>>
}

/**
 * Review API接口
 */
export interface ReviewAPI {
  create: (knowledgeId: string, rating: number) => Promise<IPCResponse<ReviewHistory>>
  findDue: (date: number) => Promise<IPCResponse<ReviewHistory[]>>
  findByKnowledge: (knowledgeId: string) => Promise<IPCResponse<ReviewHistory[]>>
  getByKnowledge: (knowledgeId: string, limit?: number) => Promise<IPCResponse<ReviewHistory[]>>
  getStatistics: (knowledgeId: string) => Promise<IPCResponse<ReviewStatistics>>
  getTodayTasks: () => Promise<IPCResponse<ReviewTask[]>>
  getStats: () => Promise<IPCResponse<ReviewStats>>
  submitRating: (
    knowledgeId: string,
    rating: number,
    reviewedAt: number
  ) => Promise<IPCResponse<ReviewRatingResult>>
  getSessionStats: (
    completedIds: string[],
    startTime: number
  ) => Promise<IPCResponse<ReviewSessionStats>>
}

/**
 * Settings API接口
 */
export interface SettingsAPI {
  get: (key: string) => Promise<IPCResponse<any>>
  update: (key: string, value: any) => Promise<IPCResponse<void>>
}

/**
 * Statistics API接口
 */
export interface StatisticsAPI {
  getMonthActivities: (year: number, month: number) => Promise<IPCResponse<DayActivity[]>>
  getDayActivities: (date: string) => Promise<IPCResponse<DayDetail>>
  getWeekData: (year: number, week: number) => Promise<IPCResponse<WeekData>>
  getYearData: (year: number) => Promise<IPCResponse<YearData>>
  getTodaySummary: () => Promise<IPCResponse<TodaySummary>>
  getOverallStatistics: () => Promise<IPCResponse<OverallStatistics>>
  getWeeklyStatistics: () => Promise<IPCResponse<WeeklyStats>>
}

/**
 * Diary API接口
 */
export interface DiaryAPI {
  getByDate: (date: string) => Promise<IPCResponse<Diary | null>>
  getByDateRange: (startDate: string, endDate: string) => Promise<IPCResponse<Diary[]>>
  getAllDates: () => Promise<IPCResponse<string[]>>
  save: (data: { date: string; content: string }) => Promise<IPCResponse<Diary>>
  delete: (date: string) => Promise<IPCResponse<null>>
  getPreview: (date: string) => Promise<IPCResponse<DiaryPreview | null>>
}

/**
 * Reminder API接口
 */
export interface ReminderAPI {
  getById: (id: string) => Promise<IPCResponse<Reminder | null>>
  getAll: (filter?: ReminderFilter) => Promise<IPCResponse<Reminder[]>>
  getPending: () => Promise<IPCResponse<Reminder[]>>
  create: (data: CreateReminderDTO) => Promise<IPCResponse<Reminder>>
  update: (id: string, data: UpdateReminderDTO) => Promise<IPCResponse<Reminder>>
  markComplete: (id: string) => Promise<IPCResponse<Reminder>>
  delete: (id: string) => Promise<IPCResponse<null>>
  getPendingCount: () => Promise<IPCResponse<number>>
}

/**
 * 全局API接口
 */
export interface API {
  knowledge: KnowledgeAPI
  tags: TagAPI
  categories: CategoryAPI
  review: ReviewAPI
  settings: SettingsAPI
  statistics: StatisticsAPI
  diary: DiaryAPI
  reminder: ReminderAPI
}

/**
 * 声明全局window对象类型
 */
declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
