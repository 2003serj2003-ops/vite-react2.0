-- ================================================
-- МИГРАЦИЯ: FAQ с поддержкой slug и category
-- ================================================
-- Добавляет поля для контекстного связывания FAQ (ШАГ 6)

-- Добавить поля (nullable для backward compatibility)
ALTER TABLE faq 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_faq_slug ON faq(slug);
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);

-- Комментарии
COMMENT ON COLUMN faq.slug IS 'Уникальный ключ для контекстного связывания (используется в ContextualFaqLink)';
COMMENT ON COLUMN faq.category IS 'Категория: calculator, commissions, general, etc';
