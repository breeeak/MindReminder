import { getDatabaseService } from './DatabaseService'
import log from '../utils/logger'

export function validateDatabaseSchema(): boolean {
  const dbService = getDatabaseService()
  const db = dbService.getConnection()

  try {
    // 检查必需的表
    const requiredTables = [
      'knowledge',
      'review_history',
      'diary',
      'reminder',
      'settings',
      'migrations'
    ]
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableNames = tables.map((t: any) => t.name)

    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        log.error(`Missing required table: ${table}`)
        return false
      }
    }

    log.info('All required tables exist')

    // 检查索引（更严格）
    const requiredIndices = [
      'idx_knowledge_next_review',
      'idx_knowledge_category',
      'idx_knowledge_status',
      'idx_knowledge_tags',
      'idx_review_history_knowledge',
      'idx_review_history_date',
      'idx_diary_date',
      'idx_reminder_due_date',
      'idx_reminder_completed'
    ]

    const indices = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
      .all()
    const indexNames = indices.map((i: any) => i.name)

    for (const indexName of requiredIndices) {
      if (!indexNames.includes(indexName)) {
        log.error(`Missing required index: ${indexName}`)
        return false
      }
    }

    log.info(`All ${requiredIndices.length} required indices exist`)

    // 检查外键是否启用
    const foreignKeysEnabled = db.pragma('foreign_keys', { simple: true })
    if (foreignKeysEnabled !== 1) {
      log.error('Foreign keys are not enabled')
      return false
    }
    log.info('Foreign keys are enabled')

    // 检查WAL模式
    const journalMode = db.pragma('journal_mode', { simple: true })
    if (journalMode !== 'wal') {
      log.warn(`Journal mode is ${journalMode}, expected WAL`)
    } else {
      log.info('WAL journal mode is active')
    }

    // 检查预设数据
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as {
      count: number
    }
    if (settingsCount.count < 5) {
      log.error(`Settings table has ${settingsCount.count} rows, expected at least 5`)
      return false
    }

    log.info(`Settings table has ${settingsCount.count} default values`)

    log.info('Database schema validation passed')
    return true
  } catch (error) {
    log.error('Schema validation error:', error)
    return false
  }
}
