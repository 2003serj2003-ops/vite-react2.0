/**
 * Система ежедневных отчетов для Uzum Seller Bot
 * Отправляет отчет каждый день в 7:00 утра по местному времени
 */

const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Конфигурация
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Не все переменные окружения установлены');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Получить данные из Uzum API через прокси
 */
async function fetchUzumData(token, endpoint, params = {}) {
  const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
  
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      token,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Получить вчерашнюю дату в формате YYYY-MM-DD
 */
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Получить начало и конец вчерашнего дня в миллисекундах
 */
function getYesterdayRange() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const startMs = yesterday.getTime();
  
  yesterday.setHours(23, 59, 59, 999);
  const endMs = yesterday.getTime();
  
  return { startMs, endMs };
}

/**
 * Форматировать число как сумму
 */
function formatSum(num) {
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

/**
 * Генерация ежедневного отчета для пользователя
 */
async function generateDailyReport(userId, token) {
  try {
    const yesterday = getYesterdayDate();
    const { startMs, endMs } = getYesterdayRange();

    // Получаем магазин
    const shopsData = await fetchUzumData(token, '/shop/shops', {});
    if (!shopsData.success || !shopsData.shops || shopsData.shops.length === 0) {
      throw new Error('Магазин не найден');
    }
    const shopId = shopsData.shops[0].id;

    // Получаем заказы за вчера
    const ordersData = await fetchUzumData(token, '/fbs/orders', {
      shopId,
      dateFrom: startMs,
      dateTo: endMs,
      status: 'all'
    });

    const orders = ordersData.success && ordersData.result ? ordersData.result : [];

    // Получаем финансовые заказы
    const financeOrders = await fetchUzumData(token, '/finance/orders', {
      shopId,
      dateFromMs: startMs,
      dateToMs: endMs,
    });

    // Получаем расходы
    const expenses = await fetchUzumData(token, '/finance/expenses', {
      shopId,
      dateFromMs: startMs,
      dateToMs: endMs,
    });

    // Анализ заказов
    const accepted = orders.filter(o => o.status === 'CREATED' && !o.cancelled);
    const issued = orders.filter(o => ['DELIVERED', 'COMPLETED', 'DELIVERED_TO_CUSTOMER_DELIVERY_POINT'].includes(o.status) && !o.cancelled);
    const cancelled = orders.filter(o => o.cancelled || o.status === 'CANCELED');
    
    // Подсчет товаров в принятых заказах
    const acceptedItemsCount = accepted.reduce((sum, o) => sum + (o.amount || 1), 0);
    
    // Выручка и прибыль принятых
    let acceptedRevenue = 0;
    let acceptedProfit = 0;
    accepted.forEach(order => {
      const amount = order.amount || 1;
      const price = order.pricePerItem || 0;
      const commission = order.commission || 0;
      const logistics = order.logisticDeliveryFee || 0;
      
      acceptedRevenue += price * amount;
      acceptedProfit += (price - commission - logistics) * amount;
    });

    // Выручка и прибыль выданных
    let issuedRevenue = 0;
    let issuedProfit = 0;
    issued.forEach(order => {
      const amount = order.amount || 1;
      const price = order.pricePerItem || 0;
      const commission = order.commission || 0;
      const logistics = order.logisticDeliveryFee || 0;
      
      issuedRevenue += price * amount;
      issuedProfit += (price - commission - logistics) * amount;
    });

    // Сумма отмененных
    let cancelledSum = 0;
    let cancelledOther = 0;
    cancelled.forEach(order => {
      const amount = order.amount || 1;
      const price = order.pricePerItem || 0;
      cancelledSum += price * amount;
      
      // Подсчет отмен по другим причинам (не по вине продавца)
      if (order.cancellationReason && !order.cancellationReason.includes('seller')) {
        cancelledOther++;
      }
    });

    // Расходы
    let totalFines = 0;
    let totalLogistics = 0;
    let totalOther = 0;

    if (expenses.success && expenses.result) {
      expenses.result.forEach(expense => {
        const amount = (expense.paymentPrice || 0) * (expense.amount || 1);
        
        if (expense.type?.toLowerCase().includes('fine') || expense.type?.toLowerCase().includes('штраф')) {
          totalFines += Math.abs(amount);
        } else if (expense.type?.toLowerCase().includes('logistic') || expense.type?.toLowerCase().includes('логистика')) {
          totalLogistics += Math.abs(amount);
        } else {
          totalOther += Math.abs(amount);
        }
      });
    }

    // Выплаты (используем финансовые заказы)
    let yesterdayPayout = 0;
    let yesterdayPayoutOrders = 0;
    let todayPayout = 0;
    let todayPayoutOrders = 0;

    if (financeOrders.success && financeOrders.result) {
      const today = new Date().toISOString().split('T')[0];
      
      financeOrders.result.forEach(order => {
        const payoutDate = order.payoutDate ? new Date(order.payoutDate).toISOString().split('T')[0] : null;
        const amount = (order.pricePerItem || 0) * (order.amount || 1);
        
        if (payoutDate === yesterday) {
          yesterdayPayout += amount;
          yesterdayPayoutOrders++;
        } else if (payoutDate === today) {
          todayPayout += amount;
          todayPayoutOrders++;
        }
      });
    }

    // Возвраты
    const returnAmount = 0; // TODO: добавить когда API будет возвращать корректные данные

    // Чистая прибыль
    const acceptedNetProfit = acceptedProfit - totalFines - totalLogistics - totalOther;
    const issuedNetProfit = issuedProfit - totalFines - totalLogistics - totalOther;

    // Формирование отчета
    const report = `
🟣 Uzum Market
Доброе утро!

📅 Отчет за ${new Date(startMs).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}

📦 Принято: ${accepted.length} заказа(ов).
🛍 Кол-во товаров: ${acceptedItemsCount}.
🏦 Выручка: ${formatSum(acceptedRevenue)} сум
💰 Прибыль к выплате: ${formatSum(acceptedProfit)} сум
💵 Чистая прибыль: ${formatSum(acceptedNetProfit)} сум

📤 Выдано: ${issued.length} заказа(ов).
🏦 Выручка: ${formatSum(issuedRevenue)} сум
💰 Прибыль к выплате: ${formatSum(issuedProfit)} сум
💵 Чистая прибыль: ${formatSum(issuedNetProfit)} сум

❌ Отменено: ${cancelled.length} заказа(ов).
🚫 Сумма: ${formatSum(cancelledSum)} сум

${cancelledOther > 0 ? `🤷‍♂️ Отменены по другим причинам: ${cancelledOther}\n` : ''}
${yesterdayPayout > 0 ? `💵 Вчера вам выплатили: ${formatSum(yesterdayPayout)} сум за ${yesterdayPayoutOrders} заказ(ов).\n` : ''}
${todayPayout > 0 ? `💵 Вам Сегодня должны выплатить: ${formatSum(todayPayout)} сум за ${todayPayoutOrders} заказ(ов).\n` : ''}
${totalFines + totalLogistics > 0 ? `🚫 Вчера с вас было списано: ${formatSum(totalFines + totalLogistics)} сум:` : ''}${totalFines > 0 ? `\n➤ Штраф FBS: ${formatSum(totalFines)} сум` : ''}${totalLogistics > 0 ? `\n➤ Логистика: ${formatSum(totalLogistics)} сум` : ''}

${returnAmount > 0 ? `💵 Вчера вам было возвращено: ${formatSum(returnAmount)} сум\n` : ''}
`;

    return report.trim();
  } catch (error) {
    console.error('❌ Ошибка генерации отчета:', error);
    throw error;
  }
}

/**
 * Отправить ежедневные отчеты всем пользователям с интеграцией
 */
async function sendDailyReports() {
  console.log('📊 Начинаю отправку ежедневных отчетов...');

  try {
    // Получаем всех пользователей с активной интеграцией Uzum
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('user_id, token_encrypted')
      .eq('integration_name', 'uzum')
      .eq('active', true);

    if (error) {
      console.error('❌ Ошибка получения интеграций:', error);
      return;
    }

    if (!integrations || integrations.length === 0) {
      console.log('ℹ️ Нет активных интеграций Uzum');
      return;
    }

    console.log(`📤 Найдено ${integrations.length} активных интеграций`);

    // Отправляем отчет каждому пользователю
    for (const integration of integrations) {
      try {
        // Расшифровываем токен (в реальности нужно использовать crypto.ts)
        const token = integration.token_encrypted; // TODO: расшифровать

        // Генерируем отчет
        const report = await generateDailyReport(integration.user_id, token);

        // Получаем telegram_id пользователя
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('telegram_id')
          .eq('id', integration.user_id)
          .single();

        if (userError || !user?.telegram_id) {
          console.log(`⚠️ Пользователь ${integration.user_id} не имеет telegram_id`);
          continue;
        }

        // Отправляем отчет в Telegram
        await bot.sendMessage(user.telegram_id, report, {
          parse_mode: 'HTML'
        });

        console.log(`✅ Отчет отправлен пользователю ${integration.user_id} (${user.telegram_id})`);

        // Задержка между отправками
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Ошибка отправки отчета пользователю ${integration.user_id}:`, error);
      }
    }

    console.log('✅ Отправка ежедневных отчетов завершена');
  } catch (error) {
    console.error('❌ Критическая ошибка при отправке отчетов:', error);
  }
}

/**
 * Настройка cron задачи - каждый день в 7:00
 * Формат: секунды минуты часы день месяц день_недели
 */
function setupDailyReports() {
  // Запуск каждый день в 7:00 утра
  cron.schedule('0 7 * * *', () => {
    console.log('⏰ Запуск ежедневных отчетов (7:00)');
    sendDailyReports();
  }, {
    timezone: "Asia/Tashkent" // Узбекистан UTC+5
  });

  console.log('✅ Планировщик ежедневных отчетов запущен (каждый день в 7:00)');
}

// Экспорт функций
module.exports = {
  setupDailyReports,
  sendDailyReports, // для тестирования
  generateDailyReport, // для тестирования
};

// Если запущен как основной модуль
if (require.main === module) {
  setupDailyReports();
  
  // Тестовая отправка (раскомментировать для теста)
  // sendDailyReports();
}
