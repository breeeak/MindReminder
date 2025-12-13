---
project_name: 'MindReminder'
user_name: 'Administrator'
date: '2025-12-13'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 85
optimized_for_llm: true
last_updated: '2025-12-13'
---

# Project Context for AI Agents

_这个文件包含AI代理在实施代码时必须遵循的关键规则和模式。专注于AI可能忽略的非显而易见的细节。_

---

## Technology Stack & Versions

### 核心技术栈

**应用框架：**
- Electron（最新稳定版）- 跨平台桌面应用
- electron-vite v5.0.0 - 构建工具
- Electron Builder - 打包工具

**前端技术：**
- React 18 - UI框架
- TypeScript 5+ - 启用严格模式
- Vite 5+ - 开发服务器和构建
- Zustand - 状态管理（轻量级）
- Ant Design - UI组件库
- react-window - 虚拟滚动

**数据与工具：**
- better-sqlite3 - SQLite数据库（⚠️ 仅主进程）
- dayjs - 日期处理
- uuid - 唯一ID生成
- electron-log - 日志系统
- Vitest + @testing-library/react - 测试框架

**包管理：**
- pnpm - 包管理器（必须使用）

### 关键版本约束

- ⚠️ **better-sqlite3 只能在主进程使用**（C++ Native模块）
- TypeScript 必须启用 strict 模式
- React 18 使用新的 Hooks API
- Ant Design 需要配置自定义主题

---

## Critical Implementation Rules

### 1. Electron 架构规则（关键！）

#### 进程分离原则

**✅ 主进程（Main Process）职责：**
- SQLite 数据库操作（⚠️ 唯一允许的位置）
- 文件系统操作
- 窗口管理（创建、关闭、状态）
- 系统集成（托盘、快捷键、通知）
- 核心算法实现（间隔重复算法）
- 定时任务（备份、复习提醒）

**✅ 渲染进程（Renderer Process）职责：**
- React UI 渲染
- 用户交互处理
- Zustand 状态管理
- UI 计算和缓存（如热力图颜色）

**✅ 预加载脚本（Preload Script）职责：**
- Context Bridge API 定义
- IPC 通信桥接
- 类型安全的 API 暴露

**❌ 严格禁止：**
- ❌ 渲染进程直接访问 Node.js API
- ❌ 渲染进程直接操作文件系统
- ❌ 渲染进程直接使用 better-sqlite3
- ❌ 启用渲染进程的 nodeIntegration

#### IPC 通信规则

**命名约定（强制）：**
```typescript
// ✅ 正确：格式为 {实体}:{操作}
ipcMain.handle('knowledge:create', ...)
ipcMain.handle('knowledge:getAll', ...)
ipcMain.handle('review:submitRating', ...)

// ❌ 错误：不符合格式
ipcMain.handle('createKnowledge', ...)
ipcMain.handle('get-all-knowledge', ...)
```

**响应格式（强制）：**
```typescript
// ✅ 成功：返回 { data: T }
return { data: knowledge }

// ✅ 错误：抛出异常
throw new ValidationError('Title is required', '标题不能为空')

// ❌ 错误：不要返回错误对象
return { error: 'something failed' }
```

---

### 2. TypeScript 严格规则

#### 类型定义（强制）

**✅ 必须遵守：**
```typescript
// ✅ 禁用 any，使用 unknown
function process(data: unknown) {
  if (typeof data === 'string') {
    // 类型守卫
  }
}

// ✅ 启用 strictNullChecks
function find(id: string): Knowledge | null {
  return db.get(id) ?? null
}

// ✅ 所有公共 API 必须有类型定义
export interface Knowledge {
  id: string
  title: string
  createdAt: number
}
```

**❌ 严格禁止：**
```typescript
// ❌ 不要使用 any
function process(data: any) { }

// ❌ 不要忽略 null 检查
const knowledge = findKnowledge(id)
console.log(knowledge.title) // 可能崩溃
```

