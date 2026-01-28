#!/usr/bin/env node

/**
 * Полный тест всех Uzum API endpoints
 * Использование: node test_all_endpoints.mjs <token> <shopId>
 */

const token = process.argv[2];
const shopId = process.argv[3];

if (!token || !shopId) {
  console.error('❌ Использование: node test_all_endpoints.mjs <token> <shopId>');
  console.error('   Пример: node test_all_endpoints.mjs "eyJhbG..." 96273');
  process.exit(1);
}

console.log('🔍 ПОЛНЫЙ ТЕСТ UZUM API');
console.log('=' .repeat(60));
console.log(`📋 Shop ID: ${shopId}`);
console.log(`🔑 Token: ${token.substring(0, 20)}...`);
console.log('=' .repeat(60));
console.log('');

// Базовые настройки
const BASE_URL = 'https://api-seller.uzum.uz/api/seller-openapi';
const PROXY_URL = 'http://localhost:5173/api/uzum-proxy';

// Функция для выполнения запроса
async function testEndpoint(name, path, method = 'GET', body = null, useProxy = false) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📍 ${name}`);
  console.log(`   Path: ${path}`);
  console.log(`   Method: ${method}`);
  
  const startTime = Date.now();
  
  try {
    let response;
    
    if (useProxy) {
      // Через прокси (как в приложении)
      console.log(`   Via: PROXY (${PROXY_URL})`);
      
      const proxyUrl = `${PROXY_URL}?path=${encodeURIComponent(path)}`;
      const headers = {
        'Authorization': token,
        'Accept': 'application/json',
      };
      
      if (body || method === 'POST') {
        headers['Content-Type'] = 'application/json';
      }
      
      response = await fetch(proxyUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } else {
      // Напрямую (curl-like)
      console.log(`   Via: DIRECT (${BASE_URL})`);
      
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          'Authorization': token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    }
    
    const duration = Date.now() - startTime;
    const status = response.status;
    
    console.log(`   Status: ${status} ${response.statusText}`);
    console.log(`   Time: ${duration}ms`);
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log(`   ⚠️  Response is not valid JSON: ${text.substring(0, 100)}`);
        return { success: false, status, error: 'Invalid JSON', raw: text };
      }
    } else {
      const text = await response.text();
      console.log(`   ⚠️  Response Content-Type: ${contentType}`);
      console.log(`   Response: ${text.substring(0, 200)}`);
      return { success: false, status, error: 'Not JSON', raw: text };
    }
    
    if (status >= 200 && status < 300) {
      console.log(`   ✅ SUCCESS`);
      
      // Показываем структуру ответа
      if (Array.isArray(data)) {
        console.log(`   📦 Response: Array[${data.length}]`);
        if (data.length > 0) {
          console.log(`   📄 First item keys: ${Object.keys(data[0]).join(', ')}`);
        }
      } else if (typeof data === 'object' && data !== null) {
        console.log(`   📦 Response: Object`);
        console.log(`   📄 Keys: ${Object.keys(data).join(', ')}`);
        
        // Для специфичных ответов
        if (data.orderItems) console.log(`   💰 Orders count: ${data.orderItems.length}`);
        if (data.expenses) console.log(`   💸 Expenses count: ${data.expenses.length}`);
        if (data.productList) console.log(`   📦 Products count: ${data.productList.length}`);
      } else {
        console.log(`   📦 Response: ${typeof data} = ${data}`);
      }
      
      return { success: true, status, data };
    } else {
      console.log(`   ❌ ERROR: ${status}`);
      console.log(`   💬 Message: ${JSON.stringify(data, null, 2)}`);
      return { success: false, status, error: data };
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ EXCEPTION (${duration}ms)`);
    console.log(`   💬 Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Тесты
const dateFromMs = new Date('2026-01-01T00:00:00').getTime();
const dateToMs = new Date().getTime();

console.log('\n🎯 НАЧИНАЕМ ТЕСТИРОВАНИЕ\n');

// Результаты
const results = {
  direct: {},
  proxy: {}
};

// 1. GET Shops (прямой)
results.direct.shops = await testEndpoint(
  'GET Shops (DIRECT)',
  '/v1/shops',
  'GET',
  null,
  false
);

// 2. GET Shops (через прокси)
results.proxy.shops = await testEndpoint(
  'GET Shops (PROXY)',
  '/v1/shops',
  'GET',
  null,
  true
);

// 3. GET Products (прямой)
results.direct.products = await testEndpoint(
  'GET Products (DIRECT)',
  `/v1/product/shop/${shopId}?size=10&page=0`,
  'GET',
  null,
  false
);

// 4. GET Products (через прокси)
results.proxy.products = await testEndpoint(
  'GET Products (PROXY)',
  `/v1/product/shop/${shopId}?size=10&page=0`,
  'GET',
  null,
  true
);

// 5. GET FBS Orders Count (прямой)
results.direct.ordersCount = await testEndpoint(
  'GET FBS Orders Count (DIRECT)',
  `/v2/fbs/orders/count?shopIds=${shopId}&status=COMPLETED`,
  'GET',
  null,
  false
);

// 6. GET FBS Orders Count (через прокси)
results.proxy.ordersCount = await testEndpoint(
  'GET FBS Orders Count (PROXY)',
  `/v2/fbs/orders/count?shopIds=${shopId}&status=COMPLETED`,
  'GET',
  null,
  true
);

// 7. GET FBS Orders (прямой)
results.direct.orders = await testEndpoint(
  'GET FBS Orders (DIRECT)',
  `/v2/fbs/orders?shopIds=${shopId}&size=10&page=0`,
  'GET',
  null,
  false
);

// 8. GET FBS Orders (через прокси)
results.proxy.orders = await testEndpoint(
  'GET FBS Orders (PROXY)',
  `/v2/fbs/orders?shopIds=${shopId}&size=10&page=0`,
  'GET',
  null,
  true
);

// 9. GET Finance Orders (прямой)
results.direct.financeOrders = await testEndpoint(
  'GET Finance Orders (DIRECT)',
  `/v1/finance/orders?shopId=${shopId}&shopIds=${shopId}&size=10&page=0&dateFrom=${dateFromMs}&dateTo=${dateToMs}`,
  'GET',
  null,
  false
);

// 10. GET Finance Orders (через прокси)
results.proxy.financeOrders = await testEndpoint(
  'GET Finance Orders (PROXY)',
  `/v1/finance/orders?shopId=${shopId}&shopIds=${shopId}&size=10&page=0&dateFrom=${dateFromMs}&dateTo=${dateToMs}`,
  'GET',
  null,
  true
);

// 11. GET Finance Expenses (прямой)
results.direct.financeExpenses = await testEndpoint(
  'GET Finance Expenses (DIRECT)',
  `/v1/finance/expenses?shopId=${shopId}&shopIds=${shopId}&size=10&page=0&dateFrom=${dateFromMs}&dateTo=${dateToMs}`,
  'GET',
  null,
  false
);

// 12. GET Finance Expenses (через прокси)
results.proxy.financeExpenses = await testEndpoint(
  'GET Finance Expenses (PROXY)',
  `/v1/finance/expenses?shopId=${shopId}&shopIds=${shopId}&size=10&page=0&dateFrom=${dateFromMs}&dateTo=${dateToMs}`,
  'GET',
  null,
  true
);

// Итоговый отчет
console.log('\n\n');
console.log('═'.repeat(60));
console.log('📊 ИТОГОВЫЙ ОТЧЕТ');
console.log('═'.repeat(60));

function printResult(name, direct, proxy) {
  const directIcon = direct?.success ? '✅' : '❌';
  const proxyIcon = proxy?.success ? '✅' : '❌';
  const directStatus = direct?.status || '???';
  const proxyStatus = proxy?.status || '???';
  
  console.log(`\n${name}:`);
  console.log(`  DIRECT: ${directIcon} ${directStatus}`);
  console.log(`  PROXY:  ${proxyIcon} ${proxyStatus}`);
  
  if (!direct?.success) {
    console.log(`    ⚠️  Direct error: ${direct?.error || 'Unknown'}`);
  }
  if (!proxy?.success) {
    console.log(`    ⚠️  Proxy error: ${proxy?.error || 'Unknown'}`);
  }
  
  return { direct: direct?.success, proxy: proxy?.success };
}

const summary = {
  shops: printResult('1. Shops', results.direct.shops, results.proxy.shops),
  products: printResult('2. Products', results.direct.products, results.proxy.products),
  ordersCount: printResult('3. Orders Count', results.direct.ordersCount, results.proxy.ordersCount),
  orders: printResult('4. FBS Orders', results.direct.orders, results.proxy.orders),
  financeOrders: printResult('5. Finance Orders', results.direct.financeOrders, results.proxy.financeOrders),
  financeExpenses: printResult('6. Finance Expenses', results.direct.financeExpenses, results.proxy.financeExpenses),
};

console.log('\n' + '═'.repeat(60));
console.log('🎯 ВЫВОДЫ:');
console.log('═'.repeat(60));

const allDirect = Object.values(summary).every(s => s.direct);
const allProxy = Object.values(summary).every(s => s.proxy);

if (allDirect && allProxy) {
  console.log('✅ ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!');
} else {
  console.log('❌ ЕСТЬ ПРОБЛЕМЫ:');
  
  if (!allDirect) {
    console.log('\n  DIRECT запросы:');
    Object.entries(summary).forEach(([key, val]) => {
      if (!val.direct) console.log(`    ❌ ${key}`);
    });
  }
  
  if (!allProxy) {
    console.log('\n  PROXY запросы:');
    Object.entries(summary).forEach(([key, val]) => {
      if (!val.proxy) console.log(`    ❌ ${key}`);
    });
  }
  
  console.log('\n💡 Рекомендации:');
  
  if (summary.shops.direct && !summary.shops.proxy) {
    console.log('  - Проблема с прокси: проверьте vite.config.ts');
  }
  
  if (!summary.orders.direct && !summary.orders.proxy) {
    console.log('  - Orders endpoint не работает: проверьте путь /v2/fbs/orders');
  }
  
  if (!summary.financeOrders.direct && !summary.financeOrders.proxy) {
    console.log('  - Finance Orders endpoint не работает: проверьте путь /v1/finance/orders');
  }
  
  if (summary.products.direct && summary.products.proxy && !summary.orders.proxy) {
    console.log('  - Products работает, Orders нет: возможно проблема в параметрах запроса');
  }
}

console.log('\n' + '═'.repeat(60));
console.log('✨ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
console.log('═'.repeat(60));
console.log('');
