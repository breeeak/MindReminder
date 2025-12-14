import { DatabaseService } from '../DatabaseService'
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import type {
  Reminder,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderFilter
} from '../types/Reminder'
import log from '../../utils/logger'

export class ReminderRepository {
  protected db: Database.Database

  constructor(dbService: DatabaseService) {
    this.db = dbService.getConnection()
  }

  /**
   * 根据ID查找提醒
   */
  findById(id: string): Reminder | null {
    try {
      const row = this.db.prepare('SELECT * FROM reminder WHERE id = ?').get(id) as any

      if (!row) return null

      // 转换命名: snake_case → camelCase
      return this.mapRowToReminder(row)
    } catch (error) {
      log.error('ReminderRepository.findById failed:', { id, error })
      throw error
    }
  }

  /**
   * 查找所有提醒(支持筛选)
   */
  findAll(filter?: ReminderFilter): Reminder[] {
    try {
      let query = 'SELECT * FROM reminder WHERE 1=1'
      const params: any[] = []

      if (filter?.completed !== undefined) {
        query += ' AND completed = ?'
        params.push(filter.completed ? 1 : 0)
      }

      if (filter?.startDate) {
        query += ' AND due_date >= ?'
        params.push(filter.startDate)
      }

      if (filter?.endDate) {
        query += ' AND due_date <= ?'
        params.push(filter.endDate)
      }

      query += ' ORDER BY due_date ASC'

      const rows = this.db.prepare(query).all(...params) as any[]

      return rows.map((row) => this.mapRowToReminder(row))
    } catch (error) {
      log.error('ReminderRepository.findAll failed:', { filter, error })
      throw error
    }
  }

  /**
   * 获取未完成的提醒
   */
  findPending(): Reminder[] {
    return this.findAll({ completed: false })
  }

  /**
   * 获取即将到期的提醒(未来N分钟内)
   */
  findUpcoming(minutes: number = 60): Reminder[] {
    try {
      const now = Date.now()
      const future = now + minutes * 60 * 1000

      const rows = this.db
        .prepare(
          'SELECT * FROM reminder WHERE completed = 0 AND due_date >= ? AND due_date <= ? ORDER BY due_date ASC'
        )
        .all(now, future) as any[]

      return rows.map((row) => this.mapRowToReminder(row))
    } catch (error) {
      log.error('ReminderRepository.findUpcoming failed:', { minutes, error })
      throw error
    }
  }

  /**
   * 创建提醒
   */
  create(data: CreateReminderDTO): Reminder {
    const now = Date.now()
    const id = randomUUID()

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `
        INSERT INTO reminder (id, title, content, due_date, completed, created_at, updated_at, sync_status)
        VALUES (?, ?, ?, ?, 0, ?, ?, 'local')
      `
        )
        .run(id, data.title, data.content || null, data.dueDate, now, now)

      log.info('Reminder created', { id, title: data.title })

      return {
        id,
        title: data.title,
        content: data.content,
        dueDate: data.dueDate,
        completed: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local'
      }
    })

    return transaction()
  }

  /**
   * 更新提醒
   */
  update(id: string, data: UpdateReminderDTO): Reminder {
    const now = Date.now()

    const transaction = this.db.transaction(() => {
      const updates: string[] = []
      const params: any[] = []

      if (data.title !== undefined) {
        updates.push('title = ?')
        params.push(data.title)
      }

      if (data.content !== undefined) {
        updates.push('content = ?')
        params.push(data.content)
      }

      if (data.dueDate !== undefined) {
        updates.push('due_date = ?')
        params.push(data.dueDate)
      }

      updates.push('updated_at = ?')
      params.push(now)

      params.push(id)

      const result = this.db
        .prepare(`UPDATE reminder SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params)

      if (result.changes === 0) {
        throw new Error(`Reminder not found: ${id}`)
      }

      log.info('Reminder updated', { id })

      return this.findById(id)!
    })

    return transaction()
  }

  /**
   * 标记为已完成
   */
  markComplete(id: string): Reminder {
    const now = Date.now()

    const transaction = this.db.transaction(() => {
      const result = this.db
        .prepare('UPDATE reminder SET completed = 1, completed_at = ?, updated_at = ? WHERE id = ?')
        .run(now, now, id)

      if (result.changes === 0) {
        throw new Error(`Reminder not found: ${id}`)
      }

      log.info('Reminder marked complete', { id })

      return this.findById(id)!
    })

    return transaction()
  }

  /**
   * 删除提醒
   */
  delete(id: string): void {
    const transaction = this.db.transaction(() => {
      const result = this.db.prepare('DELETE FROM reminder WHERE id = ?').run(id)

      if (result.changes === 0) {
        log.warn('Reminder not found for deletion', { id })
        throw new Error(`Reminder not found: ${id}`)
      }

      log.info('Reminder deleted', { id })
    })

    transaction()
  }

  /**
   * 获取未完成提醒数量
   */
  countPending(): number {
    try {
      const row = this.db
        .prepare('SELECT COUNT(*) as count FROM reminder WHERE completed = 0')
        .get() as any
      return row.count
    } catch (error) {
      log.error('ReminderRepository.countPending failed:', error)
      throw error
    }
  }

  /**
   * 辅助方法: 数据库行转换为 Reminder 对象
   */
  private mapRowToReminder(row: any): Reminder {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      dueDate: row.due_date,
      completed: Boolean(row.completed),
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: row.sync_status
    }
  }
}
