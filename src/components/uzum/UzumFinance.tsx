import { useState, useEffect } from 'react';
import { getFinanceOrders, getFinanceExpenses } from '../../lib/uzum-api';

interface UzumFinanceProps {
  lang: 'ru' | 'uz';
  token: string;
  onBack: () => void;
}

export default function UzumFinance({ lang, token, onBack }: UzumFinanceProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
    loadData();
  }, [token, activeTab, dateFrom, dateTo]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      if (activeTab === 'orders') {
        const result = await getFinanceOrders(token, params);
        if (result.success && result.orders) {
          setOrders(Array.isArray(result.orders) ? result.orders : []);
        }
      } else {
        const result = await getFinanceExpenses(token, params);
        if (result.success && result.expenses) {
          setExpenses(Array.isArray(result.expenses) ? result.expenses : []);
        }
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

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            ← {t.back}
          </button>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: 0,
            color: '#111827',
          }}>
            💰 {t.title}
          </h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '2px solid #dcfce7',
        }}>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '8px',
            fontWeight: '600',
          }}>
            💰 {t.revenue}
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#22c55e',
          }}>
            {formatPrice(totals.revenue)}
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '2px solid #fee2e2',
        }}>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '8px',
            fontWeight: '600',
          }}>
            📉 {t.totalExpenses}
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#ef4444',
          }}>
            {formatPrice(totals.totalExpenses)}
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '2px solid #dbeafe',
        }}>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '8px',
            fontWeight: '600',
          }}>
            📈 {t.profit}
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: totals.profit >= 0 ? '#3b82f6' : '#ef4444',
          }}>
            {formatPrice(totals.profit)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'orders' ? '#f59e0b' : 'transparent'}`,
            color: activeTab === 'orders' ? '#f59e0b' : '#6b7280',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s',
          }}
        >
          📊 {t.orders}
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'expenses' ? '#f59e0b' : 'transparent'}`,
            color: activeTab === 'expenses' ? '#f59e0b' : '#6b7280',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s',
          }}
        >
          📉 {t.expenses}
        </button>
      </div>

      {/* Date Filter */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '6px',
          }}>
            {t.dateFrom}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '6px',
          }}>
            {t.dateTo}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => {
            setDateFrom('');
            setDateTo('');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Сбросить
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          gap: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTopColor: '#f59e0b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ fontSize: '16px', color: '#6b7280' }}>
            {t.loading}
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <>
          {activeTab === 'orders' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
                <div style={{ overflowX: 'auto' }}>
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
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.orderNumber}
                        </th>
                        <th style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.date}
                        </th>
                        <th style={{
                          padding: '16px',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.amount}
                        </th>
                        <th style={{
                          padding: '16px',
                          textAlign: 'right',
                          fontSize: '14px',
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
                            padding: '16px',
                            fontSize: '14px',
                            fontWeight: '600',
                          }}>
                            #{order.order_number || order.id || idx + 1}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: '#6b7280',
                          }}>
                            {formatDate(order.date || order.created_at)}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right',
                            color: '#22c55e',
                          }}>
                            {formatPrice(order.amount || 0)}
                          </td>
                          <td style={{
                            padding: '16px',
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
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
                <div style={{ overflowX: 'auto' }}>
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
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.date}
                        </th>
                        <th style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.type}
                        </th>
                        <th style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.description}
                        </th>
                        <th style={{
                          padding: '16px',
                          textAlign: 'right',
                          fontSize: '14px',
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
                            padding: '16px',
                            fontSize: '14px',
                            color: '#6b7280',
                          }}>
                            {formatDate(expense.date || expense.created_at)}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            fontWeight: '600',
                          }}>
                            {expense.type || 'N/A'}
                          </td>
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: '#6b7280',
                          }}>
                            {expense.description || 'N/A'}
                          </td>
                          <td style={{
                            padding: '16px',
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
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
