---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/prd.md
  - docs/ux-design-specification.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2025-12-13'
project_name: 'MindReminder'
user_name: 'Administrator'
date: '2025-12-13'
---

# Architecture Decision Document

_此文档通过步骤式协作逐步构建。每个架构决策部分将在我们共同探讨后追加到文档中。_

---

## 项目上下文分析

### 需求概览

**功能需求（72个FR）：**

MindReminder 是一款桌面端间隔重复记忆应用，功能需求分为10个主要类别：

1. **知识点管理** (9 FRs): 以问题形式记录、编辑、分类、查看复习历史和评分趋势
2. **复习系统** (9 FRs): 艾宾浩斯算法、5级人性化评分（😟🤔😐😊🎯）、动态间隔调整、全局和单点复习频率系数
3. **日历可视化** (8 FRs): 月/周/年视图、热力图展示、悬浮预览、详情面板、下次复习时间标记
4. **日记管理** (6 FRs): 富文本/Markdown日记、日历标记、查看和编辑
5. **提醒事项** (7 FRs): 创建、编辑、完成、时间提醒、日历显示
6. **搜索筛选** (4 FRs): 标题搜索、标签筛选、状态筛选
7. **统计分析** (6 FRs): 今日统计、总数、掌握度、完成率、连续天数、记忆进度预测
8. **数据管理** (7 FRs): SQLite存储、JSON/CSV导出导入、自动备份、数据完整性验证
9. **系统集成** (8 FRs): 系统托盘、全局快捷键、桌面通知、开机自启、窗口状态记忆
10. **用户设置** (8 FRs): 复习频率配置、记忆标准、通知时间、主题、快捷键自定义

**非功能需求（关键NFRs）：**

**性能要求：**

- 冷启动 ≤ 3秒，热启动 ≤ 1秒
- UI响应 ≤ 200ms，搜索 ≤ 500ms
- 日历切换 ≤ 1秒
- 支持100+知识点流畅，1000+知识点可用
- 内存 ≤ 300MB，CPU空闲 ≤ 5%
- 包体积 ≤ 150MB

**可靠性要求：**

- 数据零丢失，崩溃后可恢复
- 每日自动备份，保留7天
- SQLite事务保证一致性
- 算法计算100%准确

**隐私与安全：**

- 完全本地存储（MVP阶段）
- 无网络请求，无数据收集
- 数据100%用户掌控
- 预留云同步加密字段

**可用性要求：**

- 新用户5分钟内上手
- 快速记录 ≤ 10秒
- 完整键盘导航支持
- 清晰的焦点指示

**兼容性要求：**

- Windows 10+, macOS 10.14+
- 高DPI屏幕支持
- 跨平台UI一致性
- 最小分辨率 800x600

**规模与复杂度：**

- **项目类型**: 桌面应用（Electron + React）
- **复杂度级别**: 中等（Medium）
- **主要技术域**: 全栈桌面端（前端 + 本地后端）
- **预估核心组件**: 10-12个架构模块
- **数据模型**: 5-7个核心实体
- **算法复杂度**: 中-高（核心复习算法）

### 技术约束与依赖

**明确的技术选型：**

- **应用框架**: Electron（跨平台桌面）
- **前端框架**: React
- **UI组件库**: Ant Design（定制主题）
- **本地数据库**: SQLite
- **配置存储**: JSON文件
- **目标平台**: Windows 10+ / macOS 10.14+

**关键约束：**

- 完全离线运行（MVP阶段无需联网）
- 数据存储位置固定：
  - Windows: `%APPDATA%/MindReminder/`
  - macOS: `~/Library/Application Support/MindReminder/`
- 资源限制：包体积 ≤150MB，内存 ≤300MB
- 需处理Windows和macOS平台差异
- 文件路径、快捷键、系统集成的跨平台兼容

**扩展性设计预留：**

- 数据模型包含云同步字段（`sync_status`, `updated_at`, `uuid`）
- 模块化数据访问层（DAL），便于替换存储方案
- 阶段2准备：跨设备云同步
- 阶段3准备：移动端应用（iOS/Android）

### 跨领域关注点识别

**1. 状态管理与数据同步**

- React组件状态与SQLite数据库的双向同步
- 多窗口间的状态一致性（主窗口 + 快速记录窗口）
- 实时更新机制（记录后日历立即刷新）
- Electron IPC通信（主进程与渲染进程）

**2. 性能优化**

- 日历热力图的高效渲染（1000+知识点场景）
- 虚拟滚动技术（列表、日历）
- 计算结果缓存（复习时间、热力图颜色）
- 懒加载和按需渲染
- 启动优化（代码分割、延迟加载）

**3. 数据完整性与可靠性**

- SQLite事务管理（ACID保证）
- 自动备份策略（每日备份，保留7天）
- 崩溃恢复机制（未保存数据恢复）
- 数据版本管理和迁移
- 导出/导入完整性验证

**4. 错误处理与日志**

- 全局错误捕获和友好提示
- 操作日志记录（审计追踪）
- 错误日志持久化（本地文件）
- 用户操作可撤销

**5. 跨平台兼容性**

- 平台特定代码隔离
- UI规范适配（Windows vs macOS）
- 文件路径处理统一
- 快捷键映射（Ctrl vs Cmd）
- 系统托盘、通知、自启动的平台差异

**6. 安全与隐私**

- 本地数据访问控制
- 未来云同步的端到端加密准备
- 用户隐私承诺（无数据收集）
- 数据导出的安全性

### 独特的架构挑战

**1. 复习算法的准确性与灵活性**

- 精确实现艾宾浩斯遗忘曲线算法
- 支持全局复习频率系数（0.5x-2.0x）调整
- 支持单个知识点独立系数（0.3x-3.0x）
- 基于5级评分的动态间隔调整
- 记忆标准判断和长期抽查触发
- 算法参数可测试、可调优
- 实时计算下次复习时间（< 100ms）

**2. 日历热力图的高性能渲染**

- 支持1000+知识点的流畅显示
- 6级颜色深浅实时计算
- 月份切换流畅动画（< 200ms）
- 悬浮预览响应 < 100ms
- 年视图一屏展示365天
- 虚拟滚动优化
- 渐进式渲染（骨架屏 → 内容）

**3. 多窗口架构与状态同步**

- 主窗口（1200x800px）完整功能
- 快速记录小窗口（400x300px）始终置顶
- 跨窗口数据实时同步
- Electron主进程与多个渲染进程通信
- 窗口状态管理（位置、大小、可见性）

**4. 数据可靠性保障**

- SQLite并发访问控制
- 写操作的事务包装
- 定期数据完整性检查
- 自动备份不阻塞主线程
- 崩溃时的数据恢复策略
- 数据库schema版本管理

**5. 桌面原生体验集成**

- 系统托盘菜单和状态显示
- 全局快捷键注册和冲突处理
- 桌面通知（跨平台API差异）
- 开机自启动配置
- 文件关联和深链接（未来）
- macOS红绿灯按钮行为适配

---

## Starter Template 评估

### 主要技术领域

**桌面应用（Desktop Application）**  
基于 Electron + React + Vite + TypeScript 技术栈的跨平台桌面应用。

### 技术偏好确认

基于项目需求和用户偏好，确定以下技术选择：

**已确认的技术栈：**

- ✅ **应用框架**: Electron（跨平台桌面）
- ✅ **前端框架**: React 18
- ✅ **语言**: TypeScript
- ✅ **构建工具**: Vite
- ✅ **状态管理**: Zustand（轻量、新手友好）
- ✅ **UI组件库**: Ant Design
- ✅ **包管理器**: pnpm
- ✅ **数据库**: SQLite（better-sqlite3）

**团队情况：**

- 个人项目
- Electron 新手
- React 新手
- 追求学习曲线平缓、开箱即用的解决方案

### 选择的 Starter: electron-vite

**工具**: electron-vite v5.0.0  
**GitHub**: https://github.com/alex8088/electron-vite  
**文档**: https://electron-vite.org/

**选择理由：**

1. **专为 Electron + Vite 优化**  
   专门解决 Electron 双环境（Node.js + Browser）的构建和开发体验问题。

2. **成熟稳定**
   - 非实验性，生产就绪（v5.0.0）
   - 完整的 TypeScript 支持
   - 内置 HMR 和 Hot Reload
   - 文档完善，社区活跃

3. **新手友好**
   - 配置简单，开箱即用
   - 官方模板质量高
   - 适合个人项目快速启动

4. **技术匹配度高**
   - ✅ TypeScript 完整支持
   - ✅ React 18 官方模板
   - ✅ Vite 5+ 快速构建
   - ✅ 支持 Ant Design 集成
   - ✅ 多窗口、系统集成等高级特性

**初始化命令：**

```bash
# 创建项目
pnpm create @quick-start/electron@latest MindReminder -- --template react-ts

# 进入项目
cd MindReminder

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

### Starter 提供的架构决策

#### **1. 技术栈配置**

**语言与编译：**

- TypeScript 5+ (主进程 + 渲染进程)
- ESNext 语法支持
- 严格类型检查

**构建工具链：**

- Vite 5+ (开发服务器 + 构建工具)
- Rollup (生产构建)
- ESBuild (TypeScript 转译和压缩)

#### **2. 项目结构**

```
MindReminder/
├── src/
│   ├── main/              # 主进程（Node.js环境）
│   │   └── index.ts       # Electron主进程入口
│   ├── preload/           # 预加载脚本（IPC桥接）
│   │   └── index.ts       # Context Bridge API
│   └── renderer/          # 渲染进程（React应用）
│       ├── index.html
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx   # React入口
│       │   ├── components/
│       │   ├── pages/
│       │   ├── stores/    # Zustand状态管理
│       │   └── utils/
│       └── assets/
├── resources/             # 静态资源（图标、字体等）
├── out/                   # 构建输出目录
│   ├── main/
│   ├── preload/
│   └── renderer/
├── electron.vite.config.ts  # electron-vite配置文件
├── electron-builder.yml     # 打包配置
├── package.json
├── tsconfig.json           # TypeScript配置
└── tsconfig.node.json      # Node环境TS配置
```

#### **3. Electron 架构模式**

**进程模型：**

- **主进程（Main Process）**: 应用生命周期、窗口管理、系统API、SQLite数据库
- **渲染进程（Renderer Process）**: React UI界面、用户交互、视图渲染
- **预加载脚本（Preload Script）**: IPC通信桥接、API暴露

**IPC 通信模式：**

- Context Bridge 安全通信
- 类型安全的 API 定义
- 双向通信支持（invoke/handle、send/on）

#### **4. 开发体验配置**

**开发工具：**

- ESLint + Prettier (代码质量)
- TypeScript 严格模式
- Hot Module Replacement (HMR)
- 主进程热重启 (Hot Reload)

**调试支持：**

- Chrome DevTools (渲染进程)
- V8 Inspector (主进程)
- Source Map 支持

#### **5. 构建与打包**

**构建配置：**

- 开发环境：快速增量构建
- 生产环境：代码压缩、Tree Shaking
- 源码保护：V8 Bytecode 编译（可选）

**打包工具：**

- Electron Builder (推荐)
- 支持 Windows、macOS 一键打包
- 自动生成安装程序

### 需要额外添加的依赖

Starter 提供基础架构，项目特定依赖需要手动添加：

```bash
# UI 组件库
pnpm add antd @ant-design/icons

# 状态管理
pnpm add zustand

# 数据库 (仅主进程使用)
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3

