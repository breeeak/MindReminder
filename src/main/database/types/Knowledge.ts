/**
 * 知识点数据类型定义
 * 对应数据库表：knowledge
 */

export interface Knowledge {
  /** 知识点ID（主键，UUID） */
  id: string

  /** 知识点标题 */
  title: string

  /** 知识点内容（支持Markdown） */
  content: string

  /** 标签数组 */
  tags: string[]

  /** 分类ID */
  category?: string

  /** 创建时间 */
  createdAt: Date

  /** 最后更新时间 */
  updatedAt: Date

  /** 复习频率系数（默认1.0） */
  frequencyCoefficient: number

  /** 掌握状态 */
  masteryStatus?: string

  /** 最后复习时间 */
  lastReviewAt?: number

  /** 下次复习时间 */
  nextReviewAt?: number

  /** 复习次数 */
  reviewCount?: number

  /** 掌握时间 */
  masteredAt?: number

  /** 同步状态 */
  syncStatus?: string
}

/**
 * 创建知识点的输入类型（部分字段可选）
 */
export type CreateKnowledgeInput = Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 更新知识点的输入类型（所有字段可选）
 */
export type UpdateKnowledgeInput = Partial<Omit<Knowledge, 'id' | 'createdAt'>>
