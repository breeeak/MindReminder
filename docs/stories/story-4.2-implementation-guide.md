# Story 4.2 实现指南：多视图切换

## Story 概述

**Story ID:** 4.2  
**Story标题:** 多视图切换  
**Epic:** Epic 4 - 日历可视化与统计  
**Story Points:** 5  
**优先级:** P0  
**依赖:** Story 4.1

**用户故事:**
As a **学习者**,
I want **在不同时间尺度查看学习数据**,
So that **我可以从不同角度了解学习情况**.

---

## 验收标准（AC）

### AC1: 视图切换控制

- **Given** 用户在日历视图
- **When** 用户点击视图切换按钮
- **Then** 可以选择：月视图（默认）、周视图、年视图

### AC2: 周视图显示

- **When** 切换到周视图
- **Then** 显示当周7天详细信息
- **And** 每天显示卡片包含：
  - 日期和星期
  - 新增知识点列表（带标题）
  - 复习知识点列表（带标题和评分）
  - 日记摘要
  - 完成状态（如"复习完成3/5"）

### AC3: 年视图显示

- **When** 切换到年视图
- **Then** 显示全年365天热力图
- **And** 按月分组排列
- **And** 支持滚动查看
- **And** 显示年度统计：
  - 总学习天数
  - 最长连续天数
  - 总知识点数
  - 总复习次数

### AC4: 性能和状态保持

- **And** 视图切换动画流畅（< 300ms）
- **And** 视图状态保持（刷新后仍保持上次选择）

---

## 技术实现方案

### 架构层次

```
UI层（React组件）
    ↓
状态管理层（calendarStore - 扩展视图状态）
    ↓
IPC层（statistics:getWeek/getYear）
    ↓
Service层（StatisticsService - 扩展周/年度查询）
    ↓
Repository层（扩展统计查询方法）
    ↓
数据库层（SQLite）
```

---

## 实现任务分解

### Task 1: 扩展Repository层（数据层）

**文件:** `src/main/database/repositories/KnowledgeRepository.ts`, `ReviewRepository.ts`

**实现内容:**

1. **KnowledgeRepository** 扩展方法：

```typescript
// 按周统计
countByWeek(year: number, week: number): Promise<number>
findByWeek(year: number, week: number): Promise<Knowledge[]>

// 按年统计
countByYear(year: number): Promise<Map<string, number>>  // key: 'YYYY-MM-DD'
findByYear(year: number): Promise<Knowledge[]>
```

2. **ReviewRepository** 扩展方法：

```typescript
// 按周统计
countByWeek(year: number, week: number): Promise<number>
findByWeek(year: number, week: number): Promise<ReviewHistory[]>

// 按年统计
countByYear(year: number): Promise<Map<string, number>>
findByYear(year: number): Promise<ReviewHistory[]>

// 年度统计
getYearStats(year: number): Promise<{
  totalStudyDays: number;
  longestStreak: number;
  totalKnowledge: number;
  totalReviews: number;
}>
```

**实现注意:**

- 使用 ISO 8601 周编号（`date('start_of_week')`）
- 计算连续天数使用窗口函数或应用层逻辑

---

### Task 2: 扩展StatisticsService（Service层）

**文件:** `src/main/services/StatisticsService.ts`

**实现内容:**

```typescript
class StatisticsService {
  // 周统计
  async getWeekData(year: number, week: number): Promise<WeekData> {
    // 返回该周7天的数据
    const days: DayData[] = []
    for (let i = 0; i < 7; i++) {
      const date = getDateFromWeek(year, week, i)
      const dayData = await this.getDayData(date)
      days.push(dayData)
    }
    return { year, week, days }
  }

  // 年度统计
  async getYearData(year: number): Promise<YearData> {
    // 返回全年365天热力图数据
    const heatmapData = await knowledgeRepo.countByYear(year)
    const reviewData = await reviewRepo.countByYear(year)
    const stats = await reviewRepo.getYearStats(year)

    return {
      year,
      heatmap: mergeHeatmapData(heatmapData, reviewData),
      stats
    }
  }
}

// 类型定义
interface WeekData {
  year: number
  week: number
  days: DayData[]
}

interface DayData {
  date: string
  dayOfWeek: number
  knowledgeList: Knowledge[]
  reviewList: ReviewHistory[]
  diary?: string
  completionRate: number
}

interface YearData {
  year: number
  heatmap: Map<string, number> // 日期 -> 活动数
  stats: YearStats
}

interface YearStats {
  totalStudyDays: number
  longestStreak: number
  totalKnowledge: number
  totalReviews: number
}
```

