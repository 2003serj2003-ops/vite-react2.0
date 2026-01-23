# Telegram Mini App Deployment Guide

## Шаг 1: Развернуть на Vercel

1. Закоммить изменения:
```bash
git add .
git commit -m "Prepare for Telegram Mini App deployment"
git push
```

2. На [vercel.com](https://vercel.com):
   - Нажать "New Project"
   - Импортить репозиторий `vite-react2.0`
   - Environment Variables добавить:
     - `VITE_SUPABASE_URL` = ваш Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = ваш Supabase anon key
   - Deploy

   **Результат**: приложение будет доступно по URL типа `https://your-project.vercel.app`

## Шаг 2: Настроить бота в Telegram

1. В BotFather (@BotFather):
   ```
   /setmenubutton
   Выберите вашего бота
   Нажать: "Web App"
   ```

2. Или через API (если у вас есть backend):
   ```bash
   curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/setMenuButton \
     -H "Content-Type: application/json" \
     -d '{
       "menu_button": {
         "type": "web_app",
         "text": "Открыть приложение",
         "web_app": {
           "url": "https://your-project.vercel.app"
         }
       }
     }'
   ```

## Шаг 3: Где вставить токен бота?

**Токен бота НЕ нужен в фронте!** Он требуется только для backend операций.

Если нужен backend для:
- Отправки сообщений от бота
- Обработки колбэков
- Валидации данных

Создайте Node.js backend (например, Express) с токеном в `.env`:
```env
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

Фронтенд автоматически получит данные пользователя через `Telegram.WebApp.initDataUnsafe`

## Переменные окружения для Vercel

В Settings проекта → Environment Variables добавить:
```
VITE_SUPABASE_URL = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...xxx
```

## Проверка работы

1. Откройте бота в Telegram
2. Нажмите на кнопку "Открыть приложение"
3. Должно открыться Mini App
4. Данные пользователя автоматически загружаются из Telegram

## Файлы окружения

- `.env.example` - шаблон переменных
- `.env` (локально) - для разработки (в .gitignore)
- Vercel Environment Variables - для production
