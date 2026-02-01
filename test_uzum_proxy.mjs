// Тест работоспособности uzum-proxy Edge Function

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';

console.log('🧪 Тестирование uzum-proxy Edge Function\n');

// Тест 1: Проверка CORS (OPTIONS)
console.log('1️⃣ Тест CORS (OPTIONS)...');
try {
  const response = await fetch(PROXY_URL, {
    method: 'OPTIONS',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
    }
  });
  
  console.log(`   Статус: ${response.status}`);
  console.log(`   ✅ CORS headers: ${response.headers.get('Access-Control-Allow-Origin')}`);
} catch (error) {
  console.log(`   ❌ Ошибка: ${error.message}`);
}

console.log('');

// Тест 2: Простой GET запрос (без авторизации - должен вернуть 401)
console.log('2️⃣ Тест GET запроса (без токена - ожидаем 401)...');
try {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      path: '/v1/shops',
      method: 'GET',
      headers: {
        'Authorization': 'invalid_token_for_test'
      }
    })
  });
  
  const data = await response.json();
  console.log(`   Статус: ${response.status}`);
  console.log(`   Ответ:`, data);
  
  if (response.status === 401) {
    console.log('   ✅ Прокси работает! (получен ожидаемый 401 Unauthorized)');
  } else if (response.status === 200) {
    console.log('   ✅ Прокси работает! (получен 200 OK)');
  } else {
    console.log(`   ⚠️ Неожиданный статус: ${response.status}`);
  }
} catch (error) {
  console.log(`   ❌ Ошибка: ${error.message}`);
}

console.log('');

// Тест 3: POST запрос с body (тестируем исправление двойной сериализации)
console.log('3️⃣ Тест POST запроса с body...');
try {
  const testBody = JSON.stringify([
    { skuId: 123456, amount: 10 },
    { skuId: 789012, amount: 5 }
  ]);
  
  console.log('   Отправляем body:', testBody);
  
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      path: '/v2/fbs/sku/stocks',
      method: 'POST',
      headers: {
        'Authorization': 'test_token'
      },
      body: testBody
    })
  });
  
  const data = await response.json();
  console.log(`   Статус: ${response.status}`);
  console.log(`   Ответ:`, JSON.stringify(data).substring(0, 200));
  
  if (response.status === 401) {
    console.log('   ✅ Прокси правильно обрабатывает body! (401 - нужен настоящий токен)');
  } else if (response.status === 400 && data.errors?.[0]?.code === 'bad-request-001') {
    console.log('   ❌ Ошибка 400 Bad Request! Двойная сериализация всё ещё есть!');
  } else {
    console.log(`   ℹ️ Получен статус: ${response.status}`);
  }
} catch (error) {
  console.log(`   ❌ Ошибка: ${error.message}`);
}

console.log('');

// Тест 4: Проверка обработки некорректного JSON
console.log('4️⃣ Тест обработки некорректного JSON...');
try {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: 'invalid json'
  });
  
  const data = await response.json();
  console.log(`   Статус: ${response.status}`);
  console.log(`   Ответ:`, data);
  
  if (response.status === 400 && data.error === 'Invalid JSON in request body') {
    console.log('   ✅ Прокси правильно обрабатывает невалидный JSON!');
  }
} catch (error) {
  console.log(`   ❌ Ошибка: ${error.message}`);
}

console.log('\n📊 Результаты тестирования:');
console.log('=====================================');
console.log('Если все тесты прошли успешно (✅), прокси работает корректно!');
console.log('Если есть ошибки (❌), нужно проверить деплой Edge Function.');
