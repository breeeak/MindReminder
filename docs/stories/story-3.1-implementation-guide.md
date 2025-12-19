# Story 3.1 实现指南：今日复习任务列表

**Story ID:** 3.1  
**Story Title:** 今日复习任务列表  
**Epic:** Epic 3 - 智能复习系统  
**优先级:** P0  
**Story Points:** 5  
**预估时间:** 5小时  
**依赖:** Story 1.4 (复习算法), Story 2.1-2.4 (知识点管理基础)

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **查看今天需要复习的知识点**,  
So that **我可以合理安排学习时间，按计划完成复习**.

### 业务价值

- 提供清晰的今日复习任务视图，帮助用户聚焦当天学习内容
- 按优先级排序（超期 > 今日到期 > 提前复习），引导用户先处理重要任务
- 显示复习进度和统计，给予用户即时成就反馈
- 作为Epic 3复习系统的入口页面，为Story 3.2复习流程做准备

### 业务需求覆盖

- **FR11**: 查看当天待复习知识点列表
- **FR17**: 复习完成情况反馈（今日完成X个，剩余Y个）
- **FR18**: 手动标记某个知识点需要立即复习
- **NFR-U2**: 操作效率要求（快速访问复习任务）
- **NFR-P2**: 界面响应性能（≤200ms）

---

## 📐 技术设计

### 架构层次

```
UI层（Renderer）
├── ReviewDashboardPage.tsx          # 【新增】复习主页面
│   ├── ReviewSummaryCard.tsx        # 【新增】复习汇总卡片
│   ├── ReviewTaskList.tsx           # 【新增】复习任务列表
│   └── ReviewTaskCard.tsx           # 【新增】复习任务卡片组件
│
└── KnowledgeDetailPage.tsx          # 【修改】添加"立即复习"按钮

Store层（Zustand）
├── reviewStore.ts                   # 【新增】复习状态管理
│   ├── todayReviews: Knowledge[]    # 今日待复习列表
│   ├── reviewStats: ReviewStats     # 复习统计
│   ├── fetchTodayReviews()          # 获取今日任务
│   ├── markForImmediateReview(id)   # 标记立即复习
│   └── refreshReviewStats()         # 刷新统计
│
└── knowledgeStore.ts                # 【无需修改】已有

IPC层
├── src/common/ipc-channels.ts       # 【扩展】添加复习相关通道
│   ├── 'review:getTodayTasks'       # 获取今日复习任务
│   ├── 'review:getStats'            # 获取复习统计
│   └── 'knowledge:markForReview'    # 标记立即复习
│
└── src/main/ipc/reviewHandlers.ts   # 【扩展】添加今日任务处理器

数据层
├── ReviewRepository.ts              # 【已有】从Story 1.3
│   ├── findDueReviews(date)         # 查询到期复习（已有）
│   └── getReviewStats()             # 【扩展】获取统计
│
└── KnowledgeRepository.ts           # 【扩展】添加立即复习标记
    └── markForImmediateReview(id)   # 更新next_review_at为当前时间
```

### 数据模型（已有，扩展类型定义）

```typescript
// 复习任务（基于Knowledge，添加优先级信息）
interface ReviewTask extends Knowledge {
  priority: 'overdue' | 'due_today' | 'advance' // 优先级
  daysOverdue?: number // 超期天数
  dueTime: number // 到期时间（用于排序）
}

// 复习统计
interface ReviewStats {
  todayTotal: number // 今日待复习总数
  todayCompleted: number // 今日已完成数
  todayRemaining: number // 今日剩余数
  overdueCount: number // 超期数量
  completionRate: number // 完成率（百分比）
}
```

### 数据流

```
应用启动 / 用户点击"今日复习"
    ↓
ReviewDashboardPage组件挂载
    ↓
useEffect触发
    ↓
reviewStore.fetchTodayReviews()
reviewStore.refreshReviewStats()
    ↓
并行IPC调用
├── IPC: 'review:getTodayTasks'
│   ↓
│   ReviewRepository.findDueReviews(today)
│   KnowledgeRepository.findByIds()
│   ↓
│   计算优先级（超期/今日/提前）
│   按优先级排序
│   ↓
│   返回ReviewTask[]
│
└── IPC: 'review:getStats'
    ↓
    ReviewRepository.getReviewStats()
    ↓
    返回ReviewStats

    ↓
Store更新状态
    ↓
UI重新渲染
├── ReviewSummaryCard显示统计
│   ├── 今日待复习总数
│   ├── 已完成数量
│   ├── 剩余数量
│   └── 完成进度条
│
└── ReviewTaskList显示任务
    ├── 超期任务（红色标记）
    ├── 今日到期任务
    └── 提前复习任务

用户点击"立即复习"（在详情页）
    ↓
reviewStore.markForImmediateReview(id)
    ↓
IPC: 'knowledge:markForReview'
    ↓
KnowledgeRepository.updateNextReview(id, now)
    ↓
更新next_review_at为当前时间
    ↓
返回更新后的Knowledge对象
    ↓
Store刷新今日任务列表
    ↓
UI更新，该知识点出现在今日任务中
```

---

