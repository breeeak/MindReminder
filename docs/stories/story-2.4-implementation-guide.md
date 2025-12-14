# Story 2.4 实现指南：知识点详情和复习历史

**Story ID:** 2.4  
**Story Title:** 知识点详情和复习历史  
**Epic:** Epic 2 - 知识点管理核心功能  
**优先级:** P0  
**Story Points:** 8  
**预估时间:** 8小时  
**依赖:** Story 2.1 (知识点CRUD), Story 2.2 (标签和分类), Story 2.3 (搜索功能)

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **查看知识点的详细信息和复习历史**,  
So that **我可以了解学习进度和记忆效果**.

### 业务价值

- 提供知识点的完整上下文信息，帮助用户了解学习状态
- 可视化复习历史，让用户看到记忆曲线和进步
- 支持单独调整复习频率，满足个性化学习需求
- 为后续的复习功能（Epic 3）提供数据基础

### 业务需求覆盖

- **FR6**: 查看知识点详细信息
- **FR7**: 查看复习历史记录
- **FR8**: 查看评分趋势图表
- **FR9**: 设置独立复习频率系数
- **NFR-U1**: 易学性要求（清晰的信息呈现）
- **NFR-U2**: 操作效率要求（快速访问详情）
- **NFR-P1**: UI响应时间 < 200ms

---

## 📐 技术设计

### 架构层次

```
UI层（Renderer）
├── KnowledgeDetailPage.tsx         # 【新增】知识点详情页面
│   ├── KnowledgeInfo.tsx           # 【新增】知识点基本信息组件
│   ├── ReviewStatistics.tsx        # 【新增】复习统计组件
│   ├── ReviewTimeline.tsx          # 【新增】复习历史时间轴
│   ├── ReviewFrequencyAdjust.tsx   # 【新增】复习频率调整组件
│   └── ReviewChart.tsx             # 【新增】评分趋势图表（可选）
│
├── KnowledgeListItem.tsx           # 【修改】添加点击跳转详情页
└── KnowledgeListPage.tsx           # 【无需修改】已有路由配置

Store层（Zustand）
├── knowledgeStore.ts               # 【扩展】添加当前详情知识点状态
│   ├── currentKnowledge: Knowledge | null
│   ├── reviewHistory: ReviewHistory[]
│   ├── fetchKnowledgeDetail(id)
│   ├── fetchReviewHistory(id)
│   └── updateReviewFrequency(id, factor)
│
└── reviewStore.ts                  # 【新增】复习相关状态管理（为Epic 3准备）
    ├── reviewList: ReviewHistory[]
    └── fetchReviewsByKnowledge(knowledgeId)

IPC层
├── src/common/ipc-channels.ts      # 【扩展】添加新的IPC通道
│   ├── 'knowledge:getById'         # 获取单个知识点详情
│   ├── 'review:getByKnowledge'     # 获取知识点的复习历史
│   └── 'knowledge:updateFrequency' # 更新复习频率系数
│
├── src/main/ipc/knowledgeHandlers.ts  # 【扩展】添加详情处理器
└── src/main/ipc/reviewHandlers.ts     # 【新增】复习相关处理器

数据层
├── ReviewRepository.ts             # 【已有】从Story 1.3
│   ├── findByKnowledgeId()        # 按知识点ID查询复习历史
│   ├── getLatestByKnowledge()     # 获取最新一次复习
│   └── getStatistics()            # 获取统计数据
│
└── KnowledgeRepository.ts          # 【扩展】添加频率系数更新
    └── updateReviewFrequency()     # 更新review_frequency字段
```

### 数据模型（已有，无需修改）

```typescript
// 从Story 1.3已定义
interface Knowledge {
  id: string // UUID主键
  title: string // 标题（必填）
  content: string // 内容（Markdown）
  tags: string[] // 标签数组
  categoryId: string | null // 分类ID
  status: 'learning' | 'mastered' // 复习状态
  reviewCount: number // 复习次数
  lastReviewAt: number | null // 最后复习时间（Unix时间戳）
  nextReviewAt: number | null // 下次复习时间（Unix时间戳）
  reviewFrequency: number // 独立复习频率系数 (0.5-1.5)
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}

interface ReviewHistory {
  id: string // UUID主键
  knowledgeId: string // 知识点ID（外键）
  rating: number // 评分 (1-5)
  ratingEmoji: string // 评分表情 ('😟'|'🤔'|'😐'|'😊'|'🎯')
  intervalDays: number // 间隔天数
  nextReviewAt: number // 计划的下次复习时间
  actualReviewAt: number // 实际复习时间
  reviewedAt: number // 复习时间戳
}
```

### 数据流

```
用户点击知识点卡片
    ↓
路由跳转: /knowledge/:id
    ↓
KnowledgeDetailPage组件挂载
    ↓
useEffect触发
    ↓
knowledgeStore.fetchKnowledgeDetail(id)
knowledgeStore.fetchReviewHistory(id)
    ↓
并行IPC调用
├── IPC: 'knowledge:getById'
│   ↓
│   KnowledgeRepository.findById()
│   ↓
│   返回Knowledge对象
│
└── IPC: 'review:getByKnowledge'
    ↓
    ReviewRepository.findByKnowledgeId()
    ↓
    返回ReviewHistory数组

    ↓
Store更新状态
    ↓
UI重新渲染
├── KnowledgeInfo显示基本信息
├── ReviewStatistics显示统计数据
├── ReviewTimeline显示历史时间轴
└── ReviewFrequencyAdjust显示频率调整器

用户调整频率系数
    ↓
ReviewFrequencyAdjust组件
    ↓
knowledgeStore.updateReviewFrequency(id, factor)
    ↓
IPC: 'knowledge:updateFrequency'
    ↓
KnowledgeRepository.updateReviewFrequency()
    ↓
重新计算下次复习时间
    ↓
返回更新后的Knowledge对象
    ↓
Store更新
    ↓
UI显示新的复习时间预测
```

---

## 🎯 验收标准（Acceptance Criteria）

