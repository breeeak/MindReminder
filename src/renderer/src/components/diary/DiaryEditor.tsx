import React, { useState, useEffect } from 'react'
import { Modal, Button, message } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import { useDiaryStore } from '../../stores/diaryStore'
import './DiaryEditor.css'

interface DiaryEditorProps {
  date: string // YYYY-MM-DD
  open: boolean
  onClose: () => void
}

export const DiaryEditor: React.FC<DiaryEditorProps> = ({ date, open, onClose }) => {
  const [content, setContent] = useState('')
  const { currentDiary, saving, saveDiary, fetchDiaryByDate } = useDiaryStore()

  // 加载现有日记
  useEffect(() => {
    if (open) {
      fetchDiaryByDate(date).then(() => {
        if (currentDiary && currentDiary.date === date) {
          setContent(currentDiary.content)
        } else {
          setContent('')
        }
      })
    }
  }, [open, date])

  // 保存日记
  const handleSave = async () => {
    if (!content.trim()) {
      message.warning('日记内容不能为空')
      return
    }

    try {
      await saveDiary({ date, content })
      onClose()
    } catch (error) {
      // 错误已在 store 中处理
    }
  }

  // Markdown 工具栏操作
  const insertMarkdown = (syntax: string, placeholder: string = '') => {
    const textarea = document.getElementById('diary-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newText =
      content.substring(0, start) + syntax.replace('{}', textToInsert) + content.substring(end)

    setContent(newText)

    // 恢复焦点和选区
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + syntax.indexOf('{}') + textToInsert.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <Modal
      title={`编辑日记 - ${date}`}
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          保存
        </Button>
      ]}
    >
      <div className="diary-editor">
        {/* Markdown 工具栏 */}
        <div className="diary-toolbar">
          <Button
            size="small"
            icon={<BoldOutlined />}
            onClick={() => insertMarkdown('**{}**', '加粗文字')}
            title="加粗 (Ctrl+B)"
          />
          <Button
            size="small"
            icon={<ItalicOutlined />}
            onClick={() => insertMarkdown('*{}*', '斜体文字')}
            title="斜体 (Ctrl+I)"
          />
          <Button size="small" onClick={() => insertMarkdown('## {}', '标题')} title="标题">
            H
          </Button>
          <Button
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => insertMarkdown('- {}', '列表项')}
            title="无序列表"
          />
          <Button
            size="small"
            icon={<OrderedListOutlined />}
            onClick={() => insertMarkdown('1. {}', '列表项')}
            title="有序列表"
          />
          <Button size="small" onClick={() => insertMarkdown('> {}', '引用内容')} title="引用">
            &quot;
          </Button>
        </div>

        {/* 文本编辑器 */}
        <textarea
          id="diary-textarea"
          className="diary-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            '在这里写下今天的学习心得和思考...\n\n支持 Markdown 格式：\n- **加粗** *斜体*\n- ## 标题\n- - 列表\n- > 引用'
          }
          rows={15}
        />

        {/* 字数统计 */}
        <div className="diary-footer">
          <span className="char-count">{content.length} 字</span>
        </div>
      </div>
    </Modal>
  )
}
