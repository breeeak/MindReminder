# Story 4.5 实现指南:提醒事项功能

**Story ID:** 4.5  
**Story Title:** 提醒事项功能  
**Epic:** Epic 4 - 日历可视化与统计  
**优先级:** P0  
**Story Points:** 5  
**预估时间:** 7小时  
**依赖:** Story 4.1

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **在日历上管理学习相关的待办事项**,  
So that **我可以在一个地方统一管理学习计划**.

### 业务价值

- 提供提醒事项管理功能,让用户在日历上统一管理待办事项
- 支持设置提醒时间,到时发送桌面通知
- 支持标记完成/未完成状态
- 在日历上显示提醒标记,提升可视化体验
- 系统托盘显示未完成提醒数量徽章
- 与日历视图深度集成,形成完整的个人成长中枢

### 业务需求覆盖

- **FR33**: 用户可以创建提醒事项
- **FR34**: 用户可以为提醒事项设置时间
- **FR35**: 用户可以编辑提醒事项
- **FR36**: 用户可以删除提醒事项
- **FR37**: 用户可以标记提醒事项为已完成
- **FR38**: 系统可以在提醒时间到达时发送通知
- **FR39**: 用户可以在日历上看到未来的提醒事项
- **NFR-U1**: 新用户易学性(简单直观的编辑器)
- **NFR-P2**: UI响应时间 ≤ 200ms

---

## 📐 技术设计

### 架构层次

```
UI层(Renderer)
├── CalendarPage.tsx                  # 【修改】集成提醒标记显示
├── features/reminder/                # 【新建】提醒功能模块
│   ├── ReminderEditor.tsx            # 【新建】提醒编辑器
│   ├── ReminderViewer.tsx            # 【新建】提醒查看器
│   └── hooks/
│       └── useReminder.ts            # 【新建】提醒相关 hooks
├── stores/
│   └── reminderStore.ts              # 【新建】提醒状态管理

Service层(Main)
├── database/repositories/
│   └── ReminderRepository.ts         # 【新建】提醒 Repository
├── services/
│   ├── ReminderService.ts            # 【新建】提醒业务逻辑
│   └── NotificationService.ts        # 【修改】桌面通知服务
├── ipc/
│   └── reminderHandlers.ts           # 【新建】提醒 IPC 处理器
└── system/
    ├── notification.ts               # 【修改】系统通知集成
    └── scheduler.ts                  # 【新建】定时任务调度器

数据层
└── reminder 表                       # 【新建】提醒数据表
```

### 核心功能流程

#### 1. 创建提醒流程

```
用户操作(日历详情侧边栏点击"添加提醒")
    ↓
打开 ReminderEditor 对话框
    ↓ 输入标题、描述、日期、时间
用户点击保存
    ↓ window.api.reminder.create(data)
IPC → reminderService.create()
    ↓ reminderRepository.save()
保存到数据库
    ↓ 注册定时任务(scheduler.scheduleReminder)
返回成功 → 更新 reminderStore
    ↓
日历刷新 → 显示提醒标记(🔔)
    ↓
侧边栏显示提醒列表
```

#### 2. 提醒通知流程

```
定时任务触发(到达提醒时间)
    ↓
scheduler 检测到时间匹配
    ↓
调用 notificationService.send()
    ↓
发送桌面通知(Electron notification API)
    ↓
通知内容: 标题 + 描述
    ↓
用户点击通知
    ↓
打开应用并显示提醒详情
    ↓
系统托盘徽章更新(未完成数量)
```

#### 3. 标记完成流程

```
用户点击"标记完成"
    ↓ window.api.reminder.markComplete(id)
IPC → reminderService.markComplete()
    ↓ reminderRepository.update(id, { completed: 1 })
更新数据库
    ↓ 取消定时任务(scheduler.cancelReminder)
返回成功 → 更新 reminderStore
    ↓
日历刷新 → 标记变为"✓"
    ↓
列表显示删除线样式
    ↓
系统托盘徽章更新(数量-1)
```

---

## 🗄️ 数据库设计

### reminder 表(已存在,验证结构)

```sql
CREATE TABLE IF NOT EXISTS reminder (
  id TEXT PRIMARY KEY,              -- UUID
  title TEXT NOT NULL,              -- 标题(必填)
  content TEXT,                     -- 描述(可选)
  due_date INTEGER NOT NULL,        -- 提醒时间(Unix时间戳,毫秒)
  completed INTEGER DEFAULT 0,      -- 0/1 (未完成/已完成)
  completed_at INTEGER,             -- 完成时间
  created_at INTEGER NOT NULL,      -- 创建时间
  updated_at INTEGER NOT NULL,      -- 更新时间
  sync_status TEXT DEFAULT 'local'  -- 云同步状态(预留)
);

CREATE INDEX IF NOT EXISTS idx_reminder_due_date ON reminder(due_date);
CREATE INDEX IF NOT EXISTS idx_reminder_completed ON reminder(completed);
```

**注意事项:**

- `due_date` 字段存储Unix时间戳(毫秒),精确到分钟
- `completed` 字段为 INTEGER (0/1),在 TypeScript 中转换为 boolean
- 索引优化查询性能(按时间、按完成状态)

---

## 🔧 实施步骤

### Step 1: 数据层实现(2小时)

#### 1.1 验证数据库表结构

**文件:** `src/main/database/migrations/001_initial_schema.ts`

```typescript
// ✅ 验证 reminder 表已创建(应该已存在)
// 如果不存在,添加到 migration 中:

db.exec(`
  CREATE TABLE IF NOT EXISTS reminder (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    due_date INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'local'
  );

  CREATE INDEX IF NOT EXISTS idx_reminder_due_date ON reminder(due_date);
  CREATE INDEX IF NOT EXISTS idx_reminder_completed ON reminder(completed);
