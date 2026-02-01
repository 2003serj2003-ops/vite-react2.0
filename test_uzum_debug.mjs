#!/usr/bin/env node

/**
 * Debug script для проверки проблемы с данными в UZUM Dashboard
 * Этот скрипт проверяет:
 * 1. Загрузку остатков (stocks)
 * 2. Загрузку финансовых заказов (finance orders)
 * 3. Загрузку расходов (finance expenses)
 */

console.log('\n🔍 UZUM Dashboard Debug Script\n');
console.log('=' .repeat(60));
console.log('\nЭтот скрипт нужно запустить с реальными учетными данными:');
console.log('');
console.log('Способ 1: Через переменные окружения');
console.log('  UZUM_TOKEN=your_token UZUM_SHOP_ID=123 node test_uzum_debug.mjs');
console.log('');
console.log('Способ 2: Редактировать скрипт и вставить данные напрямую');
console.log('  const TOKEN = "ваш_токен";');
console.log('  const SHOP_ID = 123;');
console.log('');
console.log('=' .repeat(60));
console.log('\n');

// ВСТАВЬТЕ СЮДА СВОИ РЕАЛЬНЫЕ ДАННЫЕ ДЛЯ ТЕСТИРОВАНИЯ:
const TOKEN = process.env.UZUM_TOKEN || '';
const SHOP_ID = process.env.UZUM_SHOP_ID || '';

// Или раскомментируйте и вставьте напрямую:
// const TOKEN = 'ваш_реальный_токен_здесь';
// const SHOP_ID = '12345';

if (!TOKEN || !SHOP_ID) {
  console.error('❌ Ошибка: Не указаны учетные данные!');
  console.error('Пожалуйста, укажите UZUM_TOKEN и UZUM_SHOP_ID');
  process.exit(1);
}

console.log('✓ Токен: ' + TOKEN.substring(0, 20) + '...');
console.log('✓ Shop ID: ' + SHOP_ID);
console.log('');

