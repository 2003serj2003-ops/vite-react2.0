// Тест разных форматов body
const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';

console.log('🧪 Тест форматов body\n');

const formats = [
  { name: 'Массив', data: [{ skuId: 8112395, amount: 10 }] },
  { name: 'stocks', data: { stocks: [{ skuId: 8112395, amount: 10 }] } },
  { name: 'skuAmountList', data: { skuAmountList: [{ skuId: 8112395, amount: 10 }] } },
  { name: 'items', data: { items: [{ skuId: 8112395, amount: 10 }] } }
];

for (const format of formats) {
  console.log(`Тест: ${format.name}`);
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({
      path: '/v2/fbs/sku/stocks',
      method: 'POST',
      headers: { 'Authorization': TOKEN },
      body: JSON.stringify(format.data)
    })
  });
  const result = await response.json();
  console.log(`  Статус: ${response.status} - ${result.errors?.[0]?.code || 'OK'}\n`);
  if (response.status === 200) {
    console.log('✅ НАЙДЕН ПРАВИЛЬНЫЙ ФОРМАТ:', format.name);
    break;
  }
}
