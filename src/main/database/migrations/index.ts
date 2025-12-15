import { migration001 } from './001_initial_schema'
import { migration002 } from './002_tags_and_categories'
import { migration003 } from './003_extended_settings'

export interface Migration {
  version: number
  name: string
  sql: string
}

export { migration001, migration002, migration003 }

/**
 * 获取所有迁移列表（按版本号排序）
 */
export function getAllMigrations(): Migration[] {
  return [migration001, migration002, migration003]
}