### AC1: 知识点基本信息显示

**Given** 用户打开知识点详情页面  
**When** 页面加载完成  
**Then** 显示知识点基本信息：

- 标题（大字体，粗体）
- 内容（Markdown渲染）
- 标签列表（可点击筛选）
- 分类（可点击筛选）
- 创建时间（格式化显示）
- 更新时间（格式化显示）

**And** 所有信息从数据库正确读取  
**And** Markdown内容正确渲染（代码高亮、列表等）  
**And** 页面加载时间 < 200ms

### AC2: 复习统计信息显示

**Given** 用户在详情页面  
**When** 复习统计区域渲染  
**Then** 显示以下统计数据：

- 复习次数（总共复习了X次）
- 最后复习时间（如果有）
- 下次复习时间（如果有，带倒计时）
- 当前掌握度（基于最近评分）

**And** 统计数据实时计算  
**And** 时间显示格式友好（"3天后"、"昨天"等）  
**And** 未复习时显示"尚未开始复习"

### AC3: 复习历史时间轴显示

**Given** 知识点有复习历史  
**When** 时间轴组件渲染  
**Then** 显示复习历史时间轴：

- 每次复习的日期（从新到旧）
- 每次复习的评分表情（😟🤔😐😊🎯）
- 当时计划的下次复习时间
- 实际复习时间与计划时间的对比（提前/延后）

**And** 时间轴使用Ant Design Timeline组件  
**And** 最新复习在最上方  
**And** 超过10条显示"加载更多"按钮

### AC4: 复习历史为空时的显示

**Given** 知识点从未被复习过  
**When** 时间轴组件渲染  
**Then** 显示空状态：

- 图标提示（如📚）
- 文字："这个知识点还没有复习记录"
- "开始复习"按钮（点击后跳转到复习流程）

**And** 空状态设计友好，不显示空白

### AC5: 独立复习频率系数调整

**Given** 用户在详情页面  
**When** 用户点击"调整复习频率"按钮  
**Then** 弹出频率调整器：

- Slider滑块，范围0.5x - 1.5x（步长0.1）
- 显示当前系数值
- 显示预计影响说明（"当前间隔将×1.2"）
- "保存"和"取消"按钮

**When** 用户调整滑块并点击"保存"  
**Then** 更新数据库中的review_frequency字段  
**And** 立即重新计算下次复习时间  
**And** 显示"复习频率已更新"提示  
**And** 关闭调整器  
**And** 统计区域显示新的下次复习时间

### AC6: 评分趋势可视化（可选，Nice to Have）

**Given** 知识点有5次以上复习历史  
**When** 评分趋势图表组件渲染  
**Then** 显示评分随时间的变化趋势：

- X轴：复习日期
- Y轴：评分（1-5）
- 折线图显示评分变化
- 标记评分表情符号

**And** 使用Ant Design Charts或recharts库  
**And** 图表响应式适配容器大小  
**And** 少于5次复习时不显示图表

### AC7: 页面操作按钮

**Given** 用户在详情页面  
**When** 页面渲染完成  
**Then** 显示以下操作按钮：

- "返回列表"（左上角）
- "编辑"（打开编辑对话框）
- "删除"（显示确认对话框）
- "开始复习"（进入复习流程，Epic 3实现）

**And** 所有按钮功能正常  
**And** "开始复习"按钮在Epic 3实现前显示"敬请期待"提示

### AC8: 响应式与性能要求

**Given** 用户在详情页面  
**When** 执行各种操作  
**Then** 满足以下性能要求：

- 页面首次加载 < 200ms
- 历史记录加载 < 100ms
- 频率调整保存 < 100ms
- 页面滚动流畅（60fps）

**And** 1000+条复习历史时使用虚拟滚动  
**And** 大内容Markdown渲染优化

---

## 🔨 实现步骤（Tasks）

### Task 1: 创建复习相关IPC通道和处理器（数据层和IPC层）

**估算时间:** 1小时  
**关联AC:** AC1, AC2, AC3

#### Subtask 1.1: 扩展IPC通道定义

**文件:** `src/common/ipc-channels.ts`

```typescript
export enum IpcChannels {
  // 现有通道...
  KNOWLEDGE_GET_BY_ID = 'knowledge:getById',
  KNOWLEDGE_UPDATE_FREQUENCY = 'knowledge:updateFrequency',

  REVIEW_GET_BY_KNOWLEDGE = 'review:getByKnowledge',
  REVIEW_GET_STATISTICS = 'review:getStatistics'
}
```

**验证:**

- TypeScript编译通过
- 通道命名符合规范（`{实体}:{操作}`）

#### Subtask 1.2: 扩展KnowledgeRepository

**文件:** `src/main/database/repositories/KnowledgeRepository.ts`

```typescript
// 添加方法
async updateReviewFrequency(id: string, frequency: number): Promise<Knowledge> {
  if (frequency < 0.5 || frequency > 1.5) {
    throw new ValidationError('复习频率系数必须在0.5-1.5之间')
  }

  const transaction = this.db.transaction(() => {
    const stmt = this.db.prepare(`
      UPDATE knowledge
      SET review_frequency = ?, updated_at = ?
      WHERE id = ?
    `)
    stmt.run(frequency, Date.now(), id)

    // 重新计算下次复习时间（如果有复习记录）
    const knowledge = this.findById(id)
    if (knowledge && knowledge.lastReviewAt && knowledge.nextReviewAt) {
      // 调用复习算法重新计算
      // 这部分逻辑在Epic 3实现，这里先更新字段即可
    }

    return knowledge
  })

  const result = transaction()
  if (!result) {
    throw new DatabaseError('更新复习频率失败')
  }

  log.info('Knowledge review frequency updated', { id, frequency })
  return result
}
```

**验证:**

- 方法正确更新数据库
- 参数验证有效（0.5-1.5范围）
- 事务处理正确
- 日志记录完整

#### Subtask 1.3: 扩展ReviewRepository查询方法

**文件:** `src/main/database/repositories/ReviewRepository.ts`

