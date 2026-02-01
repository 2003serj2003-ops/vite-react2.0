#!/usr/bin/env node

const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const SHOP_ID = 96273;

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';

console.log('Fetching products...\n');

const response = await fetch(PROXY_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: `/v1/product/shop/${SHOP_ID}?size=100&page=0`,
    method: 'GET',
    headers: {
      'Authorization': TOKEN
    }
  })
});

const data = await response.json();

console.log('Response keys:', Object.keys(data));
console.log('\nFirst product structure:');
console.log(JSON.stringify(data.productList?.[0], null, 2));
