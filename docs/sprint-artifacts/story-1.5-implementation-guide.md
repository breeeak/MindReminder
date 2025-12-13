# Story 1.5: IPC通信基础架构 - 实施指南

**Story ID:** 1.5  
**Epic:** Epic 1 - 项目基础设施与开发环境  
**状态:** ready-for-dev  
**优先级:** P0  
**Story Points:** 8  
**预估工时:** 8小时  

---

## 📋 Story概述

**用户故事:**
```
As a 开发者,
I want 建立主进程与渲染进程之间的安全通信机制,
So that 前端UI可以调用后端服务,同时保证Electron安全最佳实践.
```

**价值:** 
- 建立安全的主进程与渲染进程通信通道
- 实现类型安全的IPC API接口
- 为后续功能开发提供统一的前后端通信基础
- 确保遵循Electron安全最佳实践（Context Bridge、沙箱模式）

**依赖:**
- ✅ Story 1.1: electron-vite项目初始化
- ✅ Story 1.2: SQLite数据库基础设施
- ✅ Story 1.3: Repository模式数据访问层

---

## 🎯 验收标准 (Acceptance Criteria)

### AC1: IPC通道枚举定义

**Given** 项目基础设施和Repository层已完成（Story 1.1-1.3）  
**When** 定义IPC通道枚举（`src/common/ipc-channels.ts`）  
**Then** 包含以下通道定义：

```typescript
export enum IPCChannel {
  // Knowledge相关
  KNOWLEDGE_CREATE = 'knowledge:create',
  KNOWLEDGE_UPDATE = 'knowledge:update',
  KNOWLEDGE_DELETE = 'knowledge:delete',
  KNOWLEDGE_FIND_BY_ID = 'knowledge:findById',
  KNOWLEDGE_FIND_ALL = 'knowledge:findAll',
  KNOWLEDGE_SEARCH = 'knowledge:search',
  
  // Review相关
  REVIEW_CREATE = 'review:create',
  REVIEW_FIND_DUE = 'review:findDue',
  REVIEW_FIND_BY_KNOWLEDGE = 'review:findByKnowledge',
  
  // Settings相关
  SETTINGS_GET = 'settings:get',
  SETTINGS_UPDATE = 'settings:update',
}
```

---

### AC2: Context Bridge实现

**When** 实现Context Bridge（`src/preload/index.ts`）  
**Then** 暴露安全的API给渲染进程：

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  knowledge: {
    create: (data) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_CREATE, data),
    update: (id, data) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_UPDATE, id, data),
    delete: (id) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_DELETE, id),
    findById: (id) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_BY_ID, id),
    findAll: () => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_ALL),
    search: (keyword) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_SEARCH, keyword),
  },
  review: {
    create: (knowledgeId, rating) => ipcRenderer.invoke(IPCChannel.REVIEW_CREATE, knowledgeId, rating),
    findDue: (date) => ipcRenderer.invoke(IPCChannel.REVIEW_FIND_DUE, date),
    findByKnowledge: (knowledgeId) => ipcRenderer.invoke(IPCChannel.REVIEW_FIND_BY_KNOWLEDGE, knowledgeId),
  },
});
```

**And** 创建TypeScript类型声明（`src/preload/index.d.ts`）  
**And** 渲染进程可以通过`window.electronAPI`访问API

---

### AC3: IPC处理器实现

**When** 实现IPC处理器（`src/main/ipc/handlers.ts`）  
**Then** 为每个通道注册ipcMain.handle处理函数  
**And** 处理器调用对应的Repository方法  
**And** 处理器返回标准化响应格式：

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
}
```

---

### AC4: 错误处理中间件

**When** 实现错误处理中间件  
**Then** 所有IPC调用包含try-catch错误捕获  
**And** 错误信息通过electron-log记录到日志文件  
**And** 错误响应包含用户友好的错误消息  
**And** 敏感信息（如文件路径）不暴露给渲染进程

---

### AC5: electron-log日志配置