## 🎯 验收标准（Acceptance Criteria）

### AC1: 今日复习任务列表显示

**Given** 应用已启动  
**When** 用户打开应用或切换到"今日复习"视图  
**Then** 显示今日待复习知识点列表  
**And** 列表按优先级排序（超期 > 今日到期 > 提前复习）  
**And** 每个卡片显示：

- 知识点标题（问题形式）
- 标签
- 计划复习时间
- 已复习次数

**And** 列表加载时间 < 300ms  
**And** 超期任务优先显示在最上方

### AC2: 复习汇总信息显示

**Given** 用户在"今日复习"视图  
**When** 页面渲染完成  
**Then** 显示汇总信息卡片：

- 今日待复习总数（大字体突出显示）
- 已完成数量
- 剩余数量
- 完成进度条（百分比）

**And** 进度条颜色根据完成率动态变化：

- 0-30%: 红色
- 30-70%: 橙色
- 70-100%: 绿色

**And** 统计数据实时更新

### AC3: 超期知识点标记

**Given** 列表中有超期未复习的知识点  
**When** 页面渲染  
**Then** 这些知识点标记为红色（Card边框或背景色）  
**And** 显示超期天数（如"超期2天"）  
**And** 卡片上显示"紧急"标签

**And** 超期知识点始终排在列表最前面

### AC4: 无复习任务时的显示

**Given** 今日无待复习知识点  
**When** 用户打开"今日复习"视图  
**Then** 显示空状态：

- 图标提示（如🎉庆祝图标）
- 文字："今日无复习任务，干得好！"
- 鼓励消息："保持学习习惯，明天见！"
- 显示下次复习时间预告（如"明天有3个知识点待复习"）

**And** 空状态设计友好，不显示空白列表  
**And** 提供"浏览所有知识点"按钮

### AC5: 点击知识点卡片进入复习流程

**Given** 用户在"今日复习"列表  
**When** 用户点击知识点卡片  
**Then** 进入复习流程（Story 3.2实现）

**And** 在Story 3.2未实现前，点击显示"复习功能即将上线"提示  
**And** 提供"查看详情"作为临时替代操作

### AC6: 手动标记立即复习

**Given** 用户在知识点详情页  
**When** 用户点击"立即复习"按钮  
**Then** 将该知识点标记为今日待复习  
**And** 更新数据库中的next_review_at为当前时间  
**And** 显示"已加入今日复习任务"提示  
**And** 跳转到"今日复习"视图

**And** 该知识点出现在今日任务列表中  
**And** 优先级为"提前复习"

### AC7: 复习进度实时反馈

**Given** 用户在"今日复习"视图  
**When** 用户完成一次复习（Story 3.2功能）  
**Then** 汇总卡片实时更新：

- 已完成数量 +1
- 剩余数量 -1
- 进度条前进
- 列表中移除已完成的知识点

**And** 所有更新响应时间 < 100ms  
**And** 更新动画流畅（淡出效果）

### AC8: 响应式与性能要求

**Given** 用户在"今日复习"视图  
**When** 执行各种操作  
**Then** 满足以下性能要求：

- 页面首次加载 < 300ms
- 任务列表渲染 < 200ms
- 统计数据刷新 < 100ms
- 页面滚动流畅（60fps）

**And** 100+条待复习任务时使用虚拟滚动  
**And** 超期计算不阻塞UI渲染

---

## 🔨 实现步骤（Tasks）

### Task 1: 扩展复习相关IPC通道和处理器（数据层和IPC层）

**估算时间:** 1小时  
**关联AC:** AC1, AC2, AC6

#### Subtask 1.1: 扩展IPC通道定义

**文件:** `src/common/ipc-channels.ts`

```typescript
export enum IpcChannels {
  // 现有通道...

  // 复习任务
  REVIEW_GET_TODAY_TASKS = 'review:getTodayTasks',
  REVIEW_GET_STATS = 'review:getStats',

  // 知识点操作
  KNOWLEDGE_MARK_FOR_REVIEW = 'knowledge:markForReview'
}
```

**验证:**

- TypeScript编译通过
- 通道命名符合规范（`{实体}:{操作}`）

#### Subtask 1.2: 扩展ReviewRepository查询方法

**文件:** `src/main/database/repositories/ReviewRepository.ts`

