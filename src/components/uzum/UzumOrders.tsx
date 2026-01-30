import { useState, useEffect } from 'react';
import { getShops, getFbsOrders, cancelFbsOrder, getFbsOrderLabel, getFbsReturnReasons } from '../../lib/uzum-api';

interface UzumOrdersProps {
  lang: 'ru' | 'uz';
  token: string;
}

export default function UzumOrders({ lang, token }: UzumOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [returnReasons, setReturnReasons] = useState<any[]>([]);

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
      getLabel: 'Получить этикетку',
      labelSize: 'Размер этикетки',
      large: 'Большая (58x40мм)',
      big: 'Стандартная (43x25мм)',
      downloading: 'Скачивание...',
      returnReason: 'Причина возврата',
      cancelOrder: 'Отменить заказ',
      confirmCancel: 'Вы уверены?',
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
      getLabel: 'Yorliqni olish',
      labelSize: 'Yorliq o\'lchami',
      large: 'Katta (58x40mm)',
      big: 'Standart (43x25mm)',
      downloading: 'Yuklanmoqda...',
      returnReason: 'Qaytarish sababi',
      cancelOrder: 'Buyurtmani bekor qilish',
      confirmCancel: 'Ishonchingiz komilmi?',
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

  async function handleCancelOrder(orderId: string | number) {
    if (!window.confirm(t.confirmCancel)) return;
    
    setActionLoading(true);
    try {
      const result = await cancelFbsOrder(token, orderId);
      if (result.success) {
        await loadOrders();
        setExpandedOrderId(null);
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

  async function handleDownloadLabel(orderId: string | number, size: 'LARGE' | 'BIG') {
    setActionLoading(true);
    try {
      const result = await getFbsOrderLabel(token, orderId, size);
      if (result.success && result.label) {
        // Decode base64 and create blob
        const byteCharacters = atob(result.label);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `label-${orderId}-${size}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(t.error + ': ' + result.error);
      }
    } catch (error: any) {
      alert(t.error + ': ' + error.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function loadReturnReasons() {
    if (returnReasons.length > 0) return;
    try {
      const result = await getFbsReturnReasons(token);
      if (result.success && result.reasons) {
        setReturnReasons(result.reasons);
      }
    } catch (error) {
      console.error('Failed to load return reasons:', error);
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
            const isExpanded = expandedOrderId === (order.id || order.order_number);
            const canCancel = ['CREATED', 'PACKING'].includes(order.status);
            
            return (
              <div
                key={order.id || order.order_number}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  border: isExpanded ? '2px solid #7c3aed' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
              {/* Order Header - Always Visible */}
              <div
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: isExpanded ? '#faf5ff' : 'white',
                }}
                onClick={() => {
                  setExpandedOrderId(isExpanded ? null : (order.id || order.order_number));
                  if (!isExpanded && order.status === 'RETURNED') {
                    loadReturnReasons();
                  }
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    marginBottom: '6px',
                    color: '#111827',
                  }}>
                    {t.orderNumber}{order.order_number || order.id}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '6px',
                  }}>
                    {t.date}: {formatDate(order.created_at || order.date)}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    backgroundColor: getStatusBg(order.status),
                    color: getStatusColor(order.status),
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '6px',
                }}>
                  {order.totalSum && (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#7c3aed',
                    }}>
                      {formatPrice(order.totalSum)}
                    </div>
                  )}
                  <div style={{
                    fontSize: '24px',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid #e5e7eb',
                  backgroundColor: '#fafafa',
                }}>
                  {/* Order Items */}
                  {order.skus && order.skus.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#374151' }}>
                        {t.items}:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.skus.map((sku: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px',
                              backgroundColor: 'white',
                              borderRadius: '8px',
                              fontSize: '13px',
                            }}
                          >
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {sku.title || sku.name || 'N/A'}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '12px' }}>
                              SKU: {sku.sku} | {t.items}: {sku.quantity || 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Info */}
                  {(order.customer || order.customerName) && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {t.customer}:
                      </h4>
                      <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '8px', fontSize: '13px' }}>
                        <div style={{ marginBottom: '4px' }}>{order.customerName || order.customer}</div>
                        {order.customerPhone && (
                          <div style={{ color: '#6b7280' }}>{t.phone}: {order.customerPhone}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {order.deliveryAddress && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {t.address}:
                      </h4>
                      <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '8px', fontSize: '13px', color: '#6b7280' }}>
                        {order.deliveryAddress}
                      </div>
                    </div>
                  )}

                  {/* Return Reason */}
                  {order.status === 'RETURNED' && order.returnReasonId && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                        {t.returnReason}:
                      </h4>
                      <div style={{ padding: '10px', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>
                        {returnReasons.find((r: any) => r.id === order.returnReasonId)?.title || `ID: ${order.returnReasonId}`}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Label Download */}
                    <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadLabel(order.id || order.order_number, 'LARGE');
                        }}
                        disabled={actionLoading}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: actionLoading ? '#d1d5db' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {actionLoading ? t.downloading : `${t.getLabel} (58x40)`}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadLabel(order.id || order.order_number, 'BIG');
                        }}
                        disabled={actionLoading}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: actionLoading ? '#d1d5db' : '#06b6d4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {actionLoading ? t.downloading : `${t.getLabel} (43x25)`}
                      </button>
                    </div>

                    {/* Cancel Order */}
                    {canCancel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order.id || order.order_number);
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: actionLoading ? '#d1d5db' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {t.cancelOrder}
                      </button>
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