# 工具库
pnpm add dayjs  # 日期处理（复习算法）
pnpm add uuid   # 唯一ID生成
pnpm add -D @types/uuid
```

### 架构约束与最佳实践

**1. SQLite 使用约束**

- ⚠️ `better-sqlite3` **只能在主进程中使用**（C++ Native模块）
- 渲染进程通过 IPC 调用主进程的数据库API
- 主进程暴露数据访问层（DAL）接口

**2. 状态管理策略**

- **Zustand**: 渲染进程状态管理（UI状态、缓存等）
- **SQLite**: 持久化数据存储（主进程）
- **IPC**: 跨进程数据同步

**3. 安全性考虑**

- 渲染进程沙箱模式（默认）
- Context Bridge 暴露最小必要API
- 禁用 Node.js Integration（渲染进程）

**4. 性能优化**

- 主进程数据库操作异步化
- 渲染进程计算结果缓存
- 虚拟滚动处理大列表
- Code Splitting 减小初始加载

### 项目初始化步骤

**注意**: 项目初始化应该作为**第一个开发Story**实施：

1. 使用上述命令创建项目骨架
2. 安装额外依赖（Ant Design、Zustand、better-sqlite3等）
3. 配置 TypeScript 路径别名
4. 配置 Ant Design 主题（参考 UX 设计规范）
5. 设置基础目录结构
6. 验证开发环境（`pnpm run dev` 能正常启动）
7. 验证构建流程（`pnpm run build` 能成功构建）

### 与其他架构组件的集成

**数据库模块（SQLite）:**

- 在 `src/main/database/` 目录实现
- 通过 IPC 向渲染进程提供接口

**复习算法模块:**

- 核心逻辑在主进程实现（更安全、性能更好）
- 渲染进程通过 IPC 调用计算下次复习时间

**UI 组件（Ant Design）:**

- 在 `src/renderer/src/` 目录使用
- 配置主题和国际化

---

## 核心架构决策

### 决策优先级分析

**关键决策（阻塞实施）：**

- 数据访问层（DAL）模式
- 数据库表结构设计
- IPC 通信接口定义
- 复习算法实现位置

**重要决策（影响架构）：**

- 路由策略
- 缓存策略
- 虚拟滚动方案
- 日志和错误处理

**延后决策（Post-MVP）：**

- E2E 测试框架
- 性能监控方案
- 国际化支持

---

### 1. 数据架构决策

#### 1.1 数据访问层（DAL）模式

**决策：Repository 模式**

**理由：**

- 清晰的分层架构，职责分明
- 易于单元测试和模拟
- 适合中等复杂度项目
- 便于未来扩展（如添加缓存层）

**实现结构：**

```typescript
// src/main/database/repositories/KnowledgeRepository.ts
export class KnowledgeRepository {
  constructor(private db: Database) {}

  findAll(): Knowledge[] {
    /* SQLite 查询 */
  }
  findById(id: string): Knowledge | null {
    /* */
  }
  findByStatus(status: string): Knowledge[] {
    /* */
  }
  save(knowledge: Knowledge): void {
    /* */
  }
  update(id: string, data: Partial<Knowledge>): void {
    /* */
  }
  delete(id: string): void {
    /* */
  }
}

// src/main/database/repositories/ReviewRepository.ts
export class ReviewRepository {
  // 复习记录的 CRUD 操作
}

// src/main/database/repositories/DiaryRepository.ts
export class DiaryRepository {
  // 日记的 CRUD 操作
}
```

**IPC 暴露：**

```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('api', {
  knowledge: {
    getAll: () => ipcRenderer.invoke('knowledge:getAll'),
    getById: (id) => ipcRenderer.invoke('knowledge:getById', id),
    create: (data) => ipcRenderer.invoke('knowledge:create', data),
    update: (id, data) => ipcRenderer.invoke('knowledge:update', id, data),
    delete: (id) => ipcRenderer.invoke('knowledge:delete', id)
  }
  // 其他 Repository 的 API
})
```

#### 1.2 数据库表结构设计

**核心表设计：**

**1. knowledge (知识点表)**

```sql
CREATE TABLE knowledge (
  id TEXT PRIMARY KEY,              -- UUID
  title TEXT NOT NULL,              -- 标题（问题形式）
  content TEXT,                     -- 答案内容
  tags TEXT,                        -- 标签（JSON数组）
  category TEXT,                    -- 分类
  frequency_coefficient REAL DEFAULT 1.0,  -- 单点复习系数
  mastery_status TEXT DEFAULT 'learning',  -- 学习中/已掌握
  created_at INTEGER NOT NULL,      -- 创建时间（Unix时间戳）
  updated_at INTEGER NOT NULL,      -- 更新时间
  sync_status TEXT DEFAULT 'local', -- 云同步状态（预留）
  last_review_at INTEGER,           -- 最后复习时间
  next_review_at INTEGER,           -- 下次复习时间
  review_count INTEGER DEFAULT 0,   -- 复习次数
  mastered_at INTEGER               -- 掌握时间
);

CREATE INDEX idx_knowledge_next_review ON knowledge(next_review_at);
CREATE INDEX idx_knowledge_category ON knowledge(category);
CREATE INDEX idx_knowledge_status ON knowledge(mastery_status);
```

**2. review_history (复习历史表)**

```sql
CREATE TABLE review_history (
  id TEXT PRIMARY KEY,
  knowledge_id TEXT NOT NULL,
  rating INTEGER NOT NULL,          -- 1-5 (😟🤔😐😊🎯)
  reviewed_at INTEGER NOT NULL,
  next_review_at INTEGER NOT NULL,  -- 记录当时计算的下次时间
  interval_days REAL NOT NULL,      -- 间隔天数
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_history_knowledge ON review_history(knowledge_id);
CREATE INDEX idx_review_history_date ON review_history(reviewed_at);
```

**3. diary (日记表)**

```sql
CREATE TABLE diary (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,        -- YYYY-MM-DD 格式
  content TEXT NOT NULL,            -- Markdown 内容
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'local'
);

CREATE INDEX idx_diary_date ON diary(date);
```

**4. reminder (提醒事项表)**

```sql
CREATE TABLE reminder (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  due_date INTEGER NOT NULL,        -- 提醒时间
  completed INTEGER DEFAULT 0,      -- 0/1
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'local'
);

CREATE INDEX idx_reminder_due_date ON reminder(due_date);
CREATE INDEX idx_reminder_completed ON reminder(completed);
```

**5. settings (用户设置表)**

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,              -- JSON 序列化的值
  updated_at INTEGER NOT NULL
);

-- 预设数据
INSERT INTO settings (key, value, updated_at) VALUES
  ('global_frequency_coefficient', '1.0', strftime('%s', 'now')),
  ('memory_standard_days', '30', strftime('%s', 'now')),
  ('memory_standard_rating', '4', strftime('%s', 'now')),  -- 😊
  ('notification_time', '20:00', strftime('%s', 'now')),
  ('theme', 'light', strftime('%s', 'now'));
```

#### 1.3 数据迁移策略

**决策：版本化 SQL 迁移文件**

```typescript
// src/main/database/migrations/
// 001_initial_schema.ts
// 002_add_mastered_at_column.ts
// 003_add_category_index.ts

export interface Migration {
  version: number
  up: (db: Database) => void
  down: (db: Database) => void
}

// 迁移管理器
class MigrationManager {
  getCurrentVersion(): number {
    /* */
  }
  runMigrations(targetVersion?: number): void {
    /* */
  }
}
```

#### 1.4 缓存策略

**决策：分层缓存**

**渲染进程缓存（Zustand）：**

- 当前日历月份数据（知识点列表）
- 热力图计算结果（颜色映射）
- 今日待复习任务列表
- 统计数据（连续天数、总数等）

**主进程缓存（内存）：**

- 全局设置（避免频繁读取）
- 最近使用的知识点（LRU Cache）

**缓存失效策略：**

- 数据修改时立即失效相关缓存
- 跨窗口通过 IPC 事件同步缓存

```typescript
// src/renderer/src/stores/cacheStore.ts
export const useCacheStore = create<CacheStore>((set) => ({
  calendarData: {},
  heatmapColors: {},
  invalidateCalendar: (month: string) => {
    /* */
  }
  // ...
}))
```

---

### 2. 核心算法实现

#### 2.1 复习算法实现位置

**决策：主进程实现**

**理由：**

- 算法是核心业务逻辑，放在主进程更安全
- 避免渲染进程被篡改影响算法准确性
- 主进程可以统一管理算法参数
- 便于单元测试

**实现结构：**

```typescript
// src/main/algorithm/SpacedRepetition.ts
export class SpacedRepetitionAlgorithm {
  /**
   * 计算下次复习时间
   * @param lastReviewDate 上次复习时间
   * @param rating 评分 (1-5)
   * @param reviewCount 已复习次数
   * @param frequencyCoefficient 复习频率系数
   * @returns 下次复习的 Unix 时间戳
   */
  calculateNextReview(
    lastReviewDate: number,
    rating: number,
    reviewCount: number,
    frequencyCoefficient: number = 1.0
  ): number {
    // 艾宾浩斯遗忘曲线实现
    // 间隔序列：1天, 2天, 4天, 7天, 15天, 30天, 60天...
    const baseIntervals = [1, 2, 4, 7, 15, 30, 60, 120, 180, 365]

    // 根据评分调整
    let interval = baseIntervals[Math.min(reviewCount, baseIntervals.length - 1)]

    // 评分调整系数
    const ratingMultipliers = {
      1: 0.5, // 😟 忘记了 - 间隔减半
      2: 0.7, // 🤔 记得一点 - 间隔缩短30%
      3: 1.0, // 😐 记得一般 - 标准间隔
      4: 1.2, // 😊 记得还可以 - 间隔延长20%
      5: 1.5 // 🎯 非常熟悉 - 间隔延长50%
    }

    interval *= ratingMultipliers[rating] || 1.0
    interval *= frequencyCoefficient

    // 计算下次时间
    return lastReviewDate + interval * 24 * 60 * 60 * 1000
  }

  /**
   * 判断是否达到记忆标准
   */
  checkMasteryStatus(
    reviews: ReviewRecord[],
    memoryStandardDays: number = 30,
    memoryStandardRating: number = 4
  ): boolean {
    // 检查最近30天内是否有评分>=4的记录
    const now = Date.now()
    const recentReviews = reviews.filter(
      (r) => now - r.reviewed_at <= memoryStandardDays * 24 * 60 * 60 * 1000
    )

    return recentReviews.some((r) => r.rating >= memoryStandardRating)
  }
}
```

#### 2.2 日历热力图计算

**决策：渲染进程计算 + 结果缓存**

**理由：**

- 颜色计算是 UI 相关逻辑
- 避免频繁 IPC 通信
- 渲染进程可以缓存计算结果

**实现：**

```typescript
// src/renderer/src/utils/heatmapCalculator.ts
export function calculateHeatmapColor(activityCount: number): string {
  // 6级颜色深浅
  const colorLevels = [
    '#f0f0f0', // 0: 无活动
    '#c6e3ff', // 1-2: 极浅蓝
    '#91d5ff', // 3-5: 浅蓝
    '#40a9ff', // 6-10: 中蓝
    '#1890ff', // 11-15: 深蓝
    '#096dd9' // 16+: 极深蓝
  ]

  if (activityCount === 0) return colorLevels[0]
  if (activityCount <= 2) return colorLevels[1]
  if (activityCount <= 5) return colorLevels[2]
  if (activityCount <= 10) return colorLevels[3]
  if (activityCount <= 15) return colorLevels[4]
  return colorLevels[5]
}
```

---

### 3. 前端架构细节

#### 3.1 路由策略

**决策：无需路由库，单页面 + Tab 切换**

**理由：**

- 日历中心式设计，所有功能在一个主界面
- 通过左侧导航 + 中央内容区切换
- 使用 Ant Design Tabs 或条件渲染即可
- 避免引入 React Router 增加复杂度

**实现：**

```tsx
// src/renderer/src/App.tsx
function App() {
  const [activeView, setActiveView] = useState<'calendar' | 'list' | 'stats'>('calendar')

  return (
    <Layout>
      <Sider>
        <Menu selectedKeys={[activeView]} onClick={({ key }) => setActiveView(key)}>
          <Menu.Item key="calendar" icon={<CalendarOutlined />}>
            日历
          </Menu.Item>
          <Menu.Item key="list" icon={<UnorderedListOutlined />}>
            知识点
          </Menu.Item>
          <Menu.Item key="stats" icon={<BarChartOutlined />}>
            统计
          </Menu.Item>
        </Menu>
      </Sider>
      <Content>
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'list' && <KnowledgeListView />}
        {activeView === 'stats' && <StatisticsView />}
      </Content>
    </Layout>
  )
}
```

#### 3.2 组件架构

**决策：Atomic Design + Feature 模块化**

**目录结构：**

```
src/renderer/src/
├── components/           # 共享组件
│   ├── atoms/           # 原子组件（Button、Input等）
│   ├── molecules/       # 分子组件（SearchBar、RatingEmoji等）
│   └── organisms/       # 有机组件（KnowledgeCard、CalendarMonth等）
├── features/            # 功能模块
│   ├── calendar/        # 日历功能
│   │   ├── CalendarView.tsx
│   │   ├── HeatmapCalendar.tsx
│   │   ├── DateDetail.tsx
│   │   └── hooks/
│   ├── knowledge/       # 知识点管理
│   │   ├── KnowledgeListView.tsx
│   │   ├── KnowledgeEditor.tsx
│   │   ├── QuickCapture.tsx
│   │   └── hooks/
│   ├── review/          # 复习功能
│   │   ├── ReviewView.tsx
│   │   ├── ReviewCard.tsx
│   │   └── RatingEmoji.tsx
│   └── statistics/      # 统计功能
│       └── StatisticsView.tsx
├── stores/              # Zustand stores
│   ├── knowledgeStore.ts
│   ├── reviewStore.ts
│   └── cacheStore.ts
├── hooks/               # 共享 hooks
│   ├── useKnowledge.ts
│   ├── useReview.ts
│   └── useCalendar.ts
├── utils/               # 工具函数
│   ├── heatmapCalculator.ts
│   ├── dateFormatter.ts
│   └── constants.ts
└── types/               # TypeScript 类型定义
    └── index.ts
```

#### 3.3 虚拟滚动方案

**决策：react-window**

**理由：**

- 成熟稳定，性能优秀
- API 简单，学习成本低
- 支持固定高度和动态高度
- 适合知识点列表和年视图

**安装：**

```bash
pnpm add react-window
pnpm add -D @types/react-window
```

**使用示例：**

```tsx
import { FixedSizeList } from 'react-window'

function KnowledgeList({ items }) {
  return (
    <FixedSizeList height={600} itemCount={items.length} itemSize={80} width="100%">
      {({ index, style }) => (
        <div style={style}>
          <KnowledgeCard knowledge={items[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

---

### 4. 开发与运维

#### 4.1 日志系统

**决策：electron-log**

**理由：**

- Electron 官方推荐
- 自动按日期分割日志文件
- 支持多个日志级别
- 跨平台文件路径处理

**安装：**

```bash
pnpm add electron-log
```

**配置：**

```typescript
// src/main/utils/logger.ts
import log from 'electron-log'
import path from 'path'
import { app } from 'electron'

// 日志文件位置
log.transports.file.resolvePathFn = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'logs', 'main.log')
}

