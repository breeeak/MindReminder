import { BaseRepository } from './BaseRepository'
import { DatabaseService } from '../DatabaseService'
import { ReviewHistory } from '../types'
import { DatabaseError } from '../../utils/errors'
import log from '../../utils/logger'
import { randomUUID } from 'crypto'

/**
 * ReviewRepository
 * 管理复习历史数据的访问
 */
export class ReviewRepository extends BaseRepository<ReviewHistory> {
  constructor(dbService: DatabaseService) {
    super(dbService, 'review_history')
  }

  /**
   * 根据知识点ID查询复习历史
   * @param knowledgeId 知识点ID（UUID）
   * @param limit 可选，限制返回数量
   * @returns 该知识点的所有复习记录（按时间倒序）
   */
  findByKnowledgeId(knowledgeId: string, limit?: number): ReviewHistory[] {
    try {
      log.debug(`[${this.tableName}] Finding by knowledge_id:`, knowledgeId, { limit })

      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE knowledge_id = ?
        ORDER BY reviewed_at DESC
        ${limit ? 'LIMIT ?' : ''}
      `
      const stmt = this.db.prepare(sql)
      const rows = limit ? stmt.all(knowledgeId, limit) : stmt.all(knowledgeId)

      const results = (rows as Record<string, any>[]).map((row) => this.mapRowToEntity(row))
      log.debug(
        `[${this.tableName}] Found ${results.length} records for knowledge_id=${knowledgeId}`
      )
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by knowledge_id:`, error)
      throw new DatabaseError('Failed to find records by knowledge_id')
    }
  }

  /**
   * 获取最新一次复习记录
   * @param knowledgeId 知识点ID
   * @returns 最新的复习记录或null
   */
  getLatestByKnowledge(knowledgeId: string): ReviewHistory | null {
    const results = this.findByKnowledgeId(knowledgeId, 1)
    return results.length > 0 ? results[0] : null
  }

  /**
   * 获取知识点的复习统计信息
   * @param knowledgeId 知识点ID
   * @returns 统计数据
   */
  getStatistics(knowledgeId: string): {
    totalReviews: number
    avgRating: number
    lastReviewAt: number | null
  } {
    try {
      log.debug(`[${this.tableName}] Getting statistics for knowledge_id:`, knowledgeId)

      const sql = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as avg_rating,
          MAX(reviewed_at) as last_review_at
        FROM ${this.tableName}
        WHERE knowledge_id = ?
      `
      const stmt = this.db.prepare(sql)
      const row = stmt.get(knowledgeId) as Record<string, any>

      return {
        totalReviews: row.total_reviews || 0,
        avgRating: row.avg_rating || 0,
        lastReviewAt: row.last_review_at || null
      }
    } catch (error) {
      log.error(`[${this.tableName}] Error getting statistics:`, error)
      throw new DatabaseError('Failed to get review statistics')
    }
  }

  /**
   * 查询到期的复习任务
   * @param date 指定日期（查询 next_review_at <= date 的记录）
   * @returns 到期的复习记录列表
   */
  findDueReviews(date: Date): ReviewHistory[] {
    try {
      log.debug(`[${this.tableName}] Finding due reviews for date:`, date)

      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE next_review_at <= ?
        ORDER BY next_review_at ASC
      `
      const stmt = this.db.prepare(sql)
      const rows = stmt.all(date.getTime()) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} due reviews`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding due reviews:`, error)
      throw new DatabaseError('Failed to find due reviews')
    }
  }

  /**
   * 查找今日到期的知识点ID列表
   * @param targetDate 目标日期时间戳（默认当前时间）
   * @returns 到期知识点ID数组
   */
  findDueKnowledgeIds(targetDate: number = Date.now()): string[] {
    try {
      log.debug(`[${this.tableName}] Finding due knowledge IDs for targetDate:`, targetDate)

      const sql = `
        SELECT DISTINCT k.id
        FROM knowledge k
        WHERE k.next_review_at <= ?
          AND k.next_review_at IS NOT NULL
        ORDER BY k.next_review_at ASC
      `
      const stmt = this.db.prepare(sql)
      const rows = stmt.all(targetDate) as Array<{ id: string }>

      const ids = rows.map((row) => row.id)
      log.debug(`[${this.tableName}] Found ${ids.length} due knowledge IDs`)
      return ids
    } catch (error) {
      log.error(`[${this.tableName}] Error finding due knowledge IDs:`, error)
      throw new DatabaseError('Failed to find due knowledge IDs')
    }
  }

  /**
   * 获取今日复习统计
   * @param targetDate 目标日期时间戳（默认当前时间）
   * @returns 复习统计数据
   */
  getReviewStats(targetDate: number = Date.now()): {
    todayTotal: number
    todayCompleted: number
    todayRemaining: number
    overdueCount: number
    completionRate: number
  } {
    try {
      log.debug(`[${this.tableName}] Getting review stats for targetDate:`, targetDate)

      // 使用dayjs计算今天的开始和结束时间
      const dayjs = require('dayjs')
      const startOfDay = dayjs(targetDate).startOf('day').valueOf()
      const endOfDay = dayjs(targetDate).endOf('day').valueOf()

      // 今日待复习总数（next_review_at <= 今天结束）
      const todayTotalStmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM knowledge
        WHERE next_review_at <= ?
          AND next_review_at IS NOT NULL
      `)
      const todayTotal = (todayTotalStmt.get(endOfDay) as any).count || 0

      // 今日已完成数（reviewed_at在今天）
      const todayCompletedStmt = this.db.prepare(`
        SELECT COUNT(DISTINCT knowledge_id) as count
        FROM review_history
        WHERE reviewed_at >= ? AND reviewed_at <= ?
      `)
      const todayCompleted = (todayCompletedStmt.get(startOfDay, endOfDay) as any).count || 0

      // 超期数量（next_review_at < 今天开始）
      const overdueStmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM knowledge
        WHERE next_review_at < ?
          AND next_review_at IS NOT NULL
      `)
      const overdueCount = (overdueStmt.get(startOfDay) as any).count || 0

      const todayRemaining = Math.max(0, todayTotal - todayCompleted)
      const completionRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0

      const stats = {
        todayTotal,
        todayCompleted,
        todayRemaining,
        overdueCount,
        completionRate
      }

      log.debug(`[${this.tableName}] Review stats:`, stats)
      return stats
    } catch (error) {
      log.error(`[${this.tableName}] Error getting review stats:`, error)
      throw new DatabaseError('Failed to get review stats')
    }
  }

  /**
   * 创建复习记录
   * @param knowledgeId 知识点ID（UUID）
   * @param rating 评分（1-5）
   * @param nextReviewDate 下次复习日期
   * @returns 创建的复习记录
   */
  createReview(knowledgeId: string, rating: number, nextReviewDate: Date | number): ReviewHistory {
    try {
      log.debug(`[${this.tableName}] Creating review:`, {
        knowledgeId,
        rating,
        nextReviewDate
      })

      // 验证评分范围
      if (rating < 1 || rating > 5) {
        throw new DatabaseError('Rating must be between 1 and 5')
      }

      const now = Date.now()
      const id = randomUUID()
      const nextReviewTimestamp = nextReviewDate instanceof Date ? nextReviewDate.getTime() : nextReviewDate

      const dbData = {
        id: id,
        knowledge_id: knowledgeId,
        rating: rating,
        reviewed_at: now,
        next_review_at: nextReviewTimestamp,
        interval_days: 1 // 默认值
      }

      const columns = Object.keys(dbData)
      const placeholders = columns.map(() => '?').join(', ')
      const values = Object.values(dbData)

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`
      const stmt = this.db.prepare(sql)
      stmt.run(...values)

      const created = this.findById(id)
      if (!created) {
        throw new DatabaseError('Failed to retrieve created review record')
      }

      log.info(`[${this.tableName}] Review created successfully: id=${created.id}`)
      return created
    } catch (error) {
      log.error(`[${this.tableName}] Error creating review:`, error)
      throw new DatabaseError('Failed to create review')
    }
  }

  /**
   * 将数据库行映射为ReviewHistory实体
   * 处理时间戳字段：number -> Date
   */
  protected mapRowToEntity(row: Record<string, any>): ReviewHistory {
    return {
      id: row.id,
      knowledgeId: row.knowledge_id,
      rating: row.rating,
      reviewedAt: row.reviewed_at || 0,
      nextReviewAt: row.next_review_at || 0
    }
  }

  /**
   * 重写create方法，处理时间戳字段
   */
  create(data: Partial<Omit<ReviewHistory, 'id'>>): ReviewHistory {
    const now = Date.now()
    const id = randomUUID()

    const dbData: Record<string, any> = {
      id: id,
      knowledge_id: data.knowledgeId,
      rating: data.rating,
      reviewed_at: data.reviewedAt || now,
      next_review_at: data.nextReviewAt || (now + 24 * 60 * 60 * 1000), // 默认明天
      interval_days: 1 // 默认值
    }

    try {
      log.debug(`[${this.tableName}] Creating record:`, data)

      const columns = Object.keys(dbData)
      const placeholders = columns.map(() => '?').join(', ')
      const values = Object.values(dbData)

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`
      const stmt = this.db.prepare(sql)
      stmt.run(...values)

      const created = this.findById(id)
      if (!created) {
        throw new DatabaseError('Failed to retrieve created record')
      }

      log.info(`[${this.tableName}] Record created successfully: id=${created.id}`)
      return created
    } catch (error) {
      log.error(`[${this.tableName}] Error creating record:`, error)
      throw new DatabaseError('Failed to create record')
    }
  }

  /**
   * 重写update方法，处理时间戳字段
   */
  update(id: string, data: Partial<Omit<ReviewHistory, 'id' | 'knowledgeId'>>): ReviewHistory {
    const dbData: Record<string, any> = {}

    if (data.rating !== undefined) dbData.rating = data.rating
    if (data.reviewedAt !== undefined) dbData.reviewed_at = data.reviewedAt
    if (data.nextReviewAt !== undefined) dbData.next_review_at = data.nextReviewAt

    if (Object.keys(dbData).length === 0) {
      throw new DatabaseError('No fields to update')
    }

    try {
      log.debug(`[${this.tableName}] Updating record: id=${id}`, data)

      const columns = Object.keys(dbData)
      const setClause = columns.map((col) => `${col} = ?`).join(', ')
      const values = Object.values(dbData)

      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
      const stmt = this.db.prepare(sql)
      const result = stmt.run(...values, id)

      if (result.changes === 0) {
        throw new DatabaseError(`Record not found: id=${id}`)
      }

      const updated = this.findById(id)
      if (!updated) {
        throw new DatabaseError('Failed to retrieve updated record')
      }

      log.info(`[${this.tableName}] Record updated successfully: id=${id}`)
      return updated
    } catch (error) {
      log.error(`[${this.tableName}] Error updating record:`, error)
      throw new DatabaseError(`Failed to update record: id=${id}`)
    }
  }

  /**
   * 按日期范围统计复习次数
   * @param startDate 开始日期（YYYY-MM-DD）
   * @param endDate 结束日期（YYYY-MM-DD）
   * @returns 每日统计 { date: string, count: number }[]
   */
  countByDateRange(startDate: string, endDate: string): Array<{ date: string; count: number }> {
    try {
      log.debug(`[${this.tableName}] Counting by date range:`, { startDate, endDate })

      const query = `
        SELECT 
          DATE(reviewed_at / 1000, 'unixepoch') as date,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE DATE(reviewed_at / 1000, 'unixepoch') BETWEEN ? AND ?
        GROUP BY DATE(reviewed_at / 1000, 'unixepoch')
        ORDER BY date
      `
      const stmt = this.db.prepare(query)
      const rows = stmt.all(startDate, endDate) as Array<{ date: string; count: number }>

      log.debug(`[${this.tableName}] Count by date range returned ${rows.length} days`)
      return rows
    } catch (error) {
      log.error(`[${this.tableName}] Error counting by date range:`, error)
      throw new DatabaseError('Failed to count by date range')
    }
  }

  /**
   * 按日期查询复习记录（关联知识点）
   * @param date 日期（YYYY-MM-DD）
   * @returns 复习记录列表（含知识点信息）
   */
  findByDateWithKnowledge(
    date: string
  ): Array<ReviewHistory & { knowledge: { id: string; title: string; tags: string[] } }> {
    try {
      log.debug(`[${this.tableName}] Finding by date with knowledge:`, date)

      const query = `
        SELECT 
          r.*,
          k.id as knowledge_id,
          k.title as knowledge_title,
          k.tags as knowledge_tags
        FROM ${this.tableName} r
        JOIN knowledge k ON r.knowledge_id = k.id
        WHERE DATE(r.reviewed_at / 1000, 'unixepoch') = ?
        ORDER BY r.reviewed_at DESC
      `
      const stmt = this.db.prepare(query)
      const rows = stmt.all(date) as Record<string, any>[]

      const results = rows.map((row) => ({
        ...this.mapRowToEntity(row),
        knowledge: {
          id: row.knowledge_id,
          title: row.knowledge_title,
          tags: row.knowledge_tags ? JSON.parse(row.knowledge_tags) : []
        }
      }))

      log.debug(
        `[${this.tableName}] Found ${results.length} records with knowledge for date ${date}`
      )
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by date with knowledge:`, error)
      throw new DatabaseError('Failed to find by date with knowledge')
    }
  }

  /**
   * 按年度统计复习次数（每天）
   * @param year 年份（YYYY）
   * @returns Map<日期(YYYY-MM-DD), 数量>
   */
  countByYear(year: number): Map<string, number> {
    try {
      log.debug(`[${this.tableName}] Counting by year:`, year)

      const query = `
        SELECT 
          DATE(reviewed_at / 1000, 'unixepoch') as date,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE strftime('%Y', DATE(reviewed_at / 1000, 'unixepoch')) = ?
        GROUP BY DATE(reviewed_at / 1000, 'unixepoch')
      `
      const stmt = this.db.prepare(query)
      const rows = stmt.all(year.toString()) as Array<{ date: string; count: number }>

      const result = new Map<string, number>()
      rows.forEach((row) => {
        result.set(row.date, row.count)
      })

      log.debug(`[${this.tableName}] Count by year returned ${result.size} days`)
      return result
    } catch (error) {
      log.error(`[${this.tableName}] Error counting by year:`, error)
      throw new DatabaseError('Failed to count by year')
    }
  }

  /**
   * 按年度查询所有复习记录
   * @param year 年份（YYYY）
   * @returns 复习记录列表
   */
  findByYear(year: number): ReviewHistory[] {
    try {
      log.debug(`[${this.tableName}] Finding by year:`, year)

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE strftime('%Y', DATE(reviewed_at / 1000, 'unixepoch')) = ?
        ORDER BY reviewed_at DESC
      `
      const stmt = this.db.prepare(query)
      const rows = stmt.all(year.toString()) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} records for year ${year}`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by year:`, error)
      throw new DatabaseError('Failed to find by year')
    }
  }

  /**
   * 获取年度统计数据
   * @param year 年份（YYYY）
   * @returns 年度统计信息
   */
  getYearStats(year: number): {
    totalStudyDays: number
    longestStreak: number
    totalKnowledge: number
    totalReviews: number
  } {
    try {
      log.debug(`[${this.tableName}] Getting year stats for:`, year)

      // 总学习天数（有复习或新增知识点的天数）
      const studyDaysStmt = this.db.prepare(`
        SELECT COUNT(DISTINCT DATE(reviewed_at / 1000, 'unixepoch')) as count
        FROM ${this.tableName}
        WHERE strftime('%Y', DATE(reviewed_at / 1000, 'unixepoch')) = ?
      `)
      const totalStudyDays = (studyDaysStmt.get(year.toString()) as any).count || 0

      // 总知识点数
      const knowledgeStmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM knowledge
        WHERE strftime('%Y', DATE(created_at / 1000, 'unixepoch')) = ?
      `)
      const totalKnowledge = (knowledgeStmt.get(year.toString()) as any).count || 0

      // 总复习次数
      const reviewsStmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM ${this.tableName}
        WHERE strftime('%Y', DATE(reviewed_at / 1000, 'unixepoch')) = ?
      `)
      const totalReviews = (reviewsStmt.get(year.toString()) as any).count || 0

      // 最长连续天数（应用层计算）
      const datesStmt = this.db.prepare(`
        SELECT DISTINCT DATE(reviewed_at / 1000, 'unixepoch') as date
        FROM ${this.tableName}
        WHERE strftime('%Y', DATE(reviewed_at / 1000, 'unixepoch')) = ?
        ORDER BY date
      `)
      const dates = (datesStmt.all(year.toString()) as Array<{ date: string }>).map(
        (row) => row.date
      )

      let longestStreak = 0
      let currentStreak = 0
      let prevDate: Date | null = null

      for (const dateStr of dates) {
        const currentDate = new Date(dateStr)
        if (prevDate) {
          const diffDays = Math.floor(
            (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (diffDays === 1) {
            currentStreak++
          } else {
            longestStreak = Math.max(longestStreak, currentStreak)
            currentStreak = 1
          }
        } else {
          currentStreak = 1
        }
        prevDate = currentDate
      }
      longestStreak = Math.max(longestStreak, currentStreak)

      const stats = {
        totalStudyDays,
        longestStreak,
        totalKnowledge,
        totalReviews
      }

      log.debug(`[${this.tableName}] Year stats:`, stats)
      return stats
    } catch (error) {
      log.error(`[${this.tableName}] Error getting year stats:`, error)
      throw new DatabaseError('Failed to get year stats')
    }
  }

  /**
   * 统计今日复习数量
   * @returns 今日复习数量
   */
  countReviewedToday(): number {
    try {
      log.debug(`[${this.tableName}] Counting reviewed today`)

      const dayjs = require('dayjs')
      const todayStart = dayjs().startOf('day').valueOf()
      const todayEnd = dayjs().endOf('day').valueOf()

      const stmt = this.db.prepare(`
        SELECT COUNT(DISTINCT knowledge_id) as count
        FROM ${this.tableName}
        WHERE reviewed_at >= ? AND reviewed_at <= ?
      `)
      const result = stmt.get(todayStart, todayEnd) as { count: number }

      log.debug(`[${this.tableName}] Reviewed today (unique):`, result.count)
      return result.count || 0
    } catch (error) {
      log.error(`[${this.tableName}] Error counting reviewed today:`, error)
      throw new DatabaseError('Failed to count reviewed today')
    }
  }

  /**
   * 获取本周每日统计
   * @returns 最近7天的每日统计数据
   */
  getWeeklyStats(): Array<{
    date: string
    newKnowledge: number
    reviews: number
    completionRate: number
  }> {
    try {
      log.debug(`[${this.tableName}] Getting weekly stats`)

      const dayjs = require('dayjs')
      const stats: Array<{
        date: string
        newKnowledge: number
        reviews: number
        completionRate: number
      }> = []

      // 获取最近7天的数据
      for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day')
        const dateStr = date.format('YYYY-MM-DD')
        const dayStart = date.startOf('day').valueOf()
        const dayEnd = date.endOf('day').valueOf()

        // 新增知识点数量
        const newKnowledgeStmt = this.db.prepare(`
          SELECT COUNT(*) as count
          FROM knowledge
          WHERE created_at >= ? AND created_at <= ?
        `)
        const newKnowledge = (newKnowledgeStmt.get(dayStart, dayEnd) as any).count || 0

        // 复习数量
        const reviewsStmt = this.db.prepare(`
          SELECT COUNT(*) as count
          FROM ${this.tableName}
          WHERE reviewed_at >= ? AND reviewed_at <= ?
        `)
        const reviews = (reviewsStmt.get(dayStart, dayEnd) as any).count || 0

        // 待复习数量（那天到期的）
        const dueStmt = this.db.prepare(`
          SELECT COUNT(*) as count
          FROM knowledge
          WHERE next_review_at >= ? AND next_review_at <= ?
            AND next_review_at IS NOT NULL
        `)
        const due = (dueStmt.get(dayStart, dayEnd) as any).count || 0

        // 完成率
        const completionRate = due > 0 ? Math.round((reviews / due) * 100) : 0

        stats.push({
          date: dateStr,
          newKnowledge,
          reviews,
          completionRate
        })
      }

      log.debug(`[${this.tableName}] Weekly stats:`, stats)
      return stats
    } catch (error) {
      log.error(`[${this.tableName}] Error getting weekly stats:`, error)
      throw new DatabaseError('Failed to get weekly stats')
    }
  }

  /**
   * 获取平均复习完成率
   * @returns 平均完成率（百分比）
   */
  getAverageCompletionRate(): number {
    try {
      log.debug(`[${this.tableName}] Getting average completion rate`)

      const dayjs = require('dayjs')

      // 获取最近30天的完成率
      const stats: number[] = []

      for (let i = 29; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day')
        const dayStart = date.startOf('day').valueOf()
        const dayEnd = date.endOf('day').valueOf()

        // 该天待复习数量
        const dueStmt = this.db.prepare(`
          SELECT COUNT(*) as count
          FROM knowledge
          WHERE next_review_at >= ? AND next_review_at <= ?
            AND next_review_at IS NOT NULL
        `)
        const due = (dueStmt.get(dayStart, dayEnd) as any).count || 0

        // 该天复习数量
        const reviewsStmt = this.db.prepare(`
          SELECT COUNT(*) as count
          FROM ${this.tableName}
          WHERE reviewed_at >= ? AND reviewed_at <= ?
        `)
        const reviews = (reviewsStmt.get(dayStart, dayEnd) as any).count || 0

        if (due > 0) {
          const rate = Math.round((reviews / due) * 100)
          stats.push(rate)
        }
      }

      // 计算平均值
      if (stats.length === 0) {
        return 0
      }

      const average = Math.round(stats.reduce((sum, rate) => sum + rate, 0) / stats.length)
      log.debug(`[${this.tableName}] Average completion rate:`, average)
      return average
    } catch (error) {
      log.error(`[${this.tableName}] Error getting average completion rate:`, error)
      throw new DatabaseError('Failed to get average completion rate')
    }
  }
}