**When** 配置electron-log（`src/main/utils/logger.ts`）  
**Then** 日志文件存储位置：
- Windows: `%APPDATA%/MindReminder/logs/`
- macOS: `~/Library/Logs/MindReminder/`

**And** 日志级别可配置（开发环境：debug，生产环境：info）  
**And** 日志文件自动轮转（每日一个文件，保留7天）

---

### AC6: IPC接口测试

**When** 从渲染进程调用IPC接口  
**Then** 调用成功时返回数据  
**And** 调用失败时返回错误信息  
**And** 所有调用响应时间 < 200ms（简单查询）  
**And** 主进程日志记录请求和响应

---

## 🏗️ 实施步骤

### Step 1: 创建IPC通道枚举定义 (0.5h)

**任务:**
1. 创建 `src/common/` 目录（主进程和渲染进程共享代码）
2. 创建 `src/common/ipc-channels.ts` 文件
3. 定义所有IPC通道枚举

**产出:**
- `src/common/ipc-channels.ts`

**代码模板:**
```typescript
/**
 * IPC通道枚举定义
 * 命名规范: {实体}:{操作}
 */
export enum IPCChannel {
  // Knowledge 相关通道
  KNOWLEDGE_CREATE = 'knowledge:create',
  KNOWLEDGE_UPDATE = 'knowledge:update',
  KNOWLEDGE_DELETE = 'knowledge:delete',
  KNOWLEDGE_FIND_BY_ID = 'knowledge:findById',
  KNOWLEDGE_FIND_ALL = 'knowledge:findAll',
  KNOWLEDGE_SEARCH = 'knowledge:search',
  
  // Review 相关通道
  REVIEW_CREATE = 'review:create',
  REVIEW_FIND_DUE = 'review:findDue',
  REVIEW_FIND_BY_KNOWLEDGE = 'review:findByKnowledge',
  
  // Settings 相关通道
  SETTINGS_GET = 'settings:get',
  SETTINGS_UPDATE = 'settings:update',
}
```

**验证:**
- TypeScript编译无错误
- 枚举命名遵循 `{实体}:{操作}` 格式

---

### Step 2: 配置electron-log日志系统 (1h)

**任务:**
1. 创建 `src/main/utils/logger.ts` 文件
2. 配置日志输出路径（跨平台）
3. 配置日志级别
4. 配置日志格式和轮转

**产出:**
- `src/main/utils/logger.ts`

**代码模板:**
```typescript
import log from 'electron-log'
import path from 'path'
import { app } from 'electron'

/**
 * 配置electron-log日志系统
 */
function configureLogger(): void {
  // 日志文件路径（跨平台）
  const logsPath = app.getPath('logs')
  log.transports.file.resolvePathFn = () => {
    return path.join(logsPath, 'main.log')
  }
  
  // 日志级别配置
  log.transports.file.level = 'info'
  log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
  
  // 日志格式
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
  
  // 日志文件大小限制（10MB）
  log.transports.file.maxSize = 10 * 1024 * 1024
  
  log.info('Logger initialized', { logsPath })
}

// 应用启动时初始化
configureLogger()

export default log
```

**技术细节:**
- Windows日志路径: `%APPDATA%/MindReminder/logs/main.log`
- macOS日志路径: `~/Library/Logs/MindReminder/main.log`
- 开发环境控制台显示debug级别日志
- 生产环境只显示warn及以上级别

**验证:**
- 日志文件正确创建
- 不同级别日志正确输出
- 跨平台路径正确

---

### Step 3: 实现IPC处理器（主进程） (2.5h)

**任务:**
1. 创建 `src/main/ipc/` 目录
2. 创建 `src/main/ipc/knowledgeHandlers.ts` - Knowledge相关IPC处理
3. 创建 `src/main/ipc/reviewHandlers.ts` - Review相关IPC处理
4. 创建 `src/main/ipc/index.ts` - 统一注册所有handlers
5. 实现错误处理中间件

**产出:**
- `src/main/ipc/knowledgeHandlers.ts`
- `src/main/ipc/reviewHandlers.ts`
- `src/main/ipc/index.ts`