// 日志级别
log.transports.file.level = 'info'
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'

// 日志格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

export default log
```

#### 4.2 错误处理策略

**全局错误捕获：**

```typescript
// src/main/index.ts
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
  // 可选：显示错误对话框
  dialog.showErrorBox('应用错误', error.message)
})

// src/renderer/src/main.tsx
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
  // 显示友好错误提示
  message.error('操作失败，请重试')
})
```

#### 4.3 测试策略

**单元测试：Vitest**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

**测试重点：**

- 复习算法逻辑（100%覆盖率）
- Repository 数据访问层
- 工具函数（日期计算、颜色计算等）
- React 组件快照测试

**E2E 测试：延后到 Post-MVP**

---

### 5. 性能优化决策

#### 5.1 启动优化

**策略：**

- 代码分割（React.lazy + Suspense）
- 延迟加载非关键模块
- SQLite 数据库连接池
- 预编译 Ant Design 图标

#### 5.2 渲染优化

**策略：**

- React.memo 优化组件渲染
- useMemo / useCallback 缓存计算结果
- 虚拟滚动处理长列表
- 防抖/节流用户输入

#### 5.3 数据库查询优化

**策略：**

- 索引优化（已在表设计中包含）
- 批量操作使用事务
- 分页查询大数据集
- 查询结果缓存

---

### 决策影响分析

**实施顺序：**

1. **Phase 1: 基础设施（Week 1-2）**
   - 项目初始化
   - 数据库表结构
   - Repository 层实现
   - IPC 接口定义

2. **Phase 2: 核心功能（Week 3-6）**
   - 复习算法实现
   - 知识点 CRUD
   - 日历视图基础
   - 复习流程

3. **Phase 3: UI 优化（Week 7-9）**
   - Ant Design 主题配置
   - 热力图优化
   - 虚拟滚动集成
   - 动画和交互

4. **Phase 4: 完善与测试（Week 10-12）**
   - 日记和提醒功能
   - 数据导出导入
   - 单元测试
   - 性能优化

**跨组件依赖：**

- Repository 层 → 所有数据操作功能
- 复习算法 → 知识点管理、复习流程
- IPC 接口 → 所有渲染进程功能
- Zustand Store → 所有 UI 组件

---

## 实施模式与一致性规则

### 模式类别概述

**已识别的潜在冲突点：** 32个关键领域

不同的 AI 代理在实现代码时可能做出不同选择，导致代码不兼容。以下模式确保所有代理保持一致。

---

### 1. 命名模式

#### 1.1 数据库命名约定

**表名规则：**

- ✅ **小写蛇形命名**（snake_case）
- ✅ **使用单数**形式
- 示例：`knowledge`, `review_history`, `diary`, `reminder`, `settings`

**列名规则：**

- ✅ **小写蛇形命名**（snake_case）
- ✅ 主键统一命名为 `id`
- ✅ 外键格式：`{表名}_id`（如 `knowledge_id`）
- ✅ 时间戳字段：`created_at`, `updated_at`, `{动作}_at`
- ✅ 布尔字段：`is_{状态}` 或 `has_{特性}`（存储为 0/1）

**索引命名：**

- ✅ 格式：`idx_{表名}_{列名}`
- 示例：`idx_knowledge_next_review`, `idx_review_history_knowledge`

**示例：**

```sql
CREATE TABLE knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  next_review_at INTEGER,
  knowledge_id TEXT
);

CREATE INDEX idx_knowledge_next_review ON knowledge(next_review_at);
```

#### 1.2 IPC 通信命名约定

**IPC 通道命名：**

- ✅ 格式：`{实体}:{操作}`
- ✅ 使用 camelCase
- ✅ 操作动词：get, create, update, delete, list, search

**示例：**

```typescript
// ✅ 正确
ipcMain.handle('knowledge:getAll', ...)
ipcMain.handle('knowledge:getById', ...)
ipcMain.handle('knowledge:create', ...)
ipcMain.handle('knowledge:update', ...)
ipcMain.handle('knowledge:delete', ...)
ipcMain.handle('review:submitRating', ...)

// ❌ 错误
ipcMain.handle('get-all-knowledge', ...)  // 格式不对
ipcMain.handle('KnowledgeGetAll', ...)    // PascalCase 不对
```

#### 1.3 TypeScript 代码命名约定

**文件命名：**

- ✅ **组件文件**：PascalCase + `.tsx` 扩展名
  - 示例：`KnowledgeCard.tsx`, `CalendarView.tsx`
- ✅ **工具/服务文件**：camelCase + `.ts` 扩展名
  - 示例：`heatmapCalculator.ts`, `dateFormatter.ts`
- ✅ **类型定义文件**：camelCase + `.types.ts`
  - 示例：`knowledge.types.ts`, `review.types.ts`
- ✅ **Store 文件**：camelCase + `Store.ts`
  - 示例：`knowledgeStore.ts`, `cacheStore.ts`

**变量和函数命名：**

- ✅ **变量**：camelCase
  - 示例：`knowledgeList`, `nextReviewDate`, `userId`
- ✅ **函数/方法**：camelCase，动词开头
  - 示例：`getKnowledge`, `calculateNextReview`, `formatDate`
- ✅ **React 组件**：PascalCase
  - 示例：`KnowledgeCard`, `ReviewView`, `CalendarMonth`
- ✅ **常量**：UPPER_SNAKE_CASE
  - 示例：`MAX_RETRY_COUNT`, `DEFAULT_FREQUENCY_COEFFICIENT`
- ✅ **类型/接口**：PascalCase
  - 示例：`Knowledge`, `ReviewHistory`, `KnowledgeRepository`
- ✅ **枚举**：PascalCase，成员 PascalCase
  - 示例：`enum MasteryStatus { Learning = 'learning', Mastered = 'mastered' }`

**示例：**

```typescript
// ✅ 正确
interface Knowledge {
  id: string
  title: string
  nextReviewAt: number
}

class KnowledgeRepository {
  findAll(): Knowledge[] {}
  findById(id: string): Knowledge | null {}
}

function calculateNextReview(data: ReviewData): number {}

const MAX_KNOWLEDGE_PER_PAGE = 50

// ❌ 错误
interface knowledge {} // 应该 PascalCase
function FindAll() {} // 应该 camelCase
const maxKnowledgePerPage = 50 // 常量应该 UPPER_SNAKE_CASE
```

---

### 2. 结构模式

#### 2.1 项目组织规则

**主进程结构：**

```
src/main/
├── index.ts              # 主进程入口
├── database/             # 数据库相关
│   ├── connection.ts     # 数据库连接管理
│   ├── migrations/       # 迁移文件
│   │   ├── 001_initial_schema.ts
│   │   └── index.ts
│   └── repositories/     # Repository 层
│       ├── KnowledgeRepository.ts
│       ├── ReviewRepository.ts
│       └── index.ts
├── algorithm/            # 核心算法
│   └── SpacedRepetition.ts
├── services/             # 业务逻辑服务
│   ├── KnowledgeService.ts
│   └── ReviewService.ts
├── utils/                # 工具函数
│   ├── logger.ts
│   └── pathHelper.ts
└── ipc/                  # IPC 处理器
    ├── knowledgeHandlers.ts
    ├── reviewHandlers.ts
    └── index.ts
