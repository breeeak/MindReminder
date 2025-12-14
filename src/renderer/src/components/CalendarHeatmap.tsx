import React from 'react'
import { Tooltip, theme } from 'antd'
import dayjs from 'dayjs'
import { DateTooltip } from './DateTooltip'
import { useDiaryStore } from '../stores/diaryStore'
import type { Reminder } from '../types'

interface DayActivity {
  date: string
  knowledgeCount: number
  reviewCount: number
  totalActivity: number
  heatLevel: number
}

interface CalendarHeatmapProps {
  year: number
  month: number
  activities: DayActivity[]
  selectedDate: string | null
  onDateClick: (date: string) => void
  reminders?: Reminder[]
}

const HEAT_COLORS = ['#f0f0f0', '#c6e3ff', '#91d5ff', '#40a9ff', '#1890ff', '#096dd9']
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

// 根据热力等级返回文字颜色（确保对比度）
const getTextColor = (heatLevel: number): string => {
  // 0-2级用深色文字，3-5级用柔和的白色（不是纯白）
  return heatLevel >= 3 ? 'rgba(255, 255, 255, 0.87)' : '#262626'
}

// 获取标签样式
const getLabelStyle = (heatLevel: number, type: 'knowledge' | 'review') => {
  if (heatLevel >= 3) {
    // 深色背景：使用半透明白色标签
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      color: 'rgba(255, 255, 255, 0.87)'
    }
  } else {
    // 浅色背景：使用带色彩的标签
    return type === 'knowledge' 
      ? { backgroundColor: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }
      : { backgroundColor: 'rgba(82, 196, 26, 0.1)', color: '#52c41a' }
  }
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  year,
  month,
  activities,
  selectedDate,
  onDateClick,
  reminders = []
}) => {
  const { diaryDates } = useDiaryStore()
  const { token } = theme.useToken()
  
  // 判断当前主题
  const isDarkTheme = token.colorBgBase === '#141414'
  const emptyTextColor = isDarkTheme ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.75)'

  // 构建活动数据映射
  const activityMap = new Map(activities.map((a) => [a.date, a]))
  
  // 构建提醒数据映射（按日期分组）
  const remindersByDate = new Map<string, Reminder[]>()
  reminders.forEach((reminder) => {
    const date = dayjs(reminder.dueDate).format('YYYY-MM-DD')
    if (!remindersByDate.has(date)) {
      remindersByDate.set(date, [])
    }
    remindersByDate.get(date)!.push(reminder)
  })

  // 计算月份的第一天和最后一天
  const firstDay = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`)
  const lastDay = firstDay.endOf('month')
  const daysInMonth = lastDay.date()

  // 计算第一天是星期几（0=周日, 1=周一, ...）
  const firstDayOfWeek = firstDay.day()
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // 调整为周一开始

  // 生成日历格子
  const calendarDays: Array<{ date: string; day: number } | null> = []

  // 前置空白
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null)
  }

  // 实际日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = firstDay.date(day).format('YYYY-MM-DD')
    calendarDays.push({ date, day })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 星期标题 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8,
          flexShrink: 0
        }}
      >
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#8c8c8c',
              fontWeight: 500
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${Math.ceil(calendarDays.length / 7)}, 1fr)`,
          gap: 4,
          flex: 1,
          minHeight: 0
        }}
      >
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} />
          }

          const { date, day } = dayData
          const activity = activityMap.get(date)
          const heatLevel = activity?.heatLevel || 0
          const isSelected = date === selectedDate
          const isToday = date === dayjs().format('YYYY-MM-DD')
          const hasDiary = diaryDates.includes(date)
          const dateReminders = remindersByDate.get(date) || []
          const hasReminders = dateReminders.length > 0
          const textColor = getTextColor(heatLevel)

          return (
            <Tooltip
              key={date}
              title={
                activity && activity.totalActivity > 0 || hasReminders ? (
                  <div style={{ padding: 4 }}>
                    {dayjs(date).format('YYYY年MM月DD日')}
                    {activity && activity.totalActivity > 0 && (
                      <>
                        <br />
                        新增知识点: {activity.knowledgeCount}
                        <br />
                        完成复习: {activity.reviewCount}
                      </>
                    )}
                    {hasReminders && (
                      <>
                        <br />
                        提醒事项: {dateReminders.length}个
                        {dateReminders.slice(0, 3).map((r) => (
                          <div key={r.id} style={{ fontSize: '12px', marginTop: 4 }}>
                            • {r.title}
                          </div>
                        ))}
                        {dateReminders.length > 3 && (
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            ...还有{dateReminders.length - 3}个
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: 4, color: emptyTextColor }}>
                    {dayjs(date).format('YYYY年MM月DD日')}
                    <br />
                    无活动
                  </div>
                )
              }
              mouseEnterDelay={0.1}
            >
              <div
                onClick={() => onDateClick(date)}
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: HEAT_COLORS[heatLevel],
                  border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  minHeight: '80px',
                  ...(isToday && {
                    boxShadow: '0 0 0 2px #ff4d4f'
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = isToday ? '0 0 0 2px #ff4d4f' : 'none'
                }}
              >
                {/* 日记标记（右上角） */}
                {hasDiary && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      fontSize: 10,
                      lineHeight: 1
                    }}
                  >
                    📝
                  </div>
                )}

                {/* 提醒标记（左上角） */}
                {hasReminders && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      fontSize: 10,
                      lineHeight: 1
                    }}
                  >
                    ⏰
                  </div>
                )}

                <div style={{ fontSize: 18, fontWeight: isToday ? 'bold' : 'normal', marginBottom: 4, color: textColor }}>{day}</div>
                {activity && activity.totalActivity > 0 && (
                  <div style={{ fontSize: 11, lineHeight: 1.3, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activity.knowledgeCount > 0 && (
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '1px 4px',
                        borderRadius: 3,
                        fontWeight: 500,
                        ...getLabelStyle(heatLevel, 'knowledge')
                      }}>
                        +{activity.knowledgeCount}
                      </div>
                    )}
                    {activity.reviewCount > 0 && (
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '1px 4px',
                        borderRadius: 3,
                        fontWeight: 500,
                        ...getLabelStyle(heatLevel, 'review')
                      }}>
                        ✓{activity.reviewCount}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
