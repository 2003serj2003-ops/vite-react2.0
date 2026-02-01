/**
 * Finance Utilities - Correct calculations for financial data
 * All amounts are in minimal currency units (tiyin/kopeks) for precision
 */

export interface FinancialData {
  revenue_gross: number; // Выручка до комиссий (в тийинах)
  commission: number; // Комиссия маркетплейса (в тийинах)
  logistics: number; // Логистика (в тийинах)
  refunds: number; // Возвраты (в тийинах)
  payouts: number; // Выплаты (в тийинах)
  balance: number; // Текущий баланс (в тийинах)
  revenue_net: number; // Чистая выручка после вычетов (в тийинах)
}

/**
 * Format currency with proper thousands separators
 * @param amount - Amount in minimal units (tiyin)
 * @param currency - Currency symbol (default: 'сум')
 */
export function formatCurrency(amount: number, currency: string = 'сум'): string {
  // Convert from minimal units to regular units (tiyin to sum)
  const regularAmount = Math.round(amount);
  
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(regularAmount) + ' ' + currency;
}

/**
 * Format number with thousands separators (no currency)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

/**
 * Format date with proper timezone handling (+0500 for Uzbekistan)
 */
export function formatDate(dateInput: string | number | Date, includeTime: boolean = false): string {
  if (!dateInput) return 'N/A';
  
  let date: Date;
  
  if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }
  
  if (isNaN(date.getTime())) return 'N/A';
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Tashkent', // +0500
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleString('ru-RU', options);
}

/**
 * Calculate financial metrics from orders data
 * Updated to handle real Uzum API response structure
 */
export function calculateFinancials(orders: any[]): FinancialData {
  if (!orders || orders.length === 0) {
    return {
      revenue_gross: 0,
      commission: 0,
      logistics: 0,
      refunds: 0,
      payouts: 0,
      balance: 0,
      revenue_net: 0,
    };
  }

  let revenue_gross = 0;
  let commission = 0;
  let logistics = 0;
  let refunds = 0;
  let payouts = 0;
  
  orders.forEach(order => {
    // Uzum API orderItems fields:
    // - totalSum: общая сумма заказа (цена × количество)
    // - commission: комиссия маркетплейса
    // - logistics / deliverySum: стоимость доставки
    // - status: статус заказа
    // - toPay / sellerProfit: к выплате продавцу
    
    // Revenue (gross) - используем totalSum или вычисляем из цены и количества
    const totalSum = order.totalSum || 0;
    const sellPrice = order.sellPrice || order.price || order.amount || 0;
    const quantity = order.quantity || order.cnt || 1;
    
    // Используем totalSum если есть, иначе вычисляем
    const orderRevenue = totalSum > 0 ? totalSum : (sellPrice * quantity);
    revenue_gross += orderRevenue;
    
    // Commission - комиссия маркетплейса
    commission += order.commission || order.fee || order.commissionSum || 0;
    
    // Logistics - стоимость доставки
    logistics += order.logistics || order.deliveryFee || order.deliverySum || 0;
    
    // Refunds (if status is 'refunded' or 'cancelled')
    const status = (order.status || '').toLowerCase();
    if (status === 'refunded' || status === 'cancelled' || status === 'returned' || status === 'cancel') {
      refunds += orderRevenue;
    }
    
    // Payouts (seller profit) - к выплате продавцу
    const sellerProfit = order.sellerProfit || order.toPay || order.toPaySum || 0;
    payouts += sellerProfit;
  });
  
  // Calculate net revenue: валовая выручка - комиссия - логистика - возвраты
  const revenue_net = revenue_gross - commission - logistics - refunds;
  
  // Balance is typically what's left to be paid out
  const balance = revenue_net - payouts;
  
  console.log('💰 [calculateFinancials] Calculated:', {
    orders_count: orders.length,
    revenue_gross,
    commission,
    logistics,
    refunds,
    payouts,
    revenue_net,
    balance,
    sample_order: orders[0]
  });
  
  return {
    revenue_gross,
    commission,
    logistics,
    refunds,
    payouts,
    balance,
    revenue_net,
  };
}

/**
 * Filter orders by date range with proper timezone handling
 */
export function filterOrdersByDateRange(
  orders: any[],
  dateFrom: number,
  dateTo: number
): any[] {
  return orders.filter(order => {
    const orderDate = order.date || order.createdAt || order.created_at || 0;
    return orderDate >= dateFrom && orderDate <= dateTo;
  });
}

/**
 * Get date range for period filter
 */
export function getDateRangeForPeriod(period: 'day' | 'week' | 'month' | 'custom', customDates?: { from: Date; to: Date }): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  switch (period) {
    case 'day': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { from: start, to: today };
    }
    
    case 'week': {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: today };
    }
    
    case 'month': {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: today };
    }
    
    case 'custom': {
      if (!customDates) {
        return { from: today, to: today };
      }
      return customDates;
    }
    
    default:
      return { from: today, to: today };
  }
}

/**
 * Validate and sanitize financial data to prevent NaN/undefined
 */
export function sanitizeFinancialData(data: Partial<FinancialData>): FinancialData {
  return {
    revenue_gross: Number(data.revenue_gross) || 0,
    commission: Number(data.commission) || 0,
    logistics: Number(data.logistics) || 0,
    refunds: Number(data.refunds) || 0,
    payouts: Number(data.payouts) || 0,
    balance: Number(data.balance) || 0,
    revenue_net: Number(data.revenue_net) || 0,
  };
}
