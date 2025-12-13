/**
 * Repository工厂和单例管理
 * 提供统一的Repository实例访问接口
 */

import { DatabaseService } from '../DatabaseService'
import { KnowledgeRepository } from './KnowledgeRepository'
import { ReviewRepository } from './ReviewRepository'

// Repository单例实例
let knowledgeRepo: KnowledgeRepository | null = null
let reviewRepo: ReviewRepository | null = null

/**
 * 初始化所有Repository实例
 * 应该在应用启动时调用一次
 * 
 * @param dbService 数据库服务实例
 */
export function initRepositories(dbService: DatabaseService): void {
  knowledgeRepo = new KnowledgeRepository(dbService)
  reviewRepo = new ReviewRepository(dbService)
}

/**
 * 获取KnowledgeRepository单例
 * @returns KnowledgeRepository实例
 * @throws 如果Repository未初始化
 */
export function getKnowledgeRepository(): KnowledgeRepository {
  if (!knowledgeRepo) {
    throw new Error('Repositories not initialized. Call initRepositories() first.')
  }
  return knowledgeRepo
}

/**
 * 获取ReviewRepository单例
 * @returns ReviewRepository实例
 * @throws 如果Repository未初始化
 */
export function getReviewRepository(): ReviewRepository {
  if (!reviewRepo) {
    throw new Error('Repositories not initialized. Call initRepositories() first.')
  }
  return reviewRepo
}

/**
 * 清理所有Repository实例
 * 用于测试或应用关闭时
 */
export function clearRepositories(): void {
  knowledgeRepo = null
  reviewRepo = null
}

// 导出Repository类（供测试使用）
export { KnowledgeRepository } from './KnowledgeRepository'
export { ReviewRepository } from './ReviewRepository'
export { BaseRepository } from './BaseRepository'

