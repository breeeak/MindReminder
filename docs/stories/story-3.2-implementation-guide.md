# Story 3.2 实现指南：复习流程和人性化评分

**Story ID:** 3.2  
**Story Title:** 复习流程和人性化评分  
**Epic:** Epic 3 - 智能复习系统  
**优先级:** P0  
**Story Points:** 8  
**预估时间:** 8小时  
**依赖:** Story 3.1 (今日复习任务列表)

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **通过简单的表情符号评估记忆程度**,  
So that **复习过程轻松愉快，不需要纠结数字评分**.

### 业务价值

- 提供直观友好的人性化评分系统，降低用户认知负担
- 实现流畅的复习流程（显示问题 → 显示答案 → 评分 → 下一题）
- 支持键盘快捷键，提升复习效率
- 复习完成后显示统计反馈，增强成就感
- 作为Epic 3的核心交互功能，直接影响用户复习体验

### 业务需求覆盖

- **FR12**: 5级人性化自评（😟🤔😐😊🎯）
- **FR13**: 根据评分动态调整复习间隔
- **FR17**: 复习完成情况反馈
- **NFR-U2**: 操作效率要求（评分 ≤ 2次点击）
- **NFR-U3**: 反馈及时性（≤ 100ms）

---

## 📐 技术设计

### 架构层次

```
UI层（Renderer）
├── ReviewSessionPage.tsx            # 【新增】复习会话页面
│   ├── ReviewCard.tsx               # 【新增】复习卡片组件
│   │   ├── QuestionView              # 问题显示视图
│   │   ├── AnswerView                # 答案显示视图
│   │   └── RatingSelector            # 评分选择器
│   └── ReviewCompletePage.tsx       # 【新增】复习完成页面
│
└── ReviewDashboardPage.tsx          # 【修改】添加进入复习会话功能

Store层（Zustand）
├── reviewStore.ts                   # 【扩展】添加复习会话状态
│   ├── currentSession                # 当前复习会话
│   │   ├── tasks: ReviewTask[]       # 会话任务列表
│   │   ├── currentIndex: number      # 当前题目索引
│   │   ├── showAnswer: boolean       # 是否显示答案
│   │   └── completedIds: string[]    # 已完成ID列表
│   ├── startReviewSession()          # 开始复习会话
│   ├── showAnswer()                  # 显示答案
│   ├── submitRating(rating)          # 提交评分
│   ├── nextReview()                  # 下一题
│   └── endSession()                  # 结束会话

IPC层
├── src/common/ipc-channels.ts       # 【扩展】添加复习评分通道
│   └── 'review:submitRating'         # 提交复习评分
│
└── src/main/ipc/reviewHandlers.ts   # 【扩展】添加评分处理器

Service层
└── ReviewService.ts                 # 【扩展】添加复习会话逻辑
    ├── processReviewRating()         # 处理复习评分
    │   ├── 保存复习记录
    │   ├── 调用算法计算下次时间
    │   └── 更新知识点状态
    └── getReviewSession()            # 获取复习会话数据

数据层
├── ReviewRepository.ts              # 【扩展】添加评分记录保存
│   └── saveReviewHistory()           # 保存复习历史
│
├── KnowledgeRepository.ts           # 【扩展】更新复习时间
│   └── updateAfterReview()           # 更新复习后的知识点
│
└── SpacedRepetitionAlgorithm.ts    # 【已有】从Story 1.4
    └── calculateNextReview()         # 计算下次复习时间
```

### 数据模型

```typescript
// 复习会话状态
interface ReviewSession {
  tasks: ReviewTask[] // 待复习任务列表
  currentIndex: number // 当前题目索引
  showAnswer: boolean // 是否显示答案
  completedIds: string[] // 已完成ID列表
  startTime: number // 会话开始时间
}

// 复习评分结果
interface ReviewRatingResult {
  knowledge: Knowledge // 更新后的知识点
  nextReviewAt: number // 下次复习时间
  intervalDays: number // 间隔天数
  reviewHistory: ReviewHistory // 本次复习记录
}

// 复习完成统计
interface ReviewSessionStats {
  totalCount: number // 总复习数量
  averageRating: number // 平均评分
  duration: number // 复习用时（秒）
  ratingDistribution: {
    // 评分分布
    rating1: number
    rating2: number
    rating3: number
    rating4: number
    rating5: number
  }
  nextReviewPreview: {
    // 下次复习预告
    tomorrow: number // 明天待复习数
    nextWeek: number // 下周待复习数
  }
}
```

### 复习流程数据流

```
用户点击ReviewTaskCard或"开始复习"按钮
    ↓
reviewStore.startReviewSession(tasks)
    ↓
初始化会话状态
├── currentIndex = 0
├── showAnswer = false
├── completedIds = []
└── startTime = Date.now()
    ↓
导航到 /review/session
    ↓
ReviewSessionPage渲染
    ↓
显示第一个知识点（问题模式）
├── 标题（问题）
├── 标签和分类
└── "显示答案"按钮

用户点击"显示答案"或按空格键
    ↓
reviewStore.showAnswer()
    ↓
set({ showAnswer: true })
    ↓
ReviewCard更新显示
├── 内容（Markdown渲染）
└── 评分选择器（5个表情）
    😟 🤔 😐 😊 🎯

用户点击表情或按数字键1-5
    ↓
reviewStore.submitRating(rating)
    ↓
IPC: 'review:submitRating'
├── knowledgeId
├── rating
└── reviewedAt
    ↓
主进程 reviewService.processReviewRating()
    ↓
并行操作：
├── 1. 调用算法计算下次时间
│   SpacedRepetitionAlgorithm.calculateNextReview()
│   ├── 基于当前复习次数
│   ├── 基于评分系数
│   └── 基于频率系数
│   返回: nextReviewAt
│
├── 2. 保存复习记录
│   ReviewRepository.saveReviewHistory()
│   ├── knowledgeId
│   ├── rating
│   ├── reviewedAt
│   └── nextReviewAt
│
└── 3. 更新知识点
    KnowledgeRepository.updateAfterReview()
    ├── nextReviewAt
    ├── lastReviewAt
    ├── reviewCount++
    └── 检查是否达到掌握标准

    ↓
返回 ReviewRatingResult
    ↓
渲染进程接收结果
    ↓
显示反馈动画 "✓ 已记录"
    ↓
等待500ms
    ↓
reviewStore.nextReview()
    ↓
currentIndex++
completedIds.push(knowledgeId)
showAnswer = false
    ↓
检查是否还有未完成任务
│
├── 是 → 显示下一个知识点（循环）
│
└── 否 → 结束会话
    reviewStore.endSession()
    ↓
    IPC: 'review:getSessionStats'
    计算会话统计
    ↓
    导航到 /review/complete
    显示ReviewCompletePage
    ├── 完成祝贺消息
    ├── 会话统计
    ├── 评分分布图表
    └── 下次复习预告
```

