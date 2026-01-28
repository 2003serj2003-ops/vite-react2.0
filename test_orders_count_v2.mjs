import https from 'https';

const token = '17Z3s6FTmT6A/GJuWemvSttvA+Cw9MqQQzBjLQUwi4nCt5LGwmr+6TuGVSAePqkHFYP6hg==';
const baseUrl = 'https://api-seller.uzum.uz/api/seller-openapi';
const shopId = 96273;

async function testOrdersCount() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 ТЕСТ ENDPOINT: /v2/fbs/orders/count (с shopId)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Подождем немного, чтобы не получить rate limit
  await sleep(2000);

  // Тест 1: С shopId, без статуса
  console.log('📋 Тест 1: С shopId, без фильтра статуса');
  await testEndpoint(`/v2/fbs/orders/count?shopId=${shopId}`, { shopId });
  await sleep(2000);

  // Тест 2: С shopId и статусом NEW
  console.log('\n📋 Тест 2: shopId + status=NEW');
  await testEndpoint(`/v2/fbs/orders/count?shopId=${shopId}&status=NEW`, { shopId, status: 'NEW' });
  await sleep(2000);

  // Тест 3: С shopId и статусом PENDING
  console.log('\n📋 Тест 3: shopId + status=PENDING');
  await testEndpoint(`/v2/fbs/orders/count?shopId=${shopId}&status=PENDING`, { shopId, status: 'PENDING' });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ ТЕСТЫ ЗАВЕРШЕНЫ');
  console.log('═══════════════════════════════════════════════════════');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEndpoint(path, params) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${path}`;
    console.log(`🔍 URL: ${url}`);
    console.log(`📊 Параметры:`, params);

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