```

**渲染进程结构（已在前面定义）：**

- 按功能模块组织（features/）
- 共享组件分离（components/）
- Zustand stores 集中管理

#### 2.2 测试文件组织

**规则：**

- ✅ 测试文件与源文件同目录
- ✅ 命名格式：`{文件名}.test.ts` 或 `{文件名}.spec.ts`
- ✅ 测试工具函数放在 `__tests__/utils/`

**示例：**

```
src/main/database/repositories/
├── KnowledgeRepository.ts
└── KnowledgeRepository.test.ts

src/renderer/src/components/
├── KnowledgeCard.tsx
└── KnowledgeCard.test.tsx
```

#### 2.3 导入顺序规则

**标准导入顺序：**

1. Node.js 内置模块
2. 第三方库
3. Electron 模块
4. 项目内部模块（按路径深度排序）
5. 类型导入（`import type`）
6. 样式文件

**示例：**

```typescript
// ✅ 正确顺序
import path from 'path'
import fs from 'fs'

import { app, BrowserWindow } from 'electron'
import dayjs from 'dayjs'
import Database from 'better-sqlite3'

import { KnowledgeRepository } from './database/repositories'
import { SpacedRepetitionAlgorithm } from './algorithm/SpacedRepetition'
import log from './utils/logger'

import type { Knowledge } from './types'

import './styles/global.css'
```

---

### 3. 数据格式模式

#### 3.1 IPC 数据交换格式

**请求格式：**

```typescript
// 参数直接传递，不包装
window.api.knowledge.create({ title, content, tags })
```

**响应格式：**

```typescript
// 成功响应：直接返回数据
interface SuccessResponse<T> {
  data: T
}

// 错误响应：抛出错误（在 IPC handler 中 throw）
// 渲染进程使用 try-catch 捕获
```

**示例：**

```typescript
// 主进程
ipcMain.handle('knowledge:create', async (event, data: CreateKnowledgeDTO) => {
  try {
    const knowledge = await knowledgeService.create(data)
    return { data: knowledge } // ✅ 成功直接返回 data
  } catch (error) {
    log.error('Failed to create knowledge:', error)
    throw error // ✅ 错误直接抛出
  }
})

// 渲染进程
try {
  const response = await window.api.knowledge.create(data)
  const knowledge = response.data // ✅ 提取 data
} catch (error) {
  message.error('创建失败，请重试') // ✅ 捕获错误
}
```

#### 3.2 日期时间格式

**存储格式：**

- ✅ **数据库**：Unix 时间戳（INTEGER，毫秒）
- ✅ **IPC 传输**：Unix 时间戳（number）
- ✅ **UI 显示**：使用 dayjs 格式化

**示例：**

```typescript
// ✅ 正确
const now = Date.now() // 1702450800000
knowledge.created_at = now

// 数据库查询
const row = db.prepare('SELECT * FROM knowledge WHERE created_at > ?').get(now)

// UI 显示
import dayjs from 'dayjs'
const displayDate = dayjs(knowledge.created_at).format('YYYY-MM-DD HH:mm')

// ❌ 错误
knowledge.created_at = new Date().toISOString() // 不要用 ISO 字符串
knowledge.created_at = new Date() // 不要用 Date 对象
```

#### 3.3 布尔值表示

**数据库：**

- ✅ 使用 INTEGER (0/1)

**TypeScript/JavaScript：**

- ✅ 使用 boolean (true/false)

**转换规则：**

```typescript
// 数据库 → TypeScript
const completed = Boolean(row.completed) // 0 → false, 1 → true

// TypeScript → 数据库
const completedInt = completed ? 1 : 0
```

#### 3.4 JSON 字段命名

**TypeScript 对象：camelCase**

```typescript
interface Knowledge {
  id: string
  createdAt: number
  nextReviewAt: number
}
```

**数据库列：snake_case**

```sql
SELECT id, created_at, next_review_at FROM knowledge
```

**转换层（Repository）：**

```typescript
class KnowledgeRepository {
  findById(id: string): Knowledge | null {
    const row = this.db.prepare('SELECT * FROM knowledge WHERE id = ?').get(id)
    if (!row) return null

    // ✅ 转换命名
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at, // snake_case → camelCase
      nextReviewAt: row.next_review_at
      // ...
    }
  }
}
```

---

### 4. 状态管理模式

#### 4.1 Zustand Store 组织

**Store 命名和导出：**

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
export default create(...)  // 不要用 default export
```

**Store 使用规则：**

```typescript
// ✅ 正确：选择性订阅
function KnowledgeList() {
  const knowledgeList = useKnowledgeStore((state) => state.knowledgeList)
  const fetchKnowledgeList = useKnowledgeStore((state) => state.fetchKnowledgeList)

  // ...
}

// ❌ 错误：订阅整个 store（会导致不必要的重渲染）
const store = useKnowledgeStore()
```

#### 4.2 异步状态管理模式

**统一的加载/错误状态：**

```typescript
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

// ✅ 在 Store 中使用
interface KnowledgeStore {
  knowledgeList: AsyncState<Knowledge[]>

  fetchKnowledgeList: () => Promise<void>
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

---

### 5. 错误处理模式

#### 5.1 错误类型定义

**自定义错误类：**

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

#### 5.2 错误处理流程

**主进程：**

```typescript
// IPC Handler
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

**渲染进程：**

```typescript
// React 组件
async function handleCreate() {
  try {
    const response = await window.api.knowledge.create(formData)
    message.success('创建成功')
    // 更新状态
  } catch (error) {
    // 显示用户友好的错误消息
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

#### 5.3 React 错误边界

**标准错误边界组件：**

```typescript
// src/renderer/src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// 使用
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

### 6. 日志模式

#### 6.1 日志级别使用

```typescript
// ✅ 正确使用
log.debug('Detailed debug info', { data }) // 开发调试
log.info('User action', { userId, action }) // 重要操作
log.warn('Potential issue', { issue }) // 警告
log.error('Error occurred', { error }) // 错误

// ❌ 错误使用
log.info('x =', x) // 不要用于调试变量，应该用 debug
log.error('Success') // 不要错用级别
```

#### 6.2 日志格式规范

```typescript
// ✅ 正确：结构化日志
log.info('Knowledge created', {
  knowledgeId: knowledge.id,
  userId: user.id,
  timestamp: Date.now()
})

// ❌ 错误：纯字符串拼接
log.info('Knowledge ' + knowledge.id + ' created by ' + user.id)
```

---

### 7. TypeScript 类型定义模式

#### 7.1 共享类型组织

**类型文件位置：**

```
src/
├── shared/
│   └── types/
│       ├── knowledge.types.ts
│       ├── review.types.ts
│       ├── common.types.ts
│       └── index.ts
```

**类型导出规则：**

```typescript
// knowledge.types.ts
export interface Knowledge {
  id: string
  title: string
  content: string | null
  createdAt: number
  updatedAt: number
}

export interface CreateKnowledgeDTO {
  title: string
  content?: string
  tags?: string[]
}

export interface UpdateKnowledgeDTO {
  title?: string
  content?: string
  tags?: string[]
}

// index.ts - 集中导出
export * from './knowledge.types'
export * from './review.types'
export * from './common.types'
```

#### 7.2 IPC 类型安全

**类型定义：**

```typescript
// src/preload/index.d.ts
interface ElectronAPI {
  knowledge: {
    getAll: () => Promise<{ data: Knowledge[] }>
    getById: (id: string) => Promise<{ data: Knowledge }>
    create: (data: CreateKnowledgeDTO) => Promise<{ data: Knowledge }>
    update: (id: string, data: UpdateKnowledgeDTO) => Promise<{ data: Knowledge }>
    delete: (id: string) => Promise<{ data: void }>
  }
  // ...
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
```

---

### 8. 实施强制规则

#### 所有 AI 代理必须遵守：

1. ✅ **严格遵循命名约定**
   - 数据库：snake_case
   - TypeScript：camelCase (变量/函数), PascalCase (类型/组件)
   - 文件：PascalCase (组件), camelCase (其他)

2. ✅ **遵循项目结构**
   - 主进程代码在 `src/main/`
   - 渲染进程代码在 `src/renderer/src/`
   - 共享类型在 `src/shared/types/`

3. ✅ **使用 TypeScript 严格模式**
   - 所有文件必须有类型定义
   - 禁用 `any` 类型（使用 `unknown` 替代）
   - 启用 `strictNullChecks`

4. ✅ **错误处理必须完整**
   - 所有异步操作使用 try-catch
   - IPC 调用必须有错误处理
   - 向用户显示友好错误消息

5. ✅ **日志记录规范**
   - 所有 CRUD 操作记录 info 日志
   - 所有错误记录 error 日志
   - 使用结构化日志格式

6. ✅ **数据库操作规范**
   - 写操作必须使用事务
   - 查询必须使用参数化（防止SQL注入）
   - Repository 层负责 snake_case ↔ camelCase 转换

7. ✅ **性能优化规范**
   - 列表渲染使用虚拟滚动（超过50项）
   - 计算结果使用 useMemo 缓存
   - 组件使用 React.memo 优化
   - 防抖/节流用户输入

8. ✅ **测试覆盖要求**
   - 核心算法（复习算法）100%覆盖
   - Repository 层 >80%覆盖
   - 工具函数 >80%覆盖

---

### 9. 反模式示例（禁止使用）

#### ❌ 数据库反模式

```typescript
// ❌ 不要：裸 SQL，容易注入
db.prepare(`SELECT * FROM knowledge WHERE title = '${title}'`).get()

// ✅ 应该：参数化查询
db.prepare('SELECT * FROM knowledge WHERE title = ?').get(title)
```

#### ❌ 状态管理反模式

```typescript
// ❌ 不要：直接修改状态
knowledgeList.push(newKnowledge)

// ✅ 应该：不可变更新
set((state) => ({ knowledgeList: [...state.knowledgeList, newKnowledge] }))
```

#### ❌ 错误处理反模式

```typescript
// ❌ 不要：吞掉错误
try {
  await api.call()
} catch (e) {
  // 什么都不做
}

// ✅ 应该：至少记录日志
try {
  await api.call()
} catch (error) {
  log.error('API call failed:', error)
  throw error
}
```

#### ❌ 类型定义反模式

```typescript
// ❌ 不要：使用 any
function process(data: any) {}

// ✅ 应该：明确类型或使用 unknown
function process(data: Knowledge) {}
function process(data: unknown) {}
```

---

### 10. 模式执行检查清单

开发新功能时，确保：

- [ ] 文件命名符合规范（PascalCase 组件，camelCase 其他）
- [ ] 变量命名符合规范（camelCase）
- [ ] 类型已定义且导出
- [ ] IPC 通道命名符合 `{实体}:{操作}` 格式
- [ ] 数据库查询使用参数化
- [ ] Repository 层处理命名转换（snake_case ↔ camelCase）
- [ ] 错误处理完整（try-catch + 日志 + 用户提示）
- [ ] 异步状态管理使用标准模式（loading/error/data）
- [ ] 列表渲染考虑虚拟滚动
- [ ] 关键逻辑编写单元测试

---

## 项目结构与边界

### 完整项目目录结构