```typescript
// 查找今日到期的知识点ID列表
findDueKnowledgeIds(targetDate: number = Date.now()): string[] {
  const stmt = this.db.prepare(`
    SELECT DISTINCT k.id
    FROM knowledge k
    WHERE k.next_review_at <= ?
      AND k.next_review_at IS NOT NULL
    ORDER BY k.next_review_at ASC
  `)

  const rows = stmt.all(targetDate)
  return rows.map(row => row.id)
}

// 获取今日复习统计
getReviewStats(targetDate: number = Date.now()): ReviewStats {
  const startOfDay = dayjs(targetDate).startOf('day').valueOf()
  const endOfDay = dayjs(targetDate).endOf('day').valueOf()

  // 今日待复习总数（next_review_at <= 今天结束）
  const todayTotalStmt = this.db.prepare(`
    SELECT COUNT(*) as count
    FROM knowledge
    WHERE next_review_at <= ?
      AND next_review_at IS NOT NULL
  `)
  const todayTotal = todayTotalStmt.get(endOfDay).count || 0

  // 今日已完成数（reviewed_at在今天）
  const todayCompletedStmt = this.db.prepare(`
    SELECT COUNT(DISTINCT knowledge_id) as count
    FROM review_history
    WHERE reviewed_at >= ? AND reviewed_at <= ?
  `)
  const todayCompleted = todayCompletedStmt.get(startOfDay, endOfDay).count || 0

  // 超期数量（next_review_at < 今天开始）
  const overdueStmt = this.db.prepare(`
    SELECT COUNT(*) as count
    FROM knowledge
    WHERE next_review_at < ?
      AND next_review_at IS NOT NULL
  `)
  const overdueCount = overdueStmt.get(startOfDay).count || 0

  const todayRemaining = todayTotal - todayCompleted
  const completionRate = todayTotal > 0
    ? Math.round((todayCompleted / todayTotal) * 100)
    : 0

  return {
    todayTotal,
    todayCompleted,
    todayRemaining: Math.max(0, todayRemaining),
    overdueCount,
    completionRate
  }
}
```

**验证:**

- SQL查询正确（使用参数化）
- 日期计算准确（使用dayjs）
- 统计数据逻辑正确

#### Subtask 1.3: 扩展KnowledgeRepository添加立即复习标记

**文件:** `src/main/database/repositories/KnowledgeRepository.ts`

```typescript
// 标记知识点为立即复习
markForImmediateReview(id: string): Knowledge {
  const now = Date.now()

  const transaction = this.db.transaction(() => {
    const stmt = this.db.prepare(`
      UPDATE knowledge
      SET next_review_at = ?, updated_at = ?
      WHERE id = ?
    `)
    stmt.run(now, now, id)

    const knowledge = this.findById(id)
    if (!knowledge) {
      throw new DatabaseError('Knowledge not found after update')
    }

    return knowledge
  })

  const result = transaction()
  log.info('Knowledge marked for immediate review', { id, next_review_at: now })
  return result
}
```

**验证:**

- 事务处理正确
- 更新成功返回Knowledge对象
- 日志记录完整

#### Subtask 1.4: 创建今日任务服务层逻辑

**文件:** `src/main/services/ReviewService.ts`（新增或扩展）

```typescript
import { KnowledgeRepository } from '../database/repositories/KnowledgeRepository'
import { ReviewRepository } from '../database/repositories/ReviewRepository'
import dayjs from 'dayjs'
import type { Knowledge, ReviewTask } from '@shared/types'

export class ReviewService {
  private knowledgeRepo: KnowledgeRepository
  private reviewRepo: ReviewRepository

  constructor() {
    this.knowledgeRepo = KnowledgeRepository.getInstance()
    this.reviewRepo = ReviewRepository.getInstance()
  }

  /**
   * 获取今日复习任务列表
   */
  getTodayReviewTasks(): ReviewTask[] {
    const now = Date.now()
    const startOfDay = dayjs(now).startOf('day').valueOf()

    // 获取到期知识点ID
    const dueIds = this.reviewRepo.findDueKnowledgeIds(now)

    if (dueIds.length === 0) {
      return []
    }

    // 批量获取知识点详情
    const knowledges = dueIds
      .map((id) => this.knowledgeRepo.findById(id))
      .filter((k): k is Knowledge => k !== null)

    // 转换为ReviewTask并计算优先级
    const tasks: ReviewTask[] = knowledges.map((k) => {
      const nextReview = k.nextReviewAt || now
      const daysOverdue =
        nextReview < startOfDay ? Math.ceil((startOfDay - nextReview) / (24 * 60 * 60 * 1000)) : 0

      let priority: 'overdue' | 'due_today' | 'advance'
      if (nextReview < startOfDay) {
        priority = 'overdue'
      } else if (nextReview <= dayjs(now).endOf('day').valueOf()) {
        priority = 'due_today'
      } else {
        priority = 'advance'
      }

      return {
        ...k,
        priority,
        daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
        dueTime: nextReview
      }
    })

    // 排序：超期 > 今日到期 > 提前复习，同级别按时间排序
    tasks.sort((a, b) => {
      const priorityOrder = { overdue: 0, due_today: 1, advance: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.dueTime - b.dueTime
    })

    return tasks
  }

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService()
    }
    return ReviewService.instance
  }

  private static instance: ReviewService
}
```

**验证:**

- 优先级计算正确
- 排序逻辑准确
- 超期天数计算正确
- 单例模式实现

#### Subtask 1.5: 扩展reviewHandlers.ts添加今日任务处理器

**文件:** `src/main/ipc/reviewHandlers.ts`

