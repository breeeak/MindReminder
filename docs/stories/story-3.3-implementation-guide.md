# Story 3.3 实现指南：复习算法动态调整

**Story ID:** 3.3  
**Story Title:** 复习算法动态调整  
**Epic:** Epic 3 - 智能复习系统  
**优先级:** P0  
**Story Points:** 8  
**预估时间:** 6小时  
**依赖:** Story 3.1 (今日复习任务列表), Story 3.2 (复习流程和人性化评分)

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **系统根据我的评分自动调整复习间隔**,  
So that **遗忘的知识点更频繁复习，熟悉的知识点间隔延长**.

### 业务价值

- 自动化复习间隔调整，根据用户评分智能优化学习计划
- 实现自适应学习系统，提高复习效率
- 检测和标记已掌握的知识点，减少不必要的复习
- 支持长期抽查模式，巩固记忆成果
- 防止遗忘曲线反弹，确保知识长期保持

### 业务需求覆盖

- **FR13**: 根据评分动态调整复习间隔
- **FR15-FR16**: 记忆标准判断和长期抽查模式
- **NFR-R4**: 算法准确性100%
- **NFR-R5**: 系统可靠性要求

---

## 📐 技术设计

### 架构层次

**注意：本Story的核心逻辑已在Story 1.4和Story 3.2中实现。** 本Story主要是：

1. 验证算法逻辑正确性
2. 补充掌握标准判断的完整实现
3. 添加长期抽查模式功能
4. 提供UI可见性和数据验证

```
UI层（Renderer）
├── KnowledgeDetailPage.tsx          # 【修改】显示复习间隔调整信息
│   ├── 复习历史图表                   # 显示评分趋势
│   ├── 间隔变化趋势                   # 显示间隔调整曲线
│   └── 掌握状态标识                   # "已掌握"徽章
│
└── ReviewCompletePage.tsx           # 【修改】显示间隔调整说明

Service层
└── ReviewService.ts                 # 【已实现】Story 3.2
    ├── processReviewRating()         # 已调用算法
    ├── checkMasteryStatus()          # 【完善】掌握标准判断
    └── applyLongTermMode()           # 【新增】长期抽查模式

Algorithm层
└── SpacedRepetitionAlgorithm.ts    # 【已实现】Story 1.4
    └── calculateNextReview()         # 已实现所有评分系数

数据层
└── KnowledgeRepository.ts          # 【扩展】掌握状态更新
    ├── updateMasteryStatus()         # 更新掌握状态
    └── findMasteredKnowledge()       # 查询已掌握知识点
```

### 算法逻辑（已实现验证）

#### 1. 评分系数映射（Story 1.4已实现）

```typescript
// src/main/algorithm/SpacedRepetition.ts
const ratingCoefficients = {
  1: 0.5, // 😟 忘记了 → 间隔缩短50%
  2: 0.7, // 🤔 记得一点 → 间隔缩短30%
  3: 1.0, // 😐 记得一般 → 保持标准间隔
  4: 1.2, // 😊 记得还可以 → 间隔延长20%
  5: 1.5 // 🎯 非常熟悉 → 间隔延长50%
}
```

#### 2. 间隔计算公式（Story 1.4已实现）

```
下次间隔 = 基础间隔 × 评分系数 × 频率系数

基础间隔序列（艾宾浩斯曲线）:
[1, 2, 4, 7, 15, 30, 60, 90, 180, 365]天
```

#### 3. 掌握标准判断（本Story完善）

```typescript
记忆标准：
1. 至少复习5次
2. 最近3次评分 ≥ 4
3. 距离创建时间 ≥ 30天

满足条件 → 标记为"已掌握"(mastered)
进入长期抽查模式：每60天复习一次
```

#### 4. 掌握状态反弹（本Story新增）

```typescript
已掌握的知识点如果评分 < 3:
1. 重新标记为"学习中"(learning)
2. 重新开始标准复习流程
3. 间隔重置到合适的复习次数对应的间隔
```

---

## 🎯 验收标准（Acceptance Criteria）

### AC1: 评分为1或2时缩短复习间隔

**Given** 用户对某知识点进行复习并评分  
**When** 评分为1（😟 忘记了）  
**Then** 下次复习间隔缩短50%  
**And** 数据库记录正确保存  
**And** 间隔天数 = 上次间隔 × 0.5

