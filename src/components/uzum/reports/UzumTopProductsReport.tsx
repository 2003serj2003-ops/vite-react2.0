import { useState, useEffect } from 'react';
import { getShops, getProducts, getFinanceOrders } from '../../../lib/uzum-api';

interface UzumTopProductsReportProps {
  lang: 'ru' | 'uz';
  token: string;
}

interface TopProductData {
  productId: string;
  name: string;
  image?: string;
  sku: string;
  sold: number;
  revenue: number;
  profit: number;
  avgPrice: number;
}

export default function UzumTopProductsReport({ lang, token }: UzumTopProductsReportProps) {
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [limit, setLimit] = useState(20);

  const T = {
    ru: {
      title: 'Топ продаваемые товары',
      dateRange: 'Период',
      shop: 'Магазин',
      download: 'Скачать',
      product: 'Товар',
      sold: 'Продано',
      revenue: 'Выручка',
      profit: 'Прибыль',
      avgPrice: 'Сред. цена',
      loading: 'Загрузка данных...',
      noData: 'Нет данных за выбранный период',
      showTop: 'Показать топ',
    },
    uz: {
      title: 'Eng ko\'p sotiladigan mahsulotlar',
      dateRange: 'Davr',
      shop: 'Do\'kon',
      download: 'Yuklab olish',
      product: 'Mahsulot',
      sold: 'Sotildi',
      revenue: 'Daromad',
      profit: 'Foyda',
      avgPrice: 'O\'rt. narx',
      loading: 'Ma\'lumotlar yuklanmoqda...',
      noData: 'Tanlangan davr uchun ma\'lumot yo\'q',
      showTop: 'Top ko\'rsatish',
    },
  };

  const t = T[lang];

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28);
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });

    loadShops();
  }, [token]);

  useEffect(() => {
    if (selectedShop && dateRange.start && dateRange.end) {
      loadReportData();
    }
  }, [selectedShop, dateRange, limit]);

  async function loadShops() {
    const result = await getShops(token);
    if (result.success && result.shops) {
      setShops(result.shops);
      if (result.shops.length > 0) {
        setSelectedShop(result.shops[0].id);
      }
    }
  }

  async function loadReportData() {
    if (!selectedShop) return;

    setLoading(true);
    try {
      // Load products
      const productsResult = await getProducts(token, selectedShop);
      
      // Load finance orders
      const startMs = new Date(dateRange.start).getTime();
      const endMs = new Date(dateRange.end).getTime();
      
      const ordersResult = await getFinanceOrders(token, selectedShop, {
        size: 5000,
        page: 0,
      });

      if (productsResult.success && productsResult.products && ordersResult.success && ordersResult.orders) {
        const productMap = new Map<string, TopProductData>();

        // Initialize products
        productsResult.products.forEach((product: any) => {
          productMap.set(product.productId || product.id, {
            productId: product.productId || product.id,
            name: product.title || product.name || 'N/A',
            image: product.image || product.photo,
            sku: product.sku || product.skuId,
            sold: 0,
            revenue: 0,
            profit: 0,
            avgPrice: 0,
          });
        });

        // Aggregate sales data
        ordersResult.orders.forEach((order: any) => {
          const orderDate = order.date || order.createdAt || 0;
          if (orderDate >= startMs && orderDate <= endMs) {
            const productId = order.productId || order.skuId;
            const existing = productMap.get(productId);
            if (existing) {
              const amount = order.amount || 1;
              const sellPrice = order.sellPrice || 0;
              const profit = order.sellerProfit || 0;
              
              existing.sold += amount;
              existing.revenue += sellPrice * amount;
              existing.profit += profit * amount;
            }
          }
        });

        // Calculate average price
        productMap.forEach((data) => {
          if (data.sold > 0) {
            data.avgPrice = data.revenue / data.sold;
          }
        });

        // Sort by sold and take top N
        const sortedProducts = Array.from(productMap.values())
          .filter(d => d.sold > 0)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit);

        setTopProducts(sortedProducts);
      }
    } catch (error) {
      console.error('Error loading top products report:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' сум';
  }

  function downloadReport() {
    const headers = [t.product, t.sold, t.revenue, t.profit, t.avgPrice];
    const rows = topProducts.map(row => [
      row.name,
      row.sold,
      row.revenue,
      row.profit,
      row.avgPrice,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `top-products-${dateRange.start}-${dateRange.end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#4CAF50',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ fontSize: '16px', color: '#6b7280' }}>
          {t.loading}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            🏆 {t.title}
          </h2>
          <button
            onClick={downloadReport}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            ⬇️ {t.download}
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '20px',
        }}>
          <div>
            <label style={{ fontSize: '14px', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
              {t.dateRange}
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
              &nbsp;
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
              {t.shop}
            </label>
            <select
              value={selectedShop || ''}
              onChange={(e) => setSelectedShop(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
              {t.showTop}
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{
        display: 'grid',
        gap: '16px',
      }}>
        {topProducts.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>
              {t.noData}
            </div>
          </div>
        ) : (
          topProducts.map((product, index) => (
            <div
              key={product.productId}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                border: index < 3 ? `3px solid ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7f32'}` : '1px solid #e5e7eb',
              }}
            >
              {/* Rank */}
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: index < 3 ? (index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7f32') : '#9ca3af',
                minWidth: '60px',
                textAlign: 'center',
              }}>
                #{index + 1}
              </div>

              {/* Image */}
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                  }}
                />
              )}

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                  SKU: {product.sku}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>{t.sold}</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#4CAF50' }}>
                      {product.sold}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>{t.revenue}</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {formatPrice(product.revenue)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>{t.profit}</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#4CAF50' }}>
                      {formatPrice(product.profit)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1f2937' }}>{t.avgPrice}</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {formatPrice(product.avgPrice)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