#### 导入顺序（强制）

```typescript
// 1. Node.js 内置模块
import path from 'path'
import fs from 'fs'

// 2. 第三方库
import { app, BrowserWindow } from 'electron'
import dayjs from 'dayjs'

// 3. 项目内部模块
import { KnowledgeRepository } from './database/repositories'
import log from './utils/logger'

// 4. 类型导入
import type { Knowledge } from '@shared/types'

// 5. 样式文件
import './styles/global.css'
```

---

### 3. 命名约定（强制遵守）

#### 数据库命名

**✅ 强制规则：**
- 表名：`snake_case`，单数形式（`knowledge`, `review_history`）
- 列名：`snake_case`（`created_at`, `next_review_at`）
- 主键：统一命名为 `id`
- 外键：`{表名}_id`（`knowledge_id`）
- 索引：`idx_{表名}_{列名}`（`idx_knowledge_next_review`）
- 时间戳字段：`{动作}_at`（`created_at`, `updated_at`）
- 布尔字段：存储为 INTEGER (0/1)

#### TypeScript 命名

**✅ 强制规则：**
```typescript
// 变量和函数：camelCase
const knowledgeList = []
function calculateNextReview() {}

// 组件：PascalCase
function KnowledgeCard() {}

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3

// 类型/接口：PascalCase
interface Knowledge {}
type ReviewResult = {}

// 文件名
// - 组件：PascalCase.tsx (KnowledgeCard.tsx)
// - 工具：camelCase.ts (heatmapCalculator.ts)
// - Store：camelCase + Store.ts (knowledgeStore.ts)
```

#### Repository 层命名转换（关键！）

**✅ 必须在 Repository 层进行转换：**
```typescript
class KnowledgeRepository {
  findById(id: string): Knowledge | null {
    const row = this.db.prepare('SELECT * FROM knowledge WHERE id = ?').get(id)
    if (!row) return null
    
    // ✅ 转换命名：snake_case → camelCase
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,        // snake_case → camelCase
      nextReviewAt: row.next_review_at,
      reviewCount: row.review_count,
    }
  }
  
  save(knowledge: Knowledge): void {
    // ✅ 转换命名：camelCase → snake_case
    this.db.prepare(`
      INSERT INTO knowledge (id, title, created_at, next_review_at)
      VALUES (?, ?, ?, ?)
    `).run(
      knowledge.id,
      knowledge.title,
      knowledge.createdAt,        // camelCase → snake_case
      knowledge.nextReviewAt
    )
  }
}
```

---

### 4. 数据库操作规则（关键！）

#### SQL 安全（强制）

**✅ 必须使用参数化查询：**
```typescript
// ✅ 正确：参数化查询
db.prepare('SELECT * FROM knowledge WHERE title = ?').get(title)

// ❌ 错误：SQL 注入风险
db.prepare(`SELECT * FROM knowledge WHERE title = '${title}'`).get()
```

#### 事务管理（强制）

**✅ 所有写操作必须使用事务：**
```typescript
// ✅ 正确
save(knowledge: Knowledge): void {
  const transaction = this.db.transaction(() => {
    this.db.prepare('INSERT INTO knowledge ...').run(...)
    this.db.prepare('INSERT INTO review_history ...').run(...)
  })
  transaction()
}

// ❌ 错误：没有事务保护
save(knowledge: Knowledge): void {
  this.db.prepare('INSERT INTO knowledge ...').run(...)
  this.db.prepare('INSERT INTO review_history ...').run(...)
}
```

#### 数据访问边界（强制）

**✅ 分层架构：**
```
渲染进程 UI
    ↓ window.api.knowledge.create(data)
预加载脚本
    ↓ ipcRenderer.invoke('knowledge:create', data)
IPC Handler
    ↓ knowledgeService.create(data)
Service 层
    ↓ knowledgeRepository.save(knowledge)
Repository 层
    ↓ db.prepare('INSERT...').run()
SQLite 数据库
```

