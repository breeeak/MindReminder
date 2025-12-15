# Story 2.1 实现指南：知识点CRUD基础功能

**Story ID:** 2.1  
**Story Title:** 知识点CRUD基础功能  
**Epic:** Epic 2 - 知识点管理核心功能  
**优先级:** P0  
**Story Points:** 8  
**预估时间:** 8小时

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **快速记录新的知识点**,  
So that **我可以随时保存学习内容，避免遗忘**.

### 业务价值

- 提供知识点的完整CRUD功能
- 实现快速记录流程（≤3次点击）
- 建立知识点管理的基础UI框架

---

## 📐 技术设计

### 架构层次

```
UI层（Renderer）
├── KnowledgeListPage.tsx        # 知识点列表页面
├── KnowledgeDetailPage.tsx      # 知识点详情页面
├── KnowledgeEditDialog.tsx      # 编辑/创建对话框
└── DeleteConfirmDialog.tsx      # 删除确认对话框

Store层（Zustand）
└── knowledgeStore.ts            # 已有，需扩展操作方法

IPC层（已有）
├── src/common/ipc-channels.ts
├── src/main/ipc/knowledgeHandlers.ts
└── src/preload/index.ts

数据层（已有）
└── KnowledgeRepository.ts       # 已实现完整CRUD
```

### 数据流

```
用户操作 → UI组件 → Zustand Store → IPC → Main进程 → Repository → SQLite
                  ↑___________响应数据回流___________________________↓
```

---

## ✅ Acceptance Criteria验收标准

### AC1: 快速记录表单

- [ ] 点击"快速记录"按钮弹出编辑对话框
- [ ] 表单包含：标题（必填）、内容（可选）、标签（可选）、分类（可选）
- [ ] 标题输入框有"问题形式"占位符提示
- [ ] 内容支持Markdown编辑（本Story使用简单文本框，未来优化）

### AC2: 创建知识点

- [ ] 填写标题后点击"保存"
- [ ] 数据保存到SQLite数据库
- [ ] 显示"保存成功"Toast提示
- [ ] 表单关闭，返回列表页面
- [ ] 新知识点出现在列表顶部
- [ ] 操作响应时间 < 200ms

### AC3: 查看知识点列表

- [ ] 主界面显示知识点列表
- [ ] 列表项显示：标题、标签（如果有）、创建时间
- [ ] 支持点击进入详情页面

### AC4: 查看知识点详情

- [ ] 点击列表项打开详情页面
- [ ] 显示：标题、内容、标签、分类、创建时间、更新时间
- [ ] 显示"编辑"和"删除"按钮

### AC5: 编辑知识点

- [ ] 点击"编辑"按钮打开编辑表单
- [ ] 表单预填充当前数据
- [ ] 可修改所有字段
- [ ] 点击"保存"后更新数据库
- [ ] 显示"更新成功"提示
- [ ] 详情页面自动刷新

### AC6: 删除知识点

- [ ] 点击"删除"按钮显示确认对话框
- [ ] 对话框内容："确定删除此知识点吗？"
- [ ] 用户确认后删除数据
- [ ] 显示"删除成功"提示
- [ ] 返回列表页面
- [ ] 已删除的知识点不再显示

### AC7: 错误处理

- [ ] 所有操作失败时显示友好错误提示
- [ ] 网络/数据库错误有明确提示
- [ ] 验证错误（如标题为空）有即时反馈

---

## 🛠️ 实现任务

### Task 1: 创建UI组件结构

**时间:** 2小时

#### 1.1 创建知识点列表页面

```typescript
// src/renderer/src/pages/KnowledgeListPage.tsx
import { useEffect } from 'react'
import { Button, List, Card, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useKnowledgeStore } from '../stores'

const { Title, Text } = Typography

export const KnowledgeListPage = () => {
  const { knowledges, loadKnowledges, isLoading } = useKnowledgeStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadKnowledges()
  }, [loadKnowledges])

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Title level={2}>我的知识点</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            快速记录
          </Button>
        </div>

        <List
          loading={isLoading}
          dataSource={knowledges}
          renderItem={(knowledge) => (
            <KnowledgeListItem knowledge={knowledge} />
          )}
        />
      </Space>

      <KnowledgeEditDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  )
}
```

#### 1.2 创建知识点列表项组件

