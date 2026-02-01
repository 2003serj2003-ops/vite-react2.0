/**
 * Тестовый скрипт для проверки отправки сообщения в Telegram
 * Использование: node test-send-message.js
 */

const TelegramBot = require('node-telegram-bot-api');

// Токен бота из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
  console.log('ℹ️  Установите переменную: export TELEGRAM_BOT_TOKEN=your_token');
  process.exit(1);
}

// ID пользователя для теста
const TEST_CHAT_ID = 930826522;

// Создаем бота
const bot = new TelegramBot(token);

console.log('🤖 Telegram Bot Test');
console.log('📤 Отправка тестового сообщения...');
console.log(`👤 Chat ID: ${TEST_CHAT_ID}`);

// Тестовое сообщение
const testMessage = `
🟣 Uzum Market - ТЕСТ
Привет! Это тестовое сообщение от бота.

📅 Дата: ${new Date().toLocaleDateString('ru-RU', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

✅ Если вы видите это сообщение, значит бот работает корректно!

📊 Система ежедневных отчетов настроена на отправку каждый день в 7:00 утра.

Функции бота:
• 📈 Ежедневные отчеты по продажам
• 💰 Информация о выплатах и расходах
• 📦 Статистика по заказам
• 🔔 Уведомления о важных событиях

---
⚙️ Тестовый режим
`;

// Отправка сообщения
bot.sendMessage(TEST_CHAT_ID, testMessage, {
  parse_mode: 'HTML'
})
  .then((result) => {
    console.log('\n✅ Сообщение успешно отправлено!');
    console.log(`📨 Message ID: ${result.message_id}`);
    console.log(`👤 Chat ID: ${result.chat.id}`);
    console.log(`📅 Date: ${new Date(result.date * 1000).toLocaleString('ru-RU')}`);
    console.log('\n🎉 Тест пройден успешно!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка отправки сообщения:');
    console.error(error.message);
    
    if (error.response && error.response.body) {
      console.error('\n📋 Детали ошибки:');
      console.error(JSON.stringify(error.response.body, null, 2));
    }
    
    console.log('\n💡 Возможные причины:');
    console.log('1. Неверный токен бота');
    console.log('2. Пользователь не написал боту /start');
    console.log('3. Бот заблокирован пользователем');
    console.log('4. Неверный Chat ID\n');
    
    process.exit(1);
  });