**❌ 严格禁止：**
- ❌ Service 层直接写 SQL
- ❌ IPC Handler 直接操作数据库
- ❌ 跨层调用（如 UI 直接调用 Repository）

---

### 5. React 与状态管理规则

#### Zustand Store 规则（强制）

**✅ Store 组织：**
```typescript
// ✅ 正确：命名导出 + use 前缀
export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  knowledgeList: [],
  loading: false,
  
  fetchKnowledgeList: async () => {
    set({ loading: true })
    try {
      const response = await window.api.knowledge.getAll()
      set({ knowledgeList: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },
}))

// ❌ 错误：默认导出
export default create(...)
```

**✅ Store 使用（选择性订阅）：**
```typescript
// ✅ 正确：选择性订阅
function KnowledgeList() {
  const knowledgeList = useKnowledgeStore(state => state.knowledgeList)
  const loading = useKnowledgeStore(state => state.loading)
  // ...
}

// ❌ 错误：订阅整个 store（导致不必要的重渲染）
function KnowledgeList() {
  const store = useKnowledgeStore()
  // ...
}
```

#### 异步状态管理（强制）

**✅ 统一的异步状态模式：**
```typescript
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

// 初始状态
knowledgeList: { data: null, loading: false, error: null }

// 加载时
set({ knowledgeList: { data: null, loading: true, error: null } })

// 成功时
set({ knowledgeList: { data: result, loading: false, error: null } })

// 失败时
set({ knowledgeList: { data: null, loading: false, error } })
```

#### 性能优化（强制）

**✅ 必须使用的优化：**
```typescript
// ✅ React.memo：优化组件渲染
export const KnowledgeCard = React.memo(({ knowledge }) => {
  // ...
})

// ✅ useMemo：缓存计算结果
const sortedList = useMemo(() => {
  return knowledgeList.sort((a, b) => a.createdAt - b.createdAt)
}, [knowledgeList])

// ✅ useCallback：缓存函数
const handleClick = useCallback(() => {
  // ...
}, [依赖项])

// ✅ 虚拟滚动：列表超过 50 项必须使用
import { FixedSizeList } from 'react-window'

if (items.length > 50) {
  return <FixedSizeList height={600} itemCount={items.length} itemSize={80}>
    {Row}
  </FixedSizeList>
}
```

---

### 6. 错误处理规则（强制）

#### 自定义错误类

**✅ 使用自定义错误类：**
```typescript
// src/main/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public userMessage: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, userMessage = '数据操作失败') {
    super('DATABASE_ERROR', message, userMessage)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage = '数据验证失败') {
    super('VALIDATION_ERROR', message, userMessage)
  }
}
```

#### 错误处理流程（强制）

**✅ 主进程：**
```typescript
ipcMain.handle('knowledge:create', async (event, data) => {
  try {
    // 验证
    if (!data.title) {
      throw new ValidationError('Title is required', '标题不能为空')
    }
    
    // 业务逻辑
    const knowledge = await knowledgeService.create(data)
    return { data: knowledge }
    
  } catch (error) {
    // 记录日志
    log.error('Failed to create knowledge:', error)
    
    // 抛出错误（渲染进程捕获）
    throw error
  }
})
```

**✅ 渲染进程：**
```typescript
async function handleCreate() {
  try {
    const response = await window.api.knowledge.create(formData)
    message.success('创建成功')
  } catch (error) {
    // 显示用户友好错误
    if (error instanceof AppError) {
      message.error(error.userMessage)
    } else {
      message.error('操作失败，请重试')
    }
    
    // 记录到控制台
    console.error('Create knowledge failed:', error)
  }
}
```

**❌ 严格禁止：**
```typescript
// ❌ 吞掉错误
try {
  await api.call()
} catch (e) {
  // 什么都不做
}

// ❌ 不记录日志
try {
  await api.call()
} catch (e) {
  throw e  // 应该先 log.error()
}
```

