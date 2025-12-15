# Story 4.4 实现指南：日记功能

**Story ID:** 4.4  
**Story Title:** 日记功能  
**Epic:** Epic 4 - 日历可视化与统计  
**优先级:** P0  
**Story Points:** 5  
**预估时间:** 7小时  
**依赖:** Story 4.1, Story 4.2

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **记录每日学习心得和思考**,  
So that **我可以回顾学习历程，记录成长**.

### 业务价值

- 提供日记记录功能，让用户记录每日学习心得和思考
- 支持 Markdown 格式编写，提供丰富的文本编辑能力
- 在日历上标记有日记的日期，提升可视化体验
- 支持日记的增删改查操作，完整的内容管理能力
- 与日历视图深度集成，形成完整的个人成长档案

### 业务需求覆盖

- **FR27**: 用户可以记录每日日记
- **FR28**: 用户可以使用富文本或Markdown格式编写日记
- **FR29**: 用户可以编辑已有日记
- **FR30**: 用户可以删除日记
- **FR31**: 用户可以在日历上看到有日记的日期标记
- **FR32**: 用户可以查看某一天的日记内容
- **NFR-U1**: 新用户易学性（简单直观的编辑器）
- **NFR-P2**: UI响应时间 ≤ 200ms

---

## 📐 技术设计

### 架构层次

```
UI层（Renderer）
├── CalendarPage.tsx                  # 【修改】集成日记标记显示
├── features/diary/                   # 【新建】日记功能模块
│   ├── DiaryEditor.tsx               # 【新建】日记编辑器（Markdown）
│   ├── DiaryViewer.tsx               # 【新建】日记查看器（渲染Markdown）
│   └── hooks/
│       └── useDiary.ts               # 【新建】日记相关 hooks
├── stores/
│   └── diaryStore.ts                 # 【新建】日记状态管理

Service层（Main）
├── database/repositories/
│   └── DiaryRepository.ts            # 【新建】日记 Repository
├── services/
│   └── DiaryService.ts               # 【新建】日记业务逻辑
└── ipc/
    └── diaryHandlers.ts              # 【新建】日记 IPC 处理器

数据层
└── diary 表                          # 【新建】日记数据表
```

### 核心功能流程

#### 1. 创建/编辑日记流程

```
用户操作（日历详情侧边栏点击"写日记"）
    ↓
打开 DiaryEditor 对话框
    ↓ 输入Markdown内容
用户点击保存
    ↓ window.api.diary.save(date, content)
IPC → diaryService.save()
    ↓ diaryRepository.save()
保存到数据库（日期作为唯一键）
    ↓
返回成功 → 更新 diaryStore
    ↓
日历刷新 → 显示日记标记（📝）
    ↓
侧边栏显示日记预览
```

#### 2. 查看日记流程

```
用户点击日历上有日记标记的日期
    ↓
侧边栏显示日记预览（前100字）
    ↓
用户点击"查看完整日记"
    ↓
在侧边栏展开 DiaryViewer
    ↓ 渲染 Markdown 内容
显示编辑和删除按钮
```

#### 3. 删除日记流程

```
用户点击"删除日记"
    ↓
显示确认对话框
    ↓ 用户确认
window.api.diary.delete(date)
    ↓ IPC → diaryService.delete()
    ↓ diaryRepository.delete()
从数据库删除
    ↓
返回成功 → 更新 diaryStore
    ↓
日历刷新 → 移除日记标记
    ↓
侧边栏清空日记显示
```

---

## 🗄️ 数据库设计

### diary 表（已存在，验证结构）

```sql
CREATE TABLE IF NOT EXISTS diary (
  id TEXT PRIMARY KEY,              -- UUID
  date TEXT NOT NULL UNIQUE,        -- YYYY-MM-DD 格式（唯一键）
  content TEXT NOT NULL,            -- Markdown 内容
  created_at INTEGER NOT NULL,      -- 创建时间（Unix时间戳，毫秒）
  updated_at INTEGER NOT NULL,      -- 更新时间
  sync_status TEXT DEFAULT 'local'  -- 云同步状态（预留）
);

CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date);
```

**注意事项：**

- `date` 字段为 `YYYY-MM-DD` 格式字符串，作为唯一键
- 同一天只能有一篇日记
- `content` 字段存储 Markdown 原始文本
- 使用 `created_at` 和 `updated_at` 跟踪时间

