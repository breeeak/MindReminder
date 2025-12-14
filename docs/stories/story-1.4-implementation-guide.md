# Story 1.4: 复习算法核心框架 - 实施指南

**Story ID:** 1.4  
**Epic:** Epic 1 - 项目基础设施与开发环境  
**状态:** Ready for Review  
**优先级:** P0  
**Story Points:** 13  
**预估工时:** 12小时  
**实际工时:** 1小时  
**完成日期:** 2025-12-13

---

## 📋 Story概述

**用户故事:**

```
As a 开发者,
I want 实现基于艾宾浩斯曲线的复习算法,
So that 系统能科学地计算知识点的下次复习时间，帮助用户高效记忆.
```

**价值:**

- 实现科学的间隔重复学习算法
- 根据用户评分动态调整复习间隔
- 支持频率系数个性化调整
- 提供记忆掌握度判断逻辑
- 为复习系统提供核心算法基础

**依赖:**

- ✅ Story 1.1: electron-vite项目初始化
- ✅ Story 1.2: SQLite数据库基础设施
- ✅ Story 1.3: Repository模式数据访问层

**重要性:**

- 🔥 核心算法，需要100%准确性
- 🔥 测试覆盖率要求 ≥ 90%
- 🔥 算法准确性直接影响用户学习效果

---

## 🎯 验收标准 (Acceptance Criteria)

### AC1: SpacedRepetitionAlgorithm类创建

**Given** 项目基础设施已完成（Story 1.1-1.3）  
**When** 创建SpacedRepetitionAlgorithm类（`src/main/algorithms/SpacedRepetitionAlgorithm.ts`）  
**Then** 类提供以下核心方法：

- `calculateNextReviewDate(lastReviewDate: Date, reviewCount: number, rating: number, frequencyCoefficient: number): Date`
- `getRatingMultiplier(rating: number): number`
- `isKnowledgeMastered(reviewHistory: ReviewHistory[]): boolean`

---

### AC2: 评分系数映射

**When** 实现getRatingMultiplier方法  
**Then** getRatingMultiplier返回正确的系数：

- 评分1（😟 忘记了）→ 0.5
- 评分2（🤔 记得一点）→ 0.7
- 评分3（😐 记得一般）→ 1.0
- 评分4（😊 记得还可以）→ 1.2
- 评分5（🎯 非常熟悉）→ 1.5

**And** 对于无效评分（<1 或 >5）抛出错误

---

### AC3: 艾宾浩斯遗忘曲线计算

**When** 实现calculateNextReviewDate方法  
**Then** 使用以下基础间隔（天）：

- 第1次复习：1天
- 第2次复习：2天
- 第3次复习：4天
- 第4次复习：7天
- 第5次复习：15天
- 第6次及以后：30天

**And** 间隔时间乘以评分系数（ratingMultiplier）  
**And** 间隔时间乘以频率系数（frequencyCoefficient，范围0.5-1.5）  
**And** 最终计算公式：`nextReviewDate = lastReviewDate + (baseInterval × ratingMultiplier × frequencyCoefficient)`

**计算示例:**

- 第3次复习，评分4（😊），全局频率系数1.0
- 下次复习间隔 = 4天 × 1.2 × 1.0 = 4.8天（向上取整为5天）

---

### AC4: 频率系数调整

**When** 实现频率系数调整逻辑  
**Then** 频率系数范围：0.5 - 1.5  
**And** 默认值：1.0  
**And** 支持在calculateNextReviewDate中作为参数传入

---

### AC5: 记忆掌握判断

**When** 实现isKnowledgeMastered方法  
**Then** 检查以下条件：

- 至少进行过5次复习
- 最近3次复习评分均 ≥ 4（😊）
- 距离首次记录时间 ≥ 30天

**And** 所有条件满足时返回true  
**And** 任一条件不满足时返回false

---

### AC6: 单元测试

**When** 创建单元测试（`src/main/algorithms/SpacedRepetitionAlgorithm.test.ts`）  
**Then** 测试覆盖以下场景：

- 评分系数映射正确性
- 各个复习阶段的间隔计算
- 频率系数对间隔的影响
- 边界条件（评分范围外、负数复习次数等）
- 记忆掌握判断的各种组合

**And** 所有测试用例通过  
**And** 代码覆盖率 ≥ 90%

---

## 🏗️ 实施步骤

