import { useEffect, useState } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { useKnowledgeStore } from '../stores'
import { TagInput } from './TagInput'
import { CategorySelect } from './CategorySelect'
import type { Knowledge } from '../types'

interface KnowledgeEditDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  knowledge?: Knowledge // 编辑模式时传入
}

/**
 * 知识点编辑/创建对话框
 */
export const KnowledgeEditDialog = ({
  open,
  onClose,
  onSuccess,
  knowledge
}: KnowledgeEditDialogProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const createKnowledge = useKnowledgeStore((state) => state.createKnowledge)
  const updateKnowledge = useKnowledgeStore((state) => state.updateKnowledge)
  const tags = useKnowledgeStore((state) => state.tags)
  const categories = useKnowledgeStore((state) => state.categories)
  const loadTags = useKnowledgeStore((state) => state.loadTags)
  const loadCategories = useKnowledgeStore((state) => state.loadCategories)
  const addTagsToKnowledge = useKnowledgeStore((state) => state.addTagsToKnowledge)
  const createCustomCategory = useKnowledgeStore((state) => state.createCustomCategory)

  const isEditMode = !!knowledge

  // 加载标签和分类
  useEffect(() => {
    if (open) {
      loadTags()
      loadCategories()
    }
  }, [open, loadTags, loadCategories])

  // 当对话框打开或knowledge变化时，更新表单
  useEffect(() => {
    if (open) {
      if (knowledge) {
        form.setFieldsValue({
          title: knowledge.title,
          content: knowledge.content,
          tags: knowledge.tags || [],
          category: knowledge.category || null
        })
      } else {
        form.resetFields()
      }
    }
  }, [knowledge, form, open])

  // 处理提交
  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const data = {
        title: values.title.trim(),
        content: values.content?.trim() || '',
        tags: values.tags || [],
        category: values.category || undefined,
        updatedAt: Date.now()
      }

      if (isEditMode && knowledge) {
        // 编辑模式
        await updateKnowledge(knowledge.id, data)

        // 处理标签关联
        if (values.tags && values.tags.length > 0) {
          await addTagsToKnowledge(knowledge.id, values.tags)
        }

        message.success('更新成功')
      } else {
        // 创建模式
        const newKnowledge = await createKnowledge({
          ...data,
          createdAt: Date.now(),
          frequencyCoefficient: 1.0
        })

        // 处理标签关联（需要先获取创建的knowledge的ID）
        // 注意：createKnowledge需要返回创建的knowledge对象
        if (values.tags && values.tags.length > 0 && newKnowledge) {
          await addTagsToKnowledge((newKnowledge as any).id, values.tags)
        }

        message.success('保存成功')
      }

      form.resetFields()
      onSuccess?.()
    } catch (error) {
      if (error instanceof Error && error.message) {
        // 表单验证错误不显示message
        if (!error.message.includes('validateFields')) {
          message.error(isEditMode ? '更新失败' : '保存失败')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={isEditMode ? '编辑知识点' : '快速记录'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      okText={isEditMode ? '更新' : '保存'}
      cancelText="取消"
    >
      <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
        <Form.Item
          label="标题"
          name="title"
          rules={[
            { required: true, message: '请输入标题' },
            { max: 200, message: '标题不能超过200个字符' }
          ]}
        >
          <Input placeholder="用问题的形式描述，例如：什么是闭包？" autoFocus />
        </Form.Item>

        <Form.Item
          label="内容"
          name="content"
          rules={[{ max: 10000, message: '内容不能超过10000个字符' }]}
        >
          <Input.TextArea rows={6} placeholder="详细答案（可选，支持Markdown）" />
        </Form.Item>

        <Form.Item label="标签" name="tags">
          <TagInput allTags={tags} />
        </Form.Item>

        <Form.Item label="分类" name="category">
          <CategorySelect categories={categories} onCreateCustom={createCustomCategory} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
