import { useState, useEffect } from 'react';
import { getShops, getProducts, getFbsOrdersCount, getFinanceOrders, getFinanceExpenses } from '../../lib/uzum-api';
import UzumWeeklyChart from './UzumWeeklyChart';

interface UzumDashboardProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigate: (page: 'products' | 'orders' | 'finance') => void;
  onNavigateBack: () => void;
}

export default function UzumDashboard({ lang, token, onNavigate, onNavigateBack }: UzumDashboardProps) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    toPay: 0,
    profit: 0,
    fboStock: 0,
    fbsStock: 0,
  });
  const [financeBreakdown, setFinanceBreakdown] = useState({
    // Расходы
    marketing: 0,
    commission: 0,
    logistics: 0,
    fines: 0,
    // Доходы (из заказов)
    totalCommission: 0,
    totalLogistics: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showWeeklyChart, setShowWeeklyChart] = useState(false);
  const [datePeriod, setDatePeriod] = useState<7 | 10 | 30>(7);

  // Вычисляем диапазон дат на основе выбранного периода
  function getDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - datePeriod);
    start.setHours(0, 0, 0, 0); // начало дня
    end.setHours(23, 59, 59, 999); // конец дня
    return {
      startMs: start.getTime(),
      endMs: end.getTime()
    };
  }

  const dateRange = getDateRange();

  const T = {
    ru: {
      title: 'Главная страница',
      back: 'Назад',
      loading: 'Загрузка...',
      financialData: 'Финансовые данные',
      dateRange: 'На дату',
      revenue: 'Выручка',
      toPay: 'К выплате',
      netProfit: 'Чистая прибыль',
      warehouse: 'Товары на складе',
      fboQty: 'Кол-во FBO',
      fboCost: 'Себес. FBO',
      fbsQty: 'Кол-во FBS',
      fbsCost: 'Себес. FBS',
      recentOrders: 'Последние заказы',
      pending: 'в ожидании',
      delivered: 'доставлено',
      canceled: 'отменено',
      expenses: 'Расходы',
      income: 'Доходы',
      marketing: 'Маркетинг',
      commission: 'Комиссия',
      logistics: 'Логистика',
      fines: 'Штраф FBS',
      products: 'Товары',
      orders: 'Заказы',
      finance: 'Финансы',
      viewAll: 'Смотреть все',
      weeklyChart: 'Недельный обзор заказов',
      last7days: 'Последние 7 дней',
      last10days: 'Последние 10 дней',
      last30days: 'Последние 30 дней',
    },
    uz: {
      title: 'Bosh sahifa',
      back: 'Orqaga',
      loading: 'Yuklanmoqda...',
      financialData: 'Moliyaviy malumotlar',
      dateRange: 'Sanadan',
      revenue: 'Daromad',
      toPay: 'Tolanishi kerak',
      netProfit: 'Sof foyda',
      warehouse: 'Ombordagi mahsulotlar',
      fboQty: 'FBO soni',
      fboCost: 'FBO tannarxi',
      fbsQty: 'FBS soni',
      fbsCost: 'FBS tannarxi',
      recentOrders: 'Oxirgi buyurtmalar',
      pending: 'kutilmoqda',
      delivered: 'yetkazildi',
      canceled: 'bekor qilindi',
      expenses: 'Xarajatlar',
      income: 'Daromad',
      marketing: 'Marketing',
      commission: 'Komissiya',
      logistics: 'Logistika',
      fines: 'FBS jarima',
      products: 'Mahsulotlar',
      orders: 'Buyurtmalar',
      finance: 'Moliya',
      viewAll: 'Barchasini korish',
      weeklyChart: 'Haftalik buyurtmalar sharhi',
      last7days: 'Oxirgi 7 kun',
      last10days: 'Oxirgi 10 kun',
      last30days: 'Oxirgi 30 kun',
    },
  };

  const t = T[lang];

  // Load basic dashboard data once
  useEffect(() => {
    loadBasicData();
  }, [token]);

  // Load finance data when period changes
  useEffect(() => {
    if (stats.totalProducts > 0) { // Only load if we have shop data
      loadFinanceData();
    }
  }, [datePeriod]);

  async function loadBasicData() {
    setLoading(true);
    try {
      // Load shops
      const shopsResult = await getShops(token);
      console.log('🏪 Shops result:', shopsResult);
      if (shopsResult.success && shopsResult.shops) {
        // Load products and orders for first shop
        if (shopsResult.shops.length > 0) {
          const shopId = shopsResult.shops[0].id;
          
          // Load products
          const productsResult = await getProducts(token, shopId);
          console.log('📦 Products result:', productsResult);
          
          if (productsResult.success) {
            setStats(prev => ({
              ...prev,
              totalProducts: productsResult.total || 0,
            }));
          }

          // Load orders count - use Promise.all for parallel requests (faster!)
          const statuses = ['CREATED', 'PACKING', 'PENDING_DELIVERY', 'DELIVERING', 'DELIVERED', 
                           'ACCEPTED_AT_DP', 'DELIVERED_TO_CUSTOMER_DELIVERY_POINT', 
                           'COMPLETED', 'CANCELED', 'PENDING_CANCELLATION', 'RETURNED'];
          
          // Split into chunks of 3 for parallel requests
          let totalOrders = 0;
          for (let i = 0; i < statuses.length; i += 3) {
            const chunk = statuses.slice(i, i + 3);
            const results = await Promise.all(
              chunk.map(status => getFbsOrdersCount(token, shopId, { status }))
            );
            totalOrders += results.reduce((sum, r) => sum + (r.count || 0), 0);
          }
          
          console.log('📋 Total orders count:', totalOrders);
          setStats(prev => ({
            ...prev,
            activeOrders: totalOrders,
          }));

          // Load pending orders in parallel
          const [createdResult, packingResult, pendingResult] = await Promise.all([
            getFbsOrdersCount(token, shopId, { status: 'CREATED' }),
            getFbsOrdersCount(token, shopId, { status: 'PACKING' }),
            getFbsOrdersCount(token, shopId, { status: 'PENDING_DELIVERY' }),
          ]);
          
          const pendingTotal = (createdResult.count || 0) + (packingResult.count || 0) + (pendingResult.count || 0);
          
          setStats(prev => ({
            ...prev,
            pendingOrders: pendingTotal,
          }));

          // Load initial finance data
          await loadFinanceData();
        }
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFinanceData() {
    try {
      const shopsResult = await getShops(token);
      if (!shopsResult.success || !shopsResult.shops || shopsResult.shops.length === 0) {
        return;
      }

      const shopId = shopsResult.shops[0].id;

      // Load finance data - orders and expenses
      console.log('📊 Loading finance data for period:', datePeriod, 'days');

      // Load finance orders (revenue) - load ALL orders
      const allFinanceOrders: any[] = [];
          let page = 0;
          let hasMore = true;

          while (hasMore) {
            const financeResult = await getFinanceOrders(token, shopId, {
              size: 100,
              page,
            });
            
            if (financeResult.success && financeResult.orders && financeResult.orders.length > 0) {
              allFinanceOrders.push(...financeResult.orders);
              if (financeResult.orders.length < 100) {
                hasMore = false;
              } else {
                page++;
                // No delay - API handles it fine
              }
            } else {
              hasMore = false;
            }
          }

          console.log('💰 Finance orders loaded:', allFinanceOrders.length);

          // Filter by date range manually
          const filteredOrders = allFinanceOrders.filter(order => {
            const orderDate = order.date || order.createdAt || 0;
            return orderDate >= dateRange.startMs && orderDate <= dateRange.endMs;
          });

          console.log(`💰 Filtered orders for period (${datePeriod} days): ${filteredOrders.length}`);

          // Calculate revenue (sum of sellPrice * amount for non-canceled orders)
          const revenue = filteredOrders.reduce((sum, order) => {
            // Skip canceled orders
            if (order.status === 'CANCELED' || order.cancelled) return sum;
            return sum + ((order.sellPrice || 0) * (order.amount || 1));
          }, 0);

          // Calculate profit (sellerProfit)
          const totalProfit = filteredOrders.reduce((sum, order) => {
            if (order.status === 'CANCELED' || order.cancelled) return sum;
            return sum + ((order.sellerProfit || 0) * (order.amount || 1));
          }, 0);

          // Load expenses
          const allExpenses: any[] = [];
          page = 0;
          hasMore = true;

          while (hasMore) {
            const expensesResult = await getFinanceExpenses(token, shopId, {
              size: 100,
              page,
            });

            if (expensesResult.success && expensesResult.expenses && expensesResult.expenses.length > 0) {
              allExpenses.push(...expensesResult.expenses);
              if (expensesResult.expenses.length < 100) {
                hasMore = false;
              } else {
                page++;
                // No delay needed
              }
            } else {
              hasMore = false;
            }
          }

          console.log('💸 Expenses loaded:', allExpenses.length);

          // Filter expenses by date range
          const filteredExpenses = allExpenses.filter(expense => {
            const expenseDate = expense.dateCreated || expense.createdAt || 0;
            return expenseDate >= dateRange.startMs && expenseDate <= dateRange.endMs;
          });

          console.log(`💸 Filtered expenses for period (${datePeriod} days): ${filteredExpenses.length}`);

          // Calculate expenses by category
          const expensesByCategory = {
            marketing: 0,
            commission: 0,
            logistics: 0,
            fines: 0,
          };

          filteredExpenses.forEach(expense => {
            const amount = (expense.paymentPrice || 0) * (expense.amount || 1);
            const source = expense.source?.toLowerCase() || '';
            
            if (source.includes('marketing')) {
              expensesByCategory.marketing += amount;
            } else if (source.includes('logist')) {
              expensesByCategory.logistics += amount;
            } else if (source.includes('uzum') || source.includes('market')) {
              expensesByCategory.fines += amount; // FBS штрафы/комиссии
            }
          });

          // Calculate total expenses
          const totalExpenses = filteredExpenses.reduce((sum, expense) => {
            return sum + ((expense.paymentPrice || 0) * (expense.amount || 1));
          }, 0);

          // Calculate income breakdown from orders (commission + logistics charged in orders)
          const incomeBreakdown = {
            totalCommission: 0,
            totalLogistics: 0,
          };

          filteredOrders.forEach(order => {
            if (order.status !== 'CANCELED' && !order.cancelled) {
              incomeBreakdown.totalCommission += (order.commission || 0) * (order.amount || 1);
              incomeBreakdown.totalLogistics += (order.logisticDeliveryFee || 0) * (order.amount || 1);
            }
          });

          // Update stats with finance data
          setStats(prev => ({
            ...prev,
            revenue,
            toPay: revenue, // К выплате = выручка (упрощенно)
            profit: totalProfit,
          }));

          // Update finance breakdown
          setFinanceBreakdown({
            ...expensesByCategory,
            ...incomeBreakdown,
          });

          console.log('📊 Finance summary:', { 
            period: `Last ${datePeriod} days`,
            dateRangeMs: { start: dateRange.startMs, end: dateRange.endMs },
            revenue, 
            totalExpenses, 
            profit: totalProfit,
            ordersInPeriod: filteredOrders.length,
            expensesInPeriod: filteredExpenses.length,
            breakdown: {
              expenses: expensesByCategory,
              income: incomeBreakdown,
            },
            sampleOrderDate: filteredOrders[0]?.date || 'no orders',
            sampleExpenseDate: filteredExpenses[0]?.dateCreated || 'no expenses'
          });
    } catch (error) {
      console.error('Finance load error:', error);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        fontSize: '16px',
        color: '#6b7280',
      }}>
        🔄 {t.loading}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="list">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onNavigateBack}
            className="split"
          >
            ← {t.back}
          </button>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111',
            margin: 0,
          }}>
            {t.title}
          </h1>
        </div>
        <button
          onClick={() => setShowWeeklyChart(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📊 {t.weeklyChart}
        </button>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Financial Data */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#111',
                margin: 0,
              }}>
                {t.financialData}
              </h2>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}>
                <button
                  onClick={() => setDatePeriod(7)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: datePeriod === 7 ? '#7c3aed' : '#f3f4f6',
                    color: datePeriod === 7 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: datePeriod === 7 ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.last7days}
                </button>
                <button
                  onClick={() => setDatePeriod(10)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: datePeriod === 10 ? '#7c3aed' : '#f3f4f6',
                    color: datePeriod === 10 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: datePeriod === 10 ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.last10days}
                </button>
                <button
                  onClick={() => setDatePeriod(30)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: datePeriod === 30 ? '#7c3aed' : '#f3f4f6',
                    color: datePeriod === 30 ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: datePeriod === 30 ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.last30days}
                </button>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px',
                }}>
                  {t.revenue}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#111',
                }}>
                  {formatNumber(stats.revenue)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px',
                }}>
                  {t.toPay}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#22c55e',
                }}>
                  {formatNumber(stats.toPay)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px',
                }}>
                  {t.netProfit}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: stats.profit < 0 ? '#ef4444' : '#22c55e',
                }}>
                  {formatNumber(stats.profit)}
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#111',
              marginBottom: '20px',
            }}>
              {t.warehouse}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
            }}>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {t.fboQty}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
                  {stats.fboStock}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {t.fboCost}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
                  0
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {t.fbsQty}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
                  {stats.fbsStock}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {t.fbsCost}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
                  0
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#111',
                margin: 0,
              }}>
                {t.recentOrders}
              </h2>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {stats.pendingOrders} {t.pending}, 0 {t.delivered}, 0 {t.canceled}
              </div>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="btnPrimary"
              style={{ width: '100%' }}
            >
              {t.viewAll} →
            </button>
          </div>
        </div>

        {/* Right Column - Expenses & Income */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Expenses */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#111',
              marginBottom: '8px',
            }}>
              {t.expenses}
            </h2>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              {t.dateRange} {new Date(dateRange.startMs).toLocaleDateString('ru-RU')} по {new Date(dateRange.endMs).toLocaleDateString('ru-RU')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '📱', label: t.marketing, value: financeBreakdown.marketing, color: '#8b5cf6' },
                { icon: '💵', label: t.commission, value: financeBreakdown.commission, color: '#3b82f6' },
                { icon: '🚚', label: t.logistics, value: financeBreakdown.logistics, color: '#f43f5e' },
                { icon: '⚠️', label: t.fines, value: financeBreakdown.fines, color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>
                        {formatNumber(item.value)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      100% <span style={{ color: '#ef4444' }}>↑</span>
                    </div>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: '100%',
                      backgroundColor: item.color,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Income */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#111',
              marginBottom: '8px',
            }}>
              {t.income}
            </h2>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              {t.dateRange} {new Date(dateRange.startMs).toLocaleDateString('ru-RU')} по {new Date(dateRange.endMs).toLocaleDateString('ru-RU')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '💰', label: t.commission, value: financeBreakdown.totalCommission, color: '#8b5cf6' },
                { icon: '🚚', label: t.logistics, value: financeBreakdown.totalLogistics, color: '#3b82f6' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>
                        {formatNumber(item.value)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      100% <span style={{ color: '#10b981' }}>↑</span>
                    </div>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: '100%',
                      backgroundColor: item.color,
                      borderRadius: '2px',
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }}>
        <button
          onClick={() => onNavigate('products')}
          className="cardCream"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: '24px',
            border: 'none',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#7c3aed',
            marginBottom: '8px',
          }}>
            {stats.totalProducts}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666',
          }}>
            {t.products}
          </div>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="cardCream"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: '24px',
            border: 'none',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#22c55e',
            marginBottom: '8px',
          }}>
            {stats.activeOrders}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666',
          }}>
            {t.orders}
          </div>
        </button>

        <button
          onClick={() => onNavigate('finance')}
          className="cardCream"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: '24px',
            border: 'none',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#f59e0b',
            marginBottom: '8px',
          }}>
            {formatNumber(stats.toPay)}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666',
          }}>
            {t.finance}
          </div>
        </button>
      </div>

      {/* Weekly Chart Modal */}
      {showWeeklyChart && (
        <UzumWeeklyChart
          lang={lang}
          token={token}
          onClose={() => setShowWeeklyChart(false)}
        />
      )}
    </div>
  );
}
