# Story 4.1 实现指南：日历热力图基础

**Story ID:** 4.1  
**Story Title:** 日历热力图基础  
**Epic:** Epic 4 - 日历可视化与统计  
**优先级:** P0  
**Story Points:** 8  
**预估时间:** 10小时  
**依赖:** Story 2.1, Story 2.4, Story 3.1, Story 3.2

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **通过日历热力图查看学习活动**,  
So that **我可以直观了解学习频率和坚持情况**.

### 业务价值

- 提供直观的可视化界面，展示学习轨迹和活跃度
- 通过热力图颜色编码，快速识别学习频率高低的时期
- 支持日期点击查看详细活动，提升数据可探索性
- 增强学习成就感和持续动力
- 为后续的多视图切换和统计分析功能奠定基础

### 业务需求覆盖

- **FR19**: 显示当月日历视图，每个日期显示新增和复习数量
- **FR20**: 使用热力图颜色表示活动频率
- **FR21**: 悬停显示详细数据
- **FR22**: 点击日期查看该日详情
- **NFR-U2**: 操作效率要求（快速访问）
- **NFR-P1**: UI响应时间 ≤ 200ms

---

## 📐 技术设计

### 架构层次

```
UI层（Renderer）
├── CalendarPage.tsx                  # 【新建】日历主页面
│   ├── CalendarHeatmap.tsx           # 【新建】热力图组件
│   ├── DateTooltip.tsx               # 【新建】悬停提示组件
│   └── DaySidebar.tsx                # 【新建】日期详情侧边栏
│
├── components/
│   ├── DayActivityList.tsx           # 【新建】日期活动列表
│   └── HeatmapLegend.tsx             # 【新建】热力图图例
│
Store层（Zustand）
├── calendarStore.ts                  # 【新建】日历状态管理
│   ├── selectedDate                   # 当前选中日期
│   ├── monthActivities                # 月度活动数据
│   ├── fetchMonthActivities()         # 获取月度数据
│   └── selectDate()                   # 选择日期
│
Service层（Main）
├── StatisticsService.ts              # 【新建】统计服务
│   ├── getMonthActivities()           # 获取月度活动统计
│   ├── getDayActivities()             # 获取单日活动详情
│   └── calculateHeatmapData()         # 计算热力图数据
│
IPC层
├── src/common/ipc-channels.ts        # 【扩展】新增统计通道
├── src/main/ipc/statisticsHandlers.ts # 【新建】统计处理器
└── src/preload/index.ts              # 【扩展】暴露统计API
│
数据层（Repository）
├── KnowledgeRepository.ts            # 【扩展】统计查询
│   ├── countByDateRange()             # 按日期范围统计
│   └── findByDate()                   # 按日期查询
│
└── ReviewRepository.ts               # 【扩展】复习统计
    ├── countByDateRange()             # 按日期范围统计
    └── findByDate()                   # 按日期查询复习记录
```

### 数据流

```
用户操作 → CalendarPage → calendarStore → IPC → StatisticsService
                                                    ↓
                                            Repository查询
                                                    ↓
                                    计算热力图数据 → 返回UI渲染
```

---

## ✅ Acceptance Criteria验收标准

### AC1: 日历热力图显示

- [x] 显示当月日历视图（标准月历布局，周一到周日）
- [x] 每个日期方块显示：
  - 日期数字
  - 背景颜色（根据活动数量）
  - 新增知识点数量（小字）
  - 完成复习数量（小字）
