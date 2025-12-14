import React, { useEffect, useState } from 'react'
import { Card, Space, Button, Spin, Typography, message } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { CalendarHeatmap } from '../components/CalendarHeatmap'
import { CalendarWeekView } from '../components/CalendarWeekView'
import { CalendarYearView } from '../components/CalendarYearView'
import { CalendarViewSwitcher } from '../components/CalendarViewSwitcher'
import { HeatmapLegend } from '../components/HeatmapLegend'
import { DaySidebar } from '../components/DaySidebar'
import { DiaryEditor } from '../components/diary/DiaryEditor'
import { ReminderEditor } from '../components/reminder/ReminderEditor'
import { useCalendarStore } from '../stores/calendarStore'
import { useDiaryStore } from '../stores/diaryStore'
import { useReminderStore } from '../stores/reminderStore'
import type { Reminder } from '../types'

const { Title } = Typography

export const CalendarPage: React.FC = () => {
  const {
    viewMode,
    currentYear,
    currentMonth,
    currentWeek,
    selectedDate,
    monthActivities,
    dayDetail,
    loading,
    error,
    fetchMonthActivities,
    selectDate,
    clearSelection,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousYear,
    goToNextYear,
    goToToday
  } = useCalendarStore()

  // 日记相关状态
  const [diaryEditorOpen, setDiaryEditorOpen] = useState(false)
  const { currentDiary, fetchDiaryByDate, deleteDiary, fetchAllDiaryDates } = useDiaryStore()

  // 提醒相关状态
  const [reminderEditorOpen, setReminderEditorOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const { reminders, fetchAll, fetchPendingCount, markComplete, deleteReminder } =
    useReminderStore()

  useEffect(() => {
    // 根据视图模式加载对应数据
    if (viewMode === 'month') {
      fetchMonthActivities()
    }
  }, [viewMode, fetchMonthActivities])

  // 组件加载时获取所有日记日期
  useEffect(() => {
    fetchAllDiaryDates()
    fetchAll()
    fetchPendingCount()
  }, [fetchAllDiaryDates, fetchAll, fetchPendingCount])

  // 当选中日期变化时，加载日记并过滤提醒
  useEffect(() => {
    if (selectedDate) {
      fetchDiaryByDate(selectedDate)
      // 过滤出该日期的提醒事项
      const startOfDay = dayjs(selectedDate).startOf('day').valueOf()
      const endOfDay = dayjs(selectedDate).endOf('day').valueOf()
      fetchAll({ startDate: startOfDay, endDate: endOfDay })
    }
  }, [selectedDate, fetchDiaryByDate, fetchAll])

  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

  const handleDateClick = (date: string) => {
    selectDate(date)
  }

  // 打开日记编辑器
  const handleOpenDiaryEditor = (): void => {
    if (selectedDate) {
      setDiaryEditorOpen(true)
    }
  }

  // 关闭日记编辑器
  const handleCloseDiaryEditor = (): void => {
    setDiaryEditorOpen(false)
    // 刷新日记显示
    if (selectedDate) {
      fetchDiaryByDate(selectedDate)
      fetchAllDiaryDates()
    }
  }

  // 删除日记
  const handleDeleteDiary = async (): Promise<void> => {
    if (selectedDate) {
      await deleteDiary(selectedDate)
    }
  }

  // 打开提醒编辑器(创建模式)
  const handleOpenReminderEditor = (): void => {
    setEditingReminder(null)
    setReminderEditorOpen(true)
  }

  // 打开提醒编辑器(编辑模式)
  const handleEditReminder = (reminder: Reminder): void => {
    setEditingReminder(reminder)
    setReminderEditorOpen(true)
  }

  // 关闭提醒编辑器
  const handleCloseReminderEditor = (): void => {
    setReminderEditorOpen(false)
    setEditingReminder(null)
    // 刷新提醒列表
    fetchAll()
  }

  // 标记完成
  const handleMarkComplete = async (id: string): Promise<void> => {
    await markComplete(id)
    fetchAll() // 刷新列表
  }

  // 删除提醒
  const handleDeleteReminder = async (id: string): Promise<void> => {
    await deleteReminder(id)
    fetchAll() // 刷新列表
  }

  // 根据视图模式决定导航方法
  const handlePrevious = (): void => {
    if (viewMode === 'month') goToPreviousMonth()
    else if (viewMode === 'week') goToPreviousWeek()
    else goToPreviousYear()
  }

  const handleNext = (): void => {
    if (viewMode === 'month') goToNextMonth()
    else if (viewMode === 'week') goToNextWeek()
    else goToNextYear()
  }

  // 获取标题文本
  const getTitleText = (): string => {
    if (viewMode === 'month') return `${currentYear}年${currentMonth}月`
    if (viewMode === 'week') return `${currentYear}年 第${currentWeek}周`
    return `${currentYear}年`
  }

  // 获取导航按钮文本
  const getNavButtonText = (): { prev: string; next: string } => {
    if (viewMode === 'month') return { prev: '上一月', next: '下一月' }
    if (viewMode === 'week') return { prev: '上一周', next: '下一周' }
    return { prev: '上一年', next: '下一年' }
  }

  const navText = getNavButtonText()

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 页面标题和视图切换 */}
        <Space
          direction="horizontal"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexShrink: 0
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            学习日历
          </Title>

          <CalendarViewSwitcher />
        </Space>

        {/* 时间导航 */}
        <Space
          direction="horizontal"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: 16,
            flexShrink: 0
          }}
        >
          <Button icon={<LeftOutlined />} onClick={handlePrevious} disabled={loading}>
            {navText.prev}
          </Button>

          <Title level={4} style={{ margin: 0, minWidth: 180, textAlign: 'center' }}>
            {getTitleText()}
          </Title>

          <Button icon={<RightOutlined />} onClick={handleNext} disabled={loading}>
            {navText.next}
          </Button>
          
          <Button onClick={goToToday} disabled={loading}>
            今天
          </Button>
        </Space>

        {/* 根据视图模式渲染不同组件 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Spin spinning={loading} style={{ flex: 1 }}>
          {viewMode === 'month' && (
            <>
              <CalendarHeatmap
                year={currentYear}
                month={currentMonth}
                activities={monthActivities}
                selectedDate={selectedDate}
                onDateClick={handleDateClick}
                reminders={reminders}
              />
              <HeatmapLegend />
            </>
          )}

          {viewMode === 'week' && <CalendarWeekView />}

          {viewMode === 'year' && <CalendarYearView />}
        </Spin>
        </div>
      </Card>

      {/* 日期详情侧边栏（所有视图共用）*/}
      <DaySidebar
        open={selectedDate !== null}
        dayDetail={dayDetail}
        onClose={clearSelection}
        currentDiary={currentDiary}
        onOpenDiaryEditor={handleOpenDiaryEditor}
        onDeleteDiary={handleDeleteDiary}
        reminders={reminders}
        onOpenReminderEditor={handleOpenReminderEditor}
        onEditReminder={handleEditReminder}
        onMarkComplete={handleMarkComplete}
        onDeleteReminder={handleDeleteReminder}
      />

      {/* 日记编辑器对话框 */}
      {selectedDate && (
        <DiaryEditor date={selectedDate} open={diaryEditorOpen} onClose={handleCloseDiaryEditor} />
      )}

      {/* 提醒编辑器对话框 */}
      <ReminderEditor
        reminder={editingReminder || undefined}
        defaultDate={selectedDate || undefined}
        open={reminderEditorOpen}
        onClose={handleCloseReminderEditor}
      />
    </div>
  )
}
