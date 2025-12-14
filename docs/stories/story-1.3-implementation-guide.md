# Story 1.3: Repository模式数据访问层 - 实施指南

**Story ID:** 1.3  
**Epic:** Epic 1 - 项目基础设施与开发环境  
**状态:** TODO  
**优先级:** P0  
**Story Points:** 8  
**预估工时:** 8小时

---

## 📋 Story概述

**用户故事:**

```
As a 开发者,
I want 实现Repository模式封装数据库访问,
So that 业务逻辑与数据访问分离，代码更易测试和维护.
```

**价值:**

- 实现数据访问层与业务逻辑的分离
- 提高代码可测试性和可维护性
- 统一数据命名规范（数据库 snake_case ↔ TypeScript camelCase）
- 为后续功能开发提供稳定的数据访问接口

**依赖:**

- ✅ Story 1.1: electron-vite项目初始化
- ✅ Story 1.2: SQLite数据库基础设施

---

## 🎯 验收标准 (Acceptance Criteria)

### AC1: BaseRepository抽象类

**Given** SQLite数据库基础设施已完成（Story 1.2）  
**When** 创建BaseRepository抽象类（`src/main/database/repositories/BaseRepository.ts`）  
**Then** BaseRepository提供通用CRUD方法：

- `findById(id: number): T | null`
- `findAll(): T[]`
- `create(data: Partial<T>): T`
- `update(id: number, data: Partial<T>): T`
- `delete(id: number): boolean`

**And** BaseRepository接收DatabaseService实例作为依赖  
**And** 所有数据库操作包含错误处理和日志记录  
**And** 数据命名规范：数据库使用snake_case，TypeScript使用camelCase

---

### AC2: KnowledgeRepository实现

**When** 实现KnowledgeRepository（`src/main/database/repositories/KnowledgeRepository.ts`）  
**Then** KnowledgeRepository继承BaseRepository  
**And** 提供知识点特定方法：

- `findByTags(tags: string[]): Knowledge[]`
- `search(keyword: string): Knowledge[]`
- `updateFrequencyCoefficient(id: number, coefficient: number): boolean`

**And** 定义Knowledge类型（`src/main/database/types/Knowledge.ts`）：

```typescript
interface Knowledge {
  id: number
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  frequencyCoefficient: number
}
```

---

### AC3: ReviewRepository实现

**When** 实现ReviewRepository（`src/main/database/repositories/ReviewRepository.ts`）  
**Then** ReviewRepository继承BaseRepository  
**And** 提供复习历史特定方法：

- `findByKnowledgeId(knowledgeId: number): ReviewHistory[]`
- `findDueReviews(date: Date): ReviewHistory[]`
- `createReview(knowledgeId: number, rating: number, nextReviewDate: Date): ReviewHistory`

**And** 定义ReviewHistory类型（`src/main/database/types/ReviewHistory.ts`）：

```typescript
interface ReviewHistory {
  id: number
  knowledgeId: number
  rating: number
  reviewDate: Date
  nextReviewDate: Date
}
```

---

### AC4: Repository工厂和单例

**When** 创建Repository工厂（`src/main/database/repositories/index.ts`）  
**Then** 提供单例模式访问所有Repository实例  
**And** Repository在应用启动时初始化一次  
**And** Repository共享同一个DatabaseService实例

---

### AC5: 单元测试

**When** 执行单元测试  
**Then** 所有Repository方法能正确执行CRUD操作  
**And** 数据类型转换正确（snake_case ↔ camelCase）  
**And** 边界条件处理正确（如查询不存在的ID返回null）

---

## 🏗️ 实施步骤

### Step 1: 创建TypeScript类型定义 (1h)

**任务:**

1. 创建 `src/main/database/types/` 目录
2. 定义 `Knowledge.ts` 类型
3. 定义 `ReviewHistory.ts` 类型
4. 创建 `index.ts` 统一导出

**产出:**

- `src/main/database/types/Knowledge.ts`
- `src/main/database/types/ReviewHistory.ts`
- `src/main/database/types/index.ts`

**验证:**

- TypeScript编译无错误
- 类型定义完整且符合业务需求

---

### Step 2: 实现BaseRepository抽象类 (2h)

**任务:**

1. 创建 `src/main/database/repositories/BaseRepository.ts`
2. 实现通用CRUD方法
3. 实现数据命名转换工具（snake_case ↔ camelCase）
4. 添加错误处理和日志记录
5. 编写JSDoc文档注释

**产出:**

- `src/main/database/repositories/BaseRepository.ts`

**技术细节:**

- 使用泛型支持不同数据类型
- 数据库操作使用prepared statements防止SQL注入
- 错误统一使用 `DatabaseError`（来自utils/errors.ts）
- 日志记录关键操作和错误

