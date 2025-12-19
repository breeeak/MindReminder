# MindReminder

<div align="center">

![MindReminder Logo](resources/icon.png)

**基于间隔重复算法的智能复习桌面应用**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-39.2-brightgreen.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)

[English](./README_EN.md) | 简体中文

</div>

---

## 📖 项目简介

MindReminder 是一款专为自主学习者设计的桌面应用程序，通过科学的**间隔重复算法**（Spaced Repetition）帮助用户高效记忆和复习知识。应用采用本地数据存储，确保用户对数据的完全掌控权和隐私保护。

### 🎯 核心问题

知识学习者普遍面临"**学了就忘**"的痛点。虽然间隔重复被科学证明能有效对抗遗忘曲线，但市面上缺少真正适合个人学习节奏的桌面工具。现有工具复习频率固定，无法根据个人情况灵活调整。

### 💡 解决方案

MindReminder 通过以下独特功能解决上述痛点：

- **🔧 高度可定制的复习算法** - 支持全局和单点复习频率系数调整（0.5x-1.5x）
- **📅 日历式可视化界面** - 直观展示学习轨迹和复习计划
- **😊 人性化自评系统** - 使用表情符号（😟→🎯）替代传统数字评分
- **📊 预测性记忆进度** - 告诉你何时能真正掌握知识点
- **🗂️ 三合一管理** - 整合知识点、日记、提醒事项
- **🔒 完全本地存储** - 100%数据掌控权，无需联网

---

## ✨ 核心特性

### 📚 智能知识管理

- **问题式记录** - 以问题形式组织知识点，符合主动学习原理
- **标签分类** - 灵活的标签和分类系统
- **强大搜索** - 快速查找和筛选知识点
- **复习历史** - 完整的评分趋势和复习记录

### 🧠 科学复习算法

- **艾宾浩斯遗忘曲线** - 基于科学研究的间隔重复算法
- **动态间隔调整** - 根据评分自动调整复习时间
- **灵活系数控制** - 全局和单点复习频率可调
- **记忆标准判断** - 自动识别知识点掌握程度
- **长期抽查机制** - 已掌握的知识点定期复查

### 📊 可视化日历

- **热力图展示** - 6级颜色深浅反映学习强度
- **多视图切换** - 月视图、周视图、年视图
- **每日摘要** - 今日新增、复习、完成统计
- **历史回顾** - 一览所有学习活动

### 📝 日记和提醒

- **Markdown日记** - 富文本编辑，记录学习心得
- **提醒事项** - 管理待办和重要事件
- **日历集成** - 统一展示知识点、日记、提醒

### ⚙️ 系统集成

- **系统托盘** - 最小化到托盘，快速访问
- **全局快捷键** - 随时随地快速记录
- **桌面通知** - 复习提醒和任务通知
- **开机自启** - 可选的自动启动
- **数据备份** - 自动每日备份，保留7天

---

## 🏗️ 技术架构

### 技术栈

#### 核心框架
- **Electron** `39.2.6` - 跨平台桌面应用框架
- **Vite** `7.2.6` - 极速构建工具
- **electron-vite** `5.0.0` - Electron专用Vite配置

#### 前端技术
- **React** `19.2.1` - UI框架
- **TypeScript** `5.9.3` - 类型安全
- **Ant Design** `6.1.0` - UI组件库
- **Zustand** `5.0.9` - 轻量状态管理

#### 数据存储
- **SQLite** - 本地关系型数据库
- **better-sqlite3** `12.5.0` - Node.js SQLite3绑定

#### 工具库
- **dayjs** `1.11.19` - 日期处理
- **react-markdown** `10.1.0` - Markdown渲染
- **react-router-dom** `7.10.1` - 路由管理
- **electron-log** `5.4.3` - 日志系统

