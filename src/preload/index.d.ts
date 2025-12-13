import { ElectronAPI } from '@electron-toolkit/preload'

/**
 * Knowledge实体类型
 */
export interface Knowledge {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  frequencyCoefficient: number
}

/**
 * ReviewHistory实体类型
 */
export interface ReviewHistory {
  id: string
  knowledgeId: string
  rating: number
  reviewedAt: number
  nextReviewAt: number
}

/**
 * IPC响应格式
 */
export interface IPCResponse<T> {
  data: T
}

/**
 * Knowledge API接口
 */
export interface KnowledgeAPI {
  create: (data: Partial<Knowledge>) => Promise<IPCResponse<Knowledge>>
  update: (id: string, data: Partial<Knowledge>) => Promise<IPCResponse<Knowledge>>
  delete: (id: string) => Promise<IPCResponse<boolean>>
  findById: (id: string) => Promise<IPCResponse<Knowledge | null>>
  findAll: () => Promise<IPCResponse<Knowledge[]>>
  search: (keyword: string) => Promise<IPCResponse<Knowledge[]>>
}

/**
 * Review API接口
 */
export interface ReviewAPI {
  create: (knowledgeId: string, rating: number) => Promise<IPCResponse<ReviewHistory>>
  findDue: (date: number) => Promise<IPCResponse<ReviewHistory[]>>
  findByKnowledge: (knowledgeId: string) => Promise<IPCResponse<ReviewHistory[]>>
}

/**
 * Settings API接口
 */
export interface SettingsAPI {
  get: (key: string) => Promise<IPCResponse<any>>
  update: (key: string, value: any) => Promise<IPCResponse<void>>
}

/**
 * 全局API接口
 */
export interface API {
  knowledge: KnowledgeAPI
  review: ReviewAPI
  settings: SettingsAPI
}

/**
 * 声明全局window对象类型
 */
declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
