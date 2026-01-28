#!/usr/bin/env node

/**
 * Тест-скрипт для проверки работы прокси Uzum API
 * Использование: node test_proxy_fix.mjs <token> <shopId>
 */

const token = process.argv[2];
const shopId = process.argv[3];

if (!token || !shopId) {
  console.error('❌ Использование: node test_proxy_fix.mjs <token> <shopId>');
  process.exit(1);
}

console.log('🔄 Тестирование прокси Uzum API...\n');

// Функция для теста напрямую через API (для сравнения)
async function testDirect() {
  console.log('1️⃣ Прямой запрос к Uzum API (без прокси):');
  
  try {
    // Тест getShops
    const shopsUrl = 'https://api-seller.uzum.uz/api/seller-openapi/v1/shops';
    const shopsRes = await fetch(shopsUrl, {
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      }
    });
    
    if (shopsRes.ok) {
      const shops = await shopsRes.json();
      console.log('   ✅ getShops(): OK, магазинов:', Array.isArray(shops) ? shops.length : '?');
    } else {
      console.log(`   ❌ getShops(): ${shopsRes.status}`);
    }

    // Тест getFbsOrdersCount
    const countUrl = `https://api-seller.uzum.uz/api/seller-openapi/v2/fbs/orders/count?shopIds=${shopId}&status=COMPLETED`;
    const countRes = await fetch(countUrl, {
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      }
    });
    
    if (countRes.ok) {
      const count = await countRes.json();
      console.log('   ✅ getFbsOrdersCount(COMPLETED): OK, заказов:', count);
    } else {
      console.log(`   ❌ getFbsOrdersCount(): ${countRes.status}`);
    }
    
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
  }
  
  console.log('');
}

// Функция для теста через локальный прокси (DEV режим)
async function testLocalProxy() {
  console.log('2️⃣ Запрос через локальный прокси (http://localhost:5173/api/uzum-proxy):');
  
  try {
    // Тест getShops
    const shopsRes = await fetch('http://localhost:5173/api/uzum-proxy', {
      method: 'GET',
      headers: {
        'X-Uzum-Path': '/v1/shops',
        'Authorization': token,
        'Accept': 'application/json',
      }
    });
    
    if (shopsRes.ok) {
      const shops = await shopsRes.json();
      console.log('   ✅ getShops(): OK, магазинов:', Array.isArray(shops) ? shops.length : '?');
    } else {
      console.log(`   ❌ getShops(): ${shopsRes.status}`);
    }

    // Тест getFbsOrdersCount
    const countRes = await fetch('http://localhost:5173/api/uzum-proxy', {
      method: 'GET',
      headers: {
        'X-Uzum-Path': `/v2/fbs/orders/count?shopIds=${shopId}&status=COMPLETED`,
        'Authorization': token,
        'Accept': 'application/json',
      }
    });
    
    if (countRes.ok) {
      const count = await countRes.json();
      console.log('   ✅ getFbsOrdersCount(COMPLETED): OK, заказов:', count);
    } else {
      console.log(`   ❌ getFbsOrdersCount(): ${countRes.status}`);
    }
    
  } catch (error) {
    console.log('   ❌ Ошибка:', error.message);
    console.log('   ℹ️  Убедитесь, что dev-сервер запущен: npm run dev');
  }
  
  console.log('');
}

// Запуск тестов
await testDirect();
await testLocalProxy();

console.log('✅ Тестирование завершено!');
console.log('');
console.log('📝 Для тестирования в приложении:');
console.log('   1. Откройте приложение в браузере');
console.log('   2. Перейдите в раздел Uzum');
console.log('   3. Нажмите "Test token" или "Connect"');
console.log('   4. Проверьте консоль браузера (F12) на наличие ошибок');