`)
```

#### 1.2 创建 Reminder TypeScript 类型

**文件:** `src/shared/types/reminder.types.ts` 【新建】

```typescript
// Reminder 实体类型
export interface Reminder {
  id: string // UUID
  title: string // 标题(必填)
  content?: string // 描述(可选)
  dueDate: number // 提醒时间(Unix时间戳,毫秒)
  completed: boolean // 是否完成
  completedAt?: number // 完成时间
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
  syncStatus?: string // 云同步状态
}

// 创建 Reminder DTO
export interface CreateReminderDTO {
  title: string // 标题(必填)
  content?: string // 描述(可选)
  dueDate: number // 提醒时间(Unix时间戳,毫秒)
}

// 更新 Reminder DTO
export interface UpdateReminderDTO {
  title?: string
  content?: string
  dueDate?: number
}

// 提醒列表筛选条件
export interface ReminderFilter {
  completed?: boolean // 筛选已完成/未完成
  startDate?: number // 开始时间
  endDate?: number // 结束时间
}
```

#### 1.3 创建 ReminderRepository

**文件:** `src/main/database/repositories/ReminderRepository.ts` 【新建】

```typescript
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type {
  Reminder,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderFilter
} from '@shared/types/reminder.types'
import log from '../../utils/logger'

export class ReminderRepository {
  constructor(private db: Database.Database) {}

  /**
   * 根据ID查找提醒
   */
  findById(id: string): Reminder | null {
    try {
      const row = this.db.prepare('SELECT * FROM reminder WHERE id = ?').get(id) as any

      if (!row) return null

      // 转换命名: snake_case → camelCase
      return this.mapRowToReminder(row)
    } catch (error) {
      log.error('ReminderRepository.findById failed:', { id, error })
      throw error
    }
  }

  /**
   * 查找所有提醒(支持筛选)
   */
  findAll(filter?: ReminderFilter): Reminder[] {
    try {
      let query = 'SELECT * FROM reminder WHERE 1=1'
      const params: any[] = []

      if (filter?.completed !== undefined) {
        query += ' AND completed = ?'
        params.push(filter.completed ? 1 : 0)
      }

      if (filter?.startDate) {
        query += ' AND due_date >= ?'
        params.push(filter.startDate)
      }

      if (filter?.endDate) {
        query += ' AND due_date <= ?'
        params.push(filter.endDate)
      }

      query += ' ORDER BY due_date ASC'

      const rows = this.db.prepare(query).all(...params) as any[]

      return rows.map((row) => this.mapRowToReminder(row))
    } catch (error) {
      log.error('ReminderRepository.findAll failed:', { filter, error })
      throw error
    }
  }

  /**
   * 获取未完成的提醒
   */
  findPending(): Reminder[] {
    return this.findAll({ completed: false })
  }

  /**
   * 获取即将到期的提醒(未来N分钟内)
   */
  findUpcoming(minutes: number = 60): Reminder[] {
    try {
      const now = Date.now()
      const future = now + minutes * 60 * 1000

      const rows = this.db
        .prepare(
          'SELECT * FROM reminder WHERE completed = 0 AND due_date >= ? AND due_date <= ? ORDER BY due_date ASC'
        )
        .all(now, future) as any[]

      return rows.map((row) => this.mapRowToReminder(row))
    } catch (error) {
      log.error('ReminderRepository.findUpcoming failed:', { minutes, error })
      throw error
    }
  }

  /**
   * 创建提醒
   */
  create(data: CreateReminderDTO): Reminder {
    const now = Date.now()
    const id = uuidv4()

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `
        INSERT INTO reminder (id, title, content, due_date, completed, created_at, updated_at, sync_status)
        VALUES (?, ?, ?, ?, 0, ?, ?, 'local')
      `
        )
        .run(id, data.title, data.content || null, data.dueDate, now, now)

      log.info('Reminder created', { id, title: data.title })

      return {
        id,
        title: data.title,
        content: data.content,
        dueDate: data.dueDate,
        completed: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local'
      }
    })

    return transaction()
  }

  /**
   * 更新提醒
   */
  update(id: string, data: UpdateReminderDTO): Reminder {
    const now = Date.now()

    const transaction = this.db.transaction(() => {
      const updates: string[] = []
      const params: any[] = []

      if (data.title !== undefined) {
        updates.push('title = ?')
        params.push(data.title)
      }

      if (data.content !== undefined) {
        updates.push('content = ?')
        params.push(data.content)
      }

      if (data.dueDate !== undefined) {
        updates.push('due_date = ?')
        params.push(data.dueDate)
      }

      updates.push('updated_at = ?')
      params.push(now)

      params.push(id)

      const result = this.db
        .prepare(`UPDATE reminder SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params)

      if (result.changes === 0) {
        throw new Error(`Reminder not found: ${id}`)
      }

      log.info('Reminder updated', { id })

      return this.findById(id)!
    })

    return transaction()
  }

  /**
   * 标记为已完成
   */
  markComplete(id: string): Reminder {
    const now = Date.now()

    const transaction = this.db.transaction(() => {
      const result = this.db
        .prepare('UPDATE reminder SET completed = 1, completed_at = ?, updated_at = ? WHERE id = ?')
        .run(now, now, id)

      if (result.changes === 0) {
        throw new Error(`Reminder not found: ${id}`)
      }

      log.info('Reminder marked complete', { id })

      return this.findById(id)!
    })

    return transaction()
  }

  /**
   * 删除提醒
   */
  delete(id: string): void {
    const transaction = this.db.transaction(() => {
      const result = this.db.prepare('DELETE FROM reminder WHERE id = ?').run(id)

      if (result.changes === 0) {
        log.warn('Reminder not found for deletion', { id })
        throw new Error(`Reminder not found: ${id}`)
      }

      log.info('Reminder deleted', { id })
    })

    transaction()
  }

  /**
   * 获取未完成提醒数量
   */
  countPending(): number {
    try {
      const row = this.db
        .prepare('SELECT COUNT(*) as count FROM reminder WHERE completed = 0')
        .get() as any
      return row.count
    } catch (error) {
      log.error('ReminderRepository.countPending failed:', error)
      throw error
    }
  }

  /**
   * 辅助方法: 数据库行转换为 Reminder 对象
   */
  private mapRowToReminder(row: any): Reminder {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      dueDate: row.due_date,
      completed: Boolean(row.completed),
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: row.sync_status
    }
  }
}
```

#### 1.4 创建 ReminderService

**文件:** `src/main/services/ReminderService.ts` 【新建】

```typescript
import type { ReminderRepository } from '../database/repositories/ReminderRepository'
import type {
  Reminder,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderFilter
} from '@shared/types/reminder.types'
import log from '../utils/logger'

