import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPCChannel } from '../common/ipc-channels'

/**
 * Knowledge API
 */
const knowledgeAPI = {
  create: (data: any) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_CREATE, data),
  update: (id: string, data: any) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_UPDATE, id, data),
  delete: (id: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_DELETE, id),
  findById: (id: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_BY_ID, id),
  getById: (id: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_GET_BY_ID, id),
  findAll: () => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_ALL),
  search: (keyword: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_SEARCH, keyword),
  filter: (filters: any) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FILTER, filters),
  findDueToday: () => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_DUE_TODAY),
  addTags: (knowledgeId: string, tagIds: string[]) =>
    ipcRenderer.invoke(IPCChannel.KNOWLEDGE_ADD_TAGS, knowledgeId, tagIds),
  removeTags: (knowledgeId: string, tagIds: string[]) =>
    ipcRenderer.invoke(IPCChannel.KNOWLEDGE_REMOVE_TAGS, knowledgeId, tagIds),
  getTags: (knowledgeId: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_GET_TAGS, knowledgeId),
  filterByTags: (tagIds: string[]) =>
    ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FILTER_BY_TAGS, tagIds),
  filterByCategory: (categoryId: string) =>
    ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FILTER_BY_CATEGORY, categoryId),
  updateFrequency: (id: string, frequency: number) =>
    ipcRenderer.invoke(IPCChannel.KNOWLEDGE_UPDATE_FREQUENCY, id, frequency),
  markForReview: (id: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_MARK_FOR_REVIEW, id)
}

/**
 * Tag API
 */
const tagAPI = {
  getAll: () => ipcRenderer.invoke(IPCChannel.TAGS_GET_ALL),
  findOrCreate: (names: string[]) => ipcRenderer.invoke(IPCChannel.TAGS_FIND_OR_CREATE, names),
  getUsageCount: (tagId: string) => ipcRenderer.invoke(IPCChannel.TAGS_GET_USAGE_COUNT, tagId)
}

/**
 * Category API
 */
const categoryAPI = {
  getAll: () => ipcRenderer.invoke(IPCChannel.CATEGORIES_GET_ALL),
  createCustom: (name: string) => ipcRenderer.invoke(IPCChannel.CATEGORIES_CREATE_CUSTOM, name),
  deleteCustom: (id: string) => ipcRenderer.invoke(IPCChannel.CATEGORIES_DELETE_CUSTOM, id)
}

/**
 * Review API
 */
const reviewAPI = {
  create: (knowledgeId: string, rating: number) =>
    ipcRenderer.invoke(IPCChannel.REVIEW_CREATE, knowledgeId, rating),
  findDue: (date: number) => ipcRenderer.invoke(IPCChannel.REVIEW_FIND_DUE, date),
  findByKnowledge: (knowledgeId: string) =>
    ipcRenderer.invoke(IPCChannel.REVIEW_FIND_BY_KNOWLEDGE, knowledgeId),
  getByKnowledge: (knowledgeId: string, limit?: number) =>
    ipcRenderer.invoke(IPCChannel.REVIEW_GET_BY_KNOWLEDGE, knowledgeId, limit),
  getStatistics: (knowledgeId: string) =>
    ipcRenderer.invoke(IPCChannel.REVIEW_GET_STATISTICS, knowledgeId),
  getTodayTasks: () => ipcRenderer.invoke(IPCChannel.REVIEW_GET_TODAY_TASKS),
  getStats: () => ipcRenderer.invoke(IPCChannel.REVIEW_GET_STATS),
  submitRating: (knowledgeId: string, rating: number, reviewedAt: number) =>
    ipcRenderer.invoke(IPCChannel.REVIEW_SUBMIT_RATING, knowledgeId, rating, reviewedAt),
  getSessionStats: (completedIds: string[], startTime: number) =>
    ipcRenderer.invoke(IPCChannel.REVIEW_GET_SESSION_STATS, completedIds, startTime)
}

/**
 * Settings API
 */
const settingsAPI = {
  getAll: () => ipcRenderer.invoke(IPCChannel.SETTINGS_GET_ALL),
  getReview: () => ipcRenderer.invoke(IPCChannel.SETTINGS_GET_REVIEW),
  updateReview: (settings: any) => ipcRenderer.invoke(IPCChannel.SETTINGS_UPDATE_REVIEW, settings),
  getReminder: () => ipcRenderer.invoke(IPCChannel.SETTINGS_GET_REMINDER),
  updateReminder: (settings: any) => ipcRenderer.invoke(IPCChannel.SETTINGS_UPDATE_REMINDER, settings),
  getSystem: () => ipcRenderer.invoke(IPCChannel.SETTINGS_GET_SYSTEM),
  updateSystem: (settings: any) => ipcRenderer.invoke(IPCChannel.SETTINGS_UPDATE_SYSTEM, settings),
  getWindow: () => ipcRenderer.invoke(IPCChannel.SETTINGS_GET_WINDOW),
  updateWindow: (state: any) => ipcRenderer.invoke(IPCChannel.SETTINGS_UPDATE_WINDOW, state),
  resetDefaults: () => ipcRenderer.invoke(IPCChannel.SETTINGS_RESET_DEFAULTS),
  get: (key: string) => ipcRenderer.invoke(IPCChannel.SETTINGS_GET, key),
  set: (key: string, value: string) => ipcRenderer.invoke(IPCChannel.SETTINGS_SET, key, value)
}