---

### Task 3: 扩展IPC通道（IPC层）

**文件:**

- `src/common/ipc-channels.ts`
- `src/main/ipc/statisticsHandlers.ts`
- `src/preload/index.ts`
- `src/preload/index.d.ts`

**实现内容:**

1. **定义新IPC通道:**

```typescript
// src/common/ipc-channels.ts
export const IPC_CHANNELS = {
  // ...existing
  STATISTICS_GET_WEEK: 'statistics:getWeek',
  STATISTICS_GET_YEAR: 'statistics:getYear'
}
```

2. **实现IPC处理器:**

```typescript
// src/main/ipc/statisticsHandlers.ts
ipcMain.handle(IPC_CHANNELS.STATISTICS_GET_WEEK, async (_, year: number, week: number) => {
  try {
    const data = await statisticsService.getWeekData(year, week)
    return { success: true, data }
  } catch (error) {
    logger.error('Failed to get week data:', error)
    return { success: false, error: '获取周数据失败' }
  }
})

ipcMain.handle(IPC_CHANNELS.STATISTICS_GET_YEAR, async (_, year: number) => {
  try {
    const data = await statisticsService.getYearData(year)
    return { success: true, data }
  } catch (error) {
    logger.error('Failed to get year data:', error)
    return { success: false, error: '获取年度数据失败' }
  }
})
```

3. **扩展Preload暴露API:**

```typescript
// src/preload/index.ts
const api = {
  statistics: {
    // ...existing
    getWeek: (year: number, week: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.STATISTICS_GET_WEEK, year, week),
    getYear: (year: number) => ipcRenderer.invoke(IPC_CHANNELS.STATISTICS_GET_YEAR, year)
  }
}
```

---

### Task 4: 扩展calendarStore（状态管理层）

**文件:** `src/renderer/src/stores/calendarStore.ts`

**实现内容:**

```typescript
interface CalendarState {
  // ...existing fields

  // 视图状态
  viewMode: 'month' | 'week' | 'year'
  currentWeek: number
  currentYear: number

  // 周视图数据
  weekData: WeekData | null

  // 年视图数据
  yearData: YearData | null

  // 操作方法
  setViewMode: (mode: 'month' | 'week' | 'year') => void
  loadWeekData: (year: number, week: number) => Promise<void>
  loadYearData: (year: number) => Promise<void>

  // 导航方法
  goToPreviousWeek: () => void
  goToNextWeek: () => void
  goToPreviousYear: () => void
  goToNextYear: () => void
}

const useCalendarStore = create<CalendarState>((set, get) => ({
  // ...existing state
  viewMode: 'month',
  currentWeek: getCurrentWeek(),
  currentYear: new Date().getFullYear(),
  weekData: null,
  yearData: null,

  setViewMode: (mode) => {
    set({ viewMode: mode })
    // 保存到 localStorage
    localStorage.setItem('calendarViewMode', mode)

    // 加载对应数据
    const { currentYear, currentWeek, currentMonth } = get()
    if (mode === 'week') {
      get().loadWeekData(currentYear, currentWeek)
    } else if (mode === 'year') {
      get().loadYearData(currentYear)
    } else {
      get().loadMonthData(currentYear, currentMonth)
    }
  },

  loadWeekData: async (year, week) => {
    set({ isLoading: true })
    try {
      const response = await window.electronAPI.statistics.getWeek(year, week)
      if (response.success) {
        set({ weekData: response.data, currentYear: year, currentWeek: week })
      }
    } catch (error) {
      console.error('Failed to load week data:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  loadYearData: async (year) => {
    set({ isLoading: true })
    try {
      const response = await window.electronAPI.statistics.getYear(year)
      if (response.success) {
        set({ yearData: response.data, currentYear: year })
      }
    } catch (error) {
      console.error('Failed to load year data:', error)
    } finally {
      set({ isLoading: false })
    }
  }

  // 导航方法实现...
}))
```

---

### Task 5: 创建视图切换组件（UI层）

**文件:** `src/renderer/src/components/CalendarViewSwitcher.tsx`

**实现内容:**

```typescript
import React from 'react'
import { Segmented } from 'antd'
import { CalendarOutlined, UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useCalendarStore } from '@/stores/calendarStore'

export const CalendarViewSwitcher: React.FC = () => {
  const { viewMode, setViewMode } = useCalendarStore()

  return (
    <Segmented
      value={viewMode}
      onChange={(value) => setViewMode(value as 'month' | 'week' | 'year')}
      options={[
        {
          label: '月视图',
          value: 'month',
          icon: <CalendarOutlined />
        },
        {
          label: '周视图',
          value: 'week',
          icon: <UnorderedListOutlined />
        },
        {
          label: '年视图',
          value: 'year',
          icon: <AppstoreOutlined />
        }
      ]}
      style={{ marginBottom: 16 }}
    />
  )
}
```