```typescript
// 按知识点ID查询复习历史（按时间倒序）
findByKnowledgeId(knowledgeId: string, limit?: number): ReviewHistory[] {
  const stmt = this.db.prepare(`
    SELECT * FROM review_history
    WHERE knowledge_id = ?
    ORDER BY reviewed_at DESC
    ${limit ? 'LIMIT ?' : ''}
  `)

  const rows = limit ? stmt.all(knowledgeId, limit) : stmt.all(knowledgeId)

  return rows.map(row => this.rowToReviewHistory(row))
}

// 获取最新一次复习
getLatestByKnowledge(knowledgeId: string): ReviewHistory | null {
  const results = this.findByKnowledgeId(knowledgeId, 1)
  return results.length > 0 ? results[0] : null
}

// 获取复习统计
getStatistics(knowledgeId: string): ReviewStatistics {
  const stmt = this.db.prepare(`
    SELECT
      COUNT(*) as total_reviews,
      AVG(rating) as avg_rating,
      MAX(reviewed_at) as last_review_at
    FROM review_history
    WHERE knowledge_id = ?
  `)

  const row = stmt.get(knowledgeId)

  return {
    totalReviews: row.total_reviews || 0,
    avgRating: row.avg_rating || 0,
    lastReviewAt: row.last_review_at || null
  }
}

// 命名转换辅助方法
private rowToReviewHistory(row: any): ReviewHistory {
  return {
    id: row.id,
    knowledgeId: row.knowledge_id,
    rating: row.rating,
    ratingEmoji: this.getRatingEmoji(row.rating),
    intervalDays: row.interval_days,
    nextReviewAt: row.next_review_at,
    actualReviewAt: row.actual_review_at,
    reviewedAt: row.reviewed_at
  }
}

private getRatingEmoji(rating: number): string {
  const emojiMap = {
    1: '😟',
    2: '🤔',
    3: '😐',
    4: '😊',
    5: '🎯'
  }
  return emojiMap[rating] || '😐'
}
```

**验证:**

- 查询结果正确排序（最新在前）
- limit参数有效
- 统计计算准确
- 命名转换正确（snake_case → camelCase）

#### Subtask 1.4: 创建reviewHandlers.ts

**文件:** `src/main/ipc/reviewHandlers.ts`

```typescript
import { ipcMain } from 'electron'
import { IpcChannels } from '../../common/ipc-channels'
import { ReviewRepository } from '../database/repositories'
import log from '../utils/logger'

export function registerReviewHandlers() {
  // 获取知识点的复习历史
  ipcMain.handle(
    IpcChannels.REVIEW_GET_BY_KNOWLEDGE,
    async (event, knowledgeId: string, limit?: number) => {
      try {
        log.info('Fetching review history', { knowledgeId, limit })
        const reviewRepo = ReviewRepository.getInstance()
        const reviews = reviewRepo.findByKnowledgeId(knowledgeId, limit)
        return { data: reviews }
      } catch (error) {
        log.error('Failed to fetch review history', { error, knowledgeId })
        throw error
      }
    }
  )

  // 获取复习统计
  ipcMain.handle(IpcChannels.REVIEW_GET_STATISTICS, async (event, knowledgeId: string) => {
    try {
      log.info('Fetching review statistics', { knowledgeId })
      const reviewRepo = ReviewRepository.getInstance()
      const stats = reviewRepo.getStatistics(knowledgeId)
      return { data: stats }
    } catch (error) {
      log.error('Failed to fetch review statistics', { error, knowledgeId })
      throw error
    }
  })

  log.info('Review IPC handlers registered')
}
```

**验证:**

- IPC处理器正确注册
- 错误处理完整
- 日志记录规范
- 返回格式符合 `{ data: T }`

#### Subtask 1.5: 扩展knowledgeHandlers.ts

**文件:** `src/main/ipc/knowledgeHandlers.ts`

```typescript
// 添加到现有文件

// 获取单个知识点详情
ipcMain.handle(IpcChannels.KNOWLEDGE_GET_BY_ID, async (event, id: string) => {
  try {
    log.info('Fetching knowledge detail', { id })
    const knowledgeRepo = KnowledgeRepository.getInstance()
    const knowledge = knowledgeRepo.findById(id)

    if (!knowledge) {
      throw new NotFoundError('Knowledge not found', '知识点不存在')
    }

    return { data: knowledge }
  } catch (error) {
    log.error('Failed to fetch knowledge detail', { error, id })
    throw error
  }
})

// 更新复习频率系数
ipcMain.handle(
  IpcChannels.KNOWLEDGE_UPDATE_FREQUENCY,
  async (event, id: string, frequency: number) => {
    try {
      log.info('Updating review frequency', { id, frequency })
      const knowledgeRepo = KnowledgeRepository.getInstance()
      const knowledge = await knowledgeRepo.updateReviewFrequency(id, frequency)
      return { data: knowledge }
    } catch (error) {
      log.error('Failed to update review frequency', { error, id, frequency })
      throw error
    }
  }
)
```

**验证:**

- 处理器正确实现
- 404错误正确抛出
- 参数验证有效

#### Subtask 1.6: 注册reviewHandlers

**文件:** `src/main/ipc/index.ts`

```typescript
import { registerKnowledgeHandlers } from './knowledgeHandlers'
import { registerReviewHandlers } from './reviewHandlers'

export function registerIpcHandlers() {
  registerKnowledgeHandlers()
  registerReviewHandlers() // 新增
}
```

**验证:**

- 应用启动时正确注册所有处理器
- 无TypeScript编译错误

---

### Task 2: 扩展Preload暴露API（Preload层）

**估算时间:** 0.5小时  
**关联AC:** AC1, AC2, AC3, AC5

#### Subtask 2.1: 扩展preload/index.ts

**文件:** `src/preload/index.ts`

