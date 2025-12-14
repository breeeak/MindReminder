import type { DiaryRepository } from '../database/repositories/DiaryRepository'
import type { Diary, CreateDiaryDTO, DiaryPreview } from '../database/types/Diary'
import { ValidationError } from '../utils/errors'

export class DiaryService {
  constructor(private diaryRepository: DiaryRepository) {}

  /**
   * 根据日期获取日记
   */
  getByDate(date: string): Diary | null {
    return this.diaryRepository.findByDate(date)
  }

  /**
   * 获取日期范围内的日记列表
   */
  getByDateRange(startDate: string, endDate: string): Diary[] {
    return this.diaryRepository.findByDateRange(startDate, endDate)
  }

  /**
   * 获取所有有日记的日期（用于日历标记）
   */
  getAllDiaryDates(): string[] {
    return this.diaryRepository.getAllDiaryDates()
  }

  /**
   * 保存日记（创建或更新）
   */
  save(data: CreateDiaryDTO): Diary {
    // 验证日期格式
    if (!this.isValidDate(data.date)) {
      throw new ValidationError(
        `Invalid date format: ${data.date}. Expected YYYY-MM-DD`,
        `日期格式无效：${data.date}。期望格式为 YYYY-MM-DD`
      )
    }

    // 验证内容
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Diary content cannot be empty', '日记内容不能为空')
    }

    return this.diaryRepository.save(data)
  }

  /**
   * 删除日记
   */
  delete(date: string): void {
    this.diaryRepository.delete(date)
  }

  /**
   * 获取日记预览（前100字）
   */
  getPreview(date: string): DiaryPreview | null {
    const diary = this.diaryRepository.findByDate(date)

    if (!diary) return null

    // 提取纯文本（移除 Markdown 语法）
    const plainText = this.stripMarkdown(diary.content)

    // 截取前100字
    const preview = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText

    return {
      date: diary.date,
      preview,
      hasFullContent: diary.content.length > 100
    }
  }

  /**
   * 验证日期格式（YYYY-MM-DD）
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * 简单地移除 Markdown 语法（用于预览）
   */
  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/#{1,6}\s+/g, '') // 移除标题
      .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
      .replace(/\*(.+?)\*/g, '$1') // 移除斜体
      .replace(/`(.+?)`/g, '$1') // 移除代码
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
      .replace(/>\s+/g, '') // 移除引用
      .replace(/\n+/g, ' ') // 移除换行
      .trim()
  }
}
