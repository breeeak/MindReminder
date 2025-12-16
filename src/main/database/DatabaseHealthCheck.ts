import Database from 'better-sqlite3'
import log from '../utils/logger'
import * as fs from 'fs'

/**
 * 数据库健康检查结果
 */
export interface HealthCheckResult {
  isHealthy: boolean
  integrityCheck: boolean
  schemaCheck: boolean
  dataCheck: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 数据库健康检查和恢复工具
 */
export class DatabaseHealthCheck {
  private db: Database.Database
  private dbPath: string

  constructor(db: Database.Database, dbPath: string) {
    this.db = db
    this.dbPath = dbPath
  }

  /**
   * 执行完整的健康检查
   */
  async performFullCheck(): Promise<HealthCheckResult> {
    log.info('Starting database health check...')

    const result: HealthCheckResult = {
      isHealthy: true,
      integrityCheck: false,
      schemaCheck: false,
      dataCheck: false,
      errors: [],
      warnings: []
    }

    try {
      // 1. 完整性检查
      result.integrityCheck = await this.checkIntegrity(result)

      // 2. 模式检查
      result.schemaCheck = await this.checkSchema(result)

      // 3. 数据检查
      result.dataCheck = await this.checkData(result)

      // 确定整体健康状态
      result.isHealthy = result.integrityCheck && result.schemaCheck && result.dataCheck

      if (result.isHealthy) {
        log.info('Database health check: PASSED')
      } else {
        log.warn('Database health check: FAILED', {
          errors: result.errors,
          warnings: result.warnings
        })
      }
    } catch (error) {
      log.error('Database health check error:', error)
      result.isHealthy = false
      result.errors.push(`Health check failed: ${error}`)
    }

    return result
  }

  /**
   * 检查数据库完整性
   */
  private async checkIntegrity(result: HealthCheckResult): Promise<boolean> {
    try {
      const integrityResult = this.db.pragma('integrity_check') as Array<{
        integrity_check: string
      }>

      if (integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok') {
        log.info('Database integrity: OK')
        return true
      } else {
        const errorMsg = `Integrity check failed: ${JSON.stringify(integrityResult)}`
        log.error(errorMsg)
        result.errors.push(errorMsg)
        return false
      }
    } catch (error) {
      const errorMsg = `Integrity check error: ${error}`
      log.error(errorMsg)
      result.errors.push(errorMsg)
      return false
    }
  }

  /**
   * 检查数据库模式
   */
  private async checkSchema(result: HealthCheckResult): Promise<boolean> {
    try {
      const requiredTables = [
        'knowledge',
        'review_history',
        'diary',
        'reminder',
        'settings',
        'tags',
        'categories',
        'knowledge_tags',
        'migrations'
      ]

      const existingTables = this.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((row: any) => row.name)

      const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

      if (missingTables.length > 0) {
        const errorMsg = `Missing tables: ${missingTables.join(', ')}`
        log.error(errorMsg)
        result.errors.push(errorMsg)
        return false
      }

      log.info('Database schema: OK')
      return true
    } catch (error) {
      const errorMsg = `Schema check error: ${error}`
      log.error(errorMsg)
      result.errors.push(errorMsg)
      return false
    }
  }

