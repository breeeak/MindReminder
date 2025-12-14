/**
 * 复习历史数据类型定义
 * 对应数据库表：review_history
 */

export interface ReviewHistory {
  /** 复习记录ID（主键，UUID） */
  id: string

  /** 关联的知识点ID（外键，UUID） */
  knowledgeId: string

  /** 复习评分（1-5） */
  rating: number

  /** 复习时间（时间戳） */
  reviewedAt: number

  /** 下次复习时间（时间戳） */
  nextReviewAt: number
}

/**
 * 创建复习记录的输入类型
 */
export type CreateReviewInput = Omit<ReviewHistory, 'id' | 'reviewedAt'> & {
  reviewedAt?: number
}

/**
 * 更新复习记录的输入类型
 */
export type UpdateReviewInput = Partial<Omit<ReviewHistory, 'id' | 'knowledgeId'>>
