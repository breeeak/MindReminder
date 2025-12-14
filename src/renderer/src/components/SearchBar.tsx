import React, { useState, useCallback, useEffect } from 'react'
import { Input, Button, Space } from 'antd'
import { SearchOutlined, FilterOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useKnowledgeStore } from '../stores/knowledgeStore'

const { Search } = Input

interface SearchBarProps {
  onOpenAdvancedFilter: () => void
}

export const SearchBar: React.FC<SearchBarProps> = ({ onOpenAdvancedFilter }) => {
  const { searchKeyword, isFiltering, setSearchKeyword, applyFilters, clearAllFilters } =
    useKnowledgeStore()

  const [localKeyword, setLocalKeyword] = useState(searchKeyword)

  // 同步外部关键词到本地状态
  useEffect(() => {
    setLocalKeyword(searchKeyword)
  }, [searchKeyword])

  // 防抖搜索（300ms）
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return (keyword: string) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setSearchKeyword(keyword)
          applyFilters()
        }, 300)
      }
    })(),
    [setSearchKeyword, applyFilters]
  )

  const handleSearch = (value: string) => {
    setLocalKeyword(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setLocalKeyword('')
    clearAllFilters()
  }

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
        <Button icon={<CloseCircleOutlined />} size="large" onClick={handleClear} danger>
          清除
        </Button>
      )}
    </Space.Compact>
  )
}



