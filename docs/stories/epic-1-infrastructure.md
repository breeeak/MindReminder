# Epic 1: 项目基础设施与开发环境

**用户成果：** 开发团队拥有完整配置的开发环境，可以开始构建功能

**技术基础：** electron-vite项目骨架、数据库架构、核心算法基础、基础UI框架

**覆盖需求：**
- 架构需求：Starter Template (electron-vite + React + TypeScript + Ant Design)
- 架构需求：数据库5表结构 + Repository模式
- 架构需求：复习算法框架（SpacedRepetitionAlgorithm）
- 架构需求：IPC通信基础架构
- FR50: 本地SQLite数据库存储
- NFR-M1, NFR-M2: 模块化架构和可扩展性

---

## Story 1.1: electron-vite项目初始化

As a **开发者**,
I want **使用electron-vite脚手架创建标准化的项目骨架**,
So that **团队可以在统一的技术栈上开始开发，避免配置差异和兼容性问题**.

**Acceptance Criteria:**

**Given** 开发环境已安装Node.js 18+和pnpm
**When** 执行`npm create @quick-start/electron`创建项目
**Then** 项目结构应包含以下关键目录和文件：
- `src/main/` - 主进程代码目录
- `src/renderer/` - 渲染进程代码目录
- `src/preload/` - 预加载脚本目录
- `electron.vite.config.ts` - Vite配置文件
- `package.json` 包含Electron、React 18、TypeScript依赖

**And** 执行`pnpm install`能成功安装所有依赖
**And** 执行`pnpm dev`能启动开发服务器并打开Electron窗口
**And** 应用窗口显示默认的React欢迎页面
**And** 热重载功能正常工作（修改代码后自动刷新）

**And** Ant Design已集成：
- `package.json`包含`antd@5.x`依赖
- 在`src/renderer/main.tsx`中能成功导入并使用Ant Design组件（如Button）
- 主题配置文件已创建（`src/renderer/theme.ts`）

**And** TypeScript配置完整：
- `tsconfig.json`配置严格模式（`strict: true`）
- 包含路径别名配置（`@/*`指向`src/*`）
- 编译无错误

**And** 项目根目录包含以下文档：
- `README.md` - 项目说明和快速开始指南
- `.gitignore` - 忽略node_modules、dist等
- `package.json`中的scripts包含：dev、build、preview命令

---

## Story 1.2: SQLite数据库基础设施

As a **开发者**,
I want **集成SQLite数据库并建立迁移机制**,
So that **应用可以持久化存储用户数据，并支持未来的数据库结构演进**.

**Acceptance Criteria:**

**Given** electron-vite项目骨架已完成（Story 1.1）
**When** 集成better-sqlite3库
**Then** `package.json`包含`better-sqlite3@^9.0.0`依赖
**And** 在主进程中能成功导入并初始化数据库连接

**When** 实现DatabaseService类（`src/main/services/DatabaseService.ts`）
**Then** DatabaseService提供以下方法：
- `initialize()` - 初始化数据库连接
- `getConnection()` - 获取数据库连接实例
- `close()` - 关闭数据库连接
- `runMigrations()` - 执行数据库迁移

**And** 数据库文件存储在正确位置：
- Windows: `%APPDATA%/MindReminder/mindreminder.db`
- macOS: `~/Library/Application Support/MindReminder/mindreminder.db`
- 如果目录不存在则自动创建

**When** 实现数据库迁移机制
**Then** 创建迁移文件目录`src/main/migrations/`
**And** 创建`migrations.ts`管理迁移版本
**And** 创建初始迁移文件`001_initial_schema.sql`包含：
```sql
-- knowledge表（知识点）
CREATE TABLE IF NOT EXISTS knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  frequency_coefficient REAL DEFAULT 1.0
);

-- review_history表（复习历史）
CREATE TABLE IF NOT EXISTS review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  knowledge_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  review_date INTEGER NOT NULL,
  next_review_date INTEGER NOT NULL,
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_tags ON knowledge(tags);
CREATE INDEX idx_review_history_knowledge_id ON review_history(knowledge_id);
CREATE INDEX idx_review_history_next_date ON review_history(next_review_date);
```

**And** 应用启动时自动执行待处理的迁移
**And** 迁移执行使用事务保证原子性
**And** 迁移失败时回滚并记录错误日志

**When** 应用首次启动
**Then** 数据库文件成功创建
**And** knowledge和review_history表已创建
**And** 所有索引已建立
**And** 日志显示"Database initialized successfully"

---

## Story 1.3: Repository模式数据访问层

As a **开发者**,
I want **实现Repository模式封装数据库访问**,
So that **业务逻辑与数据访问分离，代码更易测试和维护**.

**Acceptance Criteria:**

