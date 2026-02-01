# UZUM Integration - Persistent Connection Implementation Guide

## Обзор

Реализована система персистентного подключения UZUM с привязкой к Telegram ID пользователя.

## Архитектура

### 1. База данных (Supabase)

**Миграция:** `migrations/007_update_integrations_for_persistence.sql`

**Таблица `integrations`:**
- `telegram_user_id` (bigint, indexed) - ID пользователя из Telegram
- `provider` (text) - Провайдер интеграции ("uzum")
- `status` (text) - Статус: connected | disconnected | error
- `token_cipher` (text) - Зашифрованный токен (AES-256-GCM)
- `token_iv` (text) - Initialization Vector для расшифровки
- `token_salt` (text) - Salt для PBKDF2
- `token_last4` (text) - Последние 4 символа токена (для UI)
- `shop_ids` (jsonb) - ID магазинов
- `seller_meta` (jsonb) - Метаданные продавца
- `connected_at` (timestamptz) - Дата подключения
- `updated_at` (timestamptz) - Дата обновления

**Ограничения:**
- UNIQUE(telegram_user_id, provider) - одна интеграция на пользователя
- CHECK(status IN ('connected', 'disconnected', 'error'))

### 2. Backend (Cloudflare Functions)

**Файл:** `functions/api/integration.ts`

**Endpoints:**

1. **GET /api/integration/status?provider=uzum**
   - Возвращает статус интеграции для текущего пользователя
   - Требует `x-telegram-init-data` header для аутентификации

2. **POST /api/integration/connect**
   - Сохраняет зашифрованный токен
   - Body: `{ provider, token_cipher, token_iv, token_salt, token_last4, shop_ids, seller_meta }`

3. **POST /api/integration/disconnect**
   - Отключает интеграцию (status = disconnected)
   - Body: `{ provider }`

4. **GET /api/integration/health?provider=uzum**
   - Проверяет работоспособность интеграции
   - Делает тестовый запрос к UZUM API

### 3. Frontend Libraries

**1. Session Storage (`src/lib/session.ts`)**
- Хранение PIN в памяти (sessionStorage)
- Автоматическое удаление через 15 минут
- Очистка при закрытии вкладки

Функции:
- `setSessionPIN(pin)` - сохранить PIN
- `getSessionPIN()` - получить PIN (если не истёк)
- `clearSessionPIN()` - очистить PIN
- `hasSessionPIN()` - проверить наличие PIN
- `refreshSessionPIN()` - обновить timestamp

**2. Integration API (`src/lib/integration-api.ts`)**
- Клиент для работы с Cloudflare Functions
- Автоматическое добавление Telegram initData

Функции:
- `getIntegrationStatus(provider)` - статус интеграции
- `connectIntegration(data)` - подключить
- `disconnectIntegration(provider)` - отключить
- `checkIntegrationHealth(provider)` - проверить

**3. Crypto (`src/lib/crypto.ts`)**
- Уже существует
- PBKDF2 (200k iterations) + AES-256-GCM

### 4. UI Components

**Profile Component (`src/components/Profile.tsx`)**
- Отображает статус интеграций
- Управление: проверить / отключить / переподключить
- Показывает:
  - Статус подключения (✅/❌/⚠️)
  - Дату подключения
  - Количество магазинов
  - Последние 4 символа токена

## Workflow

### Первое подключение

1. Пользователь вводит:
   - UZUM Token
   - PIN (4-6 цифр)

2. Frontend:
   - Генерирует ключ из PIN (PBKDF2, 200k iterations)
   - Шифрует токен (AES-256-GCM)
   - Сохраняет PIN в sessionStorage

3. Backend:
   - Получает telegram_user_id из initData
   - Сохраняет encrypted token в БД
   - Проверяет токен через UZUM API
   - Сохраняет shop_ids и seller_meta

### Повторный вход (автоподключение)

1. App запускается:
   - Получает telegram_user_id
   - Вызывает GET /api/integration/status

2. Если интеграция подключена:
   - Показывает UI как подключенную
   - НЕ просит токен
   - PIN запрашивается только при необходимости

3. Если интеграции нет:
   - Показывает "Не подключено"
   - Кнопка "Подключить"

### Работа с токеном

**Важно:** Токен никогда не хранится в открытом виде на frontend!

Когда нужен токен для запроса к UZUM API:

1. Проверить sessionStorage - есть ли PIN
2. Если нет - запросить у пользователя
3. Расшифровать токен в памяти
4. Сделать запрос
5. Стереть токен из памяти

## Безопасность

✅ **Реализовано:**
- PIN не хранится на диске (только sessionStorage)
- Токен зашифрован в БД (AES-256-GCM)
- PBKDF2 с 200k iterations
- Telegram ID как ключ доступа
- UNIQUE constraint на telegram_user_id + provider

⚠️ **TODO (критично для продакшн):**
- Проверка подписи Telegram initData в `/api/integration/*`
- RLS политики в Supabase (сейчас service role full access)
- Rate limiting на API endpoints
- Логирование попыток доступа

## Миграция существующих пользователей

При следующем входе пользователя с существующей интеграцией:

1. Обнаружить старую интеграцию (без telegram_user_id)
2. Попросить PIN
3. Зашифровать текущий токен
4. UPDATE integrations SET telegram_user_id, token_cipher, token_iv, token_salt

## Запуск миграции БД

```bash
# Через Supabase Dashboard
1. Открыть SQL Editor
2. Вставить содержимое migrations/007_update_integrations_for_persistence.sql
3. Выполнить

# Или через CLI
supabase db push migrations/007_update_integrations_for_persistence.sql
```

## Деплой Cloudflare Functions

```bash
# Разработка
cd functions
wrangler dev

# Продакшн
wrangler deploy
```

## Конфигурация

**Environment Variables (Cloudflare):**
```
SUPABASE_URL=https://ykbouygdeqrohizeqlmc.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
TELEGRAM_BOT_TOKEN=<bot_token> # для проверки initData
```

**Frontend (.env):**
```
VITE_INTEGRATION_API=https://uzum.2003serj2003-ops.workers.dev/api/integration
```

## Тестирование

### Тест 1: Первое подключение
1. Открыть Mini App через Telegram
2. Ввести токен + PIN
3. Проверить в БД: запись создана с telegram_user_id

### Тест 2: Автоподключение
1. Закрыть и открыть Mini App
2. Проверить: интеграция подхватилась автоматически
3. Токен не запрашивался

### Тест 3: Session PIN
1. Войти в Mini App
2. Ввести PIN один раз
3. Работать 10 минут - PIN не запрашивается
4. Закрыть вкладку
5. Открыть снова - PIN запросится заново

### Тест 4: Profile
1. Открыть Профиль
2. Проверить отображение статуса
3. Проверить "Проверить подключение"
4. Проверить "Отключить"
5. Проверить "Переподключить"

## Definition of Done

✅ Пользователь вводит токен 1 раз
✅ Интеграция автоматически подхватывается по Telegram ID
✅ В профиле виден статус и кнопки управления
✅ PIN не хранится на диске, только в памяти (sessionStorage)
⚠️ RLS/серверная проверка - требует доработки initData verification

## Следующие шаги

1. **Критично:**
   - Реализовать проверку Telegram initData signature
   - Настроить RLS политики для integrations

2. **Желательно:**
   - Добавить rate limiting
   - Логирование действий с интеграциями
   - UI для миграции старых пользователей
   - Тесты для Cloudflare Functions

3. **Опционально:**
   - Поддержка нескольких провайдеров
   - Webhook для уведомлений об ошибках
   - Аналитика использования интеграций
