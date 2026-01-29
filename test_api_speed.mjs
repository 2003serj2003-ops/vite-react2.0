#!/usr/bin/env node

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const SHOP_ID = '96273';

async function testApiSpeed() {
  console.log('🔬 Testing Uzum API speed limits...\n');

  // Test 1: Sequential requests with different delays
  const delays = [0, 50, 100];
  
  for (const delay of delays) {
    console.log(`\n📊 Testing with ${delay}ms delay between requests:`);
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    
    const statuses = ['CREATED', 'PACKING', 'PENDING_DELIVERY', 'DELIVERING', 'DELIVERED'];
    
    for (const status of statuses) {
      try {
        const response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: `/v1/fbs/orders?page=0&size=1&shopIds=${SHOP_ID}&status=${status}`,
            method: 'GET',
            headers: { 'Authorization': TOKEN },
          }),
        });
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          console.log(`   ❌ ${status}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        errorCount++;
        console.log(`   ❌ ${status}: ${error.message}`);
      }
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`   ✅ Success: ${successCount}/${statuses.length}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏱️  Total time: ${totalTime}ms (avg ${Math.round(totalTime / statuses.length)}ms per request)`);
  }

  // Test 2: Parallel requests
  console.log('\n\n📊 Testing parallel requests:');
  const startTime = Date.now();
  
  const promises = ['CREATED', 'PACKING', 'PENDING_DELIVERY'].map(status =>
    fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `/v1/fbs/orders?page=0&size=1&shopIds=${SHOP_ID}&status=${status}`,
        method: 'GET',
        headers: { 'Authorization': TOKEN },
      }),
    }).then(r => ({ status, ok: r.ok, statusCode: r.status }))
  );
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  console.log(`   Results:`, results);
  console.log(`   ⏱️  Total time: ${totalTime}ms for ${promises.length} parallel requests`);
  
  console.log('\n✅ Recommendation:');
  console.log('   - Use 0-50ms delays for sequential requests');
  console.log('   - Use parallel requests where possible (Promise.all)');
}

testApiSpeed();