### Step 1: 创建算法类基础结构 (1h)

**任务:**

1. 创建 `src/main/algorithms/` 目录
2. 创建 `SpacedRepetitionAlgorithm.ts` 文件
3. 定义类结构和方法签名
4. 添加JSDoc注释

**产出:**

- `src/main/algorithms/SpacedRepetitionAlgorithm.ts`

**代码框架:**

```typescript
/**
 * 间隔重复学习算法（基于艾宾浩斯遗忘曲线）
 */
export class SpacedRepetitionAlgorithm {
  /**
   * 评分对应的复习间隔系数
   */
  private static readonly RATING_MULTIPLIERS = {
    1: 0.5, // 😟 忘记了
    2: 0.7, // 🤔 记得一点
    3: 1.0, // 😐 记得一般
    4: 1.2, // 😊 记得还可以
    5: 1.5 // 🎯 非常熟悉
  }

  /**
   * 基础复习间隔（天）
   */
  private static readonly BASE_INTERVALS = [1, 2, 4, 7, 15, 30]

  // 方法签名
  static calculateNextReviewDate(
    lastReviewDate: Date,
    reviewCount: number,
    rating: number,
    frequencyCoefficient: number = 1.0
  ): Date {}

  static getRatingMultiplier(rating: number): number {}

  static isKnowledgeMastered(reviewHistory: ReviewHistory[]): boolean {}
}
```

**验证:**

- TypeScript编译无错误
- 类结构符合设计要求

---

### Step 2: 实现评分系数映射 (1h)

**任务:**

1. 实现 `getRatingMultiplier` 方法
2. 添加评分验证
3. 添加错误处理
4. 编写JSDoc注释

**实现代码:**

```typescript
/**
 * 获取评分对应的复习间隔系数
 * @param rating 评分（1-5）
 * @returns 间隔系数
 * @throws Error 如果评分无效
 */
static getRatingMultiplier(rating: number): number {
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error(`Invalid rating: ${rating}. Rating must be an integer between 1 and 5.`);
  }
  return this.RATING_MULTIPLIERS[rating as keyof typeof this.RATING_MULTIPLIERS];
}
```

**验证:**

- 评分1-5返回正确系数
- 无效评分抛出错误
- 错误消息清晰明确

---

### Step 3: 实现艾宾浩斯曲线计算 (3h)

**任务:**

1. 实现 `calculateNextReviewDate` 方法
2. 实现基础间隔计算逻辑
3. 应用评分系数和频率系数
4. 处理边界情况
5. 添加日志记录

**实现代码:**

```typescript
/**
 * 计算下次复习时间
 * @param lastReviewDate 上次复习时间
 * @param reviewCount 复习次数（从1开始）
 * @param rating 本次复习评分（1-5）
 * @param frequencyCoefficient 频率系数（0.5-1.5，默认1.0）
 * @returns 下次复习的日期
 */
static calculateNextReviewDate(
  lastReviewDate: Date,
  reviewCount: number,
  rating: number,
  frequencyCoefficient: number = 1.0
): Date {
  // 验证参数
  if (reviewCount < 1) {
    throw new Error(`Invalid reviewCount: ${reviewCount}. Must be >= 1.`);
  }
  if (frequencyCoefficient < 0.5 || frequencyCoefficient > 1.5) {
    throw new Error(`Invalid frequencyCoefficient: ${frequencyCoefficient}. Must be between 0.5 and 1.5.`);
  }

  // 获取基础间隔（天）
  const baseIntervalIndex = Math.min(reviewCount - 1, this.BASE_INTERVALS.length - 1);
  const baseIntervalDays = this.BASE_INTERVALS[baseIntervalIndex];

  // 获取评分系数
  const ratingMultiplier = this.getRatingMultiplier(rating);

  // 计算实际间隔（天）
  const actualIntervalDays = baseIntervalDays * ratingMultiplier * frequencyCoefficient;

  // 向上取整
  const finalIntervalDays = Math.ceil(actualIntervalDays);

  // 计算下次复习日期
  const nextReviewDate = new Date(lastReviewDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + finalIntervalDays);

  return nextReviewDate;
}
```

**验证:**

- 各个复习阶段间隔正确
- 评分系数影响正确
- 频率系数影响正确
- 向上取整逻辑正确
- 边界条件处理正确

---

### Step 4: 实现记忆掌握判断逻辑 (2h)

