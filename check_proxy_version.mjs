// Проверка текущей версии Edge Function
// Этот тест покажет, какая версия кода сейчас работает

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ym91eWdkZXFyb2hpemVxbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDg5MjgsImV4cCI6MjA1MDc4NDkyOH0.o2TKtcXGCxKGZv9B1xPxYlE5LiMNqZ_fNNsNRWD-DvQ';

console.log('🔍 Проверка версии Edge Function\n');

// Тест 1: Отправляем body как строку (НОВЫЙ КОД)
console.log('1️⃣ Тест: body как строка (правильный формат)');

const response = await fetch(PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    path: '/v2/fbs/sku/stocks',
    method: 'POST',
    headers: { 'Authorization': 'test_token' },
    body: '[{"skuId":123,"amount":10}]'  // body уже строка
  })
});

const data = await response.json();
console.log(`   Статус: ${response.status}`);
console.log(`   Код ошибки: ${data.errors?.[0]?.code || 'нет'}`);

if (response.status === 400 && data.errors?.[0]?.code === 'bad-request-001') {
  console.log('   ❌ СТАРЫЙ КОД! Edge Function НЕ обновлена!');
  console.log('   Прокси всё ещё делает двойную сериализацию\n');
  console.log('📋 ИНСТРУКЦИЯ ПО ОБНОВЛЕНИЮ:');
  console.log('1. Откройте Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Выберите проект: pqwkrjmrzokwwlrumxmn');
  console.log('3. Перейдите в Edge Functions');
  console.log('4. Найдите функцию uzum-proxy');
  console.log('5. Нажмите Edit');
  console.log('6. Замените весь код на код из файла: supabase/functions/uzum-proxy/index.ts');
  console.log('7. Нажмите Deploy');
} else {
  console.log('   ✅ Код обновлен! (получили 404/401 вместо 400)\n');
}