#### 开发工具
- **ESLint** `9.39.1` - 代码检查
- **Prettier** `3.7.4` - 代码格式化
- **Vitest** `4.0.15` - 单元测试框架

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    MindReminder                         │
├─────────────────────────────────────────────────────────┤
│  渲染进程 (React)          │  主进程 (Node.js)          │
│                            │                            │
│  ┌──────────────────┐     │  ┌──────────────────┐     │
│  │   UI Components  │     │  │   IPC Handlers   │     │
│  │   - Calendar     │◄────┼──┤   - Knowledge    │     │
│  │   - Review       │     │  │   - Review       │     │
│  │   - Knowledge    │     │  │   - Statistics   │     │
│  └────────┬─────────┘     │  └────────┬─────────┘     │
│           │               │           │               │
│  ┌────────▼─────────┐     │  ┌────────▼─────────┐     │
│  │  Zustand Stores  │     │  │    Services      │     │
│  │  - State Mgmt    │     │  │  - Business Logic│     │
│  └──────────────────┘     │  └────────┬─────────┘     │
│           │               │           │               │
│  ┌────────▼─────────┐     │  ┌────────▼─────────┐     │
│  │   Context API    │     │  │  Repositories    │     │
│  └──────────────────┘     │  │  - Data Access   │     │
│                            │  └────────┬─────────┘     │
│                            │           │               │
├────────────────────────────┼───────────▼───────────────┤
│  Preload Script (Bridge)   │  ┌──────────────────┐     │
│  - Context Bridge          │  │  SQLite Database │     │
│  - IPC Communication       │  │  - Knowledge     │     │
│                            │  │  - Reviews       │     │
│                            │  │  - Settings      │     │
│                            │  └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 核心算法

**间隔重复算法实现** (`src/main/algorithms/SpacedRepetitionAlgorithm.ts`)

基于艾宾浩斯遗忘曲线，实现科学的复习间隔计算：

```typescript
// 基础复习间隔（天）
BASE_INTERVALS = [1, 2, 4, 7, 15, 30]

// 评分系数
RATING_MULTIPLIERS = {
  1: 0.5,  // 😟 忘记了
  2: 0.7,  // 🤔 记得一点
  3: 1.0,  // 😐 记得一般
  4: 1.2,  // 😊 记得还可以
  5: 1.5   // 🎯 非常熟悉
}

// 下次复习时间 = 当前时间 + 基础间隔 × 评分系数 × 全局系数 × 单点系数
```

**特点：**
- ✅ 100%单元测试覆盖
- ✅ 支持全局和单点频率系数
- ✅ 动态间隔调整
- ✅ 记忆标准判断
- ✅ 长期抽查机制

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.14+

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/MindReminder.git
cd MindReminder

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 构建

```bash
# 类型检查
pnpm typecheck

# 构建应用
pnpm build

# 打包Windows安装程序
pnpm build:win

# 打包macOS应用
pnpm build:mac
```

---

## 📁 项目结构