```
MindReminder/
├── .vscode/                        # VSCode 配置
│   ├── settings.json               # 编辑器设置
│   ├── extensions.json             # 推荐扩展
│   └── launch.json                 # 调试配置
│
├── .github/                        # GitHub 配置（未来）
│   └── workflows/
│       └── build.yml               # CI/CD 配置
│
├── docs/                           # 项目文档
│   ├── architecture.md             # 本文档
│   ├── prd.md                      # 产品需求
│   ├── ux-design-specification.md  # UX 设计
│   └── api/                        # API 文档
│       └── ipc-api.md              # IPC 接口文档
│
├── resources/                      # 应用资源（打包时复制）
│   ├── icon.png                    # 应用图标（1024x1024）
│   ├── icon.icns                   # macOS 图标
│   ├── icon.ico                    # Windows 图标
│   └── fonts/                      # 自定义字体（如需要）
│
├── src/
│   ├── main/                       # 主进程（Node.js 环境）
│   │   ├── index.ts                # 主进程入口
│   │   │
│   │   ├── database/               # 数据库模块
│   │   │   ├── connection.ts       # 数据库连接管理
│   │   │   ├── init.ts             # 数据库初始化
│   │   │   ├── migrations/         # 数据库迁移
│   │   │   │   ├── 001_initial_schema.ts
│   │   │   │   ├── MigrationManager.ts
│   │   │   │   └── index.ts
│   │   │   └── repositories/       # Repository 层
│   │   │       ├── BaseRepository.ts
│   │   │       ├── KnowledgeRepository.ts
│   │   │       ├── ReviewRepository.ts
│   │   │       ├── DiaryRepository.ts
│   │   │       ├── ReminderRepository.ts
│   │   │       ├── SettingsRepository.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── algorithm/              # 核心算法模块
│   │   │   ├── SpacedRepetition.ts       # 间隔重复算法
│   │   │   ├── SpacedRepetition.test.ts  # 算法单元测试
│   │   │   └── constants.ts              # 算法常量
│   │   │
│   │   ├── services/               # 业务逻辑服务层
│   │   │   ├── KnowledgeService.ts       # 知识点业务逻辑
│   │   │   ├── ReviewService.ts          # 复习业务逻辑
│   │   │   ├── DiaryService.ts           # 日记业务逻辑
│   │   │   ├── ReminderService.ts        # 提醒业务逻辑
│   │   │   ├── StatisticsService.ts      # 统计业务逻辑
│   │   │   ├── BackupService.ts          # 备份服务
│   │   │   └── index.ts
│   │   │
│   │   ├── ipc/                    # IPC 处理器
│   │   │   ├── knowledgeHandlers.ts
│   │   │   ├── reviewHandlers.ts
│   │   │   ├── diaryHandlers.ts
│   │   │   ├── reminderHandlers.ts
│   │   │   ├── settingsHandlers.ts
│   │   │   ├── statisticsHandlers.ts
│   │   │   └── index.ts            # 注册所有 handlers
│   │   │
│   │   ├── windows/                # 窗口管理
│   │   │   ├── MainWindow.ts       # 主窗口类
│   │   │   ├── QuickCaptureWindow.ts  # 快速记录窗口
│   │   │   └── WindowManager.ts    # 窗口管理器
│   │   │
│   │   ├── system/                 # 系统集成
│   │   │   ├── tray.ts             # 系统托盘
│   │   │   ├── globalShortcut.ts   # 全局快捷键
│   │   │   ├── notification.ts     # 系统通知
│   │   │   └── autoLaunch.ts       # 开机自启
│   │   │
│   │   └── utils/                  # 工具函数
│   │       ├── logger.ts           # 日志工具
│   │       ├── pathHelper.ts       # 路径处理（跨平台）
│   │       ├── errors.ts           # 错误类定义
│   │       └── scheduler.ts        # 定时任务（备份、提醒）
│   │
│   ├── preload/                    # 预加载脚本
│   │   ├── index.ts                # Context Bridge 定义
│   │   └── index.d.ts              # IPC API 类型定义
│   │
│   ├── renderer/                   # 渲染进程（React 应用）
│   │   ├── index.html              # HTML 入口
│   │   │
│   │   └── src/
│   │       ├── main.tsx            # React 入口
│   │       ├── App.tsx             # 根组件
│   │       │
│   │       ├── components/         # 共享组件
│   │       │   ├── atoms/          # 原子组件
│   │       │   │   ├── Button/
│   │       │   │   ├── Input/
│   │       │   │   └── Icon/
│   │       │   ├── molecules/      # 分子组件
│   │       │   │   ├── SearchBar/
│   │       │   │   ├── RatingEmoji/
│   │       │   │   └── TagSelector/
│   │       │   └── organisms/      # 有机组件
│   │       │       ├── KnowledgeCard/
│   │       │       ├── CalendarMonth/
│   │       │       └── NavigationSidebar/
│   │       │
│   │       ├── features/           # 功能模块
│   │       │   ├── calendar/       # 日历模块
│   │       │   │   ├── CalendarView.tsx
│   │       │   │   ├── HeatmapCalendar.tsx
│   │       │   │   ├── MonthView.tsx
│   │       │   │   ├── WeekView.tsx
│   │       │   │   ├── YearView.tsx
│   │       │   │   ├── DateDetailDrawer.tsx
│   │       │   │   ├── hooks/
│   │       │   │   │   ├── useCalendarData.ts
│   │       │   │   │   └── useHeatmap.ts
│   │       │   │   └── utils/
│   │       │   │       └── heatmapCalculator.ts
│   │       │   │
│   │       │   ├── knowledge/      # 知识点管理模块
│   │       │   │   ├── KnowledgeListView.tsx
│   │       │   │   ├── KnowledgeEditor.tsx
│   │       │   │   ├── QuickCaptureModal.tsx
│   │       │   │   ├── KnowledgeDetail.tsx
│   │       │   │   ├── KnowledgeSearch.tsx
│   │       │   │   ├── hooks/
│   │       │   │   │   ├── useKnowledge.ts
│   │       │   │   │   └── useKnowledgeList.ts
│   │       │   │   └── components/
│   │       │   │       ├── KnowledgeCard.tsx
│   │       │   │       └── TagList.tsx
│   │       │   │
│   │       │   ├── review/         # 复习模块
│   │       │   │   ├── ReviewView.tsx
│   │       │   │   ├── ReviewCard.tsx
│   │       │   │   ├── RatingSelector.tsx
│   │       │   │   ├── ReviewProgress.tsx
│   │       │   │   ├── ReviewComplete.tsx
│   │       │   │   └── hooks/
│   │       │   │       └── useReview.ts
│   │       │   │
│   │       │   ├── diary/          # 日记模块
│   │       │   │   ├── DiaryView.tsx
│   │       │   │   ├── DiaryEditor.tsx
│   │       │   │   ├── DiaryList.tsx
│   │       │   │   └── hooks/
│   │       │   │       └── useDiary.ts
│   │       │   │
│   │       │   ├── reminder/       # 提醒模块
│   │       │   │   ├── ReminderView.tsx
│   │       │   │   ├── ReminderEditor.tsx
│   │       │   │   ├── ReminderList.tsx
│   │       │   │   └── hooks/
│   │       │   │       └── useReminder.ts
│   │       │   │
│   │       │   └── statistics/     # 统计模块
│   │       │       ├── StatisticsView.tsx
│   │       │       ├── DailySummary.tsx
│   │       │       ├── TrendChart.tsx
│   │       │       └── hooks/
│   │       │           └── useStatistics.ts
│   │       │
│   │       ├── layouts/            # 布局组件
│   │       │   ├── MainLayout.tsx
│   │       │   └── EmptyLayout.tsx
│   │       │
│   │       ├── stores/             # Zustand 状态管理
│   │       │   ├── knowledgeStore.ts
│   │       │   ├── reviewStore.ts
│   │       │   ├── diaryStore.ts
│   │       │   ├── reminderStore.ts
│   │       │   ├── settingsStore.ts
│   │       │   ├── cacheStore.ts
│   │       │   └── uiStore.ts      # UI 状态（侧边栏、主题等）
│   │       │
│   │       ├── hooks/              # 共享 Hooks
│   │       │   ├── useKnowledge.ts
│   │       │   ├── useReview.ts
│   │       │   ├── useCalendar.ts
│   │       │   ├── useLocalStorage.ts
│   │       │   └── useShortcut.ts
│   │       │
│   │       ├── utils/              # 工具函数
│   │       │   ├── dateFormatter.ts
│   │       │   ├── colorUtils.ts
│   │       │   ├── validators.ts
│   │       │   └── constants.ts
│   │       │
│   │       ├── types/              # TypeScript 类型
│   │       │   └── index.ts
│   │       │
│   │       ├── styles/             # 全局样式
│   │       │   ├── global.css
│   │       │   ├── antd-theme.ts   # Ant Design 主题配置
│   │       │   └── variables.css   # CSS 变量
│   │       │
│   │       └── assets/             # 静态资源
│   │           ├── images/
│   │           ├── icons/
│   │           └── fonts/
│   │
│   └── shared/                     # 主进程和渲染进程共享
│       └── types/                  # 共享类型定义
│           ├── knowledge.types.ts
│           ├── review.types.ts
│           ├── diary.types.ts
│           ├── reminder.types.ts
│           ├── settings.types.ts
│           ├── common.types.ts
│           └── index.ts
│
├── out/                            # 构建输出（.gitignore）
│   ├── main/
│   ├── preload/
│   └── renderer/
│
├── dist/                           # 打包输出（.gitignore）
│   ├── win-unpacked/
│   ├── mac/
│   └── MindReminder-Setup.exe
│
├── node_modules/                   # 依赖（.gitignore）
│
├── .eslintrc.json                  # ESLint 配置
├── .prettierrc                     # Prettier 配置
├── .gitignore                      # Git 忽略文件
├── electron.vite.config.ts         # electron-vite 配置
├── electron-builder.yml            # Electron Builder 配置
├── package.json                    # 项目依赖和脚本
├── pnpm-lock.yaml                  # pnpm 锁文件
├── tsconfig.json                   # TypeScript 配置（渲染进程）
├── tsconfig.node.json              # TypeScript 配置（主进程）
├── tsconfig.web.json               # TypeScript 配置（预加载）
└── README.md                       # 项目说明
```

---

### 架构边界定义

#### 1. 进程边界

**主进程（Main Process）职责：**

- 应用生命周期管理（启动、退出）
- 窗口创建和管理
- SQLite 数据库访问
- 文件系统操作
- 系统集成（托盘、快捷键、通知）
- 核心算法实现
- 定时任务（备份、复习提醒）

**渲染进程（Renderer Process）职责：**

- React UI 渲染
- 用户交互处理
- 状态管理（Zustand）
- UI 计算和缓存（热力图颜色）
- 数据展示和可视化

**预加载脚本（Preload Script）职责：**

- Context Bridge API 定义
- IPC 通信桥接
- 类型安全的 API 暴露

**通信规则：**

- ✅ 渲染进程**只能**通过 `window.api` 访问主进程
- ✅ 主进程通过 `webContents.send` 推送事件到渲染进程
- ❌ 渲染进程**不能**直接访问 Node.js API
- ❌ 渲染进程**不能**直接操作文件系统或数据库

#### 2. 数据访问边界

**数据流向：**

```
渲染进程 UI
    ↓ window.api.knowledge.create(data)
预加载脚本 Context Bridge
    ↓ ipcRenderer.invoke('knowledge:create', data)
主进程 IPC Handler
    ↓ knowledgeService.create(data)
Service 层
    ↓ knowledgeRepository.save(knowledge)
Repository 层
    ↓ db.prepare('INSERT INTO knowledge...').run()
SQLite 数据库
```

**边界规则：**

- ✅ 渲染进程**只能**通过 IPC 访问数据
- ✅ Service 层**只能**通过 Repository 访问数据库
- ✅ Repository 层负责 SQL 操作和命名转换
- ❌ Service 层**不能**直接写 SQL
- ❌ IPC Handler **不能**直接操作数据库