### 键盘快捷键映射

```typescript
// 全局快捷键（复习会话中）
const shortcuts = {
  ' ': () => showAnswer(), // 空格: 显示答案
  '1': () => submitRating(1), // 数字1: 😟 忘记了
  '2': () => submitRating(2), // 数字2: 🤔 记得一点
  '3': () => submitRating(3), // 数字3: 😐 记得一般
  '4': () => submitRating(4), // 数字4: 😊 记得还可以
  '5': () => submitRating(5), // 数字5: 🎯 非常熟悉
  Escape: () => confirmExitSession() // ESC: 退出会话（需确认）
}
```

---

## 🎯 验收标准（Acceptance Criteria）

### AC1: 复习界面全屏显示知识点标题（问题）

**Given** 用户点击待复习知识点进入复习流程  
**When** 复习界面加载  
**Then** 全屏显示知识点标题（问题形式）  
**And** 内容区域默认隐藏（显示为灰色遮罩或模糊）  
**And** 显示"显示答案"按钮（中央位置，突出显示）  
**And** 顶部显示进度指示器（如"3/10"）

**And** 界面简洁，无干扰元素  
**And** 标题字体大而清晰（至少24px）

### AC2: 点击"显示答案"展开内容和评分选项

**Given** 用户在问题显示状态  
**When** 用户点击"显示答案"按钮或按空格键  
**Then** 展开显示知识点内容  
**And** 内容支持Markdown渲染（代码高亮、列表、链接等）  
**And** 显示5个评分选项（表情符号大按钮）：

- 😟 忘记了（红色）
- 🤔 记得一点（橙色）
- 😐 记得一般（黄色）
- 😊 记得还可以（浅绿色）
- 🎯 非常熟悉（深绿色）

**And** 每个表情下方显示简短说明  
**And** 表情按钮大且易点击（≥ 80px）  
**And** "显示答案"按钮消失或置灰

### AC3: 选择评分后立即保存并进入下一题

**Given** 用户已显示答案  
**When** 用户选择评分（点击表情或按数字键1-5）  
**Then** 立即保存复习记录到数据库  
**And** 调用复习算法计算下次复习时间  
**And** 更新知识点的next_review_at字段  
**And** 显示简短反馈动画（如"✓ 已记录"，绿色对勾，持续500ms）  
**And** 自动进入下一个待复习知识点

**And** 整个流程响应时间 < 200ms  
**And** 界面过渡流畅（淡入淡出动画）

### AC4: 复习完成显示统计页面

**Given** 用户完成所有待复习知识点  
**When** 最后一个知识点评分完成  
**Then** 显示复习完成页面，包含：

- "今日复习完成！"庆祝消息（大标题）
- 今日复习统计：
  - 总复习数量
  - 平均评分（如"平均评分：😊 记得还可以"）
  - 复习用时（如"用时：15分钟"）
- 评分分布图表（柱状图或饼图）
- 下次复习时间预告（如"明天有5个知识点待复习"）
- "返回主页"按钮

**And** 页面设计友好，具有成就感  
**And** 统计数据准确无误

### AC5: 键盘快捷键支持

**Given** 用户在复习流程中  
**When** 用户按下键盘按键  
**Then** 执行对应操作：

- 空格键：显示答案
- 数字键1：评分为😟（忘记了）
- 数字键2：评分为🤔（记得一点）
- 数字键3：评分为😐（记得一般）
- 数字键4：评分为😊（记得还可以）
- 数字键5：评分为🎯（非常熟悉）
- ESC键：退出会话（需确认）

**And** 快捷键在答案显示后才可用（数字键1-5）  
**And** 快捷键提示显示在界面上（可选显隐）

### AC6: 复习进度实时反馈

**Given** 用户在复习会话中  
**When** 完成每个知识点评分  
**Then** 顶部进度指示器实时更新（如"4/10" → "5/10"）  
**And** 进度条百分比更新  
**And** 更新动画流畅

**And** 用户可随时看到剩余数量  
**And** 进度条颜色随完成度变化

### AC7: 退出会话确认和数据保存

**Given** 用户在复习会话中  
**When** 用户点击"退出"按钮或按ESC键  
**Then** 显示确认对话框："确定退出吗？当前进度将保存"  
**And** 用户确认后：

- 保存已完成的复习记录
- 未完成的知识点保留在今日任务中
- 返回今日复习主页

**And** 用户取消后：

- 继续当前复习会话
- 不丢失任何数据

### AC8: 响应式与性能要求

**Given** 用户在复习流程中  
**When** 执行各种操作  
**Then** 满足以下性能要求：

- 评分提交响应 < 200ms
- 界面切换动画 < 300ms
- 反馈提示显示 < 100ms
- Markdown渲染 < 200ms
- 键盘快捷键响应 < 50ms

**And** 长内容滚动流畅（60fps）  
**And** 内存占用正常，无泄漏

---

## 🔨 实现步骤（Tasks）