---

## 🔧 实施步骤

### Step 1: 数据层实现（2小时）

#### 1.1 验证数据库表结构

**文件:** `src/main/database/migrations/001_initial_schema.ts`

```typescript
// ✅ 验证 diary 表已创建（应该已存在）
// 如果不存在，添加到 migration 中：

db.exec(`
  CREATE TABLE IF NOT EXISTS diary (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'local'
  );

  CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date);
`)
```

#### 1.2 创建 Diary TypeScript 类型

**文件:** `src/shared/types/diary.types.ts` 【新建】

```typescript
// Diary 实体类型
export interface Diary {
  id: string // UUID
  date: string // YYYY-MM-DD
  content: string // Markdown 内容
  createdAt: number // Unix 时间戳（毫秒）
  updatedAt: number // Unix 时间戳（毫秒）
  syncStatus?: string // 云同步状态
}

// 创建 Diary DTO
export interface CreateDiaryDTO {
  date: string // YYYY-MM-DD
  content: string // Markdown 内容
}

// 更新 Diary DTO
export interface UpdateDiaryDTO {
  content: string // Markdown 内容
}

// 日记预览类型
export interface DiaryPreview {
  date: string
  preview: string // 前100字预览
  hasFullContent: boolean // 是否有完整内容
}
```

#### 1.3 创建 DiaryRepository

**文件:** `src/main/database/repositories/DiaryRepository.ts` 【新建】

```typescript
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type { Diary, CreateDiaryDTO, UpdateDiaryDTO } from '@shared/types/diary.types'
import log from '../../utils/logger'

export class DiaryRepository {
  constructor(private db: Database.Database) {}

  /**
   * 根据日期查找日记
   */
  findByDate(date: string): Diary | null {
    try {
      const row = this.db.prepare('SELECT * FROM diary WHERE date = ?').get(date) as any

      if (!row) return null

      // 转换命名：snake_case → camelCase
      return {
        id: row.id,
        date: row.date,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        syncStatus: row.sync_status
      }
    } catch (error) {
      log.error('DiaryRepository.findByDate failed:', { date, error })
      throw error
    }
  }

  /**
   * 查找日期范围内的所有日记
   */
  findByDateRange(startDate: string, endDate: string): Diary[] {
    try {
      const rows = this.db
        .prepare('SELECT * FROM diary WHERE date >= ? AND date <= ? ORDER BY date DESC')
        .all(startDate, endDate) as any[]

      return rows.map((row) => ({
        id: row.id,
        date: row.date,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        syncStatus: row.sync_status
      }))
    } catch (error) {
      log.error('DiaryRepository.findByDateRange failed:', { startDate, endDate, error })
      throw error
    }
  }

  /**
   * 获取所有有日记的日期列表（用于日历标记）
   */
  getAllDiaryDates(): string[] {
    try {
      const rows = this.db.prepare('SELECT date FROM diary ORDER BY date DESC').all() as any[]

      return rows.map((row) => row.date)
    } catch (error) {
      log.error('DiaryRepository.getAllDiaryDates failed:', error)
      throw error
    }
  }

  /**
   * 保存或更新日记（使用 UPSERT）
   */
  save(data: CreateDiaryDTO): Diary {
    const now = Date.now()

    // 检查是否已存在
    const existing = this.findByDate(data.date)

    const transaction = this.db.transaction(() => {
      if (existing) {
        // 更新现有日记
        this.db
          .prepare(
            `
          UPDATE diary 
          SET content = ?, updated_at = ?
          WHERE date = ?
        `
          )
          .run(data.content, now, data.date)

        log.info('Diary updated', { date: data.date })
        return { ...existing, content: data.content, updatedAt: now }
      } else {
        // 创建新日记
        const id = uuidv4()

        this.db
          .prepare(
            `
          INSERT INTO diary (id, date, content, created_at, updated_at, sync_status)
          VALUES (?, ?, ?, ?, ?, 'local')
        `
          )
          .run(id, data.date, data.content, now, now)

        log.info('Diary created', { id, date: data.date })

        return {
          id,
          date: data.date,
          content: data.content,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'local'
        }
      }
    })

    return transaction()
  }

  /**
   * 删除日记
   */
  delete(date: string): void {
    const transaction = this.db.transaction(() => {
      const result = this.db.prepare('DELETE FROM diary WHERE date = ?').run(date)

      if (result.changes === 0) {
        log.warn('Diary not found for deletion', { date })
        throw new Error(`Diary not found: ${date}`)
      }

      log.info('Diary deleted', { date })
    })

    transaction()
  }

  /**
   * 获取日记总数
   */
  count(): number {
    try {
      const row = this.db.prepare('SELECT COUNT(*) as count FROM diary').get() as any
      return row.count
    } catch (error) {
      log.error('DiaryRepository.count failed:', error)
      throw error
    }
  }
}
```