---

### 7. 日志规范（强制）

#### 日志级别使用

**✅ 正确使用：**
```typescript
// debug：开发调试
log.debug('Detailed debug info', { data })

// info：重要操作（CRUD 操作必须记录）
log.info('Knowledge created', { knowledgeId, userId })

// warn：警告
log.warn('Potential issue', { issue })

// error：错误（所有错误必须记录）
log.error('Error occurred', { error })
```

#### 日志格式（强制）

**✅ 结构化日志：**
```typescript
// ✅ 正确：结构化对象
log.info('Knowledge created', {
  knowledgeId: knowledge.id,
  userId: user.id,
  timestamp: Date.now()
})

// ❌ 错误：字符串拼接
log.info('Knowledge ' + knowledge.id + ' created by ' + user.id)
```

---

### 8. 测试规则

#### 测试覆盖要求（强制）

**✅ 覆盖率要求：**
- 核心算法（间隔重复算法）：**100%** 覆盖
- Repository 层：**>80%** 覆盖
- Service 层：**>80%** 覆盖
- 工具函数：**>80%** 覆盖

#### 测试文件组织（强制）

**✅ 测试文件与源文件同目录：**
```
src/main/algorithm/
├── SpacedRepetition.ts
└── SpacedRepetition.test.ts

src/main/database/repositories/
├── KnowledgeRepository.ts
└── KnowledgeRepository.test.ts
```

#### 测试命名（强制）

**✅ 测试文件：** `{源文件名}.test.ts` 或 `{源文件名}.spec.ts`

---

### 9. 性能要求（关键）

#### 响应时间要求

**✅ 必须满足：**
- 冷启动：≤ 3秒
- 热启动：≤ 1秒
- UI 响应：≤ 200ms
- 搜索：≤ 500ms
- 日历切换：≤ 1秒

#### 资源限制

**✅ 必须满足：**
- 内存占用：≤ 300MB
- CPU 空闲：≤ 5%
- 包体积：≤ 150MB

#### 性能优化策略

**✅ 必须使用：**
- 列表 >50 项：使用 react-window 虚拟滚动
- 重计算：使用 useMemo 缓存
- 重渲染：使用 React.memo
- 用户输入：使用防抖/节流
- 启动优化：代码分割 + 懒加载

---

### 10. 日期时间处理（强制）

#### 统一格式

**✅ 存储格式：**
```typescript
// ✅ 数据库：Unix 时间戳（INTEGER，毫秒）
knowledge.created_at = Date.now()  // 1702450800000

// ✅ IPC 传输：Unix 时间戳（number）
return { data: { createdAt: Date.now() } }

// ✅ UI 显示：使用 dayjs 格式化
import dayjs from 'dayjs'
const displayDate = dayjs(knowledge.createdAt).format('YYYY-MM-DD HH:mm')
```

**❌ 严格禁止：**
```typescript
// ❌ 不要使用 ISO 字符串
knowledge.created_at = new Date().toISOString()

// ❌ 不要使用 Date 对象
knowledge.created_at = new Date()
```

---

### 11. 关键反模式（禁止！）

#### 数据库反模式

**❌ 禁止：**
```typescript
// ❌ 裸 SQL（SQL 注入风险）
db.prepare(`SELECT * FROM knowledge WHERE title = '${title}'`).get()

// ❌ 渲染进程使用 better-sqlite3
import Database from 'better-sqlite3'  // 在渲染进程中

// ❌ 没有事务的写操作
db.prepare('INSERT...').run()
db.prepare('INSERT...').run()
```

#### 状态管理反模式

**❌ 禁止：**
```typescript
// ❌ 直接修改状态
knowledgeList.push(newKnowledge)

// ❌ 订阅整个 store
const store = useKnowledgeStore()
```

#### 类型定义反模式

