import { BaseRepository } from './BaseRepository'
import { DatabaseService } from '../DatabaseService'
import { Knowledge } from '../types'
import { DatabaseError } from '../../utils/errors'
import log from '../../utils/logger'
import { randomUUID } from 'crypto'

/**
 * KnowledgeRepository
 * 管理知识点数据的访问
 */
export class KnowledgeRepository extends BaseRepository<Knowledge> {
  constructor(dbService: DatabaseService) {
    super(dbService, 'knowledge')
  }

  /**
   * 根据标签查询知识点
   * @param tags 标签数组
   * @returns 包含任意指定标签的知识点列表
   */
  findByTags(tags: string[]): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Finding by tags:`, tags)

      if (tags.length === 0) {
        return []
      }

      // 构建LIKE条件，查询tags字段中包含任意标签的记录
      const conditions = tags.map(() => `tags LIKE ?`).join(' OR ')
      const params = tags.map((tag) => `%"${tag}"%`)

      const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions}`
      const stmt = this.db.prepare(sql)
      const rows = stmt.all(...params) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} records by tags`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by tags:`, error)
      throw new DatabaseError('Failed to find records by tags', { cause: error })
    }
  }

  /**
   * 搜索知识点（标题和内容）
   * @param keyword 搜索关键词
   * @returns 匹配的知识点列表
   */
  search(keyword: string): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Searching for:`, keyword)

      if (!keyword.trim()) {
        return []
      }

      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE title LIKE ? OR content LIKE ?
        ORDER BY updated_at DESC
      `
      const pattern = `%${keyword}%`
      const stmt = this.db.prepare(sql)
      const rows = stmt.all(pattern, pattern) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Search found ${results.length} records`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error searching records:`, error)
      throw new DatabaseError('Failed to search records', { cause: error })
    }
  }

  /**
   * 更新知识点的复习频率系数
   * @param id 知识点ID（UUID）
   * @param coefficient 新的频率系数
   * @returns 是否更新成功
   */
  updateFrequencyCoefficient(id: string, coefficient: number): boolean {
    try {
      log.debug(`[${this.tableName}] Updating frequency coefficient: id=${id}, coefficient=${coefficient}`)

      if (coefficient <= 0) {
        throw new DatabaseError('Frequency coefficient must be positive')
      }

      const sql = `
        UPDATE ${this.tableName}
        SET frequency_coefficient = ?, updated_at = ?
        WHERE id = ?
      `
      const stmt = this.db.prepare(sql)
      const result = stmt.run(coefficient, Date.now(), id)

      const success = result.changes > 0
      if (success) {
        log.info(`[${this.tableName}] Frequency coefficient updated: id=${id}`)
      } else {
        log.warn(`[${this.tableName}] Record not found: id=${id}`)
      }

      return success
    } catch (error) {
      log.error(`[${this.tableName}] Error updating frequency coefficient:`, error)
      throw new DatabaseError('Failed to update frequency coefficient', { cause: error })
    }
  }

  /**
   * 将数据库行映射为Knowledge实体
   * 处理特殊字段：tags（JSON字符串 -> 数组）、时间戳（number -> Date）
   */
  protected mapRowToEntity(row: Record<string, any>): Knowledge {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      frequencyCoefficient: row.frequency_coefficient
    }
  }

  /**
   * 重写create方法，处理特殊字段
   */
  create(data: Partial<Omit<Knowledge, 'id'>>): Knowledge {
    const now = Date.now()
    const id = randomUUID()
    
    const dbData: Record<string, any> = {
      id: id,
      title: data.title,
      content: data.content,
      tags: JSON.stringify(data.tags || []),
      created_at: data.createdAt ? data.createdAt.getTime() : now,
      updated_at: data.updatedAt ? data.updatedAt.getTime() : now,
      frequency_coefficient: data.frequencyCoefficient ?? 1.0
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
   * 重写update方法，处理特殊字段
   */
  update(id: string, data: Partial<Omit<Knowledge, 'id'>>): Knowledge {
    const dbData: Record<string, any> = {
      updated_at: Date.now()
    }

    if (data.title !== undefined) dbData.title = data.title
    if (data.content !== undefined) dbData.content = data.content
    if (data.tags !== undefined) dbData.tags = JSON.stringify(data.tags)
    if (data.frequencyCoefficient !== undefined)
      dbData.frequency_coefficient = data.frequencyCoefficient

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

