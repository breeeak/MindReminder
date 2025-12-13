import { DatabaseService } from '../DatabaseService'
import { DatabaseError } from '../../utils/errors'
import log from '../../utils/logger'
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

/**
 * 命名转换工具：camelCase -> snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * 命名转换工具：snake_case -> camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 将对象的键从 camelCase 转换为 snake_case
 */
export function objectToSnakeCase<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value
  }
  return result
}

/**
 * 将对象的键从 snake_case 转换为 camelCase
 */
export function objectToCamelCase<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value
  }
  return result
}

/**
 * BaseRepository抽象类
 * 提供通用的CRUD操作和数据库访问基础设施
 * 
 * @template T 实体类型
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected db: Database.Database
  protected tableName: string

  /**
   * 构造函数
   * @param dbService 数据库服务实例
   * @param tableName 数据库表名
   */
  constructor(dbService: DatabaseService, tableName: string) {
    this.db = dbService.getConnection()
    this.tableName = tableName
  }

  /**
   * 根据ID查询单条记录
   * @param id 记录ID（UUID）
   * @returns 实体对象，不存在返回null
   */
  findById(id: string): T | null {
    try {
      log.debug(`[${this.tableName}] Finding record by id:`, id)

      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
      const row = stmt.get(id) as Record<string, any> | undefined

      if (!row) {
        log.debug(`[${this.tableName}] Record not found: id=${id}`)
        return null
      }

      const entity = this.mapRowToEntity(row)
      log.debug(`[${this.tableName}] Found record:`, entity)
      return entity
    } catch (error) {
      log.error(`[${this.tableName}] Error finding record by id:`, error)
      throw new DatabaseError(`Failed to find record by id: ${id}`, { cause: error })
    }
  }

  /**
   * 查询所有记录
   * @returns 实体数组
   */
  findAll(): T[] {
    try {
      log.debug(`[${this.tableName}] Finding all records`)

      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`)
      const rows = stmt.all() as Record<string, any>[]

      const entities = rows.map((row) => this.mapRowToEntity(row))
      log.debug(`[${this.tableName}] Found ${entities.length} records`)
      return entities
    } catch (error) {
      log.error(`[${this.tableName}] Error finding all records:`, error)
      throw new DatabaseError('Failed to find all records', { cause: error })
    }
  }

  /**
   * 创建新记录
   * @param data 实体数据（部分字段）
   * @returns 创建的实体对象（包含生成的UUID）
   */
  create(data: Partial<Omit<T, 'id'>>): T {
    try {
      // 生成UUID
      const id = randomUUID()
      
      log.debug(`[${this.tableName}] Creating record with id=${id}:`, data)

      // 转换为snake_case
      const dbData = objectToSnakeCase(data as Record<string, any>)
      dbData.id = id

      // 构建INSERT语句
      const columns = Object.keys(dbData)
      const placeholders = columns.map(() => '?').join(', ')
      const values = Object.values(dbData)

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`
      const stmt = this.db.prepare(sql)
      stmt.run(...values)

      // 查询刚创建的记录
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
   * 更新记录
   * @param id 记录ID（UUID）
   * @param data 要更新的字段
   * @returns 更新后的实体对象
   */
  update(id: string, data: Partial<Omit<T, 'id'>>): T {
    try {
      log.debug(`[${this.tableName}] Updating record: id=${id}`, data)

      // 转换为snake_case
      const dbData = objectToSnakeCase(data as Record<string, any>)

      // 构建UPDATE语句
      const columns = Object.keys(dbData)
      const setClause = columns.map((col) => `${col} = ?`).join(', ')
      const values = Object.values(dbData)

      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
      const stmt = this.db.prepare(sql)
      const result = stmt.run(...values, id)

      if (result.changes === 0) {
        throw new DatabaseError(`Record not found: id=${id}`)
      }

      // 查询更新后的记录
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

  /**
   * 删除记录
   * @param id 记录ID（UUID）
   * @returns 是否删除成功
   */
  delete(id: string): boolean {
    try {
      log.debug(`[${this.tableName}] Deleting record: id=${id}`)

      const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
      const result = stmt.run(id)

      const success = result.changes > 0
      if (success) {
        log.info(`[${this.tableName}] Record deleted successfully: id=${id}`)
      } else {
        log.warn(`[${this.tableName}] Record not found for deletion: id=${id}`)
      }

      return success
    } catch (error) {
      log.error(`[${this.tableName}] Error deleting record:`, error)
      throw new DatabaseError(`Failed to delete record: id=${id}`, { cause: error })
    }
  }

  /**
   * 将数据库行映射为实体对象
   * 子类可以重写此方法以实现自定义映射逻辑
   * 
   * @param row 数据库行（snake_case）
   * @returns 实体对象（camelCase）
   */
  protected mapRowToEntity(row: Record<string, any>): T {
    // 默认实现：转换键名为camelCase
    return objectToCamelCase(row) as T
  }

  /**
   * 将实体对象映射为数据库行
   * 子类可以重写此方法以实现自定义映射逻辑
   * 
   * @param entity 实体对象（camelCase）
   * @returns 数据库行（snake_case）
   */
  protected mapEntityToRow(entity: Partial<T>): Record<string, any> {
    // 默认实现：转换键名为snake_case
    return objectToSnakeCase(entity as Record<string, any>)
  }
}