**When** 评分为2（🤔 记得一点）  
**Then** 下次复习间隔缩短30%  
**And** 间隔天数 = 上次间隔 × 0.7

**验证方式:**

- 算法单元测试已覆盖（Story 1.4）
- 手动验证数据库next_review_at字段
- 检查间隔天数计算准确性

### AC2: 评分为3时保持标准间隔

**Given** 用户对某知识点进行复习并评分  
**When** 评分为3（😐 记得一般）  
**Then** 下次复习间隔保持标准  
**And** 间隔 = 基础间隔 × 频率系数  
**And** 不受评分影响（系数=1.0）

**验证方式:**

- 算法单元测试已覆盖
- 验证间隔严格按艾宾浩斯曲线计算

### AC3: 评分为4或5时延长复习间隔

**Given** 用户对某知识点进行复习并评分  
**When** 评分为4（😊 记得还可以）  
**Then** 下次复习间隔延长20%  
**And** 间隔天数 = 上次间隔 × 1.2

**When** 评分为5（🎯 非常熟悉）  
**Then** 下次复习间隔延长50%  
**And** 间隔天数 = 上次间隔 × 1.5

**验证方式:**

- 算法单元测试已覆盖
- 手动验证极限情况（连续评分5）

### AC4: 记忆标准判断

**Given** 知识点满足以下条件：

- 至少复习5次
- 最近3次评分 ≥ 4
- 距离创建时间 ≥ 30天

**When** 完成复习并提交评分  
**Then** 系统自动检查是否达到记忆标准  
**And** 达到标准后标记为"已掌握"  
**And** 更新mastery_status = 'mastered'  
**And** 记录mastered_at时间戳

**And** 在知识点详情页显示"已掌握"徽章  
**And** 在知识点列表显示特殊标识

**验证方式:**

- 创建测试知识点满足所有条件
- 验证数据库字段更新
- 验证UI显示正确

### AC5: 长期抽查模式

**Given** 知识点已标记为"已掌握"  
**When** 下次复习时间计算  
**Then** 间隔固定为60天  
**And** 不受评分系数影响（除非评分 < 3）  
**And** next_review_at = last_review_at + 60天

**验证方式:**

- 标记知识点为"已掌握"
- 验证下次复习时间为60天后
- 评分≥3时持续60天间隔

### AC6: 掌握状态反弹

**Given** 知识点已标记为"已掌握"  
**When** 用户复习时评分 < 3  
**Then** 重新标记为"学习中"(learning)  
**And** mastery_status = 'learning'  
**And** mastered_at = NULL  
**And** 间隔重新按标准流程计算

**And** 在知识点详情页移除"已掌握"徽章  
**And** 重新出现在常规复习任务中

**验证方式:**

- 标记知识点为"已掌握"
- 评分为1或2
- 验证状态重置
- 验证间隔重新计算

### AC7: 间隔调整可见性

**Given** 用户在知识点详情页  
**When** 页面加载  
**Then** 显示复习历史信息：

- 历史评分列表（评分、日期、间隔天数）
- 评分趋势图表（折线图）
- 间隔变化趋势（柱状图）
- 当前掌握状态

**And** 图表清晰直观  
**And** 数据准确无误

**验证方式:**

- 复习多次后查看详情页
- 验证图表数据正确性
- 验证趋势符合预期

### AC8: 算法准确性验证

**Given** 系统运行中  
**When** 进行大量复习操作  
**Then** 所有间隔计算100%准确  
**And** 无浮点数精度问题  
**And** 无负数间隔  
**And** 无异常间隔（如间隔 > 10年）

**验证方式:**

- 执行算法单元测试（41个测试用例）
- 手动验证10个随机知识点
- 边界情况测试

---

## 🔨 实现步骤（Tasks）

### Task 1: 验证算法逻辑完整性（验证和测试）

**估算时间:** 1小时  
**关联AC:** AC1, AC2, AC3, AC8

#### Subtask 1.1: 执行算法单元测试

**文件:** `src/main/algorithm/__tests__/SpacedRepetition.test.ts`

**验证步骤:**

1. 运行单元测试：`npm test SpacedRepetition`
2. 确认所有41个测试用例通过
3. 验证覆盖率100%
4. 检查评分系数计算准确性

**预期结果:**

- ✅ 测试通过率100%
- ✅ 覆盖率100%
- ✅ 无警告和错误

#### Subtask 1.2: 手动验证间隔计算

**创建测试场景:**

