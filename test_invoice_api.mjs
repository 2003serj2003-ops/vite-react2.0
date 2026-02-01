#!/usr/bin/env node

/**
 * Test script for UZUM Invoice API endpoints
 * Tests all 6 endpoints:
 * 1. GET /v1/invoice - Получение списка накладных
 * 2. GET /v1/return - Получение возвратов продавца
 * 3. GET /v1/shop/{shopId}/invoice - Получение накладных поставки по ID магазина
 * 4. GET /v1/shop/{shopId}/invoice/products - Получение состава накладной
 * 5. GET /v1/shop/{shopId}/return - Получение накладных возврата
 * 6. GET /v1/shop/{shopId}/return/{returnId} - Получение состава накладной возврата
 */

const USE_PROXY = process.env.VITE_USE_UZUM_PROXY === 'true';
const API_BASE = USE_PROXY 
  ? 'https://vite-react2-0.pages.dev/api/uzum-proxy'
  : 'https://api-seller.uzum.uz';

// ВАЖНО: Замените на ваш токен из переменной окружения или явно укажите
const TOKEN = process.argv[2] || process.env.UZUM_TOKEN;

if (!TOKEN) {
  console.error('❌ Токен не указан!');
  console.error('Использование: node test_invoice_api.mjs YOUR_TOKEN');
  console.error('Или установите переменную UZUM_TOKEN');
  process.exit(1);
}

console.log('🔑 Token:', TOKEN.substring(0, 20) + '...');
console.log('🌐 API Base:', API_BASE);
console.log('');

// Rate limiting helper
let lastRequestTime = 0;
const MIN_INTERVAL = 200; // 200ms между запросами

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_INTERVAL) {
    const waitTime = MIN_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  await waitForRateLimit();
  
  const url = USE_PROXY 
    ? `${API_BASE}?endpoint=${encodeURIComponent(endpoint)}`
    : `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (USE_PROXY) {
    headers['X-Auth-Token'] = TOKEN;
  } else {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function testEndpoint(name, endpoint) {
  console.log(`\n📋 ${name}`);
  console.log(`   Endpoint: ${endpoint}`);
  
  const result = await apiRequest(endpoint);
  
  if (result.ok) {
    console.log(`   ✅ Status: ${result.status}`);
    
    // Анализ структуры ответа
    const data = result.data?.payload || result.data;
    
    if (Array.isArray(data)) {
      console.log(`   📊 Массив: ${data.length} элементов`);
      if (data.length > 0) {
        console.log(`   🔍 Пример первого элемента:`, JSON.stringify(data[0], null, 2).split('\n').slice(0, 10).join('\n'));
      }
    } else if (data && typeof data === 'object') {
      console.log(`   📊 Объект:`, Object.keys(data));
      if (data.items && Array.isArray(data.items)) {
        console.log(`   📋 items: ${data.items.length} элементов`);
      }
      if (data.content && Array.isArray(data.content)) {
        console.log(`   📋 content: ${data.content.length} элементов`);
      }
    } else {
      console.log(`   📊 Данные:`, data);
    }
    
    return data;
  } else {
    console.log(`   ❌ Status: ${result.status}`);
    console.log(`   ⚠️  Error:`, result.error || result.data);
    return null;
  }
}

async function main() {
  console.log('🚀 Тестирование Invoice API endpoints\n');
  console.log('═'.repeat(80));
  
  // Сначала получим shop ID
  console.log('\n🏪 Получение Shop ID...');
  const shopsResult = await apiRequest('/v1/seller/shop');
  
  let shopId = null;
  if (shopsResult.ok) {
    const shops = shopsResult.data?.payload?.shops || shopsResult.data?.shops || [];
    if (shops.length > 0) {
      shopId = shops[0].id;
      console.log(`✅ Shop ID: ${shopId}`);
      console.log(`   Название: ${shops[0].name || 'N/A'}`);
    } else {
      console.log('❌ Магазины не найдены');
    }
  } else {
    console.log('❌ Ошибка получения магазинов:', shopsResult.error || shopsResult.data);
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('📋 INVOICE ENDPOINTS');
  console.log('═'.repeat(80));
  
  // 1. GET /v1/invoice - Получение списка накладных
  const invoices = await testEndpoint(
    '1. Получение списка накладных',
    '/v1/invoice?limit=10'
  );
  
  // 3. GET /v1/shop/{shopId}/invoice - Получение накладных поставки по ID магазина
  if (shopId) {
    const shopInvoices = await testEndpoint(
      '3. Получение накладных поставки по ID магазина',
      `/v1/shop/${shopId}/invoice?limit=10`
    );
    
    // 4. GET /v1/shop/{shopId}/invoice/products - Получение состава накладной
    if (shopInvoices && Array.isArray(shopInvoices) && shopInvoices.length > 0) {
      const invoiceId = shopInvoices[0].id || shopInvoices[0].invoiceId;
      if (invoiceId) {
        await testEndpoint(
          '4. Получение состава накладной',
          `/v1/shop/${shopId}/invoice/products?invoiceId=${invoiceId}`
        );
      } else {
        console.log('\n⚠️  Не найден invoiceId для тестирования состава накладной');
      }
    } else {
      console.log('\n⚠️  Нет накладных для получения состава');
    }
  } else {
    console.log('\n⚠️  Shop ID не найден, пропускаем тесты с shopId');
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('🔙 RETURN ENDPOINTS');
  console.log('═'.repeat(80));
  
  // 2. GET /v1/return - Получение возвратов продавца
  await testEndpoint(
    '2. Получение возвратов продавца',
    '/v1/return?limit=10'
  );
  
  // 5. GET /v1/shop/{shopId}/return - Получение накладных возврата
  if (shopId) {
    const shopReturns = await testEndpoint(
      '5. Получение накладных возврата',
      `/v1/shop/${shopId}/return?limit=10`
    );
    
    // 6. GET /v1/shop/{shopId}/return/{returnId} - Получение состава накладной возврата
    if (shopReturns && Array.isArray(shopReturns) && shopReturns.length > 0) {
      const returnId = shopReturns[0].id || shopReturns[0].returnId;
      if (returnId) {
        await testEndpoint(
          '6. Получение состава накладной возврата',
          `/v1/shop/${shopId}/return/${returnId}`
        );
      } else {
        console.log('\n⚠️  Не найден returnId для тестирования состава возврата');
      }
    } else {
      console.log('\n⚠️  Нет возвратов для получения состава');
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ Тестирование завершено!');
  console.log('═'.repeat(80));
}

main().catch(err => {
  console.error('\n❌ Критическая ошибка:', err);
  process.exit(1);
});
