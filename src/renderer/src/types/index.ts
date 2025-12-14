/**
 * 共享类型定义
 */

/**
 * Knowledge 实体类型（与IPC API保持一致）
 */
export interface Knowledge {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  frequencyCoefficient: number
  masteryStatus?: string
  lastReviewAt?: number
  nextReviewAt?: number
  reviewCount?: number
  masteredAt?: number
  syncStatus?: string
  category?: string
}

/**
 * Tag 实体类型
 */
export interface Tag {
  id: string
  name: string
  createdAt: number
}

/**
 * Category 实体类型
 */
export interface Category {
  id: string
  name: string
  isCustom: boolean
  createdAt: number
}

/**
 * ReviewHistory 实体类型
 */
export interface ReviewHistory {
  id: string
  knowledgeId: string
  rating: number
  reviewedAt: number
  nextReviewAt: number
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
 * Diary 实体类型
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
 * CreateDiaryDTO 类型
 */
export interface CreateDiaryDTO {
  date: string
  content: string
}

/**
 * DiaryPreview 类型
 */
export interface DiaryPreview {
  date: string
  preview: string
  hasFullContent: boolean
}

/**
 * Reminder 实体类型
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
 * CreateReminderDTO 类型
 */
export interface CreateReminderDTO {
  title: string
  content?: string
  dueDate: number
}

/**
 * UpdateReminderDTO 类型
 */
export interface UpdateReminderDTO {
  title?: string
  content?: string
  dueDate?: number
}

/**
 * ReminderFilter 类型
 */
export interface ReminderFilter {
  completed?: boolean
  startDate?: number
  endDate?: number
}

/**
 * 应用视图类型
 */
export type AppView = 'calendar' | 'list' | 'detail'

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark'
