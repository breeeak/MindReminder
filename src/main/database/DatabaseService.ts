import Database from 'better-sqlite3'
import { getAllMigrations } from './migrations'
import { AppError, DatabaseError, MigrationError } from '../utils/errors'
import { getDatabasePath } from '../utils/pathHelper'
import log from '../utils/logger'
import { DatabaseHealthCheck } from './DatabaseHealthCheck'

export class DatabaseService {
  private db: Database.Database | null = null
  private dbPath: string

  constructor() {
    // 使用pathHelper获取数据库路径
    this.dbPath = getDatabasePath()

    log.info('Database path:', this.dbPath)
  }

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    try {
      // 创建数据库连接
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? log.debug : undefined
      })

      // 启用外键约束
      this.db.pragma('foreign_keys = ON')

      // 设置WAL模式（更好的并发性能）
      this.db.pragma('journal_mode = WAL')

      log.info('Database connection established')

      // 执行迁移
      this.runMigrations()

      // 验证完整性和健康状况
      await this.performHealthCheck()

      log.info('Database initialized successfully')
    } catch (error) {
      log.error('Failed to initialize database:', error)

      if (error instanceof AppError) {
        throw error
      }

      throw new DatabaseError(`Database initialization failed: ${error}`)
    }
  }

  /**
   * 获取数据库连接实例
   */
  getConnection(): Database.Database {
    if (!this.db) {
      throw new DatabaseError('Database not initialized. Call initialize() first.')
    }
    return this.db
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close()
        log.info('Database connection closed')
        this.db = null
      } catch (error) {
        log.error('Error closing database:', error)
      }
    }
  }

  /**
   * 执行数据库迁移
   */
  runMigrations(): void {
    if (!this.db) {
      throw new DatabaseError('Database not initialized')
    }

    try {
      // 创建migrations表（记录已执行的迁移）
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER NOT NULL UNIQUE,
          name TEXT NOT NULL,
          executed_at INTEGER NOT NULL
        )
      `)

      // 获取已执行的迁移版本
      const executedMigrations = this.db
        .prepare('SELECT version FROM migrations ORDER BY version')
        .all()
        .map((row: any) => row.version)

      log.info('Executed migrations:', executedMigrations)

      // 获取所有迁移
      const migrations = getAllMigrations()

      // 按版本号排序
      migrations.sort((a, b) => a.version - b.version)

      // 执行待处理的迁移
      for (const migration of migrations) {
        if (!executedMigrations.includes(migration.version)) {
          log.info(`Running migration ${migration.version}: ${migration.name}`)

          try {
            // 使用事务执行迁移（原子性）
            const transaction = this.db.transaction(() => {
              this.db!.exec(migration.sql)

              // 记录迁移执行
              this.db!.prepare(
                `
                INSERT INTO migrations (version, name, executed_at)
                VALUES (?, ?, ?)
              `
              ).run(migration.version, migration.name, Date.now())
            })

            transaction()

            log.info(`Migration ${migration.version} completed successfully`)
          } catch (error) {
            log.error(`Migration ${migration.version} failed:`, error)
            log.error('SQL:', migration.sql)

            // 迁移失败时，事务已自动回滚
            throw new MigrationError(
              `Migration ${migration.version} (${migration.name}) failed: ${error}`
            )
          }
        }
      }

      log.info('All migrations completed successfully')
    } catch (error) {
      log.error('Migration process failed:', error)

      if (error instanceof AppError) {
        throw error
      }

      throw new MigrationError(`Database migration failed: ${error}`)
    }
  }

  /**
   * 数据库完整性检查
   */
  checkIntegrity(): boolean {
    if (!this.db) {
      return false
    }

    try {
      const result = this.db.pragma('integrity_check') as Array<{ integrity_check: string }>
      const isValid = result.length === 1 && result[0].integrity_check === 'ok'

      if (isValid) {
        log.info('Database integrity check: OK')
      } else {
        log.error('Database integrity check: FAILED', result)
      }

      return isValid
    } catch (error) {
      log.error('Database integrity check error:', error)
      return false
    }
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized')
    }

    const healthCheck = new DatabaseHealthCheck(this.db, this.dbPath)
    const result = await healthCheck.performFullCheck()

    if (!result.isHealthy) {
      log.warn('Database health check failed. Attempting repair...')

      // 创建紧急备份
      const backupPath = await healthCheck.createEmergencyBackup()
      if (backupPath) {
        log.info('Emergency backup created:', backupPath)
      }

      // 尝试修复
      const repaired = await healthCheck.attemptRepair()

      if (!repaired) {
        throw new DatabaseError(
          'Database health check failed and repair unsuccessful. Please restore from backup.'
        )
      }

      log.info('Database repaired successfully')
    }

    // 记录数据库统计信息
    const stats = healthCheck.getStatistics()
    log.info('Database statistics:', stats)
  }
}

// 单例模式
let databaseServiceInstance: DatabaseService | null = null

export function getDatabaseService(): DatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new DatabaseService()
  }
  return databaseServiceInstance
}
