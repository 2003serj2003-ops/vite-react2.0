#!/usr/bin/env node

require('dotenv').config({ path: '../.env' });
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = 930826522;

if (!BOT_TOKEN) {
  console.error('❌ VITE_TELEGRAM_BOT_TOKEN не найден');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

const testMessage = `🟣 Uzum Market - Тестовое сообщение
Доброе утро!

📅 Отчет за 31 января 2026

📦 Принято: 5 заказа(ов).
🛍 Кол-во товаров: 12.
🏦 Выручка: 250 000 сум
💰 Прибыль к выплате: 180 000 сум
💵 Чистая прибыль: 160 000 сум

📤 Выдано: 8 заказа(ов).
🏦 Выручка: 400 000 сум

❌ Отменено: 2 заказа(ов).
🚫 Сумма: 50 000 сум

💵 Вам Сегодня должны выплатить: 200 000 сум

✅ Это тестовое сообщение!`;

console.log('📤 Отправляю...');
bot.sendMessage(CHAT_ID, testMessage)
  .then(() => {
    console.log('✅ Отправлено!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  });