#### 1.4 创建 DiaryService

**文件:** `src/main/services/DiaryService.ts` 【新建】

```typescript
import type { DiaryRepository } from '../database/repositories/DiaryRepository'
import type { Diary, CreateDiaryDTO, DiaryPreview } from '@shared/types/diary.types'
import log from '../utils/logger'

export class DiaryService {
  constructor(private diaryRepository: DiaryRepository) {}

  /**
   * 根据日期获取日记
   */
  getByDate(date: string): Diary | null {
    return this.diaryRepository.findByDate(date)
  }

  /**
   * 获取日期范围内的日记列表
   */
  getByDateRange(startDate: string, endDate: string): Diary[] {
    return this.diaryRepository.findByDateRange(startDate, endDate)
  }

  /**
   * 获取所有有日记的日期（用于日历标记）
   */
  getAllDiaryDates(): string[] {
    return this.diaryRepository.getAllDiaryDates()
  }

  /**
   * 保存日记（创建或更新）
   */
  save(data: CreateDiaryDTO): Diary {
    // 验证日期格式
    if (!this.isValidDate(data.date)) {
      throw new Error(`Invalid date format: ${data.date}. Expected YYYY-MM-DD`)
    }

    // 验证内容
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Diary content cannot be empty')
    }

    return this.diaryRepository.save(data)
  }

  /**
   * 删除日记
   */
  delete(date: string): void {
    this.diaryRepository.delete(date)
  }

  /**
   * 获取日记预览（前100字）
   */
  getPreview(date: string): DiaryPreview | null {
    const diary = this.diaryRepository.findByDate(date)

    if (!diary) return null

    // 提取纯文本（移除 Markdown 语法）
    const plainText = this.stripMarkdown(diary.content)

    // 截取前100字
    const preview = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText

    return {
      date: diary.date,
      preview,
      hasFullContent: diary.content.length > 100
    }
  }

  /**
   * 验证日期格式（YYYY-MM-DD）
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * 简单地移除 Markdown 语法（用于预览）
   */
  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/#{1,6}\s+/g, '') // 移除标题
      .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
      .replace(/\*(.+?)\*/g, '$1') // 移除斜体
      .replace(/`(.+?)`/g, '$1') // 移除代码
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
      .replace(/>\s+/g, '') // 移除引用
      .replace(/\n+/g, ' ') // 移除换行
      .trim()
  }
}
```

#### 1.5 创建 IPC 处理器

**文件:** `src/main/ipc/diaryHandlers.ts` 【新建】

```typescript
import { ipcMain } from 'electron'
import type { DiaryService } from '../services/DiaryService'
import log from '../utils/logger'

export function registerDiaryHandlers(diaryService: DiaryService): void {
  // 根据日期获取日记
  ipcMain.handle('diary:getByDate', async (event, date: string) => {
    try {
      const diary = diaryService.getByDate(date)
      return { data: diary }
    } catch (error) {
      log.error('IPC diary:getByDate failed:', { date, error })
      throw error
    }
  })

  // 获取日期范围内的日记
  ipcMain.handle('diary:getByDateRange', async (event, startDate: string, endDate: string) => {
    try {
      const diaries = diaryService.getByDateRange(startDate, endDate)
      return { data: diaries }
    } catch (error) {
      log.error('IPC diary:getByDateRange failed:', { startDate, endDate, error })
      throw error
    }
  })

  // 获取所有有日记的日期
  ipcMain.handle('diary:getAllDates', async () => {
    try {
      const dates = diaryService.getAllDiaryDates()
      return { data: dates }
    } catch (error) {
      log.error('IPC diary:getAllDates failed:', error)
      throw error
    }
  })

  // 保存日记（创建或更新）
  ipcMain.handle('diary:save', async (event, data: { date: string; content: string }) => {
    try {
      const diary = diaryService.save(data)
      return { data: diary }
    } catch (error) {
      log.error('IPC diary:save failed:', { date: data.date, error })
      throw error
    }
  })

  // 删除日记
  ipcMain.handle('diary:delete', async (event, date: string) => {
    try {
      diaryService.delete(date)
      return { data: null }
    } catch (error) {
      log.error('IPC diary:delete failed:', { date, error })
      throw error
    }
  })

  // 获取日记预览
  ipcMain.handle('diary:getPreview', async (event, date: string) => {
    try {
      const preview = diaryService.getPreview(date)
      return { data: preview }
    } catch (error) {
      log.error('IPC diary:getPreview failed:', { date, error })
      throw error
    }
  })

  log.info('Diary IPC handlers registered')
}
```

