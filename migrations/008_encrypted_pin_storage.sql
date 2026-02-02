-- ================================================
-- ADD ENCRYPTED PIN TO INTEGRATIONS
-- ================================================
-- Добавляем возможность хранить зашифрованный PIN в БД
-- для автоматической расшифровки токена между сессиями
-- ================================================

ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS encrypted_pin_cipher TEXT NULL,
ADD COLUMN IF NOT EXISTS encrypted_pin_iv TEXT NULL,
ADD COLUMN IF NOT EXISTS encrypted_pin_salt TEXT NULL;

-- Комментарии к полям
COMMENT ON COLUMN public.integrations.encrypted_pin_cipher IS 'Зашифрованный PIN (AES-GCM) для автоматической расшифровки';
COMMENT ON COLUMN public.integrations.encrypted_pin_iv IS 'IV для расшифровки PIN';
COMMENT ON COLUMN public.integrations.encrypted_pin_salt IS 'Salt для расшифровки PIN';
