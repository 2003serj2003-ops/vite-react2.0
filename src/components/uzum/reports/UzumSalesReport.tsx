import { useState, useEffect } from 'react';
import { getShops, getProducts, getFinanceOrders, getFbsSkuStocks } from '../../../lib/uzum-api';
import UzumChart from '../UzumChart';
import { FiTrendingUp, FiPackage, FiDollarSign } from 'react-icons/fi';

interface UzumSalesReportProps {
  lang: 'ru' | 'uz';
  token: string;
}

interface SalesData {
  productId: string;
  name: string;
  image?: string;
  sku: string;
  sold: number;
  inStock: number;
  fbs: number;
  revenue: number;
  toPay: number;
  net: number;
  monthlyPotential: number;
}

export default function UzumSalesReport({ lang, token }: UzumSalesReportProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [shops, setShops] = useState<any[]>([]);

  const T = {
    ru: {
      title: 'Отчет продаж и остатков',
      dateRange: 'Период',
      shop: 'Магазин',
      download: 'Скачать',
      search: 'Поиск',
      productName: 'Наименование товара',
      sold: 'Продано',
      inStock: 'На складе',
      fbs: 'ФБС',
      revenue: 'Выручка',
      toPay: 'К выплате',
      net: 'Чистая',
      monthlyPotential: 'Мес. потенциал',
      loading: 'Загрузка данных...',
      noData: 'Нет данных за выбранный период',
      total: 'Итого',
    },
    uz: {
      title: 'Sotish va qoldiqlar hisoboti',
      dateRange: 'Davr',
      shop: 'Do\'kon',
      download: 'Yuklab olish',
      search: 'Qidiruv',
      productName: 'Mahsulot nomi',
      sold: 'Sotildi',
      inStock: 'Omborda',
      fbs: 'FBS',
      revenue: 'Daromad',
      toPay: 'To\'lash kerak',
      net: 'Sof',
      monthlyPotential: 'Oylik potentsial',
      loading: 'Ma\'lumotlar yuklanmoqda...',
      noData: 'Tanlangan davr uchun ma\'lumot yo\'q',
      total: 'Jami',
    },
  };

  const t = T[lang];

  useEffect(() => {
    // Set default date range (last 28 days)
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
  }, [selectedShop, dateRange]);

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
      console.log('📊 [SalesReport] Loading data for shop:', selectedShop);
      
      // Load products
      const productsResult = await getProducts(token, selectedShop);
      console.log('📊 [SalesReport] Products:', productsResult);
      
      // Load finance orders for the period
      const startMs = new Date(dateRange.start).getTime();
      const endMs = new Date(dateRange.end).getTime();
      
      const ordersResult = await getFinanceOrders(token, selectedShop, {
        size: 1000,
        page: 0,
      });
      console.log('📊 [SalesReport] Orders:', ordersResult);

      // Load stock info
      const stocksResult = await getFbsSkuStocks(token, { limit: 1000 });
      console.log('📊 [SalesReport] Stocks:', stocksResult);

      // Process data
      if (productsResult.success && productsResult.products) {
        const salesMap = new Map<string, SalesData>();

        // Initialize products
        productsResult.products.forEach((product: any) => {
          salesMap.set(product.productId || product.id, {
            productId: product.productId || product.id,
            name: product.title || product.name || 'N/A',
            image: product.image || product.photo,
            sku: product.sku || product.skuId,
            sold: 0,
            inStock: 0,
            fbs: 0,
            revenue: 0,
            toPay: 0,
            net: 0,
            monthlyPotential: 0,
          });
        });

        // Add sales data from orders
        if (ordersResult.success && ordersResult.orders) {
          ordersResult.orders.forEach((order: any) => {
            const orderDate = order.date || order.createdAt || 0;
            if (orderDate >= startMs && orderDate <= endMs) {
              const productId = order.productId || order.skuId;
              const existing = salesMap.get(productId);
              if (existing) {
                const amount = order.amount || 1;
                existing.sold += amount;
                existing.revenue += (order.sellPrice || 0) * amount;
                existing.toPay += (order.sellerProfit || 0) * amount;
                existing.net += (order.sellerProfit || 0) * amount;
              }
            }
          });
        }

        // Add stock data
        if (stocksResult.success && stocksResult.stocks) {
          stocksResult.stocks.forEach((stock: any) => {
            const productId = stock.productId || stock.skuId;
            const existing = salesMap.get(productId);
            if (existing) {
              existing.fbs = stock.fbs || 0;
              existing.inStock = (stock.fbo || 0) + (stock.fbs || 0) + (stock.dbs || 0);
            }
          });
        }

        // Calculate monthly potential (based on sales rate)
        const daysDiff = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
        salesMap.forEach((data) => {
          if (daysDiff > 0 && data.sold > 0) {
            const dailyRate = data.sold / daysDiff;
            data.monthlyPotential = Math.round(dailyRate * 30);
          }
        });

        setSalesData(Array.from(salesMap.values()).filter(d => d.sold > 0 || d.inStock > 0));
      }
    } catch (error) {
      console.error('Error loading sales report:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' сум';
  }

  function downloadReport() {
    // Create CSV content
    const headers = [t.productName, t.sold, t.inStock, t.fbs, t.revenue, t.toPay, t.net, t.monthlyPotential];
    const rows = salesData.map(row => [
      row.name,
      row.sold,
      row.inStock,
      row.fbs,
      row.revenue,
      row.toPay,
      row.net,
      row.monthlyPotential,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${dateRange.start}-${dateRange.end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totals = salesData.reduce((acc, row) => ({
    sold: acc.sold + row.sold,
    revenue: acc.revenue + row.revenue,
    toPay: acc.toPay + row.toPay,
    net: acc.net + row.net,
    monthlyPotential: acc.monthlyPotential + row.monthlyPotential,
  }), { sold: 0, revenue: 0, toPay: 0, net: 0, monthlyPotential: 0 });

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

  // Prepare chart data
  const topSoldProducts = [...salesData]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10)
    .map(p => ({ label: p.name.substring(0, 20), value: p.sold }));

  const topRevenueProducts = [...salesData]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(p => ({ label: p.name.substring(0, 20), value: p.revenue }));

  const stockDistribution = salesData
    .filter(p => p.inStock > 0)
    .slice(0, 8)
    .map(p => ({ label: p.name.substring(0, 15), value: p.inStock }));

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
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiTrendingUp size={28} style={{ color: '#1E6FDB' }} />
            {t.title}
          </h2>
          <button
            onClick={downloadReport}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #1E6FDB 0%, #4CAF50 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(30,111,219, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
            <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
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
            <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
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
            <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
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
        </div>
      </div>

      {/* Charts Section */}
      {salesData.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(2, 1fr)' : '1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1E6FDB 0%, #3FA9F5 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(30,111,219, 0.3)',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                {t.sold}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>
                {totals.sold.toLocaleString()}
              </div>
              <FiPackage size={40} style={{ opacity: 0.3, position: 'absolute', top: '20px', right: '20px' }} />
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #4CAF50 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(76,175,80, 0.3)',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                {t.revenue}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>
                {formatPrice(totals.revenue)}
              </div>
              <FiDollarSign size={40} style={{ opacity: 0.3, position: 'absolute', top: '20px', right: '20px' }} />
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1E6FDB 0%, #1E6FDB 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(30,111,219, 0.3)',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                {t.toPay}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>
                {formatPrice(totals.toPay)}
              </div>
              <FiDollarSign size={40} style={{ opacity: 0.3, position: 'absolute', top: '20px', right: '20px' }} />
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #FF9F1C 0%, #d97706 100%)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                {t.monthlyPotential}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>
                {totals.monthlyPotential.toLocaleString()}
              </div>
              <FiTrendingUp size={40} style={{ opacity: 0.3, position: 'absolute', top: '20px', right: '20px' }} />
            </div>
          </div>

          {/* Stock Distribution Pie Chart */}
          {stockDistribution.length > 0 && (
            <UzumChart
              data={stockDistribution}
              type="pie"
              title={`${t.inStock} - Распределение`}
              height={300}
            />
          )}
        </div>
      )}

      {/* Charts Row */}
      {salesData.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(2, 1fr)' : '1fr',
          gap: '20px',
          marginBottom: '20px',
        }}>
          {/* Top Sold Products Chart */}
          {topSoldProducts.length > 0 && (
            <UzumChart
              data={topSoldProducts}
              type="bar"
              title="ТОП-10 продаж по количеству"
              height={350}
            />
          )}

          {/* Top Revenue Products Chart */}
          {topRevenueProducts.length > 0 && (
            <UzumChart
              data={topRevenueProducts}
              type="bar"
              title="ТОП-10 продаж по выручке"
              height={350}
            />
          )}
        </div>
      )}

      {/* Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.productName}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.sold}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.inStock}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.fbs}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.revenue}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.toPay}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.net}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.monthlyPotential}
              </th>
            </tr>
          </thead>
          <tbody>
            {salesData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  {t.noData}
                </td>
              </tr>
            ) : (
              <>
                {salesData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {row.image && (
                          <img src={row.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{row.name}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{row.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{row.sold}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.inStock}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.fbs}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatPrice(row.revenue)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#4CAF50', fontWeight: '600' }}>{formatPrice(row.toPay)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{formatPrice(row.net)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.monthlyPotential}</td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr style={{ backgroundColor: '#f9fafb', fontWeight: '700', borderTop: '2px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{t.total}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{totals.sold}</td>
                  <td style={{ padding: '12px' }}></td>
                  <td style={{ padding: '12px' }}></td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{formatPrice(totals.revenue)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#4CAF50' }}>{formatPrice(totals.toPay)}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{formatPrice(totals.net)}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{totals.monthlyPotential}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