```typescript
// 在contextBridge.exposeInMainWorld中添加

const api = {
  knowledge: {
    // 现有方法...
    getById: (id: string) => ipcRenderer.invoke(IpcChannels.KNOWLEDGE_GET_BY_ID, id),
    updateFrequency: (id: string, frequency: number) =>
      ipcRenderer.invoke(IpcChannels.KNOWLEDGE_UPDATE_FREQUENCY, id, frequency)
  },

  review: {
    getByKnowledge: (knowledgeId: string, limit?: number) =>
      ipcRenderer.invoke(IpcChannels.REVIEW_GET_BY_KNOWLEDGE, knowledgeId, limit),
    getStatistics: (knowledgeId: string) =>
      ipcRenderer.invoke(IpcChannels.REVIEW_GET_STATISTICS, knowledgeId)
  }
}

contextBridge.exposeInMainWorld('api', api)
```

#### Subtask 2.2: 扩展TypeScript类型定义

**文件:** `src/preload/index.d.ts`

```typescript
export interface ElectronAPI {
  knowledge: {
    // 现有方法...
    getById: (id: string) => Promise<{ data: Knowledge }>
    updateFrequency: (id: string, frequency: number) => Promise<{ data: Knowledge }>
  }

  review: {
    getByKnowledge: (knowledgeId: string, limit?: number) => Promise<{ data: ReviewHistory[] }>
    getStatistics: (knowledgeId: string) => Promise<{ data: ReviewStatistics }>
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

### Task 3: 扩展Zustand Store（状态管理层）

**估算时间:** 1小时  
**关联AC:** AC1, AC2, AC3, AC5

#### Subtask 3.1: 扩展knowledgeStore.ts

**文件:** `src/renderer/src/stores/knowledgeStore.ts`

```typescript
interface KnowledgeStore {
  // 现有状态...

  // 详情页状态
  currentKnowledge: Knowledge | null
  reviewHistory: ReviewHistory[]
  reviewStatistics: ReviewStatistics | null
  detailLoading: boolean
  detailError: Error | null

  // 详情页操作
  fetchKnowledgeDetail: (id: string) => Promise<void>
  fetchReviewHistory: (id: string, limit?: number) => Promise<void>
  updateReviewFrequency: (id: string, frequency: number) => Promise<void>
  clearDetail: () => void
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  // 现有状态和方法...

  // 详情页初始状态
  currentKnowledge: null,
  reviewHistory: [],
  reviewStatistics: null,
  detailLoading: false,
  detailError: null,

  // 获取知识点详情
  fetchKnowledgeDetail: async (id: string) => {
    set({ detailLoading: true, detailError: null })
    try {
      const response = await window.api.knowledge.getById(id)
      set({
        currentKnowledge: response.data,
        detailLoading: false
      })
    } catch (error) {
      console.error('Failed to fetch knowledge detail:', error)
      set({
        detailError: error as Error,
        detailLoading: false
      })
      throw error
    }
  },

  // 获取复习历史
  fetchReviewHistory: async (id: string, limit?: number) => {
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        window.api.review.getByKnowledge(id, limit),
        window.api.review.getStatistics(id)
      ])

      set({
        reviewHistory: historyResponse.data,
        reviewStatistics: statsResponse.data
      })
    } catch (error) {
      console.error('Failed to fetch review history:', error)
      throw error
    }
  },

  // 更新复习频率
  updateReviewFrequency: async (id: string, frequency: number) => {
    try {
      const response = await window.api.knowledge.updateFrequency(id, frequency)

      // 更新当前详情
      set({ currentKnowledge: response.data })

      // 同时更新列表中的对应项（如果存在）
      const { knowledgeList } = get()
      const updatedList = knowledgeList.map((k) => (k.id === id ? response.data : k))
      set({ knowledgeList: updatedList })

      message.success('复习频率已更新')
    } catch (error) {
      console.error('Failed to update review frequency:', error)
      message.error('更新复习频率失败')
      throw error
    }
  },

  // 清除详情页状态
  clearDetail: () => {
    set({
      currentKnowledge: null,
      reviewHistory: [],
      reviewStatistics: null,
      detailError: null
    })
  }
}))
```

**验证:**

- Store状态正确更新
- 异步操作错误处理完整
- 选择性订阅支持（不会导致不必要的重渲染）

---

### Task 4: 创建详情页UI组件（UI层）

**估算时间:** 3小时  
**关联AC:** AC1, AC2, AC3, AC4, AC5, AC7

#### Subtask 4.1: 创建KnowledgeDetailPage主页面

**文件:** `src/renderer/src/pages/KnowledgeDetailPage.tsx`

```typescript
import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Spin, Alert, Space, Divider } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import KnowledgeInfo from '../components/KnowledgeInfo'
import ReviewStatistics from '../components/ReviewStatistics'
import ReviewTimeline from '../components/ReviewTimeline'
import ReviewFrequencyAdjust from '../components/ReviewFrequencyAdjust'

const KnowledgeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const currentKnowledge = useKnowledgeStore(state => state.currentKnowledge)
  const reviewHistory = useKnowledgeStore(state => state.reviewHistory)
  const reviewStatistics = useKnowledgeStore(state => state.reviewStatistics)
  const detailLoading = useKnowledgeStore(state => state.detailLoading)
  const detailError = useKnowledgeStore(state => state.detailError)

  const fetchKnowledgeDetail = useKnowledgeStore(state => state.fetchKnowledgeDetail)
  const fetchReviewHistory = useKnowledgeStore(state => state.fetchReviewHistory)
  const clearDetail = useKnowledgeStore(state => state.clearDetail)
  const deleteKnowledge = useKnowledgeStore(state => state.deleteKnowledge)

  const [editDialogVisible, setEditDialogVisible] = React.useState(false)
  const [frequencyAdjustVisible, setFrequencyAdjustVisible] = React.useState(false)

  useEffect(() => {
    if (id) {
      fetchKnowledgeDetail(id)
      fetchReviewHistory(id)
    }

    return () => {
      clearDetail()
    }
  }, [id])

  const handleBack = () => {
    navigate('/knowledge')
  }

  const handleEdit = () => {
    setEditDialogVisible(true)
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确定删除此知识点吗？',
      content: '删除后无法恢复，复习历史也将被删除。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (id) {
          await deleteKnowledge(id)
          navigate('/knowledge')
        }
      }
    })
  }

  const handleStartReview = () => {
    message.info('复习功能将在Epic 3实现，敬请期待！')
  }

  if (detailLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (detailError) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="加载失败"
          description={detailError.message}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => id && fetchKnowledgeDetail(id)}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  if (!currentKnowledge) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert message="知识点不存在" type="warning" showIcon />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 顶部操作栏 */}
      <Space style={{ marginBottom: '24px', width: '100%', justifyContent: 'space-between' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
        >
          返回列表
        </Button>

        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartReview}
          >
            开始复习
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            编辑
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除
          </Button>
        </Space>
      </Space>

      {/* 知识点基本信息 */}
      <KnowledgeInfo knowledge={currentKnowledge} />

      <Divider />

      {/* 复习统计 */}
      <ReviewStatistics
        knowledge={currentKnowledge}
        statistics={reviewStatistics}
        onAdjustFrequency={() => setFrequencyAdjustVisible(true)}
      />

      <Divider />

      {/* 复习历史时间轴 */}
      <ReviewTimeline
        history={reviewHistory}
        knowledgeId={id!}
      />

      {/* 编辑对话框 */}
      {editDialogVisible && (
        <KnowledgeEditDialog
          visible={editDialogVisible}
          knowledge={currentKnowledge}
          onClose={() => setEditDialogVisible(false)}
        />
      )}

      {/* 复习频率调整对话框 */}
      {frequencyAdjustVisible && (
        <ReviewFrequencyAdjust
          visible={frequencyAdjustVisible}
          knowledge={currentKnowledge}
          onClose={() => setFrequencyAdjustVisible(false)}
        />
      )}
    </div>
  )
}

export default KnowledgeDetailPage
```

**验证:**

- 页面正确加载数据
- 加载状态显示正确
- 错误处理友好
- 所有按钮功能正常

#### Subtask 4.2: 创建KnowledgeInfo组件

**文件:** `src/renderer/src/components/KnowledgeInfo.tsx`

```typescript
import React from 'react'
import { Card, Tag, Typography, Space } from 'antd'
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import dayjs from 'dayjs'
import type { Knowledge } from '../types'

const { Title, Text, Paragraph } = Typography

interface KnowledgeInfoProps {
  knowledge: Knowledge
}

const KnowledgeInfo: React.FC<KnowledgeInfoProps> = ({ knowledge }) => {
  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题 */}
        <Title level={2} style={{ marginBottom: 0 }}>
          {knowledge.title}
        </Title>

        {/* 标签和分类 */}
        <Space size="small" wrap>
          {knowledge.categoryId && (
            <Tag color="blue">分类: {knowledge.categoryId}</Tag>
          )}
          {knowledge.tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          <Tag color={knowledge.status === 'mastered' ? 'success' : 'processing'}>
            {knowledge.status === 'mastered' ? '已掌握' : '学习中'}
          </Tag>
        </Space>

        {/* 内容 */}
        {knowledge.content && (
          <Card
            type="inner"
            title="内容详情"
            style={{ backgroundColor: '#fafafa' }}
          >
            <ReactMarkdown className="markdown-body">
              {knowledge.content}
            </ReactMarkdown>
          </Card>
        )}

        {/* 时间信息 */}
        <Space size="large">
          <Text type="secondary">
            <CalendarOutlined /> 创建时间: {dayjs(knowledge.createdAt).format('YYYY-MM-DD HH:mm')}
          </Text>
          <Text type="secondary">
            <ClockCircleOutlined /> 更新时间: {dayjs(knowledge.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Text>
        </Space>
      </Space>
    </Card>
  )
}

export default React.memo(KnowledgeInfo)
```

**验证:**

- Markdown正确渲染
- 标签和分类正确显示
- 时间格式友好

#### Subtask 4.3: 创建ReviewStatistics组件

**文件:** `src/renderer/src/components/ReviewStatistics.tsx`

```typescript
import React from 'react'
import { Card, Statistic, Row, Col, Button, Space, Typography } from 'antd'
import {
  HistoryOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TrophyOutlined,
  SettingOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import type { Knowledge, ReviewStatistics as ReviewStats } from '../types'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text } = Typography

interface ReviewStatisticsProps {
  knowledge: Knowledge
  statistics: ReviewStats | null
  onAdjustFrequency: () => void
}

const ReviewStatistics: React.FC<ReviewStatisticsProps> = ({
  knowledge,
  statistics,
  onAdjustFrequency
}) => {
  const getMasteryLevel = () => {
    if (knowledge.status === 'mastered') return '已掌握'
    if (!statistics || statistics.totalReviews === 0) return '未开始'

    const avgRating = statistics.avgRating
    if (avgRating >= 4.5) return '非常熟悉'
    if (avgRating >= 3.5) return '记得还可以'
    if (avgRating >= 2.5) return '记得一点'
    return '容易忘记'
  }

  const getNextReviewText = () => {
    if (!knowledge.nextReviewAt) return '尚未安排'
    const nextReview = dayjs(knowledge.nextReviewAt)
    const now = dayjs()

    if (nextReview.isBefore(now)) {
      return `已过期 (${nextReview.fromNow()})`
    }
    return nextReview.fromNow()
  }

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <span>复习统计</span>
        </Space>
      }
      extra={
        <Button
          type="link"
          icon={<SettingOutlined />}
          onClick={onAdjustFrequency}
        >
          调整复习频率
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="复习次数"
            value={statistics?.totalReviews || 0}
            suffix="次"
            prefix={<HistoryOutlined />}
          />
        </Col>

        <Col xs={12} sm={6}>
          <Statistic
            title="当前掌握度"
            value={getMasteryLevel()}
            valueStyle={{
              color: knowledge.status === 'mastered' ? '#52c41a' : '#1890ff',
              fontSize: '20px'
            }}
          />
        </Col>

        <Col xs={12} sm={6}>
          <Card type="inner">
            <Space direction="vertical" size="small">
              <Text type="secondary">
                <CalendarOutlined /> 最后复习
              </Text>
              <Text strong>
                {knowledge.lastReviewAt
                  ? dayjs(knowledge.lastReviewAt).format('YYYY-MM-DD HH:mm')
                  : '尚未复习'
                }
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card type="inner">
            <Space direction="vertical" size="small">
              <Text type="secondary">
                <ClockCircleOutlined /> 下次复习
              </Text>
              <Text strong style={{
                color: knowledge.nextReviewAt && dayjs(knowledge.nextReviewAt).isBefore(dayjs())
                  ? '#ff4d4f'
                  : undefined
              }}>
                {getNextReviewText()}
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 复习频率系数显示 */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Text type="secondary">
          当前复习频率系数: <Text strong>{knowledge.reviewFrequency}x</Text>
          {knowledge.reviewFrequency !== 1.0 && (
            <Text type="secondary"> (已调整)</Text>
          )}
        </Text>
      </div>
    </Card>
  )
}