**任务:**

1. 实现 `isKnowledgeMastered` 方法
2. 检查复习次数条件
3. 检查最近评分条件
4. 检查时间跨度条件
5. 添加详细日志

**实现代码:**

```typescript
/**
 * 判断知识点是否已掌握
 * @param reviewHistory 复习历史记录（按时间倒序排列）
 * @returns 是否已掌握
 */
static isKnowledgeMastered(reviewHistory: ReviewHistory[]): boolean {
  // 条件1: 至少进行过5次复习
  if (reviewHistory.length < 5) {
    return false;
  }

  // 条件2: 最近3次复习评分均 ≥ 4
  const recentReviews = reviewHistory.slice(0, 3);
  const allHighRatings = recentReviews.every(review => review.rating >= 4);
  if (!allHighRatings) {
    return false;
  }

  // 条件3: 距离首次记录时间 ≥ 30天
  const firstReview = reviewHistory[reviewHistory.length - 1];
  const daysSinceFirst = (Date.now() - firstReview.reviewDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceFirst < 30) {
    return false;
  }

  return true;
}
```

**验证:**

- 少于5次复习返回false
- 最近3次有低分返回false
- 时间跨度不足30天返回false
- 所有条件满足返回true

---

### Step 5: 编写完整单元测试 (4h)

**任务:**

1. 创建 `SpacedRepetitionAlgorithm.test.ts` 文件
2. 安装测试依赖（vitest）
3. 编写评分系数测试
4. 编写间隔计算测试
5. 编写频率系数测试
6. 编写掌握判断测试
7. 编写边界条件测试

**测试框架:**

```typescript
import { describe, it, expect } from 'vitest'
import { SpacedRepetitionAlgorithm } from './SpacedRepetitionAlgorithm'
import { ReviewHistory } from '../database/types'

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

    it('应对无效评分抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.getRatingMultiplier(0)).toThrow()
      expect(() => SpacedRepetitionAlgorithm.getRatingMultiplier(6)).toThrow()
      expect(() => SpacedRepetitionAlgorithm.getRatingMultiplier(2.5)).toThrow()
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

    it('第3次复习，评分4，应间隔5天（4 × 1.2 = 4.8 ≈ 5）', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 4, 1.0)
      expect(result.getDate()).toBe(6) // 1月6日
    })

    it('第6次复习，评分3，应间隔30天', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 6, 3, 1.0)
      expect(result.getDate()).toBe(31) // 1月31日
    })

    it('频率系数0.5应减半间隔', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 3, 0.5)
      expect(result.getDate()).toBe(3) // 4 × 1.0 × 0.5 = 2天
    })

    it('频率系数1.5应增加50%间隔', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 3, 1.5)
      expect(result.getDate()).toBe(7) // 4 × 1.0 × 1.5 = 6天
    })

    it('评分1应减半间隔', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 1, 1.0)
      expect(result.getDate()).toBe(3) // 4 × 0.5 × 1.0 = 2天
    })

    it('评分5应增加50%间隔', () => {
      const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 3, 5, 1.0)
      expect(result.getDate()).toBe(7) // 4 × 1.5 × 1.0 = 6天
    })

    it('应对无效reviewCount抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 0, 3, 1.0)).toThrow()
      expect(() =>
        SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, -1, 3, 1.0)
      ).toThrow()
    })

    it('应对无效frequencyCoefficient抛出错误', () => {
      expect(() => SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 1, 3, 0.4)).toThrow()
      expect(() => SpacedRepetitionAlgorithm.calculateNextReviewDate(baseDate, 1, 3, 1.6)).toThrow()
    })
  })

  describe('isKnowledgeMastered', () => {
    it('少于5次复习应返回false', () => {
      const history: ReviewHistory[] = [
        {
          id: 1,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2025-01-01'),
          nextReviewDate: new Date('2025-01-02')
        },
        {
          id: 2,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2025-01-02'),
          nextReviewDate: new Date('2025-01-04')
        },
        {
          id: 3,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2025-01-04'),
          nextReviewDate: new Date('2025-01-08')
        },
        {
          id: 4,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2025-01-08'),
          nextReviewDate: new Date('2025-01-15')
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('最近3次有低分应返回false', () => {
      const history: ReviewHistory[] = [
        {
          id: 5,
          knowledgeId: 1,
          rating: 3,
          reviewDate: new Date('2025-02-01'),
          nextReviewDate: new Date('2025-02-16')
        },
        {
          id: 4,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2025-01-15'),
          nextReviewDate: new Date('2025-02-01')
        },
        {
          id: 3,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2025-01-08'),
          nextReviewDate: new Date('2025-01-15')
        },
        {
          id: 2,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2025-01-04'),
          nextReviewDate: new Date('2025-01-08')
        },
        {
          id: 1,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date('2024-12-01'),
          nextReviewDate: new Date('2025-01-04')
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('时间跨度不足30天应返回false', () => {
      const now = new Date()
      const history: ReviewHistory[] = [
        {
          id: 5,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 4,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 3,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 2,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 1,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(false)
    })

    it('满足所有条件应返回true', () => {
      const now = new Date()
      const history: ReviewHistory[] = [
        {
          id: 5,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 4,
          knowledgeId: 1,
          rating: 4,
          reviewDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 3,
          knowledgeId: 1,
          rating: 5,
          reviewDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 2,
          knowledgeId: 1,
          rating: 3,
          reviewDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        },
        {
          id: 1,
          knowledgeId: 1,
          rating: 3,
          reviewDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          nextReviewDate: now
        }
      ]
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered(history)).toBe(true)
    })

    it('空历史应返回false', () => {
      expect(SpacedRepetitionAlgorithm.isKnowledgeMastered([])).toBe(false)
    })
  })
})
```

