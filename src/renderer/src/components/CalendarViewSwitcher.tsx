import React from 'react'
import { Segmented } from 'antd'
import { CalendarOutlined, UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useCalendarStore } from '../stores/calendarStore'

/**
 * 日历视图切换器组件
 * 支持月视图、周视图、年视图切换
 */
export const CalendarViewSwitcher: React.FC = () => {
  const { viewMode, setViewMode } = useCalendarStore()

  return (
    <Segmented
      value={viewMode}
      onChange={(value) => setViewMode(value as 'month' | 'week' | 'year')}
      options={[
        {
          label: '月视图',
          value: 'month',
          icon: <CalendarOutlined />
        },
        {
          label: '周视图',
          value: 'week',
          icon: <UnorderedListOutlined />
        },
        {
          label: '年视图',
          value: 'year',
          icon: <AppstoreOutlined />
        }
      ]}
    />
  )
}






