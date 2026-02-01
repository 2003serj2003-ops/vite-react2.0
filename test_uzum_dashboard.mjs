#!/usr/bin/env node

/**
 * Test script to verify UZUM Dashboard data loading
 * This simulates the data fetching that happens in UzumDashboard component
 */

import fetch from 'node-fetch';

// ANSI colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

// Test credentials (replace with real ones)
const TEST_CONFIG = {
  // You need to provide real UZUM API credentials here
  apiUrl: 'https://api-seller.uzum.uz/api',
  token: process.env.UZUM_TOKEN || 'YOUR_TOKEN_HERE',
  shopId: process.env.UZUM_SHOP_ID || 'YOUR_SHOP_ID_HERE',
};

async function testStocksAPI() {
  log.section('Testing Stocks API');
  
  try {
    const url = `${TEST_CONFIG.apiUrl}/merchant/v1/warehouse/fbs/sku/stocks`;
    log.info(`Fetching: ${url}`);
    log.info(`Shop ID: ${TEST_CONFIG.shopId}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    log.success(`Status: ${response.status}`);
    log.info(`Response type: ${typeof data}`);
    log.info(`Is array: ${Array.isArray(data)}`);
    
    if (data && typeof data === 'object') {
      log.info(`Keys: ${Object.keys(data).join(', ')}`);
    }
    
    // Check different possible structures
    if (Array.isArray(data)) {
      log.success(`✓ Data is direct array with ${data.length} items`);
      if (data.length > 0) {
        console.log('\nFirst item sample:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    } else if (data.items && Array.isArray(data.items)) {
      log.success(`✓ Data has 'items' array with ${data.items.length} items`);
      if (data.items.length > 0) {
        console.log('\nFirst item sample:');
        console.log(JSON.stringify(data.items[0], null, 2));
      }
    } else if (data.stocks && Array.isArray(data.stocks)) {
      log.success(`✓ Data has 'stocks' array with ${data.stocks.length} items`);
      if (data.stocks.length > 0) {
        console.log('\nFirst stock sample:');
        console.log(JSON.stringify(data.stocks[0], null, 2));
      }
    } else if (data.data && Array.isArray(data.data)) {
      log.success(`✓ Data has 'data' array with ${data.data.length} items`);
      if (data.data.length > 0) {
        console.log('\nFirst data item sample:');
        console.log(JSON.stringify(data.data[0], null, 2));
      }
    } else {
      log.warn('Data structure is not recognized');
      console.log('\nFull response:');
      console.log(JSON.stringify(data, null, 2));
    }
    
    return { success: true, data };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

async function testFinanceOrdersAPI() {
  log.section('Testing Finance Orders API');
  
  try {
    // Get last 7 days
    const endDate = Date.now();
    const startDate = endDate - (7 * 24 * 60 * 60 * 1000);
    
    const url = `${TEST_CONFIG.apiUrl}/merchant/v1/finance/orders?limit=100&offset=0`;
    log.info(`Fetching: ${url}`);
    log.info(`Date range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    log.success(`Status: ${response.status}`);
    log.info(`Response type: ${typeof data}`);
    
    if (data && typeof data === 'object') {
      log.info(`Keys: ${Object.keys(data).join(', ')}`);
    }
    
    // Check structure
    if (data.items && Array.isArray(data.items)) {
      log.success(`✓ Found ${data.items.length} finance orders`);
      
      // Filter by date range
      const filteredOrders = data.items.filter(order => {
        const orderDate = order.date || order.createdAt || 0;
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      log.success(`✓ ${filteredOrders.length} orders in last 7 days`);
      
      if (filteredOrders.length > 0) {
        console.log('\nFirst order sample:');
        console.log(JSON.stringify(filteredOrders[0], null, 2));
        
        // Calculate revenue
        const revenue = filteredOrders.reduce((sum, order) => {
          return sum + ((order.sellPrice || 0) * (order.amount || 1));
        }, 0);
        
        log.success(`Total revenue (last 7 days): ${revenue.toLocaleString('ru-RU')} сум`);
      }
    } else {
      log.warn('Finance orders data structure not recognized');
      console.log('\nFull response:');
      console.log(JSON.stringify(data, null, 2));
    }
    
    return { success: true, data };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

async function testFinanceExpensesAPI() {
  log.section('Testing Finance Expenses API');
  
  try {
    const url = `${TEST_CONFIG.apiUrl}/merchant/v1/finance/expenses?limit=100&offset=0`;
    log.info(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    log.success(`Status: ${response.status}`);
    log.info(`Response type: ${typeof data}`);
    
    if (data && typeof data === 'object') {
      log.info(`Keys: ${Object.keys(data).join(', ')}`);
    }
    
    // Check structure
    if (data.items && Array.isArray(data.items)) {
      log.success(`✓ Found ${data.items.length} expenses`);
      
      if (data.items.length > 0) {
        console.log('\nFirst expense sample:');
        console.log(JSON.stringify(data.items[0], null, 2));
        
        // Calculate total
        const total = data.items.reduce((sum, expense) => {
          return sum + ((expense.paymentPrice || expense.amount || 0) * (expense.amount || 1));
        }, 0);
        
        log.success(`Total expenses: ${total.toLocaleString('ru-RU')} сум`);
      } else {
        log.warn('No expenses found');
      }
    } else {
      log.warn('Finance expenses data structure not recognized');
      console.log('\nFull response:');
      console.log(JSON.stringify(data, null, 2));
    }
    
    return { success: true, data };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}`);
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   UZUM Dashboard API Test                     ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  // Check if credentials are provided
  if (TEST_CONFIG.token === 'YOUR_TOKEN_HERE') {
    log.error('Please provide UZUM_TOKEN environment variable or update the script');
    log.info('Usage: UZUM_TOKEN=your_token UZUM_SHOP_ID=your_shop node test_uzum_dashboard.mjs');
    process.exit(1);
  }
  
  const results = {
    stocks: await testStocksAPI(),
    financeOrders: await testFinanceOrdersAPI(),
    financeExpenses: await testFinanceExpensesAPI(),
  };
  
  // Summary
  log.section('Test Summary');
  
  const allSuccess = Object.values(results).every(r => r.success);
  
  if (allSuccess) {
    log.success('All API tests passed ✓');
  } else {
    log.error('Some API tests failed ✗');
  }
  
  console.log('\nResults:');
  console.log(`  Stocks API: ${results.stocks.success ? '✓' : '✗'}`);
  console.log(`  Finance Orders API: ${results.financeOrders.success ? '✓' : '✗'}`);
  console.log(`  Finance Expenses API: ${results.financeExpenses.success ? '✓' : '✗'}`);
  
  console.log('\n');
}

main().catch(console.error);
