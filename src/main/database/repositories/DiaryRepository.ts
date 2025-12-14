import { DatabaseService } from '../DatabaseService'
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import type { Diary, CreateDiaryDTO } from '../types/Diary'
import log from '../../utils/logger'

export class DiaryRepository {
  protected db: Database.Database

  constructor(dbService: DatabaseService) {
    this.db = dbService.getConnection()
  }

  /**
   * 根据日期查找日记
   */
  findByDate(date: string): Diary | null {
    try {
      const row = this.db.prepare('SELECT * FROM diary WHERE date = ?').get(date) as any

      if (!row) return null

      // 转换命名：snake_case → camelCase
      return {
        id: row.id,
        date: row.date,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        syncStatus: row.sync_status
      }
    } catch (error) {
      log.error('DiaryRepository.findByDate failed:', { date, error })
      throw error
    }
  }

  /**
   * 查找日期范围内的所有日记
   */
  findByDateRange(startDate: string, endDate: string): Diary[] {
    try {
      const rows = this.db
        .prepare('SELECT * FROM diary WHERE date >= ? AND date <= ? ORDER BY date DESC')
        .all(startDate, endDate) as any[]

      return rows.map((row) => ({
        id: row.id,
        date: row.date,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        syncStatus: row.sync_status
      }))
    } catch (error) {
      log.error('DiaryRepository.findByDateRange failed:', { startDate, endDate, error })
      throw error
    }
  }

  /**
   * 获取所有有日记的日期列表（用于日历标记）
   */
  getAllDiaryDates(): string[] {
    try {
      const rows = this.db.prepare('SELECT date FROM diary ORDER BY date DESC').all() as any[]

      return rows.map((row) => row.date)
    } catch (error) {
      log.error('DiaryRepository.getAllDiaryDates failed:', error)
      throw error
    }
  }

  /**
   * 保存或更新日记（使用 UPSERT）
   */
  save(data: CreateDiaryDTO): Diary {
    const now = Date.now()

    // 检查是否已存在
    const existing = this.findByDate(data.date)

    const transaction = this.db.transaction(() => {
      if (existing) {
        // 更新现有日记
        this.db
          .prepare(
            `
          UPDATE diary 
          SET content = ?, updated_at = ?
          WHERE date = ?
        `
          )
          .run(data.content, now, data.date)

        log.info('Diary updated', { date: data.date })
        return { ...existing, content: data.content, updatedAt: now }
      } else {
        // 创建新日记
        const id = randomUUID()

        this.db
          .prepare(
            `
          INSERT INTO diary (id, date, content, created_at, updated_at, sync_status)
          VALUES (?, ?, ?, ?, ?, 'local')
        `
          )
          .run(id, data.date, data.content, now, now)

        log.info('Diary created', { id, date: data.date })

        return {
          id,
          date: data.date,
          content: data.content,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'local'
        }
      }
    })

    return transaction()
  }

  /**
   * 删除日记
   */
  delete(date: string): void {
    const transaction = this.db.transaction(() => {
      const result = this.db.prepare('DELETE FROM diary WHERE date = ?').run(date)

      if (result.changes === 0) {
        log.warn('Diary not found for deletion', { date })
        throw new Error(`Diary not found: ${date}`)
      }

      log.info('Diary deleted', { date })
    })

    transaction()
  }

  /**
   * 获取日记总数
   */
  count(): number {
    try {
      const row = this.db.prepare('SELECT COUNT(*) as count FROM diary').get() as any
      return row.count
    } catch (error) {
      log.error('DiaryRepository.count failed:', error)
      throw error
    }
  }
}