```typescript
import { ipcMain } from 'electron'
import { IpcChannels } from '../../common/ipc-channels'
import { ReviewService } from '../services/ReviewService'
import { ReviewRepository } from '../database/repositories'
import log from '../utils/logger'

export function registerReviewHandlers() {
  const reviewService = ReviewService.getInstance()
  const reviewRepo = ReviewRepository.getInstance()

  // 获取今日复习任务列表
  ipcMain.handle(IpcChannels.REVIEW_GET_TODAY_TASKS, async (event) => {
    try {
      log.info('Fetching today review tasks')
      const tasks = reviewService.getTodayReviewTasks()
      log.info('Today review tasks fetched', { count: tasks.length })
      return { data: tasks }
    } catch (error) {
      log.error('Failed to fetch today review tasks', { error })
      throw error
    }
  })

  // 获取复习统计
  ipcMain.handle(IpcChannels.REVIEW_GET_STATS, async (event) => {
    try {
      log.info('Fetching review statistics')
      const stats = reviewRepo.getReviewStats()
      return { data: stats }
    } catch (error) {
      log.error('Failed to fetch review statistics', { error })
      throw error
    }
  })

  log.info('Review IPC handlers registered')
}
```

**验证:**

- 处理器正确注册
- 错误处理完整
- 日志记录规范
- 返回格式符合`{ data: T }`

#### Subtask 1.6: 扩展knowledgeHandlers.ts添加立即复习标记

**文件:** `src/main/ipc/knowledgeHandlers.ts`

```typescript
// 添加到现有文件

// 标记知识点为立即复习
ipcMain.handle(IpcChannels.KNOWLEDGE_MARK_FOR_REVIEW, async (event, id: string) => {
  try {
    log.info('Marking knowledge for immediate review', { id })
    const knowledgeRepo = KnowledgeRepository.getInstance()
    const knowledge = knowledgeRepo.markForImmediateReview(id)
    return { data: knowledge }
  } catch (error) {
    log.error('Failed to mark knowledge for review', { error, id })
    throw error
  }
})
```

**验证:**

- 处理器正确实现
- 错误处理完整
- 返回更新后的Knowledge对象

---

### Task 2: 扩展Preload暴露API（Preload层）

**估算时间:** 0.5小时  
**关联AC:** AC1, AC2, AC6

#### Subtask 2.1: 扩展preload/index.ts

**文件:** `src/preload/index.ts`

```typescript
// 在contextBridge.exposeInMainWorld中添加

const api = {
  knowledge: {
    // 现有方法...
    markForReview: (id: string) => ipcRenderer.invoke(IpcChannels.KNOWLEDGE_MARK_FOR_REVIEW, id)
  },

  review: {
    // 现有方法（从Story 2.4）...
    getTodayTasks: () => ipcRenderer.invoke(IpcChannels.REVIEW_GET_TODAY_TASKS),
    getStats: () => ipcRenderer.invoke(IpcChannels.REVIEW_GET_STATS)
  }
}

contextBridge.exposeInMainWorld('api', api)
```

#### Subtask 2.2: 扩展TypeScript类型定义

**文件:** `src/preload/index.d.ts`

```typescript
// 添加ReviewTask和ReviewStats类型
import type { Knowledge, ReviewTask, ReviewStats } from '@shared/types'

export interface ElectronAPI {
  knowledge: {
    // 现有方法...
    markForReview: (id: string) => Promise<{ data: Knowledge }>
  }

  review: {
    // 现有方法（从Story 2.4）...
    getTodayTasks: () => Promise<{ data: ReviewTask[] }>
    getStats: () => Promise<{ data: ReviewStats }>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
```

**验证:**

- TypeScript类型检查通过
- 渲染进程可正确访问`window.api`

---

### Task 3: 创建reviewStore状态管理（状态管理层）

**估算时间:** 1小时  
**关联AC:** AC1, AC2, AC6, AC7

#### Subtask 3.1: 创建reviewStore.ts

**文件:** `src/renderer/src/stores/reviewStore.ts`

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ReviewTask, ReviewStats } from '../types'
import { message } from 'antd'

interface ReviewStore {
  // 今日复习任务
  todayReviews: ReviewTask[]
  reviewStats: ReviewStats | null
  loading: boolean
  error: Error | null

  // 操作方法
  fetchTodayReviews: () => Promise<void>
  refreshReviewStats: () => Promise<void>
  markForImmediateReview: (id: string) => Promise<void>
  clearReviewData: () => void
}

