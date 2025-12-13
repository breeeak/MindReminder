import { registerKnowledgeHandlers } from './knowledgeHandlers'
import { registerReviewHandlers } from './reviewHandlers'

/**
 * 注册所有IPC处理器
 */
export function registerAllHandlers(): void {
  registerKnowledgeHandlers()
  registerReviewHandlers()
}

