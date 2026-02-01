-- ================================================
-- ADD TELEGRAM_USER_ID TO INTEGRATIONS
-- ================================================
-- Позволяет привязать интеграцию к Telegram ID пользователя
-- чтобы не нужно было каждый раз отключать/включать интеграцию
-- ================================================

ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT NULL;

-- Index для быстрого поиска по telegram_user_id
CREATE INDEX IF NOT EXISTS integrations_telegram_user_id_idx 
ON public.integrations (telegram_user_id);

-- Комментарий к полю
COMMENT ON COLUMN public.integrations.telegram_user_id IS 'Telegram user ID для автоматической авторизации через бота';