export const useReviewStore = create<ReviewStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      todayReviews: [],
      reviewStats: null,
      loading: false,
      error: null,

      // 获取今日复习任务
      fetchTodayReviews: async () => {
        set({ loading: true, error: null })
        try {
          const response = await window.api.review.getTodayTasks()
          set({
            todayReviews: response.data,
            loading: false
          })
        } catch (error) {
          console.error('Failed to fetch today reviews:', error)
          set({
            error: error as Error,
            loading: false
          })
          throw error
        }
      },

      // 刷新复习统计
      refreshReviewStats: async () => {
        try {
          const response = await window.api.review.getStats()
          set({ reviewStats: response.data })
        } catch (error) {
          console.error('Failed to refresh review stats:', error)
          throw error
        }
      },

      // 标记知识点为立即复习
      markForImmediateReview: async (id: string) => {
        try {
          await window.api.knowledge.markForReview(id)

          // 刷新今日任务列表和统计
          await Promise.all([get().fetchTodayReviews(), get().refreshReviewStats()])

          message.success('已加入今日复习任务')
        } catch (error) {
          console.error('Failed to mark for immediate review:', error)
          message.error('标记失败，请重试')
          throw error
        }
      },

      // 清除复习数据
      clearReviewData: () => {
        set({
          todayReviews: [],
          reviewStats: null,
          error: null
        })
      }
    }),
    { name: 'ReviewStore' }
  )
)
```

**验证:**

- Store状态正确初始化
- 异步操作错误处理完整
- 选择性订阅支持
- DevTools集成正常

---

### Task 4: 创建复习主页UI组件（UI层）

**估算时间:** 2小时  
**关联AC:** AC1, AC2, AC3, AC4, AC5, AC7

#### Subtask 4.1: 创建ReviewDashboardPage主页面

**文件:** `src/renderer/src/pages/ReviewDashboardPage.tsx`

```typescript
import React, { useEffect } from 'react'
import { Space, Spin, Alert } from 'antd'
import { useReviewStore } from '../stores/reviewStore'
import ReviewSummaryCard from '../components/ReviewSummaryCard'
import ReviewTaskList from '../components/ReviewTaskList'

const ReviewDashboardPage: React.FC = () => {
  const todayReviews = useReviewStore(state => state.todayReviews)
  const reviewStats = useReviewStore(state => state.reviewStats)
  const loading = useReviewStore(state => state.loading)
  const error = useReviewStore(state => state.error)

  const fetchTodayReviews = useReviewStore(state => state.fetchTodayReviews)
  const refreshReviewStats = useReviewStore(state => state.refreshReviewStats)
  const clearReviewData = useReviewStore(state => state.clearReviewData)

  useEffect(() => {
    // 加载今日任务和统计
    fetchTodayReviews()
    refreshReviewStats()

    return () => {
      clearReviewData()
    }
  }, [])

  if (loading && !todayReviews.length) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载今日复习任务..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="加载失败"
          description={error.message}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => fetchTodayReviews()}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 复习汇总卡片 */}
        <ReviewSummaryCard stats={reviewStats} />

        {/* 复习任务列表 */}
        <ReviewTaskList tasks={todayReviews} />
      </Space>
    </div>
  )
}