#### 1.6 注册 IPC 处理器

**文件:** `src/main/ipc/index.ts` 【修改】

```typescript
import { DiaryRepository } from '../database/repositories/DiaryRepository'
import { DiaryService } from '../services/DiaryService'
import { registerDiaryHandlers } from './diaryHandlers'

// ... 现有代码 ...

export function registerAllHandlers(db: Database.Database): void {
  // ... 现有的 handlers ...

  // 注册日记 handlers
  const diaryRepository = new DiaryRepository(db)
  const diaryService = new DiaryService(diaryRepository)
  registerDiaryHandlers(diaryService)

  log.info('All IPC handlers registered')
}
```

#### 1.7 扩展 Preload API

**文件:** `src/preload/index.d.ts` 【修改】

```typescript
import type { Diary, CreateDiaryDTO, DiaryPreview } from '@shared/types/diary.types'

interface ElectronAPI {
  // ... 现有的 API ...

  // 日记 API
  diary: {
    getByDate: (date: string) => Promise<{ data: Diary | null }>
    getByDateRange: (startDate: string, endDate: string) => Promise<{ data: Diary[] }>
    getAllDates: () => Promise<{ data: string[] }>
    save: (data: CreateDiaryDTO) => Promise<{ data: Diary }>
    delete: (date: string) => Promise<{ data: null }>
    getPreview: (date: string) => Promise<{ data: DiaryPreview | null }>
  }
}
```

**文件:** `src/preload/index.ts` 【修改】

```typescript
contextBridge.exposeInMainWorld('api', {
  // ... 现有的 API ...

  // 日记 API
  diary: {
    getByDate: (date: string) => ipcRenderer.invoke('diary:getByDate', date),
    getByDateRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('diary:getByDateRange', startDate, endDate),
    getAllDates: () => ipcRenderer.invoke('diary:getAllDates'),
    save: (data: CreateDiaryDTO) => ipcRenderer.invoke('diary:save', data),
    delete: (date: string) => ipcRenderer.invoke('diary:delete', date),
    getPreview: (date: string) => ipcRenderer.invoke('diary:getPreview', date)
  }
})
```

---

### Step 2: 状态管理层实现（1小时）

#### 2.1 创建 diaryStore

**文件:** `src/renderer/src/stores/diaryStore.ts` 【新建】

