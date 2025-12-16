# Story 2.3 实现指南：知识点搜索功能

**Story ID:** 2.3  
**Story Title:** 知识点搜索功能  
**Epic:** Epic 2 - 知识点管理核心功能  
**优先级:** P0  
**Story Points:** 5  
**预估时间:** 6小时  
**依赖:** Story 2.1, Story 2.2

---

## 📋 Story概述

### 用户故事

As a **学习者**,  
I want **快速搜索知识点**,  
So that **我可以在大量知识点中快速找到需要的内容**.

### 业务价值

- 提供高效的搜索和筛选能力，提升知识点查找效率
- 支持多维度筛选，满足不同场景的查找需求
- 实时搜索和高亮显示，优化用户体验

### 业务需求覆盖

- **FR40**: 按关键词搜索知识点（标题+内容）
- **FR41**: 按标签筛选知识点
- **FR42**: 按分类筛选知识点
- **FR43**: 按复习状态筛选知识点
- **NFR-P3**: 搜索响应时间 < 500ms
- **NFR-U1**: 易学性要求
- **NFR-U2**: 操作效率要求

---

## 📐 技术设计

### 架构层次

```
UI层（Renderer）
├── KnowledgeListPage.tsx         # 知识点列表页（需扩展）
│   ├── SearchBar.tsx             # 新增：搜索框组件
│   ├── AdvancedFilter.tsx        # 新增：高级筛选组件
│   └── FilterTags.tsx            # 新增：筛选条件标签显示
│
Store层（Zustand）
└── knowledgeStore.ts             # 需扩展搜索和筛选状态

IPC层（已有，无需修改）
├── src/common/ipc-channels.ts    # 已有搜索通道
├── src/main/ipc/knowledgeHandlers.ts
└── src/preload/index.ts

数据层（需扩展）
└── KnowledgeRepository.ts        # 需实现搜索和筛选查询
```

### 数据流

```
用户输入搜索词/筛选条件
    ↓
SearchBar/AdvancedFilter组件
    ↓
knowledgeStore.searchKnowledge()
knowledgeStore.setFilters()
    ↓
IPC: 'knowledge:search'
IPC: 'knowledge:filter'
    ↓
KnowledgeRepository.search()
KnowledgeRepository.filter()
    ↓
SQL查询（LIKE/JOIN）
    ↓
返回结果列表
    ↓
Store更新状态
    ↓
UI重新渲染
    ↓
高亮显示关键词
```

---

## 🎯 验收标准（Acceptance Criteria）

### AC1: 基础搜索功能

**Given** 用户在知识点列表页面  
**When** 用户在搜索框输入关键词  
**Then** 实时搜索标题和内容包含关键词的知识点  
**And** 搜索结果高亮显示匹配的关键词  
**And** 搜索响应时间 < 300ms

### AC2: 搜索框交互

**When** 搜索框为空  
**Then** 显示所有知识点

**When** 搜索无结果  
**Then** 显示"未找到匹配的知识点"  
**And** 提供"创建新知识点"的快捷按钮

### AC3: 高级筛选功能

**When** 用户使用高级搜索  
**Then** 可以按以下条件筛选：

- 标签（多选）
- 分类（单选）
- 复习状态（学习中/已掌握）
- 创建日期范围

**And** 多个筛选条件为"与"关系  
**And** 筛选结果实时更新  
**And** 显示当前筛选条件的标签  
**And** 点击标签可清除该筛选条件

### AC4: 性能要求

- 搜索响应时间 < 300ms
- 筛选响应时间 < 200ms
- 支持1000+知识点的搜索和筛选

---

## 🔧 技术实现

### 步骤1: 扩展KnowledgeRepository搜索方法

**位置:** `src/main/database/repositories/KnowledgeRepository.ts`

**新增方法:**

