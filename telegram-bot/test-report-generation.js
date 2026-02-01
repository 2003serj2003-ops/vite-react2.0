/**
 * Тестовая генерация ежедневного отчета
 * Показывает, как будет выглядеть отчет без реальной отправки
 */

console.log('📊 Генерация тестового ежедневного отчета...\n');

// Имитация данных за вчера
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const testData = {
  accepted: {
    count: 3,
    items: 5,
    revenue: 150000,
    profit: 82500,
    netProfit: 62500
  },
  issued: {
    count: 2,
    revenue: 50000,
    profit: 27500,
    netProfit: 21500
  },
  cancelled: {
    count: 1,
    sum: 18600,
    other: 1
  },
  payouts: {
    yesterday: {
      sum: 40000,
      orders: 4
    },
    today: {
      sum: 52163,
      orders: 6
    }
  },
  expenses: {
    fines: 10000,
    logistics: 10000
  },
  returns: 0
};

function formatSum(num) {
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

// Генерация отчета
const report = `
🟣 Uzum Market
Доброе утро!

📅 Отчет за ${yesterday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}

📦 Принято: ${testData.accepted.count} заказа(ов).
🛍 Кол-во товаров: ${testData.accepted.items}.
🏦 Выручка: ${formatSum(testData.accepted.revenue)} сум
💰 Прибыль к выплате: ${formatSum(testData.accepted.profit)} сум
💵 Чистая прибыль: ${formatSum(testData.accepted.netProfit)} сум

📤 Выдано: ${testData.issued.count} заказа(ов).
🏦 Выручка: ${formatSum(testData.issued.revenue)} сум
💰 Прибыль к выплате: ${formatSum(testData.issued.profit)} сум
💵 Чистая прибыль: ${formatSum(testData.issued.netProfit)} сум

❌ Отменено: ${testData.cancelled.count} заказа(ов).
🚫 Сумма: ${formatSum(testData.cancelled.sum)} сум

${testData.cancelled.other > 0 ? `🤷‍♂️ Отменены по другим причинам: ${testData.cancelled.other}\n` : ''}
${testData.payouts.yesterday.sum > 0 ? `💵 Вчера вам выплатили: ${formatSum(testData.payouts.yesterday.sum)} сум за ${testData.payouts.yesterday.orders} заказ(ов).\n` : ''}
${testData.payouts.today.sum > 0 ? `💵 Вам Сегодня должны выплатить: ${formatSum(testData.payouts.today.sum)} сум за ${testData.payouts.today.orders} заказ(ов).\n` : ''}
${testData.expenses.fines + testData.expenses.logistics > 0 ? `🚫 Вчера с вас было списано: ${formatSum(testData.expenses.fines + testData.expenses.logistics)} сум:` : ''}${testData.expenses.fines > 0 ? `\n➤ Штраф FBS: ${formatSum(testData.expenses.fines)} сум` : ''}${testData.expenses.logistics > 0 ? `\n➤ Логистика: ${formatSum(testData.expenses.logistics)} сум` : ''}

${testData.returns > 0 ? `💵 Вчера вам было возвращено: ${formatSum(testData.returns)} сум\n` : ''}
`;

console.log('=' .repeat(60));
console.log(report.trim());
console.log('=' .repeat(60));

console.log('\n✅ Отчет успешно сгенерирован!');
console.log(`📊 Статистика:`);
console.log(`   - Принято заказов: ${testData.accepted.count}`);
console.log(`   - Выдано заказов: ${testData.issued.count}`);
console.log(`   - Отменено заказов: ${testData.cancelled.count}`);
console.log(`   - Чистая прибыль (принятые): ${formatSum(testData.accepted.netProfit)} сум`);
console.log(`   - Чистая прибыль (выданные): ${formatSum(testData.issued.netProfit)} сум`);
console.log(`   - К выплате сегодня: ${formatSum(testData.payouts.today.sum)} сум`);

console.log('\n📤 Для отправки в Telegram:');
console.log('   1. Настройте TELEGRAM_BOT_TOKEN в .env');
console.log('   2. Запустите: node test-send-message.js');
console.log('   3. Пользователь должен написать боту /start');

console.log('\n⏰ Автоматическая отправка:');
console.log('   - Каждый день в 7:00 утра (Asia/Tashkent)');
console.log('   - Для всех пользователей с активной интеграцией');
console.log('   - Запуск: node bot.js или npm start');

console.log('\n🎉 Система готова к работе!\n');
