import { migration001 } from './001_initial_schema'

export interface Migration {
  version: number
  name: string
  sql: string
}

export { migration001 }

/**
 * 获取所有迁移列表（按版本号排序）
 */
export function getAllMigrations(): Migration[] {
  return [
    migration001
    // 未来添加更多迁移...
  ]
}

