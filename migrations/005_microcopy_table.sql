-- ================================================
-- МИГРАЦИЯ: Microcopy управление
-- ================================================
-- Создаёт таблицу для управления микро-текстами (ШАГ 7)

CREATE TABLE IF NOT EXISTS microcopy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  text_ru TEXT NOT NULL,
  text_uz TEXT NOT NULL,
  context TEXT, -- 'login', 'home', 'uzum', 'calculator', etc
  description TEXT, -- Описание для админа
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_microcopy_key ON microcopy(key);
CREATE INDEX IF NOT EXISTS idx_microcopy_context ON microcopy(context);

-- RLS политики (доступно всем для чтения)
ALTER TABLE microcopy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Microcopy readable by all"
  ON microcopy FOR SELECT
  USING (true);

CREATE POLICY "Microcopy writable by authenticated"
  ON microcopy FOR ALL
  USING (true)
  WITH CHECK (true);

-- Вставить существующие micro-texts из кода
INSERT INTO microcopy (key, text_ru, text_uz, context, description) VALUES
  ('login_code_info', '🔐 Код нужен для входа в систему', '🔐 Tizimga kirish uchun kod kerak', 'login', 'Подсказка на экране входа'),
  ('home_welcome_subtitle', '👋 Мы поможем разобраться и начать продажи', '👋 Biz tushunishga va sotishni boshlashga yordam beramiz', 'home', 'Приветствие на главном экране')
ON CONFLICT (key) DO NOTHING;

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_microcopy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_microcopy_updated_at ON microcopy;
CREATE TRIGGER update_microcopy_updated_at
  BEFORE UPDATE ON microcopy
  FOR EACH ROW
  EXECUTE FUNCTION update_microcopy_updated_at();

-- Комментарии
COMMENT ON TABLE microcopy IS 'Управляемые микро-тексты для UI без релиза';
COMMENT ON COLUMN microcopy.key IS 'Уникальный ключ (например: login_code_info)';
COMMENT ON COLUMN microcopy.context IS 'Контекст использования для группировки';
