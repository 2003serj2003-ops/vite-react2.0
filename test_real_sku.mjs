// Получаем реальные SKU и пробуем обновить остатки

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';

console.log('📦 Шаг 1: Получение списка SKU\n');

const response1 = await fetch(PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    path: '/v2/fbs/sku/list',
    method: 'GET',
    headers: { 'Authorization': TOKEN }
  })
});

const data1 = await response1.json();

if (data1.payload?.result && data1.payload.result.length > 0) {
  console.log(`✅ Получено ${data1.payload.result.length} SKU`);
  
  const sku = data1.payload.result[0];
  console.log(`\nПервый SKU:`);
  console.log(`  ID: ${sku.skuId}`);
  console.log(`  Название: ${sku.name?.ru || sku.name || 'N/A'}`);
  console.log(`  Текущий остаток: ${sku.fbs?.stock ?? 'N/A'}`);
  
  // Пробуем обновить остаток
  console.log(`\n📦 Шаг 2: Обновление остатка для SKU ${sku.skuId}\n`);
  
  const newStock = (sku.fbs?.stock ?? 0);  // Оставляем тот же остаток
  const stockData = [{ skuId: sku.skuId, amount: newStock }];
  
  console.log(`Отправляем: ${JSON.stringify(stockData)}`);
  
  const response2 = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      path: '/v2/fbs/sku/stocks',
      method: 'POST',
      headers: { 'Authorization': TOKEN },
      body: JSON.stringify(stockData)
    })
  });
  
  const data2 = await response2.json();
  
  console.log(`Статус: ${response2.status}`);
  console.log(`Ответ:`, JSON.stringify(data2, null, 2));
  
  if (response2.status === 200) {
    console.log('\n✅ УСПЕХ! Остаток обновлён!');
  } else if (response2.status === 400) {
    console.log('\n❌ ОШИБКА 400');
    console.log('Возможные причины:');
    console.log('  1. Неправильный формат данных');
    console.log('  2. SKU не поддерживает обновление остатков через API');
    console.log('  3. Недостаточно прав у токена');
  }
} else {
  console.log('❌ Не удалось получить список SKU');
  console.log('Ответ:', JSON.stringify(data1, null, 2));
}