```typescript
/**
 * 搜索知识点（按标题和内容）
 */
search(keyword: string): Knowledge[] {
  if (!keyword.trim()) {
    return this.findAll();
  }

  const stmt = this.db.prepare(`
    SELECT * FROM knowledge
    WHERE title LIKE ? OR content LIKE ?
    ORDER BY updated_at DESC
  `);

  const searchPattern = `%${keyword}%`;
  const rows = stmt.all(searchPattern, searchPattern) as any[];

  return rows.map(row => this.mapRowToEntity(row));
}

/**
 * 高级筛选知识点
 */
filter(filters: {
  tags?: string[];          // 标签ID列表
  categoryId?: string;      // 分类ID
  status?: 'learning' | 'mastered';  // 复习状态
  dateFrom?: string;        // 创建日期起始 (ISO string)
  dateTo?: string;          // 创建日期结束 (ISO string)
  keyword?: string;         // 可选关键词搜索
}): Knowledge[] {
  let query = `SELECT DISTINCT k.* FROM knowledge k`;
  const params: any[] = [];
  const conditions: string[] = [];

  // 标签筛选（多选，AND关系）
  if (filters.tags && filters.tags.length > 0) {
    query += ` INNER JOIN knowledge_tags kt ON k.id = kt.knowledge_id`;
    conditions.push(`kt.tag_id IN (${filters.tags.map(() => '?').join(',')})`);
    params.push(...filters.tags);

    // 确保所有标签都匹配
    conditions.push(`
      (SELECT COUNT(*) FROM knowledge_tags WHERE knowledge_id = k.id AND tag_id IN (${filters.tags.map(() => '?').join(',')})) = ?
    `);
    params.push(...filters.tags, filters.tags.length);
  }

  // 分类筛选
  if (filters.categoryId) {
    conditions.push(`k.category_id = ?`);
    params.push(filters.categoryId);
  }

  // 复习状态筛选
  if (filters.status) {
    if (filters.status === 'mastered') {
      conditions.push(`k.is_mastered = 1`);
    } else {
      conditions.push(`k.is_mastered = 0`);
    }
  }

  // 日期范围筛选
  if (filters.dateFrom) {
    conditions.push(`k.created_at >= ?`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`k.created_at <= ?`);
    params.push(filters.dateTo);
  }

  // 关键词搜索
  if (filters.keyword && filters.keyword.trim()) {
    conditions.push(`(k.title LIKE ? OR k.content LIKE ?)`);
    const searchPattern = `%${filters.keyword}%`;
    params.push(searchPattern, searchPattern);
  }

  // 组合条件
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY k.updated_at DESC`;

  const stmt = this.db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map(row => this.mapRowToEntity(row));
}

/**
 * 获取知识点的所有标签（用于筛选）
 */
getKnowledgeWithTags(knowledgeId: string): { knowledge: Knowledge; tags: Tag[] } {
  const knowledge = this.findById(knowledgeId);
  if (!knowledge) {
    throw new Error('Knowledge not found');
  }

  const stmt = this.db.prepare(`
    SELECT t.* FROM tags t
    INNER JOIN knowledge_tags kt ON t.id = kt.tag_id
    WHERE kt.knowledge_id = ?
  `);

  const tagRows = stmt.all(knowledgeId) as any[];
  const tags = tagRows.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { knowledge, tags };
}
```

---

### 步骤2: 扩展IPC处理器

**位置:** `src/main/ipc/knowledgeHandlers.ts`

**新增处理器:**

```typescript
// 添加到setupKnowledgeHandlers()函数中