export class ReminderService {
  constructor(private reminderRepository: ReminderRepository) {}

  /**
   * 根据ID获取提醒
   */
  getById(id: string): Reminder | null {
    return this.reminderRepository.findById(id)
  }

  /**
   * 获取所有提醒(支持筛选)
   */
  getAll(filter?: ReminderFilter): Reminder[] {
    return this.reminderRepository.findAll(filter)
  }

  /**
   * 获取未完成的提醒
   */
  getPending(): Reminder[] {
    return this.reminderRepository.findPending()
  }

  /**
   * 获取即将到期的提醒
   */
  getUpcoming(minutes: number = 60): Reminder[] {
    return this.reminderRepository.findUpcoming(minutes)
  }

  /**
   * 创建提醒
   */
  create(data: CreateReminderDTO): Reminder {
    // 验证标题
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Reminder title cannot be empty')
    }

    // 验证时间
    if (!data.dueDate || data.dueDate <= Date.now()) {
      throw new Error('Reminder due date must be in the future')
    }

    return this.reminderRepository.create(data)
  }

  /**
   * 更新提醒
   */
  update(id: string, data: UpdateReminderDTO): Reminder {
    // 验证时间(如果提供)
    if (data.dueDate !== undefined && data.dueDate <= Date.now()) {
      throw new Error('Reminder due date must be in the future')
    }

    return this.reminderRepository.update(id, data)
  }

  /**
   * 标记为已完成
   */
  markComplete(id: string): Reminder {
    return this.reminderRepository.markComplete(id)
  }

  /**
   * 删除提醒
   */
  delete(id: string): void {
    this.reminderRepository.delete(id)
  }

  /**
   * 获取未完成提醒数量
   */
  getPendingCount(): number {
    return this.reminderRepository.countPending()
  }
}
```

#### 1.5 创建 IPC 处理器

**文件:** `src/main/ipc/reminderHandlers.ts` 【新建】

```typescript
import { ipcMain } from 'electron'
import type { ReminderService } from '../services/ReminderService'
import log from '../utils/logger'

export function registerReminderHandlers(reminderService: ReminderService): void {
  // 根据ID获取提醒
  ipcMain.handle('reminder:getById', async (event, id: string) => {
    try {
      const reminder = reminderService.getById(id)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:getById failed:', { id, error })
      throw error
    }
  })

  // 获取所有提醒(支持筛选)
  ipcMain.handle('reminder:getAll', async (event, filter?: any) => {
    try {
      const reminders = reminderService.getAll(filter)
      return { data: reminders }
    } catch (error) {
      log.error('IPC reminder:getAll failed:', { filter, error })
      throw error
    }
  })

  // 获取未完成的提醒
  ipcMain.handle('reminder:getPending', async () => {
    try {
      const reminders = reminderService.getPending()
      return { data: reminders }
    } catch (error) {
      log.error('IPC reminder:getPending failed:', error)
      throw error
    }
  })

  // 创建提醒
  ipcMain.handle('reminder:create', async (event, data: any) => {
    try {
      const reminder = reminderService.create(data)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:create failed:', { data, error })
      throw error
    }
  })

  // 更新提醒
  ipcMain.handle('reminder:update', async (event, id: string, data: any) => {
    try {
      const reminder = reminderService.update(id, data)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:update failed:', { id, data, error })
      throw error
    }
  })

  // 标记为已完成
  ipcMain.handle('reminder:markComplete', async (event, id: string) => {
    try {
      const reminder = reminderService.markComplete(id)
      return { data: reminder }
    } catch (error) {
      log.error('IPC reminder:markComplete failed:', { id, error })
      throw error
    }
  })

  // 删除提醒
  ipcMain.handle('reminder:delete', async (event, id: string) => {
    try {
      reminderService.delete(id)
      return { data: null }
    } catch (error) {
      log.error('IPC reminder:delete failed:', { id, error })
      throw error
    }
  })

  // 获取未完成提醒数量
  ipcMain.handle('reminder:getPendingCount', async () => {
    try {
      const count = reminderService.getPendingCount()
      return { data: count }
    } catch (error) {
      log.error('IPC reminder:getPendingCount failed:', error)
      throw error
    }
  })

  log.info('Reminder IPC handlers registered')
}
```

#### 1.6 注册 IPC 处理器

**文件:** `src/main/ipc/index.ts` 【修改】

```typescript
import { ReminderRepository } from '../database/repositories/ReminderRepository'
import { ReminderService } from '../services/ReminderService'
import { registerReminderHandlers } from './reminderHandlers'

