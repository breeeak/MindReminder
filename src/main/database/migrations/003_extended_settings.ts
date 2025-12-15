import { Migration } from './index'

export const migration003: Migration = {
  version: 3,
  name: 'extended_settings',
  sql: `
-- 添加更多设置项
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  -- 复习设置
  ('global_frequency_coefficient', '1.0', strftime('%s', 'now') * 1000),
  ('memory_standard_days', '30', strftime('%s', 'now') * 1000),
  ('memory_standard_rating', '4', strftime('%s', 'now') * 1000),
  ('long_term_review_interval', '60', strftime('%s', 'now') * 1000),
  
  -- 提醒设置
  ('enable_daily_reminder', 'true', strftime('%s', 'now') * 1000),
  ('reminder_times', '["09:00","14:00","20:00"]', strftime('%s', 'now') * 1000),
  ('reminder_sound', 'true', strftime('%s', 'now') * 1000),
  ('reminder_method', 'notification', strftime('%s', 'now') * 1000),
  
  -- 系统设置
  ('auto_launch', 'false', strftime('%s', 'now') * 1000),
  ('minimize_to_tray', 'false', strftime('%s', 'now') * 1000),
  ('data_path', '', strftime('%s', 'now') * 1000),
  ('theme', 'light', strftime('%s', 'now') * 1000),
  
  -- 窗口状态
  ('window_width', '1200', strftime('%s', 'now') * 1000),
  ('window_height', '800', strftime('%s', 'now') * 1000),
  ('window_x', '0', strftime('%s', 'now') * 1000),
  ('window_y', '0', strftime('%s', 'now') * 1000),
  ('current_view', 'home', strftime('%s', 'now') * 1000),
  ('sidebar_collapsed', 'false', strftime('%s', 'now') * 1000);
  `
}

