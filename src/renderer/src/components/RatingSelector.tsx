import React, { useEffect } from 'react'
import { Space, Button, Typography } from 'antd'
import { useReviewStore } from '../stores/reviewStore'

const { Text } = Typography

const ratings = [
  { value: 1, emoji: '😟', label: '忘记了', color: '#ff4d4f', shortcut: '1' },
  { value: 2, emoji: '🤔', label: '记得一点', color: '#fa8c16', shortcut: '2' },
  { value: 3, emoji: '😐', label: '记得一般', color: '#fadb14', shortcut: '3' },
  { value: 4, emoji: '😊', label: '记得还可以', color: '#a0d911', shortcut: '4' },
  { value: 5, emoji: '🎯', label: '非常熟悉', color: '#52c41a', shortcut: '5' }
]

/**
 * RatingSelector - 评分选择器组件
 * 显示5级表情符号评分，支持键盘快捷键
 */
const RatingSelector: React.FC = () => {
  const submitRating = useReviewStore((state) => state.submitRating)

  // 键盘快捷键（数字1-5）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      if (['1', '2', '3', '4', '5'].includes(key)) {
        e.preventDefault()
        submitRating(Number(key))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitRating])

  return (
    <div>
      <Text
        strong
        style={{
          display: 'block',
          textAlign: 'center',
          marginBottom: '16px',
          fontSize: '16px'
        }}
      >
        记忆程度如何？
      </Text>
      <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
        {ratings.map((rating) => (
          <Button
            key={rating.value}
            onClick={() => submitRating(rating.value)}
            style={{
              height: '100px',
              width: '100px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: rating.color,
              borderWidth: '2px'
            }}
            className="rating-button"
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{rating.emoji}</div>
            <Text style={{ fontSize: '12px' }}>{rating.label}</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              ({rating.shortcut})
            </Text>
          </Button>
        ))}
      </Space>
    </div>
  )
}

export default React.memo(RatingSelector)





