import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { useAppStore } from './stores/appStore'
import { getThemeConfig } from './theme'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './pages/HomePage'
import { KnowledgeListPage } from './pages/KnowledgeListPage'
import { KnowledgeDetailPage } from './pages/KnowledgeDetailPage'
import ReviewDashboardPage from './pages/ReviewDashboardPage'
import ReviewSessionPage from './pages/ReviewSessionPage'
import ReviewCompletePage from './pages/ReviewCompletePage'
import { ReviewHistoryPage } from './pages/ReviewHistoryPage'
import { CalendarPage } from './pages/CalendarPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { ReminderListPage } from './pages/ReminderListPage'
import { DiaryListPage } from './pages/DiaryListPage'

/**
 * 应用主组件
 * 配置路由、全局布局和主题系统
 */
function App(): React.ReactElement {
  const { theme } = useAppStore()

  // 获取当前主题配置
  const themeConfig = getThemeConfig(theme)

  return (
    <ConfigProvider theme={themeConfig} componentSize="middle">
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/knowledge" element={<KnowledgeListPage />} />
            <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
            <Route path="/review" element={<ReviewDashboardPage />} />
            <Route path="/review/session" element={<ReviewSessionPage />} />
            <Route path="/review/complete" element={<ReviewCompletePage />} />
            <Route path="/review/history" element={<ReviewHistoryPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/reminders" element={<ReminderListPage />} />
            <Route path="/diaries" element={<DiaryListPage />} />
          </Routes>
        </AppLayout>
      </Router>
    </ConfigProvider>
  )
}

export default App
