import React, { useEffect } from 'react'
import { Modal, Form, Select, DatePicker, Button, Tag } from 'antd'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

interface AdvancedFilterProps {
  visible: boolean
  onClose: () => void
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ visible, onClose }) => {
  const { filters, tags, categories, setFilters, applyFilters, clearAllFilters } =
    useKnowledgeStore()
  const [form] = Form.useForm()

  // 初始化表单值
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        tags: filters.tags,
        categoryId: filters.categoryId,
        status: filters.status,
        dateRange:
          filters.dateFrom && filters.dateTo
            ? [
                dayjs(isNaN(Number(filters.dateFrom)) ? filters.dateFrom : Number(filters.dateFrom)),
                dayjs(isNaN(Number(filters.dateTo)) ? filters.dateTo : Number(filters.dateTo))
              ]
            : null
      })
    }
  }, [visible, filters, form])

  const handleApply = () => {
    const values = form.getFieldsValue()

    setFilters({
      tags: values.tags || [],
      categoryId: values.categoryId || null,
      status: values.status || 'all',
      dateFrom: values.dateRange?.[0]?.startOf('day').valueOf().toString() || null,
      dateTo: values.dateRange?.[1]?.endOf('day').valueOf().toString() || null
    })

    applyFilters()
    onClose()
  }

  const handleReset = () => {
    form.resetFields()
    clearAllFilters()
    onClose()
  }

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
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          tags: [],
          categoryId: null,
          status: 'all',
          dateRange: null
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
                <Tag color="blue">{tag.name}</Tag>
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
  )
}








