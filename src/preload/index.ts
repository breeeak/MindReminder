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
  findAll: () => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_ALL),
  search: (keyword: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_SEARCH, keyword),
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
}

/**
 * Settings API
 */
const settingsAPI = {
  get: (key: string) => ipcRenderer.invoke(IPCChannel.SETTINGS_GET, key),
  update: (key: string, value: any) => ipcRenderer.invoke(IPCChannel.SETTINGS_UPDATE, key, value),
}

// Use `contextBridge` APIs to expose Electron APIs to renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      knowledge: knowledgeAPI,
      review: reviewAPI,
      settings: settingsAPI,
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
    review: reviewAPI,
    settings: settingsAPI,
  }
}
