import { useState, useEffect } from 'react';
import { getShops, getFinanceOrders, getFinanceExpenses } from '../../lib/uzum-api';
import SmartLoader from '../SmartLoader';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCalendar } from 'react-icons/fi';
import { 
  calculateFinancials, 
  formatCurrency, 
  formatDate as formatFinanceDate,
  sanitizeFinancialData 
} from '../../lib/finance-utils';

interface UzumFinanceProps {
  lang: 'ru' | 'uz';
  token: string;
}

export default function UzumFinance({ lang, token }: UzumFinanceProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30 | 90 | 'all'>(30); // По умолчанию 30 дней
  
  // Динамический расчёт дат на основе выбранного периода
  const dateToMs = new Date().getTime();
  const dateFromMs = period === 'all' 
    ? new Date('2024-01-01T00:00:00').getTime() // Для "всё время" берём с 2024 года
    : dateToMs - (period * 24 * 60 * 60 * 1000); // Вычитаем N дней

  const T = {
    ru: {
      title: 'Финансы',
      back: 'Назад',
      loading: 'Загрузка...',
      orders: 'Заказы',
      expenses: 'Расходы',
      noData: 'Нет данных',
      dateFrom: 'С',
      dateTo: 'По',
      filter: 'Фильтр',
      orderNumber: 'Заказ',
      date: 'Дата',
      amount: 'Сумма',
      commission: 'Комиссия',
      total: 'Итого',
      type: 'Тип',
      description: 'Описание',
      revenue: 'Выручка',
      totalExpenses: 'Расходы',
      profit: 'Прибыль',
      period7: '7 дней',
      period30: '30 дней',
      period90: '90 дней',
      periodAll: 'Всё время',
      selectPeriod: 'Выберите период:',
    },
    uz: {
      title: 'Moliya',
      back: 'Orqaga',
      loading: 'Yuklanmoqda...',
      orders: 'Buyurtmalar',
      expenses: 'Xarajatlar',
      noData: 'Malumot yoq',
      dateFrom: 'Dan',
      dateTo: 'Gacha',
      filter: 'Filtr',
      orderNumber: 'Buyurtma',
      date: 'Sana',
      amount: 'Summa',
      commission: 'Komissiya',
      total: 'Jami',
      type: 'Turi',
      description: 'Tavsif',
      revenue: 'Daromad',
      totalExpenses: 'Xarajatlar',
      profit: 'Foyda',
      period7: '7 kun',
      period30: '30 kun',
      period90: '90 kun',
      periodAll: 'Barcha vaqt',
      selectPeriod: 'Davrni tanlang:',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadShopAndData();
  }, [token, activeTab, period]);

  async function loadShopAndData() {
    console.log('[UzumFinance] Starting data load...');
    console.log('[UzumFinance] Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    console.log('[UzumFinance] Period:', period);
    console.log('[UzumFinance] Active tab:', activeTab);
    console.log('[UzumFinance] Date range:', new Date(dateFromMs).toISOString(), '-', new Date(dateToMs).toISOString());
    
    setLoading(true);
    try {
      // Сначала получаем shopId
      console.log('[UzumFinance] Fetching shops...');
      const shopsResult = await getShops(token);
      console.log('[UzumFinance] Shops result:', shopsResult);
      
      if (!shopsResult.success || !shopsResult.shops?.length) {
        console.error('[UzumFinance] No shops found or error:', shopsResult);
        setLoading(false);
        return;
      }

      const currentShopId = shopsResult.shops[0].id;
      console.log('[UzumFinance] Using shop ID:', currentShopId);

      // Затем загружаем данные с датами
      if (activeTab === 'orders') {
        console.log('[UzumFinance] Fetching orders...');
        const result = await getFinanceOrders(token, currentShopId, {
          size: 100,
          page: 0,
          dateFrom: dateFromMs,
          dateTo: dateToMs,
        });
        console.log('💰 [Finance] Orders result:', result);
        console.log('💰 [Finance] Orders count:', result.orders?.length || 0);
        
        if (result.success && result.orders) {
          const ordersArray = Array.isArray(result.orders) ? result.orders : [];
          console.log('💰 [Finance] Setting orders:', ordersArray.length);
          setOrders(ordersArray);
        } else {
          console.error('💰 [Finance] Orders fetch failed or no orders');
          setOrders([]);
        }
      } else {
        // Загружаем все расходы с пагинацией БЕЗ фильтра дат
        // Затем фильтруем на клиенте
        console.log('[UzumFinance] Fetching expenses...');
        const allExpenses: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const result = await getFinanceExpenses(token, currentShopId, {
            size: 100,
            page,
            // НЕ передаем dateFrom и dateTo - API может их не поддерживать
          });
          console.log(`💸 [Finance] Expenses page ${page} result:`, result);
          console.log(`💸 [Finance] Expenses page ${page} count:`, result.expenses?.length || 0);
          
          if (result.success && result.expenses && result.expenses.length > 0) {
            allExpenses.push(...result.expenses);
            if (result.expenses.length < 100) {
              hasMore = false;
            } else {
              page++;
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } else {
            console.log(`💸 [Finance] No more expenses on page ${page}`);
            hasMore = false;
          }
        }
        
        // Фильтруем по датам на клиенте
        console.log(`💸 [Finance] Total expenses loaded: ${allExpenses.length}`);
        const filteredExpenses = allExpenses.filter(expense => {
          const expenseDate = expense.dateCreated || expense.createdAt || expense.date || 0;
          return expenseDate >= dateFromMs && expenseDate <= dateToMs;
        });
        
        console.log(`💸 [Finance] Filtered expenses: ${filteredExpenses.length}`);
        setExpenses(filteredExpenses);
      }
    } catch (error) {
      console.error('[UzumFinance] Finance load error:', error);
    } finally {
      console.log('[UzumFinance] Data load finished');
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return formatFinanceDate(dateString);
  }

  function formatPrice(price: number): string {
    return formatCurrency(price, 'сум');
  }

  function calculateTotals() {
    // Use correct financial calculation utility
    const financials = calculateFinancials(orders);
    
    // Sanitize to prevent NaN/undefined
    const sanitized = sanitizeFinancialData(financials);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    return {
      revenue: sanitized.revenue_net, // Используем чистую выручку (после комиссии)
      totalExpenses,
      profit: sanitized.revenue_net - totalExpenses, // Прибыль = чистая выручка - расходы
      commission: sanitized.commission,
      revenue_gross: sanitized.revenue_gross, // Валовая выручка для отладки
    };
  }

  const totals = calculateTotals();

  if (loading) {
    return <SmartLoader type="finance" />;
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1C2D 0%, #1E6FDB 50%, #3FA9F5 100%)',
        padding: '24px 20px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FiDollarSign size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            {t.title}
          </h1>
        </div>

        {/* Period Selector */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
            {t.selectPeriod}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { value: 7 as const, label: t.period7 },
              { value: 30 as const, label: t.period30 },
              { value: 90 as const, label: t.period90 },
              { value: 'all' as const, label: t.periodAll },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: period === item.value ? 'white' : 'rgba(255,255,255,0.2)',
                  color: period === item.value ? '#1E6FDB' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 640 ? 'repeat(3, 1fr)' : '1fr',
          gap: '12px',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FiTrendingUp size={20} color="var(--accent-success)" />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t.revenue}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatPrice(totals.revenue)}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FiTrendingDown size={20} color="var(--accent-danger)" />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t.totalExpenses}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatPrice(totals.totalExpenses)}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FiDollarSign size={20} color={totals.profit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'} />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t.profit}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: totals.profit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {formatPrice(totals.profit)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-lg">
        {/* Tabs - Horizontal scroll without scrollbar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          backgroundColor: 'var(--bg-card)',
          padding: '6px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto',
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE/Edge */
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
        // Hide scrollbar for Chrome/Safari/Opera
        className="hide-scrollbar"
        >
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              flex: '0 0 auto',
              minWidth: '140px',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'orders' 
                ? 'linear-gradient(135deg, #1E6FDB 0%, var(--accent-success) 100%)' 
                : 'transparent',
                color: activeTab === 'orders' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              scrollSnapAlign: 'start',
              whiteSpace: 'nowrap',
            }}
          >
            {t.orders} ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            style={{
              flex: '0 0 auto',
              minWidth: '140px',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'expenses' 
                ? 'linear-gradient(135deg, #1E6FDB 0%, var(--accent-success) 100%)' 
                : 'transparent',
                color: activeTab === 'expenses' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              scrollSnapAlign: 'start',
              whiteSpace: 'nowrap',
            }}
          >
            {t.expenses} ({expenses.length})
          </button>
        </div>

        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Date Filter Info */}
        <div style={{
          backgroundColor: '#dbeafe',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '2px solid #93c5fd',
        }}>
          <FiCalendar size={24} style={{ color: '#1E6FDB' }} />
          <div style={{ fontSize: '14px', color: '#1e3a8a' }}>
            <strong>{t.dateFrom}:</strong> {new Date(dateFromMs).toLocaleDateString('ru-RU')} – <strong>{t.dateTo}:</strong> {new Date(dateToMs).toLocaleDateString('ru-RU')}
          </div>
        </div>

      {/* Content */}
      {/* Content */}
      {activeTab === 'orders' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto',
        }}>
          {orders.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '16px',
            }}>
              📭 {t.noData}
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '2px solid var(--border-primary)',
                }}>
                  <th style={{
                    padding: '14px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                  }}>
                    {t.orderNumber}
                  </th>
                  <th style={{
                    padding: '14px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    {t.date}
                  </th>
                  <th style={{
                    padding: '14px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    {t.amount}
                  </th>
                  <th style={{
                    padding: '14px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    {t.commission}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      #{order.order_number || order.id || idx + 1}
                    </td>
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      color: '#6b7280',
                    }}>
                      {formatDate(order.date || order.created_at)}
                    </td>
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'right',
                      color: 'var(--accent-success)',
                    }}>
                      {formatPrice(order.amount || 0)}
                    </td>
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'right',
                      color: 'var(--accent-success)',
                    }}>
                      {formatPrice(order.commission || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflowX: 'auto',
        }}>
          {expenses.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '16px',
            }}>
              📭 {t.noData}
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '2px solid #e5e7eb',
                }}>
                  <th style={{
                    padding: '14px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    {t.date}
                  </th>
                  <th style={{
                    padding: '14px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    {t.type}
                  </th>
                  <th style={{
                    padding: '14px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    {t.description}
                  </th>
                  <th style={{
                    padding: '14px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    {t.amount}
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      color: '#6b7280',
                    }}>
                      {formatDate(expense.date || expense.created_at)}
                    </td>
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      {expense.type || 'N/A'}
                    </td>
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      color: '#6b7280',
                    }}>
                      {expense.description || 'N/A'}
                    </td>
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'right',
                      color: 'var(--accent-danger)',
                    }}>
                      {formatPrice(expense.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
