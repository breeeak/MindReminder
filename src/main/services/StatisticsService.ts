import { KnowledgeRepository } from '../database/repositories/KnowledgeRepository'
import { ReviewRepository } from '../database/repositories/ReviewRepository'
import dayjs from 'dayjs'
import log from '../utils/logger'

/**
 * 日度活动数据（热力图）
 */
export interface DayActivity {
  date: string
  knowledgeCount: number
  reviewCount: number
  totalActivity: number
  heatLevel: number // 0-5
}

/**
 * 日期详情数据
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
 * 周视图数据
 */
export interface WeekData {
  year: number
  week: number
  days: DayData[]
}

/**
 * 单日数据（周视图使用）
 */
export interface DayData {
  date: string
  dayOfWeek: number // 0-6（周日到周六）
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
 * 年视图数据
 */
export interface YearData {
  year: number
  heatmap: Map<string, number> // 日期 -> 活动数
  stats: YearStats
}

/**
 * 年度统计
 */
export interface YearStats {
  totalStudyDays: number
  longestStreak: number
  totalKnowledge: number
  totalReviews: number
}

/**
 * 今日摘要数据
 */
export interface TodaySummary {
  date: string
  newKnowledgeCount: number
  pendingReviewCount: number
  completedReviewCount: number
  completionRate: number
}

/**
 * 总体统计数据
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
 * 本周统计数据
 */
export interface WeeklyStats {
  dates: string[]
  newKnowledge: number[]
  reviews: number[]
  completionRates: number[]
}

/**
 * 统计服务
 * 提供学习活动统计和日历热力图数据
 */
export class StatisticsService {
  private knowledgeRepo: KnowledgeRepository
  private reviewRepo: ReviewRepository

  constructor(knowledgeRepo: KnowledgeRepository, reviewRepo: ReviewRepository) {
    this.knowledgeRepo = knowledgeRepo
    this.reviewRepo = reviewRepo
  }