export default ReviewDashboardPage
```

**验证:**

- 页面正确加载数据
- 加载状态显示正确
- 错误处理友好
- 组件正确解耦

#### Subtask 4.2: 创建ReviewSummaryCard组件

**文件:** `src/renderer/src/components/ReviewSummaryCard.tsx`

```typescript
import React from 'react'
import { Card, Row, Col, Statistic, Progress, Space, Typography } from 'antd'
import {
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import type { ReviewStats } from '../types'

const { Text } = Typography

interface ReviewSummaryCardProps {
  stats: ReviewStats | null
}

const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({ stats }) => {
  if (!stats) {
    return null
  }

  // 根据完成率确定进度条颜色
  const getProgressColor = (rate: number) => {
    if (rate >= 70) return '#52c41a'  // 绿色
    if (rate >= 30) return '#fa8c16'  // 橙色
    return '#ff4d4f'                   // 红色
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Text strong style={{ fontSize: '18px' }}>今日复习任务</Text>
        </div>

        {/* 统计数据 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Statistic
              title="待复习总数"
              value={stats.todayTotal}
              suffix="个"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
            />
          </Col>

          <Col xs={12} sm={6}>
            <Statistic
              title="已完成"
              value={stats.todayCompleted}
              suffix="个"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>

          <Col xs={12} sm={6}>
            <Statistic
              title="剩余"
              value={stats.todayRemaining}
              suffix="个"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>

          {stats.overdueCount > 0 && (
            <Col xs={24} sm={6}>
              <Statistic
                title="超期"
                value={stats.overdueCount}
                suffix="个"
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          )}
        </Row>

        {/* 完成进度条 */}
        <div>
          <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
            完成进度
          </Text>
          <Progress
            percent={stats.completionRate}
            strokeColor={getProgressColor(stats.completionRate)}
            format={(percent) => `${percent}%`}
            strokeWidth={12}
          />
        </div>

        {/* 鼓励消息 */}
        {stats.completionRate === 100 && (
          <Alert
            message="🎉 太棒了！今日复习任务全部完成！"
            type="success"
            showIcon
          />
        )}
      </Space>
    </Card>
  )
}

export default React.memo(ReviewSummaryCard)
```

**验证:**

- 统计数据正确显示
- 进度条颜色动态变化
- 响应式布局正常
- 完成时显示鼓励消息

#### Subtask 4.3: 创建ReviewTaskList组件

**文件:** `src/renderer/src/components/ReviewTaskList.tsx`

```typescript
import React from 'react'
import { List, Empty, Button, Typography } from 'antd'
import { SmileOutlined, RocketOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ReviewTask } from '../types'
import ReviewTaskCard from './ReviewTaskCard'

const { Text } = Typography

interface ReviewTaskListProps {
  tasks: ReviewTask[]
}

const ReviewTaskList: React.FC<ReviewTaskListProps> = ({ tasks }) => {
  const navigate = useNavigate()

  // 空状态
  if (tasks.length === 0) {
    return (
      <Empty
        image={<SmileOutlined style={{ fontSize: '64px', color: '#52c41a' }} />}
        description={
          <div>
            <Text strong style={{ fontSize: '18px', display: 'block', marginBottom: '8px' }}>
              🎉 今日无复习任务，干得好！
            </Text>
            <Text type="secondary">保持学习习惯，明天见！</Text>
          </div>
        }
      >
        <Button
          type="primary"
          icon={<RocketOutlined />}
          onClick={() => navigate('/knowledge')}
        >
          浏览所有知识点
        </Button>
      </Empty>
    )
  }

  return (
    <List
      dataSource={tasks}
      renderItem={(task) => (
        <ReviewTaskCard key={task.id} task={task} />
      )}
      style={{ marginTop: '16px' }}
    />
  )
}

export default React.memo(ReviewTaskList)
```

**验证:**

- 空状态显示友好
- 列表正确渲染
- 导航功能正常

#### Subtask 4.4: 创建ReviewTaskCard组件

**文件:** `src/renderer/src/components/ReviewTaskCard.tsx`

```typescript
import React from 'react'
import { Card, Tag, Space, Typography, Badge } from 'antd'
import {
  ClockCircleOutlined,
  HistoryOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { ReviewTask } from '../types'

const { Title, Text } = Typography

interface ReviewTaskCardProps {
  task: ReviewTask
}

const ReviewTaskCard: React.FC<ReviewTaskCardProps> = ({ task }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    // Story 3.2实现复习流程前，先跳转到详情页
    navigate(`/knowledge/${task.id}`)
  }

  // 根据优先级确定卡片样式
  const getCardStyle = () => {
    if (task.priority === 'overdue') {
      return {
        borderLeft: '4px solid #ff4d4f',
        backgroundColor: '#fff1f0'
      }
    }
    if (task.priority === 'due_today') {
      return {
        borderLeft: '4px solid #fa8c16'
      }
    }
    return {}
  }

  // 优先级标签
  const getPriorityTag = () => {
    if (task.priority === 'overdue') {
      return (
        <Tag color="error" icon={<WarningOutlined />}>
          超期 {task.daysOverdue}天
        </Tag>
      )
    }
    if (task.priority === 'due_today') {
      return <Tag color="warning">今日到期</Tag>
    }
    return <Tag color="default">提前复习</Tag>
  }

  return (
    <Badge.Ribbon
      text={task.priority === 'overdue' ? '紧急' : undefined}
      color={task.priority === 'overdue' ? 'red' : undefined}
    >
      <Card
        hoverable
        style={{
          marginBottom: '12px',
          ...getCardStyle(),
          cursor: 'pointer'
        }}
        onClick={handleClick}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* 标题 */}
          <Title level={4} style={{ margin: 0 }}>
            {task.title}
          </Title>

          {/* 标签和分类 */}
          <Space size="small" wrap>
            {getPriorityTag()}
            {task.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {task.categoryId && (
              <Tag color="blue">{task.categoryId}</Tag>
            )}
          </Space>

          {/* 复习信息 */}
          <Space size="large">
            <Text type="secondary">
              <ClockCircleOutlined /> 计划时间: {dayjs(task.dueTime).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Text type="secondary">
              <HistoryOutlined /> 已复习: {task.reviewCount}次
            </Text>
          </Space>
        </Space>
      </Card>
    </Badge.Ribbon>
  )
}

export default React.memo(ReviewTaskCard)
```

**验证:**

- 卡片样式根据优先级正确变化
- 超期任务显示红色边框和"紧急"标签
- 时间显示格式友好
- 点击跳转正常

---

### Task 5: 修改KnowledgeDetailPage添加立即复习按钮

**估算时间:** 0.5小时  
**关联AC:** AC6

#### Subtask 5.1: 扩展详情页操作按钮

**文件:** `src/renderer/src/pages/KnowledgeDetailPage.tsx`

```typescript
// 在现有文件中添加

import { useReviewStore } from '../stores/reviewStore'

const KnowledgeDetailPage: React.FC = () => {
  // 现有代码...

  const markForImmediateReview = useReviewStore(state => state.markForImmediateReview)
  const navigate = useNavigate()

  const handleMarkForReview = async () => {
    if (id) {
      try {
        await markForImmediateReview(id)
        // 跳转到今日复习页面
        navigate('/review')
      } catch (error) {
        // 错误已在store中处理
      }
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 现有代码... */}

      {/* 顶部操作栏 */}
      <Space>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStartReview}
        >
          开始复习
        </Button>

        {/* 新增：立即复习按钮 */}
        <Button
          icon={<ClockCircleOutlined />}
          onClick={handleMarkForReview}
        >
          加入今日复习
        </Button>

        {/* 其他按钮... */}
      </Space>

      {/* 其他内容... */}
    </div>
  )
}
```

**验证:**

- 按钮正确显示
- 点击标记成功
- 跳转到复习页面
- Toast提示正常

---

### Task 6: 配置路由和集成

**估算时间:** 0.5小时  
**关联AC:** AC1

#### Subtask 6.1: 添加复习主页路由

**文件:** `src/renderer/src/App.tsx` 或路由配置文件

```typescript
import { Routes, Route } from 'react-router-dom'
import ReviewDashboardPage from './pages/ReviewDashboardPage'
// 其他导入...

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/knowledge" replace />} />
      <Route path="/knowledge" element={<KnowledgeListPage />} />
      <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />

      {/* 新增：复习主页路由 */}
      <Route path="/review" element={<ReviewDashboardPage />} />

      {/* 其他路由... */}
    </Routes>
  )
}
```

**验证:**

- 路由正确配置
- 页面可访问
- 导航正常

---

### Task 7: 手动测试和验证

**估算时间:** 0.5小时  
**关联AC:** 所有AC

#### Subtask 7.1: 功能测试清单

**测试场景1: 今日复习任务列表显示**

- [ ] 打开应用，导航到/review
- [ ] 检查任务列表是否按优先级排序（超期 > 今日 > 提前）
- [ ] 检查每个卡片是否显示完整信息
- [ ] 页面加载时间 < 300ms

**测试场景2: 复习汇总信息显示**

- [ ] 汇总卡片显示正确的统计数据
- [ ] 进度条颜色根据完成率变化
- [ ] 超期数量正确显示（如果有）
- [ ] 统计数据与实际任务列表一致

**测试场景3: 超期知识点标记**

- [ ] 创建超期的知识点（手动修改数据库next_review_at）
- [ ] 检查超期任务是否显示红色边框
- [ ] 检查"紧急"标签是否显示
- [ ] 检查超期天数计算是否正确

**测试场景4: 无复习任务时的显示**

- [ ] 清空所有待复习任务（修改所有next_review_at为未来日期）
- [ ] 检查空状态显示
- [ ] 检查鼓励消息显示
- [ ] 检查"浏览所有知识点"按钮功能

**测试场景5: 立即复习标记**

- [ ] 打开任意知识点详情页
- [ ] 点击"加入今日复习"按钮
- [ ] 检查Toast提示
- [ ] 检查是否跳转到复习页面
- [ ] 检查该知识点是否出现在今日任务列表中

**测试场景6: 点击任务卡片**

- [ ] 点击任意复习任务卡片
- [ ] 在Story 3.2未实现前，检查是否跳转到详情页
- [ ] 检查详情页显示正确

**测试场景7: 性能测试**

- [ ] 创建100个待复习知识点
- [ ] 测试页面加载时间（< 300ms）
- [ ] 测试列表渲染时间（< 200ms）
- [ ] 测试滚动流畅性（60fps）

**测试场景8: 错误处理**

- [ ] 模拟IPC调用失败
- [ ] 检查错误提示和"重试"按钮
- [ ] 点击"重试"按钮功能正常

---

## 📚 技术参考

### 依赖库

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "antd": "^5.x",
    "zustand": "^4.x",
    "dayjs": "^1.x"
  }
}
```

