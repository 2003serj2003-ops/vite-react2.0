#!/usr/bin/env node
/**
 * Тест API Uzum
 * Проверяет работоспособность прокси и основных эндпоинтов
 */

const PROXY_URL = 'http://localhost:5173/api/uzum-proxy';
const SUPABASE_PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const SUPABASE_ANON_KEY = 'sb_publishable_6sJ_KOewkD5zRln2HVDWXw_vjILs-kD';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// Проверка, запущен ли dev-сервер
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:5173/', { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Тест прокси (Vite dev-сервер)
async function testViteProxy(token) {
  log(colors.cyan, '\n📡 Тест 1: Vite Dev Proxy (http://localhost:5173)');
  
  const devServerRunning = await checkDevServer();
  if (!devServerRunning) {
    log(colors.yellow, '⚠️  Dev-сервер не запущен. Запустите: npm run dev');
    return;
  }

  try {
    const requestBody = {
      path: '/v1/shops',
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    };

    log(colors.blue, '→ Отправка запроса:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    log(colors.blue, '← Статус:', response.status, response.statusText);

    const data = await response.json();
    
    if (response.ok) {
      log(colors.green, '✅ Vite Proxy работает!');
      log(colors.blue, '📦 Данные:', JSON.stringify(data, null, 2));
      
      // Проверяем структуру ответа
      if (Array.isArray(data)) {
        log(colors.green, `✅ Получено магазинов: ${data.length}`);
      } else if (data.payload && Array.isArray(data.payload)) {
        log(colors.green, `✅ Получено магазинов: ${data.payload.length}`);
      }
    } else {
      log(colors.red, '❌ Ошибка Vite Proxy');
      log(colors.red, '📦 Ответ:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    log(colors.red, '❌ Ошибка при запросе к Vite Proxy:', error.message);
  }
}

// Тест Supabase Edge Function
async function testSupabaseProxy(token) {
  log(colors.cyan, '\n📡 Тест 2: Supabase Edge Function');
  
  try {
    const requestBody = {
      path: '/v1/shops',
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    };

    log(colors.blue, '→ Отправка запроса:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(SUPABASE_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    log(colors.blue, '← Статус:', response.status, response.statusText);

    const data = await response.json();
    
    if (response.ok) {
      log(colors.green, '✅ Supabase Edge Function работает!');
      log(colors.blue, '📦 Данные:', JSON.stringify(data, null, 2));
      
      // Проверяем структуру ответа
      if (Array.isArray(data)) {
        log(colors.green, `✅ Получено магазинов: ${data.length}`);
      } else if (data.payload && Array.isArray(data.payload)) {
        log(colors.green, `✅ Получено магазинов: ${data.payload.length}`);
      }
    } else {
      log(colors.red, '❌ Ошибка Supabase Edge Function');
      log(colors.red, '📦 Ответ:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    log(colors.red, '❌ Ошибка при запросе к Supabase Edge Function:', error.message);
  }
}

// Тест прямого запроса (без прокси)
async function testDirectRequest(token) {
  log(colors.cyan, '\n📡 Тест 3: Прямой запрос к Uzum API');
  
  try {
    const response = await fetch('https://api-seller.uzum.uz/api/seller-openapi/v1/shops', {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    log(colors.blue, '← Статус:', response.status, response.statusText);

    const data = await response.json();
    
    if (response.ok) {
      log(colors.green, '✅ Прямой запрос работает (CORS разрешен)!');
      log(colors.blue, '📦 Данные:', JSON.stringify(data, null, 2));
    } else {
      log(colors.yellow, '⚠️  Прямой запрос не работает (возможно CORS блокировка)');
      log(colors.red, '📦 Ответ:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    log(colors.yellow, '⚠️  Прямой запрос не работает:', error.message);
    log(colors.yellow, '    Это нормально - Uzum блокирует CORS. Используйте прокси.');
  }
}

// Главная функция
async function main() {
  log(colors.cyan, '🚀 Тестирование Uzum API');
  log(colors.cyan, '========================\n');

  // Проверяем наличие токена
  const token = process.env.UZUM_TOKEN || process.argv[2];
  
  if (!token) {
    log(colors.red, '❌ Токен не указан!');
    log(colors.yellow, '\nИспользование:');
    log(colors.yellow, '  UZUM_TOKEN=your_token node test_uzum_api.mjs');
    log(colors.yellow, '  или');
    log(colors.yellow, '  node test_uzum_api.mjs your_token');
    log(colors.yellow, '\nПолучите токен в личном кабинете Uzum Seller:');
    log(colors.yellow, '  https://seller.uzum.uz/');
    process.exit(1);
  }

  log(colors.green, '✓ Токен:', token.substring(0, 20) + '...' + token.substring(token.length - 5));

  // Запускаем тесты
  await testViteProxy(token);
  await testSupabaseProxy(token);
  await testDirectRequest(token);

  log(colors.cyan, '\n✨ Тестирование завершено!');
}

main().catch(error => {
  log(colors.red, '❌ Критическая ошибка:', error);
  process.exit(1);
});
