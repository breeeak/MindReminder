import type { SettingsRepository } from '../database/repositories/SettingsRepository'
import type {
  AppSettings,
  ReviewSettings,
  ReminderSettings,
  SystemSettings,
  WindowState
} from '../database/types/Settings'
import { ValidationError } from '../utils/errors'

/**
 * 设置业务逻辑层
 */
export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}

  /**
   * 获取所有设置
   */
  getAllSettings(): AppSettings {
    return this.settingsRepository.getAllSettings()
  }

  /**
   * 获取复习设置
   */
  getReviewSettings(): ReviewSettings {
    return this.settingsRepository.getReviewSettings()
  }

  /**
   * 更新复习设置
   */
  updateReviewSettings(settings: Partial<ReviewSettings>): ReviewSettings {
    // 验证全局复习频率系数
    if (
      settings.globalFrequencyCoefficient !== undefined &&
      (settings.globalFrequencyCoefficient < 0.5 || settings.globalFrequencyCoefficient > 1.5)
    ) {
      throw new ValidationError(
        'Global frequency coefficient must be between 0.5 and 1.5',
        '全局复习频率系数必须在0.5到1.5之间'
      )
    }

    // 验证记忆标准天数
    if (settings.memoryStandardDays !== undefined && settings.memoryStandardDays < 1) {
      throw new ValidationError(
        'Memory standard days must be at least 1',
        '记忆标准天数必须至少为1天'
      )
    }

    // 验证记忆标准评分
    if (
      settings.memoryStandardRating !== undefined &&
      (settings.memoryStandardRating < 1 || settings.memoryStandardRating > 5)
    ) {
      throw new ValidationError(
        'Memory standard rating must be between 1 and 5',
        '记忆标准评分必须在1到5之间'
      )
    }

    // 验证长期抽查间隔
    if (settings.longTermReviewInterval !== undefined && settings.longTermReviewInterval < 1) {
      throw new ValidationError(
        'Long term review interval must be at least 1 day',
        '长期抽查间隔必须至少为1天'
      )
    }

    this.settingsRepository.setReviewSettings(settings)
    return this.settingsRepository.getReviewSettings()
  }

  /**
   * 获取提醒设置
   */
  getReminderSettings(): ReminderSettings {
    return this.settingsRepository.getReminderSettings()
  }

  /**
   * 更新提醒设置
   */
  updateReminderSettings(settings: Partial<ReminderSettings>): ReminderSettings {
    // 验证提醒时间格式
    if (settings.reminderTimes) {
      for (const time of settings.reminderTimes) {
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
          throw new ValidationError(
            `Invalid time format: ${time}. Expected HH:MM`,
            `时间格式无效：${time}。期望格式为 HH:MM`
          )
        }
      }
    }

    this.settingsRepository.setReminderSettings(settings)
    return this.settingsRepository.getReminderSettings()
  }

  /**
   * 获取系统设置
   */
  getSystemSettings(): SystemSettings {
    return this.settingsRepository.getSystemSettings()
  }

  /**
   * 更新系统设置
   */
  updateSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.settingsRepository.setSystemSettings(settings)
    return this.settingsRepository.getSystemSettings()
  }

  /**
   * 获取窗口状态
   */
  getWindowState(): WindowState {
    return this.settingsRepository.getWindowState()
  }

  /**
   * 更新窗口状态
   */
  updateWindowState(state: Partial<WindowState>): WindowState {
    // 验证窗口尺寸
    if (state.width !== undefined && state.width < 800) {
      state.width = 800 // 最小宽度
    }
    if (state.height !== undefined && state.height < 600) {
      state.height = 600 // 最小高度
    }

    this.settingsRepository.setWindowState(state)
    return this.settingsRepository.getWindowState()
  }

  /**
   * 重置为默认设置
   */
  resetToDefaults(): AppSettings {
    this.settingsRepository.resetToDefaults()
    return this.settingsRepository.getAllSettings()
  }

  /**
   * 获取单个设置值
   */
  get(key: string): string | null {
    const setting = this.settingsRepository.get(key)
    return setting ? setting.value : null
  }

  /**
   * 设置单个设置值
   */
  set(key: string, value: string): void {
    this.settingsRepository.set(key, value)
  }
}




