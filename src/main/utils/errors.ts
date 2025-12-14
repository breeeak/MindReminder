export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public userMessage: string
  ) {
    super(message)
    this.name = 'AppError'
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



