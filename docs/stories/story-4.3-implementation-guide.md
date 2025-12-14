# Story 4.3: 今日摘要和每日统计 - 实施指南

**Story ID:** 4.3  
**Epic:** Epic 4 - 日历可视化与统计  
**优先级:** P0  
**预估工作量:** 5 Story Points  
**状态:** ready-for-dev

---

## 📋 Story 概述

### 用户故事

As a **学习者**,  
I want **快速了解今日学习情况**,  
So that **我可以掌握每日进度和成就感**.

### 业务价值

今日摘要功能是用户每天打开应用时的第一印象，通过直观的数据展示让用户：

- 快速了解今日学习进度
- 建立学习成就感和动力
- 便捷地进入核心功能（复习、查看知识点）
- 通过统计数据了解长期学习趋势

这是产品"温暖、友好、激励"体验的关键组成部分。

---

## ✅ 验收标准

### AC1: 主页今日摘要卡片

**Given** 用户打开应用主页  
**When** 页面加载完成  
**Then** 页面顶部显示今日摘要卡片，包含：

- 今日日期（格式：2025年12月14日 星期六）
- 新增知识点数量
- 待复习知识点数量
- 已完成复习数量
- 复习完成率进度条
- "开始复习"快捷按钮

**And** 卡片设计美观，使用 Ant Design 卡片组件  
**And** 数据实时从数据库获取

### AC2: 摘要卡片交互

**When** 用户点击摘要卡片的不同区域  
**Then** 跳转到对应页面：

- 点击"新增 X 个" → 跳转到知识点列表，筛选今日新增
- 点击"待复习 X 个" → 跳转到复习任务列表
- 点击"已完成 X 个" → 跳转到今日完成列表（复习历史）
- 点击"开始复习"按钮 → 跳转到复习会话页面

### AC3: 详细统计页面

**When** 用户在左侧导航点击"统计"  
**Then** 显示详细统计页面，包含：

**基础统计卡片：**

- 知识点总数
- 已掌握数量和占比
- 连续学习天数（当前/最长）
- 平均复习完成率

**本周统计图表：**

- 每日新增知识点数量（柱状图）
- 每日复习数量（柱状图）
- 每日完成率（折线图）

**本月统计图表：**

- 月度新增知识点趋势
- 月度复习次数趋势

**And** 使用 Ant Design Charts 或类似图表库实现可视化  
**And** 数据实时更新

### AC4: 性能要求

**Then** 今日摘要数据加载时间 < 200ms  
**And** 统计页面数据加载时间 < 500ms  
**And** 图表渲染流畅，无卡顿

---

## 🏗️ 技术实现指南

### 架构层次概览

本 Story 涉及以下架构层次：

```
1. 数据层（Main Process）
   └─ Repository: KnowledgeRepository, ReviewRepository（已存在，可能需扩展）

2. Service 层（Main Process）
   └─ StatisticsService（已存在于 Story 4.1，需扩展）

3. IPC 层（Main Process & Preload）
   └─ statisticsHandlers.ts（已存在，需扩展）
   └─ preload/index.ts（扩展API）

4. 状态管理层（Renderer Process）
   └─ statisticsStore.ts（新建）

5. UI 层（Renderer Process）
   └─ components/TodaySummaryCard.tsx（新建）
   └─ pages/StatisticsPage.tsx（新建）
```

---

## 📂 需要创建/修改的文件

### 1. 数据层 - Repository 扩展（如需要）

**文件：** `src/main/database/repositories/KnowledgeRepository.ts`  
**文件：** `src/main/database/repositories/ReviewRepository.ts`

**可能需要的新方法：**

