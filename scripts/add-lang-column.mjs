import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: переменные окружения не установлены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addLangColumn() {
  console.log('🔧 Добавление колонки lang...');
  
  // Выполняем SQL напрямую через RPC или используем SQL Editor в Supabase Dashboard
  console.log('\n⚠️  Выполните следующий SQL в Supabase Dashboard -> SQL Editor:\n');
  console.log(`
-- Добавляем колонку lang для определения языка страницы
ALTER TABLE manual_sections 
ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'ru' CHECK (lang IN ('ru', 'uz'));

-- Создаём индекс для быстрой фильтрации по языку
CREATE INDEX IF NOT EXISTS idx_manual_sections_lang ON manual_sections(lang);

-- Обновляем существующие записи на основе URL
UPDATE manual_sections 
SET lang = CASE 
  WHEN url LIKE '%/uz/%' THEN 'uz'
  ELSE 'ru'
END
WHERE lang IS NULL OR lang = 'ru';
  `);
  
  console.log('\n📝 Или используйте файл: add_lang_column.sql');
}

addLangColumn();
