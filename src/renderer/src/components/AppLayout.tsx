import React, { useState, useEffect } from 'react'
import { Layout, Menu, Button, Input, Space } from 'antd'
import {
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  PlusOutlined,
  SettingOutlined,
  BulbOutlined,
  BulbFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  BellOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'

const { Header, Sider, Content } = Layout

interface AppLayoutProps {
  children?: React.ReactNode
}

/**
 * 应用全局布局组件
 * 实现三栏布局：顶栏 + 左侧导航 + 内容区
 * 支持主题切换和响应式布局
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }): React.ReactElement => {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useAppStore()

  // 左侧导航折叠状态
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sider-collapsed')
    return saved ? JSON.parse(saved) : window.innerWidth < 1280
  })

  // 监听窗口大小变化，自动折叠/展开
  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth < 1280 && !collapsed) {
        setCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [collapsed])

  // 保存折叠状态到 localStorage
  useEffect(() => {
    localStorage.setItem('sider-collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  // 切换折叠状态
  const toggleCollapsed = (): void => {
    setCollapsed(!collapsed)
  }

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = (): string => {
    if (location.pathname === '/') return '/'
    if (location.pathname.startsWith('/review')) return '/review'
    if (location.pathname.startsWith('/knowledge')) return '/knowledge'
    if (location.pathname.startsWith('/calendar')) return '/calendar'
    if (location.pathname.startsWith('/statistics')) return '/statistics'
    if (location.pathname.startsWith('/reminders')) return '/reminders'
    if (location.pathname.startsWith('/diaries')) return '/diaries'
    return '/'
  }

  // 左侧导航菜单项
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: '/review',
      icon: <CalendarOutlined />,
      label: '今日复习',
      onClick: () => navigate('/review')
    },
    {
      key: '/knowledge',
      icon: <BookOutlined />,
      label: '所有知识点',
      onClick: () => navigate('/knowledge')
    },
    {
      key: '/reminders',
      icon: <BellOutlined />,
      label: '提醒事项',
      onClick: () => navigate('/reminders')
    },
    {
      key: '/diaries',
      icon: <EditOutlined />,
      label: '我的日记',
      onClick: () => navigate('/diaries')
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: '日历视图',
      onClick: () => navigate('/calendar')
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '统计',
      onClick: () => navigate('/statistics')
    }
  ]

  // 获取主题图标
  const getThemeIcon = (): React.ReactNode => {
    return theme === 'dark' ? <BulbFilled /> : <BulbOutlined />
  }

  // 获取主题提示文本
  const getThemeTooltip = (): string => {
    return theme === 'dark' ? '深色模式' : '浅色模式'
  }

  return (
    <Layout style={{ minHeight: '100vh', height: '100%' }}>
      {/* 顶部工具栏 */}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 48,
          lineHeight: '48px'
        }}
      >
        {/* 左侧：Logo 和折叠按钮 */}
        <Space size="middle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ color: 'inherit' }}
          />
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            MindReminder
          </div>
        </Space>

        {/* 中间：搜索框（占位符） */}
        <div style={{ flex: 1, maxWidth: 500, margin: '0 32px' }}>
          <Input.Search placeholder="搜索知识点..." allowClear />
        </div>

        {/* 右侧：操作按钮 */}
        <Space>
          {/* <Button type="primary" icon={<PlusOutlined />}>
            新建
          </Button> */}
          <Button
            type="text"
            icon={getThemeIcon()}
            onClick={toggleTheme}
            title={getThemeTooltip()}
          />
          <Button type="text" icon={<SettingOutlined />} title="设置" />
        </Space>
      </Header>

      <Layout>
        {/* 左侧导航 */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={180}
          collapsedWidth={80}
          style={{
            overflow: 'auto',
            height: 'calc(100vh - 48px)',
            position: 'sticky',
            top: 48,
            left: 0
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        {/* 主内容区 */}
        <Content
          style={{
            padding: 0,
            height: 'calc(100vh - 48px)',
            overflow: 'auto'
          }}
        >
          {children || <Outlet />}
        </Content>
      </Layout>
    </Layout>
  )
}
