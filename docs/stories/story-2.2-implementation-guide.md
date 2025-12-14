# Story 2.2 实施指南: 标签和分类管理

## Story概述

**User Story:**
As a **学习者**,
I want **为知识点添加标签和分类**,
So that **我可以按主题组织知识点，快速找到相关内容**.

**Story Points:** 5
**Sprint:** Sprint 1
**Epic:** Epic 2 - 知识点管理核心功能
**依赖:** Story 2.1

---

## 验收标准(AC)

### AC1: 标签输入和显示

- 用户输入标签（逗号或空格分隔）自动转换为标签列表
- 标签显示为可删除的徽章样式
- 点击徽章的"×"可删除标签

### AC2: 标签自动完成

- 用户开始输入标签时显示已有标签的建议
- 用户可以点击建议快速选择标签
- 支持创建新标签

### AC3: 分类管理

- 显示预定义分类列表（编程技术、数据结构、算法、系统设计、面试题）
- 用户可以添加自定义分类
- 自定义分类保存到设置中

### AC4: 标签和分类筛选

- 知识点卡片显示标签和分类
- 点击标签可筛选该标签的所有知识点
- 点击分类可筛选该分类的所有知识点

---

## 技术实现路径

### 1. 数据库层扩展

#### 1.1 创建Tags表（如果不存在）

```sql
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_name ON tags(name);
```

#### 1.2 创建Categories表

```sql
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_custom INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入预定义分类
INSERT OR IGNORE INTO categories (id, name, is_custom) VALUES
  ('cat_1', '编程技术', 0),
  ('cat_2', '数据结构', 0),
  ('cat_3', '算法', 0),
  ('cat_4', '系统设计', 0),
  ('cat_5', '面试题', 0);
```

#### 1.3 创建KnowledgeTags关联表

```sql
CREATE TABLE IF NOT EXISTS knowledge_tags (
  knowledge_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (knowledge_id, tag_id),
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### 2. Repository层扩展

#### 2.1 TagRepository (`src/main/database/repositories/TagRepository.ts`)

```typescript
export class TagRepository extends BaseRepository<Tag> {
  constructor(db: Database.Database) {
    super(db, 'tags')
  }

  // 获取所有标签（自动完成用）
  async getAllTags(): Promise<Tag[]>

  // 按名称查找标签
  async findByName(name: string): Promise<Tag | null>

  // 批量创建标签（如果不存在）
  async findOrCreateByNames(names: string[]): Promise<Tag[]>

  // 获取标签使用次数
  async getTagUsageCount(tagId: string): Promise<number>
}
```

#### 2.2 CategoryRepository (`src/main/database/repositories/CategoryRepository.ts`)

```typescript
export class CategoryRepository extends BaseRepository<Category> {
  constructor(db: Database.Database) {
    super(db, 'categories')
  }

  // 获取所有分类
  async getAllCategories(): Promise<Category[]>

  // 创建自定义分类
  async createCustomCategory(name: string): Promise<Category>

  // 删除自定义分类
  async deleteCustomCategory(id: string): Promise<void>
}
```

#### 2.3 扩展KnowledgeRepository

```typescript
// 在 KnowledgeRepository 中添加：

// 为知识点添加标签
async addTags(knowledgeId: string, tagIds: string[]): Promise<void>

// 移除知识点的标签
async removeTags(knowledgeId: string, tagIds: string[]): Promise<void>

// 获取知识点的所有标签
async getKnowledgeTags(knowledgeId: string): Promise<Tag[]>

// 按标签筛选知识点
async findByTags(tagIds: string[]): Promise<Knowledge[]>

// 按分类筛选知识点
async findByCategory(categoryId: string): Promise<Knowledge[]>
```

### 3. IPC通道扩展

#### 3.1 添加新通道（`src/main/ipc/channels.ts`）

```typescript
// Tags
TAGS_GET_ALL = 'tags:getAll',
TAGS_FIND_OR_CREATE = 'tags:findOrCreate',

// Categories
CATEGORIES_GET_ALL = 'categories:getAll',
CATEGORIES_CREATE_CUSTOM = 'categories:createCustom',
CATEGORIES_DELETE_CUSTOM = 'categories:deleteCustom',