// ... 现有代码 ...

export function registerAllHandlers(db: Database.Database): void {
  // ... 现有的 handlers ...

  // 注册提醒 handlers
  const reminderRepository = new ReminderRepository(db)
  const reminderService = new ReminderService(reminderRepository)
  registerReminderHandlers(reminderService)

  log.info('All IPC handlers registered')
}
```

#### 1.7 扩展 Preload API

**文件:** `src/preload/index.d.ts` 【修改】

```typescript
import type {
  Reminder,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderFilter
} from '@shared/types/reminder.types'

interface ElectronAPI {
  // ... 现有的 API ...

  // 提醒 API
  reminder: {
    getById: (id: string) => Promise<{ data: Reminder | null }>
    getAll: (filter?: ReminderFilter) => Promise<{ data: Reminder[] }>
    getPending: () => Promise<{ data: Reminder[] }>
    create: (data: CreateReminderDTO) => Promise<{ data: Reminder }>
    update: (id: string, data: UpdateReminderDTO) => Promise<{ data: Reminder }>
    markComplete: (id: string) => Promise<{ data: Reminder }>
    delete: (id: string) => Promise<{ data: null }>
    getPendingCount: () => Promise<{ data: number }>
  }
}
```

**文件:** `src/preload/index.ts` 【修改】

```typescript
contextBridge.exposeInMainWorld('api', {
  // ... 现有的 API ...

  // 提醒 API
  reminder: {
    getById: (id: string) => ipcRenderer.invoke('reminder:getById', id),
    getAll: (filter?: ReminderFilter) => ipcRenderer.invoke('reminder:getAll', filter),
    getPending: () => ipcRenderer.invoke('reminder:getPending'),
    create: (data: CreateReminderDTO) => ipcRenderer.invoke('reminder:create', data),
    update: (id: string, data: UpdateReminderDTO) =>
      ipcRenderer.invoke('reminder:update', id, data),
    markComplete: (id: string) => ipcRenderer.invoke('reminder:markComplete', id),
    delete: (id: string) => ipcRenderer.invoke('reminder:delete', id),
    getPendingCount: () => ipcRenderer.invoke('reminder:getPendingCount')
  }
})
```

---

### Step 2: 通知系统实现(1.5小时)

#### 2.1 创建定时任务调度器

**文件:** `src/main/system/scheduler.ts` 【新建】

```typescript
import type { ReminderService } from '../services/ReminderService'
import { Notification } from 'electron'
import log from '../utils/logger'

interface ScheduledTask {
  reminderId: string
  timeout: NodeJS.Timeout
}

export class ReminderScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map()
  private checkInterval: NodeJS.Timeout | null = null

  constructor(private reminderService: ReminderService) {}

  /**
   * 启动调度器(每分钟检查一次)
   */
  start(): void {
    log.info('ReminderScheduler starting...')

    // 初始化时加载所有未完成的提醒
    this.scheduleAllPendingReminders()

    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkAndNotify()
    }, 60 * 1000) // 60秒

    log.info('ReminderScheduler started')
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    // 清除所有已注册的任务
    this.scheduledTasks.forEach((task) => clearTimeout(task.timeout))
    this.scheduledTasks.clear()

    log.info('ReminderScheduler stopped')
  }

  /**
   * 注册单个提醒
   */
  scheduleReminder(reminderId: string, dueDate: number): void {
    const delay = dueDate - Date.now()

    // 如果已经过期,忽略
    if (delay < 0) {
      log.warn('Reminder is overdue, skipping schedule', { reminderId, dueDate })
      return
    }

    // 如果已存在,先取消
    this.cancelReminder(reminderId)

    // 注册新任务
    const timeout = setTimeout(() => {
      this.notifyReminder(reminderId)
      this.scheduledTasks.delete(reminderId)
    }, delay)

    this.scheduledTasks.set(reminderId, { reminderId, timeout })

    log.info('Reminder scheduled', { reminderId, dueDate, delay })
  }

  /**
   * 取消提醒
   */
  cancelReminder(reminderId: string): void {
    const task = this.scheduledTasks.get(reminderId)
    if (task) {
      clearTimeout(task.timeout)
      this.scheduledTasks.delete(reminderId)
      log.info('Reminder cancelled', { reminderId })
    }
  }

  /**
   * 加载所有未完成的提醒
   */
  private scheduleAllPendingReminders(): void {
    try {
      const reminders = this.reminderService.getPending()
      reminders.forEach((reminder) => {
        this.scheduleReminder(reminder.id, reminder.dueDate)
      })
      log.info('All pending reminders scheduled', { count: reminders.length })
    } catch (error) {
      log.error('Failed to schedule pending reminders', error)
    }
  }

  /**
   * 检查并通知到期的提醒
   */
  private checkAndNotify(): void {
    try {
      const now = Date.now()
      const reminders = this.reminderService.getPending()

      reminders.forEach((reminder) => {
        if (reminder.dueDate <= now) {
          this.notifyReminder(reminder.id)
        }
      })
    } catch (error) {
      log.error('Failed to check reminders', error)
    }
  }

  /**
   * 发送提醒通知
   */
  private notifyReminder(reminderId: string): void {
    try {
      const reminder = this.reminderService.getById(reminderId)
      if (!reminder || reminder.completed) {
        return
      }

      // 发送桌面通知
      const notification = new Notification({
        title: '⏰ 提醒',
        body: reminder.title,
        silent: false
      })

      notification.show()

      // 点击通知时打开应用并显示提醒详情
      notification.on('click', () => {
        // TODO: 打开主窗口并显示提醒详情
        log.info('Notification clicked', { reminderId })
      })

      log.info('Reminder notification sent', { reminderId, title: reminder.title })
    } catch (error) {
      log.error('Failed to notify reminder', { reminderId, error })
    }
  }
}
```

#### 2.2 在主进程中初始化调度器

**文件:** `src/main/index.ts` 【修改】

```typescript
import { ReminderScheduler } from './system/scheduler'

