-- ===============================================
-- МИГРАЦИЯ: Система пользователей и ролей
-- ===============================================

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. Таблица кодов доступа (хешированные)
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE, -- bcrypt hash
  role_to_assign TEXT NOT NULL CHECK (role_to_assign IN ('owner', 'admin', 'editor', 'viewer')),
  max_uses INTEGER DEFAULT 1, -- null = unlimited
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  note TEXT
);

-- 3. Таблица сессий (для JWT tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- 4. Таблица аудит-лога
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'role_change', etc.
  resource_type TEXT NOT NULL, -- 'section', 'card', 'news', 'faq', 'user', 'access_code'
  resource_id UUID,
  details JSONB, -- изменения, старые/новые значения
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_access_codes_code_hash ON access_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- 6. RLS Политики

-- Users: только авторизованные могут читать
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users readable by authenticated"
ON users FOR SELECT
USING (true); -- на сервере будем проверять

CREATE POLICY "Users updatable by owner or admin"
ON users FOR UPDATE
USING (true); -- проверка на сервере

-- Access codes: только через API
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access codes managed via API only"
ON access_codes FOR ALL
USING (false); -- все операции только через API

-- Sessions: только через API
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions managed via API only"
ON user_sessions FOR ALL
USING (false);

-- Audit log: только чтение для всех
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit log readable"
ON audit_log FOR SELECT
USING (true);

CREATE POLICY "Audit log insert only via API"
ON audit_log FOR INSERT
WITH CHECK (false); -- только через API

-- 7. Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Создать первого owner пользователя (замените на свои данные)
-- Этот пользователь будет создан с ролью owner
INSERT INTO users (telegram_id, full_name, role, is_active)
VALUES (123456789, 'Initial Owner', 'owner', true)
ON CONFLICT (telegram_id) DO NOTHING;

-- 9. Комментарии для документации
COMMENT ON TABLE users IS 'Пользователи системы с ролями';
COMMENT ON TABLE access_codes IS 'Хешированные коды доступа для регистрации';
COMMENT ON TABLE user_sessions IS 'Активные сессии пользователей';
COMMENT ON TABLE audit_log IS 'История всех действий в системе';
COMMENT ON COLUMN access_codes.code_hash IS 'Bcrypt hash кода доступа';
COMMENT ON COLUMN access_codes.role_to_assign IS 'Роль, которая будет назначена при использовании кода';
