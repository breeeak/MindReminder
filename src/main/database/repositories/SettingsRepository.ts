import type Database from 'better-sqlite3'
import { DatabaseService } from '../DatabaseService'
import {
  Setting,
  AppSettings,
  ReviewSettings,
  ReminderSettings,
  SystemSettings,
  WindowState,
  DefaultSettings,
  SettingKeys
} from '../types/Settings'

/**
 * 设置数据访问层
 */
export class SettingsRepository {
  protected db: Database.Database

  constructor(dbService: DatabaseService) {
    this.db = dbService.getConnection()
  }

  /**
   * 获取单个设置项
   */
  get(key: string): Setting | null {
    const stmt = this.db.prepare('SELECT * FROM settings WHERE key = ?')
    return stmt.get(key) as Setting | null
  }

  /**
   * 获取所有设置项
   */
  getAll(): Setting[] {
    const stmt = this.db.prepare('SELECT * FROM settings ORDER BY key')
    return stmt.all() as Setting[]
  }

  /**
   * 设置单个设置项
   */
  set(key: string, value: string): void {
    const now = Date.now()
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    stmt.run(key, value, now)
  }

  /**
   * 批量设置
   */
  setMany(settings: Record<string, string>): void {
    const now = Date.now()
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = excluded.updated_at
    `)

    const transaction = this.db.transaction((items: [string, string][]) => {
      for (const [key, value] of items) {
        stmt.run(key, value, now)
      }
    })

    transaction(Object.entries(settings))
  }

  /**
   * 删除设置项
   */
  delete(key: string): void {
    const stmt = this.db.prepare('DELETE FROM settings WHERE key = ?')
    stmt.run(key)
  }

  /**
   * 获取复习设置
   */
  getReviewSettings(): ReviewSettings {
    const coefficient = this.get(SettingKeys.GLOBAL_FREQUENCY_COEFFICIENT)
    const standardDays = this.get(SettingKeys.MEMORY_STANDARD_DAYS)
    const standardRating = this.get(SettingKeys.MEMORY_STANDARD_RATING)
    const longTermInterval = this.get(SettingKeys.LONG_TERM_REVIEW_INTERVAL)

    return {
      globalFrequencyCoefficient: coefficient
        ? parseFloat(coefficient.value)
        : DefaultSettings.review.globalFrequencyCoefficient,
      memoryStandardDays: standardDays
        ? parseInt(standardDays.value)
        : DefaultSettings.review.memoryStandardDays,
      memoryStandardRating: standardRating
        ? parseInt(standardRating.value)
        : DefaultSettings.review.memoryStandardRating,
      longTermReviewInterval: longTermInterval
        ? parseInt(longTermInterval.value)
        : DefaultSettings.review.longTermReviewInterval
    }
  }

  /**
   * 设置复习设置
   */
  setReviewSettings(settings: Partial<ReviewSettings>): void {
    const updates: Record<string, string> = {}

    if (settings.globalFrequencyCoefficient !== undefined) {
      updates[SettingKeys.GLOBAL_FREQUENCY_COEFFICIENT] =
        settings.globalFrequencyCoefficient.toString()
    }
    if (settings.memoryStandardDays !== undefined) {
      updates[SettingKeys.MEMORY_STANDARD_DAYS] = settings.memoryStandardDays.toString()
    }
    if (settings.memoryStandardRating !== undefined) {
      updates[SettingKeys.MEMORY_STANDARD_RATING] = settings.memoryStandardRating.toString()
    }
    if (settings.longTermReviewInterval !== undefined) {
      updates[SettingKeys.LONG_TERM_REVIEW_INTERVAL] = settings.longTermReviewInterval.toString()
    }

    this.setMany(updates)
  }

  /**
   * 获取提醒设置
   */
  getReminderSettings(): ReminderSettings {
    const enableReminder = this.get(SettingKeys.ENABLE_DAILY_REMINDER)
    const reminderTimes = this.get(SettingKeys.REMINDER_TIMES)
    const reminderSound = this.get(SettingKeys.REMINDER_SOUND)
    const reminderMethod = this.get(SettingKeys.REMINDER_METHOD)

    return {
      enableDailyReminder: enableReminder
        ? enableReminder.value === 'true'
        : DefaultSettings.reminder.enableDailyReminder,
      reminderTimes: reminderTimes
        ? JSON.parse(reminderTimes.value)
        : DefaultSettings.reminder.reminderTimes,
      reminderSound: reminderSound
        ? reminderSound.value === 'true'
        : DefaultSettings.reminder.reminderSound,
      reminderMethod: reminderMethod
        ? (reminderMethod.value as 'notification' | 'tray')
        : DefaultSettings.reminder.reminderMethod
    }
  }

  /**
   * 设置提醒设置
   */
  setReminderSettings(settings: Partial<ReminderSettings>): void {
    const updates: Record<string, string> = {}

    if (settings.enableDailyReminder !== undefined) {
      updates[SettingKeys.ENABLE_DAILY_REMINDER] = settings.enableDailyReminder.toString()
    }
    if (settings.reminderTimes !== undefined) {
      updates[SettingKeys.REMINDER_TIMES] = JSON.stringify(settings.reminderTimes)
    }
    if (settings.reminderSound !== undefined) {
      updates[SettingKeys.REMINDER_SOUND] = settings.reminderSound.toString()
    }
    if (settings.reminderMethod !== undefined) {
      updates[SettingKeys.REMINDER_METHOD] = settings.reminderMethod
    }

    this.setMany(updates)
  }

  /**
   * 获取系统设置
   */
  getSystemSettings(): SystemSettings {
    const autoLaunch = this.get(SettingKeys.AUTO_LAUNCH)
    const minimizeToTray = this.get(SettingKeys.MINIMIZE_TO_TRAY)
    const closeButtonAction = this.get(SettingKeys.CLOSE_BUTTON_ACTION)
    const dataPath = this.get(SettingKeys.DATA_PATH)
    const theme = this.get(SettingKeys.THEME)

    return {
      autoLaunch: autoLaunch
        ? autoLaunch.value === 'true'
        : DefaultSettings.system.autoLaunch,
      minimizeToTray: minimizeToTray
        ? minimizeToTray.value === 'true'
        : DefaultSettings.system.minimizeToTray,
      closeButtonAction: closeButtonAction
        ? (closeButtonAction.value as 'ask' | 'quit' | 'minimize')
        : DefaultSettings.system.closeButtonAction,
      dataPath: dataPath ? dataPath.value : DefaultSettings.system.dataPath,
      theme: theme ? (theme.value as 'light' | 'dark') : DefaultSettings.system.theme
    }
  }

  /**
   * 设置系统设置
   */
  setSystemSettings(settings: Partial<SystemSettings>): void {
    const updates: Record<string, string> = {}

    if (settings.autoLaunch !== undefined) {
      updates[SettingKeys.AUTO_LAUNCH] = settings.autoLaunch.toString()
    }
    if (settings.minimizeToTray !== undefined) {
      updates[SettingKeys.MINIMIZE_TO_TRAY] = settings.minimizeToTray.toString()
    }
    if (settings.closeButtonAction !== undefined) {
      updates[SettingKeys.CLOSE_BUTTON_ACTION] = settings.closeButtonAction
    }
    if (settings.dataPath !== undefined) {
      updates[SettingKeys.DATA_PATH] = settings.dataPath
    }
    if (settings.theme !== undefined) {
      updates[SettingKeys.THEME] = settings.theme
    }

    this.setMany(updates)
  }

  /**
   * 获取窗口状态
   */
  getWindowState(): WindowState {
    const width = this.get(SettingKeys.WINDOW_WIDTH)
    const height = this.get(SettingKeys.WINDOW_HEIGHT)
    const x = this.get(SettingKeys.WINDOW_X)
    const y = this.get(SettingKeys.WINDOW_Y)
    const currentView = this.get(SettingKeys.CURRENT_VIEW)
    const sidebarCollapsed = this.get(SettingKeys.SIDEBAR_COLLAPSED)

    return {
      width: width ? parseInt(width.value) : DefaultSettings.window.width,
      height: height ? parseInt(height.value) : DefaultSettings.window.height,
      x: x ? parseInt(x.value) : DefaultSettings.window.x,
      y: y ? parseInt(y.value) : DefaultSettings.window.y,
      currentView: currentView ? currentView.value : DefaultSettings.window.currentView,
      sidebarCollapsed: sidebarCollapsed
        ? sidebarCollapsed.value === 'true'
        : DefaultSettings.window.sidebarCollapsed
    }
  }

  /**
   * 设置窗口状态
   */
  setWindowState(state: Partial<WindowState>): void {
    const updates: Record<string, string> = {}

    if (state.width !== undefined) {
      updates[SettingKeys.WINDOW_WIDTH] = state.width.toString()
    }
    if (state.height !== undefined) {
      updates[SettingKeys.WINDOW_HEIGHT] = state.height.toString()
    }
    if (state.x !== undefined) {
      updates[SettingKeys.WINDOW_X] = state.x.toString()
    }
    if (state.y !== undefined) {
      updates[SettingKeys.WINDOW_Y] = state.y.toString()
    }
    if (state.currentView !== undefined) {
      updates[SettingKeys.CURRENT_VIEW] = state.currentView
    }
    if (state.sidebarCollapsed !== undefined) {
      updates[SettingKeys.SIDEBAR_COLLAPSED] = state.sidebarCollapsed.toString()
    }

    this.setMany(updates)
  }

  /**
   * 获取所有设置（结构化）
   */
  getAllSettings(): AppSettings {
    return {
      review: this.getReviewSettings(),
      reminder: this.getReminderSettings(),
      system: this.getSystemSettings(),
      window: this.getWindowState()
    }
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults(): void {
    const defaults = DefaultSettings
    const updates: Record<string, string> = {}

    // 复习设置
    updates[SettingKeys.GLOBAL_FREQUENCY_COEFFICIENT] =
      defaults.review.globalFrequencyCoefficient.toString()
    updates[SettingKeys.MEMORY_STANDARD_DAYS] = defaults.review.memoryStandardDays.toString()
    updates[SettingKeys.MEMORY_STANDARD_RATING] = defaults.review.memoryStandardRating.toString()
    updates[SettingKeys.LONG_TERM_REVIEW_INTERVAL] =
      defaults.review.longTermReviewInterval.toString()

    // 提醒设置
    updates[SettingKeys.ENABLE_DAILY_REMINDER] = defaults.reminder.enableDailyReminder.toString()
    updates[SettingKeys.REMINDER_TIMES] = JSON.stringify(defaults.reminder.reminderTimes)
    updates[SettingKeys.REMINDER_SOUND] = defaults.reminder.reminderSound.toString()
    updates[SettingKeys.REMINDER_METHOD] = defaults.reminder.reminderMethod

    // 系统设置
    updates[SettingKeys.AUTO_LAUNCH] = defaults.system.autoLaunch.toString()
    updates[SettingKeys.MINIMIZE_TO_TRAY] = defaults.system.minimizeToTray.toString()
    updates[SettingKeys.CLOSE_BUTTON_ACTION] = defaults.system.closeButtonAction
    updates[SettingKeys.THEME] = defaults.system.theme

    // 不重置窗口状态和数据路径

    this.setMany(updates)
  }
}