**Given** SQLite数据库基础设施已完成（Story 1.2）
**When** 创建BaseRepository抽象类（`src/main/repositories/BaseRepository.ts`）
**Then** BaseRepository提供通用CRUD方法：
- `findById(id: number): T | null`
- `findAll(): T[]`
- `create(data: Partial<T>): T`
- `update(id: number, data: Partial<T>): T`
- `delete(id: number): boolean`

**And** BaseRepository接收DatabaseService实例作为依赖
**And** 所有数据库操作包含错误处理和日志记录
**And** 数据命名规范：数据库使用snake_case，TypeScript使用camelCase

**When** 实现KnowledgeRepository（`src/main/repositories/KnowledgeRepository.ts`）
**Then** KnowledgeRepository继承BaseRepository
**And** 提供知识点特定方法：
- `findByTags(tags: string[]): Knowledge[]`
- `search(keyword: string): Knowledge[]`
- `findByStatus(status: string): Knowledge[]`
- `updateFrequencyCoefficient(id: number, coefficient: number): boolean`

**And** 定义Knowledge类型（`src/main/types/Knowledge.ts`）：
```typescript
interface Knowledge {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  frequencyCoefficient: number;
}
```

**When** 实现ReviewRepository（`src/main/repositories/ReviewRepository.ts`）
**Then** ReviewRepository继承BaseRepository
**And** 提供复习历史特定方法：
- `findByKnowledgeId(knowledgeId: number): ReviewHistory[]`
- `findDueReviews(date: Date): ReviewHistory[]`
- `createReview(knowledgeId: number, rating: number, nextReviewDate: Date): ReviewHistory`

**And** 定义ReviewHistory类型（`src/main/types/ReviewHistory.ts`）：
```typescript
interface ReviewHistory {
  id: number;
  knowledgeId: number;
  rating: number;
  reviewDate: Date;
  nextReviewDate: Date;
}
```

**When** 创建Repository工厂（`src/main/repositories/index.ts`）
**Then** 提供单例模式访问所有Repository实例
**And** Repository在应用启动时初始化一次
**And** Repository共享同一个DatabaseService实例

**When** 执行单元测试
**Then** 所有Repository方法能正确执行CRUD操作
**And** 数据类型转换正确（snake_case ↔ camelCase）
**And** 边界条件处理正确（如查询不存在的ID返回null）

---

## Story 1.4: 复习算法核心框架

As a **开发者**,
I want **实现基于艾宾浩斯曲线的复习算法**,
So that **系统能科学地计算知识点的下次复习时间，帮助用户高效记忆**.

**Acceptance Criteria:**

**Given** 项目基础设施已完成（Story 1.1-1.3）
**When** 创建SpacedRepetitionAlgorithm类（`src/main/algorithms/SpacedRepetitionAlgorithm.ts`）
**Then** 类提供以下核心方法：
- `calculateNextReviewDate(lastReviewDate: Date, reviewCount: number, rating: number, frequencyCoefficient: number): Date`
- `getRatingMultiplier(rating: number): number`
- `isKnowledgeMastered(reviewHistory: ReviewHistory[]): boolean`

**When** 实现评分系数映射
**Then** getRatingMultiplier返回正确的系数：
- 评分1（😟 忘记了）→ 0.5
- 评分2（🤔 记得一点）→ 0.7
- 评分3（😐 记得一般）→ 1.0
- 评分4（😊 记得还可以）→ 1.2
- 评分5（🎯 非常熟悉）→ 1.5

**When** 实现艾宾浩斯遗忘曲线计算
**Then** calculateNextReviewDate使用以下间隔（天）：
- 第1次复习：1天
- 第2次复习：2天
- 第3次复习：4天
- 第4次复习：7天
- 第5次复习：15天
- 第6次及以后：30天

**And** 间隔时间乘以评分系数（ratingMultiplier）
**And** 间隔时间乘以频率系数（frequencyCoefficient，范围0.5-1.5）
**And** 最终计算公式：`nextReviewDate = lastReviewDate + (baseInterval × ratingMultiplier × frequencyCoefficient)`

**When** 计算示例：
- 第3次复习，评分4（😊），全局频率系数1.0
**Then** 下次复习间隔 = 4天 × 1.2 × 1.0 = 4.8天（向上取整为5天）

**When** 实现记忆掌握判断
**Then** isKnowledgeMastered检查以下条件：
- 至少进行过5次复习
- 最近3次复习评分均 ≥ 4（😊）
- 距离首次记录时间 ≥ 30天
**And** 所有条件满足时返回true

**When** 创建单元测试（`src/main/algorithms/SpacedRepetitionAlgorithm.test.ts`）
**Then** 测试覆盖以下场景：
- 评分系数映射正确性
- 各个复习阶段的间隔计算
- 频率系数对间隔的影响
- 边界条件（评分范围外、负数复习次数等）
- 记忆掌握判断的各种组合