**❌ 禁止：**
```typescript
// ❌ 使用 any
function process(data: any) { }

// ❌ 忽略 null 检查
const knowledge = findKnowledge(id)
console.log(knowledge.title)  // 可能崩溃
```

---

### 12. 跨平台兼容性（关键）

#### 路径处理

**✅ 必须使用：**
```typescript
import path from 'path'
import { app } from 'electron'

// ✅ 正确：跨平台路径
const dbPath = path.join(app.getPath('userData'), 'database.db')

// ❌ 错误：硬编码路径
const dbPath = 'C:\\Users\\...'  // Windows only
```

#### 快捷键映射

**✅ 平台检测：**
```typescript
import { platform } from 'os'

const modifier = platform() === 'darwin' ? 'Cmd' : 'Ctrl'
const shortcut = `${modifier}+N`
```

---

### 13. 开发检查清单

开发新功能时，必须确保：

- [ ] 文件命名符合规范（组件 PascalCase，其他 camelCase）
- [ ] 变量命名符合规范（camelCase）
- [ ] IPC 通道命名符合 `{实体}:{操作}` 格式
- [ ] 数据库查询使用参数化
- [ ] Repository 层处理命名转换（snake_case ↔ camelCase）
- [ ] 错误处理完整（try-catch + 日志 + 用户提示）
- [ ] 异步状态使用标准模式（loading/error/data）
- [ ] 列表 >50 项使用虚拟滚动
- [ ] 类型定义完整且导出
- [ ] 关键逻辑编写单元测试
- [ ] better-sqlite3 只在主进程使用
- [ ] 所有 CRUD 操作记录 info 日志
- [ ] 所有错误记录 error 日志

---

## 实施优先级

### Phase 1: 基础设施（第一优先级）
1. 项目初始化（Story 0）
2. 数据库表结构
3. Repository 层实现
4. IPC 接口定义

### Phase 2: 核心功能
5. 间隔重复算法
6. 知识点 CRUD
7. 复习流程

### Phase 3: UI 与完善
8. 日历视图
9. 日记和提醒
10. 统计和设置

---

---

## 使用指南

### 致 AI 代理：

**📖 实施前必读：**
1. ✅ 阅读本文件和 `docs/architecture.md`
2. ✅ 严格遵守所有规则（特别是标记为"强制"的）
3. ✅ 遇到疑问时，选择更严格的选项
4. ✅ 发现新模式时，更新本文件

**🎯 核心原则：**
- **零容忍：** better-sqlite3 只能在主进程使用
- **类型安全：** 禁用 `any`，使用 `unknown`
- **命名约定：** 数据库 snake_case，TypeScript camelCase
- **错误处理：** 所有异步操作必须 try-catch + 日志
- **性能优化：** 列表 >50 项使用虚拟滚动

**⚠️ 违反这些规则将导致运行时错误或架构不一致！**

---

### 致开发者：

**📋 维护建议：**
- 保持文件精简，专注于 AI 可能忽略的细节
- 技术栈变更时及时更新
- 每季度审查并移除过时或显而易见的规则
- 发现新的反模式时立即记录

**🔄 更新触发条件：**
- 添加新技术依赖
- 发现 AI 代理的常见错误
- 架构决策变更
- 新的性能优化策略

**📊 当前状态：**
- 规则数量：85条
- 最后更新：2025-12-13
- 覆盖领域：13个关键类别
- 优化状态：已针对 LLM 优化

---

## 参考文档

**📚 完整文档链接：**
- 🏗️ 架构决策：`docs/architecture.md` (3088行)
- 📋 产品需求：`docs/prd.md` (72个FR + NFR)
- 🎨 UX 设计：`docs/ux-design-specification.md`
- 📈 工作流状态：`docs/bmm-workflow-status.yaml`

**⚠️ 重要：所有 AI 代理必须在实施前阅读本文档和架构文档！**

---

_最后更新：2025-12-13 | 下次审查：2026-03-13（3个月后）_
