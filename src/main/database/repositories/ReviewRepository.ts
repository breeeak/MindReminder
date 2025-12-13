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
   * @returns 该知识点的所有复习记录（按时间倒序）
   */
  findByKnowledgeId(knowledgeId: string): ReviewHistory[] {
    try {
      log.debug(`[${this.tableName}] Finding by knowledge_id:`, knowledgeId)

      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE knowledge_id = ?
        ORDER BY reviewed_at DESC
      `
      const stmt = this.db.prepare(sql)
      const rows = stmt.all(knowledgeId) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} records for knowledge_id=${knowledgeId}`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by knowledge_id:`, error)
      throw new DatabaseError('Failed to find records by knowledge_id', { cause: error })
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
      throw new DatabaseError('Failed to find due reviews', { cause: error })
    }
  }

  /**
   * 创建复习记录
   * @param knowledgeId 知识点ID（UUID）
   * @param rating 评分（1-5）
   * @param nextReviewDate 下次复习日期
   * @returns 创建的复习记录
   */
  createReview(knowledgeId: string, rating: number, nextReviewDate: Date): ReviewHistory {
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
      
      const dbData = {
        id: id,
        knowledge_id: knowledgeId,
        rating: rating,
        reviewed_at: now,
        next_review_at: nextReviewDate.getTime(),
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
      throw new DatabaseError('Failed to create review', { cause: error })
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
      reviewDate: new Date(row.reviewed_at),
      nextReviewDate: new Date(row.next_review_at)
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
      reviewed_at: data.reviewDate ? data.reviewDate.getTime() : now,
      next_review_at: data.nextReviewDate
        ? data.nextReviewDate.getTime()
        : now + 24 * 60 * 60 * 1000, // 默认明天
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
      throw new DatabaseError('Failed to create record', { cause: error })
    }
  }

  /**
   * 重写update方法，处理时间戳字段
   */
  update(id: string, data: Partial<Omit<ReviewHistory, 'id' | 'knowledgeId'>>): ReviewHistory {
    const dbData: Record<string, any> = {}

    if (data.rating !== undefined) dbData.rating = data.rating
    if (data.reviewDate !== undefined) dbData.reviewed_at = data.reviewDate.getTime()
    if (data.nextReviewDate !== undefined)
      dbData.next_review_at = data.nextReviewDate.getTime()

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
      throw new DatabaseError(`Failed to update record: id=${id}`, { cause: error })
    }
  }
}

