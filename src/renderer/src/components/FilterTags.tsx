import React from 'react'
import { Space, Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import dayjs from 'dayjs'

export const FilterTags: React.FC = () => {
  const {
    filters,
    searchKeyword,
    isFiltering,
    tags,
    categories,
    setFilters,
    setSearchKeyword,
    clearFilter,
    clearAllFilters
  } = useKnowledgeStore()

  if (!isFiltering && !searchKeyword) {
    return null
  }

  const getTagName = (tagId: string) => {
    return tags.find((t) => t.id === tagId)?.name || tagId
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId
  }

  const handleRemoveTag = (tagId: string) => {
    const newTags = filters.tags.filter((t) => t !== tagId)
    setFilters({ tags: newTags })
    clearFilter('tags')
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Space wrap>
        <span style={{ color: '#666' }}>当前筛选：</span>

        {searchKeyword && (
          <Tag
            closable
            onClose={() => {
              setSearchKeyword('')
              clearAllFilters()
            }}
            color="blue"
          >
            关键词: {searchKeyword}
          </Tag>
        )}

        {filters.tags.map((tagId) => (
          <Tag key={tagId} closable onClose={() => handleRemoveTag(tagId)} color="green">
            标签: {getTagName(tagId)}
          </Tag>
        ))}

        {filters.categoryId && (
          <Tag closable onClose={() => clearFilter('categoryId')} color="orange">
            分类: {getCategoryName(filters.categoryId)}
          </Tag>
        )}

        {filters.status !== 'all' && (
          <Tag closable onClose={() => clearFilter('status')} color="purple">
            状态: {filters.status === 'learning' ? '学习中' : '已掌握'}
          </Tag>
        )}

        {filters.dateFrom && filters.dateTo && (
          <Tag
            closable
            onClose={() => {
              clearFilter('dateFrom')
              clearFilter('dateTo')
            }}
            color="cyan"
          >
            日期: {dayjs(isNaN(Number(filters.dateFrom)) ? filters.dateFrom : Number(filters.dateFrom)).format('YYYY-MM-DD')} ~{' '}
            {dayjs(isNaN(Number(filters.dateTo)) ? filters.dateTo : Number(filters.dateTo)).format('YYYY-MM-DD')}
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
  )
}






