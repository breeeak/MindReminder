import { BaseRepository } from './BaseRepository'
import { DatabaseService } from '../DatabaseService'
import { Tag } from '../types'
import { DatabaseError } from '../../utils/errors'
import log from '../../utils/logger'
import { randomUUID } from 'crypto'

/**
 * TagRepository
 * 管理标签数据的访问
 */
export class TagRepository extends BaseRepository<Tag> {
  constructor(dbService: DatabaseService) {
    super(dbService, 'tags')
  }

  /**
   * 获取所有标签（自动完成用）
   * @returns 所有标签列表
   */
  getAllTags(): Tag[] {
    return this.findAll()
  }

  /**
   * 按名称查找标签
   * @param name 标签名称
   * @returns 标签对象，不存在返回null
   */
  findByName(name: string): Tag | null {
    try {
      log.debug(`[${this.tableName}] Finding tag by name:`, name)

      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE name = ?`)
      const row = stmt.get(name) as Record<string, any> | undefined

      if (!row) {
        log.debug(`[${this.tableName}] Tag not found: name=${name}`)
        return null
      }

      const tag = this.mapRowToEntity(row)
      log.debug(`[${this.tableName}] Found tag:`, tag)
      return tag
    } catch (error) {
      log.error(`[${this.tableName}] Error finding tag by name:`, error)
      throw new DatabaseError(`Failed to find tag by name: ${name}`)
    }
  }

  /**
   * 批量创建标签（如果不存在）
   * @param names 标签名称数组
   * @returns 标签对象数组
   */
  findOrCreateByNames(names: string[]): Tag[] {
    try {
      log.debug(`[${this.tableName}] Finding or creating tags:`, names)

      const tags: Tag[] = []
      const now = Date.now()

      for (const name of names) {
        // 先查找是否已存在
        let tag = this.findByName(name)

        // 不存在则创建
        if (!tag) {
          const id = randomUUID()
          const stmt = this.db.prepare(
            `INSERT INTO ${this.tableName} (id, name, created_at) VALUES (?, ?, ?)`
          )
          stmt.run(id, name, now)

          tag = this.findById(id)
          if (!tag) {
            throw new DatabaseError(`Failed to create tag: ${name}`)
          }

          log.info(`[${this.tableName}] Tag created: ${name}`)
        }

        tags.push(tag)
      }

      log.debug(`[${this.tableName}] Found/created ${tags.length} tags`)
      return tags
    } catch (error) {
      log.error(`[${this.tableName}] Error finding or creating tags:`, error)
      throw new DatabaseError('Failed to find or create tags')
    }
  }

  /**
   * 获取标签使用次数
   * @param tagId 标签ID
   * @returns 使用次数
   */
  getTagUsageCount(tagId: string): number {
    try {
      log.debug(`[${this.tableName}] Getting usage count for tag:`, tagId)

      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM knowledge_tags WHERE tag_id = ?`)
      const result = stmt.get(tagId) as { count: number } | undefined

      const count = result?.count || 0
      log.debug(`[${this.tableName}] Tag usage count: ${count}`)
      return count
    } catch (error) {
      log.error(`[${this.tableName}] Error getting tag usage count:`, error)
      throw new DatabaseError('Failed to get tag usage count')
    }
  }
}
