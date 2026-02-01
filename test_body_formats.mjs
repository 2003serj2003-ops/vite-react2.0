// Тест разных форматов body для обновления остатков

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';

const stocksData = [
  { skuId: 123456789, amount: 10 },
  { skuId: 987654321, amount: 5 }
];

// Тест 1: body как строка JSON (текущий способ)
console.log('🧪 Тест 1: body как строка JSON\n');
const test1 = await fetch(PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    path: '/v2/fbs/sku/stocks',
    method: 'POST',
    headers: { 'Authorization': TOKEN },
    body: JSON.stringify(stocksData)  // body КАК СТРОКА
  })
});
const result1 = await test1.json();
console.log(`Статус: ${test1.status}`);
console.log(`Ответ: ${JSON.stringify(result1.errors?.[0] || result1, null, 2)}\n`);

// Тест 2: body как объект (пусть прокси сам сериализует)
console.log('🧪 Тест 2: body как объект\n');
const test2 = await fetch(PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    path: '/v2/fbs/sku/stocks',
    method: 'POST',
    headers: { 'Authorization': TOKEN },
    body: stocksData  // body КАК ОБЪЕКТ (массив)
  })
});
const result2 = await test2.json();
console.log(`Статус: ${test2.status}`);
console.log(`Ответ: ${JSON.stringify(result2.errors?.[0] || result2, null, 2)}\n`);

// Сравнение
console.log('📊 Сравнение:');
console.log(`  Тест 1 (строка): ${test1.status} - ${result1.errors?.[0]?.code || 'OK'}`);
console.log(`  Тест 2 (объект): ${test2.status} - ${result2.errors?.[0]?.code || 'OK'}`);

if (test2.status !== 400) {
  console.log('\n✅ Решение: Отправлять body как объект, а не как строку!');
  console.log('   Нужно изменить uzum-api.ts');
}