```typescript
// KnowledgeRepository.ts
class KnowledgeRepository {
  // 获取今日新增知识点数量
  countCreatedToday(): number {
    const todayStart = dayjs().startOf('day').valueOf()
    const todayEnd = dayjs().endOf('day').valueOf()

    const result = this.db
      .prepare('SELECT COUNT(*) as count FROM knowledge WHERE created_at >= ? AND created_at <= ?')
      .get(todayStart, todayEnd)
    return result.count
  }

  // 获取已掌握的知识点数量
  countMastered(): number {
    const result = this.db
      .prepare('SELECT COUNT(*) as count FROM knowledge WHERE mastery_status = ?')
      .get('mastered')
    return result.count
  }

  // 获取连续学习天数
  getStreakDays(): { current: number; longest: number } {
    // 实现逻辑：查询每天是否有新增知识点或复习记录
    // 返回当前连续天数和最长连续天数
  }
}

// ReviewRepository.ts
class ReviewRepository {
  // 获取今日复习数量
  countReviewedToday(): number {
    const todayStart = dayjs().startOf('day').valueOf()
    const todayEnd = dayjs().endOf('day').valueOf()

    const result = this.db
      .prepare(
        'SELECT COUNT(*) as count FROM review_history WHERE reviewed_at >= ? AND reviewed_at <= ?'
      )
      .get(todayStart, todayEnd)
    return result.count
  }

  // 获取本周每日统计
  getWeeklyStats(): Array<{ date: string; count: number }> {
    // 返回最近7天每天的复习数量
  }

  // 获取平均复习完成率
  getAverageCompletionRate(): number {
    // 计算平均每日复习完成率
  }
}
```

**命名规范提醒：**

- 数据库列名使用 `snake_case`
- TypeScript 方法和变量使用 `camelCase`
- Repository 方法负责命名转换

---

### 2. Service 层 - 扩展 StatisticsService

**文件：** `src/main/services/StatisticsService.ts`（已存在于 Story 4.1）

**扩展方法：**

```typescript
export interface TodaySummary {
  date: string // 今日日期
  newKnowledgeCount: number // 新增知识点数量
  pendingReviewCount: number // 待复习数量
  completedReviewCount: number // 已完成复习数量
  completionRate: number // 完成率 (0-100)
}

export interface OverallStatistics {
  totalKnowledge: number // 知识点总数
  masteredKnowledge: number // 已掌握数量
  masteredPercentage: number // 掌握百分比
  currentStreak: number // 当前连续学习天数
  longestStreak: number // 最长连续学习天数
  averageCompletionRate: number // 平均复习完成率
}

export interface WeeklyStats {
  dates: string[] // 日期数组（最近7天）
  newKnowledge: number[] // 每日新增知识点数量
  reviews: number[] // 每日复习数量
  completionRates: number[] // 每日完成率
}

class StatisticsService {
  private knowledgeRepo: KnowledgeRepository
  private reviewRepo: ReviewRepository

  constructor(db: Database) {
    this.knowledgeRepo = new KnowledgeRepository(db)
    this.reviewRepo = new ReviewRepository(db)
  }

  // 获取今日摘要
  getTodaySummary(): TodaySummary {
    const newKnowledgeCount = this.knowledgeRepo.countCreatedToday()
    const pendingReviewCount = this.knowledgeRepo.countDueToday() // 假设已有方法
    const completedReviewCount = this.reviewRepo.countReviewedToday()
    const completionRate =
      pendingReviewCount > 0
        ? (completedReviewCount / (pendingReviewCount + completedReviewCount)) * 100
        : 0

    return {
      date: dayjs().format('YYYY年MM月DD日 dddd'),
      newKnowledgeCount,
      pendingReviewCount,
      completedReviewCount,
      completionRate: Math.round(completionRate)
    }
  }

  // 获取总体统计
  getOverallStatistics(): OverallStatistics {
    const totalKnowledge = this.knowledgeRepo.count()
    const masteredKnowledge = this.knowledgeRepo.countMastered()
    const masteredPercentage = totalKnowledge > 0 ? (masteredKnowledge / totalKnowledge) * 100 : 0
    const { current, longest } = this.knowledgeRepo.getStreakDays()
    const averageCompletionRate = this.reviewRepo.getAverageCompletionRate()

    return {
      totalKnowledge,
      masteredKnowledge,
      masteredPercentage: Math.round(masteredPercentage),
      currentStreak: current,
      longestStreak: longest,
      averageCompletionRate: Math.round(averageCompletionRate)
    }
  }

  // 获取本周统计
  getWeeklyStatistics(): WeeklyStats {
    // 实现逻辑：获取最近7天的每日统计
    const dates = []
    const newKnowledge = []
    const reviews = []
    const completionRates = []

    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      dates.push(date.format('MM/DD'))

      // 获取该天的统计数据
      const dayStats = this.getDayStatistics(date.valueOf())
      newKnowledge.push(dayStats.newKnowledgeCount)
      reviews.push(dayStats.reviewCount)
      completionRates.push(dayStats.completionRate)
    }

    return { dates, newKnowledge, reviews, completionRates }
  }

  // 获取某一天的统计（内部方法）
  private getDayStatistics(timestamp: number): any {
    // 实现逻辑
  }
}
```

