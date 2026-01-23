# ✅ Telegram Mini App Deployment Checklist

## 1️⃣ Локальная подготовка (уже сделано)
- ✅ React + TypeScript приложение готово
- ✅ Supabase интеграция работает
- ✅ Telegram WebApp API интегрирован
- ✅ Приложение успешно компилируется
- ✅ Все анимации и UI готовы

## 2️⃣ Подготовка к деплою (нужно сделать вам)

### A. GitHub репозиторий
```bash
cd /workspaces/vite-react2.0
git add .
git commit -m "chore: prepare for telegram mini app deployment"
git push origin main
```

### B. Vercel Deploy
1. Открить https://vercel.com
2. Нажать "Add New..." → "Project"
3. Импортить репозиторий `vite-react2.0`
4. В "Environment Variables" добавить:
   ```
   VITE_SUPABASE_URL = (скопировать из Supabase Dashboard → Settings → API)
   VITE_SUPABASE_ANON_KEY = (скопировать там же, "anon" key)
   ```
5. Нажать "Deploy"
6. **Сохранить URL**: https://your-project.vercel.app

## 3️⃣ Настройка бота в Telegram

### Через BotFather (@BotFather):
```
/setmenubutton
Выберите вашего бота
Выберите "Web App"
URL: https://your-project.vercel.app
Text: "Открыть приложение"
```

### Через API (если нужен backend):
```bash
BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
WEBAPP_URL="https://your-project.vercel.app"

curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setMenuButton \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "Открыть",
      "web_app": {
        "url": "'${WEBAPP_URL}'"
      }
    }
  }'
```

## 4️⃣ Где вставить токен бота?

⚠️ **ВАЖНО**: Токен бота **НЕ нужен в фронте**!

Токен используется только на **backend** для:
- Отправки сообщений пользователю
- Получения обновлений от юзеров
- Других операций API бота

**Фронт получает данные пользователя через:**
```javascript
window.Telegram.WebApp.initDataUnsafe.user
// Автоматически в эффекте App.tsx (строки 365-380)
```

## 5️⃣ Если нужен Backend

Создайте Node.js приложение (например, на Heroku/Railway):

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

app.post('/send-message', async (req, res) => {
  const { user_id, message } = req.body;
  
  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: user_id,
        text: message
      }
    );
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

app.listen(3000);
```

## 6️⃣ Переменные окружения

**Где их взять:**

1. **VITE_SUPABASE_URL**:
   - Supabase Dashboard → Settings → API → Project URL

2. **VITE_SUPABASE_ANON_KEY**:
   - Supabase Dashboard → Settings → API → anon key

3. **BOT_TOKEN** (если нужен backend):
   - BotFather (@BotFather) → /token → выбрать бота

## ✨ Итоговый процесс пользователя:

1. Открывает бота в Telegram
2. Нажимает кнопку "Открыть приложение"
3. Загружается Mini App (ваше приложение)
4. Данные пользователя автоматически загружаются
5. Может вводить коды доступа
6. Администратор может управлять контентом

---

**Вопросы?** Все в TELEGRAM_DEPLOY.md

**Статус приложения:** ✅ Готово к деплою
