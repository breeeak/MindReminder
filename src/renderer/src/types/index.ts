/**
 * 共享类型定义
 */

/**
 * Knowledge 实体类型（与IPC API保持一致）
 */
export interface Knowledge {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  frequencyCoefficient: number;
}

/**
 * 应用视图类型
 */
export type AppView = 'calendar' | 'list' | 'detail';

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark';

