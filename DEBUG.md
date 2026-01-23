# 🔍 Отладка Telegram Mini App

## Проблема 1: Имя и фото не подтягиваются

### Проверка в браузере:

1. **Откройте DevTools (F12) → Console**
2. **Проверьте логи с префиксом [TG]:**
   ```
   [TG] initDataUnsafe: {...}
   [TG] user object: { first_name: "...", photo_url: "..." }
   ```

3. **Если логов нет:**
   - Проверьте: `window.Telegram` - должен существовать
   - Проверьте: `window.Telegram.WebApp` - должен существовать
   - Проверьте: `window.Telegram.WebApp.initDataUnsafe` - должен иметь данные

### Если всё пусто (development на ПК):
- Это нормально, поскольку Telegram WebApp API доступен только внутри Telegram
- На Vercel Mini App это будет работать

### Если вы в реальном Telegram Mini App:
- Откройте DevTools в Telegram (долгое нажатие на экран)
- Посмотрите логи [TG]
- Если `initDataUnsafe` пуст - проблема на стороне Telegram (перезагрузите приложение)

---

## Проблема 2: Коды доступа не работают

### Проверка в браузере:

1. **Откройте DevTools → Console**
2. **Посмотрите логи с префиксом [CODE]:**
   ```
   [CODE] Checking code: ABC123
   [CODE] Supabase response: { data: [...], error: null }
   [CODE] Code found: { code: "ABC123", is_active: true, expires_at: "2025-12-31..." }
   ```

3. **Посмотрите логи с префиксом [SUPABASE]:**
   ```
   [SUPABASE] URL: ✓ configured
   [SUPABASE] ANON_KEY: ✓ configured
   ```

4. **Посмотрите логи с префиксом [DATA]:**
   ```
   [DATA] Loading public content...
   [DATA] Sections: ✓ 3
   [DATA] Cards: ✓ 12
   [DATA] News: ✓ 5
   ```

### Если коды не работают, проверьте:

1. **Суть ошибки:**
   - Если `[CODE] Supabase response` показывает `error` - проблема с Supabase
   - Если `[CODE] Code not found` - код не существует в БД
   - Если `[CODE] Code is inactive` - код отключен в админпанели
   - Если `[CODE] Code expired` - срок действия истек

2. **Проверка таблицы access_codes:**
   - Откройте Supabase Dashboard
   - Таблица `access_codes`
   - Убедитесь, что коды есть и:
     - `is_active = true`
     - `expires_at` либо пусто, либо в будущем
     - `code` в ВЕРХНЕМ РЕГИСТРЕ

3. **Проверка RLS (Row Level Security):**
   - Supabase → Authentication → Policies
   - Таблица `access_codes` должна быть доступна для чтения без аутентификации:
     ```sql
     SELECT * FROM access_codes WHERE TRUE
     FOR SELECT
     USING (true)
     ```

4. **Проверка на Vercel:**
   - Убедитесь, что Environment Variables установлены:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Redeploy после добавления переменных

---

## Чек-лист отладки

- [ ] В браузере DevTools есть логи [TG], [CODE], [DATA], [SUPABASE]
- [ ] [SUPABASE] показывает "✓ configured"
- [ ] [DATA] показывает ✓ для всех таблиц
- [ ] [CODE] не показывает ошибки
- [ ] На Vercel есть Environment Variables
- [ ] Коды в access_codes имеют is_active=true и будущий expires_at
- [ ] RLS политики разрешают SELECT для анонимных пользователей

---

## Если ничего не помогает

1. **Очистите локальное хранилище:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Перезагрузите страницу (Ctrl+Shift+R)**

3. **Попробуйте incognito mode**

4. **Проверьте Network в DevTools:**
   - Откройте Network tab
   - Попробуйте ввести код
   - Посмотрите запросы - должен быть POST на supabase
   - Проверьте статус ответа (200 OK или 400/500 error)

5. **Посмотрите CORS ошибки:**
   - Если в Console красные ошибки про CORS
   - Это означает, что Vercel URL не добавлен в Supabase CORS

---

## Как исправить CORS на Supabase

Если видите ошибки CORS:

1. **Supabase Dashboard → Settings → API**
2. **Scroll to "CORS"**
3. **Add your Vercel URL:**
   - `https://your-project.vercel.app`
   - `https://your-project-*.vercel.app`
4. **Save**

---

## Комманды для быстрой проверки в Console

```javascript
// Проверка Telegram
window.Telegram.WebApp.initDataUnsafe.user

// Проверка Supabase конфига
supabase.supabaseUrl
supabase.supabaseKey

// Проверка localStorage
JSON.parse(localStorage.getItem('user_name'))
JSON.parse(localStorage.getItem('user_photo'))
```