```
MindReminder/
├── src/
│   ├── main/                      # 主进程代码
│   │   ├── algorithms/            # 核心算法
│   │   │   ├── SpacedRepetitionAlgorithm.ts
│   │   │   └── SpacedRepetitionAlgorithm.test.ts
│   │   ├── database/              # 数据库层
│   │   │   ├── DatabaseService.ts
│   │   │   ├── migrations/        # 数据库迁移
│   │   │   ├── repositories/      # Repository层
│   │   │   │   ├── KnowledgeRepository.ts
│   │   │   │   ├── ReviewRepository.ts
│   │   │   │   ├── DiaryRepository.ts
│   │   │   │   ├── ReminderRepository.ts
│   │   │   │   └── SettingsRepository.ts
│   │   │   └── types/             # 数据类型定义
│   │   ├── services/              # 业务逻辑服务
│   │   │   ├── ReviewService.ts
│   │   │   ├── BackupService.ts
│   │   │   ├── StatisticsService.ts
│   │   │   └── TrayService.ts
│   │   ├── ipc/                   # IPC处理器
│   │   │   ├── knowledgeHandlers.ts
│   │   │   ├── reviewHandlers.ts
│   │   │   ├── statisticsHandlers.ts
│   │   │   └── index.ts
│   │   └── utils/                 # 工具函数
│   │       ├── logger.ts
│   │       ├── pathHelper.ts
│   │       └── errors.ts
│   │
│   ├── preload/                   # 预加载脚本
│   │   ├── index.ts               # Context Bridge定义
│   │   └── index.d.ts             # IPC API类型定义
│   │
│   ├── renderer/                  # 渲染进程（React应用）
│   │   └── src/
│   │       ├── components/        # UI组件
│   │       │   ├── CalendarHeatmap.tsx
│   │       │   ├── ReviewCard.tsx
│   │       │   ├── KnowledgeListItem.tsx
│   │       │   └── ...
│   │       ├── pages/             # 页面组件
│   │       │   ├── HomePage.tsx
│   │       │   ├── CalendarPage.tsx
│   │       │   ├── KnowledgeListPage.tsx
│   │       │   ├── ReviewSessionPage.tsx
│   │       │   └── SettingsPage.tsx
│   │       ├── stores/            # Zustand状态管理
│   │       │   ├── knowledgeStore.ts
│   │       │   ├── reviewStore.ts
│   │       │   ├── calendarStore.ts
│   │       │   └── settingsStore.ts
│   │       ├── types/             # 类型定义
│   │       ├── styles/            # 样式文件
│   │       └── theme.ts           # Ant Design主题配置
│   │
│   └── common/                    # 共享代码
│       └── ipc-channels.ts        # IPC通道常量
│
├── docs/                          # 项目文档
│   ├── prd.md                     # 产品需求文档
│   ├── architecture.md            # 架构设计文档
│   ├── ux-design-specification.md # UX设计规范
│   └── stories/                   # Epic和Story文档
│
├── build/                         # 构建资源
│   ├── icon.ico                   # Windows图标
│   ├── icon.icns                  # macOS图标
│   └── icon.png                   # 通用图标
│
├── resources/                     # 应用资源
│   └── icon.png
│
├── scripts/                       # 工具脚本
│   ├── clear-database.ps1         # 清除数据库
│   └── test-database.ps1          # 测试数据库
│
├── electron.vite.config.ts        # Electron Vite配置
├── electron-builder.yml           # 打包配置
├── package.json                   # 项目配置
├── tsconfig.json                  # TypeScript配置
├── vitest.config.ts               # Vitest测试配置
└── README.md                      # 本文件
```

---

## 💻 开发指南

### 开发环境设置

1. **安装依赖**
```bash
pnpm install
```

2. **启动开发服务器**
```bash
pnpm dev
```

应用将启动并自动打开主窗口。支持HMR（热模块替换），修改代码后自动刷新。

### 代码规范

项目使用ESLint和Prettier进行代码质量控制：

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm typecheck
```

### 命名约定

**数据库命名** (snake_case)
```sql
-- 表名：单数形式
knowledge, review_history, diary

-- 字段名：小写蛇形
created_at, next_review_at, mastery_status
```

**TypeScript代码** (camelCase/PascalCase)
```typescript
// 变量、函数：camelCase
const knowledgeList = []
function calculateNextReview() {}

// 类型、接口、组件：PascalCase
interface Knowledge {}
class KnowledgeRepository {}
function ReviewCard() {}

// 常量：UPPER_SNAKE_CASE
const MAX_REVIEW_COUNT = 100
```

**IPC通道命名**
```typescript
// 格式：{实体}:{操作}
'knowledge:getAll'
'knowledge:create'
'review:submitRating'
```

### 数据库操作

**Repository模式**

所有数据库操作通过Repository层进行：

```typescript
// 主进程
import { KnowledgeRepository } from './database/repositories'

const repo = new KnowledgeRepository(db)
const knowledge = repo.findById('123')
repo.save(newKnowledge)

