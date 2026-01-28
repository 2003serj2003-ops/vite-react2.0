import { useState, useEffect } from 'react';
import { getShops, getFbsOrders, confirmFbsOrder, cancelFbsOrder } from '../../lib/uzum-api';

interface UzumOrdersProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export default function UzumOrders({ lang, token, onNavigateBack, onNavigateHome }: UzumOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const T = {
    ru: {
      title: 'Заказы',
      back: 'Назад',
      loading: 'Загрузка заказов...',
      noOrders: 'Заказы не найдены',
      all: 'Все',
      pending: 'Ожидают',
      confirmed: 'Подтверждены',
      cancelled: 'Отменены',
      orderNumber: 'Заказ №',
      status: 'Статус',
      date: 'Дата',
      total: 'Сумма',
      items: 'Товары',
      confirm: 'Подтвердить',
      cancel: 'Отменить',
      close: 'Закрыть',
      details: 'Детали заказа',
      customer: 'Покупатель',
      phone: 'Телефон',
      address: 'Адрес',
      confirmSuccess: 'Заказ подтвержден',
      cancelSuccess: 'Заказ отменен',
      error: 'Ошибка',
    },
    uz: {
      title: 'Buyurtmalar',
      back: 'Orqaga',
      loading: 'Buyurtmalar yuklanmoqda...',
      noOrders: 'Buyurtmalar topilmadi',
      all: 'Hammasi',
      pending: 'Kutilmoqda',
      confirmed: 'Tasdiqlangan',
      cancelled: 'Bekor qilingan',
      orderNumber: 'Buyurtma №',
      status: 'Holati',
      date: 'Sana',
      total: 'Summa',
      items: 'Mahsulotlar',
      confirm: 'Tasdiqlash',
      cancel: 'Bekor qilish',
      close: 'Yopish',
      details: 'Buyurtma tafsilotlari',
      customer: 'Xaridor',
      phone: 'Telefon',
      address: 'Manzil',
      confirmSuccess: 'Buyurtma tasdiqlandi',
      cancelSuccess: 'Buyurtma bekor qilindi',
      error: 'Xatolik',
    },
  };

  const t = T[lang];

  const statusOptions = [
    { value: 'all', label: t.all },
    { value: 'pending', label: t.pending },
    { value: 'confirmed', label: t.confirmed },
    { value: 'cancelled', label: t.cancelled },
  ];

  useEffect(() => {
    loadOrders();
  }, [token]);

  useEffect(() => {
    // Filter orders by status
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o: any) => o.status === statusFilter));
    }
  }, [statusFilter, orders]);

  async function loadOrders() {
    setLoading(true);
    try {
      // Сначала получаем shopId
      const shopsResult = await getShops(token);
      if (!shopsResult.success || !shopsResult.shops?.length) {
        console.error('No shops found');
        setLoading(false);
        return;
      }

      const shopId = shopsResult.shops[0].id;

      // Затем загружаем заказы
      const result = await getFbsOrders(token, shopId, { size: 100, page: 0 });
      console.log('📋 [Orders] FBS Orders:', result);
      if (result.success && result.orders) {
        const ordersList = Array.isArray(result.orders) ? result.orders : [];
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      }
    } catch (error) {
      console.error('Orders load error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmOrder(orderId: string | number) {
    setActionLoading(true);
    try {
      const result = await confirmFbsOrder(token, orderId);
      if (result.success) {
        await loadOrders();
        setSelectedOrder(null);
        alert(t.confirmSuccess);
      } else {
        alert(t.error + ': ' + result.error);
      }
    } catch (error: any) {
      alert(t.error + ': ' + error.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelOrder(orderId: string | number) {
    setActionLoading(true);
    try {
      const result = await cancelFbsOrder(token, orderId);
      if (result.success) {
        await loadOrders();
        setSelectedOrder(null);
        alert(t.cancelSuccess);
      } else {
        alert(t.error + ': ' + result.error);
      }
    } catch (error: any) {
      alert(t.error + ': ' + error.message);
    } finally {
      setActionLoading(false);
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

  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#22c55e';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  function getStatusBg(status: string): string {
    switch (status) {
      case 'pending':
        return '#fef3c7';
      case 'confirmed':
        return '#dcfce7';
      case 'cancelled':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#22c55e',
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
    );
  }

  return (
    <div className="list">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button
            onClick={onNavigateBack}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            ← {t.back}
          </button>
          <button
            onClick={onNavigateHome}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            🏠
          </button>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#111',
          }}>
            📦 {t.title}
          </div>
        </div>
        <div style={{
          padding: '6px 12px',
          backgroundColor: '#22c55e',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          {filteredOrders.length}
        </div>
      </div>

      {/* Status Filter */}
      <div className="cardCream" style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={statusFilter === option.value ? "btnPrimary" : "split"}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="cardCream" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#9ca3af',
          fontSize: '16px',
        }}>
          📭 {t.noOrders}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {filteredOrders.map((order: any) => (
            <div
              key={order.id || order.order_number}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '2px solid transparent',
              }}
              onClick={() => setSelectedOrder(order)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = '#22c55e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    color: '#111827',
                  }}>
                    {t.orderNumber}{order.order_number || order.id}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}>
                    {t.date}: {formatDate(order.created_at || order.date)}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    backgroundColor: getStatusBg(order.status),
                    color: getStatusColor(order.status),
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    {order.status === 'pending' && t.pending}
                    {order.status === 'confirmed' && t.confirmed}
                    {order.status === 'cancelled' && t.cancelled}
                    {!['pending', 'confirmed', 'cancelled'].includes(order.status) && order.status}
                  </div>
                </div>
                <div style={{
                  textAlign: 'right',
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#22c55e',
                    marginBottom: '4px',
                  }}>
                    {order.total ? formatPrice(order.total) : 'N/A'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    {order.items?.length || 0} {t.items}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
              }}>
                {t.details}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {t.close}
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              marginBottom: '24px',
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}>
                  {t.orderNumber}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {selectedOrder.order_number || selectedOrder.id}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}>
                  {t.status}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: getStatusBg(selectedOrder.status),
                  color: getStatusColor(selectedOrder.status),
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  {selectedOrder.status}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}>
                  {t.total}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#22c55e',
                }}>
                  {selectedOrder.total ? formatPrice(selectedOrder.total) : 'N/A'}
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}>
                    {t.items} ({selectedOrder.items.length})
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {item.title || item.name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {item.quantity || 1} шт. × {formatPrice(item.price || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedOrder.status === 'pending' && (
              <div style={{
                display: 'flex',
                gap: '12px',
              }}>
                <button
                  onClick={() => handleConfirmOrder(selectedOrder.id || selectedOrder.order_number)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) {
                      e.currentTarget.style.backgroundColor = '#16a34a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#22c55e';
                  }}
                >
                  ✓ {t.confirm}
                </button>
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id || selectedOrder.order_number)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  ✕ {t.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
