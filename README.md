# Uzum Seller Bot - Telegram Mini App

**Telegram Mini App** для продавцов на маркетплейсе Uzum Market. 

Приложение помогает:
- 📊 Рассчитывать прибыль с учётом комиссий
- 💰 Проверять актуальные комиссии по категориям
- 📦 Управлять заказами через Uzum API
- 📚 Получать доступ к базе знаний
- 💬 Общаться в чате поддержки

---

**Powered by [@CloudGrove](https://t.me/CloudGrove)**

---

## 🚀 Структура проекта

- `/src` - React приложение (MiniApp)
- `/telegram-bot` - Telegram бот с командой `/start`
- `/functions` - Cloudflare Functions (proxy для Uzum API)
- `/admin` - Документация по админ панели

## 📋 Быстрый старт

### 1. MiniApp (React приложение)

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev

# Сборка
npm run build

# Деплой на Cloudflare Pages
npm run deploy
```

### 2. Telegram бот

```bash
# Переход в папку бота
cd telegram-bot

# Установка зависимостей
npm install

# Настройка .env
cp .env.example .env
# Заполните TELEGRAM_BOT_TOKEN и MINI_APP_URL

# Запуск
npm start
```

Подробнее: [telegram-bot/README.md](./telegram-bot/README.md)

## 🤖 Команды Telegram бота

- `/start` - Приветствие + описание функций + кнопка запуска MiniApp
- `/help` - Помощь и FAQ
- `/app` - Быстрое открытие приложения

## 🛠 Технологии

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Bot:** node-telegram-bot-api
- **Proxy:** Cloudflare Functions
- **Deploy:** Cloudflare Pages / Vercel

## Deploy Your Own

Deploy your own Vite project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/examples/tree/main/framework-boilerplates/vite-react&template=vite-react)

_Live Example: https://vite-react-example.vercel.app_

### Deploying From Your Terminal

You can deploy your new Vite project with a single command from your terminal using [Vercel CLI](https://vercel.com/download):

```shell
$ vercel
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Copyright © 2026 CloudGrove ([@CloudGrove](https://t.me/CloudGrove))**

---

Powered by [@CloudGrove](https://t.me/CloudGrove) 🚀
