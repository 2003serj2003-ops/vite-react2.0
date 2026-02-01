// Простой отчет для неликвидных товаров, платного хранения, возвратов и выплат
// Использует базовую логику с существующими API

import { useState, useEffect } from 'react';
import { getShops, getProducts, getFbsSkuStocks, getFinanceOrders } from '../../../lib/uzum-api';
import { exportToExcel } from '../../../lib/excel-export';

interface SimpleReportProps {
  lang: 'ru' | 'uz';
  token: string;
  type: 'non-liquid' | 'paid-storage' | 'returned' | 'paid-out';
}

interface ProductData {
  productId: string;
  name: string;
  image?: string;
  sku: string;
  value: number;
  details: string;
}

export default function UzumSimpleReport({ lang, token, type }: SimpleReportProps) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [shops, setShops] = useState<any[]>([]);

  const configs = {
    'non-liquid': {
      title: { ru: 'Неликвидные товары', uz: 'Nolikvidlar' },
      icon: '⚠️',
      valueLabel: { ru: 'Дни без продаж', uz: 'Sotishsiz kunlar' },
      description: { ru: 'Товары, которые долго не продаются', uz: 'Uzoq vaqt sotilmagan mahsulotlar' },
    },
    'paid-storage': {
      title: { ru: 'Платное хранение', uz: 'Pullik saqlash' },
      icon: '💰',
      valueLabel: { ru: 'Стоимость', uz: 'Narx' },
      description: { ru: 'Товары на платном хранении', uz: 'Pullik saqlashdagi mahsulotlar' },
    },
    'returned': {
      title: { ru: 'Возвращенные товары', uz: 'Qaytarilgan mahsulotlar' },
      icon: '↩️',
      valueLabel: { ru: 'Количество', uz: 'Miqdor' },
      description: { ru: 'Товары с возвратами', uz: 'Qaytarilgan mahsulotlar' },
    },
    'paid-out': {
      title: { ru: 'Выплаченные товары', uz: 'To\'langan mahsulotlar' },
      icon: '💵',
      valueLabel: { ru: 'Сумма', uz: 'Summa' },
      description: { ru: 'Товары с выплаченной прибылью', uz: 'Foyda to\'langan mahsulotlar' },
    },
  };

  const config = configs[type];
  const T = {
    ru: {
      shop: 'Магазин',
      loading: 'Загрузка данных...',
      noData: 'Нет данных',
      download: 'Скачать',
      product: 'Товар',
    },
    uz: {
      shop: 'Do\'kon',
      loading: 'Ma\'lumotlar yuklanmoqda...',
      noData: 'Ma\'lumot yo\'q',
      download: 'Yuklab olish',
      product: 'Mahsulot',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadShops();
  }, [token]);

  useEffect(() => {
    if (selectedShop) {
      loadReportData();
    }
  }, [selectedShop]);

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
      const productsResult = await getProducts(token, selectedShop);
      const stocksResult = await getFbsSkuStocks(token, { limit: 1000 });
      const ordersResult = await getFinanceOrders(token, selectedShop, { size: 5000, page: 0 });

      if (productsResult.success && productsResult.products) {
        const productMap = new Map<string, ProductData>();

        // Initialize products
        productsResult.products.forEach((product: any) => {
          productMap.set(product.productId || product.id, {
            productId: product.productId || product.id,
            name: product.title || product.name || 'N/A',
            image: product.image || product.photo,
            sku: product.sku || product.skuId,
            value: 0,
            details: '',
          });
        });

        // Calculate based on type
        if (type === 'non-liquid' && ordersResult.success && ordersResult.orders) {
          // Находим товары без продаж за последние 30 дней
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          const recentSales = new Set();
          
          ordersResult.orders.forEach((order: any) => {
            const orderDate = order.date || order.createdAt || 0;
            if (orderDate >= thirtyDaysAgo) {
              recentSales.add(order.productId || order.skuId);
            }
          });

          productMap.forEach((data, productId) => {
            if (!recentSales.has(productId)) {
              data.value = 30;
              data.details = config.description[lang];
            }
          });
        } else if (type === 'paid-storage' && stocksResult.success && stocksResult.stocks) {
          // Товары с остатками (примерная стоимость хранения)
          stocksResult.stocks.forEach((stock: any) => {
            const productId = stock.productId || stock.skuId;
            const existing = productMap.get(productId);
            if (existing) {
              const totalStock = (stock.fbo || 0) + (stock.fbs || 0);
              if (totalStock > 100) { // Много остатков = платное хранение
                existing.value = totalStock;
                existing.details = `${totalStock} шт на складе`;
              }
            }
          });
        } else if (type === 'returned' && ordersResult.success && ordersResult.orders) {
          // Подсчитываем возвраты (orders со статусом returned)
          ordersResult.orders.forEach((order: any) => {
            if (order.status === 'returned' || order.status === 'cancelled') {
              const productId = order.productId || order.skuId;
              const existing = productMap.get(productId);
              if (existing) {
                existing.value += order.amount || 1;
                existing.details = 'Возврат';
              }
            }
          });
        } else if (type === 'paid-out' && ordersResult.success && ordersResult.orders) {
          // Подсчитываем выплаты
          ordersResult.orders.forEach((order: any) => {
            if (order.status === 'paid' || order.sellerProfit > 0) {
              const productId = order.productId || order.skuId;
              const existing = productMap.get(productId);
              if (existing) {
                existing.value += order.sellerProfit || 0;
                existing.details = 'Выплачено';
              }
            }
          });
        }

        // Filter products with data
        const filtered = Array.from(productMap.values())
          .filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value);

        setProducts(filtered);
      }
    } catch (error) {
      console.error(`Error loading ${type} report:`, error);
    } finally {
      setLoading(false);
    }
  }

  function formatValue(value: number): string {
    if (type === 'paid-storage' || type === 'paid-out') {
      return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' сум';
    }
    return value.toString();
  }

  async function downloadReport() {
    const headers = [t.product, 'SKU', config.valueLabel[lang], 'Детали'];
    const rows = products.map(row => [
      row.name,
      row.sku,
      formatValue(row.value),
      row.details,
    ]);

    const reportNames = {
      'non-liquid': 'неликвиды',
      'paid-storage': 'платное_хранение',
      'returned': 'возвраты',
      'paid-out': 'выплаты',
    };

    await exportToExcel({
      filename: `sellix_${reportNames[type]}_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: config.title[lang],
      headers,
      data: rows,
    });
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
        <div style={{ fontSize: '16px', color: '#1f2937' }}>
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
          marginBottom: '20px',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            {config.icon} {config.title[lang]}
          </h2>
          {products.length > 0 && (
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
          )}
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
              maxWidth: '300px',
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

      {/* Products List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {products.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{config.icon}</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              {t.noData}
            </div>
          </div>
        ) : (
          products.map((product) => (
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
              }}
            >
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
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  SKU: {product.sku}
                </div>
                <div style={{ fontSize: '14px', color: '#1f2937' }}>
                  {product.details}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#1f2937', marginBottom: '4px' }}>
                  {config.valueLabel[lang]}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                  {formatValue(product.value)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