```typescript
// 测试脚本：verify-algorithm.ts
import { SpacedRepetitionAlgorithm } from './SpacedRepetition'

const algo = new SpacedRepetitionAlgorithm()
const now = Date.now()

// 场景1：连续评分1（忘记了）
console.log('场景1：连续忘记')
let nextReview = now
for (let i = 0; i < 5; i++) {
  nextReview = algo.calculateNextReview(nextReview, 1, i, 1.0)
  const days = (nextReview - now) / (24 * 60 * 60 * 1000)
  console.log(`第${i + 1}次复习，间隔：${days.toFixed(2)}天`)
}

// 场景2：连续评分5（非常熟悉）
console.log('\n场景2：连续熟悉')
nextReview = now
for (let i = 0; i < 5; i++) {
  nextReview = algo.calculateNextReview(nextReview, 5, i, 1.0)
  const days = (nextReview - now) / (24 * 60 * 60 * 1000)
  console.log(`第${i + 1}次复习，间隔：${days.toFixed(2)}天`)
}

// 场景3：评分波动（2, 3, 4, 5, 1）
console.log('\n场景3：评分波动')
const ratings = [2, 3, 4, 5, 1]
nextReview = now
for (let i = 0; i < ratings.length; i++) {
  nextReview = algo.calculateNextReview(nextReview, ratings[i], i, 1.0)
  const days = (nextReview - now) / (24 * 60 * 60 * 1000)
  console.log(`第${i + 1}次复习（评分${ratings[i]}），间隔：${days.toFixed(2)}天`)
}
```

**验证:**

- 间隔符合艾宾浩斯曲线
- 评分系数正确应用
- 无精度误差

---

### Task 2: 完善掌握标准判断逻辑（Service层完善）

**估算时间:** 1.5小时  
**关联AC:** AC4, AC5, AC6

#### Subtask 2.1: 扩展ReviewService掌握标准判断

**文件:** `src/main/services/ReviewService.ts`

**说明：** Story 3.2已实现基础checkMasteryStatus方法，本任务完善逻辑和长期抽查模式。

```typescript
/**
 * 检查是否达到记忆标准
 * 标准：至少5次复习 + 最近3次评分≥4 + 距离创建≥30天
 */
private checkMasteryStatus(knowledgeId: string): boolean {
  const knowledge = this.knowledgeRepo.findById(knowledgeId)
  if (!knowledge) return false

  // 1. 检查复习次数
  if (knowledge.reviewCount < 5) {
    log.debug('Mastery check failed: insufficient reviews', {
      knowledgeId,
      reviewCount: knowledge.reviewCount
    })
    return false
  }

  // 2. 检查距离创建时间
  const daysSinceCreation = (Date.now() - knowledge.createdAt) / (24 * 60 * 60 * 1000)
  if (daysSinceCreation < 30) {
    log.debug('Mastery check failed: too recent', {
      knowledgeId,
      daysSinceCreation: daysSinceCreation.toFixed(1)
    })
    return false
  }

  // 3. 检查最近3次评分
  const recentReviews = this.reviewRepo
    .findByKnowledgeId(knowledgeId, { limit: 3, order: 'DESC' })

  if (recentReviews.length < 3) {
    log.debug('Mastery check failed: insufficient recent reviews', {
      knowledgeId,
      count: recentReviews.length
    })
    return false
  }

  const allHighRating = recentReviews.every(r => r.rating >= 4)

  if (!allHighRating) {
    const ratings = recentReviews.map(r => r.rating)
    log.debug('Mastery check failed: low ratings', {
      knowledgeId,
      ratings
    })
    return false
  }

  log.info('Mastery achieved!', {
    knowledgeId,
    reviewCount: knowledge.reviewCount,
    daysSinceCreation: daysSinceCreation.toFixed(1),
    recentRatings: recentReviews.map(r => r.rating)
  })

  return true
}

/**
 * 应用长期抽查模式
 * 已掌握的知识点每60天复习一次
 */
private applyLongTermMode(currentTime: number): number {
  const LONG_TERM_INTERVAL_DAYS = 60
  return currentTime + (LONG_TERM_INTERVAL_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * 检查掌握状态反弹
 * 如果已掌握的知识点评分 < 3，重置为学习中
 */
private checkMasteryRebound(knowledgeId: string, rating: number): void {
  const knowledge = this.knowledgeRepo.findById(knowledgeId)
  if (!knowledge) return

  // 只有已掌握的知识点才需要检查反弹
  if (knowledge.masteryStatus !== 'mastered') return

  // 评分 < 3 触发反弹
  if (rating < 3) {
    log.warn('Mastery rebound detected!', { knowledgeId, rating })

    this.knowledgeRepo.update(knowledgeId, {
      masteryStatus: 'learning',
      masteredAt: null
    })

    log.info('Knowledge reset to learning status', { knowledgeId })
  }
}
```

