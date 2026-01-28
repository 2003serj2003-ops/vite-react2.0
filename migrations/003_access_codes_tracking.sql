-- ================================================
-- МИГРАЦИЯ: Tracking использования access codes
-- ================================================
-- Добавляет поля для отслеживания последнего использования кода

-- Добавить поля для tracking (если не существуют)
ALTER TABLE access_codes 
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_used_by_telegram_id BIGINT;

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_access_codes_last_used_by 
  ON access_codes(last_used_by_telegram_id);

-- Комментарии
COMMENT ON COLUMN access_codes.last_used_at IS 'Timestamp последнего успешного использования кода';
COMMENT ON COLUMN access_codes.last_used_by_telegram_id IS 'Telegram ID последнего пользователя, использовавшего код';