// ... 现有代码 ...

let reminderScheduler: ReminderScheduler | null = null

app.whenReady().then(() => {
  // ... 现有初始化代码 ...

  // 初始化数据库和服务
  const db = initDatabase()
  const reminderRepository = new ReminderRepository(db)
  const reminderService = new ReminderService(reminderRepository)

  // 启动提醒调度器
  reminderScheduler = new ReminderScheduler(reminderService)
  reminderScheduler.start()

  // ... 现有代码 ...
})

app.on('will-quit', () => {
  // 停止调度器
  if (reminderScheduler) {
    reminderScheduler.stop()
  }
})
```

---

### Step 3: 状态管理层实现(1小时)

#### 3.1 创建 reminderStore

**文件:** `src/renderer/src/stores/reminderStore.ts` 【新建】

```typescript
import { create } from 'zustand'
import type { Reminder, CreateReminderDTO, UpdateReminderDTO, ReminderFilter } from '@shared/types'
import { message } from 'antd'

interface ReminderStore {
  // 状态
  reminders: Reminder[]
  currentReminder: Reminder | null
  pendingCount: number
  loading: boolean
  saving: boolean

  // Actions
  fetchAll: (filter?: ReminderFilter) => Promise<void>
  fetchPending: () => Promise<void>
  fetchPendingCount: () => Promise<void>
  createReminder: (data: CreateReminderDTO) => Promise<void>
  updateReminder: (id: string, data: UpdateReminderDTO) => Promise<void>
  markComplete: (id: string) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  setCurrentReminder: (reminder: Reminder | null) => void
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  // 初始状态
  reminders: [],
  currentReminder: null,
  pendingCount: 0,
  loading: false,
  saving: false,

  // 获取所有提醒(支持筛选)
  fetchAll: async (filter?: ReminderFilter) => {
    set({ loading: true })
    try {
      const response = await window.api.reminder.getAll(filter)
      set({ reminders: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch reminders:', error)
      message.error('获取提醒失败')
      set({ loading: false })
      throw error
    }
  },

  // 获取未完成的提醒
  fetchPending: async () => {
    set({ loading: true })
    try {
      const response = await window.api.reminder.getPending()
      set({ reminders: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch pending reminders:', error)
      message.error('获取提醒失败')
      set({ loading: false })
      throw error
    }
  },

  // 获取未完成提醒数量
  fetchPendingCount: async () => {
    try {
      const response = await window.api.reminder.getPendingCount()
      set({ pendingCount: response.data })
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
      // 静默失败
    }
  },

  // 创建提醒
  createReminder: async (data: CreateReminderDTO) => {
    set({ saving: true })
    try {
      const response = await window.api.reminder.create(data)
      set((state) => ({
        reminders: [...state.reminders, response.data],
        saving: false
      }))

      // 刷新计数
      await get().fetchPendingCount()

      message.success('提醒创建成功')
    } catch (error) {
      console.error('Failed to create reminder:', error)
      message.error('创建提醒失败')
      set({ saving: false })
      throw error
    }
  },

  // 更新提醒
  updateReminder: async (id: string, data: UpdateReminderDTO) => {
    set({ saving: true })
    try {
      const response = await window.api.reminder.update(id, data)
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? response.data : r)),
        currentReminder: state.currentReminder?.id === id ? response.data : state.currentReminder,
        saving: false
      }))

      message.success('提醒更新成功')
    } catch (error) {
      console.error('Failed to update reminder:', error)
      message.error('更新提醒失败')
      set({ saving: false })
      throw error
    }
  },

  // 标记为已完成
  markComplete: async (id: string) => {
    set({ loading: true })
    try {
      const response = await window.api.reminder.markComplete(id)
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? response.data : r)),
        currentReminder: state.currentReminder?.id === id ? response.data : state.currentReminder,
        loading: false
      }))

      // 刷新计数
      await get().fetchPendingCount()

      message.success('已标记为完成')
    } catch (error) {
      console.error('Failed to mark complete:', error)
      message.error('标记失败')
      set({ loading: false })
      throw error
    }
  },

  // 删除提醒
  deleteReminder: async (id: string) => {
    set({ loading: true })
    try {
      await window.api.reminder.delete(id)
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id),
        currentReminder: state.currentReminder?.id === id ? null : state.currentReminder,
        loading: false
      }))

      // 刷新计数
      await get().fetchPendingCount()

      message.success('提醒删除成功')
    } catch (error) {
      console.error('Failed to delete reminder:', error)
      message.error('删除提醒失败')
      set({ loading: false })
      throw error
    }
  },

  // 设置当前提醒
  setCurrentReminder: (reminder: Reminder | null) => {
    set({ currentReminder: reminder })
  }
}))
```

---

### Step 4: UI 组件实现(2小时)

#### 4.1 创建 ReminderEditor 组件

**文件:** `src/renderer/src/features/reminder/ReminderEditor.tsx` 【新建】

```typescript
import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, DatePicker, Button } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import type { CreateReminderDTO, Reminder } from '@shared/types'
import { useReminderStore } from '../../stores/reminderStore'

interface ReminderEditorProps {
  reminder?: Reminder // 编辑模式:传入现有提醒
  defaultDate?: string // YYYY-MM-DD
  open: boolean
  onClose: () => void
}