**代码模板 - knowledgeHandlers.ts:**
```typescript
import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { getKnowledgeRepository } from '../database/repositories'
import log from '../utils/logger'

/**
 * 注册Knowledge相关IPC处理器
 */
export function registerKnowledgeHandlers(): void {
  
  // knowledge:create - 创建知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_CREATE, async (event: IpcMainInvokeEvent, data: any) => {
    try {
      log.info('IPC: knowledge:create', { data })
      const repo = getKnowledgeRepository()
      const knowledge = repo.create(data)
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:create failed', { error })
      throw error
    }
  })
  
  // knowledge:findById - 查询单个知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_FIND_BY_ID, async (event: IpcMainInvokeEvent, id: string) => {
    try {
      log.debug('IPC: knowledge:findById', { id })
      const repo = getKnowledgeRepository()
      const knowledge = repo.findById(id)
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:findById failed', { error, id })
      throw error
    }
  })
  
  // knowledge:findAll - 查询所有知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_FIND_ALL, async () => {
    try {
      log.debug('IPC: knowledge:findAll')
      const repo = getKnowledgeRepository()
      const knowledgeList = repo.findAll()
      return { data: knowledgeList }
    } catch (error) {
      log.error('IPC: knowledge:findAll failed', { error })
      throw error
    }
  })
  
  // knowledge:update - 更新知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_UPDATE, async (event: IpcMainInvokeEvent, id: string, data: any) => {
    try {
      log.info('IPC: knowledge:update', { id, data })
      const repo = getKnowledgeRepository()
      const knowledge = repo.update(id, data)
      return { data: knowledge }
    } catch (error) {
      log.error('IPC: knowledge:update failed', { error, id })
      throw error
    }
  })
  
  // knowledge:delete - 删除知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_DELETE, async (event: IpcMainInvokeEvent, id: string) => {
    try {
      log.info('IPC: knowledge:delete', { id })
      const repo = getKnowledgeRepository()
      const success = repo.delete(id)
      return { data: success }
    } catch (error) {
      log.error('IPC: knowledge:delete failed', { error, id })
      throw error
    }
  })
  
  // knowledge:search - 搜索知识点
  ipcMain.handle(IPCChannel.KNOWLEDGE_SEARCH, async (event: IpcMainInvokeEvent, keyword: string) => {
    try {
      log.debug('IPC: knowledge:search', { keyword })
      const repo = getKnowledgeRepository()
      const results = repo.search(keyword)
      return { data: results }
    } catch (error) {
      log.error('IPC: knowledge:search failed', { error, keyword })
      throw error
    }
  })
  
  log.info('Knowledge IPC handlers registered')
}
```

**代码模板 - index.ts:**
```typescript
import { registerKnowledgeHandlers } from './knowledgeHandlers'
import { registerReviewHandlers } from './reviewHandlers'

/**
 * 注册所有IPC处理器
 */
export function registerAllHandlers(): void {
  registerKnowledgeHandlers()
  registerReviewHandlers()
}
```

**技术细节:**
- 所有handler使用 `ipcMain.handle` (支持async/await)
- 响应格式: `{ data: T }` (成功) 或 `throw error` (失败)
- 所有操作记录日志（info级别：写操作，debug级别：读操作）
- 错误直接抛出，由渲染进程捕获

**验证:**
- TypeScript编译无错误
- 所有通道都有对应的handler
- 错误处理完整

---

### Step 4: 实现Context Bridge（预加载脚本） (2h)

**任务:**
1. 修改 `src/preload/index.ts` 实现Context Bridge
2. 创建 `src/preload/index.d.ts` 类型声明文件
3. 暴露类型安全的API到渲染进程

**产出:**
- `src/preload/index.ts` (修改)
- `src/preload/index.d.ts` (新建)

