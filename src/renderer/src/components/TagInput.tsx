import { useState, useEffect } from 'react'
import { Tag, AutoComplete, Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Tag as TagType } from '../types'

interface TagInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  allTags: TagType[]
  placeholder?: string
}

/**
 * 标签输入组件
 * 支持自动完成和标签显示
 */
export const TagInput = ({
  value = [],
  onChange,
  allTags,
  placeholder = '输入标签（逗号或空格分隔）'
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<{ value: string }[]>([])

  // 当用户输入时，显示匹配的标签建议
  useEffect(() => {
    if (inputValue) {
      const filtered = allTags
        .filter(
          (tag) =>
            tag.name.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(tag.name)
        )
        .slice(0, 10)
        .map((tag) => ({ value: tag.name }))

      setOptions(filtered)
    } else {
      setOptions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, allTags])

  // 处理标签添加
  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange?.([...value, trimmed])
      setInputValue('')
    }
  }

  // 处理输入框按键
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      if (inputValue.trim()) {
        handleAddTag(inputValue)
      }
    }
  }

  // 处理标签删除
  const handleRemoveTag = (tagToRemove: string) => {
    onChange?.(value.filter((tag) => tag !== tagToRemove))
  }

  // 处理自动完成选择
  const handleSelect = (selectedValue: string) => {
    handleAddTag(selectedValue)
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 已选标签显示 */}
      <div style={{ marginBottom: value.length > 0 ? 8 : 0 }}>
        {value.map((tag) => (
          <Tag key={tag} closable onClose={() => handleRemoveTag(tag)} style={{ marginBottom: 8 }}>
            {tag}
          </Tag>
        ))}
      </div>

      {/* 标签输入框 */}
      <AutoComplete
        value={inputValue}
        options={options}
        style={{ width: '100%' }}
        onSelect={handleSelect}
        onChange={setInputValue}
        onBlur={() => {
          // 失去焦点时，如果有内容则添加为标签
          if (inputValue.trim()) {
            handleAddTag(inputValue)
          }
        }}
      >
        <Input placeholder={placeholder} prefix={<PlusOutlined />} onKeyDown={handleKeyPress} />
      </AutoComplete>
    </div>
  )
}
