// Diary 实体类型
export interface Diary {
  id: string // UUID
  date: string // YYYY-MM-DD
  content: string // Markdown 内容
  createdAt: number // Unix 时间戳（毫秒）
  updatedAt: number // Unix 时间戳（毫秒）
  syncStatus?: string // 云同步状态
}

// 创建 Diary DTO
export interface CreateDiaryDTO {
  date: string // YYYY-MM-DD
  content: string // Markdown 内容
}

// 更新 Diary DTO
export interface UpdateDiaryDTO {
  content: string // Markdown 内容
}

// 日记预览类型
export interface DiaryPreview {
  date: string
  preview: string // 前100字预览
  hasFullContent: boolean // 是否有完整内容
}








