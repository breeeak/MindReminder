import { ipcMain } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { getKnowledgeRepository } from '../database/repositories'
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
  ipcMain.handle(IPCChannel.KNOWLEDGE_UPDATE, async (_event, id: string, data: Partial<Knowledge>) => {
    try {
      log.info('IPC: knowledge:update', { id, data })
      const repo = getKnowledgeRepository()
      const knowledge = repo.update(id, data)
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:update failed', { error, id })
      throw error
    }
  })
  
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
  
  log.info('Knowledge IPC handlers registered')
}