---

### Task 6: 创建周视图组件（UI层）

**文件:** `src/renderer/src/components/CalendarWeekView.tsx`

**实现内容:**

```typescript
import React, { useEffect } from 'react'
import { Card, Row, Col, Tag, Space, Typography, Progress, Empty } from 'antd'
import { useCalendarStore } from '@/stores/calendarStore'

const { Title, Text } = Typography

export const CalendarWeekView: React.FC = () => {
  const { weekData, currentYear, currentWeek, loadWeekData, isLoading } = useCalendarStore()

  useEffect(() => {
    loadWeekData(currentYear, currentWeek)
  }, [currentYear, currentWeek])

  if (isLoading) return <div>加载中...</div>
  if (!weekData) return <Empty description="无数据" />

  return (
    <div className="week-view">
      <Row gutter={[16, 16]}>
        {weekData.days.map((day) => (
          <Col span={24} key={day.date}>
            <Card
              title={
                <Space>
                  <Text strong>{formatDate(day.date)}</Text>
                  <Text type="secondary">{getDayName(day.dayOfWeek)}</Text>
                </Space>
              }
              extra={
                <Tag color={day.completionRate === 100 ? 'success' : 'default'}>
                  复习完成 {day.reviewList.filter(r => r.rating > 0).length}/{day.reviewList.length}
                </Tag>
              }
            >
              {/* 新增知识点 */}
              {day.knowledgeList.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>📚 新增知识点 ({day.knowledgeList.length})</Title>
                  {day.knowledgeList.map(k => (
                    <Tag key={k.id} color="blue" style={{ margin: 4 }}>
                      {k.title}
                    </Tag>
                  ))}
                </div>
              )}

              {/* 复习知识点 */}
              {day.reviewList.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>✅ 复习记录 ({day.reviewList.length})</Title>
                  {day.reviewList.map(r => (
                    <div key={r.id} style={{ marginBottom: 8 }}>
                      <Text>{r.knowledgeTitle}</Text>
                      <Text type="secondary"> - 评分: {getRatingEmoji(r.rating)}</Text>
                    </div>
                  ))}
                </div>
              )}

              {/* 日记摘要 */}
              {day.diary && (
                <div>
                  <Title level={5}>📝 日记</Title>
                  <Text type="secondary">{day.diary.substring(0, 100)}...</Text>
                </div>
              )}

              {/* 完成率进度条 */}
              <Progress percent={day.completionRate} status="active" />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
```

---

### Task 7: 创建年视图组件（UI层）

**文件:** `src/renderer/src/components/CalendarYearView.tsx`

**实现内容:**

```typescript
import React, { useEffect } from 'react'
import { Card, Row, Col, Statistic, Space, Empty } from 'antd'
import { useCalendarStore } from '@/stores/calendarStore'
import './CalendarYearView.css'

export const CalendarYearView: React.FC = () => {
  const { yearData, currentYear, loadYearData, isLoading } = useCalendarStore()

  useEffect(() => {
    loadYearData(currentYear)
  }, [currentYear])

  if (isLoading) return <div>加载中...</div>
  if (!yearData) return <Empty description="无数据" />

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="year-view">
      {/* 年度统计卡片 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="总学习天数" value={yearData.stats.totalStudyDays} suffix="天" />
          </Col>
          <Col span={6}>
            <Statistic title="最长连续天数" value={yearData.stats.longestStreak} suffix="天" />
          </Col>
          <Col span={6}>
            <Statistic title="总知识点数" value={yearData.stats.totalKnowledge} />
          </Col>
          <Col span={6}>
            <Statistic title="总复习次数" value={yearData.stats.totalReviews} />
          </Col>
        </Row>
      </Card>

      {/* 全年热力图 - 按月分组 */}
      <div className="year-heatmap">
        {months.map(month => (
          <div key={month} className="month-group">
            <div className="month-label">{month}月</div>
            <div className="month-heatmap">
              {getDaysInMonth(currentYear, month).map(day => {
                const dateKey = formatDateKey(currentYear, month, day)
                const count = yearData.heatmap.get(dateKey) || 0
                const level = getHeatmapLevel(count)

                return (
                  <div
                    key={day}
                    className={`day-cell level-${level}`}
                    title={`${dateKey}: ${count}个活动`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 工具函数
function getHeatmapLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 10) return 3
  if (count <= 15) return 4
  return 5
}
```

