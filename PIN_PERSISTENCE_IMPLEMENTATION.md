# PIN Persistence Implementation

## Проблема
PIN хранился только в sessionStorage и терялся при закрытии вкладки, что требовало повторного ввода после каждого перезапуска приложения.

## Решение
PIN теперь хранится в БД в зашифрованном виде и автоматически расшифровывается при загрузке интеграции.

## Изменения

### 1. Миграция БД (migrations/008_encrypted_pin_storage.sql)
```sql
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS encrypted_pin_cipher TEXT NULL,
ADD COLUMN IF NOT EXISTS encrypted_pin_iv TEXT NULL,
ADD COLUMN IF NOT EXISTS encrypted_pin_salt TEXT NULL;
```

**Применение миграции:**
1. Через Supabase Dashboard:
   - SQL Editor → New query → Paste migration → Run
2. Через CLI:
   ```bash
   npx supabase db push
   ```

### 2. Crypto.ts - Новые функции

#### `encryptPIN(pin: string)`
Шифрует PIN с помощью мастер-ключа для хранения в БД.

#### `decryptPIN(cipher, iv, salt)`
Расшифровывает PIN из БД с помощью мастер-ключа.

#### `getMasterKey()`
Получает мастер-ключ из переменной окружения `VITE_MASTER_KEY`.

**⚠️ ВАЖНО:** В продакшене нужно установить безопасный мастер-ключ:
```bash
# В .env или через hosting platform
VITE_MASTER_KEY=your-secure-random-key-min-32-chars
```

### 3. Integration-persistence.ts - Обновлена loadIntegrationWithSession()

**Логика загрузки PIN:**
1. Пытается расшифровать PIN из БД (encrypted_pin_*)
2. Если успешно - использует его для расшифровки токена
3. Fallback на sessionStorage если PIN в БД нет

**Код:**
```typescript
// Try to decrypt PIN from DB first
let pin: string | null = null;

if (data.encrypted_pin_cipher && data.encrypted_pin_iv && data.encrypted_pin_salt) {
  try {
    const { decryptPIN } = await import('./crypto');
    pin = await decryptPIN(
      data.encrypted_pin_cipher,
      data.encrypted_pin_iv,
      data.encrypted_pin_salt
    );
    console.log('[Integration] ✓ PIN decrypted from DB');
  } catch (pinError) {
    console.error('[Integration] Failed to decrypt PIN from DB:', pinError);
  }
}

// Fallback to session PIN if DB PIN not available
if (!pin) {
  pin = sessionStorage.getItem(`${provider}_pin_temp`);
}
```

### 4. App.tsx - Обновлена handleSaveToken()

**При сохранении интеграции:**
1. Шифрует токен с PIN пользователя
2. Шифрует PIN с мастер-ключом
3. Сохраняет оба в БД

**Код:**
```typescript
// Encrypt token
const encrypted = await encryptToken(uzumToken, uzumPin);

// Encrypt PIN for persistent storage
const { encryptPIN } = await import('./lib/crypto');
const encryptedPIN = await encryptPIN(uzumPin);

// Save to database
const { data, error } = await supabase
  .from('integrations')
  .upsert({
    // ... other fields
    token_cipher: encrypted.cipher,
    token_iv: encrypted.iv,
    token_salt: encrypted.salt,
    encrypted_pin_cipher: encryptedPIN.cipher,
    encrypted_pin_iv: encryptedPIN.iv,
    encrypted_pin_salt: encryptedPIN.salt,
    // ...
  })
```

## Безопасность

### Слои шифрования:
1. **Токен:** Зашифрован с PIN пользователя (AES-GCM-256 + PBKDF2)
2. **PIN:** Зашифрован с мастер-ключом (AES-GCM-256 + PBKDF2)
3. **Мастер-ключ:** Хранится в ENV/KMS (не в коде, не в БД)

### Схема:
```
User PIN (memory/session)
    ↓ PBKDF2 + AES-GCM
Token (encrypted in DB)

Master Key (ENV)
    ↓ PBKDF2 + AES-GCM
PIN (encrypted in DB)
```

### Что хранится где:
- **БД:** Зашифрованный токен + зашифрованный PIN
- **sessionStorage:** PIN в plaintext (опционально, для текущей сессии)
- **ENV:** Мастер-ключ
- **Память:** Расшифрованный токен (только во время работы)

## Workflow

### Первое подключение:
1. Пользователь вводит token + PIN
2. Token шифруется с PIN → сохраняется в БД
3. PIN шифруется с мастер-ключом → сохраняется в БД
4. PIN также сохраняется в sessionStorage

### Перезапуск приложения:
1. Проверяется наличие интеграции в БД по telegram_user_id
2. PIN расшифровывается из БД с помощью мастер-ключа
3. Token расшифровывается с помощью PIN
4. Данные отображаются автоматически

### Закрытие и повторное открытие:
1. sessionStorage очищается
2. При загрузке PIN берется из БД → все работает
3. **Данные отображаются без повторного ввода PIN**

## Миграция существующих интеграций

Существующие интеграции без `encrypted_pin_*` полей:
- Будут работать через sessionStorage (как раньше)
- При следующем переподключении PIN сохранится в БД
- Или можно сделать массовую миграцию (если нужно)

## Testing

### Проверка работы:
1. ✅ Подключить интеграцию
2. ✅ Закрыть mini app
3. ✅ Открыть снова → данные должны загрузиться автоматически
4. ✅ Logout → login → данные должны быть
5. ✅ Закрыть браузер → открыть → данные должны быть

### Проверка безопасности:
```sql
-- Проверить что PIN зашифрован
SELECT 
  telegram_user_id,
  provider,
  encrypted_pin_cipher IS NOT NULL as has_encrypted_pin,
  LENGTH(encrypted_pin_cipher) as cipher_length
FROM integrations;
```

## Environment Setup

### Development:
`.env` или `.env.local`:
```env
VITE_MASTER_KEY=dev-master-key-min-32-characters-long
```

### Production:
Через hosting platform (Vercel/Netlify/Cloudflare):
```bash
VITE_MASTER_KEY=production-secure-random-key-from-kms
```

**⚠️ Никогда не коммитить мастер-ключ в репозиторий!**

## Build

```
dist/assets/integration-persistence-CnKTUw5g.js   4.27 kB │ gzip:   1.35 kB
dist/assets/index-z4SESHDy.js                  1,245.51 kB │ gzip: 345.60 kB
✓ built in 7.46s
```

## Rollback Plan

Если что-то пойдет не так:
1. Откатить миграцию:
   ```sql
   ALTER TABLE public.integrations 
   DROP COLUMN IF EXISTS encrypted_pin_cipher,
   DROP COLUMN IF EXISTS encrypted_pin_iv,
   DROP COLUMN IF EXISTS encrypted_pin_salt;
   ```

2. Откатить код до предыдущего коммита
3. Пользователи снова будут использовать sessionStorage