```typescript
import { create } from 'zustand'
import type { Diary, CreateDiaryDTO } from '@shared/types'
import { message } from 'antd'

interface DiaryStore {
  // 状态
  currentDiary: Diary | null
  diaryDates: string[] // 所有有日记的日期列表
  loading: boolean
  saving: boolean

  // Actions
  fetchDiaryByDate: (date: string) => Promise<void>
  saveDiary: (data: CreateDiaryDTO) => Promise<void>
  deleteDiary: (date: string) => Promise<void>
  fetchAllDiaryDates: () => Promise<void>
  clearCurrentDiary: () => void
}

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  // 初始状态
  currentDiary: null,
  diaryDates: [],
  loading: false,
  saving: false,

  // 根据日期获取日记
  fetchDiaryByDate: async (date: string) => {
    set({ loading: true })
    try {
      const response = await window.api.diary.getByDate(date)
      set({ currentDiary: response.data, loading: false })
    } catch (error) {
      console.error('Failed to fetch diary:', error)
      message.error('获取日记失败')
      set({ loading: false })
      throw error
    }
  },

  // 保存日记（创建或更新）
  saveDiary: async (data: CreateDiaryDTO) => {
    set({ saving: true })
    try {
      const response = await window.api.diary.save(data)
      set({ currentDiary: response.data, saving: false })

      // 刷新日记日期列表
      await get().fetchAllDiaryDates()

      message.success('日记保存成功')
    } catch (error) {
      console.error('Failed to save diary:', error)
      message.error('保存日记失败')
      set({ saving: false })
      throw error
    }
  },

  // 删除日记
  deleteDiary: async (date: string) => {
    set({ loading: true })
    try {
      await window.api.diary.delete(date)
      set({ currentDiary: null, loading: false })

      // 刷新日记日期列表
      await get().fetchAllDiaryDates()

      message.success('日记删除成功')
    } catch (error) {
      console.error('Failed to delete diary:', error)
      message.error('删除日记失败')
      set({ loading: false })
      throw error
    }
  },

  // 获取所有有日记的日期
  fetchAllDiaryDates: async () => {
    try {
      const response = await window.api.diary.getAllDates()
      set({ diaryDates: response.data })
    } catch (error) {
      console.error('Failed to fetch diary dates:', error)
      // 不显示错误提示（静默失败）
    }
  },

  // 清空当前日记
  clearCurrentDiary: () => {
    set({ currentDiary: null })
  }
}))
```

---

### Step 3: UI 组件实现（3小时）

#### 3.1 创建 DiaryEditor 组件

**文件:** `src/renderer/src/features/diary/DiaryEditor.tsx` 【新建】

```typescript
import React, { useState, useEffect } from 'react'
import { Modal, Button, message } from 'antd'
import { BoldOutlined, ItalicOutlined, OrderedListOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { CreateDiaryDTO } from '@shared/types'
import { useDiaryStore } from '../../stores/diaryStore'
import './DiaryEditor.css'

interface DiaryEditorProps {
  date: string // YYYY-MM-DD
  open: boolean
  onClose: () => void
}

export const DiaryEditor: React.FC<DiaryEditorProps> = ({ date, open, onClose }) => {
  const [content, setContent] = useState('')
  const { currentDiary, saving, saveDiary, fetchDiaryByDate } = useDiaryStore()

  // 加载现有日记
  useEffect(() => {
    if (open) {
      fetchDiaryByDate(date).then(() => {
        if (currentDiary && currentDiary.date === date) {
          setContent(currentDiary.content)
        } else {
          setContent('')
        }
      })
    }
  }, [open, date])

  // 保存日记
  const handleSave = async () => {
    if (!content.trim()) {
      message.warning('日记内容不能为空')
      return
    }

    try {
      await saveDiary({ date, content })
      onClose()
    } catch (error) {
      // 错误已在 store 中处理
    }
  }

  // Markdown 工具栏操作
  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.getElementById('diary-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newText = content.substring(0, start) + syntax.replace('{}', textToInsert) + content.substring(end)

    setContent(newText)

    // 恢复焦点和选区
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + syntax.indexOf('{}') + textToInsert.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <Modal
      title={`编辑日记 - ${date}`}
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          保存
        </Button>
      ]}
    >
      <div className="diary-editor">
        {/* Markdown 工具栏 */}
        <div className="diary-toolbar">
          <Button
            size="small"
            icon={<BoldOutlined />}
            onClick={() => insertMarkdown('**{}**', '加粗文字')}
            title="加粗 (Ctrl+B)"
          />
          <Button
            size="small"
            icon={<ItalicOutlined />}
            onClick={() => insertMarkdown('*{}*', '斜体文字')}
            title="斜体 (Ctrl+I)"
          />
          <Button
            size="small"
            onClick={() => insertMarkdown('## {}', '标题')}
            title="标题"
          >
            H
          </Button>
          <Button
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => insertMarkdown('- {}', '列表项')}
            title="无序列表"
          />
          <Button
            size="small"
            icon={<OrderedListOutlined />}
            onClick={() => insertMarkdown('1. {}', '列表项')}
            title="有序列表"
          />
          <Button
            size="small"
            onClick={() => insertMarkdown('> {}', '引用内容')}
            title="引用"
          >
            &quot;
          </Button>
        </div>

        {/* 文本编辑器 */}
        <textarea
          id="diary-textarea"
          className="diary-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在这里写下今天的学习心得和思考...&#10;&#10;支持 Markdown 格式：&#10;- **加粗** *斜体*&#10;- ## 标题&#10;- - 列表&#10;- > 引用"
          rows={15}
        />

        {/* 字数统计 */}
        <div className="diary-footer">
          <span className="char-count">{content.length} 字</span>
        </div>
      </div>
    </Modal>
  )
}
```