// 渲染进程通过IPC调用
const result = await window.api.knowledge.getById('123')
```

**迁移管理**

数据库结构变更通过迁移文件管理：

```typescript
// src/main/database/migrations/001_initial_schema.ts
export const migration_001 = {
  version: 1,
  up: (db: Database) => {
    db.exec(`CREATE TABLE knowledge (...)`)
  },
  down: (db: Database) => {
    db.exec(`DROP TABLE knowledge`)
  }
}
```

### IPC通信

**主进程注册Handler**

```typescript
// src/main/ipc/knowledgeHandlers.ts
import { ipcMain } from 'electron'

export function registerKnowledgeHandlers() {
  ipcMain.handle('knowledge:getAll', async () => {
    const list = await knowledgeService.getAll()
    return { data: list }
  })
}
```

**渲染进程调用API**

```typescript
// src/renderer/src/stores/knowledgeStore.ts
const fetchKnowledgeList = async () => {
  const response = await window.api.knowledge.getAll()
  set({ knowledgeList: response.data })
}
```

### 状态管理

使用Zustand管理应用状态：

```typescript
// src/renderer/src/stores/knowledgeStore.ts
import { create } from 'zustand'

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  knowledgeList: [],
  loading: false,
  
  fetchKnowledgeList: async () => {
    set({ loading: true })
    const response = await window.api.knowledge.getAll()
    set({ knowledgeList: response.data, loading: false })
  }
}))

// 在组件中使用
function KnowledgeList() {
  const knowledgeList = useKnowledgeStore(s => s.knowledgeList)
  const fetchKnowledgeList = useKnowledgeStore(s => s.fetchKnowledgeList)
  
  useEffect(() => {
    fetchKnowledgeList()
  }, [])
  
  return <div>{/* 渲染列表 */}</div>
}
```

---

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试UI界面
pnpm test:ui

# 运行单次测试
pnpm test:run
```

### 测试覆盖要求

- **核心算法** (`SpacedRepetitionAlgorithm`): 100%覆盖率 ✅
- **Repository层**: >80%覆盖率
- **Service层**: >80%覆盖率
- **工具函数**: >80%覆盖率

### 编写测试

```typescript
// SpacedRepetitionAlgorithm.test.ts
import { describe, it, expect } from 'vitest'
import { SpacedRepetitionAlgorithm } from './SpacedRepetitionAlgorithm'

describe('SpacedRepetitionAlgorithm', () => {
  it('应该根据评分计算正确的复习间隔', () => {
    const reviewCount = 0
    const rating = 3
    const result = SpacedRepetitionAlgorithm.calculateNextReviewDate(
      new Date(),
      reviewCount,
      rating
    )
    
    expect(result).toBeInstanceOf(Date)
    // 更多断言...
  })
})
```

---

## 📦 构建与打包

### 开发构建

```bash
# 构建代码（不打包）
pnpm build

# 预览构建结果
pnpm preview
```

### 生产打包

**Windows**
```bash
# 构建并打包Windows安装程序
pnpm build:win

# 输出文件
# dist/MindReminder-1.0.0-Setup.exe (安装程序)
# dist/win-unpacked/ (解压版)
```

**macOS**
```bash
# 构建并打包macOS应用
pnpm build:mac

# 输出文件
# dist/MindReminder-1.0.0.dmg (磁盘镜像)
# dist/mac/MindReminder.app (应用程序)
```

**Linux**
```bash
# 构建并打包Linux应用
pnpm build:linux

# 输出文件
# dist/MindReminder-1.0.0.AppImage
# dist/mindreminder-1.0.0.deb
```

### 打包配置

打包配置位于 `electron-builder.yml`：

```yaml
appId: com.mindreminder.app
productName: MindReminder
directories:
  buildResources: build
win:
  target:
    - nsis
    - portable
mac:
  entitlementsInherit: build/entitlements.mac.plist
linux:
  target:
    - AppImage
    - deb
```

---

## 🗂️ 数据存储

### 数据位置

应用数据存储在以下位置：

