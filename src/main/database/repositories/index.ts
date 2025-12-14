/**
 * Repository工厂和单例管理
 * 提供统一的Repository实例访问接口
 */

import { DatabaseService } from '../DatabaseService'
import { KnowledgeRepository } from './KnowledgeRepository'
import { ReviewRepository } from './ReviewRepository'
import { TagRepository } from './TagRepository'
import { CategoryRepository } from './CategoryRepository'
import { DiaryRepository } from './DiaryRepository'
import { ReminderRepository } from './ReminderRepository'

// Repository单例实例
let knowledgeRepo: KnowledgeRepository | null = null
let reviewRepo: ReviewRepository | null = null
let tagRepo: TagRepository | null = null
let categoryRepo: CategoryRepository | null = null
let diaryRepo: DiaryRepository | null = null
let reminderRepo: ReminderRepository | null = null

/**
 * 初始化所有Repository实例
 * 应该在应用启动时调用一次
 *
 * @param dbService 数据库服务实例
 */
export function initRepositories(dbService: DatabaseService): void {
  knowledgeRepo = new KnowledgeRepository(dbService)
  reviewRepo = new ReviewRepository(dbService)
  tagRepo = new TagRepository(dbService)
  categoryRepo = new CategoryRepository(dbService)
  diaryRepo = new DiaryRepository(dbService)
  reminderRepo = new ReminderRepository(dbService)
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
 * 获取TagRepository单例
 * @returns TagRepository实例
 * @throws 如果Repository未初始化
 */
export function getTagRepository(): TagRepository {
  if (!tagRepo) {
    throw new Error('Repositories not initialized. Call initRepositories() first.')
  }
  return tagRepo
}

/**
 * 获取CategoryRepository单例
 * @returns CategoryRepository实例
 * @throws 如果Repository未初始化
 */
export function getCategoryRepository(): CategoryRepository {
  if (!categoryRepo) {
    throw new Error('Repositories not initialized. Call initRepositories() first.')
  }
  return categoryRepo
}

/**
 * 获取DiaryRepository单例
 * @returns DiaryRepository实例
 * @throws 如果Repository未初始化
 */
export function getDiaryRepository(): DiaryRepository {
  if (!diaryRepo) {
    throw new Error('Repositories not initialized. Call initRepositories() first.')
  }
  return diaryRepo
}

/**
 * 获取ReminderRepository单例
 * @returns ReminderRepository实例
 * @throws 如果Repository未初始化
 */
export function getReminderRepository(): ReminderRepository {
  if (!reminderRepo) {
    throw new Error('Repositories not initialized. Call initRepositories() first.')
  }
  return reminderRepo
}

/**
 * 清理所有Repository实例
 * 用于测试或应用关闭时
 */
export function clearRepositories(): void {
  knowledgeRepo = null
  reviewRepo = null
  tagRepo = null
  categoryRepo = null
  diaryRepo = null
  reminderRepo = null
}

// 导出Repository类（供测试使用）
export { KnowledgeRepository } from './KnowledgeRepository'
export { ReviewRepository } from './ReviewRepository'
export { TagRepository } from './TagRepository'
export { CategoryRepository } from './CategoryRepository'
export { DiaryRepository } from './DiaryRepository'
export { ReminderRepository } from './ReminderRepository'
export { BaseRepository } from './BaseRepository'