**代码模板 - index.ts:**
```typescript
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPCChannel } from '../common/ipc-channels'

/**
 * Knowledge API
 */
const knowledgeAPI = {
  create: (data: any) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_CREATE, data),
  update: (id: string, data: any) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_UPDATE, id, data),
  delete: (id: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_DELETE, id),
  findById: (id: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_BY_ID, id),
  findAll: () => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_FIND_ALL),
  search: (keyword: string) => ipcRenderer.invoke(IPCChannel.KNOWLEDGE_SEARCH, keyword),
}

/**
 * Review API
 */
const reviewAPI = {
  create: (knowledgeId: string, rating: number) => 
    ipcRenderer.invoke(IPCChannel.REVIEW_CREATE, knowledgeId, rating),
  findDue: (date: number) => ipcRenderer.invoke(IPCChannel.REVIEW_FIND_DUE, date),
  findByKnowledge: (knowledgeId: string) => 
    ipcRenderer.invoke(IPCChannel.REVIEW_FIND_BY_KNOWLEDGE, knowledgeId),
}

/**
 * Settings API
 */
const settingsAPI = {
  get: (key: string) => ipcRenderer.invoke(IPCChannel.SETTINGS_GET, key),
  update: (key: string, value: any) => ipcRenderer.invoke(IPCChannel.SETTINGS_UPDATE, key, value),
}

// Use `contextBridge` APIs to expose Electron APIs to renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      knowledge: knowledgeAPI,
      review: reviewAPI,
      settings: settingsAPI,
    })
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = {
    knowledge: knowledgeAPI,
    review: reviewAPI,
    settings: settingsAPI,
  }
}
```

**代码模板 - index.d.ts:**
```typescript
import { ElectronAPI } from '@electron-toolkit/preload'

/**
 * Knowledge实体类型
 */
export interface Knowledge {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  frequencyCoefficient: number
}

/**
 * ReviewHistory实体类型
 */
export interface ReviewHistory {
  id: string
  knowledgeId: string
  rating: number
  reviewedAt: number
  nextReviewAt: number
}

/**
 * IPC响应格式
 */
export interface IPCResponse<T> {
  data: T
}

/**
 * Knowledge API接口
 */
export interface KnowledgeAPI {
  create: (data: Partial<Knowledge>) => Promise<IPCResponse<Knowledge>>
  update: (id: string, data: Partial<Knowledge>) => Promise<IPCResponse<Knowledge>>
  delete: (id: string) => Promise<IPCResponse<boolean>>
  findById: (id: string) => Promise<IPCResponse<Knowledge | null>>
  findAll: () => Promise<IPCResponse<Knowledge[]>>
  search: (keyword: string) => Promise<IPCResponse<Knowledge[]>>
}

/**
 * Review API接口
 */
export interface ReviewAPI {
  create: (knowledgeId: string, rating: number) => Promise<IPCResponse<ReviewHistory>>
  findDue: (date: number) => Promise<IPCResponse<ReviewHistory[]>>
  findByKnowledge: (knowledgeId: string) => Promise<IPCResponse<ReviewHistory[]>>
}

/**
 * Settings API接口
 */
export interface SettingsAPI {
  get: (key: string) => Promise<IPCResponse<any>>
  update: (key: string, value: any) => Promise<IPCResponse<void>>
}

/**
 * 全局API接口
 */
export interface API {
  knowledge: KnowledgeAPI
  review: ReviewAPI
  settings: SettingsAPI
}

/**
 * 声明全局window对象类型
 */
declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
```

**技术细节:**
- 使用 `contextBridge.exposeInMainWorld` 安全地暴露API
- 所有API方法返回 `Promise<IPCResponse<T>>`
- 类型声明文件确保渲染进程类型安全
- 支持context isolation模式

**验证:**
- TypeScript编译无错误
- 渲染进程可以访问 `window.api`
- 类型提示工作正常

---

### Step 5: 集成到主进程和应用启动 (1h)

**任务:**
1. 在主进程启动时注册所有IPC handlers
2. 修改 `src/main/index.ts` 集成IPC系统
3. 确保初始化顺序正确

**产出:**
- 修改 `src/main/index.ts`

