import { useState, useEffect } from 'react';
import { getShops, getProducts, getFbsSkuStocks } from '../../../lib/uzum-api';

interface UzumInventoryReportProps {
  lang: 'ru' | 'uz';
  token: string;
}

interface InventoryData {
  productId: string;
  name: string;
  image?: string;
  barcode: string;
  cost: number;
  inStock: number;
  costFBO: number;
  fboQty: number;
  costFBS: number;
  fbsQty: number;
  costFBSFBO: number;
}

export default function UzumInventoryReport({ lang, token }: UzumInventoryReportProps) {
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [shops, setShops] = useState<any[]>([]);

  const T = {
    ru: {
      title: 'Отчет по инвентаризации склада',
      download: 'Скачать',
      search: 'Поиск',
      product: 'Товар',
      barcode: 'ШК',
      cost: 'Себес.',
      inStock: 'На складе',
      costFBO: 'Себес. FBO',
      fboQty: 'Кол-во FBO',
      costFBS: 'Себес. FBS',
      fbsQty: 'Кол-во FBS',
      costFBSFBO: 'Себес. FBS/FBO',
      loading: 'Загрузка данных...',
      noData: 'Нет данных',
      total: 'Итого',
      shop: 'Магазин',
    },
    uz: {
      title: 'Ombor inventarizatsiya hisoboti',
      download: 'Yuklab olish',
      search: 'Qidiruv',
      product: 'Mahsulot',
      barcode: 'SHK',
      cost: 'Tannarx',
      inStock: 'Omborda',
      costFBO: 'Tannarx FBO',
      fboQty: 'FBO miqdori',
      costFBS: 'Tannarx FBS',
      fbsQty: 'FBS miqdori',
      costFBSFBO: 'Tannarx FBS/FBO',
      loading: 'Ma\'lumotlar yuklanmoqda...',
      noData: 'Ma\'lumot yo\'q',
      total: 'Jami',
      shop: 'Do\'kon',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadShops();
  }, [token]);

  useEffect(() => {
    if (selectedShop) {
      loadInventoryData();
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

  async function loadInventoryData() {
    if (!selectedShop) return;

    setLoading(true);
    try {
      // Load products
      const productsResult = await getProducts(token, selectedShop);
      
      // Load stocks
      const stocksResult = await getFbsSkuStocks(token, { limit: 1000 });

      if (productsResult.success && productsResult.products) {
        const inventoryMap = new Map<string, InventoryData>();

        // Initialize with products
        productsResult.products.forEach((product: any) => {
          const productId = product.productId || product.id;
          inventoryMap.set(productId, {
            productId,
            name: product.title || product.name || 'N/A',
            image: product.image || product.photo,
            barcode: product.barcode || product.sku || 'N/A',
            cost: product.purchasePrice || product.costPrice || 0,
            inStock: 0,
            costFBO: 0,
            fboQty: 0,
            costFBS: 0,
            fbsQty: 0,
            costFBSFBO: 0,
          });
        });

        // Add stock data
        if (stocksResult.success && stocksResult.stocks) {
          stocksResult.stocks.forEach((stock: any) => {
            const productId = stock.productId || stock.skuId;
            const existing = inventoryMap.get(productId);
            if (existing) {
              const fboQty = stock.fbo || 0;
              const fbsQty = stock.fbs || 0;
              const dbsQty = stock.dbs || 0;
              
              existing.fboQty = fboQty;
              existing.fbsQty = fbsQty;
              existing.inStock = fboQty + fbsQty + dbsQty;
              existing.costFBO = fboQty * existing.cost;
              existing.costFBS = fbsQty * existing.cost;
              existing.costFBSFBO = (fboQty + fbsQty) * existing.cost;
            }
          });
        }

        setInventoryData(Array.from(inventoryMap.values()).filter(d => d.inStock > 0));
      }
    } catch (error) {
      console.error('Error loading inventory report:', error);
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    const headers = [t.product, t.barcode, t.cost, t.inStock, t.costFBO, t.fboQty, t.costFBS, t.fbsQty, t.costFBSFBO];
    const rows = filteredData.map(row => [
      row.name,
      row.barcode,
      row.cost,
      row.inStock,
      row.costFBO,
      row.fboQty,
      row.costFBS,
      row.fbsQty,
      row.costFBSFBO,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filteredData = inventoryData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = filteredData.reduce((acc, row) => ({
    inStock: acc.inStock + row.inStock,
    costFBO: acc.costFBO + row.costFBO,
    fboQty: acc.fboQty + row.fboQty,
    costFBS: acc.costFBS + row.costFBS,
    fbsQty: acc.fbsQty + row.fbsQty,
    costFBSFBO: acc.costFBSFBO + row.costFBSFBO,
  }), { inStock: 0, costFBO: 0, fboQty: 0, costFBS: 0, fbsQty: 0, costFBSFBO: 0 });

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
          borderTopColor: '#22c55e',
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
            📦 {t.title}
          </h2>
          <button
            onClick={downloadReport}
            style={{
              padding: '12px 24px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⬇️ {t.download}
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginTop: '20px',
        }}>
          <div>
            <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
              {t.search}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
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

      {/* Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.product}
              </th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.barcode}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.cost}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.inStock}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.costFBO}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.fboQty}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.costFBS}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.fbsQty}
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                {t.costFBSFBO}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  {t.noData}
                </td>
              </tr>
            ) : (
              <>
                {filteredData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {row.image && (
                          <img src={row.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{row.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>{row.barcode}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.cost.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{row.inStock}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.costFBO.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>{row.fboQty}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.costFBS.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#22c55e' }}>{row.fbsQty}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{row.costFBSFBO.toLocaleString()}</td>
                  </tr>
                ))}
                {/* Totals */}
                <tr style={{ backgroundColor: '#f9fafb', fontWeight: '700', borderTop: '2px solid #e5e7eb' }}>
                  <td colSpan={3} style={{ padding: '12px' }}>{t.total}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{totals.inStock}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{totals.costFBO.toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6' }}>{totals.fboQty}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{totals.costFBS.toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#22c55e' }}>{totals.fbsQty}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{totals.costFBSFBO.toLocaleString()}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