**CSS文件:** `src/renderer/src/components/CalendarYearView.css`

```css
.year-heatmap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.month-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.month-label {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #666;
}

.month-heatmap {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.day-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.day-cell:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.day-cell.level-0 {
  background-color: #f0f0f0;
}
.day-cell.level-1 {
  background-color: #c6e3ff;
}
.day-cell.level-2 {
  background-color: #91d5ff;
}
.day-cell.level-3 {
  background-color: #40a9ff;
}
.day-cell.level-4 {
  background-color: #1890ff;
}
.day-cell.level-5 {
  background-color: #096dd9;
}
```

---

### Task 8: 更新CalendarPage集成视图切换（路由和集成）

**文件:** `src/renderer/src/pages/CalendarPage.tsx`

**实现内容:**

```typescript
import React from 'react'
import { Layout, Button, Space } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { CalendarViewSwitcher } from '@/components/CalendarViewSwitcher'
import { CalendarHeatmap } from '@/components/CalendarHeatmap'  // 原月视图
import { CalendarWeekView } from '@/components/CalendarWeekView'
import { CalendarYearView } from '@/components/CalendarYearView'
import { DaySidebar } from '@/components/DaySidebar'
import { useCalendarStore } from '@/stores/calendarStore'

const { Content } = Layout

export const CalendarPage: React.FC = () => {
  const {
    viewMode,
    currentYear,
    currentMonth,
    currentWeek,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousYear,
    goToNextYear
  } = useCalendarStore()

  // 根据视图模式决定导航方法
  const handlePrevious = () => {
    if (viewMode === 'month') goToPreviousMonth()
    else if (viewMode === 'week') goToPreviousWeek()
    else goToPreviousYear()
  }

  const handleNext = () => {
    if (viewMode === 'month') goToNextMonth()
    else if (viewMode === 'week') goToNextWeek()
    else goToNextYear()
  }

  // 获取标题文本
  const getTitleText = () => {
    if (viewMode === 'month') return `${currentYear}年${currentMonth}月`
    if (viewMode === 'week') return `${currentYear}年 第${currentWeek}周`
    return `${currentYear}年`
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Content style={{ padding: 24 }}>
        {/* 顶部控制栏 */}
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<LeftOutlined />} onClick={handlePrevious} />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>{getTitleText()}</span>
            <Button icon={<RightOutlined />} onClick={handleNext} />
          </Space>

          <CalendarViewSwitcher />
        </Space>

        {/* 根据视图模式渲染不同组件 */}
        {viewMode === 'month' && <CalendarHeatmap />}
        {viewMode === 'week' && <CalendarWeekView />}
        {viewMode === 'year' && <CalendarYearView />}
      </Content>

      {/* 日期详情侧边栏（所有视图共用）*/}
      <DaySidebar />
    </Layout>
  )
}
```

---

### Task 9: 实现状态持久化（localStorage）

**文件:** `src/renderer/src/stores/calendarStore.ts`（扩展）

**实现内容:**

```typescript
// 在 store 初始化时读取 localStorage
const initViewMode =
  (localStorage.getItem('calendarViewMode') as 'month' | 'week' | 'year') || 'month'

const useCalendarStore = create<CalendarState>((set, get) => ({
  viewMode: initViewMode,
  // ...其他初始化

  setViewMode: (mode) => {
    set({ viewMode: mode })
    localStorage.setItem('calendarViewMode', mode)
    // ...加载对应数据
  }
}))
```

---

### Task 10: 性能优化和动画（优化和测试）

**实现内容:**

1. **视图切换动画:**

```typescript
// src/renderer/src/pages/CalendarPage.tsx
import { CSSTransition, SwitchTransition } from 'react-transition-group'

<SwitchTransition>
  <CSSTransition
    key={viewMode}
    timeout={300}
    classNames="fade"
  >
    <div>
      {viewMode === 'month' && <CalendarHeatmap />}
      {viewMode === 'week' && <CalendarWeekView />}
      {viewMode === 'year' && <CalendarYearView />}
    </div>
  </CSSTransition>
</SwitchTransition>
```

**CSS:**

```css
.fade-enter {
  opacity: 0;
  transform: translateY(10px);
}
.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 300ms,
    transform 300ms;
}
.fade-exit {
  opacity: 1;
}
.fade-exit-active {
  opacity: 0;
  transition: opacity 300ms;
}
```

2. **防抖加载:**

