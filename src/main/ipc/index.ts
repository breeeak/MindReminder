import { registerKnowledgeHandlers } from './knowledgeHandlers'
import { registerReviewHandlers } from './reviewHandlers'
import { registerStatisticsHandlers } from './statisticsHandlers'
import { registerDiaryHandlers } from './diaryHandlers'
import { registerReminderHandlers } from './reminderHandlers'

/**
 * 注册所有IPC处理器
 */
export function registerAllHandlers(): void {
  registerKnowledgeHandlers()
  registerReviewHandlers()
  registerStatisticsHandlers()
  registerDiaryHandlers()
  registerReminderHandlers()
}