#### Subtask 2.2: 修改processReviewRating集成掌握逻辑

**文件:** `src/main/services/ReviewService.ts`

```typescript
async processReviewRating(
  knowledgeId: string,
  rating: number,
  reviewedAt: number = Date.now()
): Promise<ReviewRatingResult> {
  const transaction = this.db.transaction(() => {
    const knowledge = this.knowledgeRepo.findById(knowledgeId)
    if (!knowledge) {
      throw new DatabaseError('Knowledge not found')
    }

    // 【新增】检查掌握状态反弹
    this.checkMasteryRebound(knowledgeId, rating)

    // 计算下次复习时间
    let nextReviewAt: number

    // 【修改】如果是已掌握状态且评分≥3，使用长期抽查模式
    if (knowledge.masteryStatus === 'mastered' && rating >= 3) {
      nextReviewAt = this.applyLongTermMode(reviewedAt)
      log.info('Applying long-term review mode', { knowledgeId, intervalDays: 60 })
    } else {
      // 标准算法计算
      nextReviewAt = this.algorithm.calculateNextReview(
        reviewedAt,
        rating,
        knowledge.reviewCount,
        knowledge.frequencyCoefficient || 1.0
      )
    }

    const intervalDays = (nextReviewAt - reviewedAt) / (24 * 60 * 60 * 1000)

    // 保存复习记录
    const reviewHistory = this.reviewRepo.saveReviewHistory({
      knowledgeId,
      rating,
      reviewedAt,
      nextReviewAt,
      intervalDays
    })

    // 更新知识点
    const updatedKnowledge = this.knowledgeRepo.updateAfterReview(
      knowledgeId,
      {
        nextReviewAt,
        lastReviewAt: reviewedAt,
        reviewCount: knowledge.reviewCount + 1
      }
    )

    // 【新增】检查是否达到掌握标准（仅对学习中的知识点）
    if (updatedKnowledge.masteryStatus !== 'mastered') {
      if (this.checkMasteryStatus(knowledgeId)) {
        this.knowledgeRepo.update(knowledgeId, {
          masteryStatus: 'mastered',
          masteredAt: Date.now(),
          // 重新计算下次复习时间为60天后
          nextReviewAt: this.applyLongTermMode(reviewedAt)
        })

        log.info('Knowledge marked as mastered', { knowledgeId })
      }
    }

    // 重新获取更新后的知识点
    const finalKnowledge = this.knowledgeRepo.findById(knowledgeId)!

    return {
      knowledge: finalKnowledge,
      nextReviewAt: finalKnowledge.nextReviewAt!,
      intervalDays: Math.round(intervalDays * 10) / 10,
      reviewHistory
    }
  })

  return transaction()
}
```

**验证:**

- 掌握标准判断正确
- 长期抽查模式生效
- 掌握状态反弹正常
- 事务处理正确

---

### Task 3: 扩展数据库Repository层（数据层）

**估算时间:** 1小时  
**关联AC:** AC4, AC6

#### Subtask 3.1: 扩展KnowledgeRepository添加掌握状态更新

**文件:** `src/main/database/repositories/KnowledgeRepository.ts`

