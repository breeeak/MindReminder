/**
 * IPC通道枚举定义
 * 命名规范: {实体}:{操作}
 */
export enum IPCChannel {
  // Knowledge 相关通道
  KNOWLEDGE_CREATE = 'knowledge:create',
  KNOWLEDGE_UPDATE = 'knowledge:update',
  KNOWLEDGE_DELETE = 'knowledge:delete',
  KNOWLEDGE_FIND_BY_ID = 'knowledge:findById',
  KNOWLEDGE_FIND_ALL = 'knowledge:findAll',
  KNOWLEDGE_SEARCH = 'knowledge:search',
  
  // Review 相关通道
  REVIEW_CREATE = 'review:create',
  REVIEW_FIND_DUE = 'review:findDue',
  REVIEW_FIND_BY_KNOWLEDGE = 'review:findByKnowledge',
  
  // Settings 相关通道
  SETTINGS_GET = 'settings:get',
  SETTINGS_UPDATE = 'settings:update',
}

