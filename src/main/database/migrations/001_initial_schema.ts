import { Migration } from './index'

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',
  sql: `
-- knowledge表（知识点）
CREATE TABLE IF NOT EXISTS knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  category TEXT,
  frequency_coefficient REAL DEFAULT 1.0,
  mastery_status TEXT DEFAULT 'learning',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'local',
  last_review_at INTEGER,
  next_review_at INTEGER,
  review_count INTEGER DEFAULT 0,
  mastered_at INTEGER
);

-- review_history表（复习历史）
CREATE TABLE IF NOT EXISTS review_history (
  id TEXT PRIMARY KEY,
  knowledge_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL,
  next_review_at INTEGER NOT NULL,
  interval_days REAL NOT NULL,
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE
);

-- diary表（日记）
CREATE TABLE IF NOT EXISTS diary (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'local'
);

-- reminder表（提醒事项）
CREATE TABLE IF NOT EXISTS reminder (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  due_date INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'local'
);

-- settings表（用户设置）
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_knowledge_next_review ON knowledge(next_review_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_status ON knowledge(mastery_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge(tags);
CREATE INDEX IF NOT EXISTS idx_review_history_knowledge ON review_history(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_review_history_date ON review_history(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date);
CREATE INDEX IF NOT EXISTS idx_reminder_due_date ON reminder(due_date);
CREATE INDEX IF NOT EXISTS idx_reminder_completed ON reminder(completed);

-- 预设数据
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('global_frequency_coefficient', '1.0', strftime('%s', 'now') * 1000),
  ('memory_standard_days', '30', strftime('%s', 'now') * 1000),
  ('memory_standard_rating', '4', strftime('%s', 'now') * 1000),
  ('notification_time', '20:00', strftime('%s', 'now') * 1000),
  ('theme', 'light', strftime('%s', 'now') * 1000);
  `
}