```typescript
/**
 * 更新知识点掌握状态
 */
updateMasteryStatus(
  id: string,
  status: 'learning' | 'mastered',
  masteredAt: number | null = null
): Knowledge {
  const stmt = this.db.prepare(`
    UPDATE knowledge
    SET mastery_status = ?,
        mastered_at = ?,
        updated_at = ?
    WHERE id = ?
  `)

  stmt.run(status, masteredAt, Date.now(), id)

  const knowledge = this.findById(id)
  if (!knowledge) {
    throw new DatabaseError('Knowledge not found after mastery update')
  }

  log.info('Mastery status updated', { id, status, masteredAt })
  return knowledge
}

/**
 * 查询已掌握的知识点
 */
findMasteredKnowledge(): Knowledge[] {
  const stmt = this.db.prepare(`
    SELECT * FROM knowledge
    WHERE mastery_status = 'mastered'
    ORDER BY mastered_at DESC
  `)

  const rows = stmt.all()
  return rows.map(row => this.mapRowToKnowledge(row))
}

/**
 * 统计掌握数量和占比
 */
getMasteryStats(): {
  total: number
  mastered: number
  learning: number
  masteryRate: number
} {
  const totalStmt = this.db.prepare(`
    SELECT COUNT(*) as count FROM knowledge
  `)
  const masteredStmt = this.db.prepare(`
    SELECT COUNT(*) as count FROM knowledge WHERE mastery_status = 'mastered'
  `)

  const total = totalStmt.get().count || 0
  const mastered = masteredStmt.get().count || 0
  const learning = total - mastered
  const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0

  return { total, mastered, learning, masteryRate }
}
```

**验证:**

- SQL语句正确
- 数据更新成功
- 查询结果准确

---

### Task 4: UI可见性增强（UI层）

**估算时间:** 2小时  
**关联AC:** AC4, AC7

#### Subtask 4.1: 扩展KnowledgeDetailPage显示掌握状态

**文件:** `src/renderer/src/pages/KnowledgeDetailPage.tsx`

```typescript
import { Badge, Tag, Descriptions, Timeline, Space, Typography } from 'antd'
import { TrophyOutlined, LineChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const KnowledgeDetailPage: React.FC = () => {
  // 现有代码...
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([])

  useEffect(() => {
    // 加载复习历史
    const loadReviewHistory = async () => {
      if (id) {
        const response = await window.api.review.getHistoryByKnowledge(id)
        setReviewHistory(response.data)
      }
    }
    loadReviewHistory()
  }, [id])

  // 获取评分表情
  const getRatingEmoji = (rating: number): string => {
    const emojis = ['', '😟', '🤔', '😐', '😊', '🎯']
    return emojis[rating] || '❓'
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 标题和状态 */}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>
            {knowledge.title}
          </Title>

          {/* 【新增】掌握状态徽章 */}
          {knowledge.masteryStatus === 'mastered' && (
            <Badge.Ribbon text="已掌握" color="green">
              <Tag
                icon={<TrophyOutlined />}
                color="success"
                style={{ fontSize: '16px', padding: '8px 16px' }}
              >
                长期抽查模式（60天/次）
              </Tag>
            </Badge.Ribbon>
          )}
        </div>

        {/* 基础信息 */}
        <Descriptions bordered column={2}>
          <Descriptions.Item label="复习次数">{knowledge.reviewCount}次</Descriptions.Item>
          <Descriptions.Item label="下次复习">
            {knowledge.nextReviewAt
              ? dayjs(knowledge.nextReviewAt).format('YYYY-MM-DD HH:mm')
              : '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="最后复习">
            {knowledge.lastReviewAt
              ? dayjs(knowledge.lastReviewAt).format('YYYY-MM-DD HH:mm')
              : '从未复习'}
          </Descriptions.Item>
          <Descriptions.Item label="掌握状态">
            {knowledge.masteryStatus === 'mastered' ? (
              <Tag color="success">已掌握</Tag>
            ) : (
              <Tag color="processing">学习中</Tag>
            )}
          </Descriptions.Item>
          {knowledge.masteredAt && (
            <Descriptions.Item label="掌握时间" span={2}>
              {dayjs(knowledge.masteredAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* 【新增】复习历史时间轴 */}
        {reviewHistory.length > 0 && (
          <Card
            title={
              <Space>
                <LineChartOutlined />
                <span>复习历史</span>
              </Space>
            }
          >
            <Timeline>
              {reviewHistory.map((review, index) => (
                <Timeline.Item
                  key={review.id}
                  color={review.rating >= 4 ? 'green' : review.rating >= 3 ? 'blue' : 'red'}
                >
                  <Space direction="vertical" size="small">
                    <Text strong>
                      {getRatingEmoji(review.rating)} 评分：{review.rating}
                    </Text>
                    <Text type="secondary">
                      时间：{dayjs(review.reviewedAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    <Text type="secondary">
                      间隔：{review.intervalDays.toFixed(1)}天
                    </Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        )}

        {/* 现有内容... */}
      </Space>
    </div>
  )
}
```

**验证:**

- 掌握状态徽章正确显示
- 复习历史时间轴清晰
- 数据准确无误

