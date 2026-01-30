# Деплой на Cloudflare Pages

## Способ 1: Через Cloudflare Dashboard (Рекомендуется)

1. Зайдите на https://dash.cloudflare.com/
2. Выберите **Pages** → **Create a project**
3. Подключите GitHub репозиторий: `aavyasov-png/sanya`
4. Настройте сборку:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

5. Добавьте переменные окружения в Settings → Environment variables:
   ```
   VITE_SUPABASE_URL=https://ykbouygdeqrohizeqlmc.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_6sJ_KOewkD5zRln2HVDWXw_vjILs-kD
   VITE_TELEGRAM_BOT_TOKEN=8274387256:AAENRm4uxyQ91s4g8RfmEhq3SxnKzH8Kzvs
   VITE_AI_PROVIDER=groq
   VITE_GROQ_API_KEY=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
   ```

6. Нажмите **Save and Deploy**

Каждый push в `main` будет автоматически разворачиваться.

## Способ 2: Через Wrangler CLI

```bash
# Установка Wrangler (если еще не установлен)
npm install -g wrangler

# Авторизация в Cloudflare
wrangler login

# Деплой проекта
npm run cf:deploy

# Или вручную
wrangler pages deploy dist --project-name=sanya
```

## Важно!

⚠️ **Не забудьте установить переменные окружения в Cloudflare Dashboard!**

Без них приложение не будет работать корректно.

## Проверка деплоя

После деплоя приложение будет доступно по адресу:
- Production: `https://sanya.pages.dev`
- Preview (для PR): `https://<branch>.sanya.pages.dev`

## Troubleshooting

Если деплой не работает:
1. Проверьте, что все переменные окружения установлены
2. Убедитесь, что build command выполняется локально: `npm run build`
3. Проверьте логи в Cloudflare Dashboard → Pages → Deployments
