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
  KNOWLEDGE_GET_BY_ID = 'knowledge:getById',
  KNOWLEDGE_FIND_ALL = 'knowledge:findAll',
  KNOWLEDGE_SEARCH = 'knowledge:search',
  KNOWLEDGE_FILTER = 'knowledge:filter',
  KNOWLEDGE_FIND_DUE_TODAY = 'knowledge:findDueToday',
  KNOWLEDGE_ADD_TAGS = 'knowledge:addTags',
  KNOWLEDGE_REMOVE_TAGS = 'knowledge:removeTags',
  KNOWLEDGE_GET_TAGS = 'knowledge:getTags',
  KNOWLEDGE_FILTER_BY_TAGS = 'knowledge:filterByTags',
  KNOWLEDGE_FILTER_BY_CATEGORY = 'knowledge:filterByCategory',
  KNOWLEDGE_UPDATE_FREQUENCY = 'knowledge:updateFrequency',
  KNOWLEDGE_MARK_FOR_REVIEW = 'knowledge:markForReview',

  // Tags 相关通道
  TAGS_GET_ALL = 'tags:getAll',
  TAGS_FIND_OR_CREATE = 'tags:findOrCreate',
  TAGS_GET_USAGE_COUNT = 'tags:getUsageCount',

  // Categories 相关通道
  CATEGORIES_GET_ALL = 'categories:getAll',
  CATEGORIES_CREATE_CUSTOM = 'categories:createCustom',
  CATEGORIES_DELETE_CUSTOM = 'categories:deleteCustom',

  // Review 相关通道
  REVIEW_CREATE = 'review:create',
  REVIEW_FIND_DUE = 'review:findDue',
  REVIEW_FIND_BY_KNOWLEDGE = 'review:findByKnowledge',
  REVIEW_GET_BY_KNOWLEDGE = 'review:getByKnowledge',
  REVIEW_GET_STATISTICS = 'review:getStatistics',
  REVIEW_GET_TODAY_TASKS = 'review:getTodayTasks',
  REVIEW_GET_STATS = 'review:getStats',
  REVIEW_SUBMIT_RATING = 'review:submitRating',
  REVIEW_GET_SESSION_STATS = 'review:getSessionStats',

  // Settings 相关通道
  SETTINGS_GET = 'settings:get',
  SETTINGS_UPDATE = 'settings:update',

  // Statistics 相关通道
  STATISTICS_GET_MONTH = 'statistics:getMonth',
  STATISTICS_GET_DAY = 'statistics:getDay',
  STATISTICS_GET_WEEK = 'statistics:getWeek',
  STATISTICS_GET_YEAR = 'statistics:getYear',
  STATISTICS_GET_TODAY_SUMMARY = 'statistics:getTodaySummary',
  STATISTICS_GET_OVERALL = 'statistics:getOverallStatistics',
  STATISTICS_GET_WEEKLY = 'statistics:getWeeklyStatistics'
}