// 搜索知识点
ipcMain.handle('knowledge:search', async (_, keyword: string) => {
  try {
    const repository = new KnowledgeRepository(DatabaseService.getInstance().getDb())
    const results = repository.search(keyword)
    return { success: true, data: results }
  } catch (error) {
    logger.error('Failed to search knowledge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

// 高级筛选知识点
ipcMain.handle('knowledge:filter', async (_, filters: any) => {
  try {
    const repository = new KnowledgeRepository(DatabaseService.getInstance().getDb())
    const results = repository.filter(filters)
    return { success: true, data: results }
  } catch (error) {
    logger.error('Failed to filter knowledge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
```

---

### 步骤3: 扩展Preload类型定义

**位置:** `src/preload/index.d.ts`

**添加类型:**

```typescript
// 在ElectronAPI接口中添加
interface ElectronAPI {
  // ... 已有方法

  // 搜索和筛选
  searchKnowledge: (
    keyword: string
  ) => Promise<{ success: boolean; data?: Knowledge[]; error?: string }>
  filterKnowledge: (filters: {
    tags?: string[]
    categoryId?: string
    status?: 'learning' | 'mastered'
    dateFrom?: string
    dateTo?: string
    keyword?: string
  }) => Promise<{ success: boolean; data?: Knowledge[]; error?: string }>
}
```

**位置:** `src/preload/index.ts`

**添加暴露方法:**

```typescript
// 在contextBridge.exposeInMainWorld中添加
const api: ElectronAPI = {
  // ... 已有方法

  // 搜索和筛选
  searchKnowledge: (keyword: string) => ipcRenderer.invoke('knowledge:search', keyword),
  filterKnowledge: (filters) => ipcRenderer.invoke('knowledge:filter', filters)
}
```

---

### 步骤4: 扩展knowledgeStore

**位置:** `src/renderer/src/stores/knowledgeStore.ts`

**添加状态和方法:**

```typescript
interface KnowledgeState {
  // ... 已有状态

  // 搜索和筛选状态
  searchKeyword: string
  filters: {
    tags: string[]
    categoryId: string | null
    status: 'all' | 'learning' | 'mastered'
    dateFrom: string | null
    dateTo: string | null
  }
  isFiltering: boolean

  // 搜索方法
  setSearchKeyword: (keyword: string) => void
  searchKnowledge: (keyword: string) => Promise<void>

  // 筛选方法
  setFilters: (filters: Partial<KnowledgeState['filters']>) => void
  clearFilter: (filterKey: keyof KnowledgeState['filters']) => void
  clearAllFilters: () => void
  applyFilters: () => Promise<void>
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  // ... 已有状态

  searchKeyword: '',
  filters: {
    tags: [],
    categoryId: null,
    status: 'all',
    dateFrom: null,
    dateTo: null
  },
  isFiltering: false,

  // 设置搜索关键词（实时搜索）
  setSearchKeyword: async (keyword: string) => {
    set({ searchKeyword: keyword, loading: true })

    // 防抖处理（300ms）
    const timeoutId = setTimeout(async () => {
      await get().searchKnowledge(keyword)
    }, 300)

    return () => clearTimeout(timeoutId)
  },

  // 搜索知识点
  searchKnowledge: async (keyword: string) => {
    set({ loading: true })

    try {
      const result = await window.electron.searchKnowledge(keyword)

      if (result.success && result.data) {
        set({
          knowledgeList: result.data,
          loading: false,
          error: null
        })
      } else {
        set({
          error: result.error || '搜索失败',
          loading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '搜索失败',
        loading: false
      })
    }
  },

  // 设置筛选条件
  setFilters: (newFilters: Partial<KnowledgeState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      isFiltering: true
    }))
  },

  // 清除单个筛选条件
  clearFilter: (filterKey: keyof KnowledgeState['filters']) => {
    set((state) => {
      const newFilters = { ...state.filters }

      if (filterKey === 'tags') {
        newFilters.tags = []
      } else if (filterKey === 'categoryId') {
        newFilters.categoryId = null
      } else if (filterKey === 'status') {
        newFilters.status = 'all'
      } else if (filterKey === 'dateFrom' || filterKey === 'dateTo') {
        newFilters[filterKey] = null
      }

      const isFiltering = Object.values(newFilters).some((v) =>
        Array.isArray(v) ? v.length > 0 : v !== null && v !== 'all'
      )

      return { filters: newFilters, isFiltering }
    })

    // 立即应用筛选
    get().applyFilters()
  },

  // 清除所有筛选条件
  clearAllFilters: () => {
    set({
      filters: {
        tags: [],
        categoryId: null,
        status: 'all',
        dateFrom: null,
        dateTo: null
      },
      isFiltering: false,
      searchKeyword: ''
    })

    // 重新加载所有知识点
    get().fetchKnowledgeList()
  },

  // 应用筛选
  applyFilters: async () => {
    const { filters, searchKeyword } = get()
    set({ loading: true })

    try {
      // 构建筛选参数
      const filterParams: any = {
        keyword: searchKeyword || undefined
      }

      if (filters.tags.length > 0) {
        filterParams.tags = filters.tags
      }
      if (filters.categoryId) {
        filterParams.categoryId = filters.categoryId
      }
      if (filters.status !== 'all') {
        filterParams.status = filters.status
      }
      if (filters.dateFrom) {
        filterParams.dateFrom = filters.dateFrom
      }
      if (filters.dateTo) {
        filterParams.dateTo = filters.dateTo
      }

      const result = await window.electron.filterKnowledge(filterParams)

      if (result.success && result.data) {
        set({
          knowledgeList: result.data,
          loading: false,
          error: null
        })
      } else {
        set({
          error: result.error || '筛选失败',
          loading: false
        })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '筛选失败',
        loading: false
      })
    }
  }
}))
```

---

### 步骤5: 创建SearchBar组件

**位置:** `src/renderer/src/components/SearchBar.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { Input, Button, Space } from 'antd';
import { SearchOutlined, FilterOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { debounce } from 'lodash-es';

const { Search } = Input;

interface SearchBarProps {
  onOpenAdvancedFilter: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onOpenAdvancedFilter }) => {
  const {
    searchKeyword,
    isFiltering,
    searchKnowledge,
    clearAllFilters,
  } = useKnowledgeStore();

  const [localKeyword, setLocalKeyword] = useState(searchKeyword);

  // 防抖搜索（300ms）
  const debouncedSearch = useCallback(
    debounce((keyword: string) => {
      searchKnowledge(keyword);
    }, 300),
    []
  );

  const handleSearch = (value: string) => {
    setLocalKeyword(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setLocalKeyword('');
    clearAllFilters();
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Search
        placeholder="搜索知识点标题或内容..."
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={localKeyword}
        onChange={(e) => handleSearch(e.target.value)}
        onSearch={handleSearch}
        style={{ flex: 1 }}
      />
      <Button
        icon={<FilterOutlined />}
        size="large"
        onClick={onOpenAdvancedFilter}
        type={isFiltering ? 'primary' : 'default'}
      >
        高级筛选
      </Button>
      {(localKeyword || isFiltering) && (
        <Button
          icon={<CloseCircleOutlined />}
          size="large"
          onClick={handleClear}
          danger
        >
          清除
        </Button>
      )}
    </Space.Compact>
  );
};
```

---

### 步骤6: 创建AdvancedFilter组件

**位置:** `src/renderer/src/components/AdvancedFilter.tsx`

```typescript
import React from 'react';
import { Modal, Form, Select, DatePicker, Space, Button, Tag } from 'antd';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AdvancedFilterProps {
  visible: boolean;
  onClose: () => void;
  tags: Array<{ id: string; name: string; color?: string }>;
  categories: Array<{ id: string; name: string }>;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  visible,
  onClose,
  tags,
  categories,
}) => {
  const { filters, setFilters, applyFilters, clearAllFilters } = useKnowledgeStore();
  const [form] = Form.useForm();

  // 初始化表单值
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        tags: filters.tags,
        categoryId: filters.categoryId,
        status: filters.status,
        dateRange: filters.dateFrom && filters.dateTo
          ? [dayjs(filters.dateFrom), dayjs(filters.dateTo)]
          : null,
      });
    }
  }, [visible, filters, form]);

  const handleApply = () => {
    const values = form.getFieldsValue();

    setFilters({
      tags: values.tags || [],
      categoryId: values.categoryId || null,
      status: values.status || 'all',
      dateFrom: values.dateRange?.[0]?.toISOString() || null,
      dateTo: values.dateRange?.[1]?.toISOString() || null,
    });

    applyFilters();
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    clearAllFilters();
    onClose();
  };

  return (
    <Modal
      title="高级筛选"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" onClick={handleReset}>
          重置
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          应用筛选
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          tags: [],
          categoryId: null,
          status: 'all',
          dateRange: null,
        }}
      >
        <Form.Item
          label="标签（多选）"
          name="tags"
          tooltip="选择多个标签时，只显示同时包含所有标签的知识点"
        >
          <Select
            mode="multiple"
            placeholder="选择标签..."
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {tags.map((tag) => (
              <Option key={tag.id} value={tag.id}>
                <Tag color={tag.color}>{tag.name}</Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="分类（单选）" name="categoryId">
          <Select placeholder="选择分类..." allowClear>
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="复习状态" name="status">
          <Select>
            <Option value="all">全部</Option>
            <Option value="learning">学习中</Option>
            <Option value="mastered">已掌握</Option>
          </Select>
        </Form.Item>

        <Form.Item label="创建日期范围" name="dateRange">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

---

### 步骤7: 创建FilterTags组件

**位置:** `src/renderer/src/components/FilterTags.tsx`

```typescript
import React from 'react';
import { Space, Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import dayjs from 'dayjs';

interface FilterTagsProps {
  tags: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export const FilterTags: React.FC<FilterTagsProps> = ({ tags, categories }) => {
  const { filters, searchKeyword, isFiltering, clearFilter, clearAllFilters } = useKnowledgeStore();

  if (!isFiltering && !searchKeyword) {
    return null;
  }

  const getTagName = (tagId: string) => {
    return tags.find((t) => t.id === tagId)?.name || tagId;
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Space wrap>
        <span style={{ color: '#666' }}>当前筛选：</span>

        {searchKeyword && (
          <Tag
            closable
            onClose={() => {
              useKnowledgeStore.setState({ searchKeyword: '' });
              clearAllFilters();
            }}
            color="blue"
          >
            关键词: {searchKeyword}
          </Tag>
        )}

        {filters.tags.map((tagId) => (
          <Tag
            key={tagId}
            closable
            onClose={() => {
              const newTags = filters.tags.filter((t) => t !== tagId);
              useKnowledgeStore.setState({
                filters: { ...filters, tags: newTags }
              });
              clearFilter('tags');
            }}
            color="green"
          >
            标签: {getTagName(tagId)}
          </Tag>
        ))}

        {filters.categoryId && (
          <Tag
            closable
            onClose={() => clearFilter('categoryId')}
            color="orange"
          >
            分类: {getCategoryName(filters.categoryId)}
          </Tag>
        )}

        {filters.status !== 'all' && (
          <Tag
            closable
            onClose={() => clearFilter('status')}
            color="purple"
          >
            状态: {filters.status === 'learning' ? '学习中' : '已掌握'}
          </Tag>
        )}

        {filters.dateFrom && filters.dateTo && (
          <Tag
            closable
            onClose={() => {
              clearFilter('dateFrom');
              clearFilter('dateTo');
            }}
            color="cyan"
          >
            日期: {dayjs(filters.dateFrom).format('YYYY-MM-DD')} ~ {dayjs(filters.dateTo).format('YYYY-MM-DD')}
          </Tag>
        )}

        {(isFiltering || searchKeyword) && (
          <Tag
            color="red"
            style={{ cursor: 'pointer' }}
            onClick={clearAllFilters}
            icon={<CloseOutlined />}
          >
            清除全部
          </Tag>
        )}
      </Space>
    </div>
  );
};
```

---

### 步骤8: 更新KnowledgeListPage集成搜索组件

**位置:** `src/renderer/src/pages/KnowledgeListPage.tsx`

**添加搜索UI:**

```typescript
import React, { useState, useEffect } from 'react';
import { Button, Empty, Spin, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { KnowledgeListItem } from '../components/KnowledgeListItem';
import { KnowledgeEditDialog } from '../components/KnowledgeEditDialog';
import { SearchBar } from '../components/SearchBar';
import { AdvancedFilter } from '../components/AdvancedFilter';
import { FilterTags } from '../components/FilterTags';

const { Title } = Typography;

export const KnowledgeListPage: React.FC = () => {
  const {
    knowledgeList,
    loading,
    error,
    fetchKnowledgeList,
    deleteKnowledge,
  } = useKnowledgeStore();

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [filterDialogVisible, setFilterDialogVisible] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<any>(null);

  // 模拟标签和分类列表（实际应该从store获取）
  const [tags, setTags] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchKnowledgeList();

    // 加载标签和分类
    // TODO: 从store获取
  }, [fetchKnowledgeList]);

  const handleCreate = () => {
    setEditingKnowledge(null);
    setEditDialogVisible(true);
  };

  const handleEdit = (knowledge: any) => {
    setEditingKnowledge(knowledge);
    setEditDialogVisible(true);
  };

  const handleDelete = async (id: string) => {
    await deleteKnowledge(id);
  };

  if (loading && knowledgeList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 标题栏 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>知识点管理</Title>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          快速记录
        </Button>
      </div>

      {/* 搜索栏 */}
      <div style={{ marginBottom: 16 }}>
        <SearchBar onOpenAdvancedFilter={() => setFilterDialogVisible(true)} />
      </div>

      {/* 筛选标签 */}
      <FilterTags tags={tags} categories={categories} />

      {/* 错误提示 */}
      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          错误: {error}
        </div>
      )}

      {/* 知识点列表 */}
      {knowledgeList.length === 0 ? (
        <Empty
          description="未找到匹配的知识点"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建新知识点
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {knowledgeList.map((knowledge) => (
            <KnowledgeListItem
              key={knowledge.id}
              knowledge={knowledge}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </Space>
      )}

      {/* 编辑对话框 */}
      <KnowledgeEditDialog
        visible={editDialogVisible}
        knowledge={editingKnowledge}
        onClose={() => {
          setEditDialogVisible(false);
          setEditingKnowledge(null);
        }}
      />

      {/* 高级筛选对话框 */}
      <AdvancedFilter
        visible={filterDialogVisible}
        onClose={() => setFilterDialogVisible(false)}
        tags={tags}
        categories={categories}
      />
    </div>
  );
};
```

---

### 步骤9: 实现关键词高亮显示

**位置:** `src/renderer/src/components/KnowledgeListItem.tsx`

**添加高亮函数:**

```typescript
import React from 'react';
import { Card, Typography, Tag, Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface KnowledgeListItemProps {
  knowledge: any;
  onEdit: (knowledge: any) => void;
  onDelete: (id: string) => void;
}

// 高亮关键词函数
const highlightKeyword = (text: string, keyword: string): React.ReactNode => {
  if (!keyword || !text) return text;

  const regex = new RegExp(`(${keyword})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} style={{ backgroundColor: '#ffd666', fontWeight: 'bold' }}>
        {part}
      </span>
    ) : (
      part
    )
  );
};