**文件:** `src/renderer/src/features/diary/DiaryEditor.css` 【新建】

```css
.diary-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diary-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.diary-textarea {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  resize: vertical;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
}

.diary-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.diary-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.char-count {
  font-size: 12px;
  color: #999;
}
```

#### 3.2 创建 DiaryViewer 组件

**文件:** `src/renderer/src/features/diary/DiaryViewer.tsx` 【新建】

```typescript
import React from 'react'
import { Button, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Diary } from '@shared/types'
import ReactMarkdown from 'react-markdown'
import './DiaryViewer.css'

interface DiaryViewerProps {
  diary: Diary
  onEdit: () => void
  onDelete: () => void
}

export const DiaryViewer: React.FC<DiaryViewerProps> = ({ diary, onEdit, onDelete }) => {
  return (
    <div className="diary-viewer">
      <div className="diary-header">
        <h3>📝 日记 - {diary.date}</h3>
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这篇日记吗？"
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

      <div className="diary-content">
        <ReactMarkdown>{diary.content}</ReactMarkdown>
      </div>

      <div className="diary-meta">
        <span>创建时间：{new Date(diary.createdAt).toLocaleString('zh-CN')}</span>
        {diary.updatedAt !== diary.createdAt && (
          <span>更新时间：{new Date(diary.updatedAt).toLocaleString('zh-CN')}</span>
        )}
      </div>
    </div>
  )
}
```

**文件:** `src/renderer/src/features/diary/DiaryViewer.css` 【新建】

```css
.diary-viewer {
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.diary-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.diary-content {
  padding: 16px;
  background: white;
  border-radius: 4px;
  min-height: 100px;
  line-height: 1.8;
}

.diary-content h1,
.diary-content h2,
.diary-content h3 {
  margin-top: 16px;
  margin-bottom: 8px;
}

.diary-content p {
  margin-bottom: 12px;
}

.diary-content ul,
.diary-content ol {
  padding-left: 24px;
  margin-bottom: 12px;
}

.diary-content blockquote {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid #1890ff;
  background: #f0f8ff;
  color: #555;
}

.diary-content code {
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.diary-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
  font-size: 12px;
  color: #999;
}
```

#### 3.3 修改 CalendarPage - 集成日记功能

**文件:** `src/renderer/src/pages/CalendarPage.tsx` 【修改】

在现有的 `CalendarPage` 组件中添加日记功能集成：

```typescript
import { DiaryEditor } from '../features/diary/DiaryEditor'
import { DiaryViewer } from '../features/diary/DiaryViewer'
import { useDiaryStore } from '../stores/diaryStore'

// ... 现有代码 ...

function CalendarPage() {
  // ... 现有状态 ...

  // 日记相关状态
  const [diaryEditorOpen, setDiaryEditorOpen] = useState(false)
  const { currentDiary, diaryDates, fetchDiaryByDate, deleteDiary, fetchAllDiaryDates } = useDiaryStore()

  // 组件加载时获取所有日记日期
  useEffect(() => {
    fetchAllDiaryDates()
  }, [])

  // 当选中日期变化时，加载日记
  useEffect(() => {
    if (selectedDate) {
      fetchDiaryByDate(selectedDate)
    }
  }, [selectedDate])

  // 打开日记编辑器
  const handleOpenDiaryEditor = () => {
    if (selectedDate) {
      setDiaryEditorOpen(true)
    }
  }

  // 关闭日记编辑器
  const handleCloseDiaryEditor = () => {
    setDiaryEditorOpen(false)
    // 刷新日记显示
    if (selectedDate) {
      fetchDiaryByDate(selectedDate)
    }
  }

  // 删除日记
  const handleDeleteDiary = async () => {
    if (selectedDate) {
      await deleteDiary(selectedDate)
    }
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
        {/* ... 现有的活动列表 ... */}

        {/* 日记部分 */}
        <div className="diary-section">
          {currentDiary ? (
            // 显示日记内容
            <DiaryViewer
              diary={currentDiary}
              onEdit={handleOpenDiaryEditor}
              onDelete={handleDeleteDiary}
            />
          ) : (
            // 显示"写日记"按钮
            <Button type="dashed" block icon={<EditOutlined />} onClick={handleOpenDiaryEditor}>
              写日记
            </Button>
          )}
        </div>
      </Drawer>

      {/* 日记编辑器对话框 */}
      {selectedDate && (
        <DiaryEditor
          date={selectedDate}
          open={diaryEditorOpen}
          onClose={handleCloseDiaryEditor}
        />
      )}
    </div>
  )
}
```