---

### 3. IPC 层 - 扩展通道和处理器

**文件：** `src/main/ipc/statisticsHandlers.ts`（已存在）

**扩展 IPC 通道：**

```typescript
import { ipcMain } from 'electron'
import { StatisticsService } from '../services/StatisticsService'
import { getDatabaseInstance } from '../database/connection'
import log from '../utils/logger'

export function registerStatisticsHandlers() {
  const db = getDatabaseInstance()
  const statisticsService = new StatisticsService(db)

  // 获取今日摘要
  ipcMain.handle('statistics:getTodaySummary', async () => {
    try {
      log.info('IPC: statistics:getTodaySummary called')
      const summary = statisticsService.getTodaySummary()
      return { data: summary }
    } catch (error) {
      log.error('Failed to get today summary:', error)
      throw error
    }
  })

  // 获取总体统计
  ipcMain.handle('statistics:getOverallStatistics', async () => {
    try {
      log.info('IPC: statistics:getOverallStatistics called')
      const stats = statisticsService.getOverallStatistics()
      return { data: stats }
    } catch (error) {
      log.error('Failed to get overall statistics:', error)
      throw error
    }
  })

  // 获取本周统计
  ipcMain.handle('statistics:getWeeklyStatistics', async () => {
    try {
      log.info('IPC: statistics:getWeeklyStatistics called')
      const stats = statisticsService.getWeeklyStatistics()
      return { data: stats }
    } catch (error) {
      log.error('Failed to get weekly statistics:', error)
      throw error
    }
  })
}
```

**IPC 通道命名规范：**

- 格式：`{实体}:{操作}`
- 使用 camelCase
- 例如：`statistics:getTodaySummary`

---

### 4. Preload 层 - 扩展 API

**文件：** `src/preload/index.ts`

**扩展 Context Bridge API：**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // ... 现有 API ...

  statistics: {
    getTodaySummary: () => ipcRenderer.invoke('statistics:getTodaySummary'),
    getOverallStatistics: () => ipcRenderer.invoke('statistics:getOverallStatistics'),
    getWeeklyStatistics: () => ipcRenderer.invoke('statistics:getWeeklyStatistics')
  }
})
```

**文件：** `src/preload/index.d.ts`

**类型定义：**

```typescript
interface TodaySummary {
  date: string
  newKnowledgeCount: number
  pendingReviewCount: number
  completedReviewCount: number
  completionRate: number
}

interface OverallStatistics {
  totalKnowledge: number
  masteredKnowledge: number
  masteredPercentage: number
  currentStreak: number
  longestStreak: number
  averageCompletionRate: number
}

interface WeeklyStats {
  dates: string[]
  newKnowledge: number[]
  reviews: number[]
  completionRates: number[]
}

interface ElectronAPI {
  // ... 现有 API ...

  statistics: {
    getTodaySummary: () => Promise<{ data: TodaySummary }>
    getOverallStatistics: () => Promise<{ data: OverallStatistics }>
    getWeeklyStatistics: () => Promise<{ data: WeeklyStats }>
  }
}
```

---

### 5. 状态管理层 - 创建 StatisticsStore

**文件：** `src/renderer/src/stores/statisticsStore.ts`（新建）

```typescript
import { create } from 'zustand'
import { TodaySummary, OverallStatistics, WeeklyStats } from '../types'