  /**
   * 获取月度活动数据（热力图）
   * @param year 年份
   * @param month 月份（1-12）
   * @returns 每日活动数据
   */
  getMonthActivities(year: number, month: number): DayActivity[] {
    try {
      log.debug('[StatisticsService] Getting month activities:', { year, month })

      const startDate = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`)
      const endDate = startDate.endOf('month')

      const startStr = startDate.format('YYYY-MM-DD')
      const endStr = endDate.format('YYYY-MM-DD')

      // 查询知识点统计
      const knowledgeStats = this.knowledgeRepo.countByDateRange(startStr, endStr)
      const knowledgeMap = new Map(knowledgeStats.map((s) => [s.date, s.count]))

      // 查询复习统计
      const reviewStats = this.reviewRepo.countByDateRange(startStr, endStr)
      const reviewMap = new Map(reviewStats.map((s) => [s.date, s.count]))

      // 生成完整月份的数据（包括空日期）
      const days: DayActivity[] = []
      const daysInMonth = endDate.date()

      for (let day = 1; day <= daysInMonth; day++) {
        const date = startDate.date(day).format('YYYY-MM-DD')
        const knowledgeCount = knowledgeMap.get(date) || 0
        const reviewCount = reviewMap.get(date) || 0
        const totalActivity = knowledgeCount + reviewCount

        days.push({
          date,
          knowledgeCount,
          reviewCount,
          totalActivity,
          heatLevel: this.calculateHeatLevel(totalActivity)
        })
      }

      log.info(`[StatisticsService] Month activities generated: ${days.length} days`)
      return days
    } catch (error) {
      log.error('[StatisticsService] Error getting month activities:', error)
      throw error
    }
  }

  /**
   * 获取单日活动详情
   * @param date 日期（YYYY-MM-DD）
   * @returns 日期详细数据
   */
  getDayActivities(date: string): DayDetail {
    try {
      log.debug('[StatisticsService] Getting day activities:', date)

      // 查询该日新增的知识点
      const knowledgeList = this.knowledgeRepo.findByDate(date).map((k) => ({
        id: k.id,
        title: k.title,
        tags: k.tags || [],
        createdAt: k.createdAt.toISOString()
      }))

      // 查询该日的复习记录
      const reviewList = this.reviewRepo.findByDateWithKnowledge(date).map((r) => ({
        id: r.id,
        knowledgeId: r.knowledgeId,
        knowledgeTitle: r.knowledge.title,
        rating: r.rating,
        reviewedAt: r.reviewDate.toISOString()
      }))

      log.info(
        `[StatisticsService] Day activities: ${knowledgeList.length} knowledge, ${reviewList.length} reviews`
      )

      return {
        date,
        knowledgeList,
        reviewList
      }
    } catch (error) {
      log.error('[StatisticsService] Error getting day activities:', error)
      throw error
    }
  }

  /**
   * 获取周视图数据
   * @param year 年份
   * @param week ISO周编号（1-53）
   * @returns 周视图数据
   */
  getWeekData(year: number, week: number): WeekData {
    try {
      log.debug('[StatisticsService] Getting week data:', { year, week })

      const days: DayData[] = []

      // 计算该周的日期范围
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = this.getDateFromWeek(year, week, dayOffset)
        const dateStr = dayjs(date).format('YYYY-MM-DD')

        // 获取该日的知识点
        const knowledgeList = this.knowledgeRepo.findByDate(dateStr).map((k) => ({
          id: k.id,
          title: k.title,
          tags: k.tags || []
        }))

        // 获取该日的复习记录
        const reviewList = this.reviewRepo.findByDateWithKnowledge(dateStr).map((r) => ({
          id: r.id,
          knowledgeTitle: r.knowledge.title,
          rating: r.rating
        }))

        // 计算完成率
        const totalReviews = reviewList.length
        const completedReviews = reviewList.filter((r) => r.rating > 0).length
        const completionRate =
          totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0

        days.push({
          date: dateStr,
          dayOfWeek: dayOffset,
          knowledgeList,
          reviewList,
          completionRate
        })
      }

      log.info(`[StatisticsService] Week data generated: ${days.length} days`)
      return { year, week, days }
    } catch (error) {
      log.error('[StatisticsService] Error getting week data:', error)
      throw error
    }
  }

  /**
   * 获取年视图数据
   * @param year 年份
   * @returns 年视图数据
   */
  getYearData(year: number): YearData {
    try {
      log.debug('[StatisticsService] Getting year data:', year)

      // 获取知识点热力图数据
      const knowledgeHeatmap = this.knowledgeRepo.countByYear(year)

      // 获取复习热力图数据
      const reviewHeatmap = this.reviewRepo.countByYear(year)

      // 合并热力图数据
      const heatmap = this.mergeHeatmapData(knowledgeHeatmap, reviewHeatmap)

      // 获取年度统计
      const stats = this.reviewRepo.getYearStats(year)

      log.info(
        `[StatisticsService] Year data generated: ${heatmap.size} days, ${stats.totalStudyDays} study days`
      )
      return { year, heatmap, stats }
    } catch (error) {
      log.error('[StatisticsService] Error getting year data:', error)
      throw error
    }
  }

  /**
   * 从年份和周数计算日期
   * @param year 年份
   * @param week ISO周编号
   * @param dayOffset 周内偏移（0=周一, 6=周日）
   * @returns 日期
   */
  private getDateFromWeek(year: number, week: number, dayOffset: number): Date {
    // 使用dayjs计算ISO周的日期
    const firstDayOfYear = dayjs(`${year}-01-01`)
    const firstMonday = firstDayOfYear.day(1) // 第一个周一
    const targetDate = firstMonday.add((week - 1) * 7 + dayOffset, 'day')
    return targetDate.toDate()
  }

  /**
   * 合并知识点和复习的热力图数据
   * @param knowledgeMap 知识点Map
   * @param reviewMap 复习Map
   * @returns 合并后的Map
   */
  private mergeHeatmapData(
    knowledgeMap: Map<string, number>,
    reviewMap: Map<string, number>
  ): Map<string, number> {
    const merged = new Map<string, number>()

    // 合并知识点数据
    knowledgeMap.forEach((count, date) => {
      merged.set(date, (merged.get(date) || 0) + count)
    })

    // 合并复习数据
    reviewMap.forEach((count, date) => {
      merged.set(date, (merged.get(date) || 0) + count)
    })

    return merged
  }

  /**
   * 计算热力级别（0-5）
   * @param totalActivity 总活动数
   * @returns 热力级别
   */
  private calculateHeatLevel(totalActivity: number): number {
    if (totalActivity === 0) return 0
    if (totalActivity <= 2) return 1
    if (totalActivity <= 5) return 2
    if (totalActivity <= 10) return 3
    if (totalActivity <= 15) return 4
    return 5 // 16+
  }

  /**
   * 获取今日摘要
   * @returns 今日摘要数据
   */
  getTodaySummary(): TodaySummary {
    try {
      log.debug('[StatisticsService] Getting today summary')

      const newKnowledgeCount = this.knowledgeRepo.countCreatedToday()
      const pendingReviewCount = this.knowledgeRepo.countDueToday()
      const completedReviewCount = this.reviewRepo.countReviewedToday()

      // 计算完成率
      const total = pendingReviewCount + completedReviewCount
      const completionRate = total > 0 ? Math.round((completedReviewCount / total) * 100) : 0

      const summary = {
        date: dayjs().format('YYYY年MM月DD日 dddd'),
        newKnowledgeCount,
        pendingReviewCount,
        completedReviewCount,
        completionRate
      }

      log.info('[StatisticsService] Today summary:', summary)
      return summary
    } catch (error) {
      log.error('[StatisticsService] Error getting today summary:', error)
      throw error
    }
  }

  /**
   * 获取总体统计数据
   * @returns 总体统计信息
   */
  getOverallStatistics(): OverallStatistics {
    try {
      log.debug('[StatisticsService] Getting overall statistics')

      const masteryStats = this.knowledgeRepo.getMasteryStats()
      const streakDays = this.knowledgeRepo.getStreakDays()
      const averageCompletionRate = this.reviewRepo.getAverageCompletionRate()

      const stats = {
        totalKnowledge: masteryStats.total,
        masteredKnowledge: masteryStats.mastered,
        masteredPercentage: masteryStats.masteryRate,
        currentStreak: streakDays.current,
        longestStreak: streakDays.longest,
        averageCompletionRate
      }

      log.info('[StatisticsService] Overall statistics:', stats)
      return stats
    } catch (error) {
      log.error('[StatisticsService] Error getting overall statistics:', error)
      throw error
    }
  }

  /**
   * 获取本周统计数据
   * @returns 本周统计信息
   */
  getWeeklyStatistics(): WeeklyStats {
    try {
      log.debug('[StatisticsService] Getting weekly statistics')

      const weeklyData = this.reviewRepo.getWeeklyStats()

      const stats = {
        dates: weeklyData.map((d) => dayjs(d.date).format('MM/DD')),
        newKnowledge: weeklyData.map((d) => d.newKnowledge),
        reviews: weeklyData.map((d) => d.reviews),
        completionRates: weeklyData.map((d) => d.completionRate)
      }

      log.info('[StatisticsService] Weekly statistics generated')
      return stats
    } catch (error) {
      log.error('[StatisticsService] Error getting weekly statistics:', error)
      throw error
    }
  }
}