**代码模板:**
```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 导入数据库和Repository
import { DatabaseService } from './database/DatabaseService'
import { initRepositories } from './database/repositories'

// 导入IPC handlers
import { registerAllHandlers } from './ipc'

// 导入日志
import log from './utils/logger'

let mainWindow: BrowserWindow | null = null
let dbService: DatabaseService | null = null

function createWindow(): void {
  // 创建窗口...
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true, // ✅ 启用context isolation
      nodeIntegration: false,  // ✅ 禁用node integration
    }
  })
  
  // ... 窗口配置
}

// App ready事件
app.whenReady().then(async () => {
  log.info('App is ready, initializing...')
  
  // 设置应用用户模型ID (Windows)
  electronApp.setAppUserModelId('com.mindreminder')
  
  // 优化器配置
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  try {
    // 1. 初始化数据库
    log.info('Initializing database...')
    dbService = new DatabaseService()
    await dbService.initialize()
    log.info('Database initialized successfully')
    
    // 2. 初始化Repository
    log.info('Initializing repositories...')
    initRepositories(dbService)
    log.info('Repositories initialized successfully')
    
    // 3. 注册IPC handlers
    log.info('Registering IPC handlers...')
    registerAllHandlers()
    log.info('IPC handlers registered successfully')
    
  } catch (error) {
    log.error('Failed to initialize app:', error)
    app.quit()
    return
  }
  
  // 创建窗口
  createWindow()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 退出事件
app.on('window-all-closed', () => {
  if (dbService) {
    dbService.close()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

**初始化顺序（关键）:**
1. ✅ 数据库初始化 (`DatabaseService.initialize()`)
2. ✅ Repository初始化 (`initRepositories()`)
3. ✅ IPC handlers注册 (`registerAllHandlers()`)
4. ✅ 创建窗口 (`createWindow()`)

**验证:**
- 应用启动无错误
- 日志显示正确的初始化顺序
- IPC handlers注册成功

---

### Step 6: 创建测试页面验证IPC通信 (1h)

**任务:**
1. 在渲染进程创建测试页面
2. 测试所有IPC接口
3. 验证错误处理

**产出:**
- 修改 `src/renderer/src/App.tsx` 添加测试代码

**测试代码模板:**
```typescript
import { useState } from 'react'
import { Button, message, Card, Space } from 'antd'

