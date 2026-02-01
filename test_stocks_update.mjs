// Тест обновления остатков с реальными данными

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const SHOP_ID = '96273';

console.log('🔍 Шаг 1: Получение списка товаров\n');

const response1 = await fetch(PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    path: `/v1/product/shop/${SHOP_ID}?size=10&page=0`,
    method: 'GET',
    headers: { 'Authorization': TOKEN }
  })
});

const data1 = await response1.json();

console.log(`Статус: ${response1.status}`);

if (data1.productList && data1.productList.length > 0) {
  console.log(`✅ Получено ${data1.productList.length} товаров\n`);
  
  let productWithSku = null;
  for (const product of data1.productList) {
    if (product.skuList && product.skuList.length > 0) {
      productWithSku = product;
      break;
    }
  }
  
  if (productWithSku) {
    const sku = productWithSku.skuList[0];
    console.log('📦 Найден товар с SKU:');
    console.log(`  Товар: ${productWithSku.productName || productWithSku.name || 'N/A'}`);
    console.log(`  SKU ID: ${sku.skuId}`);
    
    console.log('\n🔍 Шаг 2: Получение текущих остатков\n');
    
    const response2 = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        path: `/v2/fbs/sku/stocks?filter[skuIds]=${sku.skuId}`,
        method: 'GET',
        headers: { 'Authorization': TOKEN }
      })
    });
    
    const stocks = await response2.json();
    console.log(`Статус: ${response2.status}`);
    
    if (stocks.payload?.result && stocks.payload.result.length > 0) {
      const currentStock = stocks.payload.result[0].stock;
      console.log(`  Текущий остаток: ${currentStock}\n`);
      
      console.log('📦 Шаг 3: Обновление остатков\n');
      
      const stockData = [{ skuId: sku.skuId, amount: currentStock }];
      console.log(`Отправляем: ${JSON.stringify(stockData)}`);
      
      const response3 = await fetch(PROXY_URL, {
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
      
      const result = await response3.json();
      
      console.log(`\nСтатус: ${response3.status}`);
      console.log('Ответ:', JSON.stringify(result, null, 2));
      
      if (response3.status === 200) {
        console.log('\n✅ УСПЕХ! Остаток обновлён!');
      } else if (response3.status === 400) {
        console.log('\n❌ ОШИБКА 400: Bad Request');
        console.log('\n🔍 Проверьте логи Supabase:');
        console.log('https://supabase.com/dashboard/project/pqwkrjmrzokwwlrumxmn/functions/uzum-proxy/logs');
      }
    } else {
      console.log('❌ Не удалось получить остатки');
      console.log('Ответ:', JSON.stringify(stocks, null, 2));
    }
  } else {
    console.log('❌ Не найдено товаров с SKU');
  }
} else {
  console.log('❌ Не удалось получить список товаров');
  console.log('Ответ:', JSON.stringify(data1, null, 2));
}