export const ReminderEditor: React.FC<ReminderEditorProps> = ({
  reminder,
  defaultDate,
  open,
  onClose
}) => {
  const [form] = Form.useForm()
  const { saving, createReminder, updateReminder } = useReminderStore()

  // 初始化表单
  useEffect(() => {
    if (open) {
      if (reminder) {
        // 编辑模式:填充现有数据
        form.setFieldsValue({
          title: reminder.title,
          content: reminder.content,
          dueDateTime: dayjs(reminder.dueDate)
        })
      } else {
        // 创建模式:使用默认值
        const defaultDateTime = defaultDate
          ? dayjs(defaultDate).hour(9).minute(0)
          : dayjs().add(1, 'hour')

        form.setFieldsValue({
          title: '',
          content: '',
          dueDateTime: defaultDateTime
        })
      }
    }
  }, [open, reminder, defaultDate])

  // 保存提醒
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const dueDate = (values.dueDateTime as Dayjs).valueOf()

      if (reminder) {
        // 更新模式
        await updateReminder(reminder.id, {
          title: values.title,
          content: values.content,
          dueDate
        })
      } else {
        // 创建模式
        await createReminder({
          title: values.title,
          content: values.content,
          dueDate
        })
      }

      form.resetFields()
      onClose()
    } catch (error) {
      // 错误已在 store 中处理
    }
  }

  return (
    <Modal
      title={reminder ? '编辑提醒' : '添加提醒'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          保存
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="标题"
          name="title"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="如:晚上复习英语单词" maxLength={100} />
        </Form.Item>

        <Form.Item label="描述" name="content">
          <Input.TextArea
            placeholder="添加详细描述(可选)"
            rows={3}
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="提醒时间"
          name="dueDateTime"
          rules={[{ required: true, message: '请选择提醒时间' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

#### 4.2 创建 ReminderViewer 组件

**文件:** `src/renderer/src/features/reminder/ReminderViewer.tsx` 【新建】

```typescript
import React from 'react'
import { Card, Button, Space, Tag, Popconfirm } from 'antd'
import { CheckCircleOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Reminder } from '@shared/types'
import './ReminderViewer.css'

interface ReminderViewerProps {
  reminder: Reminder
  onEdit: () => void
  onDelete: () => void
  onMarkComplete: () => void
}

export const ReminderViewer: React.FC<ReminderViewerProps> = ({
  reminder,
  onEdit,
  onDelete,
  onMarkComplete
}) => {
  const isOverdue = !reminder.completed && reminder.dueDate < Date.now()
  const dueDateFormatted = dayjs(reminder.dueDate).format('YYYY-MM-DD HH:mm')

  return (
    <Card
      className={`reminder-card ${reminder.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
      size="small"
    >
      <div className="reminder-header">
        <div className="reminder-title">
          {reminder.completed && <CheckCircleOutlined className="complete-icon" />}
          <span className={reminder.completed ? 'title-completed' : ''}>{reminder.title}</span>
        </div>
        <Space>
          {!reminder.completed && (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={onMarkComplete}>
              完成
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个提醒吗?"
            description="删除后将无法恢复"
            onConfirm={onDelete}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {reminder.content && (
        <div className="reminder-content">{reminder.content}</div>
      )}

      <div className="reminder-footer">
        <Space size="small">
          <ClockCircleOutlined />
          <span className={isOverdue ? 'overdue-text' : ''}>
            {dueDateFormatted}
            {isOverdue && ' (已过期)'}
          </span>
        </Space>

        {reminder.completed && (
          <Tag color="success">已完成</Tag>
        )}
      </div>
    </Card>
  )
}
```

**文件:** `src/renderer/src/features/reminder/ReminderViewer.css` 【新建】

```css
.reminder-card {
  margin-bottom: 12px;
}

.reminder-card.completed {
  opacity: 0.7;
  background: #f5f5f5;
}

.reminder-card.overdue {
  border-left: 3px solid #ff4d4f;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reminder-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.title-completed {
  text-decoration: line-through;
  color: #999;
}

.complete-icon {
  color: #52c41a;
}

.reminder-content {
  margin: 12px 0;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.reminder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
}

.overdue-text {
  color: #ff4d4f;
  font-weight: 500;
}
```

#### 4.3 修改 CalendarPage - 集成提醒功能

**文件:** `src/renderer/src/pages/CalendarPage.tsx` 【修改】

```typescript
import { ReminderEditor } from '../features/reminder/ReminderEditor'
import { ReminderViewer } from '../features/reminder/ReminderViewer'
import { useReminderStore } from '../stores/reminderStore'

// ... 现有代码 ...

function CalendarPage() {
  // ... 现有状态 ...

  // 提醒相关状态
  const [reminderEditorOpen, setReminderEditorOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const { reminders, pendingCount, fetchAll, fetchPendingCount, markComplete, deleteReminder } = useReminderStore()

  // 组件加载时获取提醒数据
  useEffect(() => {
    fetchAll()
    fetchPendingCount()
  }, [])

  // 打开提醒编辑器(创建模式)
  const handleOpenReminderEditor = () => {
    setEditingReminder(null)
    setReminderEditorOpen(true)
  }

  // 打开提醒编辑器(编辑模式)
  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setReminderEditorOpen(true)
  }

  // 关闭提醒编辑器
  const handleCloseReminderEditor = () => {
    setReminderEditorOpen(false)
    setEditingReminder(null)
    // 刷新提醒列表
    fetchAll()
  }

  // 标记完成
  const handleMarkComplete = async (id: string) => {
    await markComplete(id)
    fetchAll() // 刷新列表
  }

  // 删除提醒
  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id)
    fetchAll() // 刷新列表
  }

  return (
    <div className="calendar-page">
      {/* ... 现有的日历热力图等组件 ... */}

      {/* 日期详情侧边栏 */}
      <Drawer
        title={`${selectedDate} 详情`}
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        width={400}
      >
        {/* ... 现有的活动列表和日记部分 ... */}

        {/* 提醒部分 */}
        <div className="reminder-section">
          <div className="section-header">
            <h4>⏰ 提醒事项 ({reminders.filter(r => !r.completed).length})</h4>
            <Button type="dashed" size="small" onClick={handleOpenReminderEditor}>
              添加提醒
            </Button>
          </div>

          <div className="reminder-list">
            {reminders.length === 0 ? (
              <div className="empty-state">暂无提醒</div>
            ) : (
              reminders.map(reminder => (
                <ReminderViewer
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={() => handleEditReminder(reminder)}
                  onDelete={() => handleDeleteReminder(reminder.id)}
                  onMarkComplete={() => handleMarkComplete(reminder.id)}
                />
              ))
            )}
          </div>
        </div>
      </Drawer>

      {/* 提醒编辑器对话框 */}
      <ReminderEditor
        reminder={editingReminder || undefined}
        defaultDate={selectedDate || undefined}
        open={reminderEditorOpen}
        onClose={handleCloseReminderEditor}
      />
    </div>
  )
}
```

#### 4.4 修改日历热力图 - 添加提醒标记

**文件:** `src/renderer/src/features/calendar/CalendarHeatmap.tsx` 【修改】

```typescript
import { useReminderStore } from '../../stores/reminderStore'

function CalendarHeatmap() {
  const { reminders } = useReminderStore()

  // ... 现有代码 ...

  // 获取某日期的未完成提醒数量
  const getPendingRemindersCount = (date: string): number => {
    const dateStart = dayjs(date).startOf('day').valueOf()
    const dateEnd = dayjs(date).endOf('day').valueOf()

    return reminders.filter(
      r => !r.completed && r.dueDate >= dateStart && r.dueDate <= dateEnd
    ).length
  }

  // 渲染日期方块
  const renderDateCell = (date: string, activityCount: number) => {
    const hasDiary = diaryDates.includes(date)
    const pendingReminders = getPendingRemindersCount(date)

    return (
      <div className="calendar-cell" onClick={() => onDateClick(date)}>
        <div className="cell-content" style={{ background: getHeatmapColor(activityCount) }}>
          <span className="date-number">{dayjs(date).format('D')}</span>
          {hasDiary && <span className="diary-marker">📝</span>}
          {pendingReminders > 0 && (
            <span className="reminder-marker">
              🔔{pendingReminders > 1 && <span className="reminder-count">{pendingReminders}</span>}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ... 现有代码 ...
}
```

**对应CSS更新:**

```css
.reminder-marker {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 2px;
}

.reminder-count {
  font-size: 8px;
  color: #fa8c16;
  font-weight: bold;
}
```

---

### Step 5: 系统托盘徽章实现(0.5小时)

#### 5.1 更新系统托盘显示未完成数量

**文件:** `src/main/system/tray.ts` 【修改】

```typescript
import { Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import type { ReminderService } from '../services/ReminderService'

let tray: Tray | null = null

export function createTray(reminderService: ReminderService): void {
  const iconPath = path.join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon)

  // 更新托盘徽章
  updateTrayBadge(reminderService)

  // 每分钟更新一次徽章
  setInterval(() => {
    updateTrayBadge(reminderService)
  }, 60 * 1000)

  // 设置托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开主窗口',
      click: () => {
        /* TODO */
      }
    },
    {
      label: '快速记录',
      click: () => {
        /* TODO */
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        /* TODO */
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('MindReminder')
}

function updateTrayBadge(reminderService: ReminderService): void {
  try {
    const count = reminderService.getPendingCount()
    if (tray) {
      if (count > 0) {
        // 显示未完成提醒数量
        tray.setTitle(`${count}`) // macOS
        // Windows: 可以通过修改图标叠加来显示徽章
      } else {
        tray.setTitle('') // 清空
      }
    }
  } catch (error) {
    console.error('Failed to update tray badge:', error)
  }
}
```

---

### Step 6: 手动测试与验证(0.5小时)

#### 6.1 测试清单

**测试 1: 创建提醒**

- [ ] 在日历详情侧边栏点击"添加提醒"按钮
- [ ] 打开提醒编辑器对话框
- [ ] 输入标题、描述、选择日期时间
- [ ] 点击保存
- [ ] 验证保存成功提示
- [ ] 验证日历上显示提醒标记(🔔)
- [ ] 验证侧边栏显示提醒卡片

**测试 2: 查看提醒**

- [ ] 点击有提醒标记的日期
- [ ] 验证侧边栏显示提醒列表
- [ ] 验证显示标题、描述、时间
- [ ] 验证显示"完成"、"编辑"、"删除"按钮

**测试 3: 编辑提醒**

- [ ] 点击"编辑"按钮
- [ ] 验证编辑器预填充现有内容
- [ ] 修改内容并保存
- [ ] 验证更新成功提示
- [ ] 验证侧边栏显示更新后的内容

**测试 4: 标记完成**

- [ ] 点击"完成"按钮
- [ ] 验证标记成功提示
- [ ] 验证卡片显示"已完成"标签
- [ ] 验证标题显示删除线
- [ ] 验证日历标记变为"✓"
- [ ] 验证系统托盘徽章数量-1

**测试 5: 删除提醒**

- [ ] 点击"删除"按钮
- [ ] 验证显示确认对话框
- [ ] 确认删除
- [ ] 验证删除成功提示
- [ ] 验证日历上的提醒标记消失
- [ ] 验证系统托盘徽章更新

**测试 6: 提醒通知**

- [ ] 创建一个1分钟后的提醒
- [ ] 等待1分钟
- [ ] 验证收到桌面通知
- [ ] 验证通知内容正确(标题)
- [ ] 点击通知验证打开应用

**测试 7: 边界情况**

- [ ] 测试空标题保存(应显示验证错误)
- [ ] 测试过去时间选择(应禁用)
- [ ] 测试超长标题(100字符限制)
- [ ] 测试同一天多个提醒
- [ ] 测试已完成提醒的编辑

**测试 8: 性能测试**

- [ ] 创建50个提醒
- [ ] 验证列表加载速度 < 1秒
- [ ] 验证提醒标记显示正常
- [ ] 验证编辑器打开速度 < 200ms
- [ ] 验证通知系统稳定性

---

## ✅ 验收标准检查清单

### 功能完整性

- [ ] **AC1**: 用户可以在日历视图点击未来某日期并选择"添加提醒"
- [ ] **AC2**: 打开提醒编辑表单,包含字段:标题(必填)、描述(可选)、日期、时间
- [ ] **AC3**: 用户保存提醒后,提醒保存到数据库
- [ ] **AC4**: 日历上该日期显示提醒标记(🔔图标)
- [ ] **AC5**: 侧边栏显示提醒列表
- [ ] **AC6**: 用户点击提醒,显示提醒详情
- [ ] **AC7**: 显示"标记完成"和"编辑"按钮
- [ ] **AC8**: 用户标记提醒完成,提醒状态更新为"已完成"
- [ ] **AC9**: 日历图标变为"✓"
- [ ] **AC10**: 列表中提醒显示删除线
- [ ] **AC11**: 提醒时间到达时,发送桌面通知
- [ ] **AC12**: 通知标题为提醒标题,点击通知打开应用并显示提醒详情
- [ ] **AC13**: 系统托盘显示未完成提醒数量徽章

### 技术要求

- [ ] 数据库表结构正确
- [ ] Repository 层正确处理命名转换
- [ ] IPC 通道命名符合规范
- [ ] 所有数据库操作使用事务
- [ ] 所有异步操作有完整的错误处理
- [ ] 定时任务调度器正常工作
- [ ] 桌面通知API正确使用
- [ ] 系统托盘徽章正确更新
- [ ] TypeScript 类型定义完整
- [ ] UI 响应时间 < 200ms

### 代码质量

- [ ] 遵循命名约定
- [ ] 遵循项目结构规范
- [ ] 无 TypeScript 编译错误
- [ ] 无 ESLint 警告
- [ ] 代码格式化(Prettier)
- [ ] 关键逻辑有注释

---

## 📊 Story 完成报告模板

```markdown
# Story 4.5 完成报告

## 实施摘要

- 实际工时: X 小时
- 完成日期: YYYY-MM-DD
- 实施人员: [姓名]

## 完成内容

✅ 数据库层

- [x] reminder 表验证
- [x] ReminderRepository 实现
- [x] 8个数据访问方法

✅ Service 层

- [x] ReminderService 实现
- [x] 业务逻辑和验证

✅ IPC 层

- [x] 8个 IPC 通道
- [x] Preload API 扩展

✅ 通知系统

- [x] ReminderScheduler 实现
- [x] 桌面通知集成
- [x] 定时任务调度

✅ 状态管理

- [x] reminderStore 实现

✅ UI 组件

- [x] ReminderEditor 组件
- [x] ReminderViewer 组件
- [x] CalendarPage 集成
- [x] CalendarHeatmap 提醒标记

✅ 系统集成

- [x] 系统托盘徽章

## 测试结果

- 手动测试: X/X 通过
- 性能测试: 符合要求
- 边界测试: 通过

## 遇到的问题

1. 问题描述
   - 解决方案

## 后续优化建议

1. [可选] 支持重复提醒
2. [可选] 提醒优先级
3. [可选] 提醒分类标签
```

---

## 🎯 关键注意事项

### ⚠️ 必须遵守的规则

1. **数据库命名**: 所有字段使用 `snake_case`
2. **TypeScript 命名**: 所有代码使用 `camelCase`
3. **Repository 转换**: 必须在 Repository 层处理命名转换
4. **IPC 命名**: 所有通道使用 `reminder:{操作}` 格式
5. **事务保护**: 所有写操作必须使用事务
6. **时间格式**: 统一使用 Unix 时间戳(毫秒)
7. **布尔值转换**: 数据库 INTEGER (0/1) ↔ TypeScript boolean
8. **错误处理**: 所有异步操作必须 try-catch
9. **日志记录**: 所有 CRUD 操作记录 info 日志
10. **类型安全**: 禁用 `any`,使用明确类型

### 🔍 性能考虑

- 定时任务每分钟检查一次,避免频繁查询
- 提醒列表按时间排序,优化用户体验
- 系统托盘徽章缓存,减少重复计算
- 通知系统异步处理,不阻塞主线程

### 🎨 UX 考虑

- 提醒标记使用 🔔 表情符号,直观易识别
- 已完成提醒显示删除线,状态清晰
- 过期提醒用红色标识,引起注意
- 系统托盘徽章实时更新,保持同步
- 桌面通知内容简洁明了

---

## 📚 参考文档

- **架构文档**: `docs/architecture.md`
- **Epic 4**: `docs/stories/epic-4-calendar.md`
- **Story 4.1**: `docs/stories/story-4.1-implementation-guide.md`
- **Story 4.4**: `docs/stories/story-4.4-implementation-guide.md`

---

**Story 创建时间**: 2025-12-14  
**上一个 Story**: Story 4.4 - 日记功能  
**下一个 Story**: [待定]



