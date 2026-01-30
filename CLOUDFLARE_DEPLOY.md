# Деплой на Cloudflare Pages

## ⚠️ ВАЖНАЯ ИНСТРУКЦИЯ

Cloudflare Pages должен использовать **встроенную интеграцию с GitHub**, а не команду `wrangler pages deploy`.

### Исправление ошибки "Authentication error [code: 10000]"

Эта ошибка возникает, когда Cloudflare пытается использовать `wrangler pages deploy` вместо встроенного деплоя.

**Решение:**

1. Зайдите в **Settings** → **Builds & deployments** в Cloudflare Pages
2. Найдите раздел **Build configurations**
3. **УДАЛИТЕ или ОЧИСТИТЕ поле "Deploy command"** полностью
4. Убедитесь что настроено:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (пусто)
   - **Deploy command**: **(ОСТАВЬТЕ ПУСТЫМ!)** ❌

После этого Cloudflare будет использовать прямую интеграцию с GitHub и автоматически разворачивать содержимое `dist/` после сборки.

---

## Способ 1: Через Cloudflare Dashboard (Рекомендуется)

1. Зайдите на https://dash.cloudflare.com/
2. Выберите **Pages** → **Create a project** (или откройте существующий)
3. Подключите GitHub репозиторий: `aavyasov-png/sanya`
4. Настройте сборку:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Deploy command**: _(ОСТАВЬТЕ ПУСТЫМ - это важно!)_

5. Добавьте переменные окружения в Settings → Environment variables:
   ```
   VITE_SUPABASE_URL=https://ykbouygdeqrohizeqlmc.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_6sJ_KOewkD5zRln2HVDWXw_vjILs-kD
   VITE_TELEGRAM_BOT_TOKEN=8274387256:AAENRm4uxyQ91s4g8RfmEhq3SxnKzH8Kzvs
   VITE_AI_PROVIDER=groq
   VITE_GROQ_API_KEY=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
   ```

6. Нажмите **Save and Deploy**

**Каждый push в `main` будет автоматически разворачиваться через встроенную интеграцию GitHub.**

---

## Способ 2: Через Wrangler CLI (для ручного деплоя)

⚠️ **Этот способ НЕ должен использоваться в CI/CD!** Только для ручного локального деплоя.

```bash
# Установка Wrangler (если еще не установлен)
npm install -g wrangler

# Авторизация в Cloudflare
wrangler login

# Сборка и деплой
npm run build
wrangler pages deploy dist --project-name=sanya

# Или используйте команду из package.json:
npm run cf:deploy
```

---

## Проверка конфигурации

Если деплой не работает, проверьте:

1. ✅ Framework preset: `Vite` (опционально, но рекомендуется)
2. ✅ Build command: `npm run build`
3. ✅ Build output directory: `dist`
4. ❌ **Deploy command: ДОЛЖЕН быть ПУСТЫМ** (самое важное!)
5. ✅ Root directory: `/` (пусто или корень)

## Важно!

⚠️ **Не используйте команду деплоя в настройках Cloudflare Pages!** 

Cloudflare Pages автоматически развернет содержимое `dist/` после успешной сборки. Команда `wrangler pages deploy` должна использоваться только для ручного деплоя с локальной машины.

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