### Task 1: 扩展IPC通道和Service层（数据处理核心）

**估算时间:** 2小时  
**关联AC:** AC2, AC3, AC4

#### Subtask 1.1: 扩展IPC通道定义

**文件:** `src/common/ipc-channels.ts`

```typescript
export enum IpcChannels {
  // 现有通道...

  // 复习评分
  REVIEW_SUBMIT_RATING = 'review:submitRating',
  REVIEW_GET_SESSION_STATS = 'review:getSessionStats'
}
```

#### Subtask 1.2: 扩展ReviewService添加评分处理逻辑

**文件:** `src/main/services/ReviewService.ts`

```typescript
import { SpacedRepetitionAlgorithm } from '../algorithm/SpacedRepetition'
import type { ReviewRatingResult, ReviewSessionStats } from '@shared/types'

export class ReviewService {
  private algorithm: SpacedRepetitionAlgorithm

  constructor() {
    this.knowledgeRepo = KnowledgeRepository.getInstance()
    this.reviewRepo = ReviewRepository.getInstance()
    this.algorithm = new SpacedRepetitionAlgorithm()
  }

  /**
   * 处理复习评分
   */
  async processReviewRating(
    knowledgeId: string,
    rating: number,
    reviewedAt: number = Date.now()
  ): Promise<ReviewRatingResult> {
    const transaction = this.db.transaction(() => {
      // 1. 获取当前知识点
      const knowledge = this.knowledgeRepo.findById(knowledgeId)
      if (!knowledge) {
        throw new DatabaseError('Knowledge not found')
      }

      // 2. 调用算法计算下次复习时间
      const nextReviewAt = this.algorithm.calculateNextReview(
        reviewedAt,
        rating,
        knowledge.reviewCount,
        knowledge.frequencyCoefficient || 1.0
      )

      const intervalDays = (nextReviewAt - reviewedAt) / (24 * 60 * 60 * 1000)

      // 3. 保存复习记录
      const reviewHistory = this.reviewRepo.saveReviewHistory({
        knowledgeId,
        rating,
        reviewedAt,
        nextReviewAt,
        intervalDays
      })

      // 4. 更新知识点
      const updatedKnowledge = this.knowledgeRepo.updateAfterReview(knowledgeId, {
        nextReviewAt,
        lastReviewAt: reviewedAt,
        reviewCount: knowledge.reviewCount + 1
      })

      // 5. 检查是否达到掌握标准
      if (this.checkMasteryStatus(knowledgeId)) {
        updatedKnowledge.masteryStatus = 'mastered'
        updatedKnowledge.masteredAt = Date.now()
        this.knowledgeRepo.update(knowledgeId, updatedKnowledge)
      }

      return {
        knowledge: updatedKnowledge,
        nextReviewAt,
        intervalDays: Math.round(intervalDays * 10) / 10,
        reviewHistory
      }
    })

    const result = transaction()
    log.info('Review rating processed', {
      knowledgeId,
      rating,
      nextReviewAt: result.nextReviewAt
    })

    return result
  }

  /**
   * 检查是否达到记忆标准
   */
  private checkMasteryStatus(knowledgeId: string): boolean {
    const reviews = this.reviewRepo.findByKnowledgeId(knowledgeId, { limit: 5 })
    const knowledge = this.knowledgeRepo.findById(knowledgeId)

    // 记忆标准：至少复习5次，最近3次评分≥4，距离创建≥30天
    if (!knowledge || reviews.length < 5) {
      return false
    }

    const recentReviews = reviews.slice(0, 3)
    const allGoodRating = recentReviews.every((r) => r.rating >= 4)

    const daysSinceCreation = (Date.now() - knowledge.createdAt) / (24 * 60 * 60 * 1000)

    return allGoodRating && daysSinceCreation >= 30
  }

  /**
   * 获取会话统计
   */
  getSessionStats(completedIds: string[], startTime: number): ReviewSessionStats {
    const reviews = completedIds
      .map((id) => this.reviewRepo.findByKnowledgeId(id, { limit: 1 })[0])
      .filter(Boolean)

    const totalCount = reviews.length
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

    const duration = Math.round((Date.now() - startTime) / 1000)

    // 评分分布
    const ratingDistribution = {
      rating1: reviews.filter((r) => r.rating === 1).length,
      rating2: reviews.filter((r) => r.rating === 2).length,
      rating3: reviews.filter((r) => r.rating === 3).length,
      rating4: reviews.filter((r) => r.rating === 4).length,
      rating5: reviews.filter((r) => r.rating === 5).length
    }

    // 下次复习预告
    const tomorrow = dayjs().add(1, 'day')
    const nextWeek = dayjs().add(7, 'day')

    const allKnowledge = this.knowledgeRepo.findAll()
    const tomorrowTasks = allKnowledge.filter(
      (k) => k.nextReviewAt && dayjs(k.nextReviewAt).isSame(tomorrow, 'day')
    )
    const nextWeekTasks = allKnowledge.filter(
      (k) =>
        k.nextReviewAt &&
        dayjs(k.nextReviewAt).isBefore(nextWeek) &&
        dayjs(k.nextReviewAt).isAfter(tomorrow)
    )

    return {
      totalCount,
      averageRating: Math.round(averageRating * 10) / 10,
      duration,
      ratingDistribution,
      nextReviewPreview: {
        tomorrow: tomorrowTasks.length,
        nextWeek: nextWeekTasks.length
      }
    }
  }
}
```

**验证:**

- 事务处理正确
- 算法调用准确
- 掌握标准判断逻辑正确
- 统计计算准确

#### Subtask 1.3: 扩展reviewHandlers.ts添加评分处理器

**文件:** `src/main/ipc/reviewHandlers.ts`