#### 3.4 修改日历热力图 - 添加日记标记

**文件:** `src/renderer/src/features/calendar/CalendarHeatmap.tsx` 【修改】

在热力图的每个日期方块上添加日记标记：

```typescript
import { useDiaryStore } from '../../stores/diaryStore'

function CalendarHeatmap() {
  const { diaryDates } = useDiaryStore()

  // ... 现有代码 ...

  // 渲染日期方块
  const renderDateCell = (date: string, activityCount: number) => {
    const hasDiary = diaryDates.includes(date)

    return (
      <div className="calendar-cell" onClick={() => onDateClick(date)}>
        <div className="cell-content" style={{ background: getHeatmapColor(activityCount) }}>
          <span className="date-number">{dayjs(date).format('D')}</span>
          {hasDiary && <span className="diary-marker">📝</span>}
        </div>
      </div>
    )
  }

  // ... 现有代码 ...
}
```

**对应CSS更新：**

```css
.calendar-cell {
  position: relative;
}

.diary-marker {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  line-height: 1;
}
```

---

### Step 4: 依赖安装（0.5小时）

#### 4.1 安装 Markdown 渲染库

```bash
pnpm add react-markdown
```

#### 4.2 验证所有依赖

```bash
pnpm install
pnpm run build
```

---

### Step 5: 测试验证（0.5小时）

#### 5.1 手动测试清单

**测试 1: 创建日记**

- [ ] 在日历详情侧边栏点击"写日记"按钮
- [ ] 打开日记编辑器对话框
- [ ] 输入 Markdown 内容（测试工具栏功能）
- [ ] 点击保存
- [ ] 验证保存成功提示
- [ ] 验证日历上显示日记标记（📝）
- [ ] 验证侧边栏显示日记预览

**测试 2: 查看日记**

- [ ] 点击有日记标记的日期
- [ ] 验证侧边栏显示日记预览（前100字）
- [ ] 点击查看完整日记
- [ ] 验证 Markdown 正确渲染
- [ ] 验证显示创建和更新时间

**测试 3: 编辑日记**

- [ ] 点击"编辑"按钮
- [ ] 验证编辑器预填充现有内容
- [ ] 修改内容并保存
- [ ] 验证更新成功提示
- [ ] 验证侧边栏显示更新后的内容

**测试 4: 删除日记**

- [ ] 点击"删除"按钮
- [ ] 验证显示确认对话框
- [ ] 确认删除
- [ ] 验证删除成功提示
- [ ] 验证日历上的日记标记消失
- [ ] 验证侧边栏显示"写日记"按钮

**测试 5: 边界情况**

- [ ] 测试空内容保存（应显示警告）
- [ ] 测试超长内容（10000+字符）
- [ ] 测试特殊 Markdown 语法渲染
- [ ] 测试同一天多次编辑保存
- [ ] 测试跨月切换日记标记显示

**测试 6: 性能测试**

- [ ] 创建50篇日记
- [ ] 验证日历加载速度 < 1秒
- [ ] 验证日记标记显示正常
- [ ] 验证编辑器打开速度 < 200ms

---

## ✅ 验收标准检查清单

### 功能完整性