  /**
   * 检查数据一致性
   */
  private async checkData(result: HealthCheckResult): Promise<boolean> {
    try {
      let hasIssues = false

      // 检查外键约束
      const foreignKeyCheck = this.db.pragma('foreign_key_check') as Array<any>
      if (foreignKeyCheck.length > 0) {
        const warningMsg = `Foreign key violations found: ${foreignKeyCheck.length} issues`
        log.warn(warningMsg, foreignKeyCheck)
        result.warnings.push(warningMsg)
        hasIssues = true
      }

      // 检查知识点和复习历史的关联
      const orphanedReviews = this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM review_history 
        WHERE knowledge_id NOT IN (SELECT id FROM knowledge)
      `
        )
        .get() as { count: number }

      if (orphanedReviews.count > 0) {
        const warningMsg = `Found ${orphanedReviews.count} orphaned review records`
        log.warn(warningMsg)
        result.warnings.push(warningMsg)
      }

      // 检查标签关联
      const orphanedTagRelations = this.db
        .prepare(
          `
        SELECT COUNT(*) as count FROM knowledge_tags 
        WHERE knowledge_id NOT IN (SELECT id FROM knowledge)
           OR tag_id NOT IN (SELECT id FROM tags)
      `
        )
        .get() as { count: number }

      if (orphanedTagRelations.count > 0) {
        const warningMsg = `Found ${orphanedTagRelations.count} orphaned tag relations`
        log.warn(warningMsg)
        result.warnings.push(warningMsg)
      }

      if (!hasIssues) {
        log.info('Database data consistency: OK')
      }

      return !hasIssues
    } catch (error) {
      const errorMsg = `Data check error: ${error}`
      log.error(errorMsg)
      result.errors.push(errorMsg)
      return false
    }
  }

  /**
   * 尝试修复数据库
   */
  async attemptRepair(): Promise<boolean> {
    log.info('Attempting database repair...')

    try {
      // 清理孤立的复习记录
      const deletedReviews = this.db
        .prepare(
          `
        DELETE FROM review_history 
        WHERE knowledge_id NOT IN (SELECT id FROM knowledge)
      `
        )
        .run()

      if (deletedReviews.changes > 0) {
        log.info(`Cleaned up ${deletedReviews.changes} orphaned review records`)
      }

      // 清理孤立的标签关联
      const deletedTagRelations = this.db
        .prepare(
          `
        DELETE FROM knowledge_tags 
        WHERE knowledge_id NOT IN (SELECT id FROM knowledge)
           OR tag_id NOT IN (SELECT id FROM tags)
      `
        )
        .run()

      if (deletedTagRelations.changes > 0) {
        log.info(`Cleaned up ${deletedTagRelations.changes} orphaned tag relations`)
      }

      // 运行 VACUUM 来优化数据库
      this.db.prepare('VACUUM').run()
      log.info('Database vacuumed successfully')

      // 重新检查完整性
      const integrityResult = this.db.pragma('integrity_check') as Array<{
        integrity_check: string
      }>

      const repaired = integrityResult.length === 1 && integrityResult[0].integrity_check === 'ok'

      if (repaired) {
        log.info('Database repair successful')
      } else {
        log.error('Database repair failed', integrityResult)
      }

      return repaired
    } catch (error) {
      log.error('Database repair error:', error)
      return false
    }
  }

  /**
   * 创建紧急备份
   */
  async createEmergencyBackup(): Promise<string | null> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = this.dbPath.replace('.db', `_emergency_${timestamp}.db`)

      // 关闭当前连接
      this.db.close()

      // 复制数据库文件
      fs.copyFileSync(this.dbPath, backupPath)

      log.info('Emergency backup created:', backupPath)

      // 重新打开数据库
      this.db = new Database(this.dbPath)

      return backupPath
    } catch (error) {
      log.error('Failed to create emergency backup:', error)
      return null
    }
  }

  /**
   * 获取数据库统计信息
   */
  getStatistics(): Record<string, any> {
    try {
      const stats: Record<string, any> = {}

      // 数据库文件大小
      if (fs.existsSync(this.dbPath)) {
        const fileStats = fs.statSync(this.dbPath)
        stats.fileSize = fileStats.size
        stats.fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2)
      }

      // 表统计
      const tables = [
        'knowledge',
        'review_history',
        'diary',
        'reminder',
        'tags',
        'categories',
        'settings'
      ]

      for (const table of tables) {
        try {
          const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as {
            count: number
          }
          stats[`${table}_count`] = count.count
        } catch (error) {
          stats[`${table}_count`] = 'error'
        }
      }

      // 数据库版本
      const versionInfo = this.db.prepare('SELECT version FROM migrations ORDER BY version DESC LIMIT 1').get() as
        | { version: number }
        | undefined

      stats.schemaVersion = versionInfo?.version || 0

      return stats
    } catch (error) {
      log.error('Failed to get database statistics:', error)
      return { error: String(error) }
    }
  }
}


