import React from 'react'
import { TodaySummaryCard } from '../components/TodaySummaryCard'

/**
 * 主页
 * 显示今日摘要和快捷入口
 */
export const HomePage: React.FC = () => {
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <h1>欢迎使用 MindReminder</h1>

      {/* 今日摘要卡片 */}
      <TodaySummaryCard />

      {/* 其他主页内容可以后续添加 */}
    </div>
  )
}