interface StatisticsStore {
  // 今日摘要
  todaySummary: TodaySummary | null
  todaySummaryLoading: boolean
  todaySummaryError: Error | null

  // 总体统计
  overallStatistics: OverallStatistics | null
  overallStatisticsLoading: boolean
  overallStatisticsError: Error | null

  // 本周统计
  weeklyStatistics: WeeklyStats | null
  weeklyStatisticsLoading: boolean
  weeklyStatisticsError: Error | null

  // Actions
  fetchTodaySummary: () => Promise<void>
  fetchOverallStatistics: () => Promise<void>
  fetchWeeklyStatistics: () => Promise<void>
  refreshAllStatistics: () => Promise<void>
}

export const useStatisticsStore = create<StatisticsStore>((set) => ({
  // 初始状态
  todaySummary: null,
  todaySummaryLoading: false,
  todaySummaryError: null,

  overallStatistics: null,
  overallStatisticsLoading: false,
  overallStatisticsError: null,

  weeklyStatistics: null,
  weeklyStatisticsLoading: false,
  weeklyStatisticsError: null,

  // Actions
  fetchTodaySummary: async () => {
    set({ todaySummaryLoading: true, todaySummaryError: null })
    try {
      const response = await window.api.statistics.getTodaySummary()
      set({
        todaySummary: response.data,
        todaySummaryLoading: false
      })
    } catch (error) {
      set({
        todaySummaryError: error as Error,
        todaySummaryLoading: false
      })
      console.error('Failed to fetch today summary:', error)
    }
  },

  fetchOverallStatistics: async () => {
    set({ overallStatisticsLoading: true, overallStatisticsError: null })
    try {
      const response = await window.api.statistics.getOverallStatistics()
      set({
        overallStatistics: response.data,
        overallStatisticsLoading: false
      })
    } catch (error) {
      set({
        overallStatisticsError: error as Error,
        overallStatisticsLoading: false
      })
      console.error('Failed to fetch overall statistics:', error)
    }
  },

  fetchWeeklyStatistics: async () => {
    set({ weeklyStatisticsLoading: true, weeklyStatisticsError: null })
    try {
      const response = await window.api.statistics.getWeeklyStatistics()
      set({
        weeklyStatistics: response.data,
        weeklyStatisticsLoading: false
      })
    } catch (error) {
      set({
        weeklyStatisticsError: error as Error,
        weeklyStatisticsLoading: false
      })
      console.error('Failed to fetch weekly statistics:', error)
    }
  },

  refreshAllStatistics: async () => {
    const { fetchTodaySummary, fetchOverallStatistics, fetchWeeklyStatistics } =
      useStatisticsStore.getState()
    await Promise.all([fetchTodaySummary(), fetchOverallStatistics(), fetchWeeklyStatistics()])
  }
}))
```

---

### 6. UI 层 - 今日摘要卡片组件

**文件：** `src/renderer/src/components/TodaySummaryCard.tsx`（新建）

```typescript
import React, { useEffect } from 'react';
import { Card, Row, Col, Progress, Button, Statistic, Spin } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStatisticsStore } from '../stores/statisticsStore';

