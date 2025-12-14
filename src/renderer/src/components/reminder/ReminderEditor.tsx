import React, { useEffect } from 'react'
import { Modal, Form, Input, DatePicker, Button } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import type { Reminder } from '../../types'
import { useReminderStore } from '../../stores/reminderStore'

interface ReminderEditorProps {
  reminder?: Reminder // 编辑模式:传入现有提醒
  defaultDate?: string // YYYY-MM-DD
  open: boolean
  onClose: () => void
}

export const ReminderEditor: React.FC<ReminderEditorProps> = ({
  reminder,
  defaultDate,
  open,
  onClose
}) => {
  const [form] = Form.useForm()
  const { saving, createReminder, updateReminder } = useReminderStore()

  // 初始化表单
  useEffect(() => {
    if (open) {
      if (reminder) {
        // 编辑模式:填充现有数据
        form.setFieldsValue({
          title: reminder.title,
          content: reminder.content,
          dueDateTime: dayjs(reminder.dueDate)
        })
      } else {
        // 创建模式:使用默认值
        const defaultDateTime = defaultDate
          ? dayjs(defaultDate).hour(9).minute(0)
          : dayjs().add(1, 'hour')

        form.setFieldsValue({
          title: '',
          content: '',
          dueDateTime: defaultDateTime
        })
      }
    }
  }, [open, reminder, defaultDate, form])

  // 保存提醒
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const dueDate = (values.dueDateTime as Dayjs).valueOf()

      if (reminder) {
        // 更新模式
        await updateReminder(reminder.id, {
          title: values.title,
          content: values.content,
          dueDate
        })
      } else {
        // 创建模式
        await createReminder({
          title: values.title,
          content: values.content,
          dueDate
        })
      }

      form.resetFields()
      onClose()
    } catch (error) {
      // 错误已在 store 中处理
    }
  }

  return (
    <Modal
      title={reminder ? '编辑提醒' : '添加提醒'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          保存
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="如:晚上复习英语单词" maxLength={100} />
        </Form.Item>

        <Form.Item label="描述" name="content">
          <Input.TextArea placeholder="添加详细描述(可选)" rows={3} maxLength={500} />
        </Form.Item>

        <Form.Item
          label="提醒时间"
          name="dueDateTime"
          rules={[{ required: true, message: '请选择提醒时间' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
