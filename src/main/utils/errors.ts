import log from './logger'

export class AppError extends Error {
  timestamp: number

  constructor(
    public code: string,
    public message: string,
    public userMessage: string
  ) {
    super(message)
    this.name = 'AppError'
    this.timestamp = Date.now()
    
    // 记录错误到日志
    this.logError()
  }

  protected logError(): void {
    log.error(`[${this.name}] ${this.code}`, {
      message: this.message,
      userMessage: this.userMessage,
      timestamp: new Date(this.timestamp).toISOString(),
      stack: this.stack
    })
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      timestamp: this.timestamp
    }
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, userMessage = '数据库操作失败') {
    super('DATABASE_ERROR', message, userMessage)
  }
}

export class MigrationError extends AppError {
  constructor(message: string, userMessage = '数据库迁移失败') {
    super('MIGRATION_ERROR', message, userMessage)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage = '数据验证失败') {
    super('VALIDATION_ERROR', message, userMessage)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, userMessage = '资源未找到') {
    super('NOT_FOUND_ERROR', message, userMessage)
  }
}

export class BackupError extends AppError {
  constructor(message: string, userMessage = '备份操作失败') {
    super('BACKUP_ERROR', message, userMessage)
  }
}

export class SystemError extends AppError {
  constructor(message: string, userMessage = '系统错误') {
    super('SYSTEM_ERROR', message, userMessage)
  }
}

/**
 * 全局错误处理器
 */
export function handleGlobalError(error: Error): void {
  if (error instanceof AppError) {
    // 应用错误已经被记录
    return
  }

  // 未捕获的错误
  log.error('[UnhandledError]', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString()
  })
}