// Knowledge Tags
KNOWLEDGE_ADD_TAGS = 'knowledge:addTags',
KNOWLEDGE_REMOVE_TAGS = 'knowledge:removeTags',
KNOWLEDGE_GET_TAGS = 'knowledge:getTags',
KNOWLEDGE_FILTER_BY_TAGS = 'knowledge:filterByTags',
KNOWLEDGE_FILTER_BY_CATEGORY = 'knowledge:filterByCategory',
```

#### 3.2 实现IPC处理器（`src/main/ipc/handlers/knowledgeHandlers.ts`）

```typescript
export function registerKnowledgeHandlers() {
  // ... 现有处理器 ...

  // 标签管理
  ipcMain.handle(IPCChannels.TAGS_GET_ALL, async () => {
    return await tagRepository.getAllTags()
  })

  ipcMain.handle(IPCChannels.TAGS_FIND_OR_CREATE, async (_, names: string[]) => {
    return await tagRepository.findOrCreateByNames(names)
  })

  // 分类管理
  ipcMain.handle(IPCChannels.CATEGORIES_GET_ALL, async () => {
    return await categoryRepository.getAllCategories()
  })

  ipcMain.handle(IPCChannels.CATEGORIES_CREATE_CUSTOM, async (_, name: string) => {
    return await categoryRepository.createCustomCategory(name)
  })

  // 知识点标签关联
  ipcMain.handle(
    IPCChannels.KNOWLEDGE_ADD_TAGS,
    async (_, knowledgeId: string, tagIds: string[]) => {
      return await knowledgeRepository.addTags(knowledgeId, tagIds)
    }
  )

  ipcMain.handle(IPCChannels.KNOWLEDGE_GET_TAGS, async (_, knowledgeId: string) => {
    return await knowledgeRepository.getKnowledgeTags(knowledgeId)
  })

  ipcMain.handle(IPCChannels.KNOWLEDGE_FILTER_BY_TAGS, async (_, tagIds: string[]) => {
    return await knowledgeRepository.findByTags(tagIds)
  })
}
```

### 4. 前端State扩展

#### 4.1 扩展knowledgeStore（`src/renderer/src/store/knowledgeStore.ts`）

```typescript
interface KnowledgeState {
  // ... 现有状态 ...
  tags: Tag[]
  categories: Category[]
  selectedTags: string[] // 筛选用
  selectedCategory: string | null // 筛选用
}

interface KnowledgeActions {
  // ... 现有actions ...

  // 标签相关
  fetchAllTags: () => Promise<void>
  addTagsToKnowledge: (knowledgeId: string, tagNames: string[]) => Promise<void>
  removeTagsFromKnowledge: (knowledgeId: string, tagIds: string[]) => Promise<void>

  // 分类相关
  fetchAllCategories: () => Promise<void>
  createCustomCategory: (name: string) => Promise<void>

  // 筛选相关
  setSelectedTags: (tagIds: string[]) => void
  setSelectedCategory: (categoryId: string | null) => void
  getFilteredKnowledge: () => Knowledge[]
}
```

### 5. UI组件实现

#### 5.1 TagInput组件（`src/renderer/src/components/knowledge/TagInput.tsx`）

**功能：**

- 输入标签（支持逗号/空格分隔）
- 显示已选标签为徽章
- 自动完成建议
- 删除标签

**依赖：** Ant Design的 `AutoComplete` + `Tag`

```typescript
interface TagInputProps {
  value: string[] // 已选标签
  onChange: (tags: string[]) => void
  allTags: Tag[] // 所有可用标签
}
```

#### 5.2 CategorySelect组件（`src/renderer/src/components/knowledge/CategorySelect.tsx`）

**功能：**

- 下拉选择分类
- 显示预定义和自定义分类
- 支持添加新分类

**依赖：** Ant Design的 `Select`

```typescript
interface CategorySelectProps {
  value: string | null
  onChange: (categoryId: string) => void
  categories: Category[]
  onCreateCustom: (name: string) => void
}
```

#### 5.3 KnowledgeCard扩展

在`KnowledgeCard`组件中添加：

- 显示标签列表（可点击筛选）
- 显示分类（可点击筛选）

#### 5.4 KnowledgeList扩展

在`KnowledgeList`组件中添加：

- 标签筛选区域
- 分类筛选区域
- 清除筛选按钮

#### 5.5 KnowledgeForm扩展

在`KnowledgeForm`对话框中添加：

- `<TagInput>` 组件
- `<CategorySelect>` 组件

---

## 数据类型定义

### TypeScript类型（`src/renderer/src/types/index.ts`）

```typescript
export interface Tag {
  id: string
  name: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  isCustom: boolean
  createdAt: string
}