#### 3. 模块边界

**知识点模块（Knowledge Module）：**

- **主进程**：`src/main/database/repositories/KnowledgeRepository.ts`
- **主进程**：`src/main/services/KnowledgeService.ts`
- **主进程**：`src/main/ipc/knowledgeHandlers.ts`
- **渲染进程**：`src/renderer/src/features/knowledge/`
- **渲染进程**：`src/renderer/src/stores/knowledgeStore.ts`
- **共享**：`src/shared/types/knowledge.types.ts`

**复习模块（Review Module）：**

- **主进程**：`src/main/algorithm/SpacedRepetition.ts`（核心算法）
- **主进程**：`src/main/database/repositories/ReviewRepository.ts`
- **主进程**：`src/main/services/ReviewService.ts`
- **主进程**：`src/main/ipc/reviewHandlers.ts`
- **渲染进程**：`src/renderer/src/features/review/`
- **渲染进程**：`src/renderer/src/stores/reviewStore.ts`
- **共享**：`src/shared/types/review.types.ts`

**日历模块（Calendar Module）：**

- **主进程**：`src/main/services/StatisticsService.ts`（数据聚合）
- **渲染进程**：`src/renderer/src/features/calendar/`（UI 主导）
- **渲染进程**：`src/renderer/src/stores/cacheStore.ts`（热力图缓存）

**日记模块（Diary Module）：**

- **主进程**：`src/main/database/repositories/DiaryRepository.ts`
- **主进程**：`src/main/services/DiaryService.ts`
- **渲染进程**：`src/renderer/src/features/diary/`
- **渲染进程**：`src/renderer/src/stores/diaryStore.ts`

**提醒模块（Reminder Module）：**

- **主进程**：`src/main/database/repositories/ReminderRepository.ts`
- **主进程**：`src/main/services/ReminderService.ts`
- **主进程**：`src/main/system/notification.ts`（推送通知）
- **渲染进程**：`src/renderer/src/features/reminder/`
- **渲染进程**：`src/renderer/src/stores/reminderStore.ts`

---

### 功能需求到结构映射

#### FR1-FR9: 知识点管理

**映射到：**

- **数据库表**：`knowledge`
- **Repository**：`KnowledgeRepository.ts`
- **Service**：`KnowledgeService.ts`
- **IPC**：`knowledgeHandlers.ts` → `knowledge:*` 通道
- **UI 组件**：`features/knowledge/`
- **Store**：`knowledgeStore.ts`

**关键文件：**

- `KnowledgeRepository.ts`: findAll, findById, save, update, delete
- `KnowledgeEditor.tsx`: 编辑表单
- `QuickCaptureModal.tsx`: 快速记录（FR1）
- `KnowledgeDetail.tsx`: 查看详情（FR6-FR8）

#### FR10-FR18: 复习系统

**映射到：**

- **核心算法**：`algorithm/SpacedRepetition.ts`
- **数据库表**：`review_history`
- **Repository**：`ReviewRepository.ts`
- **Service**：`ReviewService.ts`
- **IPC**：`reviewHandlers.ts` → `review:*` 通道
- **UI 组件**：`features/review/`
- **Store**：`reviewStore.ts`

**关键文件：**

- `SpacedRepetition.ts`: 算法实现（FR10, FR13）
- `SpacedRepetition.test.ts`: 算法测试（保证准确性）
- `ReviewView.tsx`: 复习界面（FR11）
- `RatingSelector.tsx`: 评分组件（FR12）
- `ReviewService.ts`: 记忆标准判断（FR15-FR16）

#### FR19-FR26: 日历与可视化

**映射到：**

- **UI 组件**：`features/calendar/`
- **计算工具**：`utils/heatmapCalculator.ts`
- **Store**：`cacheStore.ts`（热力图缓存）

**关键文件：**

- `HeatmapCalendar.tsx`: 热力图日历（FR19-FR20）
- `MonthView.tsx`: 月视图
- `WeekView.tsx`: 周视图
- `YearView.tsx`: 年视图
- `DateDetailDrawer.tsx`: 日期详情（FR22）
- `heatmapCalculator.ts`: 颜色计算（FR24）

#### FR27-FR32: 日记管理

**映射到：**

- **数据库表**：`diary`
- **Repository**：`DiaryRepository.ts`
- **Service**：`DiaryService.ts`
- **UI 组件**：`features/diary/`
- **Store**：`diaryStore.ts`

#### FR33-FR39: 提醒事项管理

**映射到：**

- **数据库表**：`reminder`
- **Repository**：`ReminderRepository.ts`
- **Service**：`ReminderService.ts`
- **系统集成**：`system/notification.ts`
- **定时任务**：`utils/scheduler.ts`
- **UI 组件**：`features/reminder/`
- **Store**：`reminderStore.ts`

#### FR40-FR43: 搜索与筛选

**映射到：**

- **Service**：`KnowledgeService.ts`（搜索逻辑）
- **UI 组件**：`knowledge/KnowledgeSearch.tsx`
- **工具函数**：`utils/searchUtils.ts`（中文分词可选）

#### FR44-FR49: 统计与分析

**映射到：**

- **Service**：`StatisticsService.ts`（数据聚合）
- **UI 组件**：`features/statistics/`
- **Store**：`cacheStore.ts`（统计缓存）

#### FR50-FR56: 数据管理

**映射到：**

- **数据库**：`database/connection.ts`, `database/init.ts`
- **备份服务**：`services/BackupService.ts`
- **导出功能**：`services/ExportService.ts`
- **迁移**：`database/migrations/`

#### FR57-FR64: 系统集成

**映射到：**

- **系统模块**：`system/`
  - `tray.ts`: 系统托盘（FR57-FR58）
  - `globalShortcut.ts`: 全局快捷键（FR59-FR60）
  - `notification.ts`: 桌面通知（FR61-FR62）
  - `autoLaunch.ts`: 开机自启（FR63）
- **窗口管理**：`windows/`
  - `MainWindow.ts`: 主窗口（FR64）
  - `QuickCaptureWindow.ts`: 快速记录窗口

#### FR65-FR72: 用户设置

**映射到：**

- **数据库表**：`settings`
- **Repository**：`SettingsRepository.ts`
- **Service**：`SettingsService.ts`
- **UI 组件**：`features/settings/`
- **Store**：`settingsStore.ts`

---

### 集成点定义

#### IPC 通信接口

**知识点 API：**

```typescript
window.api.knowledge = {
  getAll: () => Promise<{ data: Knowledge[] }>
  getById: (id: string) => Promise<{ data: Knowledge }>
  create: (data: CreateKnowledgeDTO) => Promise<{ data: Knowledge }>
  update: (id: string, data: UpdateKnowledgeDTO) => Promise<{ data: Knowledge }>
  delete: (id: string) => Promise<{ data: void }>
  search: (query: string) => Promise<{ data: Knowledge[] }>
  getByStatus: (status: MasteryStatus) => Promise<{ data: Knowledge[] }>
}
```

**复习 API：**

```typescript
window.api.review = {
  getTodayReviews: () => Promise<{ data: Knowledge[] }>
  submitRating: (knowledgeId: string, rating: number) => Promise<{ data: ReviewResult }>
  getReviewHistory: (knowledgeId: string) => Promise<{ data: ReviewHistory[] }>
  calculateNextReview: (params: ReviewParams) => Promise<{ data: number }>
}
```

**日历 API：**

```typescript
window.api.calendar = {
  getDayActivity: (date: string) => Promise<{ data: DayActivity }>
  getMonthActivity: (year: number, month: number) => Promise<{ data: MonthActivity }>
  getYearActivity: (year: number) => Promise<{ data: YearActivity }>
}
```

**统计 API：**

```typescript
window.api.statistics = {
  getDailySummary: () => Promise<{ data: DailySummary }>
  getOverallStats: () => Promise<{ data: OverallStats }>
  getStreak: () => Promise<{ data: number }>
}
```

**设置 API：**

```typescript
window.api.settings = {
  get: (key: string) => Promise<{ data: any }>
  set: (key: string, value: any) => Promise<{ data: void }>
  getAll: () => Promise<{ data: Record<string, any> }>
}
```

**系统 API：**

```typescript
window.api.system = {
  showNotification: (options: NotificationOptions) => void
  openExternal: (url: string) => void
  exportData: (format: 'json' | 'csv') => Promise<{ data: string }>
  importData: (filePath: string) => Promise<{ data: ImportResult }>
}
```

#### 事件通信（主进程 → 渲染进程）

**事件命名格式：** `{模块}:{事件}`

```typescript
// 主进程推送事件
webContents.send('knowledge:created', knowledge)
webContents.send('review:reminder', { count: 5 })
webContents.send('backup:completed', { timestamp })

// 渲染进程监听
window.api.on('knowledge:created', (knowledge) => {
  // 更新 UI
})
```

---

### 数据流图

#### 创建知识点流程

```
用户操作（UI）
    ↓
React 组件（KnowledgeEditor.tsx）
    ↓ 表单验证
Zustand Action（knowledgeStore.createKnowledge）
    ↓ window.api.knowledge.create(data)
IPC 调用（渲染进程 → 主进程）
    ↓ ipcRenderer.invoke('knowledge:create', data)
IPC Handler（knowledgeHandlers.ts）
    ↓ knowledgeService.create(data)
Service 层（KnowledgeService.ts）
    ↓ 业务逻辑（生成ID、时间戳）
    ↓ knowledgeRepository.save(knowledge)
Repository 层（KnowledgeRepository.ts）
    ↓ 命名转换（camelCase → snake_case）
    ↓ db.prepare('INSERT INTO...').run()
SQLite 数据库
    ↓ 插入成功，返回数据
    ↑ 返回路径
Repository → Service → IPC Handler → 渲染进程
    ↓
Store 更新
    ↓
UI 重新渲染 + 日历更新
```

#### 复习流程

```
定时器触发（主进程）
    ↓ reviewService.checkDueReviews()
    ↓ 查询今日待复习知识点
    ↓ webContents.send('review:reminder', { count })
渲染进程接收事件
    ↓ 显示 Badge 提示
用户点击开始复习
    ↓ window.api.review.getTodayReviews()
    ↓ 获取复习列表
    ↓ 显示复习卡片
用户评分（点击表情）
    ↓ window.api.review.submitRating(id, rating)
    ↓ reviewService.processRating()
    ↓ spacedRepetitionAlgorithm.calculateNextReview()
    ↓ 计算下次复习时间
    ↓ reviewRepository.saveHistory()
    ↓ knowledgeRepository.updateNextReview()
    ↓ 返回结果
Store 更新
    ↓ 移除当前知识点，显示下一个
日历更新
    ↓ 热力图颜色重新计算
```

---

### 文件组织模式

#### 配置文件组织

**根目录配置：**

- `package.json`: 依赖管理、脚本定义、Electron 入口配置
- `electron.vite.config.ts`: 构建配置（主进程/预加载/渲染进程三个独立配置）
- `electron-builder.yml`: 打包配置（Windows/macOS 安装包）
- `tsconfig.json`: 渲染进程 TS 配置
- `tsconfig.node.json`: 主进程 TS 配置
- `.eslintrc.json`: 代码检查规则
- `.prettierrc`: 代码格式化规则

#### 源码组织原则

**按功能模块组织（Features-based）：**

- ✅ 每个功能模块独立目录
- ✅ 模块内包含 UI、hooks、utils
- ✅ 模块间通过 Store 和 IPC 通信
- ✅ 共享组件提取到 `components/`