- **Windows**: `%APPDATA%/MindReminder/`
- **macOS**: `~/Library/Application Support/MindReminder/`
- **Linux**: `~/.config/MindReminder/`

### 数据库结构

**knowledge** - 知识点表
```sql
CREATE TABLE knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  category_id TEXT,
  frequency_coefficient REAL DEFAULT 1.0,
  mastery_status TEXT DEFAULT 'learning',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  next_review_at INTEGER,
  review_count INTEGER DEFAULT 0
)
```

**review_history** - 复习历史表
```sql
CREATE TABLE review_history (
  id TEXT PRIMARY KEY,
  knowledge_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL,
  next_review_at INTEGER NOT NULL,
  interval_days REAL NOT NULL,
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id)
)
```

**diary** - 日记表
```sql
CREATE TABLE diary (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

**reminder** - 提醒表
```sql
CREATE TABLE reminder (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  due_date INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

### 备份与恢复

应用支持自动备份：

- **自动备份**: 每日自动备份数据库
- **备份保留**: 保留最近7天的备份
- **备份位置**: `{数据目录}/backups/`
- **手动备份**: 设置页面可手动触发备份

**恢复数据**
1. 打开设置页面
2. 选择"数据管理" → "从备份恢复"
3. 选择备份文件
4. 确认恢复

---

## 🛠️ 故障排除

### 常见问题

**问题：应用无法启动**
```bash
# 清理依赖重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**问题：数据库错误**
```bash
# Windows
.\scripts\clear-database.ps1

# 或手动删除数据库文件
# Windows: %APPDATA%/MindReminder/mindreminder.db
# macOS: ~/Library/Application Support/MindReminder/mindreminder.db
```

**问题：构建失败**
```bash
# 清理构建缓存
rm -rf out dist

# 重新构建
pnpm build
```

### 日志查看

应用日志位于：

- **Windows**: `%APPDATA%/MindReminder/logs/`
- **macOS**: `~/Library/Logs/MindReminder/`
- **Linux**: `~/.config/MindReminder/logs/`

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

### 贡献流程

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 开发规范

- ✅ 遵循项目代码规范（ESLint + Prettier）
- ✅ 编写清晰的提交信息
- ✅ 为新功能添加测试
- ✅ 更新相关文档
- ✅ 确保所有测试通过
- ✅ 保持代码覆盖率

### 提交信息规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具配置

**示例**
```
feat(review): 添加复习统计图表

- 添加月度复习统计
- 添加知识点掌握度饼图
- 优化统计数据计算性能

Closes #123
```

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

## 🙏 致谢

本项目基于以下优秀的开源项目构建：

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - 高性能SQLite3绑定
- [Zustand](https://github.com/pmndrs/zustand) - 轻量状态管理

特别感谢所有贡献者的付出！

---

## 📞 联系方式

- **作者**: MindReminder Team
- **邮箱**: your.email@example.com
- **问题反馈**: [GitHub Issues](https://github.com/yourusername/MindReminder/issues)
- **讨论交流**: [GitHub Discussions](https://github.com/yourusername/MindReminder/discussions)

---

## 🗺️ 路线图

### 已完成 ✅
- [x] 项目基础架构
- [x] 知识点CRUD功能
- [x] 间隔重复算法
- [x] 复习系统
- [x] 日历热力图
- [x] 日记功能
- [x] 提醒事项
- [x] 统计分析
- [x] 数据备份

### 进行中 🚧
- [ ] 性能优化
- [ ] UI/UX优化
- [ ] 国际化支持

### 计划中 📋

**阶段2 (6-12个月)**
- [ ] 云端同步
- [ ] 多设备数据同步
- [ ] 数据加密

**阶段3 (12个月+)**
- [ ] 移动端应用 (iOS/Android)
- [ ] 知识图谱可视化
- [ ] AI辅助功能
- [ ] 社区分享

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star！**

[⬆ 回到顶部](#mindreminder)

Made with ❤️ by MindReminder Team

</div>
