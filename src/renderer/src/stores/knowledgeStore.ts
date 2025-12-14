import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Knowledge, Tag, Category, ReviewHistory, ReviewStatistics } from '../types'

/**
 * 知识点状态接口
 */
interface KnowledgeState {
  // 状态
  knowledgeList: Knowledge[]
  currentKnowledge: Knowledge | null
  isLoading: boolean
  error: string | null

  // 详情页状态
  reviewHistory: ReviewHistory[]
  reviewStatistics: ReviewStatistics | null
  detailLoading: boolean
  detailError: string | null

  // 标签和分类
  tags: Tag[]
  categories: Category[]
  selectedTags: string[] // 筛选用的标签ID
  selectedCategory: string | null // 筛选用的分类ID

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

  // 操作方法
  loadKnowledgeList: () => Promise<void>
  loadKnowledge: (id: string) => Promise<void>
  createKnowledge: (data: Partial<Knowledge>) => Promise<void>
  updateKnowledge: (id: string, data: Partial<Knowledge>) => Promise<void>
  deleteKnowledge: (id: string) => Promise<void>
  searchKnowledge: (keyword: string) => Promise<void>

  // 详情页方法
  fetchKnowledgeDetail: (id: string) => Promise<void>
  fetchReviewHistory: (id: string, limit?: number) => Promise<void>
  updateReviewFrequency: (id: string, frequency: number) => Promise<void>
  clearDetail: () => void

  // 标签相关
  loadTags: () => Promise<void>
  addTagsToKnowledge: (knowledgeId: string, tagNames: string[]) => Promise<void>
  removeTagsFromKnowledge: (knowledgeId: string, tagIds: string[]) => Promise<void>
  getKnowledgeTags: (knowledgeId: string) => Promise<Tag[]>

  // 分类相关
  loadCategories: () => Promise<void>
  createCustomCategory: (name: string) => Promise<void>

  // 筛选相关
  setSelectedTags: (tagIds: string[]) => void
  setSelectedCategory: (categoryId: string | null) => void
  filterByTags: (tagIds: string[]) => Promise<void>
  filterByCategory: (categoryId: string) => Promise<void>
  clearFilters: () => Promise<void>

  // 高级搜索和筛选
  setSearchKeyword: (keyword: string) => void
  setFilters: (filters: Partial<KnowledgeState['filters']>) => void
  clearFilter: (filterKey: keyof KnowledgeState['filters']) => void
  clearAllFilters: () => void
  applyFilters: () => Promise<void>

  clearError: () => void
  clearCurrent: () => void
}

/**
 * 知识点状态 Store
 * 管理知识点数据和业务逻辑
 */
