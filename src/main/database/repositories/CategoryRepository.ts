import { BaseRepository } from './BaseRepository'
import { DatabaseService } from '../DatabaseService'
import { Category } from '../types'
import { DatabaseError } from '../../utils/errors'
import log from '../../utils/logger'

/**
 * CategoryRepository
 * 管理分类数据的访问
 */
export class CategoryRepository extends BaseRepository<Category> {
  constructor(dbService: DatabaseService) {
    super(dbService, 'categories')
  }

  /**
   * 获取所有分类
   * @returns 所有分类列表
   */
  getAllCategories(): Category[] {
    return this.findAll()
  }

  /**
   * 创建自定义分类
   * @param name 分类名称
   * @returns 创建的分类对象
   */
  createCustomCategory(name: string): Category {
    try {
      log.debug(`[${this.tableName}] Creating custom category:`, name)

      // 检查是否已存在同名分类
      const existing = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE name = ?`).get(name)

      if (existing) {
        const errorMsg = `分类已存在: ${name}`
        log.warn(`[${this.tableName}] ${errorMsg}`)
        throw new DatabaseError(errorMsg)
      }

      const now = Date.now()
      const category = this.create({
        name,
        isCustom: true,
        createdAt: now
      } as Partial<Omit<Category, 'id'>>)

      log.info(`[${this.tableName}] Custom category created:`, category)
      return category
    } catch (error) {
      log.error(`[${this.tableName}] Error creating custom category:`, error)
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(`创建自定义分类失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 删除自定义分类
   * @param id 分类ID
   */
  deleteCustomCategory(id: string): void {
    try {
      log.debug(`[${this.tableName}] Deleting custom category:`, id)

      // 检查是否为自定义分类
      const category = this.findById(id)
      if (!category) {
        throw new DatabaseError(`Category not found: ${id}`)
      }

      if (!category.isCustom) {
        throw new DatabaseError('Cannot delete predefined category')
      }

      // 删除分类
      const success = this.delete(id)
      if (!success) {
        throw new DatabaseError('Failed to delete custom category')
      }

      log.info(`[${this.tableName}] Custom category deleted: ${id}`)
    } catch (error) {
      log.error(`[${this.tableName}] Error deleting custom category:`, error)
      throw new DatabaseError('Failed to delete custom category')
    }
  }
}
