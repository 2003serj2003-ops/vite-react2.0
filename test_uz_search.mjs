import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ykbouygdeqrohizeqlmc.supabase.co";
const supabaseKey = "sb_publishable_6sJ_KOewkD5zRln2HVDWXw_vjILs-kD";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch(query, lang = 'uz') {
  console.log(`\n🔍 Поиск "${query}" (язык: ${lang})`);
  console.log('='.repeat(60));
  
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .limit(1000);

  if (error) {
    console.error('❌ Ошибка:', error);
    return;
  }

  const searchTerm = query.toLowerCase();
  
  const filtered = (data || []).filter((item) => {
    let lastCategory = null;
    for (let i = 6; i >= 1; i--) {
      const cat = item[`category${i}_${lang}`];
      if (cat && cat.trim()) {
        lastCategory = cat.toLowerCase();
        break;
      }
    }
    return lastCategory && lastCategory.includes(searchTerm);
  }).slice(0, 5);

  console.log(`\n✅ Найдено: ${filtered.length} результатов\n`);
  
  filtered.forEach((item, i) => {
    const categoryPath = [];
    for (let j = 1; j <= 6; j++) {
      const cat = item[`category${j}_${lang}`];
      if (cat) categoryPath.push(cat);
    }
    
    console.log(`${i + 1}. ${categoryPath.join(' → ')}`);
    console.log(`   FBO: ${item.comm_fbo}% | FBS: ${item.comm_fbs}% | DBS: ${item.comm_dbs}%`);
  });
}

// Тесты
async function runTests() {
  await testSearch('maishiy', 'uz');
  await testSearch('kitob', 'uz');
  await testSearch('холодильник', 'ru');
  await testSearch('книги', 'ru');
}

runTests();