#### Subtask 4.2: 添加IPC通道和处理器（获取复习历史）

**文件:** `src/common/ipc-channels.ts`

```typescript
export enum IpcChannels {
  // 现有通道...
  REVIEW_GET_HISTORY_BY_KNOWLEDGE = 'review:getHistoryByKnowledge'
}
```

**文件:** `src/main/ipc/reviewHandlers.ts`

```typescript
// 获取知识点的复习历史
ipcMain.handle(IpcChannels.REVIEW_GET_HISTORY_BY_KNOWLEDGE, async (event, knowledgeId: string) => {
  try {
    log.info('Fetching review history for knowledge', { knowledgeId })
    const reviewRepo = ReviewRepository.getInstance()
    const history = reviewRepo.findByKnowledgeId(knowledgeId, { order: 'DESC' })
    return { data: history }
  } catch (error) {
    log.error('Failed to fetch review history', { error, knowledgeId })
    throw error
  }
})
```

**文件:** `src/preload/index.ts`

```typescript
const api = {
  review: {
    // 现有方法...
    getHistoryByKnowledge: (knowledgeId: string) =>
      ipcRenderer.invoke(IpcChannels.REVIEW_GET_HISTORY_BY_KNOWLEDGE, knowledgeId)
  }
}
```

**验证:**

- IPC通道正确注册
- 数据正确返回

---

### Task 5: 数据迁移（数据库Schema扩展）

**估算时间:** 0.5小时  
**关联AC:** AC4

#### Subtask 5.1: 检查数据库Schema

**检查文件:** `src/main/database/migrations/001_initial_schema.ts`

**验证字段存在:**

```sql
-- knowledge表应该已包含以下字段
mastery_status TEXT DEFAULT 'learning' CHECK(mastery_status IN ('learning', 'mastered'))
mastered_at INTEGER
```

**如果字段不存在，创建迁移文件:**

**文件:** `src/main/database/migrations/003_add_mastery_fields.ts`（仅在需要时创建）

```typescript
import type { Database } from 'better-sqlite3'

export function up(db: Database): void {
  // 检查列是否存在
  const columns = db.prepare(`PRAGMA table_info(knowledge)`).all()
  const hasMasteryStatus = columns.some((col: any) => col.name === 'mastery_status')

  if (!hasMasteryStatus) {
    db.exec(`
      ALTER TABLE knowledge ADD COLUMN mastery_status TEXT DEFAULT 'learning' 
      CHECK(mastery_status IN ('learning', 'mastered'));
      
      ALTER TABLE knowledge ADD COLUMN mastered_at INTEGER;
    `)

    console.log('✅ Added mastery_status and mastered_at columns')
  } else {
    console.log('ℹ️ Mastery columns already exist, skipping migration')
  }
}

export function down(db: Database): void {
  // SQLite不支持DROP COLUMN，使用重建表的方式
  // 在开发环境中，可以简单忽略或重建数据库
  console.log('⚠️ Downgrade not supported for mastery columns')
}
```

**验证:**

- 迁移执行成功
- 字段默认值正确
- 约束条件生效

---

### Task 6: 手动测试和验证

**估算时间:** 1小时  
**关联AC:** 所有AC

#### Subtask 6.1: 功能测试清单

**测试场景1: 评分系数验证**

- [ ] 创建新知识点，复习并评分1，验证间隔缩短50%
- [ ] 评分2，验证间隔缩短30%
- [ ] 评分3，验证保持标准间隔
- [ ] 评分4，验证间隔延长20%
- [ ] 评分5，验证间隔延长50%
- [ ] 检查数据库next_review_at字段

**测试场景2: 掌握标准判断**

- [ ] 创建知识点，至少复习5次
- [ ] 最近3次评分设置为4、4、5
- [ ] 确保创建时间≥30天（修改created_at字段）
- [ ] 下次复习后验证自动标记为"已掌握"
- [ ] 检查mastery_status = 'mastered'
- [ ] 检查mastered_at有值
- [ ] 验证UI显示"已掌握"徽章

**测试场景3: 长期抽查模式**

- [ ] 标记知识点为"已掌握"
- [ ] 复习并评分≥3（如4或5）
- [ ] 验证下次复习时间为60天后
- [ ] 连续多次评分≥3，持续60天间隔

**测试场景4: 掌握状态反弹**

