import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ykbouygdeqrohizeqlmc.supabase.co',
  'sb_publishable_6sJ_KOewkD5zRln2HVDWXw_vjILs-kD'
);

const { data, error, count } = await supabase
  .from('manual_sections')
  .select('*', { count: 'exact', head: false });

if (error) {
  console.error('❌ Ошибка:', error);
} else {
  console.log(`✅ Всего записей в базе: ${count}`);
  console.log(`\n📋 Примеры записей:\n`);
  data.slice(0, 10).forEach((row, i) => {
    const title = row.title_ru || row.title_uz || row.title || 'No title';
    const content = row.content_ru || row.content_uz || row.content || '';
    const contentPreview = content.length > 0 ? content.substring(0, 100) : 'Нет контента';
    
    console.log(`${i + 1}. ${title}`);
    console.log(`   URL: ${row.url}`);
    console.log(`   Контент (${content.length} симв.): ${contentPreview}...`);
    console.log();
  });
  
  // Статистика по языкам
  const withRu = data.filter(r => r.title_ru || r.content_ru).length;
  const withUz = data.filter(r => r.title_uz || r.content_uz).length;
  console.log(`\n📊 Статистика:`);
  console.log(`   Записей с RU контентом: ${withRu}`);
  console.log(`   Записей с UZ контентом: ${withUz}`);
}
