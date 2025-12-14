import { BaseRepository } from './BaseRepository'
import { DatabaseService } from '../DatabaseService'
import { Knowledge, Tag } from '../types'
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
      throw new DatabaseError('Failed to find records by tags')
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
      throw new DatabaseError('Failed to search records')
    }
  }

  /**
   * 更新知识点的复习频率系数
   * @param id 知识点ID（UUID）
   * @param coefficient 新的频率系数
   * @returns 更新后的Knowledge对象
   */
  updateFrequencyCoefficient(id: string, coefficient: number): Knowledge {
    try {
      log.debug(
        `[${this.tableName}] Updating frequency coefficient: id=${id}, coefficient=${coefficient}`
      )

      if (coefficient < 0.5 || coefficient > 1.5) {
        throw new DatabaseError('Frequency coefficient must be between 0.5 and 1.5')
      }

      const sql = `
        UPDATE ${this.tableName}
        SET frequency_coefficient = ?, updated_at = ?
        WHERE id = ?
      `
      const stmt = this.db.prepare(sql)
      const result = stmt.run(coefficient, Date.now(), id)

      if (result.changes === 0) {
        throw new DatabaseError(`Record not found: id=${id}`)
      }

      const updated = this.findById(id)
      if (!updated) {
        throw new DatabaseError('Failed to retrieve updated record')
      }

      log.info(`[${this.tableName}] Frequency coefficient updated: id=${id}`)
      return updated
    } catch (error) {
      log.error(`[${this.tableName}] Error updating frequency coefficient:`, error)
      throw new DatabaseError('Failed to update frequency coefficient')
    }
  }

  /**
   * 标记知识点为立即复习
   * @param id 知识点ID
   * @returns 更新后的Knowledge对象
   */
  markForImmediateReview(id: string): Knowledge {
    const now = Date.now()

    try {
      log.debug(`[${this.tableName}] Marking knowledge for immediate review: id=${id}`)

      const stmt = this.db.prepare(`
        UPDATE ${this.tableName}
        SET next_review_at = ?, updated_at = ?
        WHERE id = ?
      `)
      const result = stmt.run(now, now, id)

      if (result.changes === 0) {
        throw new DatabaseError(`Record not found: id=${id}`)
      }

      const updated = this.findById(id)
      if (!updated) {
        throw new DatabaseError('Failed to retrieve updated record after marking for review')
      }

      log.info(
        `[${this.tableName}] Knowledge marked for immediate review: id=${id}, next_review_at=${now}`
      )
      return updated
    } catch (error) {
      log.error(`[${this.tableName}] Error marking for immediate review:`, error)
      throw new DatabaseError('Failed to mark knowledge for immediate review')
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
      category: row.category || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      frequencyCoefficient: row.frequency_coefficient,
      masteryStatus: row.mastery_status || undefined,
      lastReviewAt: row.last_review_at || undefined,
      nextReviewAt: row.next_review_at || undefined,
      reviewCount: row.review_count || undefined,
      masteredAt: row.mastered_at || undefined,
      syncStatus: row.sync_status || undefined
    }
  }

  /**
   * 重写create方法，处理特殊字段
   */
  create(data: Partial<Omit<Knowledge, 'id'>>): Knowledge {
    const now = Date.now()
    const id = randomUUID()

    // 辅助函数：将Date对象或timestamp转换为timestamp
    const toTimestamp = (value: Date | number | undefined): number => {
      if (!value) return now
      if (typeof value === 'number') return value
      if (value instanceof Date) return value.getTime()
      return now
    }

    const dbData: Record<string, any> = {
      id: id,
      title: data.title,
      content: data.content,
      tags: JSON.stringify(data.tags || []),
      created_at: toTimestamp(data.createdAt),
      updated_at: toTimestamp(data.updatedAt),
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
      throw new DatabaseError('Failed to create record')
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
      throw new DatabaseError(`Failed to update record: id=${id}`)
    }
  }

  /**
   * 为知识点添加标签（通过关联表）
   * @param knowledgeId 知识点ID
   * @param tagIds 标签ID数组
   */
  addTags(knowledgeId: string, tagIds: string[]): void {
    try {
      log.debug(
        `[${this.tableName}] Adding tags to knowledge: knowledgeId=${knowledgeId}, tagIds=`,
        tagIds
      )

      const now = Date.now()
      const stmt = this.db.prepare(
        `INSERT OR IGNORE INTO knowledge_tags (knowledge_id, tag_id, created_at) VALUES (?, ?, ?)`
      )

      for (const tagId of tagIds) {
        stmt.run(knowledgeId, tagId, now)
      }

      log.info(`[${this.tableName}] Tags added to knowledge: knowledgeId=${knowledgeId}`)
    } catch (error) {
      log.error(`[${this.tableName}] Error adding tags:`, error)
      throw new DatabaseError('Failed to add tags to knowledge')
    }
  }

  /**
   * 移除知识点的标签
   * @param knowledgeId 知识点ID
   * @param tagIds 标签ID数组
   */
  removeTags(knowledgeId: string, tagIds: string[]): void {
    try {
      log.debug(
        `[${this.tableName}] Removing tags from knowledge: knowledgeId=${knowledgeId}, tagIds=`,
        tagIds
      )

      const placeholders = tagIds.map(() => '?').join(', ')
      const stmt = this.db.prepare(
        `DELETE FROM knowledge_tags WHERE knowledge_id = ? AND tag_id IN (${placeholders})`
      )
      stmt.run(knowledgeId, ...tagIds)

      log.info(`[${this.tableName}] Tags removed from knowledge: knowledgeId=${knowledgeId}`)
    } catch (error) {
      log.error(`[${this.tableName}] Error removing tags:`, error)
      throw new DatabaseError('Failed to remove tags from knowledge')
    }
  }

  /**
   * 获取知识点的所有标签
   * @param knowledgeId 知识点ID
   * @returns 标签列表
   */
  getKnowledgeTags(knowledgeId: string): Tag[] {
    try {
      log.debug(`[${this.tableName}] Getting tags for knowledge: knowledgeId=${knowledgeId}`)

      const stmt = this.db.prepare(`
        SELECT t.* FROM tags t
        INNER JOIN knowledge_tags kt ON t.id = kt.tag_id
        WHERE kt.knowledge_id = ?
      `)
      const rows = stmt.all(knowledgeId) as Record<string, any>[]

      const tags = rows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at
      })) as Tag[]

      log.debug(`[${this.tableName}] Found ${tags.length} tags for knowledge`)
      return tags
    } catch (error) {
      log.error(`[${this.tableName}] Error getting knowledge tags:`, error)
      throw new DatabaseError('Failed to get knowledge tags')
    }
  }

  /**
   * 按标签筛选知识点（使用关联表）
   * @param tagIds 标签ID数组
   * @returns 包含任意指定标签的知识点列表
   */
  findByTagIds(tagIds: string[]): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Finding by tag IDs:`, tagIds)

      if (tagIds.length === 0) {
        return []
      }

      const placeholders = tagIds.map(() => '?').join(', ')
      const stmt = this.db.prepare(`
        SELECT DISTINCT k.* FROM ${this.tableName} k
        INNER JOIN knowledge_tags kt ON k.id = kt.knowledge_id
        WHERE kt.tag_id IN (${placeholders})
        ORDER BY k.updated_at DESC
      `)
      const rows = stmt.all(...tagIds) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} records by tag IDs`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by tag IDs:`, error)
      throw new DatabaseError('Failed to find records by tag IDs')
    }
  }

  /**
   * 按分类筛选知识点
   * @param categoryId 分类ID
   * @returns 该分类的知识点列表
   */
  findByCategory(categoryId: string): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Finding by category:`, categoryId)

      const stmt = this.db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE category = ?
        ORDER BY updated_at DESC
      `)
      const rows = stmt.all(categoryId) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} records by category`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by category:`, error)
      throw new DatabaseError('Failed to find records by category')
    }
  }

  /**
   * 高级筛选知识点
   * @param filters 筛选条件
   * @returns 符合条件的知识点列表
   */
  filter(filters: {
    tags?: string[]
    categoryId?: string
    status?: 'learning' | 'mastered'
    dateFrom?: string
    dateTo?: string
    keyword?: string
  }): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Filtering with:`, filters)

      let query = `SELECT DISTINCT k.* FROM ${this.tableName} k`
      const params: any[] = []
      const conditions: string[] = []

      // 标签筛选（多选，AND关系）
      if (filters.tags && filters.tags.length > 0) {
        query += ` INNER JOIN knowledge_tags kt ON k.id = kt.knowledge_id`
        const placeholders = filters.tags.map(() => '?').join(',')
        conditions.push(`kt.tag_id IN (${placeholders})`)
        params.push(...filters.tags)

        // 确保所有标签都匹配
        conditions.push(`
          (SELECT COUNT(*) FROM knowledge_tags WHERE knowledge_id = k.id AND tag_id IN (${placeholders})) = ?
        `)
        params.push(...filters.tags, filters.tags.length)
      }

      // 分类筛选
      if (filters.categoryId) {
        conditions.push(`k.category = ?`)
        params.push(filters.categoryId)
      }

      // 复习状态筛选
      if (filters.status) {
        if (filters.status === 'mastered') {
          conditions.push(`k.mastery_status = 'mastered'`)
        } else {
          conditions.push(`(k.mastery_status = 'learning' OR k.mastery_status IS NULL)`)
        }
      }

      // 日期范围筛选
      if (filters.dateFrom) {
        conditions.push(`k.created_at >= ?`)
        // 支持时间戳字符串和ISO日期字符串
        const timestamp = isNaN(Number(filters.dateFrom)) 
          ? new Date(filters.dateFrom).getTime() 
          : Number(filters.dateFrom)
        params.push(timestamp)
      }
      if (filters.dateTo) {
        conditions.push(`k.created_at <= ?`)
        // 支持时间戳字符串和ISO日期字符串
        const timestamp = isNaN(Number(filters.dateTo)) 
          ? new Date(filters.dateTo).getTime() 
          : Number(filters.dateTo)
        params.push(timestamp)
      }

      // 关键词搜索
      if (filters.keyword && filters.keyword.trim()) {
        conditions.push(`(k.title LIKE ? OR k.content LIKE ?)`)
        const searchPattern = `%${filters.keyword}%`
        params.push(searchPattern, searchPattern)
      }

      // 组合条件
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      query += ` ORDER BY k.updated_at DESC`

      log.debug(`[${this.tableName}] Filter query:`, query)
      const stmt = this.db.prepare(query)
      const rows = stmt.all(...params) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Filter found ${results.length} records`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error filtering records:`, error)
      throw new DatabaseError('Failed to filter records')
    }
  }

  /**
   * 更新知识点掌握状态
   * @param id 知识点ID
   * @param status 掌握状态
   * @param masteredAt 掌握时间（可选）
   * @returns 更新后的Knowledge对象
   */
  updateMasteryStatus(
    id: string,
    status: 'learning' | 'mastered',
    masteredAt: number | null = null
  ): Knowledge {
    try {
      log.debug(`[${this.tableName}] Updating mastery status: id=${id}, status=${status}`)

      const stmt = this.db.prepare(`
        UPDATE ${this.tableName}
        SET mastery_status = ?,
            mastered_at = ?,
            updated_at = ?
        WHERE id = ?
      `)

      stmt.run(status, masteredAt, Date.now(), id)

      const knowledge = this.findById(id)
      if (!knowledge) {
        throw new DatabaseError('Knowledge not found after mastery update')
      }

      log.info(`[${this.tableName}] Mastery status updated`, { id, status, masteredAt })
      return knowledge
    } catch (error) {
      log.error(`[${this.tableName}] Error updating mastery status:`, error)
      throw new DatabaseError('Failed to update mastery status')
    }
  }

  /**
   * 查询已掌握的知识点
   * @returns 已掌握的知识点列表
   */
  findMasteredKnowledge(): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Finding mastered knowledge`)

      const stmt = this.db.prepare(`
        SELECT * FROM ${this.tableName}
        WHERE mastery_status = 'mastered'
        ORDER BY mastered_at DESC
      `)

      const rows = stmt.all() as Record<string, any>[]
      const results = rows.map((row) => this.mapRowToEntity(row))

      log.debug(`[${this.tableName}] Found ${results.length} mastered knowledge`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding mastered knowledge:`, error)
      throw new DatabaseError('Failed to find mastered knowledge')
    }
  }

  /**
   * 统计掌握数量和占比
   * @returns 掌握统计信息
   */
  getMasteryStats(): {
    total: number
    mastered: number
    learning: number
    masteryRate: number
  } {
    try {
      log.debug(`[${this.tableName}] Getting mastery stats`)

      const totalStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM ${this.tableName}
      `)
      const masteredStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM ${this.tableName} 
        WHERE mastery_status = 'mastered'
      `)

      const totalRow = totalStmt.get() as { count: number }
      const masteredRow = masteredStmt.get() as { count: number }

      const total = totalRow?.count || 0
      const mastered = masteredRow?.count || 0
      const learning = total - mastered
      const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0

      log.debug(`[${this.tableName}] Mastery stats:`, { total, mastered, learning, masteryRate })

      return { total, mastered, learning, masteryRate }
    } catch (error) {
      log.error(`[${this.tableName}] Error getting mastery stats:`, error)
      throw new DatabaseError('Failed to get mastery stats')
    }
  }

  /**
   * 按日期范围统计知识点数量
   * @param startDate 开始日期（YYYY-MM-DD）
   * @param endDate 结束日期（YYYY-MM-DD）
   * @returns 每日统计 { date: string, count: number }[]
   */
  countByDateRange(startDate: string, endDate: string): Array<{ date: string; count: number }> {
    try {
      log.debug(`[${this.tableName}] Counting by date range:`, { startDate, endDate })

      const query = `
        SELECT 
          DATE(created_at / 1000, 'unixepoch') as date,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE DATE(created_at / 1000, 'unixepoch') BETWEEN ? AND ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
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
   * 按日期查询知识点
   * @param date 日期（YYYY-MM-DD）
   * @returns 知识点列表
   */
  findByDate(date: string): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Finding by date:`, date)

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE DATE(created_at / 1000, 'unixepoch') = ?
        ORDER BY created_at DESC
      `
      const stmt = this.db.prepare(query)
      const rows = stmt.all(date) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} records for date ${date}`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding by date:`, error)
      throw new DatabaseError('Failed to find by date')
    }
  }

  /**
   * 按年度统计知识点数量（每天）
   * @param year 年份（YYYY）
   * @returns Map<日期(YYYY-MM-DD), 数量>
   */
  countByYear(year: number): Map<string, number> {
    try {
      log.debug(`[${this.tableName}] Counting by year:`, year)

      const query = `
        SELECT 
          DATE(created_at / 1000, 'unixepoch') as date,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE strftime('%Y', DATE(created_at / 1000, 'unixepoch')) = ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
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
   * 按年度查询所有知识点
   * @param year 年份（YYYY）
   * @returns 知识点列表
   */
  findByYear(year: number): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Finding by year:`, year)

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE strftime('%Y', DATE(created_at / 1000, 'unixepoch')) = ?
        ORDER BY created_at DESC
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
   * 统计今日新增知识点数量
   * @returns 今日新增数量
   */
  countCreatedToday(): number {
    try {
      log.debug(`[${this.tableName}] Counting created today`)

      const dayjs = require('dayjs')
      const todayStart = dayjs().startOf('day').valueOf()
      const todayEnd = dayjs().endOf('day').valueOf()

      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM ${this.tableName} 
        WHERE created_at >= ? AND created_at <= ?
      `)
      const result = stmt.get(todayStart, todayEnd) as { count: number }

      log.debug(`[${this.tableName}] Created today:`, result.count)
      return result.count || 0
    } catch (error) {
      log.error(`[${this.tableName}] Error counting created today:`, error)
      throw new DatabaseError('Failed to count created today')
    }
  }

  /**
   * 统计待复习知识点数量
   * @returns 待复习数量
   */
  countDueToday(): number {
    try {
      log.debug(`[${this.tableName}] Counting due today`)

      const now = Date.now()
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM ${this.tableName}
        WHERE next_review_at <= ? AND next_review_at IS NOT NULL
      `)
      const result = stmt.get(now) as { count: number }

      log.debug(`[${this.tableName}] Due today:`, result.count)
      return result.count || 0
    } catch (error) {
      log.error(`[${this.tableName}] Error counting due today:`, error)
      throw new DatabaseError('Failed to count due today')
    }
  }

  /**
   * 查询今日待复习的知识点
   * @returns 待复习的知识点列表
   */
  findDueToday(): Knowledge[] {
    try {
      log.debug(`[${this.tableName}] Finding due today`)

      const now = Date.now()
      const stmt = this.db.prepare(`
        SELECT *
        FROM ${this.tableName}
        WHERE next_review_at <= ? AND next_review_at IS NOT NULL
        ORDER BY next_review_at ASC
      `)
      const rows = stmt.all(now) as Record<string, any>[]

      const results = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${results.length} due today`)
      return results
    } catch (error) {
      log.error(`[${this.tableName}] Error finding due today:`, error)
      throw new DatabaseError('Failed to find due today')
    }
  }

  /**
   * 获取连续学习天数
   * @returns 当前和最长连续天数
   */
  getStreakDays(): { current: number; longest: number } {
    try {
      log.debug(`[${this.tableName}] Getting streak days`)

      const dayjs = require('dayjs')

      // 查询所有有活动的日期（新增知识点或复习）
      const stmt = this.db.prepare(`
        SELECT DISTINCT DATE(created_at / 1000, 'unixepoch') as date
        FROM (
          SELECT created_at FROM ${this.tableName}
          UNION
          SELECT reviewed_at as created_at FROM review_history
        )
        ORDER BY date DESC
      `)

      const rows = stmt.all() as Array<{ date: string }>
      const dates = rows.map((row) => row.date)

      if (dates.length === 0) {
        return { current: 0, longest: 0 }
      }

      // 计算当前连续天数
      let current = 0
      const today = dayjs().format('YYYY-MM-DD')
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

      // 检查今天或昨天是否有活动
      if (dates[0] === today || dates[0] === yesterday) {
        current = 1
        let checkDate = dayjs(dates[0])

        for (let i = 1; i < dates.length; i++) {
          const prevDate = dayjs(dates[i])
          const diff = checkDate.diff(prevDate, 'day')

          if (diff === 1) {
            current++
            checkDate = prevDate
          } else {
            break
          }
        }
      }

      // 计算最长连续天数
      let longest = 0
      let tempStreak = 1
      let prevDate = dayjs(dates[0])

      for (let i = 1; i < dates.length; i++) {
        const currentDate = dayjs(dates[i])
        const diff = prevDate.diff(currentDate, 'day')

        if (diff === 1) {
          tempStreak++
        } else {
          longest = Math.max(longest, tempStreak)
          tempStreak = 1
        }
        prevDate = currentDate
      }
      longest = Math.max(longest, tempStreak)

      log.debug(`[${this.tableName}] Streak days:`, { current, longest })
      return { current, longest }
    } catch (error) {
      log.error(`[${this.tableName}] Error getting streak days:`, error)
      throw new DatabaseError('Failed to get streak days')
    }
  }
}