- [ ] 标记知识点为"已掌握"
- [ ] 复习并评分1或2
- [ ] 验证mastery_status重置为'learning'
- [ ] 验证mastered_at清空
- [ ] 验证间隔按标准流程重新计算
- [ ] 验证UI移除"已掌握"徽章

**测试场景5: UI可见性**

- [ ] 打开已掌握知识点的详情页
- [ ] 验证徽章显示
- [ ] 验证复习历史时间轴
- [ ] 验证评分趋势清晰
- [ ] 验证间隔数据准确

**测试场景6: 边界情况**

- [ ] 复习次数=4时不触发掌握判断
- [ ] 距离创建29天时不触发掌握判断
- [ ] 最近3次评分为3、4、5时不触发掌握判断（需要≥4）
- [ ] 间隔计算无负数
- [ ] 间隔计算无异常大值（> 1年）

**测试场景7: 算法单元测试**

- [ ] 运行：`npm test SpacedRepetition`
- [ ] 验证所有41个测试用例通过
- [ ] 验证覆盖率100%

---

## 📚 技术参考

### 已有依赖（无需新增）

- better-sqlite3: 数据库操作
- dayjs: 日期处理
- zustand: 状态管理
- antd: UI组件

### 关键API文档

- **Ant Design Components:**
  - Badge: https://ant.design/components/badge
  - Descriptions: https://ant.design/components/descriptions
  - Timeline: https://ant.design/components/timeline

---

## 🔍 代码审查要点

### 必须检查项

- [ ] **掌握标准逻辑正确**
  - 5次复习 + 3次高评分 + 30天
  - 所有条件必须同时满足
  - 日志记录完整

- [ ] **长期抽查模式准确**
  - 60天固定间隔
  - 仅对已掌握知识点生效
  - 评分<3时退出长期模式

- [ ] **掌握状态反弹处理**
  - 评分<3触发反弹
  - 状态正确重置
  - 间隔重新计算

- [ ] **事务处理完整**
  - 复习评分全流程使用事务
  - 掌握状态更新原子性
  - 错误回滚机制

- [ ] **UI数据准确性**
  - 复习历史数据正确
  - 时间轴显示清晰
  - 徽章状态同步

---

## 🚨 常见陷阱和注意事项

### 1. 掌握标准判断时机

**问题:** 在复习前判断导致条件不满足

**解决方案:**

```typescript
// ✅ 正确：在复习记录保存后、知识点更新后判断
if (updatedKnowledge.masteryStatus !== 'mastered') {
  if (this.checkMasteryStatus(knowledgeId)) {
    // 标记为已掌握
  }
}

// ❌ 错误：在复习前判断，reviewCount还未+1
if (this.checkMasteryStatus(knowledgeId)) {
  // 此时条件可能不满足
}
```

### 2. 长期抽查模式与评分系数冲突

**问题:** 长期抽查模式仍受评分系数影响

**解决方案:**

```typescript
// ✅ 正确：已掌握且评分≥3，直接使用60天
if (knowledge.masteryStatus === 'mastered' && rating >= 3) {
  nextReviewAt = this.applyLongTermMode(reviewedAt)
} else {
  // 标准算法
}

// ❌ 错误：长期模式仍应用评分系数
nextReviewAt = this.algorithm.calculateNextReview(...)
```

### 3. 掌握状态反弹后的间隔计算

**问题:** 反弹后间隔从头开始（1天）不合理

**解决方案:**

```typescript
// ✅ 正确：反弹后根据历史复习次数计算合适间隔
// 反弹时不重置reviewCount，算法会自动计算合理间隔

// ❌ 错误：反弹时重置reviewCount=0
this.knowledgeRepo.update(knowledgeId, {
  masteryStatus: 'learning',
  reviewCount: 0 // 不应重置
})
```

### 4. 数据库字段NULL值处理

**问题:** mastered_at字段未正确清空

**解决方案:**

```typescript
// ✅ 正确：显式设置为NULL
this.knowledgeRepo.update(knowledgeId, {
  masteryStatus: 'learning',
  masteredAt: null // 显式清空
})

// ❌ 错误：未清空mastered_at
this.knowledgeRepo.update(knowledgeId, {
  masteryStatus: 'learning'
  // mastered_at仍保留旧值
})
```

---

## ✅ Definition of Done (DoD)

### 代码完成

- [ ] 所有6个子任务的代码已实现（验证、Service层、Repository层、UI层、数据迁移、测试）
- [ ] TypeScript编译无错误和警告
- [ ] ESLint检查全部通过
- [ ] 代码已提交到版本控制