**分层架构（Layered）：**

- **主进程**: Repository → Service → IPC Handler
- **渲染进程**: API Call → Store → Component
- ✅ 单向依赖（上层依赖下层）
- ❌ 禁止循环依赖

---

### 开发工作流集成

#### 开发服务器结构

```bash
pnpm run dev
    ↓ electron-vite dev
    ↓
├── 编译主进程（src/main/ → out/main/）
├── 编译预加载（src/preload/ → out/preload/）
├── 启动渲染进程开发服务器（Vite Dev Server）
│   ↓ http://localhost:5173
│   ↓ HMR 启用
└── 启动 Electron 应用
    ↓ 主窗口加载 localhost:5173
    ↓ 主进程 Hot Reload
```

#### 构建流程结构

```bash
pnpm run build
    ↓ electron-vite build
    ↓
├── 构建主进程（TypeScript → JavaScript）
│   ↓ out/main/index.js
├── 构建预加载（TypeScript → JavaScript）
│   ↓ out/preload/index.js
└── 构建渲染进程（React → 静态文件）
    ↓ out/renderer/index.html, assets/

pnpm run dist
    ↓ electron-builder
    ↓ 读取 electron-builder.yml
    ↓
├── Windows: 生成 .exe 安装包
│   ↓ dist/MindReminder-Setup-1.0.0.exe
└── macOS: 生成 .dmg 镜像
    ↓ dist/MindReminder-1.0.0.dmg
```

---

### 跨领域关注点实现位置

**日志系统：**

- `src/main/utils/logger.ts`
- 所有模块通过 `import log from '@/utils/logger'` 使用

**错误处理：**

- `src/main/utils/errors.ts`: 错误类定义
- `src/renderer/src/components/ErrorBoundary.tsx`: React 错误边界

**类型定义：**

- `src/shared/types/`: 所有共享类型
- 主进程和渲染进程都可导入

**工具函数：**

- `src/main/utils/`: 主进程工具
- `src/renderer/src/utils/`: 渲染进程工具

**测试文件：**

- 与源文件同目录，后缀 `.test.ts`
- 测试工具：`__tests__/utils/`

---

## 架构验证结果

### 一致性验证 ✅

**决策兼容性：** ✅ 所有通过

- ✅ Electron + React + TypeScript + Vite：完全兼容，成熟组合
- ✅ better-sqlite3 在主进程：符合 Electron 架构最佳实践
- ✅ Zustand + React 18：轻量、高性能集成
- ✅ Ant Design + Vite：官方支持，无兼容性问题
- ✅ electron-log：Electron 官方推荐
- ✅ react-window：React 生态成熟方案
- ✅ 所有技术栈版本互相兼容

**模式一致性：** ✅ 所有通过

- ✅ 命名约定统一（数据库 snake_case，TypeScript camelCase）
- ✅ IPC 通道命名规范一致（`{实体}:{操作}`）
- ✅ 文件组织模式与 electron-vite 架构对齐
- ✅ 错误处理模式跨主进程/渲染进程统一
- ✅ 类型定义统一共享，避免重复
- ✅ 日志格式跨模块一致

**结构对齐：** ✅ 所有通过

- ✅ 项目结构完整支持所有架构决策
- ✅ 三层架构（Repository → Service → IPC Handler）清晰无环
- ✅ 功能模块边界明确，职责单一
- ✅ 集成点完整定义（IPC API + 事件通信）
- ✅ 跨平台结构考虑（pathHelper、平台检测）

---

### 需求覆盖验证 ✅

#### 功能需求覆盖（72个FR）：

| FR类别     | FR数量 | 架构支持 | 关键组件                                                    | 状态 |
| ---------- | ------ | -------- | ----------------------------------------------------------- | ---- |
| 知识点管理 | 9      | ✅ 完整  | KnowledgeRepository + KnowledgeService + knowledge/ feature | ✅   |
| 复习系统   | 9      | ✅ 完整  | SpacedRepetition + ReviewService + review/ feature          | ✅   |
| 日历可视化 | 8      | ✅ 完整  | calendar/ feature + heatmapCalculator + cacheStore          | ✅   |
| 日记管理   | 6      | ✅ 完整  | DiaryRepository + DiaryService + diary/ feature             | ✅   |
| 提醒事项   | 7      | ✅ 完整  | ReminderRepository + notification + scheduler               | ✅   |
| 搜索筛选   | 4      | ✅ 完整  | KnowledgeService.search + KnowledgeSearch.tsx               | ✅   |
| 统计分析   | 6      | ✅ 完整  | StatisticsService + statistics/ feature                     | ✅   |
| 数据管理   | 7      | ✅ 完整  | BackupService + migrations/ + ExportService                 | ✅   |
| 系统集成   | 8      | ✅ 完整  | system/ (tray, shortcut, notification, autoLaunch)          | ✅   |
| 用户设置   | 8      | ✅ 完整  | SettingsRepository + settingsStore                          | ✅   |

**总计：72个FR，100%架构支持覆盖**

#### 非功能需求覆盖：

| NFR类别      | 要求            | 架构解决方案                                  | 状态 |
| ------------ | --------------- | --------------------------------------------- | ---- |
| **性能**     | 冷启动≤3s       | 代码分割(React.lazy) + 懒加载 + 优化打包      | ✅   |
| **性能**     | UI响应≤200ms    | React.memo + useMemo + 虚拟滚动(react-window) | ✅   |
| **性能**     | 支持1000+知识点 | 虚拟滚动 + 索引优化 + 查询缓存                | ✅   |
| **可靠性**   | 零数据丢失      | SQLite事务 + 自动备份 + 崩溃恢复              | ✅   |
| **可靠性**   | 算法100%准确    | 单元测试100%覆盖 + 算法验证                   | ✅   |
| **隐私**     | 完全本地        | 无网络请求 + 本地SQLite + 数据掌控            | ✅   |
| **可用性**   | 5分钟上手       | Starter template + Ant Design + 智能默认值    | ✅   |
| **兼容性**   | Win+Mac跨平台   | Electron + pathHelper + 平台特定代码隔离      | ✅   |
| **可维护性** | 模块化扩展      | Repository模式 + 功能模块化 + 云同步预留      | ✅   |

**总计：所有关键NFR，100%架构支持**

---

### 实施准备度验证 ✅

#### 决策完整性检查：

**✅ 技术栈决策（9/9 完成）：**

- ✅ 应用框架：Electron (latest stable)
- ✅ 前端框架：React 18 + TypeScript 5+
- ✅ 构建工具：Vite 5+ (electron-vite v5.0.0)
- ✅ 状态管理：Zustand
- ✅ UI 组件库：Ant Design
- ✅ 数据库：SQLite (better-sqlite3)
- ✅ 包管理器：pnpm
- ✅ 日志系统：electron-log
- ✅ 虚拟滚动：react-window

**✅ 架构模式决策（5/5 完成）：**

- ✅ 数据访问：Repository 模式
- ✅ 进程架构：主进程（业务+数据）+ 渲染进程（UI）
- ✅ 通信模式：IPC (Context Bridge)
- ✅ 路由策略：单页面 + Tab切换
- ✅ 组件组织：Atomic Design + Feature模块化

#### 结构完整性检查：

**✅ 目录结构（完整）：**

- ✅ 完整目录树（包含所有文件和目录）
- ✅ 72个FR到具体文件的明确映射
- ✅ IPC 接口完整定义（6大API组）
- ✅ 数据流图清晰（创建 + 复习流程）
- ✅ 模块边界明确（5大功能模块）

**✅ 类型定义（完整）：**

- ✅ 共享类型组织（src/shared/types/）
- ✅ IPC API 类型安全（preload/index.d.ts）
- ✅ 数据库模型类型
- ✅ DTO 类型定义

#### 模式完整性检查：

**✅ 一致性规则（32个冲突点解决）：**

- ✅ 命名模式：数据库、IPC、代码文件（3个类别，15条规则）
- ✅ 结构模式：项目组织、测试位置（4条规则）
- ✅ 数据格式：IPC响应、日期时间、布尔值（6条规则）
- ✅ 状态管理：Store组织、异步状态（4条规则）
- ✅ 错误处理：错误类型、处理流程、边界（3条规则）
- ✅ 日志模式：级别使用、格式规范（2条规则）
- ✅ 8条强制执行规则
- ✅ 4类反模式警告
- ✅ 10项执行检查清单

---

### 差距分析结果

#### ✅ 无关键差距

所有 MVP 实施所需的架构元素均已完整定义。

#### 建议的未来增强（Post-MVP）：

**📝 可选的技术增强：**

1. **E2E 测试框架**
   - 建议：Playwright（更现代）或 Spectron（Electron专用）
   - 时机：MVP 验证通过后
   - 优先级：中

2. **性能监控**
   - 建议：Electron DevTools 集成
   - 指标：启动时间、内存占用、渲染性能
   - 时机：性能优化阶段
   - 优先级：低

3. **国际化（i18n）**
   - 建议：react-i18next
   - 时机：用户群扩展到海外时
   - 优先级：低

4. **组件文档**
   - 建议：Storybook（可选）
   - 时机：团队扩展或开源时
   - 优先级：低

这些可以在 MVP 完成并验证成功后，根据实际需求和资源情况添加。

---

### 架构完整性检查清单

#### ✅ 需求分析（Step 1-2）

- [x] 项目上下文深入分析
- [x] 规模与复杂度准确评估（中等）
- [x] 技术约束和依赖明确识别
- [x] 跨领域关注点完整映射（6个关注点）
- [x] 独特架构挑战清晰定义（5个挑战）

#### ✅ 技术选型（Step 3）

- [x] Starter template 评估和选择（electron-vite）
- [x] 技术偏好确认（TypeScript, Vite, pnpm）
- [x] 所有依赖清单完整
- [x] 初始化命令明确可执行
- [x] 项目初始化步骤定义

#### ✅ 架构决策（Step 4）

- [x] 数据架构决策（Repository 模式，5个表，迁移策略）
- [x] 核心算法实现位置（主进程）
- [x] 前端架构细节（无路由，Feature模块化，react-window）
- [x] 开发运维决策（electron-log, Vitest）
- [x] 性能优化策略（启动、渲染、查询）
- [x] 实施顺序和依赖关系

#### ✅ 实施模式（Step 5）

- [x] 命名模式完整（数据库、IPC、代码）
- [x] 结构模式清晰（目录组织、文件位置）
- [x] 数据格式统一（IPC、日期、布尔值）
- [x] 状态管理模式（Zustand使用规范）
- [x] 错误处理完整（错误类、流程、边界）
- [x] 日志规范（级别、格式）
- [x] TypeScript 类型定义规范
- [x] 8条强制执行规则
- [x] 反模式警告（4类）
- [x] 执行检查清单（10项）

#### ✅ 项目结构（Step 6）

- [x] 完整目录树（包含所有文件）
- [x] 架构边界清晰（进程、数据访问、模块）
- [x] 72个FR到文件的完整映射
- [x] IPC 接口完整定义（6大API组）
- [x] 数据流图（创建流程、复习流程）
- [x] 集成点和通信模式
- [x] 开发工作流集成

#### ✅ 验证检查（Step 7）

- [x] 一致性验证完成
- [x] 需求覆盖100%验证
- [x] 实施准备度确认
- [x] 差距分析完成
- [x] 完整性检查清单

---

### 架构就绪评估

**整体状态：** ✅ **已准备好进入实施阶段**

