/**
 * Test Uzum API Token
 * Проверяет токен с правильными endpoints
 */

const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const BASE_URL = 'https://api-seller.uzum.uz/api/seller-openapi';

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 ТЕСТ UZUM API TOKEN');
console.log('═══════════════════════════════════════════════════════');
console.log(`Токен: ${TOKEN.substring(0, 20)}...`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`Auth: RAW token (без префикса Bearer)`);
console.log('═══════════════════════════════════════════════════════');

/**
 * Делаем запрос к API
 */
async function testEndpoint(path, shopId = null) {
  try {
    const url = shopId ? `${BASE_URL}${path}`.replace('{shopId}', shopId) : `${BASE_URL}${path}`;
    
    console.log(`\n🔍 Тестирую: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': TOKEN,  // RAW token without prefix
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Статус: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Успех!`);
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log(`   ❌ Ошибка: ${text.substring(0, 200)}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ Исключение: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Главная функция
 */
async function main() {
  // Сначала попробуем получить список магазинов
  console.log('\n📋 Шаг 1: Получение списка магазинов');
  const shopsResult = await testEndpoint('/v1/shops');
  
  let shopId = null;
  if (shopsResult.success && Array.isArray(shopsResult.data) && shopsResult.data.length > 0) {
    shopId = shopsResult.data[0].id;
    const shopName = shopsResult.data[0].name;
    console.log(`   🏪 Найден магазин: ${shopName} (ID: ${shopId})`);
    console.log(`   📊 Данные:`, JSON.stringify(shopsResult.data, null, 2));
  }

  if (shopId) {
    // Тестируем получение товаров
    console.log('\n📋 Шаг 2: Получение товаров магазина');
    const productsResult = await testEndpoint(`/v1/product/shop/${shopId}`, shopId);
    
    if (productsResult.success) {
      const products = Array.isArray(productsResult.data) ? productsResult.data : [];
      console.log(`   📦 Найдено товаров: ${products.length}`);
      if (products.length > 0) {
        console.log(`   📊 Первый товар:`, JSON.stringify(products[0], null, 2).substring(0, 400));
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ ТЕСТ ЗАВЕРШЁН');
  console.log('═══════════════════════════════════════════════════════');
  
  if (shopId) {
    console.log('\n💡 Токен ВАЛИДНЫЙ и РАБОТАЕТ!');
    console.log(`\n📝 Добавьте в .env файл:`);
    console.log(`VITE_UZUM_AUTH_SCHEME=Raw`);
  }
}

main().catch(console.error);