### 功能完成

- [ ] 所有8个验收标准（AC1-AC8）通过
- [ ] 手动测试清单全部完成（7个测试场景）
- [ ] 算法单元测试100%通过（41个测试用例）
- [ ] 在Windows环境测试通过
- [ ] 在macOS环境测试通过（如果可用）

### 测试完成

- [ ] 算法单元测试通过（Story 1.4）
- [ ] 掌握标准判断测试通过
- [ ] 长期抽查模式验证通过
- [ ] 掌握状态反弹测试通过
- [ ] 回归测试通过（Story 3.1-3.2功能不受影响）
- [ ] 边界情况测试（4次复习、29天、评分3等）

### 数据完整性

- [ ] review_history表正确记录
- [ ] knowledge表mastery_status正确更新
- [ ] knowledge表mastered_at正确设置/清空
- [ ] 间隔计算100%准确无误

### 文档完成

- [ ] 代码注释完整（掌握逻辑有详细说明）
- [ ] 算法验证脚本可执行
- [ ] README更新（如有说明）

### 集成完成

- [ ] 与Story 3.1-3.2正常集成
- [ ] 与Story 1.4算法正常集成
- [ ] UI显示与数据同步
- [ ] IPC通信正常

### 性能验证

- [ ] 掌握标准判断 < 50ms
- [ ] 间隔计算 < 10ms
- [ ] UI复习历史加载 < 200ms
- [ ] 内存占用正常

---

## 📝 实施注意事项

### 从之前Story学到的经验

1. **算法准确性（Story 1.4）**
   - 单元测试覆盖全面
   - 边界情况测试充分
   - 浮点数精度处理

2. **事务处理（Story 1.2、3.2）**
   - 复杂操作使用事务
   - 数据一致性保证
   - 错误回滚机制

3. **状态同步（Story 3.1-3.2）**
   - 数据库更新后刷新Store
   - UI实时反映状态变化
   - 异步操作错误处理

4. **日志记录（所有Story）**
   - 关键操作记录info日志
   - 判断逻辑记录debug日志
   - 异常情况记录error/warn日志

### 架构规则（必须遵守）

1. **数据库操作（强制）**
   - 复杂更新使用事务
   - 参数化查询
   - Repository层命名转换

2. **业务逻辑分层（强制）**
   - Service层：业务逻辑和判断
   - Repository层：数据库操作
   - Algorithm层：纯计算逻辑

3. **错误处理（强制）**
   - Service层方法有完整错误处理
   - 错误日志记录详细上下文
   - 用户友好的错误提示

---

## 🎯 后续Story准备

Story 3.3完成后，为Story 3.4-3.5准备的基础：

1. **掌握标准判断完整** - 提供智能复习优化基础
2. **长期抽查模式** - 减少复习负担，聚焦新知识
3. **算法验证通过** - 确保计算准确性100%
4. **UI可见性增强** - 用户可理解算法逻辑
5. **数据统计基础** - 可扩展更多分析维度

**下一步Story建议:**

- Story 3.4: 全局复习频率系数（用户自定义复习节奏）
- Story 3.5: 复习提醒和通知（系统托盘集成）

---

**预估总时间:** 6小时  
**建议实施顺序:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

**关键里程碑:**

- Task 1完成: 算法验证通过，确保准确性
- Task 2完成: 核心逻辑完成，可测试掌握标准
- Task 3完成: 数据层完成，可验证数据库操作
- Task 4完成: UI完成，用户可见掌握状态
- Task 6完成: 所有AC通过，Story完成

---

_本实施指南由SM Agent（Bob）生成，基于Epic 3定义、PRD需求、架构文档、Story 1.4算法实现、Story 3.1-3.2实现和项目上下文规则。_

**Story Status:** ready-for-dev  
**生成时间:** 2025-12-14  
**下一步:** 由Dev Agent执行 `dev-story` 工作流开始实施

---

**📋 Sprint Status更新建议:**

```yaml
- story_id: '3.3'
  title: '复习算法动态调整'
  epic: 'Epic 3'
  story_points: 8
  priority: 'P0'
  status: 'ready-for-dev'
  assignee: 'Dev Agent'
  dependencies: ['3.1', '3.2']
  implementation_guide: 'docs/stories/story-3.3-implementation-guide.md'
```





