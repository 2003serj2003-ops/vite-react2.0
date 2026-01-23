# ✅ Чек-лист для исправления проблем

## 🚨 ЕСЛИ ОШИБКА: "Environment Variable references Secret which does not exist"

**Решение:** Удалите и пересоздайте переменные правильно!

1. Vercel → Settings → Environment Variables
2. **Удалите** все `VITE_` переменные (нажмите на каждую и Delete)
3. **Добавьте заново:**
   - `VITE_SUPABASE_URL` = `https://ykbouygdeqrohizeqlmc.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_6sJ_KOewkD5zRln2HVDWXw_vjILs-kD`
   - `VITE_TELEGRAM_BOT_TOKEN` = `8274387256:AAENRm4uxyQ91s4g8RfmEhq3SxnKzH8Kzvs`
   - `VITE_TELEGRAM_CHAT_ID` = `-1001234567890`

⚠️ **Важно:** Добавляйте как обычные переменные, НЕ как Secrets!

4. Deployments → Redeploy последнего деплоя

**Подробнее:** [VERCEL_ENV_FIX.md](./VERCEL_ENV_FIX.md)

---

## Что именно проверить на Vercel:

### 1. Environment Variables на Vercel ✓
```
Settings → Environment Variables → должно быть:
- VITE_SUPABASE_URL = https://xxx.supabase.co
- VITE_SUPABASE_ANON_KEY = eyJ...xxx
```
**Если их нет или ошибка - смотрите выше!**

### 2. Supabase RLS Policies (ОЧЕНЬ ВАЖНО)
```
Supabase Dashboard → Editor → access_codes → RLS Policies
```
**Нужна политика для SELECT:**
```sql
CREATE POLICY "Allow anonymous select" ON access_codes
FOR SELECT USING (true);
```

Если политики нет - создайте:
1. Откройте `access_codes` таблицу
2. Нажмите "Security" → "New policy"
3. Select: FOR SELECT, USING (true)
4. Save

### 3. Supabase CORS (если CORS ошибки)
```
Supabase → Settings → API → CORS → Allowed origins
```
Добавьте:
```
https://your-project.vercel.app
```

### 4. Telegram WebApp Инициализация
Уже исправлено в коде, но убедитесь, что в index.html есть:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

---

## Как быстро проверить через Console:

1. **Откройте Vercel приложение**
2. **DevTools → Console (F12)**
3. **Посмотрите логи:**

```
✓ [SUPABASE] URL: ✓ configured
✓ [SUPABASE] ANON_KEY: ✓ configured
✓ [DATA] Loading public content...
✓ [DATA] Sections: ✓ N
✓ [DATA] Cards: ✓ N
✓ [DATA] News: ✓ N
```

Если вместо ✓ видите ошибки - смотрите DEBUG.md

---

## Проверка кода доступа:

1. **Откройте Console**
2. **Введите тестовый код**
3. **Должны быть логи:**
```
[CODE] Checking code: ABC123
[CODE] Supabase response: { data: [...], error: null }
[CODE] Code found: { code: "ABC123", is_active: true, ... }
[CODE] Code valid, granting access
```

Если видите "not found" - проверьте в Supabase, что код существует

---

## Telegram User Data:

1. **В Telegram Mini App откройте DevTools**
2. **Должны быть логи:**
```
[TG] initDataUnsafe: { user: { first_name: "...", photo_url: "..." } }
[TG] user object: { first_name: "...", photo_url: "..." }
[TG] Setting user: { firstName: "...", lastName: "...", ... }
```

Если логов нет - переоткройте Mini App

---

## ГЛАВНОЕ: После каждого изменения на Vercel

**Settings → Deployments → нажми "Redeploy" на последнем deploy**

Это нужно чтобы переменные окружения подтянулись.
