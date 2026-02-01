import { useState, useEffect, useRef } from 'react';
import { getFinanceOrders } from '../../lib/uzum-api';
import CoolLoader from '../CoolLoader';

interface UzumWeeklyChartProps {
  lang: 'ru' | 'uz';
  token: string;
  shopId: number;
  onClose: () => void;
}

interface DayStats {
  day: string;
  sold: number;
  canceled: number;
}

export default function UzumWeeklyChart({ lang, token, shopId, onClose }: UzumWeeklyChartProps) {
  const [weekType, setWeekType] = useState<'current' | 'previous'>('previous');
  const [stats, setStats] = useState({
    sold: 0,
    issued: 0,
    canceled: 0,
    total: 0,
  });
  const [weekData, setWeekData] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const T = {
    ru: {
      title: 'Недельный обзор заказов',
      currentWeek: 'На этой неделе',
      previousWeek: 'На прошлой неделе',
      soldVsCanceled: 'Продано vs Отменено',
      overview: 'Обзор',
      sold: 'Продано',
      issued: 'Выдано',
      canceled: 'Отменено',
      total: 'Всего',
      close: 'Закрыть',
      days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    },
    uz: {
      title: 'Haftalik buyurtmalar sharhi',
      currentWeek: 'Shu haftada',
      previousWeek: 'Otgan haftada',
      soldVsCanceled: 'Sotildi vs Bekor qilindi',
      overview: 'Sharh',
      sold: 'Sotildi',
      issued: 'Berildi',
      canceled: 'Bekor qilindi',
      total: 'Jami',
      close: 'Yopish',
      days: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadWeeklyData();
  }, [token, shopId, weekType]);

  useEffect(() => {
    if (weekData.length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [weekData]);

  async function loadWeeklyData() {
    setLoading(true);
    try {
      const now = new Date();
      const { start, end } = getWeekRange(now, weekType);

      console.log('📊 Loading weekly data for range:', { start, end, startMs: start.getTime(), endMs: end.getTime() });

      // Get all orders for the week using Finance API
      const allOrders: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await getFinanceOrders(token, shopId, {
          page,
          size: 100,
          dateFrom: start.getTime(),
          dateTo: end.getTime(),
        });

        console.log(`📊 Finance orders page ${page}:`, result);

        if (result?.success && result?.orders && result.orders.length > 0) {
          allOrders.push(...result.orders);
          if (result.orders.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('📊 Total orders loaded:', allOrders.length);
      if (allOrders.length > 0) {
        console.log('📊 Sample order:', allOrders[0]);
      }

      // Calculate stats based on order status
      const soldStatuses = ['COMPLETED', 'DELIVERED', 'DELIVERED_TO_CUSTOMER_DELIVERY_POINT'];
      const issuedStatuses = ['ACCEPTED_AT_DP', 'DELIVERING', 'PENDING_DELIVERY'];
      const canceledStatuses = ['CANCELED', 'RETURNED'];

      const sold = allOrders.filter(o => {
        const status = o.status || o.orderStatus;
        return soldStatuses.includes(status) && !o.cancelled && !o.canceled;
      }).length;
      
      const issued = allOrders.filter(o => {
        const status = o.status || o.orderStatus;
        return issuedStatuses.includes(status);
      }).length;
      
      const canceled = allOrders.filter(o => {
        const status = o.status || o.orderStatus;
        return canceledStatuses.includes(status) || o.cancelled || o.canceled;
      }).length;

      setStats({
        sold,
        issued,
        canceled,
        total: allOrders.length,
      });

      console.log('📊 Calculated stats:', { sold, issued, canceled, total: allOrders.length });

      // Group by day
      const dayMap = new Map<string, DayStats>();
      const days = getDaysInRange(start, end);

      days.forEach(day => {
        const dayKey = day.toISOString().split('T')[0];
        dayMap.set(dayKey, {
          day: t.days[day.getDay()],
          sold: 0,
          canceled: 0,
        });
      });

      allOrders.forEach(order => {
        // Определяем дату заказа (разные API возвращают разные поля)
        const orderTimestamp = order.date || order.createdAt || order.created_at;
        const orderDate = new Date(orderTimestamp);
        const dayKey = orderDate.toISOString().split('T')[0];
        const dayStats = dayMap.get(dayKey);
        
        if (dayStats) {
          const status = order.status || order.orderStatus;
          const isCanceled = canceledStatuses.includes(status) || order.cancelled || order.canceled;
          const isSold = soldStatuses.includes(status) && !isCanceled;
          
          if (isSold) {
            dayStats.sold++;
          } else if (isCanceled) {
            dayStats.canceled++;
          }
        }
      });

      const chartData = Array.from(dayMap.values());
      console.log('📊 Chart data by day:', chartData);
      setWeekData(chartData);
    } catch (error) {
      console.error('❌ Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getWeekRange(date: Date, type: 'current' | 'previous') {
    const current = new Date(date);
    const dayOfWeek = current.getDay();
    
    // Get Monday of current week
    const monday = new Date(current);
    monday.setDate(current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    if (type === 'previous') {
      monday.setDate(monday.getDate() - 7);
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  }

  function getDaysInRange(start: Date, end: Date) {
    const days: Date[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  function drawChart() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // Find max value
    const maxValue = Math.max(
      ...weekData.map(d => Math.max(d.sold, d.canceled)),
      1
    );

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = padding + (chartHeight / 6) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Y-axis labels
      const value = Math.round(maxValue - (maxValue / 6) * i);
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    // Draw lines
    const pointSpacing = chartWidth / (weekData.length - 1 || 1);

    // Sold line (green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    weekData.forEach((data, i) => {
      const x = padding + i * pointSpacing;
      const y = padding + chartHeight - (data.sold / maxValue) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw sold points
    weekData.forEach((data, i) => {
      const x = padding + i * pointSpacing;
      const y = padding + chartHeight - (data.sold / maxValue) * chartHeight;
      
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Value label
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.sold.toString(), x, y - 12);
    });

    // Canceled line (gray)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 3;
    ctx.beginPath();
    weekData.forEach((data, i) => {
      const x = padding + i * pointSpacing;
      const y = padding + chartHeight - (data.canceled / maxValue) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw canceled points
    weekData.forEach((data, i) => {
      const x = padding + i * pointSpacing;
      const y = padding + chartHeight - (data.canceled / maxValue) * chartHeight;
      
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Value label
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.canceled.toString(), x, y + 20);
    });

    // X-axis labels (days)
    ctx.fillStyle = '#6b7280';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    weekData.forEach((data, i) => {
      const x = padding + i * pointSpacing;
      ctx.fillText(data.day, x, height - padding + 25);
    });
  }

  return (
    <div className="uzum-modal-overlay">
      <div className="uzum-modal" style={{
        maxWidth: '1200px',
        maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <h2 style={{
            fontSize: window.innerWidth > 640 ? '20px' : '18px',
            fontWeight: 700,
            margin: 0,
          }}>
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="uzum-btn-secondary"
          >
            {t.close}
          </button>
        </div>

        {/* Week toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          backgroundColor: '#f3f4f6',
          padding: '4px',
          borderRadius: '8px',
          width: window.innerWidth > 640 ? 'fit-content' : '100%',
        }}>
          <button
            onClick={() => setWeekType('previous')}
            style={{
              padding: window.innerWidth > 640 ? '10px 20px' : '8px 12px',
              backgroundColor: weekType === 'previous' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: window.innerWidth > 640 ? '14px' : '13px',
              fontWeight: weekType === 'previous' ? 600 : 400,
              boxShadow: weekType === 'previous' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              flex: window.innerWidth > 640 ? 'none' : 1,
            }}
          >
            ✓ {t.previousWeek}
          </button>
          <button
            onClick={() => setWeekType('current')}
            style={{
              padding: window.innerWidth > 640 ? '10px 20px' : '8px 12px',
              backgroundColor: weekType === 'current' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: window.innerWidth > 640 ? '14px' : '13px',
              fontWeight: weekType === 'current' ? 600 : 400,
              boxShadow: weekType === 'current' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              flex: window.innerWidth > 640 ? 'none' : 1,
            }}
          >
            {t.currentWeek}
          </button>
        </div>

        {loading ? (
          <CoolLoader text="Загрузка данных..." />
        ) : (
          <>
            {/* Chart section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#374151',
              }}>
                {t.soldVsCanceled}
              </h3>
              <canvas
                ref={canvasRef}
                width={1100}
                height={300}
                style={{
                  width: '100%',
                  height: 'auto',
                }}
              />
            </div>

            {/* Stats overview */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: 0,
                color: '#374151',
              }}>
                {t.overview}
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 640 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
              gap: '16px',
            }}>
              <div style={{
                backgroundColor: '#ecfdf5',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#064e3b',
                  marginBottom: '8px',
                }}>
                  {stats.sold}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#065f46',
                }}>
                  {t.sold}
                </div>
              </div>

              <div style={{
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  marginBottom: '8px',
                }}>
                  {stats.issued}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#1e40af',
                }}>
                  {t.issued}
                </div>
              </div>

              <div style={{
                backgroundColor: '#fee2e2',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#7f1d1d',
                  marginBottom: '8px',
                }}>
                  {stats.canceled}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#991b1b',
                }}>
                  {t.canceled}
                </div>
              </div>

              <div style={{
                backgroundColor: '#ede9fe',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#4c1d95',
                  marginBottom: '8px',
                }}>
                  {stats.total}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#5b21b6',
                }}>
                  {t.total}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