function App() {
  const [testResults, setTestResults] = useState<string[]>([])
  
  const addResult = (text: string) => {
    setTestResults(prev => [...prev, text])
  }
  
  const testKnowledgeCreate = async () => {
    try {
      const response = await window.api.knowledge.create({
        title: '测试知识点',
        content: '这是测试内容',
        tags: ['测试', 'IPC'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        frequencyCoefficient: 1.0,
      })
      addResult(`✅ 创建知识点成功: ${JSON.stringify(response.data)}`)
      message.success('创建知识点成功')
      return response.data.id
    } catch (error) {
      addResult(`❌ 创建知识点失败: ${error}`)
      message.error('创建知识点失败')
      return null
    }
  }
  
  const testKnowledgeFindAll = async () => {
    try {
      const response = await window.api.knowledge.findAll()
      addResult(`✅ 查询所有知识点成功: 共${response.data.length}个`)
      message.success(`查询到${response.data.length}个知识点`)
    } catch (error) {
      addResult(`❌ 查询知识点失败: ${error}`)
      message.error('查询知识点失败')
    }
  }
  
  const testKnowledgeSearch = async () => {
    try {
      const response = await window.api.knowledge.search('测试')
      addResult(`✅ 搜索知识点成功: 找到${response.data.length}个`)
      message.success(`搜索到${response.data.length}个知识点`)
    } catch (error) {
      addResult(`❌ 搜索知识点失败: ${error}`)
      message.error('搜索知识点失败')
    }
  }
  
  const runAllTests = async () => {
    setTestResults([])
    addResult('=== 开始测试IPC通信 ===')
    
    // 测试1: 创建知识点
    const id = await testKnowledgeCreate()
    
    // 测试2: 查询所有知识点
    await testKnowledgeFindAll()
    
    // 测试3: 搜索知识点
    await testKnowledgeSearch()
    
    // 测试4: 查询单个知识点
    if (id) {
      try {
        const response = await window.api.knowledge.findById(id)
        addResult(`✅ 查询单个知识点成功: ${response.data?.title}`)
      } catch (error) {
        addResult(`❌ 查询单个知识点失败: ${error}`)
      }
    }
    
    addResult('=== 测试完成 ===')
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>IPC通信测试页面</h1>
      
      <Space>
        <Button type="primary" onClick={runAllTests}>运行所有测试</Button>
        <Button onClick={testKnowledgeCreate}>测试创建知识点</Button>
        <Button onClick={testKnowledgeFindAll}>测试查询所有知识点</Button>
        <Button onClick={testKnowledgeSearch}>测试搜索知识点</Button>
      </Space>
      
      <Card title="测试结果" style={{ marginTop: 20 }}>
        {testResults.map((result, index) => (
          <div key={index}>{result}</div>
        ))}
      </Card>
    </div>
  )
}

export default App
```

**预期输出:**
```
=== 开始测试IPC通信 ===
✅ 创建知识点成功: {"id":"...","title":"测试知识点",...}
✅ 查询所有知识点成功: 共1个
✅ 搜索知识点成功: 找到1个
✅ 查询单个知识点成功: 测试知识点
=== 测试完成 ===
```

**验证:**
- 所有测试通过
- 数据正确保存到数据库
- 错误处理正常工作
- 日志文件记录所有操作

---

## 📁 文件结构

完成后的文件结构：

```
src/
├── common/                    # 新建（主进程和渲染进程共享）
│   └── ipc-channels.ts
├── main/
│   ├── ipc/                   # 新建
│   │   ├── knowledgeHandlers.ts
│   │   ├── reviewHandlers.ts
│   │   └── index.ts
│   ├── utils/
│   │   └── logger.ts          # 新建
│   └── index.ts               # 修改（集成IPC）
├── preload/
│   ├── index.ts               # 修改（实现Context Bridge）
│   └── index.d.ts             # 新建（类型声明）
└── renderer/src/
    └── App.tsx                # 修改（测试代码）
```

---

## ⚠️ 关键注意事项

### 1. Electron安全最佳实践（必须遵守）

**✅ 必须启用:**
- `contextIsolation: true` - 启用Context Isolation
- `nodeIntegration: false` - 禁用Node Integration
- 使用 `contextBridge.exposeInMainWorld` 暴露API

**❌ 严格禁止:**
- ❌ 在渲染进程中使用 `remote` 模块
- ❌ 在渲染进程中直接使用 Node.js API
- ❌ 启用 `nodeIntegration` 在渲染进程

### 2. IPC通道命名规范（强制）

**✅ 正确格式:** `{实体}:{操作}`
```typescript
'knowledge:create'    // ✅ 正确
'knowledge:findById'  // ✅ 正确
'review:create'       // ✅ 正确
```

**❌ 错误格式:**
```typescript
'createKnowledge'     // ❌ 错误
'get-all-knowledge'   // ❌ 错误
'KnowledgeCreate'     // ❌ 错误
```

### 3. IPC响应格式（强制）

**✅ 成功响应:**
```typescript
return { data: result }
```

**✅ 错误响应:**
```typescript
throw new Error('错误信息')  // 渲染进程try-catch捕获
```

**❌ 错误做法:**
```typescript
return { success: false, error: 'xxx' }  // ❌ 不要这样
```

### 4. 日志记录规范（强制）

**✅ 必须记录:**
- 所有IPC操作（info级别：写操作，debug级别：读操作）
- 所有错误（error级别）
- 关键初始化步骤（info级别）

**日志格式:**
```typescript
log.info('IPC: knowledge:create', { data })
log.debug('IPC: knowledge:findById', { id })
log.error('IPC: knowledge:create failed', { error, data })
```

### 5. 类型安全（强制）

**✅ 必须:**
- 所有IPC接口有TypeScript类型定义
- 使用 `index.d.ts` 声明全局类型
- 渲染进程使用 `window.api` 有完整类型提示

### 6. 初始化顺序（关键）

**✅ 正确顺序:**
```
1. DatabaseService.initialize()
2. initRepositories()
3. registerAllHandlers()
4. createWindow()
```

**❌ 错误顺序:**
- IPC handlers在Repository之前注册会导致运行时错误

---

## 🧪 验证测试

### 手动验证清单

**1. 应用启动测试**
- [ ] 应用正常启动，无错误
- [ ] 日志显示正确的初始化顺序
- [ ] IPC handlers注册成功

**2. 日志系统测试**
- [ ] 日志文件正确创建在指定路径
- [ ] 不同级别日志正确输出
- [ ] 日志格式符合预期

**3. IPC通信测试（使用测试页面）**
- [ ] knowledge:create 成功创建知识点
- [ ] knowledge:findAll 返回知识点列表
- [ ] knowledge:findById 查询单个知识点
- [ ] knowledge:search 搜索功能正常
- [ ] 错误情况正确处理和显示

**4. 性能测试**
- [ ] IPC调用响应时间 < 200ms
- [ ] 连续调用无内存泄漏
- [ ] 日志记录不影响性能

**5. 类型安全测试**
- [ ] 渲染进程使用 `window.api` 有类型提示
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过

---

## 🎯 Definition of Done

**代码完成:**
- [ ] IPC通道枚举定义完成
- [ ] electron-log配置完成
- [ ] 所有IPC handlers实现完成
- [ ] Context Bridge实现完成
- [ ] 类型声明文件完成
- [ ] 主进程集成完成
- [ ] 测试页面完成

**验收标准:**
- [ ] AC1-AC6全部验证通过
- [ ] 手动测试全部通过
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过

**代码质量:**
- [ ] 代码遵循项目命名规范
- [ ] 所有公共方法有JSDoc注释
- [ ] 错误处理完整
- [ ] 日志记录关键操作
- [ ] 遵循Electron安全最佳实践

**文档:**
- [ ] 代码注释完整
- [ ] 本实施指南完成
- [ ] README更新（如需）

**安全性:**
- [ ] contextIsolation启用
- [ ] nodeIntegration禁用
- [ ] Context Bridge正确使用
- [ ] 无敏感信息泄漏

---

## 📝 技术决策记录

### 决策1: Context Bridge vs Remote模块

**选择:** Context Bridge

**原因:**
- Remote模块已被弃用（Electron 14+）
- Context Bridge更安全（严格的API边界）
- 符合Electron安全最佳实践
- 类型安全更好

### 决策2: IPC响应格式

**选择:** 成功返回 `{ data: T }`，失败抛出异常

**原因:**
- 更符合async/await习惯
- 渲染进程可以统一用try-catch处理
- 简化错误处理逻辑
- 类型推断更准确

### 决策3: electron-log vs 自定义日志

**选择:** electron-log

**原因:**
- Electron官方推荐
- 自动处理跨平台路径
- 日志轮转内置
- 性能优化好

### 决策4: 日志级别配置

**选择:** 开发环境debug，生产环境info

**原因:**
- 开发时需要详细日志排查问题
- 生产环境避免日志文件过大
- 用户隐私保护（不记录敏感数据）

---

## 🚀 开始开发

**准备工作:**
1. 确认Story 1.1-1.3已完成
2. 拉取最新代码
3. 切换到新分支：`git checkout -b feature/story-1.5-ipc`

**开发流程:**
1. 按步骤1-6顺序实现
2. 每完成一步，提交一次代码
3. 完成后运行测试页面验证
4. 检查DoD清单
5. 提交Pull Request

**预估时间分配:**
- Step 1: 0.5小时 - IPC通道枚举
- Step 2: 1小时 - electron-log配置
- Step 3: 2.5小时 - IPC handlers实现
- Step 4: 2小时 - Context Bridge实现
- Step 5: 1小时 - 主进程集成
- Step 6: 1小时 - 测试验证
- **总计: 8小时**

祝开发顺利！🎉