// Функция для делеция запроса через прокси
async function makeRequest(endpoint, method = 'GET', body = null) {
  const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
  
  const proxyBody = {
    path: endpoint,
    method: method,
    headers: {
      'Authorization': TOKEN,
    },
  };

  if (body && method !== 'GET') {
    proxyBody.body = body;
  }

  console.log(`\n📡 Запрос: ${method} ${endpoint}`);
  
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proxyBody),
    });

    const status = response.status;
    console.log(`   Статус: ${status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`   ❌ Ошибка: ${text}`);
      return { success: false, status, error: text };
    }

    const data = await response.json();
    
    // Извлекаем payload если есть
    let result = data;
    if (data && typeof data === 'object' && 'payload' in data) {
      console.log('   📦 Извлечен payload из ответа');
      result = data.payload;
    }

    console.log(`   ✓ Данные получены`);
    return { success: true, status, data: result };

  } catch (error) {
    console.error(`   ❌ Ошибка сети:`, error.message);
    return { success: false, error: error.message };
  }
}

// Тест 1: Проверка остатков
async function testStocks() {
  console.log('\n' + '='.repeat(60));
  console.log('ТЕСТ 1: Проверка остатков (Stocks)');
  console.log('='.repeat(60));

  const result = await makeRequest('/v2/fbs/sku/stocks?limit=100&offset=0');
  
  if (!result.success) {
    console.error('\n❌ Не удалось загрузить остатки');
    return;
  }

  console.log('\n📊 Анализ данных:');
  console.log('   Тип данных:', typeof result.data);
  console.log('   Это массив?', Array.isArray(result.data));
  
  if (result.data && typeof result.data === 'object') {
    console.log('   Ключи:', Object.keys(result.data).join(', '));
  }

  // Пробуем извлечь массив остатков
  let stocks = null;
  if (Array.isArray(result.data)) {
    stocks = result.data;
    console.log('   ✓ Данные - это прямой массив');
  } else if (result.data?.items && Array.isArray(result.data.items)) {
    stocks = result.data.items;
    console.log('   ✓ Данные в поле "items"');
  } else if (result.data?.stocks && Array.isArray(result.data.stocks)) {
    stocks = result.data.stocks;
    console.log('   ✓ Данные в поле "stocks"');
  } else if (result.data?.data && Array.isArray(result.data.data)) {
    stocks = result.data.data;
    console.log('   ✓ Данные в поле "data"');
  } else {
    console.log('   ⚠️  Не удалось найти массив остатков');
    console.log('\n📄 Полный ответ API:');
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  console.log(`\n   📦 Найдено товаров: ${stocks.length}`);

  if (stocks.length === 0) {
    console.log('   ⚠️  Нет товаров с остатками!');
    return;
  }

  // Показываем первый товар для примера
  console.log('\n   Пример первого товара:');
  console.log(JSON.stringify(stocks[0], null, 2));

  // Подсчитываем остатки по типам склада
  let fboTotal = 0;
  let fbsTotal = 0;
  let dbsTotal = 0;

  stocks.forEach((item) => {
    const warehouseType = item.warehouseType || item.warehouse_type || '';
    const amount = item.amount || item.stock || item.quantity || 0;

    if (warehouseType.toLowerCase().includes('fbo')) {
      fboTotal += amount;
    } else if (warehouseType.toLowerCase().includes('fbs')) {
      fbsTotal += amount;
    } else if (warehouseType.toLowerCase().includes('dbs')) {
      dbsTotal += amount;
    }
  });

  console.log('\n📊 Итоговые остатки:');
  console.log(`   FBO: ${fboTotal}`);
  console.log(`   FBS: ${fbsTotal}`);
  console.log(`   DBS: ${dbsTotal}`);
  console.log(`   Всего: ${fboTotal + fbsTotal + dbsTotal}`);
}

// Тест 2: Проверка финансовых заказов
async function testFinanceOrders() {
  console.log('\n' + '='.repeat(60));
  console.log('ТЕСТ 2: Проверка финансовых заказов (Finance Orders)');
  console.log('='.repeat(60));

  // Последние 7 дней
  const endDate = Date.now();
  const startDate = endDate - (7 * 24 * 60 * 60 * 1000);

  const endpoint = `/v1/finance/orders?shopId=${SHOP_ID}&shopIds=${SHOP_ID}&size=100&page=0&dateFrom=${startDate}&dateTo=${endDate}`;
  const result = await makeRequest(endpoint);
  
  if (!result.success) {
    console.error('\n❌ Не удалось загрузить финансовые заказы');
    return;
  }

  console.log('\n📊 Анализ данных:');
  console.log('   Тип данных:', typeof result.data);
  
  if (result.data && typeof result.data === 'object') {
    console.log('   Ключи:', Object.keys(result.data).join(', '));
  }

  // Извлекаем заказы
  const orders = result.data?.orderItems || [];
  const total = result.data?.totalElements || 0;

  console.log(`\n   📦 Найдено заказов: ${orders.length} из ${total}`);

  if (orders.length === 0) {
    console.log('   ⚠️  Нет финансовых заказов за последние 7 дней!');
    return;
  }

  // Показываем первый заказ для примера
  console.log('\n   Пример первого заказа:');
  console.log(JSON.stringify(orders[0], null, 2));

  // Подсчитываем выручку и прибыль
  let revenue = 0;
  let profit = 0;

  orders.forEach(order => {
    const sellPrice = order.sellPrice || 0;
    const amount = order.amount || 1;
    const sellerProfit = order.sellerProfit || 0;

    revenue += sellPrice * amount;
    profit += sellerProfit * amount;
  });

  console.log('\n💰 Финансовые показатели (последние 7 дней):');
  console.log(`   Выручка: ${revenue.toLocaleString('ru-RU')} сум`);
  console.log(`   Прибыль: ${profit.toLocaleString('ru-RU')} сум`);
}

// Тест 3: Проверка расходов
async function testFinanceExpenses() {
  console.log('\n' + '='.repeat(60));
  console.log('ТЕСТ 3: Проверка расходов (Finance Expenses)');
  console.log('='.repeat(60));

  // Последние 7 дней
  const endDate = Date.now();
  const startDate = endDate - (7 * 24 * 60 * 60 * 1000);

  const endpoint = `/v1/finance/expenses?shopIds=${SHOP_ID}&size=100&page=0&dateFrom=${startDate}&dateTo=${endDate}`;
  const result = await makeRequest(endpoint);
  
  if (!result.success) {
    console.error('\n❌ Не удалось загрузить расходы');
    return;
  }

  console.log('\n📊 Анализ данных:');
  console.log('   Тип данных:', typeof result.data);
  
  if (result.data && typeof result.data === 'object') {
    console.log('   Ключи:', Object.keys(result.data).join(', '));
  }

  // Извлекаем расходы - API может возвращать разные структуры
  let expenses = [];
  if (result.data?.payload?.payments) {
    expenses = result.data.payload.payments;
    console.log('   ✓ Данные в поле "payload.payments"');
  } else if (Array.isArray(result.data)) {
    expenses = result.data;
    console.log('   ✓ Данные - это прямой массив');
  } else if (result.data?.expenses) {
    expenses = result.data.expenses;
    console.log('   ✓ Данные в поле "expenses"');
  } else {
    console.log('   ⚠️  Не удалось найти массив расходов');
    console.log('\n📄 Полный ответ API:');
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  console.log(`\n   📦 Найдено расходов: ${expenses.length}`);

  if (expenses.length === 0) {
    console.log('   ⚠️  Нет расходов за последние 7 дней!');
    return;
  }

  // Показываем первый расход для примера
  console.log('\n   Пример первого расхода:');
  console.log(JSON.stringify(expenses[0], null, 2));

  // Подсчитываем расходы по категориям
  const expensesByCategory = {
    marketing: 0,
    commission: 0,
    logistics: 0,
    fines: 0,
  };

  expenses.forEach(expense => {
    const amount = Math.abs(
      expense.paymentPrice || 
      expense.amount || 
      expense.price || 
      expense.sum || 
      0
    );
    
    const type = (expense.type || expense.category || '').toLowerCase();
    const source = (expense.source || '').toLowerCase();
    const description = (expense.description || expense.name || '').toLowerCase();
    
    const allText = `${type} ${source} ${description}`.toLowerCase();
    
    if (allText.includes('market') || allText.includes('маркет') || allText.includes('marketing') || allText.includes('реклам')) {
      expensesByCategory.marketing += amount;
    } else if (allText.includes('commi') || allText.includes('комисс') || allText.includes('fee') || allText.includes('сбор')) {
      expensesByCategory.commission += amount;
    } else if (allText.includes('logist') || allText.includes('логист') || allText.includes('delivery') || allText.includes('доставк') || allText.includes('shipping')) {
      expensesByCategory.logistics += amount;
    } else if (allText.includes('fine') || allText.includes('штраф') || allText.includes('penalty') || allText.includes('пеня')) {
      expensesByCategory.fines += amount;
    } else {
      expensesByCategory.commission += amount;
    }
  });

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

  console.log('\n💸 Расходы по категориям (последние 7 дней):');
  console.log(`   Маркетинг: ${expensesByCategory.marketing.toLocaleString('ru-RU')} сум`);
  console.log(`   Комиссия: ${expensesByCategory.commission.toLocaleString('ru-RU')} сум`);
  console.log(`   Логистика: ${expensesByCategory.logistics.toLocaleString('ru-RU')} сум`);
  console.log(`   Штрафы: ${expensesByCategory.fines.toLocaleString('ru-RU')} сум`);
  console.log(`   ИТОГО: ${totalExpenses.toLocaleString('ru-RU')} сум`);
}

// Запускаем все тесты
async function runAllTests() {
  await testStocks();
  await testFinanceOrders();
  await testFinanceExpenses();
  
  console.log('\n' + '='.repeat(60));
  console.log('✓ Все тесты завершены');
  console.log('='.repeat(60));
  console.log('\nЕсли вы видите ошибки или пустые данные, это объясняет');
  console.log('почему дашборд не показывает информацию.');
  console.log('');
}

runAllTests().catch(error => {
  console.error('\n❌ Критическая ошибка:', error);
  process.exit(1);
});
