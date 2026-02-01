import { useState, useEffect } from 'react';
import { getShops, getFbsOrders, confirmFbsOrder, cancelFbsOrder, getFbsOrderLabel } from '../../lib/uzum-api';

interface UzumOrdersProps {
  lang: 'ru' | 'uz';
  token: string;
}

export default function UzumOrders({ lang, token }: UzumOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [printingLabel, setPrintingLabel] = useState(false);

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
      created: 'Созданы',
      packing: 'Упаковка',
      pendingDelivery: 'Ожидает доставки',
      delivering: 'Доставляется',
      delivered: 'Доставлен',
      acceptedAtDp: 'Принят в пункте',
      deliveredToDp: 'Доставлен в пункт',
      completed: 'Завершен',
      canceled: 'Отменен',
      pendingCancellation: 'Ожидает отмены',
      returned: 'Возврат',
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
      printLabel: 'Печать этикетки',
      printing: 'Печать...',
      labelSent: 'Этикетка отправлена в Telegram',
      labelError: 'Ошибка при получении этикетки',
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
      created: 'Yaratilgan',
      packing: 'Qadoqlanmoqda',
      pendingDelivery: 'Yetkazib berishni kutmoqda',
      delivering: 'Yetkazilmoqda',
      delivered: 'Yetkazildi',
      acceptedAtDp: 'Punktda qabul qilindi',
      deliveredToDp: 'Punktga yetkazildi',
      completed: 'Yakunlandi',
      canceled: 'Bekor qilindi',
      pendingCancellation: 'Bekor qilishni kutmoqda',
      returned: 'Qaytarildi',
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
      printLabel: 'Yorliq chop etish',
      printing: 'Chop etilmoqda...',
      labelSent: 'Yorliq Telegramga yuborildi',
      labelError: 'Yorliqni olishda xatolik',
    },
  };

  const t = T[lang];

  // Функция для получения названия статуса
  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'CREATED': t.created,
      'PACKING': t.packing,
      'PENDING_DELIVERY': t.pendingDelivery,
      'DELIVERING': t.delivering,
      'DELIVERED': t.delivered,
      'ACCEPTED_AT_DP': t.acceptedAtDp,
      'DELIVERED_TO_CUSTOMER_DELIVERY_POINT': t.deliveredToDp,
      'COMPLETED': t.completed,
      'CANCELED': t.canceled,
      'PENDING_CANCELLATION': t.pendingCancellation,
      'RETURNED': t.returned,
    };
    return statusMap[status] || status;
  };

  const statusOptions = [
    { value: 'all', label: t.all },
    { value: 'CREATED', label: t.created },
    { value: 'PACKING', label: t.packing },
    { value: 'PENDING_DELIVERY', label: t.pendingDelivery },
    { value: 'DELIVERING', label: t.delivering },
    { value: 'DELIVERED', label: t.delivered },
    { value: 'ACCEPTED_AT_DP', label: t.acceptedAtDp },
    { value: 'DELIVERED_TO_CUSTOMER_DELIVERY_POINT', label: t.deliveredToDp },
    { value: 'COMPLETED', label: t.completed },
    { value: 'CANCELED', label: t.canceled },
    { value: 'PENDING_CANCELLATION', label: t.pendingCancellation },
    { value: 'RETURNED', label: t.returned },
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

  // Функция для подсчета заказов по статусу
  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter((o: any) => o.status === status).length;
  };

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

      // API требует обязательный параметр status
      // Загружаем заказы последовательно с задержками чтобы избежать rate limit
      const statuses = [
        'CREATED', 'PACKING', 'PENDING_DELIVERY', 
        'DELIVERING', 'DELIVERED', 'ACCEPTED_AT_DP',
        'DELIVERED_TO_CUSTOMER_DELIVERY_POINT',
        'COMPLETED', 'CANCELED', 'PENDING_CANCELLATION', 'RETURNED'
      ];

      let allOrders: any[] = [];
      
      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const result = await getFbsOrders(token, shopId, { status });
        console.log(`📋 [Orders] Status ${status}:`, result.orders?.length || 0, 'orders');
        
        if (result.success && result.orders) {
          allOrders = allOrders.concat(result.orders);
        }
        
        // Задержка 200ms между запросами
        if (i < statuses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log('📋 [Orders] Total FBS Orders:', allOrders.length);
      if (allOrders.length > 0) {
        console.log('📋 [Orders] Sample order:', allOrders[0]);
      }
      setOrders(allOrders);
      setFilteredOrders(allOrders);
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

  // Функция печати этикетки и отправки в Telegram
  async function handlePrintLabel(orderId: string | number) {
    setPrintingLabel(true);
    try {
      const result = await getFbsOrderLabel(token, orderId);
      
      if (result.success && result.label) {
        // Отправка этикетки в Telegram
        if (window.Telegram?.WebApp) {
          // Уведомление об успехе
          alert(t.labelSent);
          
          // Открываем чат с ботом для отправки данных
          // Пользователь сможет отправить данные вручную
          const labelData = JSON.stringify({
            action: 'print_label',
            orderId: orderId,
            label: result.label,
          }, null, 2);
          
          // Копируем в буфер обмена
          navigator.clipboard.writeText(labelData).catch(() => {
            console.log('Clipboard not available');
          });
        } else {
          // Если Telegram недоступен, скачиваем локально
          const blob = new Blob([JSON.stringify(result.label, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `label-${orderId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        alert(t.labelError + ': ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Print label error:', error);
      alert(t.labelError);
    } finally {
      setPrintingLabel(false);
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
      {/* Status Filter */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          minWidth: 'max-content',
        }}>
          {statusOptions.map((option) => {
            const count = getStatusCount(option.value);
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                style={{
                  padding: '12px 18px',
                  backgroundColor: isActive ? '#22c55e' : '#f9fafb',
                  color: isActive ? 'white' : '#374151',
                  border: isActive ? 'none' : '2px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 2px 4px rgba(34, 197, 94, 0.3)' : 'none',
                }}
              >
                <span>{option.label}</span>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  minWidth: '24px',
                  textAlign: 'center',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
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
          gap: '12px',
        }}>
          {filteredOrders.map((order: any) => {
            const orderId = order.id || order.order_number;
            const isExpanded = expandedOrderId === orderId;
            
            return (
              <div
                key={orderId}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  border: isExpanded ? '2px solid #22c55e' : '2px solid transparent',
                  overflow: 'hidden',
                }}
              >
                {/* Order Header - Always Visible */}
                <div
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => setExpandedOrderId(isExpanded ? null : orderId)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '8px',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span>{t.orderNumber}{orderId}</span>
                        <span style={{
                          fontSize: '16px',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}>
                          ▼
                        </span>
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
                        {getStatusLabel(order.status)}
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

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div style={{
                    borderTop: '2px solid #f3f4f6',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                  }}>
                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          marginBottom: '12px',
                          color: '#111827',
                        }}>
                          {t.items} ({order.items.length})
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}>
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                              }}
                            >
                              <div style={{ 
                                fontWeight: '600', 
                                marginBottom: '4px',
                                color: '#111827',
                              }}>
                                {item.title || item.name || 'N/A'}
                              </div>
                              <div style={{ 
                                fontSize: '14px', 
                                color: '#6b7280',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}>
                                <span>{item.quantity || 1} шт.</span>
                                <span style={{ fontWeight: '600', color: '#22c55e' }}>
                                  {formatPrice(item.price || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Info */}
                    {(order.customer || order.phone || order.address) && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          marginBottom: '12px',
                          color: '#111827',
                        }}>
                          {t.customer}
                        </div>
                        <div style={{
                          padding: '12px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}>
                          {order.customer && (
                            <div style={{ marginBottom: '8px', color: '#111827' }}>
                              👤 {order.customer}
                            </div>
                          )}
                          {order.phone && (
                            <div style={{ marginBottom: '8px', color: '#111827' }}>
                              📞 {order.phone}
                            </div>
                          )}
                          {order.address && (
                            <div style={{ color: '#111827' }}>
                              📍 {order.address}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}>
                      {/* Print Label Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintLabel(orderId);
                        }}
                        disabled={printingLabel}
                        style={{
                          flex: 1,
                          minWidth: '140px',
                          padding: '14px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: printingLabel ? 'not-allowed' : 'pointer',
                          opacity: printingLabel ? 0.6 : 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          if (!printingLabel) {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b82f6';
                        }}
                      >
                        <span>🖨️</span>
                        <span>{printingLabel ? t.printing : t.printLabel}</span>
                      </button>

                      {/* Confirm Button */}
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmOrder(orderId);
                            }}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              padding: '14px',
                              backgroundColor: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '15px',
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(orderId);
                            }}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              padding: '14px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '15px',
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
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