**And** 所有测试用例通过
**And** 代码覆盖率 ≥ 90%

---

## Story 1.5: IPC通信基础架构

As a **开发者**,
I want **建立主进程与渲染进程之间的安全通信机制**,
So that **前端UI可以调用后端服务，同时保证Electron安全最佳实践**.

**Acceptance Criteria:**

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

**When** 实现错误处理中间件
**Then** 所有IPC调用包含try-catch错误捕获
**And** 错误信息通过electron-log记录到日志文件
**And** 错误响应包含用户友好的错误消息
**And** 敏感信息（如文件路径）不暴露给渲染进程

**When** 配置electron-log（`src/main/logger.ts`）
**Then** 日志文件存储位置：
- Windows: `%APPDATA%/MindReminder/logs/`
- macOS: `~/Library/Logs/MindReminder/`
**And** 日志级别可配置（开发环境：debug，生产环境：info）
**And** 日志文件自动轮转（每日一个文件，保留7天）

**When** 从渲染进程调用IPC接口
**Then** 调用成功时返回数据
**And** 调用失败时返回错误信息
**And** 所有调用响应时间 < 200ms（简单查询）
**And** 主进程日志记录请求和响应

---

## Story 1.6: Zustand状态管理基础

As a **开发者**,
I want **建立全局状态管理机制**,
So that **应用可以高效管理跨组件的状态，避免prop drilling和状态不一致**.

**Acceptance Criteria:**

**Given** electron-vite项目骨架和IPC通信已完成（Story 1.1, 1.5）
**When** 集成Zustand库
**Then** `package.json`包含`zustand@^4.0.0`依赖
**And** 在渲染进程中能成功导入Zustand

**When** 创建应用状态Store（`src/renderer/stores/appStore.ts`）
**Then** Store包含以下状态：
```typescript
interface AppState {
  // 应用级状态
  isLoading: boolean;
  currentView: 'calendar' | 'list' | 'detail';
  theme: 'light' | 'dark';
  
  // 操作方法
  setLoading: (isLoading: boolean) => void;
  setCurrentView: (view: string) => void;
  setTheme: (theme: string) => void;
}
```

**When** 创建知识点状态Store（`src/renderer/stores/knowledgeStore.ts`）
**Then** Store包含以下状态和方法：
```typescript
interface KnowledgeState {
  // 状态
  knowledgeList: Knowledge[];
  currentKnowledge: Knowledge | null;
  isLoading: boolean;
  
  // 操作方法
  loadKnowledgeList: () => Promise<void>;
  loadKnowledge: (id: number) => Promise<void>;
  createKnowledge: (data: Partial<Knowledge>) => Promise<void>;
  updateKnowledge: (id: number, data: Partial<Knowledge>) => Promise<void>;
  deleteKnowledge: (id: number) => Promise<void>;
}
```

**And** 操作方法内部调用IPC接口（通过window.electronAPI）
**And** 操作方法包含错误处理和加载状态管理

**When** 创建Store组合Hook（`src/renderer/stores/index.ts`）
**Then** 导出所有Store的Hook：
```typescript
export { useAppStore } from './appStore';
export { useKnowledgeStore } from './knowledgeStore';
```

**When** 在React组件中使用Store
**Then** 组件可以通过Hook访问状态：
```typescript
const { knowledgeList, loadKnowledgeList } = useKnowledgeStore();
```
**And** 状态变化时组件自动重新渲染
**And** 只订阅使用的状态（避免不必要的重渲染）

**When** 创建示例组件验证Store功能（`src/renderer/App.tsx`）
**Then** 组件能成功读取和更新Store状态
**And** 多个组件可以共享同一Store状态
**And** 状态变化在所有订阅组件中同步

**When** 配置开发工具
**Then** 集成Redux DevTools支持（通过zustand/middleware）
**And** 开发环境可以查看状态变化历史
**And** 可以进行时间旅行调试

---

## Epic 1 完成！

✅ **已创建6个Stories**
- Story 1.1: electron-vite项目初始化
- Story 1.2: SQLite数据库基础设施
- Story 1.3: Repository模式数据访问层
- Story 1.4: 复习算法核心框架
- Story 1.5: IPC通信基础架构
- Story 1.6: Zustand状态管理基础

✅ **覆盖需求验证：**
- ✅ 架构需求：Starter Template (electron-vite + React + TypeScript + Ant Design) → Story 1.1
- ✅ 架构需求：数据库5表结构 + Repository模式 → Story 1.2, 1.3
- ✅ 架构需求：复习算法框架（SpacedRepetitionAlgorithm）→ Story 1.4
- ✅ 架构需求：IPC通信基础架构 → Story 1.5
- ✅ FR50: 本地SQLite数据库存储 → Story 1.2
- ✅ NFR-M1, NFR-M2: 模块化架构和可扩展性 → 所有Stories
