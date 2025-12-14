import { ipcMain } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import {
  getKnowledgeRepository,
  getTagRepository,
  getCategoryRepository
} from '../database/repositories'
import log from '../utils/logger'
import type { Knowledge } from '../database/types'

/**
 * 注册Knowledge相关IPC处理器
 */
export function registerKnowledgeHandlers(): void {
  // knowledge:create - 创建知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_CREATE, async (_event, data: Partial<Knowledge>) => {
    try {
      log.info('IPC: knowledge:create', { data })
      const repo = getKnowledgeRepository()
      const knowledge = repo.create(data)
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:create failed', { error })
      throw error
    }
  })

  // knowledge:findById - 查询单个知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_FIND_BY_ID, async (_event, id: string) => {
    try {
      log.debug('IPC: knowledge:findById', { id })
      const repo = getKnowledgeRepository()
      const knowledge = repo.findById(id)
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:findById failed', { error, id })
      throw error
    }
  })

  // knowledge:getById - 获取单个知识点详情（别名）
  ipcMain.handle(IPCChannel.KNOWLEDGE_GET_BY_ID, async (_event, id: string) => {
    try {
      log.debug('IPC: knowledge:getById', { id })
      const repo = getKnowledgeRepository()
      const knowledge = repo.findById(id)
      if (!knowledge) {
        const error = new Error('Knowledge not found')
        error.name = 'NotFoundError'
        throw error
      }
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:getById failed', { error, id })
      throw error
    }
  })

  // knowledge:findAll - 查询所有知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_FIND_ALL, async () => {
    try {
      log.debug('IPC: knowledge:findAll')
      const repo = getKnowledgeRepository()
      const knowledgeList = repo.findAll()
      return { data: knowledgeList }
    } catch (error) {
      log.error('IPC: knowledge:findAll failed', { error })
      throw error
    }
  })

  // knowledge:update - 更新知识点
  ipcMain.handle(
    IPCChannel.KNOWLEDGE_UPDATE,
    async (_event, id: string, data: Partial<Knowledge>) => {
      try {
        log.info('IPC: knowledge:update', { id, data })
        const repo = getKnowledgeRepository()
        const knowledge = repo.update(id, data)
        return { data: knowledge }
      } catch (error) {
        log.error('IPC: knowledge:update failed', { error, id })
        throw error
      }
    }
  )

  // knowledge:delete - 删除知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_DELETE, async (_event, id: string) => {
    try {
      log.info('IPC: knowledge:delete', { id })
      const repo = getKnowledgeRepository()
      const success = repo.delete(id)
      return { data: success }
    } catch (error) {
      log.error('IPC: knowledge:delete failed', { error, id })
      throw error
    }
  })

  // knowledge:search - 搜索知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_SEARCH, async (_event, keyword: string) => {
    try {
      log.debug('IPC: knowledge:search', { keyword })
      const repo = getKnowledgeRepository()
      const results = repo.search(keyword)
      return { data: results }
    } catch (error) {
      log.error('IPC: knowledge:search failed', { error, keyword })
      throw error
    }
  })

  // knowledge:findDueToday - 查询今日待复习的知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_FIND_DUE_TODAY, async () => {
    try {
      log.debug('IPC: knowledge:findDueToday')
      const repo = getKnowledgeRepository()
      const results = repo.findDueToday()
      return { data: results }
    } catch (error) {
      log.error('IPC: knowledge:findDueToday failed', { error })
      throw error
    }
  })

  // knowledge:filter - 高级筛选知识点
  ipcMain.handle(
    IPCChannel.KNOWLEDGE_FILTER,
    async (
      _event,
      filters: {
        tags?: string[]
        categoryId?: string
        status?: 'learning' | 'mastered'
        dateFrom?: string
        dateTo?: string
        keyword?: string
      }
    ) => {
      try {
        log.debug('IPC: knowledge:filter', { filters })
        const repo = getKnowledgeRepository()
        const results = repo.filter(filters)
        return { data: results }
      } catch (error) {
        log.error('IPC: knowledge:filter failed', { error, filters })
        throw error
      }
    }
  )

  // knowledge:addTags - 为知识点添加标签
  ipcMain.handle(
    IPCChannel.KNOWLEDGE_ADD_TAGS,
    async (_event, knowledgeId: string, tagIds: string[]) => {
      try {
        log.info('IPC: knowledge:addTags', { knowledgeId, tagIds })
        const repo = getKnowledgeRepository()
        repo.addTags(knowledgeId, tagIds)
        return { data: true }
      } catch (error) {
        log.error('IPC: knowledge:addTags failed', { error, knowledgeId, tagIds })
        throw error
      }
    }
  )

  // knowledge:removeTags - 移除知识点的标签
  ipcMain.handle(
    IPCChannel.KNOWLEDGE_REMOVE_TAGS,
    async (_event, knowledgeId: string, tagIds: string[]) => {
      try {
        log.info('IPC: knowledge:removeTags', { knowledgeId, tagIds })
        const repo = getKnowledgeRepository()
        repo.removeTags(knowledgeId, tagIds)
        return { data: true }
      } catch (error) {
        log.error('IPC: knowledge:removeTags failed', { error, knowledgeId, tagIds })
        throw error
      }
    }
  )

  // knowledge:getTags - 获取知识点的所有标签
  ipcMain.handle(IPCChannel.KNOWLEDGE_GET_TAGS, async (_event, knowledgeId: string) => {
    try {
      log.debug('IPC: knowledge:getTags', { knowledgeId })
      const repo = getKnowledgeRepository()
      const tags = repo.getKnowledgeTags(knowledgeId)
      return { data: tags }
    } catch (error) {
      log.error('IPC: knowledge:getTags failed', { error, knowledgeId })
      throw error
    }
  })

  // knowledge:filterByTags - 按标签筛选知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_FILTER_BY_TAGS, async (_event, tagIds: string[]) => {
    try {
      log.debug('IPC: knowledge:filterByTags', { tagIds })
      const repo = getKnowledgeRepository()
      const knowledgeList = repo.findByTagIds(tagIds)
      return { data: knowledgeList }
    } catch (error) {
      log.error('IPC: knowledge:filterByTags failed', { error, tagIds })
      throw error
    }
  })

  // knowledge:filterByCategory - 按分类筛选知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_FILTER_BY_CATEGORY, async (_event, categoryId: string) => {
    try {
      log.debug('IPC: knowledge:filterByCategory', { categoryId })
      const repo = getKnowledgeRepository()
      const knowledgeList = repo.findByCategory(categoryId)
      return { data: knowledgeList }
    } catch (error) {
      log.error('IPC: knowledge:filterByCategory failed', { error, categoryId })
      throw error
    }
  })

  // tags:getAll - 获取所有标签
  ipcMain.handle(IPCChannel.TAGS_GET_ALL, async () => {
    try {
      log.debug('IPC: tags:getAll')
      const repo = getTagRepository()
      const tags = repo.getAllTags()
      return { data: tags }
    } catch (error) {
      log.error('IPC: tags:getAll failed', { error })
      throw error
    }
  })

  // tags:findOrCreate - 查找或创建标签
  ipcMain.handle(IPCChannel.TAGS_FIND_OR_CREATE, async (_event, names: string[]) => {
    try {
      log.info('IPC: tags:findOrCreate', { names })
      const repo = getTagRepository()
      const tags = repo.findOrCreateByNames(names)
      return { data: tags }
    } catch (error) {
      log.error('IPC: tags:findOrCreate failed', { error, names })
      throw error
    }
  })

  // tags:getUsageCount - 获取标签使用次数
  ipcMain.handle(IPCChannel.TAGS_GET_USAGE_COUNT, async (_event, tagId: string) => {
    try {
      log.debug('IPC: tags:getUsageCount', { tagId })
      const repo = getTagRepository()
      const count = repo.getTagUsageCount(tagId)
      return { data: count }
    } catch (error) {
      log.error('IPC: tags:getUsageCount failed', { error, tagId })
      throw error
    }
  })

  // categories:getAll - 获取所有分类
  ipcMain.handle(IPCChannel.CATEGORIES_GET_ALL, async () => {
    try {
      log.debug('IPC: categories:getAll')
      const repo = getCategoryRepository()
      const categories = repo.getAllCategories()
      return { data: categories }
    } catch (error) {
      log.error('IPC: categories:getAll failed', { error })
      throw error
    }
  })

  // categories:createCustom - 创建自定义分类
  ipcMain.handle(IPCChannel.CATEGORIES_CREATE_CUSTOM, async (_event, name: string) => {
    try {
      log.info('IPC: categories:createCustom', { name })
      const repo = getCategoryRepository()
      const category = repo.createCustomCategory(name)
      log.info('IPC: categories:createCustom success', { category })
      return { data: category }
    } catch (error) {
      log.error('IPC: categories:createCustom failed', { error, name })
      const errorMessage = error instanceof Error ? error.message : '创建自定义分类失败'
      throw new Error(errorMessage)
    }
  })

  // categories:deleteCustom - 删除自定义分类
  ipcMain.handle(IPCChannel.CATEGORIES_DELETE_CUSTOM, async (_event, id: string) => {
    try {
      log.info('IPC: categories:deleteCustom', { id })
      const repo = getCategoryRepository()
      repo.deleteCustomCategory(id)
      return { data: true }
    } catch (error) {
      log.error('IPC: categories:deleteCustom failed', { error, id })
      throw error
    }
  })

  // knowledge:updateFrequency - 更新复习频率系数
  ipcMain.handle(
    IPCChannel.KNOWLEDGE_UPDATE_FREQUENCY,
    async (_event, id: string, frequency: number) => {
      try {
        log.info('IPC: knowledge:updateFrequency', { id, frequency })
        const repo = getKnowledgeRepository()
        const knowledge = repo.updateFrequencyCoefficient(id, frequency)
        return { data: knowledge }
      } catch (error) {
        log.error('IPC: knowledge:updateFrequency failed', { error, id, frequency })
        throw error
      }
    }
  )

  // knowledge:markForReview - 标记知识点为立即复习
  ipcMain.handle(IPCChannel.KNOWLEDGE_MARK_FOR_REVIEW, async (_event, id: string) => {
    try {
      log.info('IPC: knowledge:markForReview', { id })
      const repo = getKnowledgeRepository()
      const knowledge = repo.markForImmediateReview(id)
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:markForReview failed', { error, id })
      throw error
    }
  })

  log.info('Knowledge IPC handlers registered')
}
