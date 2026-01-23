# 🚀 Исправление Telegram Mini App (HTTPS + CORS + RLS)

## ГЛАВНАЯ ПРОБЛЕМА: CORS или RLS блокирует Telegram

Когда код работает на `http://localhost` в браузере, но не работает в Telegram:
- Это не проблема кода
- Это проблема безопасности Supabase

---

## ✅ ШАГ 1: HTTPS на Vercel (ОБЯЗАТЕЛЬНО)

Telegram требует HTTPS! Vercel уже предоставляет HTTPS.

Проверьте:
- URL должен быть: `https://your-project.vercel.app` 
- НЕ `http://...`

**Если используете собственный домен:**
```
Vercel → Settings → Domains
```
Убедитесь, что SSL enabled.

---

## ✅ ШАГ 2: CORS на Supabase (ЕСЛИ ОШИБКИ В CONSOLE)

Если в Console видите ошибки про CORS:

1. **Supabase Dashboard → Settings → API**
2. **Scroll down → "CORS allowed origins"**
3. **Add:**
   ```
   https://your-project.vercel.app
   https://*.vercel.app
   ```
4. **Save**

---

## ✅ ШАГ 3: RLS Политики (ГЛАВНОЕ!)

**Это самая частая причина!**

1. **Supabase Dashboard → Editor (левое меню)**
2. **Выберите таблицу `access_codes`**
3. **Вверху нажмите "RLS Policies" (или Security)**

### Если RLS отключена (красный toggle):
- Нажмите toggle чтобы ВКЛЮЧИТЬ

### Если RLS включена, создайте политику:

**Нажмите "New Policy" или "Create a policy"**

Создайте эту политику:
```sql
CREATE POLICY "Allow public select" ON access_codes
FOR SELECT
USING (true);
```

Или через UI:
- **Action:** SELECT
- **Target roles:** Public
- **USING:** `true`
- **WITH CHECK:** (оставить пусто)

### Также для других таблиц (sections, cards, news):

```sql
CREATE POLICY "Allow public select" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON cards FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON news FOR SELECT USING (true);
```

---

## ✅ ШАГ 4: Проверка в Telegram

1. Откройте бота в Telegram
2. Откройте Mini App
3. Откройте DevTools (долгое нажатие)
4. **Console должна показать:**
```
[SUPABASE] URL: ✓ configured
[SUPABASE] ANON_KEY: ✓ configured
[DATA] Loading public content...
[DATA] Sections: ✓ N
[DATA] Cards: ✓ N
[DATA] News: ✓ N
[CODE] Checking code: ABC123
[CODE] Code valid, granting access
```

Если видите ошибки - это CORS или RLS.

---

## 🔧 Быстрая проверка RLS

Откройте Supabase SQL Editor и выполните:

```sql
-- Проверить RLS для access_codes
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('access_codes', 'sections', 'cards', 'news');
```

Если `rowsecurity` = `true` но нет политик - это проблема!

---

## 🚨 Если ничего не помогает

1. **Временно отключите RLS для отладки:**
   - Supabase → Editor → таблица → "RLS" toggle → OFF
   - Протестируйте в Telegram
   - Если заработало - проблема в RLS политиках
   - Создайте правильные политики и включите обратно

2. **Проверьте Network в DevTools Telegram:**
   - Посмотрите запросы
   - Ищите ошибки 403 (forbidden) или CORS ошибки
   - Если 403 - это RLS
   - Если CORS ошибка - добавьте домен в CORS

3. **Очистите кэш:**
   - Закройте Mini App
   - Закройте Telegram полностью
   - Откройте заново

---

## 📋 Финальный чек-лист

- [ ] Vercel URL использует HTTPS
- [ ] CORS на Supabase содержит Vercel домен
- [ ] RLS ВКЛЮЧЕНА для таблиц
- [ ] Политики созданы для всех таблиц:
  - [ ] access_codes: SELECT для public
  - [ ] sections: SELECT для public
  - [ ] cards: SELECT для public
  - [ ] news: SELECT для public
- [ ] После изменений RLS политик нажмите "Refresh" в браузере
- [ ] Переоткройте Mini App в Telegram

---

## Если хотите быть уверены - выполните это:

1. **Supabase SQL Editor:**
```sql
-- Создать политики если их нет
CREATE POLICY "Allow public select" ON access_codes FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON cards FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON news FOR SELECT USING (true);

-- Проверить
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('access_codes', 'sections', 'cards', 'news');
```

2. **Vercel Settings → Environment Variables → Redeploy**

3. **Откройте Mini App в Telegram**

Должно работать! ✅
