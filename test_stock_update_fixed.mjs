#!/usr/bin/env node

/**
 * Тест обновленной функции updateFbsSkuStocks с правильным форматом
 * Проверяет: получение продуктов -> формирование полного объекта -> отправка
 */

const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const SHOP_ID = 96273;
const TEST_SKU_ID = 8112395;
const NEW_AMOUNT = 10;

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';

console.log('🧪 Testing updated stock function');
console.log('=====================================\n');

// Step 1: Get products
console.log('📦 Step 1: Fetching products...');

const productsResponse = await fetch(PROXY_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: `/v1/product/shop/${SHOP_ID}?size=100&page=0`,
    method: 'GET',
    headers: {
      'Authorization': TOKEN
    }
  })
});

const productsData = await productsResponse.json();

if (!productsData.productList) {
  console.error('❌ Failed to fetch products:', productsData);
  process.exit(1);
}

console.log(`✅ Fetched ${productsData.productList.length} products\n`);

// Step 2: Find SKU details
console.log(`📦 Step 2: Finding SKU ${TEST_SKU_ID}...`);

let skuData = null;

for (const product of productsData.productList) {
  if (product.skuList) {
    for (const sku of product.skuList) {
      if (sku.skuId === TEST_SKU_ID) {
        skuData = {
          skuId: sku.skuId,
          skuTitle: sku.skuTitle || sku.title || '',
          productTitle: sku.productTitle || product.title || '',
          barcode: String(sku.barcode || ''),
          fbsLinked: true,
          dbsLinked: false,
          amount: NEW_AMOUNT
        };
        break;
      }
    }
    if (skuData) break;
  }
}

if (!skuData) {
  console.error(`❌ SKU ${TEST_SKU_ID} not found`);
  process.exit(1);
}

console.log('✅ Found SKU:', skuData);
console.log('');

// Step 3: Send update
console.log('📦 Step 3: Sending stock update...');

const requestBody = {
  skuAmountList: [skuData]
};

console.log('Request body:', JSON.stringify(requestBody, null, 2));

const updateResponse = await fetch(PROXY_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: '/v2/fbs/sku/stocks',
    method: 'POST',
    headers: {
      'Authorization': TOKEN
    },
    body: requestBody
  })
});

const updateData = await updateResponse.json();

console.log('\n📦 Response:');
console.log('Status:', updateResponse.status);
console.log('Data:', JSON.stringify(updateData, null, 2));

if (updateResponse.status === 200) {
  console.log('\n✅ SUCCESS! Stock update request accepted');
  if (updateData.payload) {
    console.log(`   Total records: ${updateData.payload.totalRecords}`);
    console.log(`   Updated records: ${updateData.payload.updatedRecords}`);
    
    if (updateData.payload.updatedRecords === 0) {
      console.log('\n⚠️  Note: updatedRecords is 0');
      console.log('   This may mean:');
      console.log('   - Current amount already matches');
      console.log('   - Additional conditions not met');
      console.log('   - Need to check warehouse/location settings');
    }
  }
} else {
  console.log('\n❌ FAILED with status:', updateResponse.status);
}
