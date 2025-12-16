import { getKnowledgeRepository, getReviewRepository } from '../database/repositories'
import { SpacedRepetitionAlgorithm } from '../algorithms/SpacedRepetitionAlgorithm'
import log from '../utils/logger'
import type { Knowledge, ReviewHistory } from '../database/types'

// ReviewTask 类型定义
export interface ReviewTask extends Knowledge {
  priority: 'overdue' | 'due_today' | 'advance'
  daysOverdue?: number
  dueTime: number
}

// ReviewRatingResult 类型定义
export interface ReviewRatingResult {
  knowledge: Knowledge
  nextReviewAt: number
  intervalDays: number
  reviewHistory: ReviewHistory
}

// ReviewSessionStats 类型定义
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
 * ReviewService
 * 处理复习相关的业务逻辑
 */
export class ReviewService {
  private static instance: ReviewService

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService()
    }
    return ReviewService.instance
  }

  /**
   * 获取今日复习任务列表
   * @param targetDate 目标日期时间戳（默认当前时间）
   * @returns ReviewTask数组（按优先级排序）
   */
  getTodayReviewTasks(targetDate: number = Date.now()): ReviewTask[] {
    try {
      log.debug('[ReviewService] Getting today review tasks', { targetDate })

      const dayjs = require('dayjs')
      const knowledgeRepo = getKnowledgeRepository()
      const reviewRepo = getReviewRepository()

      const startOfDay = dayjs(targetDate).startOf('day').valueOf()
      const endOfDay = dayjs(targetDate).endOf('day').valueOf()

      // 获取到期知识点ID
      const dueIds = reviewRepo.findDueKnowledgeIds(targetDate)

      if (dueIds.length === 0) {
        log.debug('[ReviewService] No due knowledge found')
        return []
      }

      // 批量获取知识点详情
      const knowledges = dueIds
        .map((id) => knowledgeRepo.findById(id))
        .filter((k): k is Knowledge => k !== null)

      log.debug(`[ReviewService] Found ${knowledges.length} knowledge items`)

      // 转换为ReviewTask并计算优先级
      const tasks: ReviewTask[] = knowledges.map((k) => {
        const nextReview = (k as any).nextReviewAt || targetDate
        const daysOverdue =
          nextReview < startOfDay ? Math.ceil((startOfDay - nextReview) / (24 * 60 * 60 * 1000)) : 0

        let priority: 'overdue' | 'due_today' | 'advance'
        if (nextReview < startOfDay) {
          priority = 'overdue'
        } else if (nextReview <= endOfDay) {
          priority = 'due_today'
        } else {
          priority = 'advance'
        }

        return {
          ...k,
          priority,
          daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
          dueTime: nextReview
        }
      })

      // 排序：超期 > 今日到期 > 提前复习，同级别按时间排序
      tasks.sort((a, b) => {
        const priorityOrder = { overdue: 0, due_today: 1, advance: 2 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.dueTime - b.dueTime
      })

      log.info(`[ReviewService] Returning ${tasks.length} review tasks`, {
        overdue: tasks.filter((t) => t.priority === 'overdue').length,
        dueToday: tasks.filter((t) => t.priority === 'due_today').length,
        advance: tasks.filter((t) => t.priority === 'advance').length
      })

      return tasks
    } catch (error) {
      log.error('[ReviewService] Error getting today review tasks', { error })
      throw error
    }
  }

  /**
   * 处理复习评分
   * @param knowledgeId 知识点ID
   * @param rating 评分（1-5）
   * @param reviewedAt 复习时间戳（默认当前时间）
   * @returns ReviewRatingResult
   */
  processReviewRating(
    knowledgeId: string,
    rating: number,
    reviewedAt: number = Date.now()
  ): ReviewRatingResult {
    const knowledgeRepo = getKnowledgeRepository()

    // 使用数据库事务保证数据一致性
    // 注意：better-sqlite3的事务通过db.transaction()创建
    // 由于Repository层已经封装了db访问，这里通过Repository完成所有操作

    // 1. 获取当前知识点
    const knowledge = knowledgeRepo.findById(knowledgeId)
    if (!knowledge) {
      throw new Error('Knowledge not found')
    }

    // 【新增】检查掌握状态反弹
    this.checkMasteryRebound(knowledgeId, rating)

    // 2. 调用算法计算下次复习时间
    const reviewCount = ((knowledge as any).reviewCount || 0) + 1
    const frequencyCoefficient = knowledge.frequencyCoefficient || 1.0

    // 【修改】如果是已掌握状态且评分≥3，使用长期抽查模式
    let nextReviewAt: number
    if (knowledge.masteryStatus === 'mastered' && rating >= 3) {
      nextReviewAt = this.applyLongTermMode(reviewedAt)
      log.info('[ReviewService] Applying long-term review mode', { knowledgeId, intervalDays: 60 })
    } else {
      const nextReviewDate = SpacedRepetitionAlgorithm.calculateNextReviewDate(
        new Date(reviewedAt),
        reviewCount,
        rating,
        frequencyCoefficient
      )
      nextReviewAt = nextReviewDate.getTime()
    }

    const intervalDays = (nextReviewAt - reviewedAt) / (24 * 60 * 60 * 1000)

    // 3. 保存复习记录
    const reviewHistory = this.saveReviewHistory(knowledgeId, rating, reviewedAt, nextReviewAt)

    // 4. 更新知识点
    const updatedKnowledge = this.updateKnowledgeAfterReview(knowledgeId, nextReviewAt, reviewCount)

    // 5. 【完善】检查是否达到掌握标准（仅对学习中的知识点）
    if (updatedKnowledge.masteryStatus !== 'mastered') {
      if (this.checkMasteryStatus(knowledgeId)) {
        // 标记为已掌握
        this.updateMasteryStatus(knowledgeId, 'mastered', Date.now())
        // 重新计算下次复习时间为60天后
        nextReviewAt = this.applyLongTermMode(reviewedAt)
        this.updateNextReviewTime(knowledgeId, nextReviewAt)

        log.info('[ReviewService] Knowledge marked as mastered', { knowledgeId })
      }
    }

    // 重新获取最终更新后的知识点
    const finalKnowledge = knowledgeRepo.findById(knowledgeId)!

    const result = {
      knowledge: finalKnowledge,
      nextReviewAt: finalKnowledge.nextReviewAt || nextReviewAt,
      intervalDays: Math.round(intervalDays * 10) / 10,
      reviewHistory
    }

    log.info('[ReviewService] Review rating processed', {
      knowledgeId,
      rating,
      nextReviewAt: result.nextReviewAt
    })

    return result
  }

  /**
   * 保存复习历史记录
   * @private
   */
  private saveReviewHistory(
    knowledgeId: string,
    rating: number,
    reviewedAt: number,
    nextReviewAt: number
  ): ReviewHistory {
    const reviewRepo = getReviewRepository()

    // 使用Repository的create方法创建复习记录
    const reviewHistory = reviewRepo.create({
      knowledgeId,
      rating,
      reviewedAt: reviewedAt,
      nextReviewAt: nextReviewAt
    })

    log.info('[ReviewService] Review history saved', { id: reviewHistory.id, knowledgeId })

    return reviewHistory
  }

  /**
   * 复习后更新知识点
   * @private
   */
  private updateKnowledgeAfterReview(
    id: string,
    nextReviewAt: number,
    reviewCount: number
  ): Knowledge {
    const knowledgeRepo = getKnowledgeRepository()

    // 获取当前知识点完整信息
    const knowledge = knowledgeRepo.findById(id)
    if (!knowledge) {
      throw new Error('Knowledge not found')
    }

    // 直接使用SQL更新，因为update方法不支持所有字段
    const db = (knowledgeRepo as any).db
    const stmt = db.prepare(`
      UPDATE knowledge
      SET last_review_at = ?,
          next_review_at = ?,
          review_count = ?,
          updated_at = ?
      WHERE id = ?
    `)
    stmt.run(Date.now(), nextReviewAt, reviewCount, Date.now(), id)

    // 重新获取更新后的知识点
    const updated = knowledgeRepo.findById(id)
    if (!updated) {
      throw new Error('Failed to retrieve updated knowledge')
    }

    return updated
  }

  /**
   * 应用长期抽查模式
   * 已掌握的知识点每60天复习一次
   * @private
   */
  private applyLongTermMode(currentTime: number): number {
    const LONG_TERM_INTERVAL_DAYS = 60
    return currentTime + LONG_TERM_INTERVAL_DAYS * 24 * 60 * 60 * 1000
  }

  /**
   * 检查掌握状态反弹
   * 如果已掌握的知识点评分 < 3，重置为学习中
   * @private
   */
  private checkMasteryRebound(knowledgeId: string, rating: number): void {
    const knowledgeRepo = getKnowledgeRepository()
    const knowledge = knowledgeRepo.findById(knowledgeId)
    if (!knowledge) return

    // 只有已掌握的知识点才需要检查反弹
    if (knowledge.masteryStatus !== 'mastered') return

    // 评分 < 3 触发反弹
    if (rating < 3) {
      log.warn('[ReviewService] Mastery rebound detected!', { knowledgeId, rating })

      this.updateMasteryStatus(knowledgeId, 'learning', null)

      log.info('[ReviewService] Knowledge reset to learning status', { knowledgeId })
    }
  }

  /**
   * 更新掌握状态
   * @private
   */
  private updateMasteryStatus(
    knowledgeId: string,
    status: 'learning' | 'mastered',
    masteredAt: number | null
  ): void {
    const knowledgeRepo = getKnowledgeRepository()
    const db = (knowledgeRepo as any).db

    const stmt = db.prepare(`
      UPDATE knowledge
      SET mastery_status = ?,
          mastered_at = ?,
          updated_at = ?
      WHERE id = ?
    `)

    stmt.run(status, masteredAt, Date.now(), knowledgeId)

    log.info('[ReviewService] Mastery status updated', { knowledgeId, status, masteredAt })
  }

  /**
   * 更新下次复习时间
   * @private
   */
  private updateNextReviewTime(knowledgeId: string, nextReviewAt: number): void {
    const knowledgeRepo = getKnowledgeRepository()
    const db = (knowledgeRepo as any).db

    const stmt = db.prepare(`
      UPDATE knowledge
      SET next_review_at = ?,
          updated_at = ?
      WHERE id = ?
    `)

    stmt.run(nextReviewAt, Date.now(), knowledgeId)
  }

  /**
   * 检查是否达到记忆标准
   * 标准：至少5次复习 + 最近3次评分≥4 + 距离创建≥30天
   * @private
   */
  private checkMasteryStatus(knowledgeId: string): boolean {
    const reviewRepo = getReviewRepository()
    const knowledgeRepo = getKnowledgeRepository()

    const knowledge = knowledgeRepo.findById(knowledgeId)
    if (!knowledge) {
      return false
    }

    // 1. 检查复习次数
    const reviewCount = (knowledge as any).reviewCount || 0
    if (reviewCount < 5) {
      log.debug('[ReviewService] Mastery check failed: insufficient reviews', {
        knowledgeId,
        reviewCount
      })
      return false
    }

    // 2. 检查距离创建时间
    const daysSinceCreation = (Date.now() - knowledge.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    if (daysSinceCreation < 30) {
      log.debug('[ReviewService] Mastery check failed: too recent', {
        knowledgeId,
        daysSinceCreation: daysSinceCreation.toFixed(1)
      })
      return false
    }

    // 3. 检查最近3次评分
    const recentReviews = reviewRepo.findByKnowledgeId(knowledgeId, 3)

    if (recentReviews.length < 3) {
      log.debug('[ReviewService] Mastery check failed: insufficient recent reviews', {
        knowledgeId,
        count: recentReviews.length
      })
      return false
    }

    const allHighRating = recentReviews.every((r) => r.rating >= 4)

    if (!allHighRating) {
      const ratings = recentReviews.map((r) => r.rating)
      log.debug('[ReviewService] Mastery check failed: low ratings', {
        knowledgeId,
        ratings
      })
      return false
    }

    log.info('[ReviewService] Mastery achieved!', {
      knowledgeId,
      reviewCount,
      daysSinceCreation: daysSinceCreation.toFixed(1),
      recentRatings: recentReviews.map((r) => r.rating)
    })

    return true
  }

  /**
   * 获取会话统计
   * @param completedIds 已完成的知识点ID列表
   * @param startTime 会话开始时间
   * @returns ReviewSessionStats
   */
  getSessionStats(completedIds: string[], startTime: number): ReviewSessionStats {
    const dayjs = require('dayjs')
    const reviewRepo = getReviewRepository()
    const knowledgeRepo = getKnowledgeRepository()

    log.info('[ReviewService] Getting session stats', {
      completedIdsCount: completedIds.length,
      completedIds
    })

    // 获取每个知识点的最新复习记录
    const reviews = completedIds
      .map((id) => {
        const records = reviewRepo.findByKnowledgeId(id, 1)
        log.debug('[ReviewService] Review records for knowledge', { id, count: records.length })
        return records[0]
      })
      .filter(Boolean)

    log.info('[ReviewService] Reviews found', { reviewsCount: reviews.length })

    const totalCount = completedIds.length // 使用completedIds的长度作为totalCount
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

    const duration = Math.round((Date.now() - startTime) / 1000)

    // 评分分布
    const ratingDistribution = {
      rating1: reviews.filter((r) => r.rating === 1).length,
      rating2: reviews.filter((r) => r.rating === 2).length,
      rating3: reviews.filter((r) => r.rating === 3).length,
      rating4: reviews.filter((r) => r.rating === 4).length,
      rating5: reviews.filter((r) => r.rating === 5).length
    }

    // 下次复习预告
    const tomorrow = dayjs().add(1, 'day').endOf('day').valueOf()
    const nextWeek = dayjs().add(7, 'day').endOf('day').valueOf()

    const allKnowledge = knowledgeRepo.findAll()
    const tomorrowTasks = allKnowledge.filter(
      (k: any) => k.nextReviewAt && k.nextReviewAt <= tomorrow && k.nextReviewAt > Date.now()
    )
    const nextWeekTasks = allKnowledge.filter(
      (k: any) => k.nextReviewAt && k.nextReviewAt <= nextWeek && k.nextReviewAt > tomorrow
    )

    const stats = {
      totalCount,
      averageRating: Math.round(averageRating * 10) / 10,
      duration,
      ratingDistribution,
      nextReviewPreview: {
        tomorrow: tomorrowTasks.length,
        nextWeek: nextWeekTasks.length
      }
    }

    log.info('[ReviewService] Session stats', stats)

    return stats
  }
}