```typescript
// 提交复习评分
ipcMain.handle(
  IpcChannels.REVIEW_SUBMIT_RATING,
  async (event, knowledgeId: string, rating: number, reviewedAt: number) => {
    try {
      log.info('Processing review rating', { knowledgeId, rating })
      const reviewService = ReviewService.getInstance()
      const result = await reviewService.processReviewRating(knowledgeId, rating, reviewedAt)
      return { data: result }
    } catch (error) {
      log.error('Failed to process review rating', { error, knowledgeId, rating })
      throw error
    }
  }
)

// 获取会话统计
ipcMain.handle(
  IpcChannels.REVIEW_GET_SESSION_STATS,
  async (event, completedIds: string[], startTime: number) => {
    try {
      log.info('Fetching review session stats', { count: completedIds.length })
      const reviewService = ReviewService.getInstance()
      const stats = reviewService.getSessionStats(completedIds, startTime)
      return { data: stats }
    } catch (error) {
      log.error('Failed to fetch session stats', { error })
      throw error
    }
  }
)
```

**验证:**

- 处理器正确注册
- 参数类型正确
- 错误处理完整

#### Subtask 1.4: 扩展Repository层方法

**文件:** `src/main/database/repositories/ReviewRepository.ts`

```typescript
// 保存复习历史记录
saveReviewHistory(data: {
  knowledgeId: string
  rating: number
  reviewedAt: number
  nextReviewAt: number
  intervalDays: number
}): ReviewHistory {
  const id = uuid()

  const stmt = this.db.prepare(`
    INSERT INTO review_history (
      id, knowledge_id, rating, reviewed_at, next_review_at, interval_days
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    data.knowledgeId,
    data.rating,
    data.reviewedAt,
    data.nextReviewAt,
    data.intervalDays
  )

  log.info('Review history saved', { id, knowledgeId: data.knowledgeId })

  return {
    id,
    knowledgeId: data.knowledgeId,
    rating: data.rating,
    reviewedAt: data.reviewedAt,
    nextReviewAt: data.nextReviewAt,
    intervalDays: data.intervalDays
  }
}
```

**文件:** `src/main/database/repositories/KnowledgeRepository.ts`

```typescript
// 复习后更新知识点
updateAfterReview(
  id: string,
  data: {
    nextReviewAt: number
    lastReviewAt: number
    reviewCount: number
  }
): Knowledge {
  const stmt = this.db.prepare(`
    UPDATE knowledge
    SET next_review_at = ?,
        last_review_at = ?,
        review_count = ?,
        updated_at = ?
    WHERE id = ?
  `)

  stmt.run(
    data.nextReviewAt,
    data.lastReviewAt,
    data.reviewCount,
    Date.now(),
    id
  )

  const knowledge = this.findById(id)
  if (!knowledge) {
    throw new DatabaseError('Knowledge not found after update')
  }

  return knowledge
}
```

**验证:**

- SQL语句正确
- 参数化查询
- 错误处理完整

---

### Task 2: 扩展Preload暴露API

**估算时间:** 0.5小时  
**关联AC:** AC2, AC3

#### Subtask 2.1: 扩展preload/index.ts

**文件:** `src/preload/index.ts`

```typescript
const api = {
  review: {
    // 现有方法...
    submitRating: (knowledgeId: string, rating: number, reviewedAt: number) =>
      ipcRenderer.invoke(IpcChannels.REVIEW_SUBMIT_RATING, knowledgeId, rating, reviewedAt),
    getSessionStats: (completedIds: string[], startTime: number) =>
      ipcRenderer.invoke(IpcChannels.REVIEW_GET_SESSION_STATS, completedIds, startTime)
  }
}
```

#### Subtask 2.2: 扩展类型定义

**文件:** `src/preload/index.d.ts`

```typescript
export interface ElectronAPI {
  review: {
    // 现有方法...
    submitRating: (
      knowledgeId: string,
      rating: number,
      reviewedAt: number
    ) => Promise<{ data: ReviewRatingResult }>
    getSessionStats: (
      completedIds: string[],
      startTime: number
    ) => Promise<{ data: ReviewSessionStats }>
  }
}
```

**验证:**

- TypeScript编译通过
- 类型定义完整

---

### Task 3: 扩展reviewStore添加会话状态管理

**估算时间:** 1.5小时  
**关联AC:** AC1, AC2, AC3, AC6

#### Subtask 3.1: 扩展reviewStore.ts

**文件:** `src/renderer/src/stores/reviewStore.ts`

```typescript
interface ReviewStore {
  // 现有状态...

  // 复习会话状态
  currentSession: ReviewSession | null
  sessionStats: ReviewSessionStats | null

  // 会话操作方法
  startReviewSession: (tasks: ReviewTask[]) => void
  showAnswer: () => void
  submitRating: (rating: number) => Promise<void>
  nextReview: () => void
  exitSession: () => void
  endSession: () => Promise<void>
}

