import type { ReminderRepository } from '../database/repositories/ReminderRepository'
import type {
  Reminder,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderFilter
} from '../database/types/Reminder'

export class ReminderService {
  constructor(private reminderRepository: ReminderRepository) {}

  /**
   * 根据ID获取提醒
   */
  getById(id: string): Reminder | null {
    return this.reminderRepository.findById(id)
  }

  /**
   * 获取所有提醒(支持筛选)
   */
  getAll(filter?: ReminderFilter): Reminder[] {
    return this.reminderRepository.findAll(filter)
  }

  /**
   * 获取未完成的提醒
   */
  getPending(): Reminder[] {
    return this.reminderRepository.findPending()
  }

  /**
   * 获取即将到期的提醒
   */
  getUpcoming(minutes: number = 60): Reminder[] {
    return this.reminderRepository.findUpcoming(minutes)
  }

  /**
   * 创建提醒
   */
  create(data: CreateReminderDTO): Reminder {
    // 验证标题
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Reminder title cannot be empty')
    }

    // 验证时间
    if (!data.dueDate || data.dueDate <= Date.now()) {
      throw new Error('Reminder due date must be in the future')
    }

    return this.reminderRepository.create(data)
  }

  /**
   * 更新提醒
   */
  update(id: string, data: UpdateReminderDTO): Reminder {
    // 验证时间(如果提供)
    if (data.dueDate !== undefined && data.dueDate <= Date.now()) {
      throw new Error('Reminder due date must be in the future')
    }

    return this.reminderRepository.update(id, data)
  }

  /**
   * 标记为已完成
   */
  markComplete(id: string): Reminder {
    return this.reminderRepository.markComplete(id)
  }

  /**
   * 删除提醒
   */
  delete(id: string): void {
    this.reminderRepository.delete(id)
  }

  /**
   * 获取未完成提醒数量
   */
  getPendingCount(): number {
    return this.reminderRepository.countPending()
  }
}