export default React.memo(ReviewStatistics)
```

**验证:**

- 统计数据正确显示
- 时间相对显示友好（"3天后"、"昨天"）
- 掌握度计算准确
- 过期复习标红显示

#### Subtask 4.4: 创建ReviewTimeline组件

**文件:** `src/renderer/src/components/ReviewTimeline.tsx`

```typescript
import React, { useState } from 'react'
import { Card, Timeline, Button, Empty, Space, Typography, Tag } from 'antd'
import { HistoryOutlined, RocketOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ReviewHistory } from '../types'

const { Text } = Typography

interface ReviewTimelineProps {
  history: ReviewHistory[]
  knowledgeId: string
}

const ReviewTimeline: React.FC<ReviewTimelineProps> = ({ history, knowledgeId }) => {
  const [displayCount, setDisplayCount] = useState(10)

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'green'
    if (rating >= 3) return 'blue'
    if (rating >= 2) return 'orange'
    return 'red'
  }

  const getTimeDiff = (actual: number, planned: number) => {
    const diff = dayjs(actual).diff(dayjs(planned), 'day')
    if (diff > 0) return { text: `延后${diff}天`, color: 'warning' }
    if (diff < 0) return { text: `提前${Math.abs(diff)}天`, color: 'success' }
    return { text: '按时复习', color: 'success' }
  }

  if (history.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text>这个知识点还没有复习记录</Text>
              <Button type="primary" icon={<RocketOutlined />}>
                开始第一次复习
              </Button>
            </Space>
          }
        />
      </Card>
    )
  }

  const displayedHistory = history.slice(0, displayCount)
  const hasMore = history.length > displayCount

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined />
          <span>复习历史</span>
          <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
            （共{history.length}次）
          </Text>
        </Space>
      }
    >
      <Timeline mode="left">
        {displayedHistory.map((review, index) => {
          const timeDiff = getTimeDiff(review.actualReviewAt, review.nextReviewAt)

          return (
            <Timeline.Item
              key={review.id}
              color={getRatingColor(review.rating)}
              label={
                <Text type="secondary">
                  {dayjs(review.reviewedAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              }
            >
              <Space direction="vertical" size="small">
                <Space>
                  <Text strong style={{ fontSize: '24px' }}>
                    {review.ratingEmoji}
                  </Text>
                  <Tag color={getRatingColor(review.rating)}>
                    评分: {review.rating}
                  </Tag>
                </Space>

                <Text type="secondary">
                  下次复习间隔: {review.intervalDays}天
                </Text>

                {index > 0 && (
                  <Tag color={timeDiff.color}>
                    {timeDiff.text}
                  </Tag>
                )}
              </Space>
            </Timeline.Item>
          )
        })}
      </Timeline>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button
            type="link"
            onClick={() => setDisplayCount(prev => prev + 10)}
          >
            加载更多（还有{history.length - displayCount}条）
          </Button>
        </div>
      )}
    </Card>
  )
}

export default React.memo(ReviewTimeline)
```

**验证:**

- 时间轴正确显示
- 评分表情和颜色匹配
- 时间差计算准确
- "加载更多"功能正常

#### Subtask 4.5: 创建ReviewFrequencyAdjust组件

**文件:** `src/renderer/src/components/ReviewFrequencyAdjust.tsx`

```typescript
import React, { useState } from 'react'
import { Modal, Slider, Typography, Space, Alert } from 'antd'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import type { Knowledge } from '../types'

const { Text, Paragraph } = Typography

interface ReviewFrequencyAdjustProps {
  visible: boolean
  knowledge: Knowledge
  onClose: () => void
}

const ReviewFrequencyAdjust: React.FC<ReviewFrequencyAdjustProps> = ({
  visible,
  knowledge,
  onClose
}) => {
  const [frequency, setFrequency] = useState(knowledge.reviewFrequency)
  const [loading, setLoading] = useState(false)

  const updateReviewFrequency = useKnowledgeStore(state => state.updateReviewFrequency)

  const getImpactText = (freq: number) => {
    if (freq === 1.0) return '默认频率，不做调整'
    if (freq > 1.0) {
      const increase = ((freq - 1) * 100).toFixed(0)
      return `复习间隔将延长${increase}%（复习次数减少）`
    }
    const decrease = ((1 - freq) * 100).toFixed(0)
    return `复习间隔将缩短${decrease}%（复习次数增加）`
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateReviewFrequency(knowledge.id, frequency)
      onClose()
    } catch (error) {
      // 错误已在store中处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="调整复习频率"
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      width={600}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="复习频率系数说明"
          description="调整此系数可以控制该知识点的复习间隔。系数越大，复习间隔越长（复习次数越少）；系数越小，复习间隔越短（复习次数越多）。"
          type="info"
          showIcon
        />

        <div>
          <Text strong style={{ fontSize: '16px' }}>
            当前系数: {frequency.toFixed(1)}x
          </Text>

          <Slider
            min={0.5}
            max={1.5}
            step={0.1}
            value={frequency}
            onChange={setFrequency}
            marks={{
              0.5: '0.5x',
              1.0: '1.0x (默认)',
              1.5: '1.5x'
            }}
            tooltip={{
              formatter: (value) => `${value}x`
            }}
            style={{ margin: '24px 0' }}
          />
        </div>

        <Alert
          message="预计影响"
          description={getImpactText(frequency)}
          type={frequency === 1.0 ? 'info' : 'warning'}
          showIcon
        />

        {knowledge.nextReviewAt && (
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            注意：保存后将立即重新计算下次复习时间。
          </Paragraph>
        )}
      </Space>
    </Modal>
  )
}