export const useReviewStore = create<ReviewStore>()(
  devtools(
    (set, get) => ({
      // 现有状态...
      currentSession: null,
      sessionStats: null,

      // 开始复习会话
      startReviewSession: (tasks: ReviewTask[]) => {
        if (tasks.length === 0) {
          message.warning('没有待复习任务')
          return
        }

        set({
          currentSession: {
            tasks,
            currentIndex: 0,
            showAnswer: false,
            completedIds: [],
            startTime: Date.now()
          }
        })
      },

      // 显示答案
      showAnswer: () => {
        const session = get().currentSession
        if (!session) return

        set({
          currentSession: {
            ...session,
            showAnswer: true
          }
        })
      },

      // 提交评分
      submitRating: async (rating: number) => {
        const session = get().currentSession
        if (!session || !session.showAnswer) return

        const currentTask = session.tasks[session.currentIndex]
        if (!currentTask) return

        try {
          // 调用IPC提交评分
          await window.api.review.submitRating(currentTask.id, rating, Date.now())

          // 显示反馈动画
          message.success({
            content: '✓ 已记录',
            duration: 0.5
          })

          // 等待动画完成
          await new Promise((resolve) => setTimeout(resolve, 500))

          // 进入下一题
          get().nextReview()
        } catch (error) {
          console.error('Failed to submit rating:', error)
          message.error('评分失败，请重试')
        }
      },

      // 下一题
      nextReview: () => {
        const session = get().currentSession
        if (!session) return

        const currentTask = session.tasks[session.currentIndex]
        const newCompletedIds = [...session.completedIds, currentTask.id]
        const nextIndex = session.currentIndex + 1

        // 检查是否完成所有任务
        if (nextIndex >= session.tasks.length) {
          get().endSession()
          return
        }

        // 进入下一题
        set({
          currentSession: {
            ...session,
            currentIndex: nextIndex,
            showAnswer: false,
            completedIds: newCompletedIds
          }
        })
      },

      // 退出会话（不保存统计）
      exitSession: () => {
        set({ currentSession: null })
      },

      // 结束会话（保存统计）
      endSession: async () => {
        const session = get().currentSession
        if (!session) return

        try {
          // 获取会话统计
          const response = await window.api.review.getSessionStats(
            session.completedIds,
            session.startTime
          )

          set({
            sessionStats: response.data,
            currentSession: null
          })

          // 刷新今日任务和统计
          await Promise.all([get().fetchTodayReviews(), get().refreshReviewStats()])
        } catch (error) {
          console.error('Failed to end session:', error)
          message.error('结束会话失败')
        }
      }
    }),
    { name: 'ReviewStore' }
  )
)
```

**验证:**

- 会话状态正确管理
- 状态转换流畅
- 错误处理完整

---

### Task 4: 创建复习会话UI组件

**估算时间:** 3小时  
**关联AC:** AC1, AC2, AC3, AC5, AC6

#### Subtask 4.1: 创建ReviewSessionPage主页面

**文件:** `src/renderer/src/pages/ReviewSessionPage.tsx`

```typescript
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import { useReviewStore } from '../stores/reviewStore'
import ReviewCard from '../components/ReviewCard'

const ReviewSessionPage: React.FC = () => {
  const navigate = useNavigate()
  const currentSession = useReviewStore(state => state.currentSession)
  const exitSession = useReviewStore(state => state.exitSession)
  const sessionStats = useReviewStore(state => state.sessionStats)

  // 会话结束后导航到完成页面
  useEffect(() => {
    if (!currentSession && sessionStats) {
      navigate('/review/complete')
    }
  }, [currentSession, sessionStats, navigate])

  // 无会话时重定向
  useEffect(() => {
    if (!currentSession && !sessionStats) {
      navigate('/review')
    }
  }, [currentSession, sessionStats, navigate])

  // 退出确认
  const handleExit = () => {
    Modal.confirm({
      title: '确定退出吗？',
      content: '当前进度将保存，未完成的知识点将保留在今日任务中',
      onOk: () => {
        exitSession()
        navigate('/review')
      }
    })
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!currentSession) {
    return null
  }

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f5f5f5',
      position: 'relative'
    }}>
      <ReviewCard
        session={currentSession}
        onExit={handleExit}
      />
    </div>
  )
}

export default ReviewSessionPage
```

**验证:**

- 页面正确渲染
- 退出确认对话框正常
- 键盘ESC键功能正常
- 会话结束后正确跳转

#### Subtask 4.2: 创建ReviewCard复习卡片组件

**文件:** `src/renderer/src/components/ReviewCard.tsx`

```typescript
import React, { useEffect, useState } from 'react'
import { Card, Button, Progress, Space, Typography, Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { useReviewStore } from '../stores/reviewStore'
import RatingSelector from './RatingSelector'
import type { ReviewSession } from '../types'

const { Title, Text } = Typography

interface ReviewCardProps {
  session: ReviewSession
  onExit: () => void
}

const ReviewCard: React.FC<ReviewCardProps> = ({ session, onExit }) => {
  const showAnswer = useReviewStore(state => state.showAnswer)
  const currentTask = session.tasks[session.currentIndex]

  const progressPercent = ((session.currentIndex + 1) / session.tasks.length) * 100

  // 键盘快捷键（空格显示答案）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !session.showAnswer) {
        e.preventDefault()
        showAnswer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [session.showAnswer])

  if (!currentTask) {
    return null
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 顶部进度栏 */}
      <div style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ fontSize: '16px' }}>
              进度: {session.currentIndex + 1} / {session.tasks.length}
            </Text>
            <Button
              icon={<CloseOutlined />}
              onClick={onExit}
              type="text"
              danger
            >
              退出
            </Button>
          </div>
          <Progress
            percent={progressPercent}
            strokeColor="#52c41a"
            showInfo={false}
            strokeWidth={8}
          />
        </Space>
      </div>

      {/* 复习卡片 */}
      <Card
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px'
        }}
      >
        {/* 问题显示 */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ fontSize: '32px', marginBottom: '24px' }}>
            {currentTask.title}
          </Title>

          {/* 标签 */}
          <Space size="small" wrap>
            {currentTask.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {currentTask.categoryId && (
              <Tag color="blue">{currentTask.categoryId}</Tag>
            )}
          </Space>
        </div>

        {/* 答案区域 */}
        {!session.showAnswer ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            padding: '48px'
          }}>
            <Button
              type="primary"
              size="large"
              onClick={() => showAnswer()}
              style={{
                height: '60px',
                fontSize: '18px',
                padding: '0 48px'
              }}
            >
              显示答案（空格键）
            </Button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Markdown内容 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                backgroundColor: '#fafafa',
                borderRadius: '8px'
              }}
            >
              <ReactMarkdown>{currentTask.content || '无内容'}</ReactMarkdown>
            </div>

            {/* 评分选择器 */}
            <RatingSelector />
          </div>
        )}
      </Card>

      {/* 快捷键提示 */}
      {session.showAnswer && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">快捷键：数字 1-5 快速评分</Text>
        </div>
      )}
    </div>
  )
}

