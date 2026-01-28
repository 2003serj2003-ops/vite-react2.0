import https from 'https';

const token = '17Z3s6FTmT6A/GJuWemvSttvA+Cw9MqQQzBjLQUwi4nCt5LGwmr+6TuGVSAePqkHFYP6hg==';
const baseUrl = 'https://api-seller.uzum.uz/api/seller-openapi';

async function testOrdersCount() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 ТЕСТ ENDPOINT: /v2/fbs/orders/count');
  console.log('═══════════════════════════════════════════════════════\n');

  // Тест 1: Без фильтров
  console.log('📋 Тест 1: Получение общего количества заказов');
  await testEndpoint('/v2/fbs/orders/count', {});

  // Тест 2: Фильтр по статусу NEW
  console.log('\n📋 Тест 2: Фильтр по статусу NEW');
  await testEndpoint('/v2/fbs/orders/count?status=NEW', { status: 'NEW' });

  // Тест 3: Фильтр по статусу PENDING
  console.log('\n📋 Тест 3: Фильтр по статусу PENDING');
  await testEndpoint('/v2/fbs/orders/count?status=PENDING', { status: 'PENDING' });

  // Тест 4: Фильтр по статусу READY_FOR_SHIPMENT
  console.log('\n📋 Тест 4: Фильтр по статусу READY_FOR_SHIPMENT');
  await testEndpoint('/v2/fbs/orders/count?status=READY_FOR_SHIPMENT', { status: 'READY_FOR_SHIPMENT' });

  // Тест 5: Фильтр по статусу SHIPPED
  console.log('\n📋 Тест 5: Фильтр по статусу SHIPPED');
  await testEndpoint('/v2/fbs/orders/count?status=SHIPPED', { status: 'SHIPPED' });

  // Тест 6: Фильтр по статусу DELIVERED
  console.log('\n📋 Тест 6: Фильтр по статусу DELIVERED');
  await testEndpoint('/v2/fbs/orders/count?status=DELIVERED', { status: 'DELIVERED' });

  // Тест 7: Фильтр по статусу CANCELLED
  console.log('\n📋 Тест 7: Фильтр по статусу CANCELLED');
  await testEndpoint('/v2/fbs/orders/count?status=CANCELLED', { status: 'CANCELLED' });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ ТЕСТЫ ЗАВЕРШЕНЫ');
  console.log('═══════════════════════════════════════════════════════');
}

async function testEndpoint(path, params) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${path}`;
    console.log(`🔍 URL: ${url}`);
    if (Object.keys(params).length > 0) {
      console.log(`📊 Параметры:`, params);
    }

    const options = {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   Статус: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('   ✅ Успех!');
            console.log('   📦 Ответ:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('   ⚠️  Ответ (raw):', data);
          }
        } else {
          console.log('   ❌ Ошибка:', data);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('   ❌ Ошибка запроса:', err.message);
      resolve();
    });

    req.end();
  });
}

testOrdersCount().catch(console.error);
