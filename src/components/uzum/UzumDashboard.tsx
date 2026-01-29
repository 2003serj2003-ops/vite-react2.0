import { useState, useEffect } from 'react';
import { getShops, getProducts, getFbsOrdersCount } from '../../lib/uzum-api';
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
  const [loading, setLoading] = useState(true);
  const [showWeeklyChart, setShowWeeklyChart] = useState(false);
  const [datePeriod, setDatePeriod] = useState<7 | 10 | 30>(7);

  // Вычисляем диапазон дат на основе выбранного периода
  function getDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - datePeriod);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
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

  useEffect(() => {
    loadDashboard();
  }, [token, datePeriod]);

  async function loadDashboard() {
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

          // Load orders count (все заказы - суммируем по всем статусам)
          const statuses = ['CREATED', 'PACKING', 'PENDING_DELIVERY', 'DELIVERING', 'DELIVERED', 
                           'ACCEPTED_AT_DP', 'DELIVERED_TO_CUSTOMER_DELIVERY_POINT', 
                           'COMPLETED', 'CANCELED', 'PENDING_CANCELLATION', 'RETURNED'];
          
          let totalOrders = 0;
          for (const status of statuses) {
            const result = await getFbsOrdersCount(token, shopId, { status });
            totalOrders += result.count || 0;
            await new Promise(resolve => setTimeout(resolve, 100)); // задержка чтобы избежать 429
          }
          
          console.log('📋 Total orders count:', totalOrders);
          setStats(prev => ({
            ...prev,
            activeOrders: totalOrders,
          }));

          // Load pending orders (CREATED + PACKING + PENDING_DELIVERY статусы)
          const createdResult = await getFbsOrdersCount(token, shopId, { status: 'CREATED' });
          await new Promise(resolve => setTimeout(resolve, 100));
          const packingResult = await getFbsOrdersCount(token, shopId, { status: 'PACKING' });
          await new Promise(resolve => setTimeout(resolve, 100));
          const pendingResult = await getFbsOrdersCount(token, shopId, { status: 'PENDING_DELIVERY' });
          
          const pendingTotal = (createdResult.count || 0) + (packingResult.count || 0) + (pendingResult.count || 0);
          
          setStats(prev => ({
            ...prev,
            pendingOrders: pendingTotal,
          }));
        }
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
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
              {t.dateRange} {dateRange.start} по {dateRange.end}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '📱', label: t.marketing, value: 0, color: '#8b5cf6' },
                { icon: '💵', label: t.commission, value: 0, color: '#3b82f6' },
                { icon: '🚚', label: t.logistics, value: 0, color: '#f43f5e' },
                { icon: '⚠️', label: t.fines, value: 0, color: '#f59e0b' },
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
              {t.dateRange} {dateRange.start} по {dateRange.end}
            </div>
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#9ca3af',
            }}>
              Нет данных
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
