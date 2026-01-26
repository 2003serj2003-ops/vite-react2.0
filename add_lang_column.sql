-- Добавляем колонку lang для определения языка страницы
ALTER TABLE manual_sections 
ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'ru' CHECK (lang IN ('ru', 'uz'));

-- Создаём индекс для быстрой фильтрации по языку
CREATE INDEX IF NOT EXISTS idx_manual_sections_lang ON manual_sections(lang);

-- Обновляем существующие записи на основе URL
UPDATE manual_sections 
SET lang = CASE 
  WHEN url LIKE '%/uz/%' THEN 'uz'
  ELSE 'ru'
END
WHERE lang IS NULL OR lang = 'ru';
