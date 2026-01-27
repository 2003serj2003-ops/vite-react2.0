-- Пересоздать таблицу access_codes для работы с Cloudflare Functions
-- Структура совместима с миграцией 001_users_and_roles.sql

DROP TABLE IF EXISTS access_codes CASCADE;

CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  max_uses INTEGER, -- null = unlimited
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  display_code TEXT, -- Маскированный код для UI (****42)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS политики
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on access_codes"
  ON access_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_access_codes_code_hash ON access_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires ON access_codes(expires_at);

-- Пример добавления тестового кода (хеш для "123456")
-- Сгенерируйте свой хеш через https://bcrypt-generator.com/ (rounds=10)
-- INSERT INTO access_codes (code_hash, role, display_code, note) VALUES
--   ('$2a$10$N9qo8uLOickgx2ZMRZoMye0IZqJB8I0k2bL1L7F8mL4LzFOv8zrAa', 'viewer', '****56', 'Тестовый код 123456');