**验证:**

- 运行 `pnpm test`
- 所有测试通过
- 代码覆盖率 ≥ 90%

---

### Step 6: 验证算法准确性 (1h)

**任务:**

1. 创建手动验证脚本
2. 验证真实场景计算
3. 对比预期结果
4. 记录验证结果

**验证脚本:**

```typescript
// scripts/verify-algorithm.ts
import { SpacedRepetitionAlgorithm } from '../src/main/algorithms/SpacedRepetitionAlgorithm'

console.log('=== 复习算法验证 ===\n')

// 场景1: 标准学习路径
console.log('场景1: 标准学习路径（评分3）')
let currentDate = new Date('2025-01-01')
for (let i = 1; i <= 6; i++) {
  const nextDate = SpacedRepetitionAlgorithm.calculateNextReviewDate(currentDate, i, 3, 1.0)
  const days = Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
  console.log(
    `第${i}次复习: ${currentDate.toISOString().split('T')[0]} -> ${nextDate.toISOString().split('T')[0]} (间隔${days}天)`
  )
  currentDate = nextDate
}
console.log()

// 场景2: 快速掌握路径（评分5）
console.log('场景2: 快速掌握路径（评分5）')
currentDate = new Date('2025-01-01')
for (let i = 1; i <= 6; i++) {
  const nextDate = SpacedRepetitionAlgorithm.calculateNextReviewDate(currentDate, i, 5, 1.0)
  const days = Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
  console.log(
    `第${i}次复习: ${currentDate.toISOString().split('T')[0]} -> ${nextDate.toISOString().split('T')[0]} (间隔${days}天)`
  )
  currentDate = nextDate
}
console.log()

// 场景3: 遗忘重学路径（评分1）
console.log('场景3: 遗忘重学路径（评分1）')
currentDate = new Date('2025-01-01')
for (let i = 1; i <= 6; i++) {
  const nextDate = SpacedRepetitionAlgorithm.calculateNextReviewDate(currentDate, i, 1, 1.0)
  const days = Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
  console.log(
    `第${i}次复习: ${currentDate.toISOString().split('T')[0]} -> ${nextDate.toISOString().split('T')[0]} (间隔${days}天)`
  )
  currentDate = nextDate
}
console.log()

console.log('=== 验证完成 ===')
```

**预期输出:**

```
场景1: 标准学习路径（评分3）
第1次复习: 2025-01-01 -> 2025-01-02 (间隔1天)
第2次复习: 2025-01-02 -> 2025-01-04 (间隔2天)
第3次复习: 2025-01-04 -> 2025-01-08 (间隔4天)
第4次复习: 2025-01-08 -> 2025-01-15 (间隔7天)
第5次复习: 2025-01-15 -> 2025-01-30 (间隔15天)
第6次复习: 2025-01-30 -> 2025-03-01 (间隔30天)
```

---

## 📁 文件结构

完成后的文件结构：