### 关键API文档

- **Ant Design Components:**
  - Card: https://ant.design/components/card
  - Statistic: https://ant.design/components/statistic
  - Progress: https://ant.design/components/progress
  - Empty: https://ant.design/components/empty
  - Badge: https://ant.design/components/badge

- **dayjs:**
  - Start Of / End Of: https://day.js.org/docs/en/manipulate/start-of
  - Diff: https://day.js.org/docs/en/display/difference

---

## 🔍 代码审查要点

### 必须检查项

- [ ] **TypeScript类型安全**
  - 所有函数参数和返回值有类型定义
  - ReviewTask和ReviewStats类型定义完整
  - 无`any`类型

- [ ] **命名规范**
  - 组件名使用PascalCase
  - 变量和函数使用camelCase
  - IPC通道符合`{实体}:{操作}`格式

- [ ] **错误处理**
  - 所有async函数有try-catch
  - 错误日志记录完整
  - 用户友好的错误提示

- [ ] **性能优化**
  - 组件使用React.memo
  - Store使用选择性订阅
  - 列表考虑虚拟滚动（100+项）

- [ ] **数据一致性**
  - 优先级计算准确
  - 超期天数计算正确
  - 排序逻辑符合AC要求

---

## 🚨 常见陷阱和注意事项

### 1. 日期计算问题

**问题:** dayjs时区或精度导致超期天数计算错误

**解决方案:**

```typescript
// ✅ 正确：使用startOf('day')对齐到天
const startOfDay = dayjs(now).startOf('day').valueOf()
const daysOverdue = Math.ceil((startOfDay - nextReview) / (24 * 60 * 60 * 1000))

// ❌ 错误：直接比较时间戳，可能跨天但计算为0天
const daysOverdue = Math.floor((now - nextReview) / (24 * 60 * 60 * 1000))
```

### 2. 优先级排序问题

**问题:** 同优先级任务顺序混乱

**解决方案:**

```typescript
// ✅ 正确：先按优先级，再按时间
tasks.sort((a, b) => {
  const priorityOrder = { overdue: 0, due_today: 1, advance: 2 }
  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
  if (priorityDiff !== 0) return priorityDiff
  return a.dueTime - b.dueTime // 同优先级按时间排序
})
```

