import { Card, Space, Typography, Tag } from 'antd'
import type { Knowledge } from '../types'
import { useKnowledgeStore } from '../stores/knowledgeStore'

const { Title, Text, Paragraph } = Typography

interface KnowledgeListItemProps {
  knowledge: Knowledge
  onClick?: () => void
  onTagClick?: (tag: string) => void
}

// 高亮关键词函数
const highlightKeyword = (text: string, keyword: string): React.ReactNode => {
  if (!keyword || !text) return text

  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} style={{ backgroundColor: '#ffd666', fontWeight: 'bold' }}>
        {part}
      </span>
    ) : (
      part
    )
  )
}

/**
 * 知识点列表项组件
 */
export const KnowledgeListItem = ({ knowledge, onClick, onTagClick }: KnowledgeListItemProps) => {
  const { searchKeyword } = useKnowledgeStore()

  // 处理标签点击
  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation() // 阻止冒泡到Card的onClick
    onTagClick?.(tag)
  }

  return (
    <Card hoverable style={{ marginBottom: '16px', cursor: 'pointer' }} onClick={onClick}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 标题 */}
        <Title level={4} style={{ margin: 0 }}>
          {highlightKeyword(knowledge.title, searchKeyword)}
        </Title>

        {/* 内容预览 */}
        {knowledge.content && (
          <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#666', marginBottom: 8 }}>
            {highlightKeyword(knowledge.content, searchKeyword)}
          </Paragraph>
        )}

        {/* 标签 */}
        {knowledge.tags && knowledge.tags.length > 0 && (
          <Space wrap>
            {knowledge.tags.map((tag) => (
              <Tag
                key={tag}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleTagClick(e, tag)}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        )}

        {/* 创建时间 */}
        <Text type="secondary">创建于 {new Date(knowledge.createdAt).toLocaleString('zh-CN')}</Text>
      </Space>
    </Card>
  )
}
