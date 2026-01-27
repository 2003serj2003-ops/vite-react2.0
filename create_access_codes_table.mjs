import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Отсутствуют переменные окружения VITE_SUPABASE_URL или SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    console.log('📋 Создание таблицы access_codes...');
    
    const sql = readFileSync('./create_simple_access_codes.sql', 'utf-8');
    
    // Выполняем SQL через RPC или прямой запрос
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).select();
    
    if (error) {
      // Если RPC не работает, пробуем через прямой запрос
      console.log('⚠️  RPC недоступен, используем альтернативный метод');
      console.log('📝 Скопируйте SQL из create_simple_access_codes.sql');
      console.log('🔗 Откройте Supabase Dashboard → SQL Editor');
      console.log('📋 Вставьте и выполните SQL');
      return;
    }
    
    console.log('✅ Таблица access_codes успешно создана!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании таблицы:', error.message);
    console.log('\n📝 Выполните SQL вручную:');
    console.log('🔗 https://supabase.com/dashboard/project/_/sql');
    console.log('📋 Скопируйте содержимое create_simple_access_codes.sql');
  }
}

createTable();