### 3. 统计数据不一致

**问题:** todayRemaining可能为负数

**解决方案:**

```typescript
// ✅ 正确：确保不为负
const todayRemaining = Math.max(0, todayTotal - todayCompleted)
```

### 4. Store状态未清理

**问题:** 用户离开复习页面后状态残留

**解决方案:**

```typescript
useEffect(() => {
  // 加载数据...

  return () => {
    clearReviewData() // ✅ 卸载时清理
  }
}, [])
```

---

## ✅ Definition of Done (DoD)

### 代码完成

- [ ] 所有6个子任务的代码已实现
- [ ] TypeScript编译无错误和警告
- [ ] ESLint检查全部通过
- [ ] 代码已提交到版本控制

### 功能完成

- [ ] 所有8个验收标准（AC1-AC8）通过
- [ ] 手动测试清单全部完成
- [ ] 在Windows环境测试通过
- [ ] 在macOS环境测试通过（如果可用）

### 测试完成

- [ ] 核心功能手动测试完成（测试清单100%完成）
- [ ] 回归测试通过（现有功能不受影响）
- [ ] 性能测试通过（< 300ms加载，< 200ms渲染）
- [ ] 边界情况测试（空数据、大数据量、超期数据）

### 文档完成

- [ ] 代码注释完整（关键逻辑有说明）
- [ ] 组件Props有JSDoc注释
- [ ] README更新（如有新的使用说明）

### 集成完成

- [ ] 与Story 1.4/2.1-2.4功能正常集成
- [ ] 路由配置正确
- [ ] Store状态管理正常
- [ ] IPC通信正常

### 性能验证

- [ ] 页面加载 < 300ms
- [ ] 任务列表渲染 < 200ms
- [ ] 统计数据刷新 < 100ms
- [ ] 页面滚动流畅（60fps）
- [ ] 内存占用正常（无泄漏）

---

## 📝 实施注意事项

### 从之前Story学到的经验

1. **Repository层命名转换（从Story 1.3）**
   - 数据库字段使用snake_case
   - TypeScript对象使用camelCase
   - Repository层负责转换

2. **IPC通道规范（从Story 1.5）**
   - 格式：`{实体}:{操作}`
   - 返回格式：`{ data: T }`
   - 错误直接throw，不返回error对象

3. **Store状态管理（从Story 1.6）**
   - 使用选择性订阅避免不必要的重渲染
   - 异步操作有loading/error状态
   - 操作成功后显示message提示

4. **UI组件设计（从Story 2.1）**
   - 加载状态使用Spin组件
   - 空状态使用Empty组件
   - 响应式布局使用Ant Design的Grid系统

5. **日期处理（从Story 2.4）**
   - 统一使用dayjs处理日期
   - 相对时间使用relativeTime插件
   - 配置中文locale

### 项目上下文规则（必须遵守）

**关键规则（来自project_context.md）:**

1. **数据库命名约定（强制）**
   - 表名和列名：`snake_case`
   - Repository层处理命名转换
   - 所有查询使用参数化（防SQL注入）

2. **TypeScript严格模式（强制）**
   - 禁用`any`，使用`unknown`
   - 启用`strictNullChecks`
   - 所有公共API有类型定义

3. **错误处理（强制）**
   - 所有async操作有try-catch
   - 错误记录到日志
   - 用户友好的错误提示

4. **性能要求（关键）**
   - UI响应 ≤ 200ms
   - 页面加载 ≤ 300ms
   - 列表 >50 项使用虚拟滚动

5. **日志规范（强制）**
   - info级别：所有CRUD操作
   - error级别：所有错误
   - 结构化日志（对象格式）

---

## 🎯 后续Story准备

Story 3.1完成后，为Story 3.2（复习流程和人性化评分）准备的基础：

1. **今日任务列表已实现** - 提供复习入口
2. **ReviewStore已创建** - 可复用和扩展
3. **ReviewTask数据结构** - 包含完整复习信息
4. **优先级排序逻辑** - 复习流程可按优先级进行
5. **复习统计基础** - 可扩展到复习完成后的统计更新

---

**预估总时间:** 5小时  
**建议实施顺序:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7

**关键里程碑:**

- Task 1-2完成: 数据层和IPC层完成，可测试任务查询
- Task 3完成: Store层完成，可测试状态管理
- Task 4完成: UI完整呈现，可进行视觉验证
- Task 7完成: 所有AC通过，Story完成

---

_本实施指南由SM Agent（Bob）生成，基于Epic 3定义、PRD需求、架构文档和项目上下文规则。_

**Story Status:** ready-for-dev  
**生成时间:** 2025-12-14  
**下一步:** 由Dev Agent执行 `dev-story` 工作流开始实施

---

**📋 Sprint Status更新建议:**

```yaml
- story_id: '3.1'
  title: '今日复习任务列表'
  epic: 'Epic 3'
  story_points: 5
  priority: 'P0'
  status: 'ready-for-dev'
  assignee: 'Dev Agent'
  dependencies: ['1.4', '2.1', '2.2', '2.3', '2.4']
  implementation_guide: 'docs/stories/story-3.1-implementation-guide.md'
```