- [x] 热力图颜色分级（6级）：
  - 0个活动：浅灰色 (#f0f0f0)
  - 1-2个：极浅蓝 (#c6e3ff)
  - 3-5个：浅蓝 (#91d5ff)
  - 6-10个：中蓝 (#40a9ff)
  - 11-15个：深蓝 (#1890ff)
  - 16+个：极深蓝 (#096dd9)

### AC2: 悬停工具提示

- [x] 鼠标悬停在日期上时显示工具提示
- [x] 工具提示包含：
  - 日期（如"2025年12月14日"）
  - 新增知识点数量（如"新增 3 个知识点"）
  - 复习完成数量（如"复习 5 次"）
  - 总活动数量（如"总活动 8 次"）
- [x] 工具提示样式清晰，定位准确

### AC3: 点击日期查看详情

- [x] 点击日期后，右侧显示详情侧边栏
- [x] 侧边栏显示：
  - 日期标题
  - 该日新增的知识点列表（带标题、标签）
  - 该日复习的知识点列表（带标题、评分）
  - 如果无活动，显示"当日无活动"
- [x] 列表项可点击跳转到知识点详情页

### AC4: 月份切换

- [x] 页面顶部显示当前月份（如"2025年12月"）
- [x] 提供"上一月"和"下一月"按钮
- [x] 点击按钮切换月份，热力图数据自动更新
- [x] 月份切换动画流畅（< 300ms）

### AC5: 性能要求

- [x] 页面首次加载时间 < 1秒
- [x] 月份切换响应时间 < 300ms
- [x] 悬停提示显示延迟 < 100ms
- [x] 点击日期显示详情 < 200ms

### AC6: 数据准确性

- [x] 热力图数据与实际记录一致
- [x] 日期详情列表完整准确
- [x] 跨月边界处理正确（月初、月末）

---

## 🛠️ 实现任务分解

### 阶段1：数据层（2小时）

#### Task 1.1: 扩展Repository统计方法

**文件:** `src/main/database/repositories/KnowledgeRepository.ts`

```typescript
// 新增方法
export class KnowledgeRepository extends BaseRepository<Knowledge> {
  // ... 现有方法 ...

  /**
   * 按日期范围统计知识点数量
   * @param startDate 开始日期（YYYY-MM-DD）
   * @param endDate 结束日期（YYYY-MM-DD）
   * @returns 每日统计 { date: string, count: number }[]
   */
  countByDateRange(startDate: string, endDate: string): Array<{ date: string; count: number }> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM knowledge
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `
    return this.db.prepare(query).all(startDate, endDate) as Array<{ date: string; count: number }>
  }

  /**
   * 按日期查询知识点
   * @param date 日期（YYYY-MM-DD）
   * @returns 知识点列表
   */
  findByDate(date: string): Knowledge[] {
    const query = `
      SELECT * FROM knowledge
      WHERE DATE(created_at) = ?
      ORDER BY created_at DESC
    `
    const rows = this.db.prepare(query).all(date)
    return rows.map((row) => this.deserialize(row))
  }
}
```

**验证:**

- [ ] 测试 `countByDateRange` 返回正确的每日统计
- [ ] 测试 `findByDate` 返回指定日期的所有知识点
- [ ] 测试边界情况（空数据、跨月）

#### Task 1.2: 扩展ReviewRepository统计方法

**文件:** `src/main/database/repositories/ReviewRepository.ts`

```typescript
// 新增方法
export class ReviewRepository extends BaseRepository<ReviewHistory> {
  // ... 现有方法 ...

  /**
   * 按日期范围统计复习次数
   * @param startDate 开始日期（YYYY-MM-DD）
   * @param endDate 结束日期（YYYY-MM-DD）
   * @returns 每日统计 { date: string, count: number }[]
   */
  countByDateRange(startDate: string, endDate: string): Array<{ date: string; count: number }> {
    const query = `
      SELECT 
        DATE(reviewed_at) as date,
        COUNT(*) as count
      FROM review_history
      WHERE DATE(reviewed_at) BETWEEN ? AND ?
      GROUP BY DATE(reviewed_at)
      ORDER BY date
    `
    return this.db.prepare(query).all(startDate, endDate) as Array<{ date: string; count: number }>
  }

  /**
   * 按日期查询复习记录（关联知识点）
   * @param date 日期（YYYY-MM-DD）
   * @returns 复习记录列表（含知识点信息）
   */
  findByDateWithKnowledge(date: string): Array<ReviewHistory & { knowledge: Knowledge }> {
    const query = `
      SELECT 
        r.*,
        k.title as knowledge_title,
        k.tags as knowledge_tags
      FROM review_history r
      JOIN knowledge k ON r.knowledge_id = k.id
      WHERE DATE(r.reviewed_at) = ?
      ORDER BY r.reviewed_at DESC
    `
    const rows = this.db.prepare(query).all(date)
    return rows.map((row) => ({
      ...this.deserialize(row),
      knowledge: {
        id: row.knowledge_id,
        title: row.knowledge_title,
        tags: row.knowledge_tags ? JSON.parse(row.knowledge_tags) : []
      }
    }))
  }
}
```

**验证:**

- [ ] 测试 `countByDateRange` 返回正确的每日复习统计
- [ ] 测试 `findByDateWithKnowledge` 返回完整的复习记录和知识点信息
- [ ] 测试 JOIN 查询性能

---

### 阶段2：Service层和IPC层（2小时）

#### Task 2.1: 创建StatisticsService

**文件:** `src/main/services/StatisticsService.ts`

```typescript
import { KnowledgeRepository } from '../database/repositories/KnowledgeRepository'
import { ReviewRepository } from '../database/repositories/ReviewRepository'
import dayjs from 'dayjs'

export interface DayActivity {
  date: string
  knowledgeCount: number
  reviewCount: number
  totalActivity: number
  heatLevel: number // 0-5
}

export interface DayDetail {
  date: string
  knowledgeList: Array<{
    id: string
    title: string
    tags: string[]
    createdAt: string
  }>
  reviewList: Array<{
    id: string
    knowledgeId: string
    knowledgeTitle: string
    rating: number
    reviewedAt: string
  }>
}

export class StatisticsService {
  private knowledgeRepo: KnowledgeRepository
  private reviewRepo: ReviewRepository

  constructor(knowledgeRepo: KnowledgeRepository, reviewRepo: ReviewRepository) {
    this.knowledgeRepo = knowledgeRepo
    this.reviewRepo = reviewRepo
  }

  /**
   * 获取月度活动数据（热力图）
   * @param year 年份
   * @param month 月份（1-12）
   * @returns 每日活动数据
   */
  getMonthActivities(year: number, month: number): DayActivity[] {
    const startDate = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`)
    const endDate = startDate.endOf('month')

    const startStr = startDate.format('YYYY-MM-DD')
    const endStr = endDate.format('YYYY-MM-DD')

    // 查询知识点统计
    const knowledgeStats = this.knowledgeRepo.countByDateRange(startStr, endStr)
    const knowledgeMap = new Map(knowledgeStats.map((s) => [s.date, s.count]))

    // 查询复习统计
    const reviewStats = this.reviewRepo.countByDateRange(startStr, endStr)
    const reviewMap = new Map(reviewStats.map((s) => [s.date, s.count]))

    // 生成完整月份的数据（包括空日期）
    const days: DayActivity[] = []
    const daysInMonth = endDate.date()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = startDate.date(day).format('YYYY-MM-DD')
      const knowledgeCount = knowledgeMap.get(date) || 0
      const reviewCount = reviewMap.get(date) || 0
      const totalActivity = knowledgeCount + reviewCount

      days.push({
        date,
        knowledgeCount,
        reviewCount,
        totalActivity,
        heatLevel: this.calculateHeatLevel(totalActivity)
      })
    }

    return days
  }

  /**
   * 获取单日活动详情
   * @param date 日期（YYYY-MM-DD）
   * @returns 日期详细数据
   */
  getDayActivities(date: string): DayDetail {
    // 查询该日新增的知识点
    const knowledgeList = this.knowledgeRepo.findByDate(date).map((k) => ({
      id: k.id,
      title: k.title,
      tags: k.tags || [],
      createdAt: k.createdAt
    }))

    // 查询该日的复习记录
    const reviewList = this.reviewRepo.findByDateWithKnowledge(date).map((r) => ({
      id: r.id,
      knowledgeId: r.knowledgeId,
      knowledgeTitle: r.knowledge.title,
      rating: r.rating,
      reviewedAt: r.reviewedAt
    }))

    return {
      date,
      knowledgeList,
      reviewList
    }
  }

  /**
   * 计算热力级别（0-5）
   * @param totalActivity 总活动数
   * @returns 热力级别
   */
  private calculateHeatLevel(totalActivity: number): number {
    if (totalActivity === 0) return 0
    if (totalActivity <= 2) return 1
    if (totalActivity <= 5) return 2
    if (totalActivity <= 10) return 3
    if (totalActivity <= 15) return 4
    return 5 // 16+
  }
}
```

**验证:**

- [ ] 测试 `getMonthActivities` 返回完整月份数据
- [ ] 测试热力级别计算正确
- [ ] 测试 `getDayActivities` 返回准确的详情数据

#### Task 2.2: 创建IPC处理器

**文件:** `src/main/ipc/statisticsHandlers.ts`

```typescript
import { ipcMain } from 'electron'
import { IpcChannels } from '../../common/ipc-channels'
import { StatisticsService } from '../services/StatisticsService'
import { getRepositories } from '../database/repositories'
import { handleIpcError } from '../utils/errors'

export function registerStatisticsHandlers(): void {
  const { knowledgeRepository, reviewRepository } = getRepositories()
  const statisticsService = new StatisticsService(knowledgeRepository, reviewRepository)

  // 获取月度活动数据
  ipcMain.handle(IpcChannels.STATISTICS_GET_MONTH, async (_event, year: number, month: number) => {
    try {
      return await statisticsService.getMonthActivities(year, month)
    } catch (error) {
      throw handleIpcError(error, 'Failed to get month activities')
    }
  })

  // 获取单日活动详情
  ipcMain.handle(IpcChannels.STATISTICS_GET_DAY, async (_event, date: string) => {
    try {
      return await statisticsService.getDayActivities(date)
    } catch (error) {
      throw handleIpcError(error, 'Failed to get day activities')
    }
  })
}
```

#### Task 2.3: 扩展IPC通道定义

**文件:** `src/common/ipc-channels.ts`

```typescript
export const IpcChannels = {
  // ... 现有通道 ...

  // Statistics channels
  STATISTICS_GET_MONTH: 'statistics:getMonth',
  STATISTICS_GET_DAY: 'statistics:getDay'
} as const
```

#### Task 2.4: 扩展Preload暴露API

**文件:** `src/preload/index.ts`

```typescript
// 在 exposeInMainWorld 中添加
statistics: {
  getMonthActivities: (year: number, month: number) =>
    ipcRenderer.invoke(IpcChannels.STATISTICS_GET_MONTH, year, month),
  getDayActivities: (date: string) =>
    ipcRenderer.invoke(IpcChannels.STATISTICS_GET_DAY, date),
}
```

**文件:** `src/preload/index.d.ts`

```typescript
// 添加类型定义
statistics: {
  getMonthActivities: (year: number, month: number) => Promise<DayActivity[]>
  getDayActivities: (date: string) => Promise<DayDetail>
}
```

#### Task 2.5: 注册统计处理器

**文件:** `src/main/ipc/index.ts`

```typescript
import { registerStatisticsHandlers } from './statisticsHandlers'

export function registerIpcHandlers(): void {
  registerKnowledgeHandlers()
  registerReviewHandlers()
  registerStatisticsHandlers() // 新增
}
```

**验证:**

- [ ] IPC通道调用成功
- [ ] 数据传输正确
- [ ] 错误处理完善

---

### 阶段3：状态管理层（1.5小时）

#### Task 3.1: 创建calendarStore

**文件:** `src/renderer/src/stores/calendarStore.ts`

```typescript
import { create } from 'zustand'
import dayjs from 'dayjs'

interface DayActivity {
  date: string
  knowledgeCount: number
  reviewCount: number
  totalActivity: number
  heatLevel: number
}

interface DayDetail {
  date: string
  knowledgeList: Array<{
    id: string
    title: string
    tags: string[]
    createdAt: string
  }>
  reviewList: Array<{
    id: string
    knowledgeId: string
    knowledgeTitle: string
    rating: number
    reviewedAt: string
  }>
}

interface CalendarState {
  // State
  currentYear: number
  currentMonth: number
  selectedDate: string | null
  monthActivities: DayActivity[]
  dayDetail: DayDetail | null
  loading: boolean
  error: string | null

  // Actions
  setCurrentMonth: (year: number, month: number) => void
  fetchMonthActivities: () => Promise<void>
  selectDate: (date: string) => Promise<void>
  clearSelection: () => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  currentYear: dayjs().year(),
  currentMonth: dayjs().month() + 1,
  selectedDate: null,
  monthActivities: [],
  dayDetail: null,
  loading: false,
  error: null,

  // Set current month
  setCurrentMonth: (year: number, month: number) => {
    set({ currentYear: year, currentMonth: month })
    get().fetchMonthActivities()
  },

  // Fetch month activities
  fetchMonthActivities: async () => {
    const { currentYear, currentMonth } = get()
    set({ loading: true, error: null })

    try {
      const activities = await window.api.statistics.getMonthActivities(currentYear, currentMonth)
      set({ monthActivities: activities, loading: false })
    } catch (error) {
      console.error('Failed to fetch month activities:', error)
      set({
        error: '获取月度数据失败',
        loading: false
      })
    }
  },

  // Select date and fetch detail
  selectDate: async (date: string) => {
    set({ selectedDate: date, loading: true, error: null })

    try {
      const detail = await window.api.statistics.getDayActivities(date)
      set({ dayDetail: detail, loading: false })
    } catch (error) {
      console.error('Failed to fetch day activities:', error)
      set({
        error: '获取日期详情失败',
        loading: false
      })
    }
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedDate: null, dayDetail: null })
  },

  // Navigate to previous month
  goToPreviousMonth: () => {
    const { currentYear, currentMonth } = get()
    const newDate = dayjs(`${currentYear}-${currentMonth}-01`).subtract(1, 'month')
    get().setCurrentMonth(newDate.year(), newDate.month() + 1)
  },

  // Navigate to next month
  goToNextMonth: () => {
    const { currentYear, currentMonth } = get()
    const newDate = dayjs(`${currentYear}-${currentMonth}-01`).add(1, 'month')
    get().setCurrentMonth(newDate.year(), newDate.month() + 1)
  }
}))
```

**验证:**

- [ ] Store 初始化正确
- [ ] 月份切换逻辑正确
- [ ] 数据获取和状态更新正常
- [ ] 错误处理完善

---

### 阶段4：UI组件层（4.5小时）

#### Task 4.1: 创建热力图图例组件

**文件:** `src/renderer/src/components/HeatmapLegend.tsx`

```typescript
import React from 'react';
import { Space, Typography } from 'antd';

const { Text } = Typography;

const HEAT_COLORS = [
  { level: 0, color: '#f0f0f0', label: '无活动' },
  { level: 1, color: '#c6e3ff', label: '1-2' },
  { level: 2, color: '#91d5ff', label: '3-5' },
  { level: 3, color: '#40a9ff', label: '6-10' },
  { level: 4, color: '#1890ff', label: '11-15' },
  { level: 5, color: '#096dd9', label: '16+' },
];

export const HeatmapLegend: React.FC = () => {
  return (
    <Space align="center" size="small" style={{ marginTop: 16 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>活动强度:</Text>
      {HEAT_COLORS.map(({ level, color, label }) => (
        <Space key={level} size={4} align="center">
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: color,
              border: '1px solid #d9d9d9',
              borderRadius: 2,
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
        </Space>
      ))}
    </Space>
  );
};
```

#### Task 4.2: 创建日期工具提示组件

**文件:** `src/renderer/src/components/DateTooltip.tsx`

```typescript
import React from 'react';
import { Space, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

interface DateTooltipProps {
  date: string;
  knowledgeCount: number;
  reviewCount: number;
  totalActivity: number;
}

export const DateTooltip: React.FC<DateTooltipProps> = ({
  date,
  knowledgeCount,
  reviewCount,
  totalActivity,
}) => {
  return (
    <div style={{ padding: '8px 12px' }}>
      <Text strong style={{ fontSize: 14 }}>
        {dayjs(date).format('YYYY年MM月DD日')}
      </Text>
      <div style={{ marginTop: 8 }}>
        <Space direction="vertical" size={4}>
          <Text>新增知识点: {knowledgeCount} 个</Text>
          <Text>复习次数: {reviewCount} 次</Text>
          <Text strong>总活动: {totalActivity} 次</Text>
        </Space>
      </div>
    </div>
  );
};
```

#### Task 4.3: 创建日历热力图组件

**文件:** `src/renderer/src/components/CalendarHeatmap.tsx`

```typescript
import React from 'react';
import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import { DateTooltip } from './DateTooltip';

interface DayActivity {
  date: string;
  knowledgeCount: number;
  reviewCount: number;
  totalActivity: number;
  heatLevel: number;
}

interface CalendarHeatmapProps {
  year: number;
  month: number;
  activities: DayActivity[];
  selectedDate: string | null;
  onDateClick: (date: string) => void;
}

const HEAT_COLORS = ['#f0f0f0', '#c6e3ff', '#91d5ff', '#40a9ff', '#1890ff', '#096dd9'];
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  year,
  month,
  activities,
  selectedDate,
  onDateClick,
}) => {
  // 构建活动数据映射
  const activityMap = new Map(activities.map(a => [a.date, a]));

  // 计算月份的第一天和最后一天
  const firstDay = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`);
  const lastDay = firstDay.endOf('month');
  const daysInMonth = lastDay.date();

  // 计算第一天是星期几（0=周日, 1=周一, ...）
  const firstDayOfWeek = firstDay.day();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 调整为周一开始

  // 生成日历格子
  const calendarDays: Array<{ date: string; day: number } | null> = [];

  // 前置空白
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }

  // 实际日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = firstDay.date(day).format('YYYY-MM-DD');
    calendarDays.push({ date, day });
  }

  return (
    <div>
      {/* 星期标题 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8,
        }}
      >
        {WEEKDAYS.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#8c8c8c',
              fontWeight: 500,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
        }}
      >
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} style={{ aspectRatio: '1/1' }} />;
          }

          const { date, day } = dayData;
          const activity = activityMap.get(date);
          const heatLevel = activity?.heatLevel || 0;
          const isSelected = date === selectedDate;
          const isToday = date === dayjs().format('YYYY-MM-DD');

          return (
            <Tooltip
              key={date}
              title={
                activity && activity.totalActivity > 0 ? (
                  <DateTooltip
                    date={date}
                    knowledgeCount={activity.knowledgeCount}
                    reviewCount={activity.reviewCount}
                    totalActivity={activity.totalActivity}
                  />
                ) : (
                  <div style={{ padding: 4 }}>
                    {dayjs(date).format('YYYY年MM月DD日')}
                    <br />
                    无活动
                  </div>
                )
              }
              mouseEnterDelay={0.1}
            >
              <div
                onClick={() => onDateClick(date)}
                style={{
                  aspectRatio: '1/1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: HEAT_COLORS[heatLevel],
                  border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  ...(isToday && {
                    boxShadow: '0 0 0 2px #ff4d4f',
                  }),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 16, fontWeight: isToday ? 'bold' : 'normal' }}>
                  {day}
                </div>
                {activity && activity.totalActivity > 0 && (
                  <div style={{ fontSize: 10, color: '#595959', marginTop: 2 }}>
                    {activity.knowledgeCount > 0 && `+${activity.knowledgeCount}`}
                    {activity.reviewCount > 0 && ` ✓${activity.reviewCount}`}
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
```

#### Task 4.4: 创建日期活动列表组件

**文件:** `src/renderer/src/components/DayActivityList.tsx`

```typescript
import React from 'react';
import { List, Tag, Typography, Space, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface DayDetail {
  date: string;
  knowledgeList: Array<{
    id: string;
    title: string;
    tags: string[];
    createdAt: string;
  }>;
  reviewList: Array<{
    id: string;
    knowledgeId: string;
    knowledgeTitle: string;
    rating: number;
    reviewedAt: string;
  }>;
}

interface DayActivityListProps {
  dayDetail: DayDetail | null;
}

const RATING_EMOJIS = ['', '😟', '🤔', '😐', '😊', '🎯'];

export const DayActivityList: React.FC<DayActivityListProps> = ({ dayDetail }) => {
  const navigate = useNavigate();

  if (!dayDetail) {
    return <Empty description="请选择日期查看详情" style={{ marginTop: 40 }} />;
  }

  const { date, knowledgeList, reviewList } = dayDetail;
  const hasActivity = knowledgeList.length > 0 || reviewList.length > 0;

  if (!hasActivity) {
    return (
      <div>
        <Title level={4}>{dayjs(date).format('YYYY年MM月DD日')}</Title>
        <Empty description="当日无活动" style={{ marginTop: 40 }} />
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>{dayjs(date).format('YYYY年MM月DD日')}</Title>

      {/* 新增知识点 */}
      {knowledgeList.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16 }}>
            新增知识点 ({knowledgeList.length})
          </Text>
          <List
            dataSource={knowledgeList}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                onClick={() => navigate(`/knowledge/${item.id}`)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <List.Item.Meta
                  title={item.title}
                  description={
                    <Space size={4}>
                      {item.tags.map(tag => (
                        <Tag key={tag} color="blue" style={{ fontSize: 12 }}>
                          {tag}
                        </Tag>
                      ))}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.createdAt).format('HH:mm')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 复习记录 */}
      {reviewList.length > 0 && (
        <div>
          <Text strong style={{ fontSize: 16 }}>
            复习记录 ({reviewList.length})
          </Text>
          <List
            dataSource={reviewList}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                onClick={() => navigate(`/knowledge/${item.knowledgeId}`)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {item.knowledgeTitle}
                      <span style={{ fontSize: 18 }}>
                        {RATING_EMOJIS[item.rating]}
                      </span>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.reviewedAt).format('HH:mm')}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};
```

#### Task 4.5: 创建日期详情侧边栏

**文件:** `src/renderer/src/components/DaySidebar.tsx`

```typescript
import React from 'react';
import { Drawer } from 'antd';
import { DayActivityList } from './DayActivityList';

interface DayDetail {
  date: string;
  knowledgeList: Array<{
    id: string;
    title: string;
    tags: string[];
    createdAt: string;
  }>;
  reviewList: Array<{
    id: string;
    knowledgeId: string;
    knowledgeTitle: string;
    rating: number;
    reviewedAt: string;
  }>;
}

interface DaySidebarProps {
  open: boolean;
  dayDetail: DayDetail | null;
  onClose: () => void;
}

export const DaySidebar: React.FC<DaySidebarProps> = ({ open, dayDetail, onClose }) => {
  return (
    <Drawer
      title="日期详情"
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <DayActivityList dayDetail={dayDetail} />
    </Drawer>
  );
};
```

#### Task 4.6: 创建日历主页面

**文件:** `src/renderer/src/pages/CalendarPage.tsx`

```typescript
import React, { useEffect } from 'react';
import { Card, Space, Button, Spin, Typography, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { HeatmapLegend } from '../components/HeatmapLegend';
import { DaySidebar } from '../components/DaySidebar';
import { useCalendarStore } from '../stores/calendarStore';
import dayjs from 'dayjs';

const { Title } = Typography;

export const CalendarPage: React.FC = () => {
  const {
    currentYear,
    currentMonth,
    selectedDate,
    monthActivities,
    dayDetail,
    loading,
    error,
    fetchMonthActivities,
    selectDate,
    clearSelection,
    goToPreviousMonth,
    goToNextMonth,
  } = useCalendarStore();

  useEffect(() => {
    fetchMonthActivities();
  }, [fetchMonthActivities]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleDateClick = (date: string) => {
    selectDate(date);
  };

  return (
    <div style={{ padding: 24, height: '100vh', overflow: 'auto' }}>
      <Card>
        {/* 页面标题和月份切换 */}
        <Space
          direction="horizontal"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            学习日历
          </Title>

          <Space size="large">
            <Button
              icon={<LeftOutlined />}
              onClick={goToPreviousMonth}
              disabled={loading}
            >
              上一月
            </Button>

            <Title level={4} style={{ margin: 0, minWidth: 120, textAlign: 'center' }}>
              {currentYear}年{currentMonth}月
            </Title>

            <Button
              icon={<RightOutlined />}
              onClick={goToNextMonth}
              disabled={loading}
            >
              下一月
            </Button>
          </Space>
        </Space>

        {/* 热力图 */}
        <Spin spinning={loading}>
          <CalendarHeatmap
            year={currentYear}
            month={currentMonth}
            activities={monthActivities}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
          />
        </Spin>

        {/* 图例 */}
        <HeatmapLegend />
      </Card>

      {/* 日期详情侧边栏 */}
      <DaySidebar
        open={selectedDate !== null}
        dayDetail={dayDetail}
        onClose={clearSelection}
      />
    </div>
  );
};
```

**验证:**

- [ ] 日历布局正确，周一开始
- [ ] 热力图颜色映射正确
- [ ] 悬停提示显示正确
- [ ] 点击日期显示侧边栏
- [ ] 侧边栏数据准确完整
- [ ] 列表项点击跳转正常
- [ ] 月份切换流畅

#### Task 4.7: 配置路由

**文件:** `src/renderer/src/App.tsx`

```typescript
// 添加路由
import { CalendarPage } from './pages/CalendarPage';

// 在 Routes 中添加
<Route path="/calendar" element={<CalendarPage />} />
```

**文件:** 主页面导航（假设有侧边栏或菜单）

```typescript
// 添加日历菜单项
<Menu.Item key="calendar" icon={<CalendarOutlined />}>
  <Link to="/calendar">学习日历</Link>
</Menu.Item>
```

---

## 📊 数据模型

### DayActivity (热力图数据)

```typescript
interface DayActivity {
  date: string // 日期 YYYY-MM-DD
  knowledgeCount: number // 新增知识点数量
  reviewCount: number // 复习次数
  totalActivity: number // 总活动数
  heatLevel: number // 热力级别 0-5
}
```

### DayDetail (日期详情)

```typescript
interface DayDetail {
  date: string
  knowledgeList: Array<{
    id: string
    title: string
    tags: string[]
    createdAt: string
  }>
  reviewList: Array<{
    id: string
    knowledgeId: string
    knowledgeTitle: string
    rating: number
    reviewedAt: string
  }>
}
```

---

## 🎨 UI设计要点

### 热力图设计

- **网格布局**: 7列（周一到周日），行数根据月份天数动态计算
- **颜色渐变**: 6级热力颜色，从浅灰到深蓝
- **交互反馈**: 悬停放大、选中高亮、今日标记
- **信息密度**: 每个格子显示日期数字和活动简要统计

### 侧边栏设计

- **宽度**: 400px，右侧滑出
- **内容分组**: 新增知识点 / 复习记录 分开显示
- **列表样式**: 清晰的列表项，支持悬停高亮
- **空状态**: 无活动时显示友好提示

### 响应式考虑

- 日历最小宽度 700px
- 侧边栏在小屏幕上全屏显示
- 字体大小适配不同分辨率

---

## 🧪 测试策略

### 单元测试

- [ ] StatisticsService 方法测试
- [ ] Repository 统计查询测试
- [ ] 热力级别计算测试
- [ ] Store 状态管理测试

### 集成测试

- [ ] IPC 通道端到端测试
- [ ] 数据流完整性测试
- [ ] 月份切换数据更新测试

### 手动测试

- [ ] **场景1**: 空数据状态（新用户）
  - 打开日历页面
  - 验证显示空白热力图（全灰色）
  - 点击日期，侧边栏显示"无活动"
- [ ] **场景2**: 有活动数据
  - 创建一些知识点和复习记录
  - 验证热力图颜色正确
  - 验证悬停提示数据准确
  - 验证点击日期显示详情列表
- [ ] **场景3**: 月份切换
  - 点击"上一月"/"下一月"
  - 验证热力图数据更新
  - 验证月份标题更新
  - 验证切换流畅（< 300ms）
- [ ] **场景4**: 跨年月份切换
  - 从12月切换到1月
  - 验证年份和月份都正确更新
- [ ] **场景5**: 性能测试
  - 使用测试数据填充1个月（30天 × 平均10个活动）
  - 验证页面加载时间 < 1秒
  - 验证月份切换响应 < 300ms
  - 验证悬停提示延迟 < 100ms

---

## 🚀 开发流程

### 1. 数据层开发（2小时）

```bash
# 开发步骤
1. 扩展 KnowledgeRepository 和 ReviewRepository 统计方法
2. 编写 Repository 测试（可选单元测试或手动验证）
3. 验证 SQL 查询性能和正确性
```

### 2. Service和IPC层开发（2小时）

```bash
# 开发步骤
1. 创建 StatisticsService
2. 创建 statisticsHandlers
3. 扩展 IPC 通道和 Preload API
4. 注册处理器
5. 使用 DevTools Console 测试 IPC 调用
```

### 3. 状态管理开发（1.5小时）

```bash
# 开发步骤
1. 创建 calendarStore
2. 测试 Store 方法（Redux DevTools）
3. 验证数据流
```

### 4. UI组件开发（4.5小时）

```bash
# 开发步骤
1. 创建基础组件（HeatmapLegend, DateTooltip）
2. 创建核心组件（CalendarHeatmap, DayActivityList）
3. 创建容器组件（DaySidebar, CalendarPage）
4. 配置路由和导航
5. 调试样式和交互
```

### 5. 集成测试和优化（可选）

```bash
# 测试步骤
1. 完整功能测试（所有 AC）
2. 性能测试（加载时间、切换速度）
3. 边界情况测试（空数据、大数据量）
4. UI/UX 优化（动画、反馈）
```

---

## 📝 开发注意事项

### 架构一致性

- ✅ **数据层**: 使用现有 Repository 模式，扩展统计查询方法
- ✅ **Service层**: 新建 StatisticsService，遵循单一职责原则
- ✅ **IPC层**: 遵循现有 IPC 通道命名规范（`statistics:*`）
- ✅ **状态管理**: 使用 Zustand，遵循现有 Store 模式
- ✅ **UI层**: 使用 Ant Design 组件，保持样式一致性

### 性能优化

- **数据库查询**: 使用索引优化（已有 `created_at` 和 `reviewed_at` 索引）
- **前端渲染**: 使用 `useMemo` 优化热力图计算
- **状态管理**: 避免不必要的重新渲染，使用 Zustand 的 selector
- **IPC通信**: 批量查询月度数据，减少IPC调用次数

### 用户体验

- **加载状态**: 显示 Spin 加载动画
- **错误处理**: 友好的错误提示（Toast）
- **空状态**: 无数据时显示引导信息
- **交互反馈**: 悬停、选中、点击都有视觉反馈
- **今日标记**: 高亮显示今天的日期

### 可扩展性考虑

- **多视图支持**: 当前实现月视图，为 Story 4.2 的周视图/年视图预留接口
- **数据缓存**: Store 中缓存月度数据，切换回来时无需重新请求
- **热力图算法**: 热力级别计算独立封装，方便调整阈值

---

## 🔗 关键文件清单

### 新建文件（14个）

```
src/main/services/StatisticsService.ts
src/main/ipc/statisticsHandlers.ts
src/renderer/src/stores/calendarStore.ts
src/renderer/src/pages/CalendarPage.tsx
src/renderer/src/components/CalendarHeatmap.tsx
src/renderer/src/components/HeatmapLegend.tsx
src/renderer/src/components/DateTooltip.tsx
src/renderer/src/components/DaySidebar.tsx
src/renderer/src/components/DayActivityList.tsx
```

### 修改文件（6个）

```
src/common/ipc-channels.ts           # 新增统计通道
src/main/ipc/index.ts                # 注册统计处理器
src/main/database/repositories/KnowledgeRepository.ts  # 新增统计方法
src/main/database/repositories/ReviewRepository.ts     # 新增统计方法
src/preload/index.ts                 # 暴露统计API
src/preload/index.d.ts               # 添加类型定义
src/renderer/src/App.tsx             # 添加路由
```

---

## 📚 参考资料

### 技术栈文档

- [Ant Design Calendar](https://ant.design/components/calendar-cn/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Day.js API](https://day.js.org/docs/en/display/format)

### 项目文档

- Architecture.md: 数据库设计、IPC通道规范
- PRD.md: FR19-FR22 日历功能需求
- Story 2.1: Repository 模式参考
- Story 3.1: Store 和 IPC 模式参考

### Git 提交参考

```bash
feat(calendar): 实现日历热力图基础功能 (Story 4.1)

- 新增 StatisticsService 统计服务
- 扩展 Repository 统计查询方法
- 创建 calendarStore 状态管理
- 实现 CalendarPage 和热力图组件
- 支持月份切换和日期详情查看

Closes #4.1
```

---

## ✅ Story完成检查清单

### 代码完成度

- [ ] 所有代码文件已创建/修改
- [ ] TypeScript 编译通过（无错误）
- [ ] ESLint 检查通过（无警告）
- [ ] 所有 TODO 注释已清理

### 功能完成度

- [ ] 所有 AC 验证通过（6个验收标准）
- [ ] 所有手动测试场景通过（5个场景）
- [ ] 性能指标达标（加载<1s, 切换<300ms）

### 集成完成度

- [ ] 路由配置正确
- [ ] 导航菜单已添加
- [ ] IPC 通道正常工作
- [ ] Store 数据流正常

### 文档完成度

- [ ] 代码注释完整
- [ ] 关键函数有 JSDoc
- [ ] README 更新（如需要）

---

## 🎯 下一步规划

本 Story 完成后，将为以下功能奠定基础：

1. **Story 4.2**: 多视图切换（周视图、年视图）
   - 复用 StatisticsService 和 calendarStore
   - 扩展 UI 组件支持不同视图模式

2. **Story 4.3**: 今日摘要和每日统计
   - 复用统计查询方法
   - 新增趋势图表组件

3. **Story 4.4/4.5**: 日记和提醒事项
   - 在日历上叠加日记和提醒标记
   - 扩展侧边栏显示更多信息

---

**开发者提示:** 本 Story 是日历功能的基石，重点在于：

1. 建立可靠的统计数据查询基础
2. 实现高性能的热力图渲染
3. 提供流畅的用户交互体验

请确保代码质量和性能达标，为后续 Story 打好基础！🚀








