#!/usr/bin/env node
/**
 * Быстрый тест API Uzum
 */

const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';

console.log('🧪 Быстрый тест Uzum API\n');
console.log('📝 Токен:', TOKEN.substring(0, 15) + '...\n');

// Тест 1: Прямой запрос
console.log('📡 Тест 1: Прямой запрос к Uzum API');
try {
  const response = await fetch('https://api-seller.uzum.uz/api/seller-openapi/v1/shops', {
    method: 'GET',
    headers: {
      'Authorization': TOKEN,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  console.log('   Статус:', response.status, response.statusText);
  
  const text = await response.text();
  console.log('   Ответ (первые 500 символов):', text.substring(0, 500));
  
  if (response.ok) {
    const data = JSON.parse(text);
    console.log('   ✅ Токен валиден!');
    console.log('   📦 Данные:', JSON.stringify(data, null, 2).substring(0, 500));
  } else {
    console.log('   ❌ Ошибка:', response.status);
  }
} catch (error) {
  console.log('   ⚠️  Ошибка:', error.message);
}

// Тест 2: Через Supabase Edge Function
console.log('\n📡 Тест 2: Через Supabase Edge Function');
try {
  const response = await fetch('https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'sb_publishable_6sJ_KOewkD5zRln2HVDWXw_vjILs-kD',
    },
    body: JSON.stringify({
      path: '/v1/shops',
      method: 'GET',
      headers: {
        'Authorization': TOKEN,
      },
    }),
  });

  console.log('   Статус:', response.status, response.statusText);
  
  const text = await response.text();
  console.log('   Ответ (первые 500 символов):', text.substring(0, 500));
  
  if (response.ok) {
    const data = JSON.parse(text);
    console.log('   ✅ Прокси работает!');
    
    if (Array.isArray(data)) {
      console.log('   📦 Получено магазинов:', data.length);
      if (data.length > 0) {
        console.log('   🏪 Первый магазин:', JSON.stringify(data[0], null, 2).substring(0, 300));
      }
    } else if (data.payload && Array.isArray(data.payload)) {
      console.log('   📦 Получено магазинов:', data.payload.length);
      if (data.payload.length > 0) {
        console.log('   🏪 Первый магазин:', JSON.stringify(data.payload[0], null, 2).substring(0, 300));
      }
    } else {
      console.log('   📦 Структура ответа:', Object.keys(data));
    }
  } else {
    console.log('   ❌ Ошибка прокси:', response.status);
  }
} catch (error) {
  console.log('   ⚠️  Ошибка:', error.message);
}

console.log('\n✨ Тестирование завершено');