- [ ] **AC1**: 用户可以在日历详情侧边栏点击"写日记"按钮
- [ ] **AC2**: 日记编辑器支持 Markdown 格式
- [ ] **AC3**: 提供工具栏：加粗、斜体、标题、列表、引用
- [ ] **AC4**: 用户输入内容并保存后，日记保存到数据库（关联当日日期）
- [ ] **AC5**: 日历上该日期显示日记标记（📝图标）
- [ ] **AC6**: 侧边栏显示日记预览（前100字）
- [ ] **AC7**: 用户点击已有日记，在侧边栏展开显示完整日记（Markdown渲染）
- [ ] **AC8**: 显示"编辑"和"删除"按钮
- [ ] **AC9**: 用户编辑日记时，重新打开编辑器，预填充内容
- [ ] **AC10**: 保存后更新数据库并显示"更新成功"提示
- [ ] **AC11**: 用户删除日记时，显示确认对话框
- [ ] **AC12**: 确认后删除日记，日历上的日记标记消失

### 技术要求

- [ ] 数据库表结构正确（date 字段为唯一键）
- [ ] Repository 层正确处理命名转换（snake_case ↔ camelCase）
- [ ] IPC 通道命名符合规范（`diary:*`）
- [ ] 所有数据库操作使用事务
- [ ] 所有异步操作有完整的错误处理
- [ ] 所有 CRUD 操作记录 info 日志
- [ ] 所有错误记录 error 日志
- [ ] TypeScript 类型定义完整
- [ ] UI 响应时间 < 200ms
- [ ] Markdown 渲染正确且安全

### 代码质量

- [ ] 遵循命名约定（文件、变量、函数）
- [ ] 遵循项目结构规范
- [ ] 无 TypeScript 编译错误
- [ ] 无 ESLint 警告
- [ ] 代码格式化（Prettier）
- [ ] 关键逻辑有注释

---

## 📊 Story 完成报告模板

```markdown
# Story 4.4 完成报告

## 实施摘要

- 实际工时：X 小时
- 完成日期：YYYY-MM-DD
- 实施人员：[姓名]

## 完成内容

✅ 数据库层

- [x] diary 表验证
- [x] DiaryRepository 实现
- [x] 6个数据访问方法

✅ Service 层

- [x] DiaryService 实现
- [x] 业务逻辑和验证

✅ IPC 层

- [x] 6个 IPC 通道
- [x] Preload API 扩展

✅ 状态管理

- [x] diaryStore 实现

✅ UI 组件

- [x] DiaryEditor 组件
- [x] DiaryViewer 组件
- [x] CalendarPage 集成
- [x] CalendarHeatmap 日记标记

## 测试结果

- 手动测试：X/X 通过
- 性能测试：符合要求
- 边界测试：通过

## 遇到的问题

1. 问题描述
   - 解决方案

## 后续优化建议

1. [可选] 添加 Markdown 实时预览
2. [可选] 支持日记模板
3. [可选] 支持日记导出
```

---

## 🎯 关键注意事项

### ⚠️ 必须遵守的规则

1. **数据库命名**：所有字段使用 `snake_case`
2. **TypeScript 命名**：所有代码使用 `camelCase`
3. **Repository 转换**：必须在 Repository 层处理命名转换
4. **IPC 命名**：所有通道使用 `diary:{操作}` 格式
5. **事务保护**：所有写操作必须使用事务
6. **日期格式**：统一使用 `YYYY-MM-DD` 字符串
7. **时间戳**：统一使用 Unix 时间戳（毫秒）
8. **错误处理**：所有异步操作必须 try-catch
9. **日志记录**：所有 CRUD 操作记录 info 日志
10. **类型安全**：禁用 `any`，使用明确类型

### 🔍 性能考虑

- Markdown 渲染使用 `react-markdown`（轻量级）
- 日记预览只返回前100字，避免大内容传输
- 日记日期列表缓存在 store 中，减少 IPC 调用
- 编辑器使用受控组件，避免频繁重渲染

### 🎨 UX 考虑

- 工具栏提供常用 Markdown 语法快捷操作
- 编辑器提供字数统计
- 删除操作有二次确认
- 保存后立即显示成功提示
- 日记标记使用 📝 表情符号，直观易识别

---

## 📚 参考文档

- **架构文档**: `docs/architecture.md`
- **项目上下文**: `docs/project_context.md`
- **Epic 4**: `docs/stories/epic-4-calendar.md`
- **Story 4.1**: `docs/stories/story-4.1-implementation-guide.md`
- **Story 4.2**: `docs/stories/story-4.2-implementation-guide.md`

---

**Story 创建时间**: 2025-12-14  
**下一个 Story**: Story 4.5 - 提醒事项功能