export default React.memo(ReviewCard)
```

**验证:**

- 问题/答案切换流畅
- 进度条正确更新
- 标签正确显示
- Markdown正确渲染
- 键盘空格键功能正常

#### Subtask 4.3: 创建RatingSelector评分选择器

**文件:** `src/renderer/src/components/RatingSelector.tsx`

```typescript
import React, { useEffect } from 'react'
import { Space, Button, Typography } from 'antd'
import { useReviewStore } from '../stores/reviewStore'

const { Text } = Typography

const ratings = [
  { value: 1, emoji: '😟', label: '忘记了', color: '#ff4d4f', shortcut: '1' },
  { value: 2, emoji: '🤔', label: '记得一点', color: '#fa8c16', shortcut: '2' },
  { value: 3, emoji: '😐', label: '记得一般', color: '#fadb14', shortcut: '3' },
  { value: 4, emoji: '😊', label: '记得还可以', color: '#a0d911', shortcut: '4' },
  { value: 5, emoji: '🎯', label: '非常熟悉', color: '#52c41a', shortcut: '5' },
]

const RatingSelector: React.FC = () => {
  const submitRating = useReviewStore(state => state.submitRating)

  // 键盘快捷键（数字1-5）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      if (['1', '2', '3', '4', '5'].includes(key)) {
        e.preventDefault()
        submitRating(Number(key))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div>
      <Text strong style={{ display: 'block', textAlign: 'center', marginBottom: '16px', fontSize: '16px' }}>
        记忆程度如何？
      </Text>
      <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
        {ratings.map(rating => (
          <Button
            key={rating.value}
            onClick={() => submitRating(rating.value)}
            style={{
              height: '100px',
              width: '100px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: rating.color,
              borderWidth: '2px'
            }}
            className="rating-button"
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>
              {rating.emoji}
            </div>
            <Text style={{ fontSize: '12px' }}>{rating.label}</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>({rating.shortcut})</Text>
          </Button>
        ))}
      </Space>
    </div>
  )
}

export default React.memo(RatingSelector)
```

**验证:**

- 表情按钮大且易点击
- 颜色区分明显
- 快捷键提示清晰
- 键盘数字键功能正常

---

### Task 5: 创建复习完成页面

**估算时间:** 1.5小时  
**关联AC:** AC4

#### Subtask 5.1: 创建ReviewCompletePage组件

**文件:** `src/renderer/src/pages/ReviewCompletePage.tsx`

```typescript
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Space, Typography, Row, Col, Statistic, Progress } from 'antd'
import { TrophyOutlined, HomeOutlined, RocketOutlined } from '@ant-design/icons'
import { useReviewStore } from '../stores/reviewStore'

const { Title, Text } = Typography

const ReviewCompletePage: React.FC = () => {
  const navigate = useNavigate()
  const sessionStats = useReviewStore(state => state.sessionStats)

  if (!sessionStats) {
    navigate('/review')
    return null
  }

  const getRatingEmoji = (avgRating: number): string => {
    if (avgRating >= 4.5) return '🎯'
    if (avgRating >= 3.5) return '😊'
    if (avgRating >= 2.5) return '😐'
    if (avgRating >= 1.5) return '🤔'
    return '😟'
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  return (
    <div style={{
      padding: '40px 20px',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 祝贺标题 */}
        <div style={{ textAlign: 'center' }}>
          <TrophyOutlined style={{ fontSize: '80px', color: '#faad14', marginBottom: '16px' }} />
          <Title level={1} style={{ marginBottom: '8px' }}>
            🎉 今日复习完成！
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            太棒了！坚持就是胜利！
          </Text>
        </div>

        {/* 统计卡片 */}
        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="复习数量"
                value={sessionStats.totalCount}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>

            <Col xs={24} sm={8}>
              <Statistic
                title="平均评分"
                value={sessionStats.averageRating}
                prefix={getRatingEmoji(sessionStats.averageRating)}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>

            <Col xs={24} sm={8}>
              <Statistic
                title="用时"
                value={formatDuration(sessionStats.duration)}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 评分分布 */}
        <Card title="评分分布">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {[
              { rating: 5, emoji: '🎯', label: '非常熟悉', count: sessionStats.ratingDistribution.rating5 },
              { rating: 4, emoji: '😊', label: '记得还可以', count: sessionStats.ratingDistribution.rating4 },
              { rating: 3, emoji: '😐', label: '记得一般', count: sessionStats.ratingDistribution.rating3 },
              { rating: 2, emoji: '🤔', label: '记得一点', count: sessionStats.ratingDistribution.rating2 },
              { rating: 1, emoji: '😟', label: '忘记了', count: sessionStats.ratingDistribution.rating1 },
            ].map(item => (
              <div key={item.rating} style={{ marginBottom: '12px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <Text>
                    {item.emoji} {item.label}: {item.count}个
                  </Text>
                </div>
                <Progress
                  percent={(item.count / sessionStats.totalCount) * 100}
                  showInfo={false}
                  strokeColor="#1890ff"
                />
              </div>
            ))}
          </Space>
        </Card>

        {/* 下次复习预告 */}
        <Card title="下次复习预告">
          <Space direction="vertical" size="small">
            <Text>
              📅 明天有 <Text strong style={{ color: '#1890ff' }}>{sessionStats.nextReviewPreview.tomorrow}</Text> 个知识点待复习
            </Text>
            <Text>
              📅 本周还有 <Text strong style={{ color: '#fa8c16' }}>{sessionStats.nextReviewPreview.nextWeek}</Text> 个知识点待复习
            </Text>
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate('/review')}
          >
            返回主页
          </Button>

          <Button
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate('/knowledge')}
          >
            浏览知识点
          </Button>
        </Space>
      </Space>
    </div>
  )
}

export default ReviewCompletePage
```

**验证:**

- 统计数据正确显示
- 评分分布图表清晰
- 下次复习预告准确
- 操作按钮功能正常

---

### Task 6: 集成复习流程到今日任务列表

**估算时间:** 0.5小时  
**关联AC:** AC1, AC5

#### Subtask 6.1: 修改ReviewDashboardPage添加开始复习按钮

**文件:** `src/renderer/src/pages/ReviewDashboardPage.tsx`

```typescript
// 在现有文件中添加

import { useNavigate } from 'react-router-dom'

const ReviewDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const todayReviews = useReviewStore(state => state.todayReviews)
  const startReviewSession = useReviewStore(state => state.startReviewSession)

  const handleStartReview = () => {
    if (todayReviews.length === 0) {
      message.info('没有待复习任务')
      return
    }

    startReviewSession(todayReviews)
    navigate('/review/session')
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ReviewSummaryCard stats={reviewStats} />

        {/* 开始复习按钮 */}
        {todayReviews.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleStartReview}
              style={{ height: '48px', padding: '0 48px', fontSize: '16px' }}
            >
              开始复习（{todayReviews.length}个任务）
            </Button>
          </div>
        )}

        <ReviewTaskList tasks={todayReviews} />
      </Space>
    </div>
  )
}
```

**验证:**

- 按钮正确显示
- 点击开始复习正常
- 任务数量正确

#### Subtask 6.2: 修改ReviewTaskCard点击行为

**文件:** `src/renderer/src/components/ReviewTaskCard.tsx`

```typescript
// 修改handleClick方法

