/**
 * SpacedRepetitionAlgorithm 单元测试
 *
 * 测试覆盖：
 * - 评分系数映射正确性
 * - 间隔计算准确性
 * - 频率系数影响
 * - 边界条件处理
 * - 记忆掌握判断
 */

import { describe, it, expect } from 'vitest'
import { SpacedRepetitionAlgorithm } from './SpacedRepetitionAlgorithm'
import type { ReviewHistory } from '../database/types'

describe('SpacedRepetitionAlgorithm', () => {
  describe('getRatingMultiplier', () => {
    it('应返回评分1的系数0.5', () => {
      expect(SpacedRepetitionAlgorithm.getRatingMultiplier(1)).toBe(0.5)
    })

    it('应返回评分2的系数0.7', () => {
      expect(SpacedRepetitionAlgorithm.getRatingMultiplier(2)).toBe(0.7)
    })

    it('应返回评分3的系数1.0', () => {
      expect(SpacedRepetitionAlgorithm.getRatingMultiplier(3)).toBe(1.0)
    })

    it('应返回评分4的系数1.2', () => {
      expect(SpacedRepetitionAlgorithm.getRatingMultiplier(4)).toBe(1.2)
    })

    it('应返回评分5的系数1.5', () => {
      expect(SpacedRepetitionAlgorithm.getRatingMultiplier(5)).toBe(1.5)
    })

    it('应对评分0抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.getRatingMultiplier(0)).toThrow(
        'Invalid rating: 0. Rating must be an integer between 1 and 5.'
      )
    })

    it('应对评分6抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.getRatingMultiplier(6)).toThrow(
        'Invalid rating: 6. Rating must be an integer between 1 and 5.'
      )
    })

    it('应对小数评分抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.getRatingMultiplier(2.5)).toThrow(
        'Invalid rating: 2.5. Rating must be an integer between 1 and 5.'
      )
    })

    it('应对负数评分抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.getRatingMultiplier(-1)).toThrow()
    })
  })

  describe('calculateNextReviewDate', () => {
    const baseDate = new Date('2025-01-01T00:00:00Z')

    it('第1次复习，评分3，应间隔1天', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 1, 3, 1.0)
      expect(result.getDate()).toBe(2) // 1月2日
    })

    it('第2次复习，评分3，应间隔2天', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 2, 3, 1.0)
      expect(result.getDate()).toBe(3) // 1月3日
    })

    it('第3次复习，评分3，应间隔4天', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 3, 1.0)
      expect(result.getDate()).toBe(5) // 1月5日
    })

    it('第4次复习，评分3，应间隔7天', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 4, 3, 1.0)
      expect(result.getDate()).toBe(8) // 1月8日
    })

    it('第5次复习，评分3，应间隔15天', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 5, 3, 1.0)
      expect(result.getDate()).toBe(16) // 1月16日
    })

    it('第6次复习，评分3，应间隔30天', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 6, 3, 1.0)
      expect(result.getDate()).toBe(31) // 1月31日
    })

    it('第7次及以后复习，评分3，应间隔30天（达到最大间隔）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 7, 3, 1.0)
      expect(result.getDate()).toBe(31) // 1月31日
    })

    it('第3次复习，评分4，应间隔5天（4 × 1.2 = 4.8 ≈ 5）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 4, 1.0)
      expect(result.getDate()).toBe(6) // 1月6日
    })

    it('第3次复习，评分5，应间隔6天（4 × 1.5 = 6）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 5, 1.0)
      expect(result.getDate()).toBe(7) // 1月7日
    })

    it('第3次复习，评分1，应间隔2天（4 × 0.5 = 2）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 1, 1.0)
      expect(result.getDate()).toBe(3) // 1月3日
    })

    it('频率系数0.5应减半间隔（4 × 1.0 × 0.5 = 2天）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 3, 0.5)
      expect(result.getDate()).toBe(3) // 1月3日
    })

    it('频率系数1.5应增加50%间隔（4 × 1.0 × 1.5 = 6天）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 3, 1.5)
      expect(result.getDate()).toBe(7) // 1月7日
    })

    it('综合测试：第5次，评分5，频率1.2（15 × 1.5 × 1.2 = 27天）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 5, 5, 1.2)
      expect(result.getDate()).toBe(28) // 1月28日
    })

    it('应对reviewCount为0抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 0, 3, 1.0)).toThrow(
        'Invalid reviewCount: 0. Must be an integer >= 1.'
      )
    })

    it('应对负数reviewCount抛出错误', () => {
      expect(() =>
        SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, -1, 3, 1.0)
      ).toThrow()
    })

    it('应对小数reviewCount抛出错误', () => {
      expect(() =>
        SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 2.5, 3, 1.0)
      ).toThrow()
    })

    it('应对frequencyCoefficient < 0.5抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 1, 3, 0.4)).toThrow(
        'Invalid frequencyCoefficient: 0.4. Must be between 0.5 and 1.5.'
      )
    })

    it('应对frequencyCoefficient > 1.5抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 1, 3, 1.6)).toThrow(
        'Invalid frequencyCoefficient: 1.6. Must be between 0.5 and 1.5.'
      )
    })

    it('应正确处理跨月份的日期计算', () => {
      const endOfMonth = new Date('2025-01-25T00:00:00Z')
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(endOfMonth, 4, 3, 1.0)
      // 25日 + 7天 = 2月1日
      expect(result.getMonth()).toBe(1) // 2月（月份从0开始）
      expect(result.getDate()).toBe(1)
    })

    it('应正确处理闰年2月的日期计算', () => {
      const feb28 = new Date('2024-02-28T00:00:00Z')
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(feb28, 1, 3, 1.0)
      // 2024年是闰年，2月28日 + 1天 = 2月29日
      expect(result.getMonth()).toBe(1) // 2月
      expect(result.getDate()).toBe(29)
    })

    it('应正确处理跨年的日期计算', () => {
      const endOfYear = new Date('2024-12-20T00:00:00Z')
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(endOfYear, 5, 3, 1.0)
      // 12月20日 + 15天 = 2025年1月4日
      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0) // 1月
      expect(result.getDate()).toBe(4)
    })
  })

  describe('isKnowledgeMastered', () => {
    it('少于5次复习应返回false', () => {
      const history: ReviewHistory[] = [
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-01'),
          nextReviewDate: new Date('2025-01-02')
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-02'),
          nextReviewDate: new Date('2025-01-04')
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-04'),
          nextReviewDate: new Date('2025-01-08')
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-08'),
          nextReviewDate: new Date('2025-01-15')
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('恰好5次复习但最近3次有低分应返回false', () => {
      const history: ReviewHistory[] = [
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 3, // 最近第1次，低分
          reviewDate: new Date('2025-02-01'),
          nextReviewDate: new Date('2025-02-16')
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-15'),
          nextReviewDate: new Date('2025-02-01')
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-08'),
          nextReviewDate: new Date('2025-01-15')
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-04'),
          nextReviewDate: new Date('2025-01-08')
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2024-12-01'),
          nextReviewDate: new Date('2025-01-04')
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('最近3次评分中第2次为3分应返回false', () => {
      const history: ReviewHistory[] = [
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-02-01'),
          nextReviewDate: new Date('2025-02-16')
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 3, // 最近第2次，低分
          reviewDate: new Date('2025-01-15'),
          nextReviewDate: new Date('2025-02-01')
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-08'),
          nextReviewDate: new Date('2025-01-15')
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-04'),
          nextReviewDate: new Date('2025-01-08')
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2024-12-01'),
          nextReviewDate: new Date('2025-01-04')
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('最近3次评分中第3次为3分应返回false', () => {
      const history: ReviewHistory[] = [
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-02-01'),
          nextReviewDate: new Date('2025-02-16')
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-15'),
          nextReviewDate: new Date('2025-02-01')
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 3, // 最近第3次，低分
          reviewDate: new Date('2025-01-08'),
          nextReviewDate: new Date('2025-01-15')
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2025-01-04'),
          nextReviewDate: new Date('2025-01-08')
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2024-12-01'),
          nextReviewDate: new Date('2025-01-04')
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('时间跨度不足30天应返回false（25天）', () => {
      const now = new Date()
      const history: ReviewHistory[] = [
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('满足所有条件应返回true（5次+最近3次高分+超过30天）', () => {
      const now = new Date()
      const history: ReviewHistory[] = [
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 4,
          reviewDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 3,
          reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 3,
          reviewDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(true)
    })

    it('恰好30天边界条件应返回true', () => {
      const now = new Date()
      const history: ReviewHistory[] = [
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 4,
          reviewDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 4,
          reviewDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 2,
          reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 2,
          reviewDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(true)
    })

    it('超过5次复习且满足条件应返回true（7次复习）', () => {
      const now = new Date()
      const history: ReviewHistory[] = [
        {
          id: '7',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '6',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 4,
          reviewDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 3,
          reviewDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 4,
          reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 3,
          reviewDate: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 2,
          reviewDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(true)
    })

    it('空历史应返回false', () => {
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered([])).toBe(false)
    })

    it('只有1次复习应返回false', () => {
      const history: ReviewHistory[] = [
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 5,
          reviewDate: new Date('2024-01-01'),
          nextReviewDate: new Date('2024-01-02')
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('最近3次全是评分4应返回true（边界条件）', () => {
      const now = new Date()
      const history: ReviewHistory[] = [
        {
          id: '5',
          knowledgeId: 'k1',
          rating: 4, // 评分4是边界
          reviewDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '4',
          knowledgeId: 'k1',
          rating: 4,
          reviewDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '3',
          knowledgeId: 'k1',
          rating: 4,
          reviewDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '2',
          knowledgeId: 'k1',
          rating: 1,
          reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: '1',
          knowledgeId: 'k1',
          rating: 1,
          reviewDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(true)
    })
  })
})