```typescript
// 避免快速切换时重复请求
const debouncedLoadData = useMemo(
  () =>
    debounce((mode, year, monthOrWeek) => {
      if (mode === 'week') loadWeekData(year, monthOrWeek)
      else if (mode === 'year') loadYearData(year)
      else loadMonthData(year, monthOrWeek)
    }, 200),
  []
)
```

---

## 测试验证清单

### 功能测试

- [ ] **AC1: 视图切换控制**
  - [ ] 点击"月视图"按钮切换到月视图
  - [ ] 点击"周视图"按钮切换到周视图
  - [ ] 点击"年视图"按钮切换到年视图
  - [ ] 切换后按钮显示为选中状态

- [ ] **AC2: 周视图显示**
  - [ ] 显示当周7天的卡片
  - [ ] 每个卡片显示日期和星期
  - [ ] 显示新增知识点列表（标题正确）
  - [ ] 显示复习知识点列表（标题和评分正确）
  - [ ] 显示日记摘要（如果有）
  - [ ] 显示复习完成状态（如"复习完成3/5"）
  - [ ] 点击导航按钮可切换到上周/下周

- [ ] **AC3: 年视图显示**
  - [ ] 显示全年365天的热力图
  - [ ] 按月分组排列（12个月）
  - [ ] 支持滚动查看
  - [ ] 显示年度统计：总学习天数
  - [ ] 显示年度统计：最长连续天数
  - [ ] 显示年度统计：总知识点数
  - [ ] 显示年度统计：总复习次数
  - [ ] 点击导航按钮可切换到上年/下年
  - [ ] 热力图颜色分级正确（0-5级）

- [ ] **AC4: 性能和状态保持**
  - [ ] 视图切换动画流畅（< 300ms）
  - [ ] 刷新页面后保持上次选择的视图
  - [ ] 快速切换不会导致多次重复请求

### 集成测试

- [ ] IPC通道 `statistics:getWeek` 返回正确数据格式
- [ ] IPC通道 `statistics:getYear` 返回正确数据格式
- [ ] Repository查询方法返回正确的周/年度数据
- [ ] 年度统计计算正确（连续天数、总数等）

### UI/UX测试

- [ ] 周视图卡片布局合理，不拥挤
- [ ] 年视图热力图方块大小适中，可清晰点击
- [ ] 视图切换动画自然流畅
- [ ] 响应式布局（窗口缩放时正常显示）
- [ ] 加载状态显示正确（Spin或骨架屏）
- [ ] 空数据状态显示友好提示

### 性能测试

- [ ] 年视图渲染365个方块 < 500ms
- [ ] 周视图加载7天数据 < 300ms
- [ ] 视图切换动画不卡顿
- [ ] 内存占用正常（无内存泄漏）

### 错误处理测试

- [ ] 网络请求失败时显示错误提示
- [ ] 数据库查询失败时不崩溃
- [ ] 无数据时显示空状态组件

---

## 技术债务和优化建议

### 已知限制

1. 年视图数据量大（365天），需要优化渲染性能
2. 连续天数计算在应用层，复杂度较高

### 优化方向

1. 使用 `React.memo` 优化组件重渲染
2. 虚拟滚动优化年视图（如使用 `react-window`）
3. 数据预加载（切换视图前提前加载数据）
4. 缓存策略（避免重复请求相同数据）

### 未来扩展

1. 支持自定义周起始日（周一/周日）
2. 导出年度报告（PDF）
3. 更多统计维度（按标签、分类统计）

---

## Definition of Done (DoD)

- [ ] 所有验收标准测试通过
- [ ] TypeScript编译无错误和警告
- [ ] ESLint检查通过
- [ ] 代码已提交到版本控制
- [ ] 功能在开发环境验证通过
- [ ] 功能在生产构建中验证通过
- [ ] 性能测试达标（视图切换 < 300ms）
- [ ] 代码审查通过

---

## 预估工作量

**Story Points:** 5
**预估小时数:** 6-8小时

**任务分解:**

- Task 1-2（数据层+Service层）: 1.5小时
- Task 3（IPC层）: 1小时
- Task 4（状态管理）: 1小时
- Task 5-7（UI组件）: 2.5小时
- Task 8-9（集成和持久化）: 0.5小时
- Task 10（优化和测试）: 1-2小时

---

## 开始开发

准备好了吗？让我们开始实现 Story 4.2！🚀

**建议开发顺序:**

1. 先实现数据层（Repository + Service）
2. 然后实现IPC通信层
3. 扩展状态管理
4. 最后实现UI组件和集成
5. 优化和测试

**First Step:** 开始 Task 1 - 扩展Repository层