export const KnowledgeListItem: React.FC<KnowledgeListItemProps> = ({
  knowledge,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { searchKeyword } = useKnowledgeStore();

  return (
    <Card
      hoverable
      actions={[
        <Button
          key="view"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/knowledge/${knowledge.id}`)}
        >
          查看
        </Button>,
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(knowledge)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定删除此知识点吗？"
          onConfirm={() => onDelete(knowledge.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ]}
    >
      {/* 标题 */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
        {highlightKeyword(knowledge.title, searchKeyword)}
      </Text>

      {/* 内容预览 */}
      {knowledge.content && (
        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ color: '#666', marginBottom: 12 }}
        >
          {highlightKeyword(knowledge.content, searchKeyword)}
        </Paragraph>
      )}

      {/* 标签和分类 */}
      <Space wrap>
        {knowledge.tags?.map((tag: any) => (
          <Tag key={tag.id} color={tag.color}>
            {tag.name}
          </Tag>
        ))}
        {knowledge.category && (
          <Tag color="blue">{knowledge.category.name}</Tag>
        )}
      </Space>

      {/* 元数据 */}
      <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
        <Space split="|">
          <span>创建: {dayjs(knowledge.createdAt).format('YYYY-MM-DD')}</span>
          <span>更新: {dayjs(knowledge.updatedAt).format('YYYY-MM-DD')}</span>
          {knowledge.reviewCount > 0 && (
            <span>复习 {knowledge.reviewCount} 次</span>
          )}
        </Space>
      </div>
    </Card>
  );
};
```

---

## ✅ 验证清单

### 功能验证

- [ ] **搜索功能**
  - [ ] 输入关键词实时显示搜索结果
  - [ ] 搜索标题和内容都能匹配
  - [ ] 关键词高亮显示正确
  - [ ] 搜索框清空后显示所有知识点
  - [ ] 无结果时显示空状态和创建按钮

- [ ] **高级筛选**
  - [ ] 标签多选筛选工作正常（AND关系）
  - [ ] 分类单选筛选工作正常
  - [ ] 复习状态筛选（学习中/已掌握）
  - [ ] 日期范围筛选工作正常
  - [ ] 多个筛选条件组合正确（AND关系）

- [ ] **筛选条件显示**
  - [ ] 当前筛选条件以标签形式显示
  - [ ] 点击标签可清除单个筛选条件
  - [ ] 点击"清除全部"可重置所有筛选
  - [ ] 筛选结果实时更新

- [ ] **性能验证**
  - [ ] 搜索响应时间 < 300ms
  - [ ] 筛选响应时间 < 200ms
  - [ ] 防抖处理正确（输入停止300ms后触发搜索）
  - [ ] 1000+知识点测试通过

### 代码质量验证

- [ ] **TypeScript**
  - [ ] 所有新增代码类型定义完整
  - [ ] `npm run build` 编译通过
  - [ ] 无类型错误和警告

- [ ] **代码规范**
  - [ ] ESLint检查通过
  - [ ] 代码格式符合项目规范
  - [ ] 组件命名和文件结构正确

- [ ] **错误处理**
  - [ ] 搜索/筛选失败时显示友好提示
  - [ ] 网络异常处理正确
  - [ ] 边界情况处理完善

### UI/UX验证

- [ ] **交互体验**
  - [ ] 搜索框占位符清晰
  - [ ] 高级筛选按钮状态正确（有筛选时高亮）
  - [ ] 筛选标签颜色区分明确
  - [ ] 清除按钮位置合理

- [ ] **视觉效果**
  - [ ] 关键词高亮效果明显
  - [ ] 筛选标签样式美观
  - [ ] 空状态提示友好
  - [ ] 加载状态显示合理

---

## 📊 验收标准检查表

| AC编号 | 验收标准           | 验证方法           | 状态 |
| ------ | ------------------ | ------------------ | ---- |
| AC1    | 实时搜索功能       | 手动输入关键词测试 | ⬜   |
| AC1    | 关键词高亮显示     | 验证高亮效果       | ⬜   |
| AC1    | 搜索响应 < 300ms   | 性能测试           | ⬜   |
| AC2    | 搜索框为空显示全部 | 清空搜索框测试     | ⬜   |
| AC2    | 无结果显示提示     | 输入不存在的关键词 | ⬜   |
| AC2    | 快捷创建按钮       | 点击测试           | ⬜   |
| AC3    | 标签多选筛选       | 选择多个标签测试   | ⬜   |
| AC3    | 分类单选筛选       | 选择分类测试       | ⬜   |
| AC3    | 状态筛选           | 切换状态测试       | ⬜   |
| AC3    | 日期范围筛选       | 选择日期范围测试   | ⬜   |
| AC3    | 筛选条件标签显示   | 验证标签显示       | ⬜   |
| AC3    | 点击标签清除筛选   | 点击测试           | ⬜   |
| AC4    | 搜索性能 < 300ms   | 1000+知识点测试    | ⬜   |
| AC4    | 筛选性能 < 200ms   | 1000+知识点测试    | ⬜   |

---

## 📝 实现注意事项

### 性能优化

1. **搜索防抖**: 使用300ms防抖，避免频繁查询
2. **SQL优化**: 使用索引提升搜索性能
3. **结果缓存**: 可考虑缓存最近的搜索结果
4. **分页加载**: 如果结果过多，考虑分页显示

### 安全考虑

1. **SQL注入防护**: 使用参数化查询（better-sqlite3已提供）
2. **XSS防护**: 关键词高亮时需转义HTML
3. **输入验证**: 限制搜索关键词长度

### 用户体验

1. **实时反馈**: 搜索和筛选结果立即显示
2. **清晰提示**: 无结果时提供友好提示和操作建议
3. **状态保持**: 记住用户的筛选条件
4. **快捷操作**: 提供键盘快捷键（Ctrl+F打开搜索）

---

## 🚀 后续优化建议

1. **搜索历史**: 记录最近的搜索关键词
2. **智能推荐**: 根据搜索频率推荐标签
3. **模糊搜索**: 支持拼音和模糊匹配
4. **全文索引**: 使用FTS5提升搜索性能
5. **高级语法**: 支持AND/OR/NOT等搜索语法
6. **保存筛选**: 保存常用的筛选组合

---

## 📚 相关文档

- **Epic:** docs/stories/epic-2-knowledge.md
- **PRD:** docs/prd.md (FR40-FR43)
- **Architecture:** docs/architecture.md
- **依赖Story:**
  - Story 2.1: docs/stories/story-2.1-implementation-guide.md
  - Story 2.2: docs/stories/story-2.2-implementation-guide.md

---

## 🎯 Definition of Done

- [ ] 所有Acceptance Criteria验证通过
- [ ] 所有验收标准检查项完成
- [ ] TypeScript编译无错误和警告
- [ ] ESLint检查通过
- [ ] 代码已提交到版本控制
- [ ] 手动测试通过（包括性能测试）
- [ ] 代码审查完成
- [ ] 文档更新完成

---

**创建时间:** 2025-12-13  
**预计完成时间:** 6小时  
**实际完成时间:** _待填写_






