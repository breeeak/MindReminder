import React from 'react'
import { Button, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Diary } from '../../types'
import ReactMarkdown from 'react-markdown'
import './DiaryViewer.css'

interface DiaryViewerProps {
  diary: Diary
  onEdit: () => void
  onDelete: () => void
}

export const DiaryViewer: React.FC<DiaryViewerProps> = ({ diary, onEdit, onDelete }) => {
  return (
    <div className="diary-viewer">
      <div className="diary-header">
        <h3>📝 日记 - {diary.date}</h3>
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这篇日记吗？"
            description="删除后将无法恢复"
            onConfirm={onDelete}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <div className="diary-content">
        <ReactMarkdown>{diary.content}</ReactMarkdown>
      </div>

      <div className="diary-meta">
        <span>创建时间：{new Date(diary.createdAt).toLocaleString('zh-CN')}</span>
        {diary.updatedAt !== diary.createdAt && (
          <span>更新时间：{new Date(diary.updatedAt).toLocaleString('zh-CN')}</span>
        )}
      </div>
    </div>
  )
}





