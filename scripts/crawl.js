import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '../src/supabase.js'; // Adjust path if needed

const MANUAL_URL = 'https://seller.uzum.uz/manual';

async function crawlPage(url, visited = new Set()) {
  if (visited.has(url)) return;
  visited.add(url);

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract title
    const title = $('title').text() || $('h1').first().text() || 'No title';

    // Extract content (all text)
    const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000); // Limit to 5000 chars

    // Save to Supabase
    const { data, error } = await supabase
      .from('manual_sections')
      .insert([{ title, content, url }]);

    if (error) console.error('Insert error:', error);

    // Find links to other pages (relative or absolute)
    $('a[href]').each((i, elem) => {
      const link = $(elem).attr('href');
      if (link) {
        let fullLink;
        try {
          fullLink = new URL(link, url).href;
        } catch {
          return;
        }
        // Only crawl within the manual domain
        if (fullLink.startsWith('https://seller.uzum.uz/manual/')) {
          crawlPage(fullLink, visited);
        }
      }
    });
  } catch (error) {
    console.error(`Error crawling ${url}:`, error.message);
  }
}

async function main() {
  await crawlPage(MANUAL_URL);
  console.log('Crawling completed');
}

main();