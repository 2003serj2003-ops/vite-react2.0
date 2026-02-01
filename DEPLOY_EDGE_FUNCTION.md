# Деплой Edge Function в Supabase

После исправления ошибки 400 в `uzum-proxy` нужно задеплоить обновленную версию Edge Function.

## ⚠️ Важно!
Без деплоя Edge Function обновление остатков **не будет работать**!

## Способ 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Edge Functions** (в левом меню)
4. Найдите функцию **uzum-proxy**
5. Нажмите на неё для редактирования
6. Скопируйте содержимое файла `supabase/functions/uzum-proxy/index.ts`
7. Вставьте в редактор в Dashboard
8. Нажмите **Deploy**

## Способ 2: Через CLI (требует логин)

```bash
# 1. Логин в Supabase
npx supabase login

# 2. Деплой функции
npx supabase functions deploy uzum-proxy
```

## Проверка деплоя

После деплоя:

1. Откройте приложение в Telegram Mini App
2. Перейдите в раздел UZUM → Обновить остатки
3. Выберите товары и обновите остатки
4. Должно работать без ошибки 400 ✅

## Что было исправлено?

**Проблема:** Двойная сериализация JSON
```typescript
// ❌ Было:
requestOptions.body = JSON.stringify(body); // body уже строка!

// ✅ Стало:
requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
```

Теперь прокси правильно обрабатывает JSON и отправляет корректный формат в UZUM API.

## Полный код функции

См. файл: `supabase/functions/uzum-proxy/index.ts`

Ключевое изменение на **строках 69-75**:
```typescript
// НЕ добавляем body для GET запросов
if (body && method !== 'GET' && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
  // Если body уже строка JSON, используем как есть
  // Иначе сериализуем в JSON
  requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  console.log('[Uzum Proxy] Added body to request:', typeof body);
}
```
