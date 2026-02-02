# Integration Persistence Fix

## Проблема
После logout / закрытия мини-аппа / перезахода интеграция сбрасывалась, и пользователь вынужден был заново вводить token и PIN.

## Решение

### 1. Создан новый модуль `integration-persistence.ts`

Модуль содержит функции для управления персистентной интеграцией:

- `getTelegramUserId()` - получение Telegram ID пользователя
- `checkIntegrationStatus()` - проверка наличия активной интеграции
- `loadIntegrationWithSession()` - загрузка интеграции с расшифровкой токена
- `persistPINInSession()` - сохранение PIN в sessionStorage
- `clearPINFromSession()` - очистка PIN из sessionStorage
- `disconnectIntegration()` - отключение интеграции

### 2. Изменения в App.tsx

#### Обновлена функция `loadUzumIntegration()`
- Теперь использует `loadIntegrationWithSession()` из нового модуля
- Автоматически загружает данные интеграции по `telegram_user_id`
- Если PIN в sessionStorage - расшифровывает токен автоматически
- Если PIN нет - показывает форму для повторного ввода

#### Обновлена функция `signOut()`
- **ВАЖНО:** НЕ очищает интеграцию при logout
- Интеграция привязана к Telegram ID и сохраняется между сессиями
- Для отключения интеграции используется отдельная кнопка "Disconnect"

#### Обновлена функция `handleDisconnect()`
- Использует `disconnectIntegration()` из нового модуля
- Удаляет интеграцию по `telegram_user_id`
- Очищает PIN из sessionStorage
- Очищает кеш UZUM

#### Обновлена функция `handleSaveToken()`
- Использует `persistPINInSession()` для сохранения PIN

#### Добавлен автозагрузка интеграции при старте
```typescript
useEffect(() => {
  const autoLoadIntegration = async () => {
    const { checkIntegrationStatus } = await import('./lib/integration-persistence');
    const status = await checkIntegrationStatus('uzum');
    
    if (status.connected) {
      console.log('[App] ✓ Integration detected on startup, auto-loading...');
      await loadUzumIntegration();
    }
  };
  
  autoLoadIntegration();
}, []); // Run only once on mount
```

## Как это работает

### 1. Подключение интеграции
1. Пользователь вводит token и PIN
2. Токен шифруется и сохраняется в БД с привязкой к `telegram_user_id`
3. PIN сохраняется в `sessionStorage` (только для текущей сессии)
4. Интеграция активна

### 2. Повторный вход
1. При запуске приложения проверяется наличие интеграции в БД по `telegram_user_id`
2. Если интеграция найдена:
   - Если PIN в sessionStorage - токен расшифровывается автоматически
   - Если PIN нет - пользователь видит статус "Connected" но нужно ввести PIN для доступа к данным

### 3. Logout
1. Очищается только app session (access codes, admin status)
2. Интеграция НЕ удаляется
3. При следующем входе интеграция подтягивается автоматически

### 4. Disconnect
1. Удаляет интеграцию из БД
2. Очищает PIN из sessionStorage
3. Очищает кеш UZUM
4. После этого нужно заново подключать интеграцию

## Безопасность

- Токен хранится в БД в зашифрованном виде (AES-GCM-256)
- PIN не хранится в БД, только в sessionStorage для текущей сессии
- Клиент никогда не видит расшифрованный токен в storage
- При закрытии вкладки PIN очищается автоматически (sessionStorage)
- Интеграция привязана к `telegram_user_id` - работает на всех устройствах

## Миграции

Используется существующая таблица `integrations` с полем `telegram_user_id` (добавлено в миграции 006).

## Тестирование

1. Подключите интеграцию
2. Закройте mini app
3. Откройте снова - интеграция должна быть активна
4. Logout - интеграция остается
5. Login снова - интеграция подтягивается
6. Нажмите Disconnect - интеграция удаляется
7. Подключите заново - все работает

## Build

```
dist/assets/integration-persistence-iMgPWn_v.js   3.83 kB │ gzip:   1.24 kB
dist/assets/index-CBWbRlDy.js                  1,245.09 kB │ gzip: 345.45 kB
✓ built in 7.78s
```
