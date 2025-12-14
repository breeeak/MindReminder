import { Notification } from 'electron'
import type { ReminderRepository } from '../database/repositories/ReminderRepository'
import log from '../utils/logger'

interface ScheduledTask {
  reminderId: string
  timeout: NodeJS.Timeout
}

export class ReminderScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map()
  private checkInterval: NodeJS.Timeout | null = null

  constructor(private reminderRepository: ReminderRepository) {}

  /**
   * 启动调度器(每分钟检查一次)
   */
  start(): void {
    log.info('ReminderScheduler starting...')

    // 初始化时加载所有未完成的提醒
    this.scheduleAllPendingReminders()

    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkAndNotify()
    }, 60 * 1000) // 60秒

    log.info('ReminderScheduler started')
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    // 清除所有已注册的任务
    this.scheduledTasks.forEach((task) => clearTimeout(task.timeout))
    this.scheduledTasks.clear()

    log.info('ReminderScheduler stopped')
  }

  /**
   * 注册单个提醒
   */
  scheduleReminder(reminderId: string, dueDate: number): void {
    const delay = dueDate - Date.now()

    // 如果已经过期,忽略
    if (delay < 0) {
      log.warn('Reminder is overdue, skipping schedule', { reminderId, dueDate })
      return
    }

    // 如果已存在,先取消
    this.cancelReminder(reminderId)

    // 注册新任务
    const timeout = setTimeout(() => {
      this.notifyReminder(reminderId)
      this.scheduledTasks.delete(reminderId)
    }, delay)

    this.scheduledTasks.set(reminderId, { reminderId, timeout })

    log.info('Reminder scheduled', { reminderId, dueDate, delay })
  }

  /**
   * 取消提醒
   */
  cancelReminder(reminderId: string): void {
    const task = this.scheduledTasks.get(reminderId)
    if (task) {
      clearTimeout(task.timeout)
      this.scheduledTasks.delete(reminderId)
      log.info('Reminder cancelled', { reminderId })
    }
  }

  /**
   * 加载所有未完成的提醒
   */
  private scheduleAllPendingReminders(): void {
    try {
      const reminders = this.reminderRepository.findPending()
      reminders.forEach((reminder) => {
        this.scheduleReminder(reminder.id, reminder.dueDate)
      })
      log.info('All pending reminders scheduled', { count: reminders.length })
    } catch (error) {
      log.error('Failed to schedule pending reminders', error)
    }
  }

  /**
   * 检查并通知到期的提醒
   */
  private checkAndNotify(): void {
    try {
      const now = Date.now()
      const reminders = this.reminderRepository.findPending()

      reminders.forEach((reminder) => {
        if (reminder.dueDate <= now) {
          this.notifyReminder(reminder.id)
        }
      })
    } catch (error) {
      log.error('Failed to check reminders', error)
    }
  }

  /**
   * 发送提醒通知
   */
  private notifyReminder(reminderId: string): void {
    try {
      const reminder = this.reminderRepository.findById(reminderId)
      if (!reminder || reminder.completed) {
        return
      }

      // 发送桌面通知
      const notification = new Notification({
        title: '⏰ 提醒',
        body: reminder.title,
        silent: false
      })

      notification.show()

      // 点击通知时打开应用并显示提醒详情
      notification.on('click', () => {
        // TODO: 打开主窗口并显示提醒详情
        log.info('Notification clicked', { reminderId })
      })

      log.info('Reminder notification sent', { reminderId, title: reminder.title })
    } catch (error) {
      log.error('Failed to notify reminder', { reminderId, error })
    }
  }
}



