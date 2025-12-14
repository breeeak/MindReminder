import { Migration } from './index'

export const migration002: Migration = {
  version: 2,
  name: 'tags_and_categories',
  sql: `
-- tags表（标签）
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

-- categories表（分类）
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_custom INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- knowledge_tags关联表（知识点和标签的多对多关系）
CREATE TABLE IF NOT EXISTS knowledge_tags (
  knowledge_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (knowledge_id, tag_id),
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_knowledge ON knowledge_tags(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_tag ON knowledge_tags(tag_id);

-- 插入预定义分类
INSERT OR IGNORE INTO categories (id, name, is_custom, created_at) VALUES
  ('cat_1', '编程技术', 0, strftime('%s', 'now') * 1000),
  ('cat_2', '数据结构', 0, strftime('%s', 'now') * 1000),
  ('cat_3', '算法', 0, strftime('%s', 'now') * 1000),
  ('cat_4', '系统设计', 0, strftime('%s', 'now') * 1000),
  ('cat_5', '面试题', 0, strftime('%s', 'now') * 1000);
  `
}