export const TodaySummaryCard: React.FC = () => {
  const navigate = useNavigate();
  const {
    todaySummary,
    todaySummaryLoading,
    fetchTodaySummary
  } = useStatisticsStore();

  useEffect(() => {
    fetchTodaySummary();
  }, [fetchTodaySummary]);

  if (todaySummaryLoading) {
    return (
      <Card>
        <Spin tip="加载今日摘要..." />
      </Card>
    );
  }

  if (!todaySummary) {
    return null;
  }

  return (
    <Card
      title={
        <span>
          <CalendarOutlined /> {todaySummary.date}
        </span>
      }
      extra={
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => navigate('/review')}
        >
          开始复习
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="新增知识点"
            value={todaySummary.newKnowledgeCount}
            suffix="个"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600', cursor: 'pointer' }}
            onClick={() => navigate('/knowledge?filter=today')}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="待复习"
            value={todaySummary.pendingReviewCount}
            suffix="个"
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#cf1322', cursor: 'pointer' }}
            onClick={() => navigate('/review')}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已完成"
            value={todaySummary.completedReviewCount}
            suffix="个"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => navigate('/review/history?date=today')}
          />
        </Col>
        <Col span={6}>
          <div>
            <div style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
              复习完成率
            </div>
            <Progress
              type="circle"
              percent={todaySummary.completionRate}
              width={80}
            />
          </div>
        </Col>
      </Row>
    </Card>
  );
};
```

---

### 7. UI 层 - 统计页面

**文件：** `src/renderer/src/pages/StatisticsPage.tsx`（新建）

```typescript
import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { Column, Line } from '@ant-design/charts';
import { TrophyOutlined, CheckCircleOutlined, FireOutlined, PercentageOutlined } from '@ant-design/icons';
import { useStatisticsStore } from '../stores/statisticsStore';

export const StatisticsPage: React.FC = () => {
  const {
    overallStatistics,
    overallStatisticsLoading,
    weeklyStatistics,
    weeklyStatisticsLoading,
    fetchOverallStatistics,
    fetchWeeklyStatistics
  } = useStatisticsStore();

  useEffect(() => {
    fetchOverallStatistics();
    fetchWeeklyStatistics();
  }, [fetchOverallStatistics, fetchWeeklyStatistics]);

  if (overallStatisticsLoading || weeklyStatisticsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载统计数据..." />
      </div>
    );
  }

  // 本周新增知识点图表配置
  const weeklyNewKnowledgeConfig = {
    data: weeklyStatistics?.dates.map((date, index) => ({
      date,
      value: weeklyStatistics.newKnowledge[index]
    })) || [],
    xField: 'date',
    yField: 'value',
    label: {
      position: 'top',
      style: { fill: '#000000' }
    },
    xAxis: { label: { autoRotate: false } },
    meta: {
      date: { alias: '日期' },
      value: { alias: '新增数量' }
    }
  };

  // 本周复习数量图表配置
  const weeklyReviewsConfig = {
    data: weeklyStatistics?.dates.map((date, index) => ({
      date,
      value: weeklyStatistics.reviews[index]
    })) || [],
    xField: 'date',
    yField: 'value',
    label: {
      position: 'top',
      style: { fill: '#000000' }
    },
    color: '#52c41a'
  };

  // 本周完成率折线图配置
  const weeklyCompletionRateConfig = {
    data: weeklyStatistics?.dates.map((date, index) => ({
      date,
      value: weeklyStatistics.completionRates[index]
    })) || [],
    xField: 'date',
    yField: 'value',
    point: { size: 5, shape: 'circle' },
    label: {
      style: { fill: '#000000' }
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${v}%`
      }
    },
    color: '#1890ff'
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>学习统计</h1>

      {/* 总体统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="知识点总数"
              value={overallStatistics?.totalKnowledge}
              prefix={<TrophyOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已掌握"
              value={overallStatistics?.masteredKnowledge}
              suffix={`个 (${overallStatistics?.masteredPercentage}%)`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="连续学习天数"
              value={overallStatistics?.currentStreak}
              suffix={`天 (最长 ${overallStatistics?.longestStreak} 天)`}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均完成率"
              value={overallStatistics?.averageCompletionRate}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 本周统计图表 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="本周新增知识点">
            <Column {...weeklyNewKnowledgeConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="本周复习数量">
            <Column {...weeklyReviewsConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="本周复习完成率">
            <Line {...weeklyCompletionRateConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

---

### 8. 集成到主页和路由

**文件：** `src/renderer/src/pages/HomePage.tsx`（可能需要创建或修改）

```typescript
import React from 'react';
import { TodaySummaryCard } from '../components/TodaySummaryCard';
// ... 其他导入

export const HomePage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      {/* 今日摘要卡片 */}
      <TodaySummaryCard />

      {/* 其他主页内容 */}
      {/* 例如：快捷入口、最近复习的知识点等 */}
    </div>
  );
};
```

**文件：** `src/renderer/src/App.tsx`（添加统计页面路由）

```typescript
import { StatisticsPage } from './pages/StatisticsPage';