export default ReviewFrequencyAdjust
```

**验证:**

- Slider控件交互流畅
- 影响说明动态更新
- 保存功能正常
- 加载状态正确显示

---

### Task 5: 配置路由和集成（路由配置和集成）

**估算时间:** 0.5小时  
**关联AC:** AC1, AC7

#### Subtask 5.1: 添加详情页路由

**文件:** `src/renderer/src/App.tsx` 或路由配置文件

```typescript
import { Routes, Route } from 'react-router-dom'
import KnowledgeListPage from './pages/KnowledgeListPage'
import KnowledgeDetailPage from './pages/KnowledgeDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<KnowledgeListPage />} />
      <Route path="/knowledge" element={<KnowledgeListPage />} />
      <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
      {/* 其他路由... */}
    </Routes>
  )
}
```

**验证:**

- 路由正确配置
- 路径参数`:id`正确传递

#### Subtask 5.2: 修改KnowledgeListItem添加点击跳转

**文件:** `src/renderer/src/components/KnowledgeListItem.tsx`

```typescript
import { useNavigate } from 'react-router-dom'

const KnowledgeListItem: React.FC<KnowledgeListItemProps> = ({ knowledge }) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/knowledge/${knowledge.id}`)
  }

  return (
    <Card
      hoverable
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
      // 其他props...
    >
      {/* 卡片内容... */}
    </Card>
  )
}
```

**验证:**

- 点击卡片正确跳转到详情页
- 鼠标悬停显示可点击样式

---

### Task 6: 添加样式和优化（样式和性能优化）

**估算时间:** 1小时  
**关联AC:** AC8

#### Subtask 6.1: 添加Markdown样式

**文件:** `src/renderer/src/assets/markdown.css`

```css
/* Markdown内容样式 */
.markdown-body {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.85);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.markdown-body h1 {
  font-size: 24px;
}

.markdown-body h2 {
  font-size: 20px;
}

.markdown-body h3 {
  font-size: 16px;
}

.markdown-body p {
  margin-bottom: 16px;
}

.markdown-body code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-body pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 24px;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-bottom: 8px;
}

.markdown-body blockquote {
  border-left: 4px solid #1890ff;
  padding-left: 16px;
  margin: 16px 0;
  color: rgba(0, 0, 0, 0.65);
}
```

在`KnowledgeInfo.tsx`中导入：

```typescript
import '../assets/markdown.css'
```

#### Subtask 6.2: 响应式布局优化

确保所有组件在不同屏幕尺寸下正常显示：

- 使用Ant Design的`Row`和`Col`的响应式props（`xs`, `sm`, `md`, `lg`）
- 详情页在移动端自动调整布局
- 统计卡片在小屏幕下堆叠显示

#### Subtask 6.3: 性能优化

```typescript
// 使用React.memo优化组件
export default React.memo(KnowledgeInfo)
export default React.memo(ReviewStatistics)
export default React.memo(ReviewTimeline)

// 使用useMemo缓存计算结果
const masteryLevel = useMemo(() => getMasteryLevel(), [knowledge.status, statistics])

// 虚拟滚动（如果历史记录超过100条）
// 可在后续优化中添加react-window
```

**验证:**

- 页面加载时间 < 200ms
- 滚动流畅（60fps）
- 无内存泄漏
- 响应式布局正常

---

### Task 7: 手动测试和验证（测试和验证）

**估算时间:** 1小时  
**关联AC:** 所有AC

#### Subtask 7.1: 功能测试清单

**测试场景1: 详情页加载**

- [ ] 从列表点击知识点，正确跳转到详情页
- [ ] URL包含正确的知识点ID
- [ ] 基本信息正确显示（标题、内容、标签、分类）
- [ ] Markdown内容正确渲染（代码块、列表、引用等）
- [ ] 加载时间 < 200ms

**测试场景2: 复习统计显示**

- [ ] 未复习的知识点显示"尚未开始"
- [ ] 已复习的知识点显示正确的复习次数
- [ ] 最后复习时间正确显示
- [ ] 下次复习时间正确显示（包括过期标红）
- [ ] 当前掌握度计算准确

**测试场景3: 复习历史时间轴**

- [ ] 复习历史按时间倒序显示（最新在前）
- [ ] 每条记录显示评分表情和颜色
- [ ] 时间差计算准确（提前/延后/按时）
- [ ] "加载更多"功能正常（超过10条记录）
- [ ] 无复习历史时显示空状态和"开始复习"按钮

**测试场景4: 复习频率调整**

- [ ] 点击"调整复习频率"按钮打开对话框
- [ ] Slider默认值为当前频率系数
- [ ] 拖动Slider，影响说明动态更新
- [ ] 点击"保存"，数据库正确更新
- [ ] 下次复习时间立即重新计算（如果适用）
- [ ] 显示"复习频率已更新"提示
- [ ] 点击"取消"，不保存更改

**测试场景5: 页面操作按钮**

- [ ] "返回列表"按钮正确跳转到列表页
- [ ] "编辑"按钮打开编辑对话框
- [ ] "删除"按钮显示确认对话框，确认后删除并跳转
- [ ] "开始复习"按钮显示"敬请期待"提示

**测试场景6: 错误处理**

- [ ] 不存在的知识点ID显示"知识点不存在"
- [ ] 网络错误显示友好错误提示和"重试"按钮
- [ ] 保存频率系数失败显示错误提示

**测试场景7: 性能测试**

