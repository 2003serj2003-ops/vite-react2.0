// Тест обновления остатков через прокси
// POST /v2/fbs/sku/stocks

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';

console.log('🧪 Тест: POST /v2/fbs/sku/stocks (обновление остатков)\n');

// Данные для обновления остатков (как в реальном приложении)
const stocksData = [
  { skuId: 123456789, amount: 10 },
  { skuId: 987654321, amount: 5 }
];

console.log('📦 Отправляемые данные:');
console.log(JSON.stringify(stocksData, null, 2));
console.log();

// Формируем тело запроса (как в uzum-api.ts)
const proxyBody = {
  path: '/v2/fbs/sku/stocks',
  method: 'POST',
  headers: {
    'Authorization': '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I='
  },
  body: JSON.stringify(stocksData)  // Сериализуем в строку (как в коде)
};

console.log('📨 Тело запроса к прокси:');
console.log(JSON.stringify(proxyBody, null, 2));
console.log('\n🚀 Отправка запроса...\n');

try {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(proxyBody)  // Сериализуем proxyBody
  });

  const responseText = await response.text();
  let data;
  
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  console.log(`📡 Статус ответа: ${response.status}`);
  console.log('📄 Тело ответа:');
  console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  console.log();

  // Анализ результата
  if (response.status === 400) {
    console.log('❌ ОШИБКА 400: Bad Request');
    if (data.errors?.[0]?.code === 'bad-request-001') {
      console.log('   Причина: Двойная сериализация body');
      console.log('   Решение: Проверьте код в uzum-api.ts');
    }
  } else if (response.status === 404 || response.status === 401) {
    console.log('✅ УСПЕХ! Прокси работает правильно!');
    console.log('   (404/401 - это нормально, т.к. использован тестовый токен)');
    console.log('   Главное - НЕТ ошибки 400!');
  } else if (response.status === 200) {
    console.log('✅ ИДЕАЛЬНО! Остатки обновлены!');
  } else {
    console.log(`⚠️  Неожиданный статус: ${response.status}`);
  }

} catch (error) {
  console.log(`❌ Ошибка выполнения запроса: ${error.message}`);
}