```
src/main/
├── algorithms/                 # 新建
│   ├── SpacedRepetitionAlgorithm.ts
│   └── SpacedRepetitionAlgorithm.test.ts
├── database/                   # 已存在
│   ├── types/
│   │   └── ReviewHistory.ts    # 依赖
│   └── ...
└── ...

scripts/                        # 可选
└── verify-algorithm.ts
```

---

## 🧪 测试策略

### 单元测试（必须）

**覆盖范围:**

- ✅ 评分系数映射（6个测试用例）
- ✅ 间隔计算正确性（8个测试用例）
- ✅ 频率系数影响（2个测试用例）
- ✅ 边界条件（4个测试用例）
- ✅ 记忆掌握判断（5个测试用例）

**目标:**

- 代码覆盖率 ≥ 90%
- 所有测试用例通过
- 边界条件全覆盖

### 手动验证（推荐）

**验证场景:**

1. 标准学习路径（评分3）
2. 快速掌握路径（评分5）
3. 遗忘重学路径（评分1）
4. 频率系数调整效果
5. 跨月份日期计算

---

## 📊 算法设计详解

### 艾宾浩斯遗忘曲线原理

**理论基础:**
人类记忆遵循遗忘曲线，在特定时间点进行复习可以最大化记忆保持率。

**间隔选择依据:**

- 第1次（1天）: 初次记忆巩固期
- 第2次（2天）: 短期记忆强化期
- 第3次（4天）: 中期记忆转化期
- 第4次（7天）: 一周记忆检验期
- 第5次（15天）: 半月记忆巩固期
- 第6次（30天）: 长期记忆形成期

### 评分系数设计

**系数范围:** 0.5 - 1.5

**设计原理:**

- 评分越低，系数越小，下次复习越早
- 评分越高，系数越大，下次复习可延后
- 中性评分（3分）系数为1.0，保持标准间隔

### 频率系数设计

**系数范围:** 0.5 - 1.5

**使用场景:**

- 用户可全局调整复习频率
- 0.5: 加倍复习频率（更密集）
- 1.0: 标准频率（默认）
- 1.5: 降低复习频率（更宽松）

### 记忆掌握标准

**三重条件:**

1. **次数条件:** 至少5次复习（保证充分练习）
2. **质量条件:** 最近3次评分≥4（保证高质量）
3. **时间条件:** 跨度≥30天（保证长期记忆）

---

## ⚠️ 注意事项

### 日期计算精度

- 使用 `setDate()` 方法自动处理跨月
- 间隔向上取整（`Math.ceil`）
- 时区使用本地时间（不使用UTC）

### 参数验证

**必须验证:**

- rating: 1-5的整数
- reviewCount: ≥1的整数
- frequencyCoefficient: 0.5-1.5的数字

**错误处理:**

- 抛出明确的错误消息
- 错误消息包含参数名和有效范围

### 性能考虑

- 所有方法使用 `static`，无需实例化
- 计算复杂度 O(1)
- 无副作用，纯函数设计

---

## 🎯 Definition of Done

**代码完成:**

- [ ] SpacedRepetitionAlgorithm类实现完成
- [ ] getRatingMultiplier方法实现完成
- [ ] calculateNextReviewDate方法实现完成
- [ ] isKnowledgeMastered方法实现完成

**验收标准:**

- [ ] AC1-AC6全部验证通过
- [ ] 单元测试全部通过
- [ ] 代码覆盖率 ≥ 90%
- [ ] 手动验证脚本执行成功

**代码质量:**

- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
- [ ] 所有方法有完整JSDoc注释
- [ ] 错误处理完整且清晰

**测试:**

- [ ] 单元测试覆盖所有场景
- [ ] 边界条件测试完整
- [ ] 手动验证结果符合预期

**文档:**

- [ ] 代码注释完整
- [ ] 本实施指南完成
- [ ] 算法设计文档完整

---

## 📝 技术决策记录

### 决策1: 静态方法 vs 实例方法

**选择:** 静态方法

**原因:**

- 算法无状态，不需要实例
- 性能更好（无需new）
- 使用更简单
- 符合工具类设计模式

### 决策2: 间隔向上取整

**选择:** Math.ceil（向上取整）

**原因:**

- 保守策略，确保不会遗忘
- 用户体验更好（宁可早复习）
- 避免小数天数的概念混淆

### 决策3: 频率系数范围

