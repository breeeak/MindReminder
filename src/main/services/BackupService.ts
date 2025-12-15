import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import log from '../utils/logger'
import { BackupError } from '../utils/errors'
import { DatabaseService } from '../database/DatabaseService'
import type { Knowledge, ReviewHistory, Diary, Reminder } from '../database/types'

/**
 * 备份元数据
 */
export interface BackupMetadata {
  fileName: string
  filePath: string
  createdAt: number
  size: number
  knowledgeCount: number
  reviewCount: number
  diaryCount: number
  reminderCount: number
}

/**
 * 导出数据结构
 */
export interface ExportData {
  version: string
  exportedAt: number
  knowledge: Knowledge[]
  reviews: ReviewHistory[]
  diaries: Diary[]
  reminders: Reminder[]
}

/**
 * 备份服务
 */
export class BackupService {
  private dbService: DatabaseService
  private backupDir: string
  private lastBackupDate: string | null = null

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
    
    // 设置备份目录
    const userDataPath = app.getPath('userData')
    this.backupDir = path.join(userDataPath, 'backups')
    
    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
      log.info('Backup directory created:', this.backupDir)
    }

    // 加载上次备份日期
    this.loadLastBackupDate()
  }

  /**
   * 检查是否需要自动备份
   */
  shouldAutoBackup(): boolean {
    const today = new Date().toISOString().split('T')[0]
    const needsBackup = this.lastBackupDate !== today

    if (needsBackup) {
      log.info('Auto backup needed', { lastBackup: this.lastBackupDate, today })
    }

    return needsBackup
  }

  /**
   * 执行自动备份
   */
  async performAutoBackup(): Promise<string | null> {
    if (!this.shouldAutoBackup()) {
      log.info('Auto backup skipped: already backed up today')
      return null
    }

    try {
      const backupPath = await this.createBackup()
      this.updateLastBackupDate()
      log.info('Auto backup completed successfully:', backupPath)
      return backupPath
    } catch (error) {
      log.error('Auto backup failed:', error)
      throw new BackupError(`Auto backup failed: ${error}`)
    }
  }

  /**
   * 创建备份
   */
  async createBackup(customPath?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const fileName = `backup_${timestamp}.db`
      const backupPath = customPath || path.join(this.backupDir, fileName)

      // 获取数据库路径
      const dbPath = this.getDbPath()

      // 确保数据库已关闭所有事务
      this.dbService.getConnection().exec('PRAGMA wal_checkpoint(TRUNCATE)')

      // 复制数据库文件
      fs.copyFileSync(dbPath, backupPath)

      // 验证备份文件
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created')
      }

      const stats = fs.statSync(backupPath)
      log.info('Backup created successfully', {
        path: backupPath,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
      })

      // 清理旧备份
      await this.cleanOldBackups()

      return backupPath
    } catch (error) {
      log.error('Failed to create backup:', error)
      throw new BackupError(`Failed to create backup: ${error}`)
    }
  }

  /**
   * 获取所有备份
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return []
      }

      const files = fs.readdirSync(this.backupDir)
      const backupFiles = files.filter((f) => f.startsWith('backup_') && f.endsWith('.db'))

      const backups: BackupMetadata[] = []

      for (const fileName of backupFiles) {
        const filePath = path.join(this.backupDir, fileName)
        const stats = fs.statSync(filePath)

        try {
          const metadata = await this.getBackupMetadata(filePath)
          backups.push({
            fileName,
            filePath,
            createdAt: stats.mtimeMs,
            size: stats.size,
            ...metadata
          })
        } catch (error) {
          log.warn(`Failed to read backup metadata for ${fileName}:`, error)
          // 仍然添加基本信息
          backups.push({
            fileName,
            filePath,
            createdAt: stats.mtimeMs,
            size: stats.size,
            knowledgeCount: 0,
            reviewCount: 0,
            diaryCount: 0,
            reminderCount: 0
          })
        }
      }

      // 按日期降序排序
      backups.sort((a, b) => b.createdAt - a.createdAt)

      return backups
    } catch (error) {
      log.error('Failed to list backups:', error)
      throw new BackupError(`Failed to list backups: ${error}`)
    }
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`)
      }

      const dbPath = this.getDbPath()

      // 创建当前数据库的紧急备份
      const emergencyBackupPath = dbPath.replace('.db', `_before_restore_${Date.now()}.db`)
      fs.copyFileSync(dbPath, emergencyBackupPath)
      log.info('Emergency backup created before restore:', emergencyBackupPath)

      // 关闭数据库连接
      this.dbService.close()

      // 恢复备份
      fs.copyFileSync(backupPath, dbPath)
      log.info('Backup restored successfully:', backupPath)

      // 重新初始化数据库
      this.dbService.initialize()

      log.info('Database reinitialized after restore')
    } catch (error) {
      log.error('Failed to restore backup:', error)
      throw new BackupError(`Failed to restore backup: ${error}`)
    }
  }

  /**
   * 导出数据为 JSON
   */
  async exportToJSON(outputPath: string): Promise<void> {
    try {
      const db = this.dbService.getConnection()

      // 导出所有数据
      const knowledge = db.prepare('SELECT * FROM knowledge').all()
      const reviews = db.prepare('SELECT * FROM review_history').all()
      const diaries = db.prepare('SELECT * FROM diary').all()
      const reminders = db.prepare('SELECT * FROM reminder').all()

      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        knowledge: knowledge as Knowledge[],
        reviews: reviews as ReviewHistory[],
        diaries: diaries as Diary[],
        reminders: reminders as Reminder[]
      }

      // 写入文件
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8')

      log.info('Data exported to JSON successfully:', outputPath)
    } catch (error) {
      log.error('Failed to export to JSON:', error)
      throw new BackupError(`Failed to export to JSON: ${error}`)
    }
  }

  /**
   * 导出数据为 CSV
   */
  async exportToCSV(outputDir: string): Promise<string[]> {
    try {
      const db = this.dbService.getConnection()
      const exportedFiles: string[] = []

      // 导出知识点
      const knowledgePath = path.join(outputDir, 'knowledge.csv')
      const knowledge = db.prepare('SELECT * FROM knowledge').all()
      this.writeCSV(knowledgePath, knowledge)
      exportedFiles.push(knowledgePath)

      // 导出复习历史
      const reviewsPath = path.join(outputDir, 'reviews.csv')
      const reviews = db.prepare('SELECT * FROM review_history').all()
      this.writeCSV(reviewsPath, reviews)
      exportedFiles.push(reviewsPath)

      // 导出日记
      const diariesPath = path.join(outputDir, 'diaries.csv')
      const diaries = db.prepare('SELECT * FROM diary').all()
      this.writeCSV(diariesPath, diaries)
      exportedFiles.push(diariesPath)

      // 导出提醒
      const remindersPath = path.join(outputDir, 'reminders.csv')
      const reminders = db.prepare('SELECT * FROM reminder').all()
      this.writeCSV(remindersPath, reminders)
      exportedFiles.push(remindersPath)

      log.info('Data exported to CSV successfully:', exportedFiles)
      return exportedFiles
    } catch (error) {
      log.error('Failed to export to CSV:', error)
      throw new BackupError(`Failed to export to CSV: ${error}`)
    }
  }

  /**
   * 从 JSON 导入数据
   */
  async importFromJSON(inputPath: string): Promise<void> {
    try {
      const jsonData = fs.readFileSync(inputPath, 'utf-8')
      const importData: ExportData = JSON.parse(jsonData)

      const db = this.dbService.getConnection()

      // 开始事务
      const transaction = db.transaction(() => {
        // 导入知识点
        const insertKnowledge = db.prepare(`
          INSERT OR REPLACE INTO knowledge 
          (id, title, content, tags, category, frequency_coefficient, mastery_status, 
           created_at, updated_at, last_review_at, next_review_at, review_count, mastered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        for (const k of importData.knowledge) {
          insertKnowledge.run(
            k.id,
            k.title,
            k.content,
            k.tags,
            k.category,
            k.frequencyCoefficient || 1.0,
            k.masteryStatus || 'learning',
            k.createdAt,
            k.updatedAt,
            k.lastReviewAt || null,
            k.nextReviewAt || null,
            k.reviewCount || 0,
            k.masteredAt || null
          )
        }

        // 导入复习历史
        const insertReview = db.prepare(`
          INSERT OR REPLACE INTO review_history 
          (id, knowledge_id, rating, reviewed_at, next_review_at, interval_days)
          VALUES (?, ?, ?, ?, ?, ?)
        `)

        for (const r of importData.reviews) {
          // 计算间隔天数
          const intervalDays = (r.nextReviewAt - r.reviewedAt) / (1000 * 60 * 60 * 24)
          insertReview.run(
            r.id,
            r.knowledgeId,
            r.rating,
            r.reviewedAt,
            r.nextReviewAt,
            intervalDays
          )
        }

        // 导入日记
        const insertDiary = db.prepare(`
          INSERT OR REPLACE INTO diary (id, date, content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `)

        for (const d of importData.diaries) {
          insertDiary.run(d.id, d.date, d.content, d.createdAt, d.updatedAt)
        }

        // 导入提醒
        const insertReminder = db.prepare(`
          INSERT OR REPLACE INTO reminder 
          (id, title, content, due_date, completed, completed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)

        for (const r of importData.reminders) {
          insertReminder.run(
            r.id,
            r.title,
            r.content || null,
            r.dueDate,
            r.completed ? 1 : 0,
            r.completedAt || null,
            r.createdAt,
            r.updatedAt
          )
        }
      })

      transaction()

      log.info('Data imported from JSON successfully:', {
        knowledge: importData.knowledge.length,
        reviews: importData.reviews.length,
        diaries: importData.diaries.length,
        reminders: importData.reminders.length
      })
    } catch (error) {
      log.error('Failed to import from JSON:', error)
      throw new BackupError(`Failed to import from JSON: ${error}`)
    }
  }

  /**
   * 获取备份目录路径
   */
  getBackupDirectory(): string {
    return this.backupDir
  }

  // 私有方法

  private getDbPath(): string {
    // 假设数据库路径存储在 app 的 userData 目录
    return path.join(app.getPath('userData'), 'mindreminder.db')
  }

  private async getBackupMetadata(backupPath: string): Promise<{
    knowledgeCount: number
    reviewCount: number
    diaryCount: number
    reminderCount: number
  }> {
    const Database = require('better-sqlite3')
    const db = new Database(backupPath, { readonly: true })

    try {
      const knowledge = db.prepare('SELECT COUNT(*) as count FROM knowledge').get() as {
        count: number
      }
      const reviews = db.prepare('SELECT COUNT(*) as count FROM review_history').get() as {
        count: number
      }
      const diaries = db.prepare('SELECT COUNT(*) as count FROM diary').get() as { count: number }
      const reminders = db.prepare('SELECT COUNT(*) as count FROM reminder').get() as {
        count: number
      }

      return {
        knowledgeCount: knowledge.count,
        reviewCount: reviews.count,
        diaryCount: diaries.count,
        reminderCount: reminders.count
      }
    } finally {
      db.close()
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()
      
      // 保留最近7天的备份
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const oldBackups = backups.filter((b) => b.createdAt < sevenDaysAgo)

      for (const backup of oldBackups) {
        try {
          fs.unlinkSync(backup.filePath)
          log.info('Old backup deleted:', backup.fileName)
        } catch (error) {
          log.warn('Failed to delete old backup:', backup.fileName, error)
        }
      }

      if (oldBackups.length > 0) {
        log.info(`Cleaned up ${oldBackups.length} old backups`)
      }
    } catch (error) {
      log.warn('Failed to clean old backups:', error)
    }
  }

  private loadLastBackupDate(): void {
    const metaPath = path.join(this.backupDir, '.last_backup')
    if (fs.existsSync(metaPath)) {
      this.lastBackupDate = fs.readFileSync(metaPath, 'utf-8').trim()
      log.info('Last backup date loaded:', this.lastBackupDate)
    }
  }

  private updateLastBackupDate(): void {
    const today = new Date().toISOString().split('T')[0]
    const metaPath = path.join(this.backupDir, '.last_backup')
    fs.writeFileSync(metaPath, today, 'utf-8')
    this.lastBackupDate = today
    log.info('Last backup date updated:', today)
  }

  private writeCSV(filePath: string, data: any[]): void {
    if (data.length === 0) {
      fs.writeFileSync(filePath, '', 'utf-8')
      return
    }

    // 获取列名
    const columns = Object.keys(data[0])
    
    // 创建 CSV 头部
    const header = columns.join(',')
    
    // 创建 CSV 行
    const rows = data.map((row) => {
      return columns
        .map((col) => {
          const value = row[col]
          // 处理包含逗号和引号的值
          if (value === null || value === undefined) {
            return ''
          }
          const strValue = String(value)
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`
          }
          return strValue
        })
        .join(',')
    })

    const csv = [header, ...rows].join('\n')
    fs.writeFileSync(filePath, csv, 'utf-8')
  }
}

