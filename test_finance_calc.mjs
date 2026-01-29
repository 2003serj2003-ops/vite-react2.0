#!/usr/bin/env node

const PROXY_URL = 'https://ykbouygdeqrohizeqlmc.supabase.co/functions/v1/uzum-proxy';
const TOKEN = '17Z3s6FTmT6A/GJuWemvD3Y2jxowB3av9kTwB4S5N5I=';
const SHOP_ID = '96273';

async function testFinanceCalculations() {
  console.log('📊 Testing Finance Calculations for Last 7 Days...\n');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  console.log(`Period: ${sevenDaysAgo.toLocaleDateString('ru-RU')} - ${now.toLocaleDateString('ru-RU')}\n`);

  try {
    // Load ALL finance orders
    let allOrders = [];
    let page = 0;
    let hasMore = true;

    console.log('Loading finance orders...');
    while (hasMore) {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/v1/finance/orders?page=${page}&size=100&shopIds=${SHOP_ID}`,
          method: 'GET',
          headers: { 'Authorization': TOKEN },
        }),
      });

      const data = await response.json();
      if (data.orderItems && data.orderItems.length > 0) {
        allOrders.push(...data.orderItems);
        if (data.orderItems.length < 100) hasMore = false;
        else page++;
      } else {
        hasMore = false;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Total orders loaded: ${allOrders.length}\n`);

    // Filter by last 7 days
    const filtered = allOrders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= sevenDaysAgo && orderDate <= now;
    });

    console.log(`Orders in last 7 days: ${filtered.length}\n`);

    // Calculate revenue (only non-canceled)
    const activeOrders = filtered.filter(o => o.status !== 'CANCELED' && !o.cancelled);
    const revenue = activeOrders.reduce((sum, o) => sum + (o.sellPrice * o.amount), 0);
    const profit = activeOrders.reduce((sum, o) => sum + (o.sellerProfit * o.amount), 0);
    const commission = activeOrders.reduce((sum, o) => sum + (o.commission * o.amount), 0);
    const logistics = activeOrders.reduce((sum, o) => sum + (o.logisticDeliveryFee * o.amount), 0);

    console.log('💰 FINANCE ORDERS (Last 7 days):');
    console.log(`   Active orders: ${activeOrders.length}`);
    console.log(`   Revenue (sellPrice): ${revenue.toLocaleString('ru-RU')} сум`);
    console.log(`   Seller Profit: ${profit.toLocaleString('ru-RU')} сум`);
    console.log(`   Commission: ${commission.toLocaleString('ru-RU')} сум`);
    console.log(`   Logistics: ${logistics.toLocaleString('ru-RU')} сум\n`);

    // Load ALL expenses
    let allExpenses = [];
    page = 0;
    hasMore = true;

    console.log('Loading expenses...');
    while (hasMore) {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/v1/finance/expenses?page=${page}&size=100&shopIds=${SHOP_ID}`,
          method: 'GET',
          headers: { 'Authorization': TOKEN },
        }),
      });

      const data = await response.json();
      if (data.payload?.payments && data.payload.payments.length > 0) {
        allExpenses.push(...data.payload.payments);
        if (data.payload.payments.length < 100) hasMore = false;
        else page++;
      } else {
        hasMore = false;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Total expenses loaded: ${allExpenses.length}\n`);

    // Filter expenses by last 7 days
    const filteredExpenses = allExpenses.filter(expense => {
      const expenseDate = new Date(expense.dateCreated);
      return expenseDate >= sevenDaysAgo && expenseDate <= now;
    });

    console.log(`Expenses in last 7 days: ${filteredExpenses.length}\n`);

    // Calculate expenses by source
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.paymentPrice * e.amount), 0);
    
    const bySource = {};
    filteredExpenses.forEach(expense => {
      const source = expense.source || 'Unknown';
      if (!bySource[source]) bySource[source] = 0;
      bySource[source] += expense.paymentPrice * expense.amount;
    });

    console.log('💸 EXPENSES (Last 7 days):');
    console.log(`   Total: ${totalExpenses.toLocaleString('ru-RU')} сум`);
    Object.entries(bySource).forEach(([source, amount]) => {
      console.log(`   ${source}: ${amount.toLocaleString('ru-RU')} сум`);
    });

    console.log('\n📊 SUMMARY:');
    console.log(`   Revenue: ${revenue.toLocaleString('ru-RU')} сум`);
    console.log(`   Expenses: ${totalExpenses.toLocaleString('ru-RU')} сум`);
    console.log(`   Profit (from orders): ${profit.toLocaleString('ru-RU')} сум`);
    console.log(`   Net Profit (revenue - expenses): ${(revenue - totalExpenses).toLocaleString('ru-RU')} сум`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testFinanceCalculations();
