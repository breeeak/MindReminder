import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
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
import SettingsPage from './pages/SettingsPage'

/**
 * 托盘事件监听器组件
 */
function TrayEventListener(): null {
  const navigate = useNavigate()

  useEffect(() => {
    // 监听托盘导航事件
    const unsubscribeNavigate = window.api.tray.onNavigateTo((route: string) => {
      console.log('Tray navigate to:', route)
      navigate(route)
    })

    // 监听快速记录事件
    const unsubscribeQuickAdd = window.api.tray.onShowQuickAdd(() => {
      console.log('Tray show quick add')
      // 导航到知识点列表页面，可以在那里打开快速添加对话框
      navigate('/knowledge')
      // 触发快速添加对话框（可以通过自定义事件或全局状态管理）
      setTimeout(() => {
        const event = new CustomEvent('show-quick-add')
        window.dispatchEvent(event)
      }, 100)
    })

    return () => {
      unsubscribeNavigate()
      unsubscribeQuickAdd()
    }
  }, [navigate])

  return null
}

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
        <TrayEventListener />
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
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
      </Router>
    </ConfigProvider>
  )
}

export default App
