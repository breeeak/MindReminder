/**
 * 用户设置类型定义
 */
export interface Setting {
  key: string
  value: string
  updated_at: number
}

/**
 * 复习设置
 */
export interface ReviewSettings {
  globalFrequencyCoefficient: number // 全局复习频率系数（0.5-1.5）
  memoryStandardDays: number // 记忆标准天数（默认30天）
  memoryStandardRating: number // 记忆标准评分（1-5，默认4）
  longTermReviewInterval: number // 长期抽查间隔（默认60天）
}

/**
 * 提醒设置
 */
export interface ReminderSettings {
  enableDailyReminder: boolean // 启用每日提醒
  reminderTimes: string[] // 提醒时间列表（如 ["09:00", "14:00", "20:00"]）
  reminderSound: boolean // 提醒声音
  reminderMethod: 'notification' | 'tray' // 提醒方式
}

/**
 * 系统设置
 */
export interface SystemSettings {
  autoLaunch: boolean // 开机自启动
  minimizeToTray: boolean // 最小化到托盘
  closeButtonAction: 'ask' | 'quit' | 'minimize' // 关闭按钮行为：询问、退出、最小化到托盘
  dataPath: string // 数据存储位置（只读）
  theme: 'light' | 'dark' // 主题
}

/**
 * 窗口状态
 */
export interface WindowState {
  width: number
  height: number
  x: number
  y: number
  currentView: string
  sidebarCollapsed: boolean
}

/**
 * 所有设置的聚合类型
 */
export interface AppSettings {
  review: ReviewSettings
  reminder: ReminderSettings
  system: SystemSettings
  window: WindowState
}

/**
 * 设置键名常量
 */
export const SettingKeys = {
  // 复习设置
  GLOBAL_FREQUENCY_COEFFICIENT: 'global_frequency_coefficient',
  MEMORY_STANDARD_DAYS: 'memory_standard_days',
  MEMORY_STANDARD_RATING: 'memory_standard_rating',
  LONG_TERM_REVIEW_INTERVAL: 'long_term_review_interval',

  // 提醒设置
  ENABLE_DAILY_REMINDER: 'enable_daily_reminder',
  REMINDER_TIMES: 'reminder_times',
  REMINDER_SOUND: 'reminder_sound',
  REMINDER_METHOD: 'reminder_method',

  // 系统设置
  AUTO_LAUNCH: 'auto_launch',
  MINIMIZE_TO_TRAY: 'minimize_to_tray',
  CLOSE_BUTTON_ACTION: 'close_button_action',
  DATA_PATH: 'data_path',
  THEME: 'theme',

  // 窗口状态
  WINDOW_WIDTH: 'window_width',
  WINDOW_HEIGHT: 'window_height',
  WINDOW_X: 'window_x',
  WINDOW_Y: 'window_y',
  CURRENT_VIEW: 'current_view',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed'
} as const

/**
 * 默认设置值
 */
export const DefaultSettings: AppSettings = {
  review: {
    globalFrequencyCoefficient: 1.0,
    memoryStandardDays: 30,
    memoryStandardRating: 4,
    longTermReviewInterval: 60
  },
  reminder: {
    enableDailyReminder: true,
    reminderTimes: ['09:00', '14:00', '20:00'],
    reminderSound: true,
    reminderMethod: 'notification'
  },
  system: {
    autoLaunch: false,
    minimizeToTray: false,
    closeButtonAction: 'ask',
    dataPath: '',
    theme: 'light'
  },
  window: {
    width: 1200,
    height: 800,
    x: 0,
    y: 0,
    currentView: 'home',
    sidebarCollapsed: false
  }
}