// 在路由配置中添加
<Route path="/statistics" element={<StatisticsPage />} />
```

---

## 🎨 UI/UX 设计要点

### 设计原则

根据 UX 设计规范，本功能应遵循以下原则：

1. **温暖友好**
   - 使用圆角卡片设计
   - 适当的阴影和间距
   - 使用表情符号和图标增强亲和力

2. **信息清晰**
   - 重要数据突出显示
   - 使用合理的颜色区分不同状态
   - 避免信息过载

3. **交互便捷**
   - 点击统计数据可直接跳转详情
   - 快捷按钮明显且易于点击
   - 加载状态清晰反馈

### 颜色使用

- 主色（Primary）：`#1890ff`（Ant Design 默认蓝色）
- 成功色（Success）：`#52c41a`（绿色，用于已完成、已掌握）
- 警告色（Warning）：`#faad14`（黄色，用于待复习）
- 错误色（Error）：`#f5222d`（红色，用于逾期未复习）

### 图表选择

- **柱状图（Column Chart）**：用于展示每日数量（新增、复习）
- **折线图（Line Chart）**：用于展示趋势（完成率）
- **进度条（Progress）**：用于展示百分比（完成率）
- **统计卡片（Statistic）**：用于展示单个指标

---

## 📊 数据流图

```
用户打开主页
    ↓
HomePage 组件渲染
    ↓
TodaySummaryCard 组件 useEffect
    ↓
statisticsStore.fetchTodaySummary()
    ↓
window.api.statistics.getTodaySummary()
    ↓
IPC: statistics:getTodaySummary
    ↓
StatisticsService.getTodaySummary()
    ↓
KnowledgeRepository.countCreatedToday()
ReviewRepository.countReviewedToday()
    ↓
SQLite 数据库查询
    ↓
返回数据 → IPC → Store → UI 更新
```

---

## ✅ 实施检查清单

### 数据层

- [ ] 扩展 KnowledgeRepository 添加统计方法
- [ ] 扩展 ReviewRepository 添加统计方法
- [ ] 实现连续学习天数计算逻辑
- [ ] 测试数据库查询性能（< 100ms）

### Service 层

- [ ] 创建/扩展 StatisticsService
- [ ] 实现 getTodaySummary 方法
- [ ] 实现 getOverallStatistics 方法
- [ ] 实现 getWeeklyStatistics 方法
- [ ] 添加单元测试

### IPC 层

- [ ] 扩展 statisticsHandlers.ts
- [ ] 注册新的 IPC 通道
- [ ] 扩展 preload API
- [ ] 更新 TypeScript 类型定义
- [ ] 测试 IPC 通信

### 状态管理层

- [ ] 创建 statisticsStore.ts
- [ ] 实现所有 fetch 方法
- [ ] 实现错误处理
- [ ] 测试状态更新

### UI 层

- [ ] 创建 TodaySummaryCard 组件
- [ ] 创建 StatisticsPage 组件
- [ ] 安装图表库（@ant-design/charts）
- [ ] 实现图表配置
- [ ] 实现点击跳转逻辑
- [ ] 实现加载状态
- [ ] 实现错误状态
- [ ] 响应式布局适配

### 集成

- [ ] 集成 TodaySummaryCard 到主页
- [ ] 添加统计页面路由
- [ ] 更新左侧导航菜单（添加统计入口）
- [ ] 测试页面跳转逻辑

### 测试

- [ ] 手动测试所有 AC
- [ ] 测试数据加载性能
- [ ] 测试错误场景
- [ ] 跨平台测试（Windows/macOS）

### 文档

