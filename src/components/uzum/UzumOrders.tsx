import { useState, useEffect } from 'react';
import { getShops, getFbsOrders, getFbsOrder, cancelFbsOrder, getFbsOrderLabel } from '../../lib/uzum-api';
import CoolLoader from '../CoolLoader';

interface UzumOrdersProps {
  lang: 'ru' | 'uz';
  token: string;
}

export default function UzumOrders({ lang, token }: UzumOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | number | null>(null);
  const [orderDetails, setOrderDetails] = useState<{[key: string]: any}>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [printingLabel, setPrintingLabel] = useState(false);
  const [labelSize, setLabelSize] = useState<{[key: string]: 'LARGE' | 'BIG'}>({});

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
      labelSizeLarge: 'LARGE (58x40mm)',
      labelSizeBig: 'BIG (43x25mm)',
      selectSize: 'Размер',
      canceling: 'Отмена...',
      cancelOrder: 'Отменить заказ',
      cancelConfirm: 'Вы уверены, что хотите отменить этот заказ?',
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
      labelSizeLarge: 'LARGE (58x40mm)',
      labelSizeBig: 'BIG (43x25mm)',
      selectSize: 'O\'lchami',
      canceling: 'Bekor qilinmoqda...',
      cancelOrder: 'Buyurtmani bekor qilish',
      cancelConfirm: 'Siz ushbu buyurtmani bekor qilishni xohlaysizmi?',
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
  // Функция для загрузки детальной информации о заказе
  async function loadOrderDetails(orderId: string | number) {
    if (orderDetails[orderId]) {
      // Уже загружено
      return;
    }

    try {
      console.log('🔍 Loading order details for:', orderId);
      const result = await getFbsOrder(token, orderId);
      console.log('📦 Order details result:', result);
      
      if (result.success && result.order) {
        setOrderDetails(prev => ({
          ...prev,
          [orderId]: result.order,
        }));
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  }

  // Обработчик раскрытия заказа
  function handleToggleOrder(orderId: string | number) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      loadOrderDetails(orderId);
    }
  }

  async function handlePrintLabel(orderId: string | number, size: 'LARGE' | 'BIG' = 'LARGE') {
    setPrintingLabel(true);
    try {
      // Добавляем параметр size в запрос
      const result = await getFbsOrderLabel(token, orderId, size);
      
      if (result.success && (result.label || result.labelPdf || result.labelUrl)) {
        // Отправка этикетки в Telegram через бота
        if (window.Telegram?.WebApp) {
          try {
            const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
            const chatId = tgUser?.id;
            
            if (!chatId) {
              console.error('Chat ID not available');
              alert('Не удалось получить ID пользователя Telegram');
              return;
            }

            let blob: Blob;
            let fileName: string;
            let mimeType: string;

            // Определяем формат этикетки
            if (result.labelPdf) {
              // Это base64 PDF
              const pdfBase64 = result.labelPdf.replace(/^data:application\/pdf;base64,/, '');
              const binaryString = atob(pdfBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              blob = new Blob([bytes], { type: 'application/pdf' });
              fileName = `uzum-label-${orderId}.pdf`;
              mimeType = 'application/pdf';
            } else if (result.labelUrl) {
              // Это URL - отправим как текст с ссылкой
              const message = `📋 Этикетка для заказа #${orderId}\n\n🔗 Ссылка на этикетку:\n${result.labelUrl}`;
              
              const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
              
              if (BOT_TOKEN) {
                const response = await fetch(
                  `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: message,
                      parse_mode: 'HTML',
                    }),
                  }
                );

                const data = await response.json();
                
                if (data.ok) {
                  alert('✅ Ссылка на этикетку отправлена в Telegram!');
                  window.Telegram.WebApp.close();
                  return;
                } else {
                  throw new Error(data.description || 'Failed to send message');
                }
              }
              
              // Fallback: открываем URL
              window.open(result.labelUrl, '_blank');
              return;
            } else {
              // Это JSON данные - конвертируем в PDF-подобный текстовый формат
              const labelText = `
╔═══════════════════════════════════════╗
║     UZUM MARKET - ЭТИКЕТКА ЗАКАЗА     ║
╚═══════════════════════════════════════╝

📦 Заказ №: ${orderId}
📅 Дата: ${new Date().toLocaleString('ru-RU')}
🔖 Размер этикетки: ${size}

─────────────────────────────────────────

${JSON.stringify(result.label, null, 2)}

─────────────────────────────────────────
🔗 Uzum Market Seller
              `;
              
              blob = new Blob([labelText], { type: 'text/plain; charset=utf-8' });
              fileName = `uzum-label-${orderId}.txt`;
              mimeType = 'text/plain';
            }

            // Отправляем файл через Telegram Bot
            const formData = new FormData();
            formData.append('chat_id', chatId.toString());
            formData.append('document', blob, fileName);
            formData.append('caption', `📋 Этикетка для заказа #${orderId}\n\n🔗 Uzum Market`);

            const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
            
            if (BOT_TOKEN) {
              const response = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
                {
                  method: 'POST',
                  body: formData,
                }
              );

              const data = await response.json();
              
              if (data.ok) {
                alert('✅ Этикетка отправлена в Telegram!');
                window.Telegram.WebApp.close();
              } else {
                console.error('Telegram API error:', data);
                throw new Error(data.description || 'Failed to send document');
              }
            } else {
              // Альтернативный метод: отправка через Supabase Edge Function
              // Для PDF отправляем как base64
              const fileContent = mimeType === 'application/pdf' 
                ? await blobToBase64(blob)
                : await blob.text();
              
              const response = await fetch('/api/send-telegram-file', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chatId,
                  fileName,
                  fileContent,
                  mimeType,
                  caption: `📋 Этикетка для заказа #${orderId}\n\n🔗 Uzum Market`,
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to send file via backend');
              }

              alert('✅ Этикетка отправлена в Telegram!');
              window.Telegram.WebApp.close();
            }
          } catch (error) {
            console.error('Error sending label to Telegram:', error);
            
            // Fallback: скачиваем локально
            let downloadBlob: Blob;
            let downloadFileName: string;
            
            if (result.labelPdf) {
              const pdfBase64 = result.labelPdf.replace(/^data:application\/pdf;base64,/, '');
              const binaryString = atob(pdfBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              downloadBlob = new Blob([bytes], { type: 'application/pdf' });
              downloadFileName = `uzum-label-${orderId}.pdf`;
            } else if (result.labelUrl) {
              window.open(result.labelUrl, '_blank');
              return;
            } else {
              downloadBlob = new Blob([JSON.stringify(result.label, null, 2)], { type: 'application/json' });
              downloadFileName = `uzum-label-${orderId}.json`;
            }
            
            const url = URL.createObjectURL(downloadBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('⚠️ Не удалось отправить в Telegram. Файл сохранен локально.');
          }
        } else {
          // Если Telegram недоступен, скачиваем локально
          let blob: Blob;
          let fileName: string;
          
          if (result.labelPdf) {
            const pdfBase64 = result.labelPdf.replace(/^data:application\/pdf;base64,/, '');
            const binaryString = atob(pdfBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'application/pdf' });
            fileName = `uzum-label-${orderId}.pdf`;
          } else if (result.labelUrl) {
            window.open(result.labelUrl, '_blank');
            return;
          } else {
            blob = new Blob([JSON.stringify(result.label, null, 2)], { type: 'application/json' });
            fileName = `uzum-label-${orderId}.json`;
          }
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
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

  // Вспомогательная функция для конвертации Blob в base64
  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function formatDate(dateString: string | number): string {
    if (!dateString) return 'Нет данных';
    
    // Если это timestamp (число)
    const date = typeof dateString === 'number' 
      ? new Date(dateString) 
      : new Date(dateString);
    
    // Проверяем валидность даты
    if (isNaN(date.getTime())) return 'Неверная дата';
    
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
    return <CoolLoader text={t.loading} />;
  }

  return (
    <div className="uzum-container">
      {/* Header with Refresh Button */}
      <div className="uzum-header">
        <h1 style={{
          fontSize: window.innerWidth > 640 ? '24px' : '18px',
          fontWeight: 700,
          color: '#111',
          margin: 0,
        }}>
          {t.title}
        </h1>
        <button
          onClick={() => {
            setLoading(true);
            loadOrders();
          }}
          className="uzum-btn-success"
        >
          🔄 {window.innerWidth > 640 ? 'Обновить' : ''}
        </button>
      </div>

      {/* Status Filter - Fixed and Always Visible */}
      <div className="uzum-filters" style={{
        position: 'sticky',
        top: '0',
        zIndex: 100,
        overflowX: 'auto',
        maxWidth: '100%',
      }}>
        <div style={{
          display: 'flex',
          gap: window.innerWidth > 640 ? '10px' : '8px',
          minWidth: 'max-content',
          paddingBottom: '8px',
        }}>
          {statusOptions.map((option) => {
            const count = getStatusCount(option.value);
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                style={{
                  padding: window.innerWidth > 640 ? '14px 20px' : '10px 14px',
                  backgroundColor: isActive ? '#22c55e' : '#f9fafb',
                  color: isActive ? 'white' : '#374151',
                  border: isActive ? 'none' : '2px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: window.innerWidth > 640 ? '15px' : '13px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minWidth: 'fit-content',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: window.innerWidth > 640 ? '10px' : '6px',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 4px 8px rgba(34, 197, 94, 0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span>{option.label}</span>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  minWidth: '28px',
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
                className="uzum-order-item"
                style={{
                  border: isExpanded ? '2px solid #22c55e' : '2px solid transparent',
                }}
              >
                {/* Order Header - Always Visible */}
                <div
                  style={{
                    padding: window.innerWidth > 640 ? '20px' : '16px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => handleToggleOrder(orderId)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1, minWidth: window.innerWidth > 640 ? '200px' : '150px' }}>
                      <div style={{
                        fontSize: window.innerWidth > 640 ? '18px' : '16px',
                        fontWeight: '700',
                        marginBottom: window.innerWidth > 640 ? '8px' : '6px',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span>{t.orderNumber}{orderId}</span>
                        <span style={{
                          fontSize: window.innerWidth > 640 ? '16px' : '14px',
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
                        {t.date}: {formatDate(order.dateCreated || order.created_at || order.date || order.createdAt)}
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
                        {order.total || order.totalPrice || order.price ? 
                          formatPrice(order.total || order.totalPrice || order.price) : 
                          '—'}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                      }}>
                        {(() => {
                          const itemsCount = order.items?.length || order.itemsCount || order.productsCount || 0;
                          return itemsCount > 0 ? `${itemsCount} ${t.items}` : t.items;
                        })()}
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
                    {/* Detailed Order Info from API */}
                    {orderDetails[orderId] && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          marginBottom: '12px',
                          color: '#111827',
                        }}>
                          📋 {t.details}
                        </div>
                        <div style={{
                          padding: '16px',
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}>
                          {(() => {
                            const details = orderDetails[orderId];
                            
                            // Отображаем только: ID, дату заказа, дату изменения статуса
                            const fieldsToShow = [
                              { key: 'id', label: '🔢 ID заказа', value: details.id },
                              { key: 'dateCreated', label: '📅 Дата заказа', value: details.dateCreated || details.created_at || details.createdAt },
                              { key: 'dateUpdated', label: '🔄 Дата изменения статуса', value: details.dateUpdated || details.updated_at || details.updatedAt || details.dateCreated },
                            ];

                            return fieldsToShow.map(({ key, label, value }) => {
                              if (!value) return null;
                              
                              let displayValue = String(value);
                              
                              // Форматирование дат
                              if (key.includes('date') || key.includes('Date')) {
                                const timestamp = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : 
                                                  typeof value === 'number' ? value : 
                                                  new Date(value).getTime();
                                
                                if (!isNaN(timestamp)) {
                                  const date = new Date(timestamp);
                                  displayValue = date.toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });
                                }
                              }
                              
                              return (
                                <div key={key} style={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '8px',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                }}>
                                  <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                                    {label}
                                  </div>
                                  <div style={{ color: '#111827', fontSize: '14px', fontWeight: '700' }}>
                                    {displayValue}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Order Items - только SKU */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          marginBottom: '12px',
                          color: '#111827',
                        }}>
                          📦 SKU товаров ({order.items.length})
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}>
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#111827',
                              }}
                            >
                              {item.sku || item.skuId || item.id || `SKU-${idx + 1}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}>
                      {/* Label Size Selector */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>
                          {t.selectSize}:
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLabelSize(prev => ({ ...prev, [orderId]: 'LARGE' }));
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: (labelSize[orderId] || 'LARGE') === 'LARGE' ? '#7c3aed' : '#f3f4f6',
                            color: (labelSize[orderId] || 'LARGE') === 'LARGE' ? 'white' : '#666',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {t.labelSizeLarge}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLabelSize(prev => ({ ...prev, [orderId]: 'BIG' }));
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: labelSize[orderId] === 'BIG' ? '#7c3aed' : '#f3f4f6',
                            color: labelSize[orderId] === 'BIG' ? 'white' : '#666',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {t.labelSizeBig}
                        </button>
                      </div>

                      {/* Print and Cancel Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}>
                        {/* Print Label Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintLabel(orderId, labelSize[orderId] || 'LARGE');
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

                        {/* Cancel Order Button */}
                        {order.status !== 'CANCELED' && order.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(t.cancelConfirm)) {
                                handleCancelOrder(orderId);
                              }
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
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
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
                            <span>❌</span>
                            <span>{actionLoading ? t.canceling : t.cancelOrder}</span>
                          </button>
                        )}
                      </div>
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