**验证:**

- TypeScript编译无错误
- 代码符合ESLint规范
- 所有公共方法有JSDoc注释

---

### Step 3: 实现KnowledgeRepository (2h)

**任务:**

1. 创建 `src/main/database/repositories/KnowledgeRepository.ts`
2. 实现继承BaseRepository的CRUD方法
3. 实现特定查询方法：
   - `findByTags(tags: string[])`
   - `search(keyword: string)`
   - `updateFrequencyCoefficient(id, coefficient)`
4. 实现tags字段的序列化/反序列化（JSON ↔ Array）

**产出:**

- `src/main/database/repositories/KnowledgeRepository.ts`

**技术细节:**

- tags存储为JSON字符串，查询时使用LIKE
- search支持title和content模糊匹配
- 自动更新updated_at时间戳

**验证:**

- CRUD操作正确
- 特定查询方法返回正确结果
- tags序列化/反序列化正确

---

### Step 4: 实现ReviewRepository (2h)

**任务:**

1. 创建 `src/main/database/repositories/ReviewRepository.ts`
2. 实现继承BaseRepository的CRUD方法
3. 实现特定查询方法：
   - `findByKnowledgeId(knowledgeId: number)`
   - `findDueReviews(date: Date)`
   - `createReview(knowledgeId, rating, nextReviewDate)`
4. 实现Date类型转换（Unix timestamp ↔ Date对象）

**产出:**

- `src/main/database/repositories/ReviewRepository.ts`

**技术细节:**

- Date存储为Unix timestamp（毫秒）
- findDueReviews查询next_review_date <= 给定日期
- createReview自动设置review_date为当前时间

**验证:**

- CRUD操作正确
- 日期转换正确（毫秒级精度）
- 外键约束正常工作

---

### Step 5: 创建Repository工厂 (1h)

**任务:**

1. 创建 `src/main/database/repositories/index.ts`
2. 实现单例模式管理Repository实例
3. 提供初始化和访问接口
4. 与DatabaseService集成

**产出:**

- `src/main/database/repositories/index.ts`

**代码示例:**

```typescript
// src/main/database/repositories/index.ts
import { DatabaseService } from '../DatabaseService'
import { KnowledgeRepository } from './KnowledgeRepository'
import { ReviewRepository } from './ReviewRepository'

let knowledgeRepo: KnowledgeRepository | null = null
let reviewRepo: ReviewRepository | null = null

export function initRepositories(dbService: DatabaseService): void {
  knowledgeRepo = new KnowledgeRepository(dbService)
  reviewRepo = new ReviewRepository(dbService)
}

export function getKnowledgeRepository(): KnowledgeRepository {
  if (!knowledgeRepo) throw new Error('Repositories not initialized')
  return knowledgeRepo
}

export function getReviewRepository(): ReviewRepository {
  if (!reviewRepo) throw new Error('Repositories not initialized')
  return reviewRepo
}
```

**验证:**

- 单例模式工作正常
- 未初始化时抛出错误
- Repository共享同一DatabaseService实例

---

### Step 6: 编写单元测试 (可选，预留2h)

**任务:**

1. 创建 `src/main/database/repositories/__tests__/` 目录
2. 编写KnowledgeRepository测试
3. 编写ReviewRepository测试
4. 使用内存数据库测试

**测试用例:**

- ✅ CRUD操作正确性
- ✅ 数据类型转换（snake_case ↔ camelCase）
- ✅ 边界条件（null、空数组、不存在的ID）
- ✅ 错误处理（数据库错误、外键约束）

**注意:** 如果时间紧张，可以先跳过单元测试，使用手动验证

---

## 📁 文件结构

完成后的文件结构：

```
src/main/database/
├── DatabaseService.ts          # 已存在
├── migrations/                 # 已存在
├── types/                      # 新建
│   ├── Knowledge.ts
│   ├── ReviewHistory.ts
│   └── index.ts
└── repositories/               # 新建
    ├── BaseRepository.ts
    ├── KnowledgeRepository.ts
    ├── ReviewRepository.ts
    └── index.ts
```

---

## 🧪 验证测试

### 手动验证步骤

在 `src/main/index.ts` 中添加测试代码：