- [ ] 更新 README（如有新依赖）
- [ ] 代码注释完整
- [ ] 技术决策记录

---

## 🚀 实施步骤建议

### 第1步：安装依赖

```bash
# 安装图表库
pnpm add @ant-design/charts
```

### 第2步：数据层和 Service 层（2-3小时）

1. 扩展 Repository 方法
2. 创建/扩展 StatisticsService
3. 编写单元测试

### 第3步：IPC 层（30分钟）

1. 扩展 IPC 处理器
2. 更新 preload API
3. 更新类型定义

### 第4步：状态管理层（30分钟）

1. 创建 statisticsStore
2. 实现所有 actions

### 第5步：UI 组件（2-3小时）

1. 创建 TodaySummaryCard
2. 创建 StatisticsPage
3. 配置图表

### 第6步：集成和测试（1-2小时）

1. 集成到主页和路由
2. 手动测试所有功能
3. 性能测试
4. 错误处理测试

---

## ⚠️ 注意事项

### 架构遵循

- **严格遵循** 项目架构中的命名规范
- **严格遵循** Repository 模式，不要在 Service 层直接写 SQL
- **严格遵循** IPC 通道命名规范：`{实体}:{操作}`
- **严格遵循** 错误处理模式：try-catch + 日志 + 用户提示

### 性能优化

- 使用 React.memo 优化组件渲染
- 图表数据使用 useMemo 缓存
- 避免不必要的 re-render
- 考虑防抖处理（如果有频繁刷新需求）

### 错误处理

- 所有 API 调用都要 try-catch
- 显示友好的错误消息
- 记录错误日志
- 提供重试机制

### 数据一致性

- 确保今日摘要数据与其他页面一致
- 知识点增删改查后及时刷新统计
- 复习完成后及时更新摘要

---

## 🔗 相关文档

- **Epic 文档**: `docs/stories/epic-4-calendar.md`
- **PRD**: `docs/prd.md`（需求 FR44-FR49）
- **架构文档**: `docs/architecture.md`
- **UX 设计**: `docs/ux-design-specification.md`
- **已完成 Story**:
  - Story 4.1（日历热力图基础）
  - Story 4.2（多视图切换）

---

## 🎯 验收测试场景

### 场景 1：首次打开应用

1. 启动应用
2. 查看主页今日摘要卡片
3. **期望**：显示今日日期、各项统计数据（可能为 0）、进度条

### 场景 2：新增知识点后

1. 创建一个新知识点
2. 返回主页
3. **期望**：今日摘要中"新增知识点"数量 +1

### 场景 3：完成复习后

1. 完成一次复习
2. 返回主页
3. **期望**：今日摘要中"已完成"数量 +1，完成率更新

### 场景 4：点击跳转

1. 点击今日摘要卡片中的"待复习 X 个"
2. **期望**：跳转到复习任务列表页面

### 场景 5：查看详细统计

1. 点击左侧导航的"统计"
2. **期望**：显示详细统计页面，包含总体统计、本周图表
3. **期望**：图表数据正确，无报错

### 场景 6：性能测试

1. 记录 100 个知识点，完成 50 次复习
2. 打开主页查看今日摘要
3. **期望**：数据加载时间 < 200ms
4. 打开统计页面
5. **期望**：数据加载时间 < 500ms

---

## 📈 预估工作量

- **数据层和 Service 层**: 2-3 小时
- **IPC 层**: 30 分钟
- **状态管理层**: 30 分钟
- **UI 组件**: 2-3 小时
- **集成和测试**: 1-2 小时
- **总计**: **6-9 小时**

---

## ✅ 完成标准（DoD）

- [ ] 所有验收标准通过测试
- [ ] TypeScript 编译无错误
- [ ] ESLint 检查通过
- [ ] 代码注释完整
- [ ] 性能要求达标（加载时间 < 500ms）
- [ ] 手动测试通过所有场景
- [ ] 代码已提交到版本控制
- [ ] 应用可正常启动和运行

---

**🎉 祝实施顺利！如有问题，请参考架构文档或咨询 Architect。**



