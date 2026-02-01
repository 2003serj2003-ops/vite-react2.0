// Прямое обновление остатков для известного SKU

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';

console.log('📦 Обновление остатков для SKU 8112395\n');

const stockData = [{ skuId: 8112395, amount: 10 }];

console.log(`Отправляем: ${JSON.stringify(stockData)}\n`);

const response = await fetch(PROXY_URL, {
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

const result = await response.json();

console.log(`Статус: ${response.status}`);
console.log('Ответ:', JSON.stringify(result, null, 2));

if (response.status === 200) {
  console.log('\n✅ УСПЕХ! Остатки обновлены!');
} else if (response.status === 400) {
  console.log('\n❌ ОШИБКА 400');
  console.log('\n🔍 Это может означать:');
  console.log('  1. API Uzum изменил формат запроса');
  console.log('  2. SKU требует другие параметры');
  console.log('  3. Недостаточно прав у токена');
  console.log('\n📋 Проверьте документацию API:');
  console.log('  https://api-seller.uzum.uz/docs');
}