```typescript
import {
  initRepositories,
  getKnowledgeRepository,
  getReviewRepository
} from './database/repositories'

// 在应用启动后
async function testRepositories() {
  console.log('=== Testing Repositories ===')

  const knowledgeRepo = getKnowledgeRepository()
  const reviewRepo = getReviewRepository()

  // 测试1: 创建知识点
  const knowledge = knowledgeRepo.create({
    title: '测试知识点',
    content: '这是测试内容',
    tags: ['测试', 'Repository'],
    createdAt: new Date(),
    updatedAt: new Date(),
    frequencyCoefficient: 1.0
  })
  console.log('✅ Created knowledge:', knowledge)

  // 测试2: 查询知识点
  const found = knowledgeRepo.findById(knowledge.id)
  console.log('✅ Found knowledge:', found)

  // 测试3: 搜索知识点
  const searchResults = knowledgeRepo.search('测试')
  console.log('✅ Search results:', searchResults)

  // 测试4: 按标签查询
  const tagResults = knowledgeRepo.findByTags(['测试'])
  console.log('✅ Tag results:', tagResults)

  // 测试5: 创建复习记录
  const review = reviewRepo.createReview(
    knowledge.id,
    5,
    new Date(Date.now() + 24 * 60 * 60 * 1000) // 明天
  )
  console.log('✅ Created review:', review)

  // 测试6: 查询到期复习
  const dueReviews = reviewRepo.findDueReviews(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
  console.log('✅ Due reviews:', dueReviews)

  console.log('=== All tests passed! ===')
}

// 在数据库初始化后调用
initRepositories(dbService)
testRepositories()
```

### 预期输出

控制台应显示：

```
=== Testing Repositories ===
✅ Created knowledge: { id: 1, title: '测试知识点', ... }
✅ Found knowledge: { id: 1, title: '测试知识点', ... }
✅ Search results: [{ id: 1, title: '测试知识点', ... }]
✅ Tag results: [{ id: 1, title: '测试知识点', ... }]
✅ Created review: { id: 1, knowledgeId: 1, rating: 5, ... }
✅ Due reviews: [{ id: 1, knowledgeId: 1, ... }]
=== All tests passed! ===
```

---

## ⚠️ 注意事项

### 数据命名转换

**数据库字段（snake_case）:**

- `created_at`
- `updated_at`
- `frequency_coefficient`
- `knowledge_id`
- `next_review_date`

**TypeScript属性（camelCase）:**

- `createdAt`
- `updatedAt`
- `frequencyCoefficient`
- `knowledgeId`
- `nextReviewDate`

**转换工具示例:**

```typescript
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}
```

### 错误处理

所有Repository方法应统一错误处理：

```typescript
try {
  // 数据库操作
} catch (error) {
  logger.error('Repository operation failed:', error)
  throw new DatabaseError('操作失败', { cause: error })
}
```

### 事务处理

目前不需要复杂事务，BaseRepository的每个方法独立执行。未来如需事务支持，可扩展DatabaseService添加transaction方法。

---

## 🎯 Definition of Done

**代码完成:**

- [ ] 所有类型定义已创建
- [ ] BaseRepository实现完成
- [ ] KnowledgeRepository实现完成
- [ ] ReviewRepository实现完成
- [ ] Repository工厂实现完成

**验收标准:**

- [ ] AC1-AC5全部验证通过
- [ ] 手动测试脚本执行成功
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过

**代码质量:**

- [ ] 代码遵循项目命名规范
- [ ] 所有公共方法有JSDoc注释
- [ ] 错误处理完整
- [ ] 日志记录关键操作

**文档:**

- [ ] 代码注释完整
- [ ] 本实施指南完成
- [ ] README更新（如需）

**集成:**

- [ ] Repository工厂在main/index.ts中初始化
- [ ] 与DatabaseService正确集成
- [ ] 应用可正常启动和运行

---

## 📝 技术决策记录

### 决策1: Repository模式 vs Active Record模式

**选择:** Repository模式

**原因:**

- 更好的关注点分离
- 易于单元测试（可mock Repository）
- 灵活的查询接口
- 符合SOLID原则

### 决策2: 类型转换位置

**选择:** 在BaseRepository层统一处理命名转换

**原因:**

- 避免每个Repository重复实现
- 统一转换逻辑，减少错误
- 上层代码始终使用camelCase，体验一致

### 决策3: 单例模式管理Repository

**选择:** 使用工厂函数返回单例实例

**原因:**

- 应用只需要一个DatabaseService连接
- 避免多个Repository实例导致连接池问题
- 简化依赖注入

---

## 🚀 开始开发

**准备工作:**

1. 确认Story 1.2已完成（数据库初始化正常）
2. 拉取最新代码
3. 切换到新分支：`git checkout -b feature/story-1.3-repository`

**开发流程:**

1. 按步骤1-5顺序实现
2. 每完成一步，提交一次代码
3. 完成后运行手动验证测试
4. 检查DoD清单
5. 提交Pull Request

**预估时间分配:**

- Step 1: 1小时
- Step 2: 2小时
- Step 3: 2小时
- Step 4: 2小时
- Step 5: 1小时
- **总计: 8小时**

祝开发顺利！🎉
