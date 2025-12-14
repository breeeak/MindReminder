import { useState } from 'react'
import { Select, Input, Modal, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Category } from '../types'

interface CategorySelectProps {
  value?: string | null
  onChange?: (categoryId: string) => void
  categories: Category[]
  onCreateCustom: (name: string) => Promise<void>
  placeholder?: string
}

/**
 * 分类选择组件
 * 支持预定义分类和自定义分类
 */
export const CategorySelect = ({
  value,
  onChange,
  categories,
  onCreateCustom,
  placeholder = '选择分类'
}: CategorySelectProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creating, setCreating] = useState(false)

  // 分组选项：预定义和自定义
  const predefinedCategories = categories.filter((c) => !c.isCustom)
  const customCategories = categories.filter((c) => c.isCustom)

  const options = [
    {
      label: '预定义分类',
      options: predefinedCategories.map((c) => ({
        label: c.name,
        value: c.id
      }))
    },
    ...(customCategories.length > 0
      ? [
          {
            label: '自定义分类',
            options: customCategories.map((c) => ({
              label: c.name,
              value: c.id
            }))
          }
        ]
      : [])
  ]

  // 处理创建自定义分类
  const handleCreateCustom = async () => {
    const name = newCategoryName.trim()

    if (!name) {
      message.warning('请输入分类名称')
      return
    }

    // 检查是否已存在
    if (categories.some((c) => c.name === name)) {
      message.warning('该分类已存在')
      return
    }

    try {
      setCreating(true)
      await onCreateCustom(name)
      message.success('创建成功')
      setIsModalOpen(false)
      setNewCategoryName('')
    } catch (error) {
      message.error('创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%' }}
        options={options}
        allowClear
        dropdownRender={(menu) => (
          <>
            {menu}
            <div
              style={{
                padding: '8px',
                borderTop: '1px solid #f0f0f0',
                cursor: 'pointer'
              }}
              onClick={() => setIsModalOpen(true)}
            >
              <PlusOutlined /> 添加自定义分类
            </div>
          </>
        )}
      />

      {/* 创建自定义分类对话框 */}
      <Modal
        title="创建自定义分类"
        open={isModalOpen}
        onOk={handleCreateCustom}
        onCancel={() => {
          setIsModalOpen(false)
          setNewCategoryName('')
        }}
        okText="创建"
        cancelText="取消"
        confirmLoading={creating}
      >
        <Input
          placeholder="输入分类名称"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onPressEnter={handleCreateCustom}
          autoFocus
        />
      </Modal>
    </>
  )
}