- [ ] 1000+条复习历史记录流畅加载
- [ ] 长Markdown内容渲染流畅
- [ ] 页面滚动流畅（60fps）
- [ ] 无内存泄漏（打开关闭多次详情页）

#### Subtask 7.2: 跨平台测试

- [ ] Windows环境测试所有功能
- [ ] macOS环境测试所有功能（如果可用）
- [ ] 不同分辨率下UI正常显示

#### Subtask 7.3: 回归测试

- [ ] 列表页功能不受影响
- [ ] 搜索和筛选功能正常
- [ ] 编辑和删除功能正常
- [ ] 标签和分类功能正常

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
    "dayjs": "^1.x",
    "react-markdown": "^9.x"
  }
}
```

### 关键API文档

- **Ant Design Components:**
  - Card: https://ant.design/components/card
  - Timeline: https://ant.design/components/timeline
  - Slider: https://ant.design/components/slider
  - Statistic: https://ant.design/components/statistic
  - Modal: https://ant.design/components/modal

- **React Router:**
  - useParams: https://reactrouter.com/en/main/hooks/use-params
  - useNavigate: https://reactrouter.com/en/main/hooks/use-navigate

- **dayjs:**
  - Format: https://day.js.org/docs/en/display/format
  - From Now: https://day.js.org/docs/en/display/from-now
  - Relative Time: https://day.js.org/docs/en/plugin/relative-time

- **react-markdown:**
  - https://github.com/remarkjs/react-markdown

---

## 🔍 代码审查要点

### 必须检查项

- [ ] **TypeScript类型安全**
  - 所有函数参数和返回值有类型定义
  - 无`any`类型（除非必要且有注释说明）
  - Store状态类型完整

- [ ] **命名规范**
  - 组件名使用PascalCase
  - 变量和函数使用camelCase
  - 文件名与组件名一致
  - IPC通道符合`{实体}:{操作}`格式

- [ ] **错误处理**
  - 所有async函数有try-catch
  - 错误日志记录完整
  - 用户友好的错误提示
  - 网络错误提供"重试"选项

- [ ] **性能优化**
  - 组件使用React.memo（必要时）
  - 计算结果使用useMemo缓存
  - Store使用选择性订阅
  - 长列表考虑虚拟滚动

- [ ] **数据一致性**
  - Store更新后UI立即响应
  - 多个数据源保持同步（详情和列表）
  - 路由参数正确传递

- [ ] **UI/UX规范**
  - 加载状态显示Spin组件
  - 空状态显示Empty组件
  - 操作按钮有明确icon和文字
  - 危险操作（删除）有确认对话框

---

## 🚨 常见陷阱和注意事项

### 1. 数据同步问题

**问题:** 详情页更新后，列表页数据未更新

**解决方案:**

```typescript
// 在updateReviewFrequency中同时更新列表
const { knowledgeList } = get()
const updatedList = knowledgeList.map((k) => (k.id === id ? response.data : k))
set({ knowledgeList: updatedList })
```

### 2. 路由参数类型问题

**问题:** `useParams`返回的id可能是undefined

**解决方案:**

```typescript
const { id } = useParams<{ id: string }>()

useEffect(() => {
  if (id) {
    // ✅ 检查id存在
    fetchKnowledgeDetail(id)
  }
}, [id])
```

### 3. 组件卸载时清理状态

**问题:** 用户快速切换详情页，前一个页面的数据残留

**解决方案:**

```typescript
useEffect(() => {
  // ...加载数据

  return () => {
    clearDetail() // ✅ 卸载时清理
  }
}, [id])
```

### 4. Markdown渲染性能

**问题:** 长Markdown内容渲染卡顿

**解决方案:**

```typescript
// 使用React.memo包裹Markdown组件
const MarkdownContent = React.memo(({ content }) => (
  <ReactMarkdown>{content}</ReactMarkdown>
))
```

### 5. 时间格式国际化

**问题:** dayjs默认英文显示

**解决方案:**

```typescript
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn') // ✅ 设置中文
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
- [ ] 性能测试通过（响应时间 < 200ms）
- [ ] 边界情况测试（空数据、大数据量）

### 文档完成

- [ ] 代码注释完整（关键逻辑有说明）
- [ ] 组件Props有JSDoc注释
- [ ] README更新（如有新的使用说明）

### 集成完成

- [ ] 与Story 2.1/2.2/2.3功能正常集成
- [ ] 路由配置正确
- [ ] Store状态管理正常
- [ ] IPC通信正常

### 性能验证

- [ ] 详情页加载 < 200ms
- [ ] 复习历史加载 < 100ms
- [ ] 频率调整保存 < 100ms
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
   - 危险操作有确认对话框

5. **标签和分类集成（从Story 2.2）**
   - 标签点击可筛选
   - 分类显示可点击
   - TagInput和CategorySelect组件可复用

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
   - 列表 >50 项使用虚拟滚动
   - 重计算使用useMemo缓存

5. **日志规范（强制）**
   - info级别：所有CRUD操作
   - error级别：所有错误
   - 结构化日志（对象格式）

---

## 🎯 后续Story准备

Story 2.4完成后，为Epic 3（智能复习系统）准备的基础：

1. **ReviewRepository已实现** - 复习历史查询方法完整
2. **复习统计数据结构** - ReviewStatistics接口定义
3. **复习历史UI组件** - ReviewTimeline可复用
4. **评分表情映射** - 1-5分对应😟🤔😐😊🎯已实现
5. **复习频率系数调整** - 为Epic 3的算法集成做准备

---

**预估总时间:** 8小时  
**建议实施顺序:** Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7

**关键里程碑:**

- Task 1-3完成: 数据层和Store层完成，可测试IPC通信
- Task 4完成: UI完整呈现，可进行视觉验证
- Task 7完成: 所有AC通过，Story完成

---

_本实施指南由SM Agent生成，基于Epic 2定义、PRD需求、架构文档和项目上下文规则。_

**Story Status:** ready-for-dev  
**生成时间:** 2025-12-14  
**下一步:** 由Dev Agent执行 `dev-story` 工作流开始实施



