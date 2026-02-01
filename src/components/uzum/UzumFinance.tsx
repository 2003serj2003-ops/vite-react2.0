import { useState, useEffect } from 'react';
import { getShops, getFinanceOrders, getFinanceExpenses } from '../../lib/uzum-api';

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

  return (
    <div className="uzum-container">
      {/* Summary Cards */}
      <div className="uzum-stat-grid">
        <div className="uzum-stat-card">
          <div className="uzum-stat-label">
            💰 {t.revenue}
          </div>
          <div className="uzum-stat-value" style={{ color: '#22c55e' }}>
            {formatPrice(totals.revenue)}
          </div>
        </div>

        <div className="uzum-stat-card">
          <div className="uzum-stat-label">
            📉 {t.totalExpenses}
          </div>
          <div className="uzum-stat-value" style={{ color: '#ef4444' }}>
            {formatPrice(totals.totalExpenses)}
          </div>
        </div>

        <div className="uzum-stat-card">
          <div className="uzum-stat-label">
            📈 {t.profit}
          </div>
          <div className="uzum-stat-value" style={{ color: totals.profit >= 0 ? '#3b82f6' : '#ef4444' }}>
            {formatPrice(totals.profit)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="uzum-tabs">
        <button
          className={`uzum-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📊 {t.orders}
        </button>
        <button
          className={`uzum-tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          📉 {t.expenses}
        </button>
      </div>

      {/* Info message about date filter */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#0369a1',
      }}>
        📅 Фильтр: с 1 января 2026 по текущий день
      </div>

      {/* Content */}
      {loading ? (
        <div className="uzum-loader-container">
          <div className="uzum-loader" />
          <div style={{ fontSize: '16px', color: '#6b7280' }}>
            {t.loading}
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'orders' && (
            <div className="uzum-table-container">
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
                        padding: window.innerWidth > 640 ? '16px' : '12px',
                        textAlign: 'left',
                        fontSize: window.innerWidth > 640 ? '14px' : '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}>
                        {t.orderNumber}
                      </th>
                      <th style={{
                        padding: window.innerWidth > 640 ? '16px' : '12px',
                        textAlign: 'left',
                        fontSize: window.innerWidth > 640 ? '14px' : '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}>
                        {t.date}
                      </th>
                      <th style={{
                        padding: window.innerWidth > 640 ? '16px' : '12px',
                        textAlign: 'right',
                        fontSize: window.innerWidth > 640 ? '14px' : '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}>
                        {t.amount}
                      </th>
                      {window.innerWidth > 640 && (
                        <th style={{
                          padding: '16px',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.commission}
                        </th>
                      )}
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
                          padding: window.innerWidth > 640 ? '16px' : '12px',
                          fontSize: window.innerWidth > 640 ? '14px' : '12px',
                          fontWeight: '600',
                        }}>
                          #{order.order_number || order.id || idx + 1}
                        </td>
                        <td style={{
                          padding: window.innerWidth > 640 ? '16px' : '12px',
                          fontSize: window.innerWidth > 640 ? '14px' : '12px',
                          color: '#6b7280',
                        }}>
                          {formatDate(order.date || order.created_at)}
                        </td>
                        <td style={{
                          padding: window.innerWidth > 640 ? '16px' : '12px',
                          fontSize: window.innerWidth > 640 ? '14px' : '12px',
                          fontWeight: '600',
                          textAlign: 'right',
                          color: '#22c55e',
                        }}>
                          {formatPrice(order.amount || 0)}
                        </td>
                        {window.innerWidth > 640 && (
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right',
                            color: '#ef4444',
                          }}>
                            {formatPrice(order.commission || 0)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="uzum-table-container">
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
                        padding: window.innerWidth > 640 ? '16px' : '12px',
                        textAlign: 'left',
                        fontSize: window.innerWidth > 640 ? '14px' : '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}>
                        {t.date}
                      </th>
                      {window.innerWidth > 640 && (
                        <th style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}>
                          {t.type}
                        </th>
                      )}
                      <th style={{
                        padding: window.innerWidth > 640 ? '16px' : '12px',
                        textAlign: 'left',
                        fontSize: window.innerWidth > 640 ? '14px' : '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}>
                        {t.description}
                      </th>
                      <th style={{
                        padding: window.innerWidth > 640 ? '16px' : '12px',
                        textAlign: 'right',
                        fontSize: window.innerWidth > 640 ? '14px' : '12px',
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
                          padding: window.innerWidth > 640 ? '16px' : '12px',
                          fontSize: window.innerWidth > 640 ? '14px' : '12px',
                          color: '#6b7280',
                        }}>
                          {formatDate(expense.date || expense.created_at)}
                        </td>
                        {window.innerWidth > 640 && (
                          <td style={{
                            padding: '16px',
                            fontSize: '14px',
                            fontWeight: '600',
                          }}>
                            {expense.type || 'N/A'}
                          </td>
                        )}
                        <td style={{
                          padding: window.innerWidth > 640 ? '16px' : '12px',
                          fontSize: window.innerWidth > 640 ? '14px' : '12px',
                          color: '#6b7280',
                        }}>
                          {expense.description || 'N/A'}
                        </td>
                        <td style={{
                          padding: window.innerWidth > 640 ? '16px' : '12px',
                          fontSize: window.innerWidth > 640 ? '14px' : '12px',
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
        </>
      )}
    </div>
  );
}
