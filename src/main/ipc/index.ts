import { registerKnowledgeHandlers } from './knowledgeHandlers'
import { registerReviewHandlers } from './reviewHandlers'
import { registerStatisticsHandlers } from './statisticsHandlers'
import { registerDiaryHandlers } from './diaryHandlers'
import { registerReminderHandlers } from './reminderHandlers'
import { registerSettingsHandlers } from './settingsHandlers'
import { registerBackupHandlers } from './backupHandlers'
import { registerTrayHandlers } from './trayHandlers'

/**
 * 注册所有IPC处理器
 */
export function registerAllHandlers(): void {
  registerKnowledgeHandlers()
  registerReviewHandlers()
  registerStatisticsHandlers()
  registerDiaryHandlers()
  registerReminderHandlers()
  registerSettingsHandlers()
  registerBackupHandlers()
  registerTrayHandlers()
}
