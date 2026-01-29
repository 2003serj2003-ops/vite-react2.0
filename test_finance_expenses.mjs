#!/usr/bin/env node

/**
 * Test script for Uzum Finance Expenses API
 */

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const SHOP_ID = '96273';

async function testFinanceExpenses() {
  console.log('🧪 Testing Uzum Finance Expenses API with pagination...\n');

  try {
    let allPayments = [];
    let page = 0;
    let hasMore = true;

    // Load all pages
    while (hasMore) {
      console.log(`📄 Loading page ${page}...`);
      
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `/v1/finance/expenses?page=${page}&size=100&shopIds=${SHOP_ID}`,
          method: 'GET',
          headers: {
            'Authorization': TOKEN,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.payload && data.payload.payments && data.payload.payments.length > 0) {
        allPayments.push(...data.payload.payments);
        console.log(`   ✓ Loaded ${data.payload.payments.length} payments (total: ${allPayments.length})`);
        
        // Check if there are more pages
        if (data.payload.payments.length < 100) {
          hasMore = false;
        } else {
          page++;
          await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms between requests
        }
      } else {
        hasMore = false;
      }
    }

    console.log('\n✅ All data loaded\n');

    // Check structure
    if (allPayments.length > 0) {
      console.log(`📊 Structure: {payload: {payments: [...]}}`);
      console.log(`📦 Total expenses: ${allPayments.length}\n`);

      // Show first 3 expenses
      console.log('First 3 expenses:');
      allPayments.slice(0, 3).forEach((expense, i) => {
        console.log(`\n${i + 1}. ${expense.name}`);
        console.log(`   Source: ${expense.source}`);
        console.log(`   Amount: ${expense.paymentPrice} x ${expense.amount} = ${expense.paymentPrice * expense.amount}`);
        console.log(`   Code: ${expense.code}`);
        console.log(`   Status: ${expense.status}`);
        console.log(`   Date: ${new Date(expense.dateCreated).toLocaleDateString('ru-RU')}`);
      });

      // Calculate GRAND TOTAL
      let grandTotal = 0;
      allPayments.forEach(payment => {
        grandTotal += payment.paymentPrice * payment.amount;
      });

      console.log('\n\n💰 GRAND TOTAL (All expenses): ' + grandTotal.toLocaleString('ru-RU') + ' сум');
      console.log('📊 From screenshot: 476 748 сум');
      console.log(`${grandTotal === 476748 ? '✅' : '⚠️'} Match: ${grandTotal === 476748 ? 'YES' : 'NO (difference: ' + (grandTotal - 476748).toLocaleString('ru-RU') + ' сум)'}\n`);

      // Calculate totals by source
      console.log('📊 Totals by source:');
      const totals = {};
      allPayments.forEach(payment => {
        const source = payment.source || 'Unknown';
        if (!totals[source]) {
          totals[source] = { count: 0, total: 0 };
        }
        totals[source].count++;
        totals[source].total += payment.paymentPrice * payment.amount;
      });

      Object.entries(totals).forEach(([source, data]) => {
        console.log(`   ${source}: ${data.count} payments, ${data.total.toLocaleString('ru-RU')} сум`);
      });

      // Calculate totals by code
      console.log('\n📊 Totals by code:');
      const codeMap = {};
      allPayments.forEach(payment => {
        const code = payment.code || 'Unknown';
        if (!codeMap[code]) {
          codeMap[code] = { count: 0, total: 0 };
        }
        codeMap[code].count++;
        codeMap[code].total += payment.paymentPrice * payment.amount;
      });

      Object.entries(codeMap)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([code, data]) => {
          console.log(`   ${code}: ${data.count} payments, ${data.total.toLocaleString('ru-RU')} сум`);
        });

    } else {
      console.log('⚠️ Unexpected structure:', JSON.stringify(data, null, 2).substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFinanceExpenses();
