# Настройка переменных окружения в Cloudflare Pages

## Важно! 
Для фронтенд-приложения переменные встраиваются **на этапе сборки** (build time), а не runtime.

## Шаг 1: Перейти в настройки Cloudflare Pages

1. Откройте ваш проект на Cloudflare Pages
2. Перейдите в **Settings** → **Environment variables**

## Шаг 2: Добавить переменные окружения

Для **Production** и **Preview** окружений добавьте следующие переменные:

### Обязательные переменные (PUBLIC):

```
VITE_SUPABASE_URL=https://ykbouygdeqrohizeqlmc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYm91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTI0NjMsImV4cCI6MjA1MzEyODQ2M30.6sJ_KOewkD5zRln2HVDWXw_vjILs-kD_4eBfU_ueKvI
```

### Дополнительные (опционально):

```
VITE_TELEGRAM_BOT_TOKEN=8274387256:AAENRm4uxyQ91s4g8RfmEhq3SxnKzH8Kzvs
VITE_AI_PROVIDER=groq
VITE_GROQ_API_KEY=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
```

## Шаг 3: Настройки сборки

В настройках Cloudflare Pages должно быть:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (или оставьте пустым)
- **Node version:** `22` или выше

## Важные замечания

### ✅ Безопасно для публичных переменных:
- `VITE_SUPABASE_URL` - публичный URL
- `VITE_SUPABASE_ANON_KEY` - публичный ключ (с Row Level Security)
- Эти переменные встраиваются в JavaScript и видны в браузере

### ❌ НИКОГДА не добавляйте в Cloudflare Pages:
- `SUPABASE_SERVICE_KEY` - секретный ключ (только для backend)
- `JWT_SECRET` - секрет для токенов
- Эти переменные должны использоваться только в API functions

## Как это работает

1. **Локально**: Vite читает `.env` файл и встраивает переменные с префиксом `VITE_` в сборку
2. **В Cloudflare Pages**: При сборке используются переменные из настроек проекта
3. **В браузере**: Приложение получает доступ через `import.meta.env.VITE_SUPABASE_URL`

## Проверка

После добавления переменных:
1. Сделайте новый commit и push
2. Cloudflare Pages автоматически пересоберет проект
3. Проверьте приложение - подключение к Supabase должно работать

## Troubleshooting

Если переменные не работают:
1. Убедитесь, что имена начинаются с `VITE_`
2. Проверьте, что переменные добавлены для нужного окружения (Production/Preview)
3. Пересоберите проект (Deployments → Retry deployment)
4. Проверьте логи сборки на наличие ошибок