const ReviewTaskCard: React.FC<ReviewTaskCardProps> = ({ task }) => {
  const navigate = useNavigate()
  const startReviewSession = useReviewStore((state) => state.startReviewSession)

  const handleClick = () => {
    // 点击卡片直接开始单个知识点的复习
    startReviewSession([task])
    navigate('/review/session')
  }

  // 其他代码...
}
```

**验证:**

- 点击卡片开始复习
- 单个知识点复习正常

---

### Task 7: 配置路由

**估算时间:** 0.5小时  
**关联AC:** AC1

#### Subtask 7.1: 添加复习会话路由

**文件:** `src/renderer/src/App.tsx` 或路由配置文件

```typescript
import ReviewSessionPage from './pages/ReviewSessionPage'
import ReviewCompletePage from './pages/ReviewCompletePage'

function App() {
  return (
    <Routes>
      {/* 现有路由... */}
      <Route path="/review" element={<ReviewDashboardPage />} />
      <Route path="/review/session" element={<ReviewSessionPage />} />
      <Route path="/review/complete" element={<ReviewCompletePage />} />
    </Routes>
  )
}
```

**验证:**

- 路由正确配置
- 页面可访问
- 导航正常

---

### Task 8: 手动测试和验证

**估算时间:** 1小时  
**关联AC:** 所有AC

#### Subtask 8.1: 功能测试清单

**测试场景1: 复习界面显示**

- [ ] 点击"开始复习"进入会话页面
- [ ] 问题全屏显示，字体大而清晰
- [ ] 内容默认隐藏
- [ ] "显示答案"按钮突出显示
- [ ] 进度指示器正确显示（1/10）

**测试场景2: 显示答案**

- [ ] 点击"显示答案"按钮展开内容
- [ ] 按空格键也可显示答案
- [ ] Markdown内容正确渲染（代码、列表、链接）
- [ ] 5个评分按钮正确显示
- [ ] 表情和说明清晰

**测试场景3: 评分提交**

- [ ] 点击表情提交评分
- [ ] 按数字键1-5提交评分
- [ ] 显示"✓ 已记录"反馈（持续500ms）
- [ ] 自动进入下一题
- [ ] 进度条更新

**测试场景4: 复习完成**

- [ ] 完成所有任务后跳转到完成页面
- [ ] 统计数据正确（数量、平均分、用时）
- [ ] 评分分布图表正确
- [ ] 下次复习预告准确
- [ ] "返回主页"按钮功能正常

**测试场景5: 键盘快捷键**

- [ ] 空格键显示答案
- [ ] 数字键1-5评分
- [ ] ESC键退出会话（需确认）
- [ ] 快捷键提示显示清晰

**测试场景6: 退出会话**

- [ ] 点击"退出"按钮显示确认对话框
- [ ] 确认后返回今日复习主页
- [ ] 已完成的任务已保存
- [ ] 未完成的任务保留在列表中

**测试场景7: 数据验证**

- [ ] 检查数据库review_history表有新记录
- [ ] 检查knowledge表next_review_at已更新
- [ ] 检查reviewCount已递增
- [ ] 复习间隔计算正确

**测试场景8: 性能测试**

- [ ] 评分提交响应 < 200ms
- [ ] 界面切换动画 < 300ms
- [ ] 反馈提示显示 < 100ms
- [ ] Markdown渲染 < 200ms
- [ ] 键盘快捷键响应 < 50ms

**测试场景9: 边界情况**

- [ ] 单个任务的复习流程
- [ ] 100个任务的复习流程
- [ ] 超长内容的Markdown渲染
- [ ] 快速连续按键（防止重复提交）

---

## 📚 技术参考

### 新增依赖库

```json
{
  "dependencies": {
    "react-markdown": "^9.x"
  }
}
```

### 安装命令

```bash
pnpm add react-markdown
```

### 关键API文档

- **react-markdown:**
  - GitHub: https://github.com/remarkjs/react-markdown
  - 语法: https://commonmark.org/help/

- **Ant Design Modal:**
  - Confirm: https://ant.design/components/modal#modalmethod

---

## 🔍 代码审查要点

### 必须检查项

- [ ] **事务处理正确**
  - reviewService.processReviewRating使用事务
  - 保存复习记录和更新知识点原子性

- [ ] **算法调用准确**
  - 参数传递正确（reviewCount、rating、coefficient）
  - 返回值处理正确

- [ ] **键盘事件管理**
  - useEffect正确清理事件监听器
  - 防止重复提交（按键防抖）

- [ ] **状态同步**
  - Store状态更新及时
  - 会话结束后刷新今日任务

- [ ] **UI动画流畅**
  - 反馈动画不阻塞主线程
  - 页面切换使用Transition

---

## 🚨 常见陷阱和注意事项

### 1. 键盘事件重复监听

**问题:** useEffect未清理导致事件重复触发

**解决方案:**

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    /* ... */
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown) // ✅ 清理
}, [dependencies])
```

