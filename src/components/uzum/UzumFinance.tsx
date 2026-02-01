import { useState, useEffect } from 'react';
import { getShops, getFinanceOrders, getFinanceExpenses } from '../../lib/uzum-api';
import SmartLoader from '../SmartLoader';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCalendar } from 'react-icons/fi';

interface UzumFinanceProps {
  lang: 'ru' | 'uz';
  token: string;
}

export default function UzumFinance({ lang, token }: UzumFinanceProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Даты: с 1 января 2026 по сегодняшний день
  // Важно: API может не поддерживать фильтрацию по датам, загружаем всё и фильтруем на клиенте
  const dateFromMs = new Date('2026-01-01T00:00:00').getTime();
  const dateToMs = new Date().getTime();

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
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadShopAndData();
  }, [token, activeTab]);

  async function loadShopAndData() {
    setLoading(true);
    try {
      // Сначала получаем shopId
      const shopsResult = await getShops(token);
      if (!shopsResult.success || !shopsResult.shops?.length) {
        console.error('No shops found');
        setLoading(false);
        return;
      }

      const currentShopId = shopsResult.shops[0].id;

      // Затем загружаем данные с датами
      if (activeTab === 'orders') {
        const result = await getFinanceOrders(token, currentShopId, {
          size: 100,
          page: 0,
          dateFrom: dateFromMs,
          dateTo: dateToMs,
        });
        console.log('💰 [Finance] Orders:', result);
        if (result.success && result.orders) {
          setOrders(Array.isArray(result.orders) ? result.orders : []);
        }
      } else {
        // Загружаем все расходы с пагинацией БЕЗ фильтра дат
        // Затем фильтруем на клиенте
        const allExpenses: any[] = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const result = await getFinanceExpenses(token, currentShopId, {
            size: 100,
            page,
            // НЕ передаем dateFrom и dateTo - API может их не поддерживать
          });
          console.log(`💸 [Finance] Expenses page ${page}:`, result);
          
          if (result.success && result.expenses && result.expenses.length > 0) {
            allExpenses.push(...result.expenses);
            if (result.expenses.length < 100) {
              hasMore = false;
            } else {
              page++;
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } else {
            hasMore = false;
          }
        }
        
        // Фильтруем по датам на клиенте
        const filteredExpenses = allExpenses.filter(expense => {
          const expenseDate = expense.dateCreated || expense.createdAt || expense.date || 0;
          return expenseDate >= dateFromMs && expenseDate <= dateToMs;
        });
        
        console.log(`💸 [Finance] Total expenses loaded: ${allExpenses.length}, filtered: ${filteredExpenses.length}`);
        setExpenses(filteredExpenses);
      }
    } catch (error) {
      console.error('Finance load error:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
  }

  function calculateTotals() {
    const revenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = revenue - totalExpenses;
    return { revenue, totalExpenses, profit };
  }

  const totals = calculateTotals();

  if (loading) {
    return <SmartLoader type="finance" />;
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
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

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 640 ? 'repeat(3, 1fr)' : '1fr',
          gap: '12px',
        }}>
          <div style={{
            background: 'rgba(76,175,80, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(76,175,80, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FiTrendingUp size={20} />
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {t.revenue}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700' }}>
              {formatPrice(totals.revenue)}
            </div>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FiTrendingDown size={20} />
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {t.totalExpenses}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700' }}>
              {formatPrice(totals.totalExpenses)}
            </div>
          </div>

          <div style={{
            background: totals.profit >= 0 
              ? 'rgba(30,111,219, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: totals.profit >= 0 
              ? '1px solid rgba(30,111,219, 0.3)' 
              : '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FiDollarSign size={20} />
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {t.profit}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700' }}>
              {formatPrice(totals.profit)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          backgroundColor: 'white',
          padding: '6px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'orders' 
                ? 'linear-gradient(135deg, #1E6FDB 0%, #4CAF50 100%)' 
                : 'transparent',
              color: activeTab === 'orders' ? 'white' : '#6b7280',
              transition: 'all 0.2s',
            }}
          >
            {t.orders} ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === 'expenses' 
                ? 'linear-gradient(135deg, #1E6FDB 0%, #4CAF50 100%)' 
                : 'transparent',
              color: activeTab === 'expenses' ? 'white' : '#6b7280',
              transition: 'all 0.2s',
            }}
          >
            {t.expenses} ({expenses.length})
          </button>
        </div>

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
            <strong>{t.dateFrom}:</strong> 01.01.2026 – <strong>{t.dateTo}:</strong> {new Date().toLocaleDateString('ru-RU')}
          </div>
        </div>

      {/* Content */}
      {/* Content */}
      {activeTab === 'orders' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflowX: 'auto',
        }}>
          {orders.length === 0 ? (
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
                      color: '#4CAF50',
                    }}>
                      {formatPrice(order.amount || 0)}
                    </td>
                    <td style={{
                      padding: '14px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'right',
                      color: '#ef4444',
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
                      color: '#ef4444',
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