**信心水平：** 🎯 **高**

**理由：**

1. 所有72个功能需求都有明确的架构支持和实施路径
2. 所有关键NFR都有对应的技术方案
3. 技术栈成熟稳定，新手友好
4. 实施模式详尽，避免AI代理冲突
5. 项目结构完整，边界清晰
6. 无关键差距或阻塞问题

**架构优势：**

1. **新手友好** ✅
   - electron-vite 开箱即用
   - Ant Design 降低UI开发门槛
   - Zustand API简单直观
   - 完整的TypeScript类型支持

2. **性能优秀** ✅
   - 虚拟滚动处理大数据
   - React.memo 和 useMemo 优化
   - SQLite 索引和查询优化
   - Vite 极速构建

3. **可靠性强** ✅
   - Repository 模式数据访问控制
   - SQLite 事务保证一致性
   - 自动备份和崩溃恢复
   - 完整的错误处理

4. **易维护** ✅
   - 模块化功能组织
   - 清晰的分层架构
   - 统一的实施模式
   - 完整的类型定义

5. **可扩展** ✅
   - 数据模型预留云同步字段
   - 模块化数据访问层
   - 功能模块独立
   - 为阶段2-3预留接口

**未来增强领域（非阻塞）：**

1. **测试覆盖增强**
   - 当前：单元测试（核心算法、Repository）
   - 未来：E2E 测试（Playwright）
   - 时机：MVP 验证后

2. **性能监控**
   - 当前：手动性能测试
   - 未来：集成性能监控工具
   - 时机：性能优化阶段

3. **国际化支持**
   - 当前：中文界面
   - 未来：多语言支持（react-i18next）
   - 时机：用户群扩展时

4. **云同步架构**
   - 当前：完全本地存储
   - 未来：云同步（阶段2）
   - 时机：MVP 成功后6-12个月

---

### 实施移交指南

#### AI 代理必须遵循的规则：

**🔴 强制执行（Mandatory）：**

1. ✅ **严格遵循所有命名约定**
   - 数据库：snake_case
   - TypeScript：camelCase（变量/函数），PascalCase（类型/组件）
   - IPC 通道：`{实体}:{操作}`
   - 文件：PascalCase（组件），camelCase（其他）

2. ✅ **遵循项目结构**
   - 不得创建文档未定义的顶层目录
   - 新文件必须放在规定的模块目录中
   - 共享代码放在 shared/ 目录

3. ✅ **TypeScript 严格模式**
   - 禁用 `any`，使用 `unknown` 替代
   - 所有公共API必须有类型定义
   - 启用 strictNullChecks

4. ✅ **完整的错误处理**
   - 所有 async 函数使用 try-catch
   - IPC 调用必须捕获错误
   - 显示用户友好错误消息

5. ✅ **数据库操作规范**
   - 写操作必须使用事务
   - 查询必须参数化（防注入）
   - Repository 层负责命名转换

6. ✅ **日志记录规范**
   - CRUD 操作记录 info
   - 错误记录 error
   - 使用结构化日志

7. ✅ **性能优化规范**
   - 列表>50项使用虚拟滚动
   - 计算密集用 useMemo
   - 组件用 React.memo

8. ✅ **测试覆盖要求**
   - 复习算法：100%
   - Repository：>80%
   - 工具函数：>80%

**🟡 强烈推荐（Highly Recommended）：**

- 使用 ESLint 和 Prettier
- 编写清晰的代码注释
- 组件拆分保持单一职责
- Git 提交信息规范

**参考本文档：**

- 架构决策（技术选型）
- 实施模式（命名、格式）
- 项目结构（文件位置）
- 数据流图（业务流程）

---

### 第一个实施步骤

#### Story 0: 项目初始化（必须首先完成）

**目标：** 创建项目骨架，验证开发环境

**步骤：**

1. **创建项目**

```bash
pnpm create @quick-start/electron@latest MindReminder -- --template react-ts
cd MindReminder
```

2. **安装额外依赖**

```bash
# UI 组件库
pnpm add antd @ant-design/icons

# 状态管理
pnpm add zustand

# 数据库
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3

# 工具库
pnpm add dayjs uuid
pnpm add -D @types/uuid

# 虚拟滚动
pnpm add react-window
pnpm add -D @types/react-window

# 日志
pnpm add electron-log

# 测试
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

3. **配置 TypeScript 路径别名**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/src/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

4. **创建基础目录结构**

```bash
# 主进程目录
mkdir -p src/main/{database/{repositories,migrations},algorithm,services,ipc,windows,system,utils}

# 渲染进程目录
mkdir -p src/renderer/src/{components/{atoms,molecules,organisms},features/{calendar,knowledge,review,diary,reminder,statistics},layouts,stores,hooks,utils,types,styles}

# 共享目录
mkdir -p src/shared/types
```

5. **配置 Ant Design 主题**

```typescript
// src/renderer/src/styles/antd-theme.ts
import type { ThemeConfig } from 'antd'

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#fa8c16',
    borderRadius: 4
  }
}

export const darkTheme: ThemeConfig = {
  token: {
    ...lightTheme.token,
    colorPrimary: '#40a9ff'
  }
}
```

6. **验证开发环境**

```bash
pnpm run dev  # 应该成功启动
```

7. **验证构建**

```bash
pnpm run build  # 应该成功构建
```

**验收标准：**

- ✅ 项目创建成功
- ✅ 所有依赖安装完成
- ✅ 开发服务器能启动
- ✅ 构建流程能成功
- ✅ Electron 应用能打开窗口
- ✅ React HMR 正常工作

**预计时间：** 30分钟 - 1小时

---

### 后续实施优先级

**Phase 1: 数据层基础（最高优先级）**

1. 数据库表结构实现
2. Repository 层实现
3. IPC 接口基础搭建
4. 基础类型定义

**Phase 2: 核心算法** 5. 间隔重复算法实现 6. 算法单元测试 7. ReviewService 实现

**Phase 3: 核心功能** 8. 知识点 CRUD 9. 复习流程 10. 日历基础视图

**Phase 4: UI 优化与完善** 11. Ant Design 主题配置 12. 热力图和动画 13. 日记和提醒功能 14. 统计和设置

---

## 🎉 架构文档已完成！

**文档完整性：** 100%

MindReminder 的架构决策文档已经全部完成，包含：

✅ **项目上下文分析** - 72个FR、关键NFR、架构挑战  
✅ **Starter Template 评估** - electron-vite 选择和配置  
✅ **核心架构决策** - 数据架构、算法实现、前端架构、开发运维  
✅ **实施模式** - 32个冲突点解决，命名/结构/格式/状态管理规范  
✅ **项目结构** - 完整目录树、FR映射、IPC接口、数据流图  
✅ **架构验证** - 一致性、覆盖率、准备度、差距分析

**状态：已准备好进入开发实施！** 🚀

AI 代理现在可以基于这份架构文档，实施所有功能需求，并确保代码一致性和兼容性。

**下一步：** 开始执行 Story 0（项目初始化），然后按照实施优先级逐步开发功能。

---

## 架构完成总结

### 工作流完成状态

**架构决策工作流：** ✅ **已完成**  
**完成步骤总数：** 8  
**完成日期：** 2025-12-13  
**文档位置：** `docs/architecture.md`

---

### 最终架构交付成果

#### 📋 完整架构决策文档

我们共同创建了一份全面的架构文档，包含：

**✅ 项目上下文分析**

- 72个功能需求的详细分类和分析
- 关键非功能需求（性能、可靠性、隐私、兼容性）
- 5个独特架构挑战的识别
- 6个跨领域关注点的映射

**✅ Starter Template 评估**

- electron-vite v5.0.0 的选择和理由
- 完整的初始化命令和配置
- 额外依赖清单（Ant Design、Zustand、better-sqlite3等）
- 架构约束和最佳实践

**✅ 核心架构决策**

- 数据架构（Repository模式、5个数据库表、迁移策略）
- 核心算法实现（主进程）
- 前端架构（无路由、Feature模块化、react-window）
- 开发运维（electron-log、Vitest、性能优化）
- 实施顺序和依赖关系

**✅ 实施模式与一致性规则**

- 32个潜在冲突点的解决方案
- 命名模式（数据库、IPC、代码）
- 结构模式（目录组织、测试文件）
- 数据格式（IPC、日期、布尔值、JSON）
- 状态管理模式（Zustand规范）
- 错误处理和日志规范
- 8条强制执行规则 + 反模式警告

**✅ 项目结构与边界**

- 完整目录树（包含所有文件和目录）
- 清晰的架构边界（进程、数据访问、模块）
- 72个FR到具体文件的完整映射
- 6大IPC API组的接口定义
- 2个关键业务流程的数据流图

**✅ 架构验证结果**

- 一致性验证：100% 通过
- 需求覆盖：72个FR + 所有NFR，100%覆盖
- 实施准备度：高信心水平
- 差距分析：无关键差距

---

### 🏗️ 实施准备就绪

**架构决策数量：** 25个关键决策  
**实施模式数量：** 32个一致性规则  
**架构组件数量：** 12个核心模块  
**需求支持率：** 72/72 (100%)

**质量保证：**

- ✅ 所有技术选型均验证版本兼容性
- ✅ 所有决策都有明确理由和权衡分析
- ✅ 实施模式详尽，确保AI代理一致性
- ✅ 项目结构完整，边界清晰
- ✅ 需求到架构的映射100%覆盖

---

### 📚 AI 代理实施指南

**致所有 AI 代理：**

这份架构文档是实施 MindReminder 项目的**完整指南**。在编写任何代码之前，请：

1. ✅ 仔细阅读本架构文档
2. ✅ 严格遵循所有架构决策
3. ✅ 遵守所有实施模式和命名约定
4. ✅ 按照定义的项目结构组织代码
5. ✅ 使用文档中定义的 IPC 接口
6. ✅ 遵循错误处理和日志规范
7. ✅ 执行反模式检查清单
8. ✅ 编写必要的单元测试

**强制执行的8条核心规则（见"实施强制规则"章节）必须100%遵守。**

---

### 🚀 第一个实施步骤

**Story 0: 项目初始化**

请执行以下命令创建项目骨架：

```bash
# 1. 创建项目
pnpm create @quick-start/electron@latest MindReminder -- --template react-ts

# 2. 进入项目
cd MindReminder

# 3. 安装依赖
pnpm install

# 4. 安装额外依赖
pnpm add antd @ant-design/icons zustand better-sqlite3 dayjs uuid react-window electron-log
pnpm add -D @types/better-sqlite3 @types/uuid @types/react-window vitest @testing-library/react @testing-library/jest-dom

# 5. 启动开发服务器验证
pnpm run dev
```

详细步骤请参考"第一个实施步骤"章节。

---

### 开发工作流程

**AI 代理将：**

1. 在实施每个 Story 前阅读本架构文档
2. 严格遵循技术选型和模式
3. 使用定义的项目结构
4. 保持所有组件的一致性
5. 参考 IPC 接口和数据流图
6. 执行测试覆盖要求

**质量保证机制：**

- 架构文档包含明确的技术版本
- 实施模式防止AI代理冲突
- 清晰的项目结构和边界
- 完整的需求支持验证

---

## 🎉 恭喜！MindReminder 架构设计已全部完成！

**架构状态：** ✅ **已准备好进入实施阶段**

**下一阶段：** 开始基于架构决策和模式的开发实施

**文档维护：** 实施过程中如有重大技术决策变更，请更新本架构文档
