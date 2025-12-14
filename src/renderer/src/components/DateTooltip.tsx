import React from 'react'
import { theme } from 'antd'
import dayjs from 'dayjs'

interface DateTooltipProps {
  date: string
  knowledgeCount: number
  reviewCount: number
  totalActivity: number
}

export const DateTooltip: React.FC<DateTooltipProps> = ({
  date,
  knowledgeCount,
  reviewCount,
  totalActivity
}) => {
  const { token } = theme.useToken()
  
  // Tooltip 在深色主题下背景是浅色，需要深色文字
  // 在浅色主题下背景是深色，需要浅色文字
  // 通过检测背景色来判断
  const isDarkBg = token.colorBgBase === '#141414' // 深色主题
  const textColor = isDarkBg ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.95)'
  const secondaryColor = isDarkBg ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.75)'
  
  return (
    <div style={{ padding: '4px 8px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: textColor }}>
        {dayjs(date).format('YYYY年MM月DD日')}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: secondaryColor }}>
        <div>新增知识点: {knowledgeCount} 个</div>
        <div>复习次数: {reviewCount} 次</div>
        <div style={{ fontWeight: 600, marginTop: 4, color: textColor }}>总活动: {totalActivity} 次</div>
      </div>
    </div>
  )
}


