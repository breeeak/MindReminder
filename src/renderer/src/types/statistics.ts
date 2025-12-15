/**
 * 从 preload 导出的类型定义
 * 用于 renderer 进程
 */

// 今日摘要
export interface TodaySummary {
  date: string
  newKnowledgeCount: number
  pendingReviewCount: number
  completedReviewCount: number
  completionRate: number
}

// 总体统计
export interface OverallStatistics {
  totalKnowledge: number
  masteredKnowledge: number
  masteredPercentage: number
  currentStreak: number
  longestStreak: number
  averageCompletionRate: number
}

// 本周统计
export interface WeeklyStats {
  dates: string[]
  newKnowledge: number[]
  reviews: number[]
  completionRates: number[]
}





