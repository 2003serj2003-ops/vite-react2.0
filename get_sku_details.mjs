// Получение точных данных для SKU

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const SHOP_ID = '96273';
const SKU_ID = 8112395;

console.log('📦 Получение данных для SKU', SKU_ID, '\n');

// Получаем список товаров
const response = await fetch(PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    path: `/v1/product/shop/${SHOP_ID}?size=100&page=0`,
    method: 'GET',
    headers: { 'Authorization': TOKEN }
  })
});

const data = await response.json();

if (data.productList) {
  let found = false;
  
  for (const product of data.productList) {
    if (product.skuList) {
      for (const sku of product.skuList) {
        if (sku.skuId === SKU_ID) {
          found = true;
          
          console.log('✅ Найден SKU!\n');
          console.log('Полные данные SKU:', JSON.stringify(sku, null, 2));
          console.log('\nДанные товара:');
          console.log('  Product Title:', product.productName || product.title || 'N/A');
          console.log('  SKU ID:', sku.skuId);
          
          const skuTitle = Array.isArray(sku.characteristics) 
            ? sku.characteristics.map(c => `${c.title}: ${c.value}`).join(', ')
            : (sku.title || sku.name || '');
          
          console.log('  SKU Title:', skuTitle || 'N/A');
          console.log('  Barcode:', sku.barcode || '');
          console.log('  Current Amount:', sku.availableAmount || 0);
          console.log('  FBS Linked:', sku.fbsLinked !== undefined ? sku.fbsLinked : true);
          console.log('  DBS Linked:', sku.dbsLinked !== undefined ? sku.dbsLinked : false);
          
          console.log('\n📋 JSON для Swagger:\n');
          
          const jsonData = {
            "skuAmountList": [
              {
                "skuId": sku.skuId,
                "skuTitle": skuTitle || "",
                "productTitle": product.productName || product.title || "",
                "barcode": sku.barcode || "",
                "amount": (sku.availableAmount || 0) + 5,
                "fbsLinked": sku.fbsLinked !== undefined ? sku.fbsLinked : true,
                "dbsLinked": sku.dbsLinked !== undefined ? sku.dbsLinked : false
              }
            ]
          };
          
          console.log(JSON.stringify(jsonData, null, 2));
          
          break;
        }
      }
    }
    if (found) break;
  }
  
  if (!found) {
    console.log('❌ SKU', SKU_ID, 'не найден в магазине', SHOP_ID);
  }
} else {
  console.log('❌ Не удалось получить список товаров');
  console.log('Ответ:', JSON.stringify(data, null, 2));
}
