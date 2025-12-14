/**
 * 间隔重复学习算法（基于艾宾浩斯遗忘曲线）
 *
 * 实现科学的间隔重复学习算法，根据用户评分动态调整复习间隔。
 * 遵循艾宾浩斯遗忘曲线原理，最大化记忆保持率。
 */

import type { ReviewHistory } from '../database/types'

export class SpacedRepetitionAlgorithm {
  /**
   * 评分对应的复习间隔系数
   *
   * 设计原理：
   * - 评分越低，系数越小，下次复习越早
   * - 评分越高，系数越大，下次复习可延后
   * - 中性评分（3分）系数为1.0，保持标准间隔
   */
  private static readonly RATING_MULTIPLIERS: Record<number, number> = {
    1: 0.5, // 😟 忘记了
    2: 0.7, // 🤔 记得一点
    3: 1.0, // 😐 记得一般
    4: 1.2, // 😊 记得还可以
    5: 1.5 // 🎯 非常熟悉
  }

  /**
   * 基础复习间隔（天）
   *
   * 基于艾宾浩斯遗忘曲线原理：
   * - 第1次（1天）: 初次记忆巩固期
   * - 第2次（2天）: 短期记忆强化期
   * - 第3次（4天）: 中期记忆转化期
   * - 第4次（7天）: 一周记忆检验期
   * - 第5次（15天）: 半月记忆巩固期
   * - 第6次及以后（30天）: 长期记忆形成期
   */
  private static readonly BASE_INTERVALS = [1, 2, 4, 7, 15, 30]

  /**
   * 获取评分对应的复习间隔系数
   *
   * @param rating 评分（1-5的整数）
   * @returns 间隔系数
   * @throws Error 如果评分无效
   */
  static getRatingMultiplier(rating: number): number {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error(`Invalid rating: ${rating}. Rating must be an integer between 1 and 5.`)
    }
    return this.RATING_MULTIPLIERS[rating]
  }

  /**
   * 计算下次复习时间
   *
   * 计算公式：
   * nextReviewDate = lastReviewDate + (baseInterval × ratingMultiplier × frequencyCoefficient)
   *
   * @param lastReviewDate 上次复习时间
   * @param reviewCount 复习次数（从1开始）
   * @param rating 本次复习评分（1-5）
   * @param frequencyCoefficient 频率系数（0.5-1.5，默认1.0）
   * @returns 下次复习的日期
   * @throws Error 如果参数无效
   */
  static calculateNextReviewDate(
    lastReviewDate: Date,
    reviewCount: number,
    rating: number,
    frequencyCoefficient: number = 1.0
  ): Date {
    // 验证参数
    if (reviewCount < 1 || !Number.isInteger(reviewCount)) {
      throw new Error(`Invalid reviewCount: ${reviewCount}. Must be an integer >= 1.`)
    }
    if (frequencyCoefficient < 0.5 || frequencyCoefficient > 1.5) {
      throw new Error(
        `Invalid frequencyCoefficient: ${frequencyCoefficient}. Must be between 0.5 and 1.5.`
      )
    }

    // 获取基础间隔（天）
    const baseIntervalIndex = Math.min(reviewCount - 1, this.BASE_INTERVALS.length - 1)
    const baseIntervalDays = this.BASE_INTERVALS[baseIntervalIndex]

    // 获取评分系数
    const ratingMultiplier = this.getRatingMultiplier(rating)

    // 计算实际间隔（天）
    const actualIntervalDays = baseIntervalDays * ratingMultiplier * frequencyCoefficient

    // 向上取整（保守策略，确保不会遗忘）
    const finalIntervalDays = Math.ceil(actualIntervalDays)

    // 计算下次复习日期
    const nextReviewDate = new Date(lastReviewDate)
    nextReviewDate.setDate(nextReviewDate.getDate() + finalIntervalDays)

    return nextReviewDate
  }

  /**
   * 判断知识点是否已掌握
   *
   * 三重条件判断（必须同时满足）：
   * 1. 次数条件：至少5次复习（保证充分练习）
   * 2. 质量条件：最近3次评分≥4（保证高质量）
   * 3. 时间条件：跨度≥30天（保证长期记忆）
   *
   * @param reviewHistory 复习历史记录（按时间倒序排列，最新的在前）
   * @returns 是否已掌握
   */
  static isKnowledgeMastered(reviewHistory: ReviewHistory[]): boolean {
    // 条件1: 至少进行过5次复习
    if (reviewHistory.length < 5) {
      return false
    }

    // 条件2: 最近3次复习评分均 ≥ 4
    const recentReviews = reviewHistory.slice(0, 3)
    const allHighRatings = recentReviews.every((review) => review.rating >= 4)
    if (!allHighRatings) {
      return false
    }

    // 条件3: 距离首次记录时间 ≥ 30天
    const firstReview = reviewHistory[reviewHistory.length - 1]
    const daysSinceFirst = (Date.now() - firstReview.reviewDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceFirst < 30) {
      return false
    }

    return true
  }
}