**选择:** 0.5 - 1.5

**原因:**

- 0.5: 最密集，适合考前冲刺
- 1.5: 最宽松，适合长期学习
- 范围适中，避免极端情况

### 决策4: 记忆掌握标准

**选择:** 5次 + 最近3次高分 + 30天

**原因:**

- 科学依据：长期记忆需要30天形成
- 质量保证：最近3次高分确保真正掌握
- 实践验证：5次足以判断记忆效果

---

## 🚀 开始开发

**准备工作:**

1. 确认Story 1.3已完成（Repository层可用）
2. 拉取最新代码
3. 切换到新分支：`git checkout -b feature/story-1.4-algorithm`
4. 安装vitest测试依赖：`pnpm add -D vitest`

**开发流程:**

1. 按步骤1-6顺序实现
2. 每完成一步，运行测试验证
3. 完成后运行完整测试套件
4. 执行手动验证脚本
5. 检查DoD清单
6. 提交Pull Request

**测试命令:**

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test SpacedRepetitionAlgorithm.test.ts

# 查看代码覆盖率
pnpm test --coverage

# 运行手动验证
pnpm tsx scripts/verify-algorithm.ts
```

**预估时间分配:**

- Step 1: 1小时（基础结构）
- Step 2: 1小时（评分系数）
- Step 3: 3小时（核心计算）
- Step 4: 2小时（掌握判断）
- Step 5: 4小时（单元测试）
- Step 6: 1小时（手动验证）
- **总计: 12小时**

祝开发顺利！🎉 这是核心算法，请确保测试覆盖率和准确性！

---

## 📊 实施完成记录

**开发日期:** 2025-12-13  
**开发者:** Dev Agent (Amelia)  
**实际工时:** 1小时

### ✅ 已完成任务

**代码实现:**

- [x] SpacedRepetitionAlgorithm类实现完成
- [x] getRatingMultiplier方法实现完成
- [x] calculateNextReviewDate方法实现完成
- [x] isKnowledgeMastered方法实现完成

**验收标准:**

- [x] AC1-AC6全部验证通过
- [x] 单元测试全部通过（41个测试用例）
- [x] 代码覆盖率 100%（超过90%要求）
- [x] 手动验证脚本执行成功

**代码质量:**

- [x] TypeScript编译无错误
- [x] ESLint检查通过
- [x] 所有方法有完整JSDoc注释
- [x] 错误处理完整且清晰

**测试:**

- [x] 单元测试覆盖所有场景
- [x] 边界条件测试完整
- [x] 手动验证结果符合预期

**文档:**

- [x] 代码注释完整
- [x] 本实施指南更新
- [x] 算法设计文档完整

### 📁 生成文件

- `src/main/algorithms/SpacedRepetitionAlgorithm.ts` - 算法实现
- `src/main/algorithms/SpacedRepetitionAlgorithm.test.ts` - 单元测试（41个测试用例）
- `scripts/verify-algorithm.ts` - 验证脚本
- `vitest.config.ts` - 测试配置

### 📈 测试结果

**单元测试:**

```
Test Files  1 passed (1)
Tests       41 passed (41)
Duration    9ms
```

**代码覆盖率:**

```
File                        | % Stmts | % Branch | % Funcs | % Lines
SpacedRepetitionAlgorithm   |   100   |   100    |   100   |   100
```

**验证场景:**

- ✅ 场景1: 标准学习路径（评分3）
- ✅ 场景2: 快速掌握路径（评分5）
- ✅ 场景3: 遗忘重学路径（评分1）
- ✅ 场景4: 频率系数影响
- ✅ 场景5: 跨月份和跨年计算

### 🎯 关键成果

1. **100%测试覆盖率** - 超过要求的90%
2. **41个测试用例** - 覆盖所有边界条件
3. **算法准确性验证** - 所有场景通过
4. **完整错误处理** - 参数验证和清晰错误消息
5. **性能优化** - 静态方法，O(1)复杂度

### 💡 技术亮点

- 使用Record类型实现评分系数映射
- 向上取整策略确保不会遗忘
- 完整的JSDoc注释
- 类型安全的参数验证
- 纯函数设计，无副作用

### 🔄 下一步

Story 1.4已标记为 "Ready for Review"。建议：

1. 运行代码审查工作流
2. 验证集成测试
3. 开始Story 1.5或1.6开发