```typescript
// src/renderer/src/components/KnowledgeListItem.tsx
interface Props {
  knowledge: Knowledge
}

export const KnowledgeListItem = ({ knowledge }: Props) => {
  const navigate = useNavigate()

  return (
    <Card
      hoverable
      style={{ marginBottom: '16px' }}
      onClick={() => navigate(`/knowledge/${knowledge.id}`)}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4}>{knowledge.title}</Title>
        <Space>
          {knowledge.tags?.map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
        </Space>
        <Text type="secondary">
          创建于 {new Date(knowledge.createdAt).toLocaleString()}
        </Text>
      </Space>
    </Card>
  )
}
```

#### 1.3 创建知识点编辑对话框

```typescript
// src/renderer/src/components/KnowledgeEditDialog.tsx
import { Modal, Form, Input, message } from 'antd'

interface Props {
  open: boolean
  onClose: () => void
  knowledge?: Knowledge // 编辑模式时传入
}

export const KnowledgeEditDialog = ({ open, onClose, knowledge }: Props) => {
  const [form] = Form.useForm()
  const { createKnowledge, updateKnowledge } = useKnowledgeStore()
  const [loading, setLoading] = useState(false)

  const isEditMode = !!knowledge

  useEffect(() => {
    if (knowledge) {
      form.setFieldsValue({
        title: knowledge.title,
        content: knowledge.content,
        tags: knowledge.tags?.join(', '),
        category: knowledge.category,
      })
    } else {
      form.resetFields()
    }
  }, [knowledge, form])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const data = {
        title: values.title,
        content: values.content || '',
        tags: values.tags ? values.tags.split(/[,，]\s*/).filter(Boolean) : [],
        category: values.category || null,
      }

      if (isEditMode) {
        await updateKnowledge(knowledge.id, data)
        message.success('更新成功')
      } else {
        await createKnowledge(data)
        message.success('保存成功')
      }

      onClose()
    } catch (error) {
      message.error(isEditMode ? '更新失败' : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={isEditMode ? '编辑知识点' : '快速记录'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="标题"
          name="title"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="用问题的形式描述，例如：什么是闭包？" />
        </Form.Item>

        <Form.Item label="内容" name="content">
          <Input.TextArea
            rows={6}
            placeholder="详细答案（可选，支持Markdown）"
          />
        </Form.Item>

        <Form.Item label="标签" name="tags">
          <Input placeholder="用逗号分隔，例如：JavaScript, 闭包, 面试" />
        </Form.Item>

        <Form.Item label="分类" name="category">
          <Input placeholder="例如：编程技术（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

#### 1.4 创建知识点详情页面

```typescript
// src/renderer/src/pages/KnowledgeDetailPage.tsx
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Typography, Descriptions, Modal, message } from 'antd'
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export const KnowledgeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentKnowledge, loadKnowledgeById, deleteKnowledge } = useKnowledgeStore()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (id) {
      loadKnowledgeById(id)
    }
  }, [id, loadKnowledgeById])

  const handleDelete = () => {
    Modal.confirm({
      title: '确定删除此知识点吗？',
      content: '删除后无法恢复',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteKnowledge(id!)
          message.success('删除成功')
          navigate('/knowledge')
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  if (!currentKnowledge) {
    return <div>加载中...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/knowledge')}
        >
          返回列表
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Title level={2}>{currentKnowledge.title}</Title>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => setIsEditDialogOpen(true)}
            >
              编辑
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除
            </Button>
          </Space>
        </div>

        <Descriptions column={1} bordered>
          <Descriptions.Item label="内容">
            <Paragraph>{currentKnowledge.content || '暂无内容'}</Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            <Space>
              {currentKnowledge.tags?.map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {currentKnowledge.category || '未分类'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(currentKnowledge.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(currentKnowledge.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Space>

      <KnowledgeEditDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          loadKnowledgeById(id!) // 刷新数据
        }}
        knowledge={currentKnowledge}
      />
    </div>
  )
}
```

### Task 2: 扩展Zustand Store

**时间:** 1小时

#### 2.1 扩展knowledgeStore操作方法

```typescript
// src/renderer/src/stores/knowledgeStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface KnowledgeState {
  knowledges: Knowledge[]
  currentKnowledge: Knowledge | null
  isLoading: boolean
  error: string | null

  // CRUD操作
  loadKnowledges: () => Promise<void>
  loadKnowledgeById: (id: string) => Promise<void>
  createKnowledge: (data: Partial<Knowledge>) => Promise<void>
  updateKnowledge: (id: string, data: Partial<Knowledge>) => Promise<void>
  deleteKnowledge: (id: string) => Promise<void>
}

export const useKnowledgeStore = create<KnowledgeState>()(
  devtools(
    (set, get) => ({
      knowledges: [],
      currentKnowledge: null,
      isLoading: false,
      error: null,

      loadKnowledges: async () => {
        set({ isLoading: true, error: null })
        try {
          const result = await window.api.knowledge.getAll()
          if (result.success) {
            set({ knowledges: result.data, isLoading: false })
          } else {
            set({ error: result.error, isLoading: false })
          }
        } catch (error) {
          set({ error: '加载失败', isLoading: false })
        }
      },

      loadKnowledgeById: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await window.api.knowledge.getById(id)
          if (result.success) {
            set({ currentKnowledge: result.data, isLoading: false })
          } else {
            set({ error: result.error, isLoading: false })
          }
        } catch (error) {
          set({ error: '加载失败', isLoading: false })
        }
      },

      createKnowledge: async (data: Partial<Knowledge>) => {
        set({ isLoading: true, error: null })
        try {
          const result = await window.api.knowledge.create(data)
          if (result.success) {
            // 重新加载列表
            await get().loadKnowledges()
          } else {
            set({ error: result.error, isLoading: false })
            throw new Error(result.error)
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      updateKnowledge: async (id: string, data: Partial<Knowledge>) => {
        set({ isLoading: true, error: null })
        try {
          const result = await window.api.knowledge.update(id, data)
          if (result.success) {
            set({ currentKnowledge: result.data, isLoading: false })
          } else {
            set({ error: result.error, isLoading: false })
            throw new Error(result.error)
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      deleteKnowledge: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await window.api.knowledge.delete(id)
          if (result.success) {
            set({ isLoading: false })
          } else {
            set({ error: result.error, isLoading: false })
            throw new Error(result.error)
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      }
    }),
    { name: 'KnowledgeStore' }
  )
)
```

### Task 3: 配置路由

**时间:** 0.5小时

#### 3.1 安装react-router-dom

```bash
pnpm add react-router-dom
pnpm add -D @types/react-router-dom
```

#### 3.2 配置路由

```typescript
// src/renderer/src/App.tsx
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { KnowledgeListPage } from './pages/KnowledgeListPage'
import { KnowledgeDetailPage } from './pages/KnowledgeDetailPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/knowledge" replace />} />
        <Route path="/knowledge" element={<KnowledgeListPage />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
      </Routes>
    </Router>
  )
}

export default App
```

### Task 4: 创建TypeScript类型

**时间:** 0.5小时

#### 4.1 确认renderer类型定义

```typescript
// src/renderer/src/types/index.ts
export interface Knowledge {
  id: string
  title: string
  content: string
  tags: string[]
  category: string | null
  reviewCount: number
  lastReviewAt: string | null
  nextReviewAt: string | null
  masteryLevel: number
  frequencyFactor: number
  createdAt: string
  updatedAt: string
}
```

### Task 5: 测试和验证

**时间:** 2小时

#### 5.1 手动测试清单

- [ ] **创建测试**
  - [ ] 点击"快速记录"按钮
  - [ ] 只填标题，点击保存
  - [ ] 填写完整信息，点击保存
  - [ ] 标题为空，尝试保存（应显示验证错误）
  - [ ] 检查列表中是否显示新知识点

- [ ] **查看测试**
  - [ ] 列表显示所有知识点
  - [ ] 点击知识点进入详情页
  - [ ] 详情页显示完整信息

- [ ] **编辑测试**
  - [ ] 点击"编辑"按钮
  - [ ] 修改标题
  - [ ] 修改内容
  - [ ] 添加/修改标签
  - [ ] 点击保存
  - [ ] 检查数据是否更新

- [ ] **删除测试**
  - [ ] 点击"删除"按钮
  - [ ] 确认对话框显示
  - [ ] 点击取消（应关闭对话框）
  - [ ] 再次点击删除，点击确定
  - [ ] 检查列表中不再显示该知识点

- [ ] **性能测试**
  - [ ] 创建10个知识点
  - [ ] 测试列表加载速度（< 200ms）
  - [ ] 测试CRUD操作响应时间（< 200ms）

- [ ] **错误处理测试**
  - [ ] 模拟数据库错误
  - [ ] 检查错误提示是否友好

#### 5.2 性能测试脚本

```typescript
// scripts/test-crud-performance.ts
import { performance } from 'perf_hooks'

async function testCRUDPerformance() {
  console.log('测试CRUD性能...')

  // 测试创建
  const createStart = performance.now()
  const knowledge = await window.api.knowledge.create({
    title: '测试知识点',
    content: '测试内容'
  })
  const createTime = performance.now() - createStart
  console.log(`创建耗时: ${createTime.toFixed(2)}ms`)

  // 测试读取
  const readStart = performance.now()
  await window.api.knowledge.getById(knowledge.data.id)
  const readTime = performance.now() - readStart
  console.log(`读取耗时: ${readTime.toFixed(2)}ms`)

  // 测试更新
  const updateStart = performance.now()
  await window.api.knowledge.update(knowledge.data.id, { title: '更新标题' })
  const updateTime = performance.now() - updateStart
  console.log(`更新耗时: ${updateTime.toFixed(2)}ms`)

  // 测试删除
  const deleteStart = performance.now()
  await window.api.knowledge.delete(knowledge.data.id)
  const deleteTime = performance.now() - deleteStart
  console.log(`删除耗时: ${deleteTime.toFixed(2)}ms`)

  // 验证性能要求
  const allUnder200ms = [createTime, readTime, updateTime, deleteTime].every((t) => t < 200)
  console.log(allUnder200ms ? '✅ 所有操作 < 200ms' : '❌ 性能不达标')
}
```

### Task 6: 文档更新

**时间:** 0.5小时

#### 6.1 更新sprint-status.yaml

```yaml
- story_id: '2.1'
  title: '知识点CRUD基础功能'
  epic: 'Epic 2'
  story_points: 8
  priority: 'P0'
  status: 'in_progress'
  assignee: 'Dev Agent'
  dependencies: ['1.5', '1.6']
  implementation_guide: 'docs/stories/story-2.1-implementation-guide.md'
```

---

## 🔍 技术要点

### 1. 路由设计

- 使用`react-router-dom v6`
- 使用`HashRouter`（适合Electron）
- 页面路径：
  - `/knowledge` - 列表页
  - `/knowledge/:id` - 详情页

### 2. 状态管理

- Zustand store统一管理知识点数据
- 操作方法封装IPC调用
- 使用devtools监控状态变化

### 3. UI/UX设计

- Ant Design组件库
- 响应式布局
- Toast消息提示（Ant Design message）
- Modal确认对话框

### 4. 性能优化

- 操作响应时间监控
- 列表懒加载（未来优化）
- 虚拟滚动（数据量大时）

---

## 📊 DoD检查清单

### 代码质量

- [ ] 所有AC验证通过
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
- [ ] 代码遵循项目规范

### 测试

- [ ] 手动测试所有功能点
- [ ] 性能测试通过（< 200ms）
- [ ] 错误场景测试通过

### 文档

- [ ] 实现指南完成
- [ ] 代码注释完整
- [ ] sprint-status.yaml更新

### 集成

- [ ] 与Epic 1集成无问题
- [ ] 应用正常启动
- [ ] IPC通信正常

---

## 📝 实现笔记

### 依赖关系

- ✅ Story 1.2: SQLite数据库（KnowledgeRepository已实现）
- ✅ Story 1.3: Repository模式（完整CRUD已实现）
- ✅ Story 1.5: IPC通信（knowledgeHandlers已实现）
- ✅ Story 1.6: Zustand状态管理（knowledgeStore已创建）

### 技术债务

- [ ] Markdown编辑器（本Story使用文本框，Story 2.2优化）
- [ ] 标签自动完成（Story 2.2实现）
- [ ] 分类下拉选择（Story 2.2实现）

### 参考文档

- [PRD](../prd.md) - FR1-FR9
- [架构文档](../architecture.md) - 组件设计
- [UX设计](../ux-design-specification.md) - UI规范

---

## 🎯 验收标准总结

1. ✅ 用户可以创建、查看、编辑、删除知识点
2. ✅ 所有操作响应时间 < 200ms
3. ✅ 错误提示友好清晰
4. ✅ UI符合Ant Design规范
5. ✅ 路由导航正常
6. ✅ 数据持久化到SQLite

---

**准备就绪！可以开始实现Story 2.1了。** 🚀





