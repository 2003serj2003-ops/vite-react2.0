import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parsePercentage(value) {
  if (!value) return null;
  const cleaned = value.toString().replace('%', '').trim();
  return parseFloat(cleaned) || null;
}

async function importCommissions() {
  console.log('📊 Импорт комиссий в Supabase...\n');

  // Читаем русскую версию
  console.log('📖 Читаю русскую версию CSV...');
  const ruContent = readFileSync(
    'public.commissions/Копия Копия Новые комиссии c калькулятором - Комиссия за продажу (РУС).csv',
    'utf-8'
  );
  const ruRows = parse(ruContent, { 
    columns: true, 
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    from_line: 3  // Пропускаем первые 2 пустые строки
  });

  // Читаем узбекскую версию
  console.log('📖 Читаю узбекскую версию CSV...');
  const uzContent = readFileSync(
    'public.commissions/Копия Копия Копия Новые комиссии c калькулятором - Savdo komissiyasi (UZB).csv',
    'utf-8'
  );
  const uzRows = parse(uzContent, { 
    columns: true, 
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
    // ВАЖНО: В узбекском файле первая строка - это заголовки, не пропускаем строки!
    // Несмотря на то, что колонки называются category1_ru и т.д., в них узбекский текст
  });

  console.log(`✅ Загружено ${ruRows.length} записей (RU)`);
  console.log(`✅ Загружено ${uzRows.length} записей (UZ)\n`);

  // Создаем карту узбекских категорий по ID
  const uzMap = {};
  for (const row of uzRows) {
    const catId = row['category ID'];
    if (catId) {
      uzMap[catId.trim()] = row;
    }
  }

  // Подготавливаем данные для вставки
  console.log('🔄 Обработка данных...');
  
  const records = [];
  let skipped = 0;
  
  for (const ruRow of ruRows) {
    // Пробуем разные варианты названия колонки
    const catId = (ruRow['category ID'] || ruRow['category_id'] || ruRow['categoryID'] || '').trim();
    
    if (!catId || catId === '') {
      skipped++;
      continue;
    }

    const uzRow = uzMap[catId] || {};

    const record = {
      category_id: catId.trim(),
      cat_code: ruRow['cat_code'] || null,
      category1_ru: ruRow['category1_ru'] || null,
      category2_ru: ruRow['category2_ru'] || null,
      category3_ru: ruRow['category3_ru'] || null,
      category4_ru: ruRow['category4_ru'] || null,
      category5_ru: ruRow['category5_ru'] || null,
      category6_ru: ruRow['category6_ru'] || null,
      category1_uz: uzRow['category1_ru'] || null,
      category2_uz: uzRow['category2_ru'] || null,
      category3_uz: uzRow['category3_ru'] || null,
      category4_uz: uzRow['category4_ru'] || null,
      category5_uz: uzRow['category5_ru'] || null,
      category6_uz: uzRow['category6_ru'] || null,
      comm_fbo: parsePercentage(ruRow['comm FBO %']),
      comm_fbs: parsePercentage(ruRow['comm FBS %']),
      comm_dbs: parsePercentage(ruRow['comm DBS%'])
    };

    records.push(record);
  }
  
  console.log(`⚠️  Пропущено пустых записей: ${skipped}`);

  console.log(`📦 Подготовлено ${records.length} записей для вставки\n`);

  // Вставляем данными порциями по 1000 записей
  const BATCH_SIZE = 1000;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);
    
    console.log(`⏳ Загрузка партии ${batchNum}/${totalBatches} (${batch.length} записей)...`);
    
    const { data, error } = await supabase
      .from('product_categories')
      .upsert(batch, { 
        onConflict: 'category_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`❌ Ошибка в партии ${batchNum}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✅ Партия ${batchNum} загружена`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ ИМПОРТА:');
  console.log('='.repeat(60));
  console.log(`✅ Успешно импортировано: ${inserted}`);
  console.log(`❌ Ошибок: ${errors}`);
  console.log(`📈 Всего обработано: ${records.length}`);
  console.log('='.repeat(60) + '\n');

  if (inserted > 0) {
    console.log('🎉 Импорт завершен успешно!');
  } else {
    console.log('⚠️  Импорт завершен с ошибками');
  }
}

importCommissions().catch(err => {
  console.error('💥 Критическая ошибка:', err);
  process.exit(1);
});
