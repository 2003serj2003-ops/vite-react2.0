import { createClient } from '@supabase/supabase-js';
import { JSDOM } from 'jsdom';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY не установлены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MANUAL_URL = 'https://seller.uzum.uz/manual';

/**
 * Валидирует URL - только ссылки на manual
 * @param {string} url
 * @returns {boolean}
 */
function isValidManualUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Только домен seller.uzum.uz
    if (urlObj.hostname !== 'seller.uzum.uz') return false;
    
    // Только /manual/*
    if (!urlObj.pathname.startsWith('/manual/')) return false;
    
    // Игнорировать якоря и query-параметры не ведущие на разделы
    if (urlObj.hash && !urlObj.pathname.includes('/manual/')) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Извлекает ссылки только из навигации
 * @param {Document} doc
 * @param {string} baseUrl
 * @returns {string[]}
 */
function extractNavigationLinks(doc, baseUrl) {
  const links = new Set();
  
  // Ищем ссылки только в навигационных элементах
  const navSelectors = [
    'nav a[href]',
    'aside a[href]',
    '.sidebar a[href]',
    '.navigation a[href]',
    '.menu a[href]',
    '[role="navigation"] a[href]',
    '.toc a[href]', // table of contents
    '.nav a[href]'
  ];
  
  for (const selector of navSelectors) {
    const navLinks = doc.querySelectorAll(selector);
    for (const link of navLinks) {
      const href = link.getAttribute('href');
      if (!href) continue;
      
      // Игнорировать mailto:, tel:, javascript:
      if (href.startsWith('mailto:') || 
          href.startsWith('tel:') || 
          href.startsWith('javascript:')) continue;
      
      try {
        const fullUrl = new URL(href, baseUrl).href;
        // Убираем якорь и query параметры
        const cleanUrl = fullUrl.split('#')[0].split('?')[0];
        
        if (isValidManualUrl(cleanUrl)) {
          links.add(cleanUrl);
        }
      } catch {
        continue;
      }
    }
  }
  
  return Array.from(links);
}

/**
 * Извлекает основной контент страницы без навигации и футера
 * @param {Document} doc
 * @returns {string}
 */
function extractArticleContent(doc) {
  // Удаляем навигацию, футер, хедер, sidebar
  const elementsToRemove = [
    'nav', 'aside', 'header', 'footer', 
    '.sidebar', '.navigation', '.menu',
    '.header', '.footer', '.toc',
    '[role="navigation"]', '[role="banner"]', 
    '[role="contentinfo"]'
  ];
  
  // Клонируем документ, чтобы не изменять оригинал
  const clone = doc.cloneNode(true);
  
  for (const selector of elementsToRemove) {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  }
  
  // Ищем основной контент
  const mainContent = 
    clone.querySelector('main') ||
    clone.querySelector('article') ||
    clone.querySelector('[role="main"]') ||
    clone.querySelector('.content') ||
    clone.querySelector('.article') ||
    clone.body;
  
  if (!mainContent) return '';
  
  return mainContent.textContent?.replace(/\s+/g, ' ').trim() || '';
}

async function crawlPage(url, visited = new Set()) {
  if (visited.has(url)) {
    console.log(`  ⏭️  Пропущено (уже обработано): ${url}`);
    return;
  }
  
  visited.add(url);
  console.log(`📡 Краулинг: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Извлекаем заголовок
    const title = 
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() || 
      'No title';

    // Извлекаем ТОЛЬКО контент статьи (без навигации)
    const content = extractArticleContent(doc);

    console.log(`  📝 Заголовок: ${title}`);
    console.log(`  📄 Контент (длина): ${content.length} символов`);

    // Проверяем существующую запись
    const { data: existing } = await supabase
      .from('manual_sections')
      .select('*')
      .eq('url', url)
      .single();

    let result;
    if (existing) {
      // Обновляем существующую запись - сохраняем в оба поля
      result = await supabase
        .from('manual_sections')
        .update({ 
          title_ru: title, 
          title_uz: title, 
          content_ru: content, 
          content_uz: content 
        })
        .eq('url', url);
    } else {
      // Создаем новую запись - сохраняем в оба поля
      result = await supabase
        .from('manual_sections')
        .insert([{ 
          url, 
          title_ru: title, 
          title_uz: title, 
          content_ru: content, 
          content_uz: content 
        }]);
    }

    const { error } = result;

    if (error) {
      console.error(`  ❌ Ошибка ${existing ? 'обновления' : 'вставки'}:`, error.message);
    } else {
      console.log(`  ✅ ${existing ? 'Обновлено' : 'Сохранено'} в базу`);
    }

    // Извлекаем ссылки ТОЛЬКО из навигации
    const navLinks = extractNavigationLinks(doc, url);
    console.log(`  🔗 Найдено ссылок в навигации: ${navLinks.length}`);
    
    let processedLinks = 0;
    for (const link of navLinks) {
      if (!visited.has(link)) {
        processedLinks++;
        await crawlPage(link, visited);
      }
    }
    console.log(`  ✨ Обработано новых ссылок: ${processedLinks}`);

  } catch (error) {
    console.error(`  ❌ Ошибка краулинга ${url}:`, error.message);
  }
}

async function runCrawl() {
  console.log('🚀 Начало краулинга...');
  console.log(`🎯 Стартовый URL: ${MANUAL_URL}\n`);
  
  await crawlPage(MANUAL_URL);
  
  console.log('\n✨ Краулинг завершён');
  
  // Показать статистику
  const { data, error } = await supabase
    .from('manual_sections')
    .select('*', { count: 'exact' });
    
  if (!error) {
    console.log(`📊 Всего записей в базе: ${data.length}`);
  }
}

runCrawl();