### 2. 快速连续按键导致重复提交

**问题:** 用户快速按数字键可能提交多次

**解决方案:**

```typescript
// Store中添加提交中状态
submitting: boolean

// submitRating方法添加防护
if (get().submitting) return
set({ submitting: true })
try {
  // 提交逻辑...
} finally {
  set({ submitting: false })
}
```

### 3. 会话状态未清理

**问题:** 用户刷新页面后会话状态残留

**解决方案:**

```typescript
// ReviewSessionPage中检查会话有效性
useEffect(() => {
  if (!currentSession && !sessionStats) {
    navigate('/review') // ✅ 重定向到主页
  }
}, [])
```

### 4. Markdown渲染性能

**问题:** 超长内容渲染卡顿

**解决方案:**

```typescript
// 使用React.memo包装Markdown组件
const MarkdownContent = React.memo(({ content }: { content: string }) => (
  <ReactMarkdown>{content}</ReactMarkdown>
))
```

---

## ✅ Definition of Done (DoD)

### 代码完成

- [ ] 所有8个子任务的代码已实现
- [ ] TypeScript编译无错误和警告
- [ ] ESLint检查全部通过
- [ ] 代码已提交到版本控制

### 功能完成

- [ ] 所有8个验收标准（AC1-AC8）通过
- [ ] 手动测试清单全部完成（9个场景）
- [ ] 在Windows环境测试通过
- [ ] 在macOS环境测试通过（如果可用）

### 测试完成

- [ ] 核心功能手动测试完成
- [ ] 回归测试通过（Story 3.1功能不受影响）
- [ ] 性能测试通过（< 200ms评分，< 300ms切换）
- [ ] 边界情况测试（单任务、多任务、超长内容）

### 数据完整性

- [ ] review_history表正确记录
- [ ] knowledge表正确更新
- [ ] 复习算法计算准确
- [ ] 统计数据一致性验证

### 文档完成

- [ ] 代码注释完整（关键逻辑）
- [ ] 组件Props有JSDoc注释
- [ ] README更新（如有新依赖）

### 集成完成

- [ ] 与Story 3.1正常集成
- [ ] 与Story 1.4算法正常集成
- [ ] 路由配置正确
- [ ] Store状态管理正常

### 性能验证

- [ ] 评分提交 < 200ms
- [ ] 界面切换 < 300ms
- [ ] 反馈提示 < 100ms
- [ ] Markdown渲染 < 200ms
- [ ] 键盘响应 < 50ms
- [ ] 内存占用正常

---

## 📝 实施注意事项

### 从之前Story学到的经验

1. **事务处理（从Story 1.2）**
   - 复杂操作使用数据库事务
   - 保证数据一致性
   - 错误回滚机制

2. **算法调用（从Story 1.4）**
   - 参数传递准确
   - 测试覆盖全面
   - 边界情况处理

3. **Store状态管理（从Story 1.6）**
   - 异步操作loading状态
   - 错误处理完整
   - 选择性订阅优化

4. **UI组件设计（从Story 2.1）**
   - React.memo优化渲染
   - 动画流畅自然
   - 响应式布局

5. **键盘事件（新经验）**
   - 正确清理事件监听器
   - 防止重复触发
   - 快捷键冲突处理

### 架构规则（必须遵守）

1. **数据库操作（强制）**
   - 写操作必须使用事务
   - 参数化查询防SQL注入
   - Repository层处理命名转换

2. **错误处理（强制）**
   - 所有async操作有try-catch
   - 错误记录到日志
   - 用户友好错误提示

3. **性能要求（关键）**
   - UI响应 ≤ 200ms
   - 动画流畅 60fps
   - 避免阻塞主线程

4. **TypeScript严格模式（强制）**
   - 禁用`any`类型
   - 完整类型定义
   - 启用strictNullChecks

---

## 🎯 后续Story准备

Story 3.2完成后，为Story 3.3-3.5准备的基础：

1. **复习流程已实现** - 提供完整的复习体验
2. **评分系统已就绪** - 可用于算法优化和个性化
3. **会话统计框架** - 可扩展更多统计维度
4. **键盘快捷键基础** - 可扩展更多快捷操作
5. **复习算法已验证** - 确保计算准确性

**下一步Story建议:**

- Story 3.3: 复习算法动态调整（基于评分历史优化）
- Story 3.4: 全局复习频率系数（用户自定义复习节奏）
- Story 3.5: 复习提醒和通知（系统托盘集成）

---

**预估总时间:** 8小时  
**建议实施顺序:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8

**关键里程碑:**

- Task 1-2完成: 数据层完成，可测试评分处理
- Task 3完成: Store层完成，可测试会话管理
- Task 4完成: 核心UI完成，可进行复习流程测试
- Task 5完成: 完成页面完成，闭环验证
- Task 8完成: 所有AC通过，Story完成

---

_本实施指南由SM Agent（Bob）生成，基于Epic 3定义、PRD需求、架构文档、Story 3.1实现和项目上下文规则。_

**Story Status:** ready-for-dev  
**生成时间:** 2025-12-14  
**下一步:** 由Dev Agent执行 `dev-story` 工作流开始实施

---

**📋 Sprint Status更新建议:**

```yaml
- story_id: '3.2'
  title: '复习流程和人性化评分'
  epic: 'Epic 3'
  story_points: 8
  priority: 'P0'
  status: 'ready-for-dev'
  assignee: 'Dev Agent'
  dependencies: ['3.1']
  implementation_guide: 'docs/stories/story-3.2-implementation-guide.md'
```