export const useKnowledgeStore = create<KnowledgeState>()(
  devtools(
    (set) => ({
      // 初始状态
      knowledgeList: [],
      currentKnowledge: null,
      isLoading: false,
      error: null,
      tags: [],
      categories: [],
      selectedTags: [],
      selectedCategory: null,
      searchKeyword: '',
      filters: {
        tags: [],
        categoryId: null,
        status: 'all',
        dateFrom: null,
        dateTo: null
      },
      isFiltering: false,

      // 详情页初始状态
      reviewHistory: [],
      reviewStatistics: null,
      detailLoading: false,
      detailError: null,

      // 加载所有知识点
      loadKnowledgeList: async () => {
        set({ isLoading: true, error: null }, false, 'knowledge/loadKnowledgeList/pending')

        try {
          const response = await window.api.knowledge.findAll()
          set(
            {
              knowledgeList: response.data,
              isLoading: false
            },
            false,
            'knowledge/loadKnowledgeList/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加载知识点列表失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/loadKnowledgeList/rejected'
          )
          console.error('Failed to load knowledge list:', error)
        }
      },

      // 加载单个知识点
      loadKnowledge: async (id: string) => {
        set({ isLoading: true, error: null }, false, 'knowledge/loadKnowledge/pending')

        try {
          const response = await window.api.knowledge.findById(id)
          set(
            {
              currentKnowledge: response.data,
              isLoading: false
            },
            false,
            'knowledge/loadKnowledge/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加载知识点失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/loadKnowledge/rejected'
          )
          console.error('Failed to load knowledge:', error)
        }
      },

      // 创建知识点
      createKnowledge: async (data: Partial<Knowledge>) => {
        set({ isLoading: true, error: null }, false, 'knowledge/createKnowledge/pending')

        try {
          const response = await window.api.knowledge.create(data)
          const newKnowledge = response.data

          set(
            (state) => ({
              knowledgeList: [...state.knowledgeList, newKnowledge],
              currentKnowledge: newKnowledge,
              isLoading: false
            }),
            false,
            'knowledge/createKnowledge/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '创建知识点失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/createKnowledge/rejected'
          )
          console.error('Failed to create knowledge:', error)
          throw error // 重新抛出错误，让UI组件可以处理
        }
      },

      // 更新知识点
      updateKnowledge: async (id: string, data: Partial<Knowledge>) => {
        set({ isLoading: true, error: null }, false, 'knowledge/updateKnowledge/pending')

        try {
          const response = await window.api.knowledge.update(id, data)
          const updatedKnowledge = response.data

          set(
            (state) => ({
              knowledgeList: state.knowledgeList.map((k) => (k.id === id ? updatedKnowledge : k)),
              currentKnowledge:
                state.currentKnowledge?.id === id ? updatedKnowledge : state.currentKnowledge,
              isLoading: false
            }),
            false,
            'knowledge/updateKnowledge/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '更新知识点失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/updateKnowledge/rejected'
          )
          console.error('Failed to update knowledge:', error)
          throw error
        }
      },

      // 删除知识点
      deleteKnowledge: async (id: string) => {
        set({ isLoading: true, error: null }, false, 'knowledge/deleteKnowledge/pending')

        try {
          await window.api.knowledge.delete(id)

          set(
            (state) => ({
              knowledgeList: state.knowledgeList.filter((k) => k.id !== id),
              currentKnowledge: state.currentKnowledge?.id === id ? null : state.currentKnowledge,
              isLoading: false
            }),
            false,
            'knowledge/deleteKnowledge/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '删除知识点失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/deleteKnowledge/rejected'
          )
          console.error('Failed to delete knowledge:', error)
          throw error
        }
      },

      // 搜索知识点
      searchKnowledge: async (keyword: string) => {
        set({ isLoading: true, error: null }, false, 'knowledge/searchKnowledge/pending')

        try {
          const response = await window.api.knowledge.search(keyword)
          set(
            {
              knowledgeList: response.data,
              isLoading: false
            },
            false,
            'knowledge/searchKnowledge/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '搜索知识点失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/searchKnowledge/rejected'
          )
          console.error('Failed to search knowledge:', error)
        }
      },

      // 加载所有标签
      loadTags: async () => {
        try {
          const response = await window.api.tags.getAll()
          set({ tags: response.data }, false, 'knowledge/loadTags')
        } catch (error) {
          console.error('Failed to load tags:', error)
        }
      },

      // 为知识点添加标签
      addTagsToKnowledge: async (knowledgeId: string, tagNames: string[]) => {
        try {
          // 先查找或创建标签
          const tagsResponse = await window.api.tags.findOrCreate(tagNames)
          const tagIds = tagsResponse.data.map((tag) => tag.id)

          // 添加标签关联
          await window.api.knowledge.addTags(knowledgeId, tagIds)

          // 重新加载标签列表
          await useKnowledgeStore.getState().loadTags()
        } catch (error) {
          console.error('Failed to add tags to knowledge:', error)
          throw error
        }
      },

      // 移除知识点的标签
      removeTagsFromKnowledge: async (knowledgeId: string, tagIds: string[]) => {
        try {
          await window.api.knowledge.removeTags(knowledgeId, tagIds)
        } catch (error) {
          console.error('Failed to remove tags from knowledge:', error)
          throw error
        }
      },

      // 获取知识点的标签
      getKnowledgeTags: async (knowledgeId: string): Promise<Tag[]> => {
        try {
          const response = await window.api.knowledge.getTags(knowledgeId)
          return response.data
        } catch (error) {
          console.error('Failed to get knowledge tags:', error)
          return []
        }
      },

      // 加载所有分类
      loadCategories: async () => {
        try {
          const response = await window.api.categories.getAll()
          set({ categories: response.data }, false, 'knowledge/loadCategories')
        } catch (error) {
          console.error('Failed to load categories:', error)
        }
      },

      // 创建自定义分类
      createCustomCategory: async (name: string) => {
        try {
          const response = await window.api.categories.createCustom(name)
          console.log('Custom category created:', response)
          // 重新加载分类列表
          await useKnowledgeStore.getState().loadCategories()
        } catch (error) {
          console.error('Failed to create custom category:', error)
          const errorMessage = error instanceof Error ? error.message : '创建自定义分类失败'
          throw new Error(errorMessage)
        }
      },

      // 设置筛选标签
      setSelectedTags: (tagIds: string[]) => {
        set({ selectedTags: tagIds }, false, 'knowledge/setSelectedTags')
      },

      // 设置筛选分类
      setSelectedCategory: (categoryId: string | null) => {
        set({ selectedCategory: categoryId }, false, 'knowledge/setSelectedCategory')
      },

      // 按标签筛选
      filterByTags: async (tagIds: string[]) => {
        set(
          { isLoading: true, error: null, selectedTags: tagIds },
          false,
          'knowledge/filterByTags/pending'
        )

        try {
          const response = await window.api.knowledge.filterByTags(tagIds)
          set(
            {
              knowledgeList: response.data,
              isLoading: false
            },
            false,
            'knowledge/filterByTags/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '按标签筛选失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/filterByTags/rejected'
          )
          console.error('Failed to filter by tags:', error)
        }
      },

      // 按分类筛选
      filterByCategory: async (categoryId: string) => {
        set(
          { isLoading: true, error: null, selectedCategory: categoryId },
          false,
          'knowledge/filterByCategory/pending'
        )

        try {
          const response = await window.api.knowledge.filterByCategory(categoryId)
          set(
            {
              knowledgeList: response.data,
              isLoading: false
            },
            false,
            'knowledge/filterByCategory/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '按分类筛选失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/filterByCategory/rejected'
          )
          console.error('Failed to filter by category:', error)
        }
      },

      // 清除筛选
      clearFilters: async () => {
        set({ selectedTags: [], selectedCategory: null }, false, 'knowledge/clearFilters')
        await useKnowledgeStore.getState().loadKnowledgeList()
      },

      // 设置搜索关键词
      setSearchKeyword: (keyword: string) => {
        set({ searchKeyword: keyword }, false, 'knowledge/setSearchKeyword')
      },

      // 设置筛选条件
      setFilters: (newFilters: Partial<KnowledgeState['filters']>) => {
        set(
          (state) => ({
            filters: { ...state.filters, ...newFilters },
            isFiltering: true
          }),
          false,
          'knowledge/setFilters'
        )
      },

      // 清除单个筛选条件
      clearFilter: (filterKey: keyof KnowledgeState['filters']) => {
        set(
          (state) => {
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
          },
          false,
          'knowledge/clearFilter'
        )

        // 立即应用筛选
        useKnowledgeStore.getState().applyFilters()
      },

      // 清除所有筛选条件
      clearAllFilters: () => {
        set(
          {
            filters: {
              tags: [],
              categoryId: null,
              status: 'all',
              dateFrom: null,
              dateTo: null
            },
            isFiltering: false,
            searchKeyword: ''
          },
          false,
          'knowledge/clearAllFilters'
        )

        // 重新加载所有知识点
        useKnowledgeStore.getState().loadKnowledgeList()
      },

      // 应用筛选
      applyFilters: async () => {
        const state = useKnowledgeStore.getState()
        const { filters, searchKeyword } = state

        set({ isLoading: true, error: null }, false, 'knowledge/applyFilters/pending')

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

          const response = await window.api.knowledge.filter(filterParams)

          set(
            {
              knowledgeList: response.data,
              isLoading: false
            },
            false,
            'knowledge/applyFilters/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '筛选失败'
          set(
            {
              isLoading: false,
              error: errorMessage
            },
            false,
            'knowledge/applyFilters/rejected'
          )
          console.error('Failed to apply filters:', error)
        }
      },

      // 清除错误
      clearError: () => set({ error: null }, false, 'knowledge/clearError'),

      // 获取知识点详情
      fetchKnowledgeDetail: async (id: string) => {
        set(
          { detailLoading: true, detailError: null },
          false,
          'knowledge/fetchKnowledgeDetail/pending'
        )

        try {
          const response = await window.api.knowledge.getById(id)
          set(
            {
              currentKnowledge: response.data,
              detailLoading: false
            },
            false,
            'knowledge/fetchKnowledgeDetail/fulfilled'
          )
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加载知识点详情失败'
          set(
            {
              detailError: errorMessage,
              detailLoading: false
            },
            false,
            'knowledge/fetchKnowledgeDetail/rejected'
          )
          console.error('Failed to fetch knowledge detail:', error)
          throw error
        }
      },

      // 获取复习历史
      fetchReviewHistory: async (id: string, limit?: number) => {
        try {
          const [historyResponse, statsResponse] = await Promise.all([
            window.api.review.getByKnowledge(id, limit),
            window.api.review.getStatistics(id)
          ])

          set(
            {
              reviewHistory: historyResponse.data,
              reviewStatistics: statsResponse.data
            },
            false,
            'knowledge/fetchReviewHistory'
          )
        } catch (error) {
          console.error('Failed to fetch review history:', error)
          throw error
        }
      },

      // 更新复习频率
      updateReviewFrequency: async (id: string, frequency: number) => {
        try {
          const response = await window.api.knowledge.updateFrequency(id, frequency)

          // 更新当前详情
          set({ currentKnowledge: response.data }, false, 'knowledge/updateReviewFrequency')

          // 同时更新列表中的对应项（如果存在）
          set(
            (state) => ({
              knowledgeList: state.knowledgeList.map((k) => (k.id === id ? response.data : k))
            }),
            false,
            'knowledge/updateReviewFrequency/list'
          )
        } catch (error) {
          console.error('Failed to update review frequency:', error)
          throw error
        }
      },

      // 清除详情页状态
      clearDetail: () => {
        set(
          {
            currentKnowledge: null,
            reviewHistory: [],
            reviewStatistics: null,
            detailError: null
          },
          false,
          'knowledge/clearDetail'
        )
      },

      // 清除当前知识点
      clearCurrent: () => set({ currentKnowledge: null }, false, 'knowledge/clearCurrent')
    }),
    {
      name: 'KnowledgeStore',
      enabled: import.meta.env.DEV
    }
  )
)
