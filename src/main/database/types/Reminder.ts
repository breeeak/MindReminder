// Reminder 实体类型
export interface Reminder {
  id: string // UUID
  title: string // 标题(必填)
  content?: string // 描述(可选)
  dueDate: number // 提醒时间(Unix时间戳,毫秒)
  completed: boolean // 是否完成
  completedAt?: number // 完成时间
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
  syncStatus?: string // 云同步状态
}

// 创建 Reminder DTO
export interface CreateReminderDTO {
  title: string // 标题(必填)
  content?: string // 描述(可选)
  dueDate: number // 提醒时间(Unix时间戳,毫秒)
}

// 更新 Reminder DTO
export interface UpdateReminderDTO {
  title?: string
  content?: string
  dueDate?: number
}

// 提醒列表筛选条件
export interface ReminderFilter {
  completed?: boolean // 筛选已完成/未完成
  startDate?: number // 开始时间
  endDate?: number // 结束时间
}