/**
 * Statistics API
 */
const statisticsAPI = {
  getMonthActivities: (year: number, month: number) =>
    ipcRenderer.invoke(IPCChannel.STATISTICS_GET_MONTH, year, month),
  getDayActivities: (date: string) => ipcRenderer.invoke(IPCChannel.STATISTICS_GET_DAY, date),
  getWeekData: (year: number, week: number) =>
    ipcRenderer.invoke(IPCChannel.STATISTICS_GET_WEEK, year, week),
  getYearData: (year: number) => ipcRenderer.invoke(IPCChannel.STATISTICS_GET_YEAR, year),
  getTodaySummary: () => ipcRenderer.invoke(IPCChannel.STATISTICS_GET_TODAY_SUMMARY),
  getOverallStatistics: () => ipcRenderer.invoke(IPCChannel.STATISTICS_GET_OVERALL),
  getWeeklyStatistics: () => ipcRenderer.invoke(IPCChannel.STATISTICS_GET_WEEKLY)
}

/**
 * Diary API
 */
const diaryAPI = {
  getByDate: (date: string) => ipcRenderer.invoke('diary:getByDate', date),
  getByDateRange: (startDate: string, endDate: string) =>
    ipcRenderer.invoke('diary:getByDateRange', startDate, endDate),
  getAllDates: () => ipcRenderer.invoke('diary:getAllDates'),
  save: (data: { date: string; content: string }) => ipcRenderer.invoke('diary:save', data),
  delete: (date: string) => ipcRenderer.invoke('diary:delete', date),
  getPreview: (date: string) => ipcRenderer.invoke('diary:getPreview', date)
}

/**
 * Reminder API
 */
const reminderAPI = {
  getById: (id: string) => ipcRenderer.invoke('reminder:getById', id),
  getAll: (filter?: any) => ipcRenderer.invoke('reminder:getAll', filter),
  getPending: () => ipcRenderer.invoke('reminder:getPending'),
  create: (data: any) => ipcRenderer.invoke('reminder:create', data),
  update: (id: string, data: any) => ipcRenderer.invoke('reminder:update', id, data),
  markComplete: (id: string) => ipcRenderer.invoke('reminder:markComplete', id),
  delete: (id: string) => ipcRenderer.invoke('reminder:delete', id),
  getPendingCount: () => ipcRenderer.invoke('reminder:getPendingCount')
}

/**
 * Backup API
 */
const backupAPI = {
  create: () => ipcRenderer.invoke(IPCChannel.BACKUP_CREATE),
  list: () => ipcRenderer.invoke(IPCChannel.BACKUP_LIST),
  restore: (backupPath: string) => ipcRenderer.invoke(IPCChannel.BACKUP_RESTORE, backupPath),
  exportJSON: () => ipcRenderer.invoke(IPCChannel.BACKUP_EXPORT_JSON),
  exportCSV: () => ipcRenderer.invoke(IPCChannel.BACKUP_EXPORT_CSV),
  importJSON: () => ipcRenderer.invoke(IPCChannel.BACKUP_IMPORT_JSON),
  getDirectory: () => ipcRenderer.invoke(IPCChannel.BACKUP_GET_DIRECTORY)
}

/**
 * Tray API
 */
const trayAPI = {
  updateReviewCount: (count: number) => ipcRenderer.invoke(IPCChannel.TRAY_UPDATE_REVIEW_COUNT, count),
  onNavigateTo: (callback: (route: string) => void) => {
    const handler = (_event: any, route: string) => callback(route)
    ipcRenderer.on('navigate-to', handler)
    return () => ipcRenderer.removeListener('navigate-to', handler)
  },
  onShowQuickAdd: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('show-quick-add', handler)
    return () => ipcRenderer.removeListener('show-quick-add', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      knowledge: knowledgeAPI,
      tags: tagAPI,
      categories: categoryAPI,
      review: reviewAPI,
      settings: settingsAPI,
      statistics: statisticsAPI,
      diary: diaryAPI,
      reminder: reminderAPI,
      backup: backupAPI,
      tray: trayAPI
    })
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = {
    knowledge: knowledgeAPI,
    tags: tagAPI,
    categories: categoryAPI,
    review: reviewAPI,
    settings: settingsAPI,
    statistics: statisticsAPI,
    diary: diaryAPI,
    reminder: reminderAPI,
    backup: backupAPI,
    tray: trayAPI
  }
}