export interface Knowledge {
  // ... 现有字段 ...
  tags?: Tag[] // 关联的标签
  category?: Category // 所属分类
}
```

---

## 实施任务清单

### Phase 1: 数据库和Repository层（2小时）✅ 已完成

- [x] 创建迁移文件：`002_tags_and_categories.ts`
- [x] 实现TagRepository
- [x] 实现CategoryRepository
- [x] 扩展KnowledgeRepository（标签关联方法）
- [x] 在DatabaseService中注册新repositories

### Phase 2: IPC通道（1小时）✅ 已完成

- [x] 添加新IPC通道枚举
- [x] 实现标签和分类的IPC处理器
- [x] 扩展preload类型定义
- [x] 手动测试IPC通信

### Phase 3: 前端State（1小时）✅ 已完成

- [x] 扩展knowledgeStore状态和actions
- [x] 实现标签和分类数据获取
- [x] 实现筛选逻辑（filterByTags/filterByCategory）
- [x] 测试Redux DevTools

### Phase 4: UI组件（3小时）✅ 已完成

- [x] 实现TagInput组件
  - [x] 基础输入和显示
  - [x] 自动完成
  - [x] 徽章删除
- [x] 实现CategorySelect组件
  - [x] 下拉选择
  - [x] 自定义分类创建
- [x] 扩展KnowledgeForm
  - [x] 集成TagInput
  - [x] 集成CategorySelect
  - [x] 保存时处理标签和分类
- [x] 扩展KnowledgeCard
  - [x] 显示标签和分类
  - [x] 添加点击筛选功能
- [x] 扩展KnowledgeList
  - [x] 添加筛选UI区域
  - [x] 实现标签筛选
  - [x] 实现分类筛选
  - [x] 清除筛选功能

### Phase 5: 测试和验证（1小时）✅ 已完成

- [x] **AC1验证：** 标签输入和显示
  - [x] 输入标签（逗号分隔）自动转换
  - [x] 徽章样式正确显示
  - [x] 删除标签功能正常
- [x] **AC2验证：** 标签自动完成
  - [x] 输入时显示建议
  - [x] 点击建议快速选择
  - [x] 创建新标签
- [x] **AC3验证：** 分类管理
  - [x] 预定义分类正确显示
  - [x] 自定义分类创建成功
  - [x] 自定义分类持久化
- [x] **AC4验证：** 标签和分类筛选
  - [x] 卡片显示标签和分类
  - [x] 点击标签筛选
  - [x] 点击分类筛选
  - [x] 筛选结果正确
- [x] TypeScript编译无错误
- [x] ESLint检查通过
- [x] 应用正常启动和运行

---

## 非功能需求

### 性能

- 标签自动完成响应 < 100ms
- 筛选操作响应 < 200ms

### 用户体验

- 标签输入支持多种分隔符（逗号、空格）
- 标签自动完成大小写不敏感
- 筛选条件显示为可清除的徽章
- 空筛选结果显示友好提示

### 数据一致性

- 删除标签时检查引用关系
- 预定义分类不可删除
- 标签名称唯一性约束

---

## 技术风险和缓解

### 风险1: 标签自动完成性能

**影响：** 大量标签时可能卡顿
**缓解：**

- 使用虚拟滚动（Ant Design AutoComplete自带）
- 限制建议数量（最多显示20个）

### 风险2: 多标签筛选逻辑复杂

**影响：** SQL查询可能低效
**缓解：**

- 使用JOIN优化查询
- 添加必要的索引
- 考虑"或"关系而非"与"关系

---

## Definition of Done

- [x] 所有AC验证通过
- [x] 代码遵循项目规范
- [x] TypeScript编译无错误
- [x] ESLint检查通过
- [x] 手动测试通过（待用户验证）
- [ ] 代码已提交
- [ ] 与Story 2.1集成测试通过

---

## 参考资源

- **数据库设计：** docs/architecture/database-schema.md
- **Repository模式：** Story 1.3实施指南
- **IPC通信：** Story 1.5实施指南
- **State管理：** Story 1.6实施指南
- **Ant Design：** https://ant.design/components/overview-cn/
  - AutoComplete: https://ant.design/components/auto-complete-cn/
  - Select: https://ant.design/components/select-cn/
  - Tag: https://ant.design/components/tag-cn/

---

## 估算和分配

**Story Points:** 5
**估算时间:** 8小时
**建议分配：** Dev Agent
**依赖Story:** 2.1（知识点CRUD基础功能）
