import { useState, useEffect } from 'react';
import { getFbsSkuStocks, updateFbsSkuStocks } from '../../lib/uzum-api';

interface StockItem {
  skuId: number;
  skuTitle: string;
  productTitle: string;
  barcode: string;
  amount: number;
  fbsAllowed: boolean;
  dbsAllowed: boolean;
  fbsLinked: boolean;
  dbsLinked: boolean;
  sellerSkuCode?: string;
}

interface UzumStocksProps {
  token: string;
  onNavigate: (view: string) => void;
  lang?: 'ru' | 'uz';
}

export default function UzumStocks({ token, onNavigate, lang = 'ru' }: UzumStocksProps) {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editedStocks, setEditedStocks] = useState<{ [key: number]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const t = lang === 'ru' ? {
    title: 'Обновление остатков',
    back: 'Назад',
    loading: 'Загрузка...',
    updating: 'Обновление...',
    sku: 'SKU',
    product: 'Товар',
    barcode: 'Штрихкод',
    currentStock: 'Текущий остаток',
    newStock: 'Новый остаток',
    fbs: 'FBS',
    dbs: 'DBS',
    linked: 'Привязан',
    notLinked: 'Не привязан',
    search: 'Поиск по названию или SKU',
    updateAll: 'Обновить всё',
    reset: 'Сбросить',
    updated: 'Остатки обновлены',
    error: 'Ошибка обновления',
    noChanges: 'Нет изменений',
    totalItems: 'Всего товаров',
    totalStock: 'Общий остаток',
  } : {
    title: 'Qoldiqlarni yangilash',
    back: 'Orqaga',
    loading: 'Yuklanmoqda...',
    updating: 'Yangilanmoqda...',
    sku: 'SKU',
    product: 'Mahsulot',
    barcode: 'Shtrix-kod',
    currentStock: 'Joriy qoldiq',
    newStock: 'Yangi qoldiq',
    fbs: 'FBS',
    dbs: 'DBS',
    linked: 'Bog\'langan',
    notLinked: 'Bog\'lanmagan',
    search: 'Nomi yoki SKU bo\'yicha qidirish',
    updateAll: 'Hammasini yangilash',
    reset: 'Bekor qilish',
    updated: 'Qoldiqlar yangilandi',
    error: 'Yangilashda xato',
    noChanges: 'O\'zgarishlar yo\'q',
    totalItems: 'Jami mahsulotlar',
    totalStock: 'Umumiy qoldiq',
  };

  useEffect(() => {
    loadStocks();
  }, []);

  async function loadStocks() {
    setLoading(true);
    try {
      const result = await getFbsSkuStocks(token);
      if (result.success && result.stocks) {
        setStocks(result.stocks);
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleStockChange(skuId: number, value: string) {
    const numValue = parseInt(value) || 0;
    setEditedStocks(prev => ({
      ...prev,
      [skuId]: numValue
    }));
  }

  function handleReset() {
    setEditedStocks({});
  }

  async function handleUpdateAll() {
    if (Object.keys(editedStocks).length === 0) {
      alert(t.noChanges);
      return;
    }

    setUpdating(true);
    try {
      const updates = Object.entries(editedStocks).map(([skuId, stock]) => ({
        sku: skuId,
        stock: stock
      }));

      const result = await updateFbsSkuStocks(token, updates);
      
      if (result.success) {
        alert(t.updated);
        setEditedStocks({});
        await loadStocks();
      } else {
        alert(t.error + ': ' + result.error);
      }
    } catch (error) {
      console.error('Error updating stocks:', error);
      alert(t.error);
    } finally {
      setUpdating(false);
    }
  }

  const filteredStocks = stocks.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.skuTitle.toLowerCase().includes(query) ||
      item.productTitle.toLowerCase().includes(query) ||
      item.skuId.toString().includes(query) ||
      item.barcode?.toLowerCase().includes(query)
    );
  });

  const totalStock = filteredStocks.reduce((sum, item) => sum + item.amount, 0);
  const hasChanges = Object.keys(editedStocks).length > 0;

  if (loading) {
    return (
      <div className="uzum-container" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="uzum-container">
      {/* Header */}
      <div className="uzum-header">
        <button
          onClick={() => onNavigate('dashboard')}
          className="uzum-back-btn"
          style={{
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← {t.back}
        </button>
        <h1 className="uzum-header-title">{t.title}</h1>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 640 ? 'repeat(2, 1fr)' : '1fr',
        gap: '12px',
        padding: '16px',
      }}>
        <div className="uzum-card" style={{ padding: '12px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            {t.totalItems}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
            {filteredStocks.length}
          </div>
        </div>
        <div className="uzum-card" style={{ padding: '12px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            {t.totalStock}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
            {totalStock}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 16px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.search}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            outline: 'none',
          }}
        />
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 16px 16px',
        }}>
          <button
            onClick={handleUpdateAll}
            disabled={updating}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: updating ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: updating ? 'not-allowed' : 'pointer',
            }}
          >
            {updating ? t.updating : `${t.updateAll} (${Object.keys(editedStocks).length})`}
          </button>
          <button
            onClick={handleReset}
            disabled={updating}
            style={{
              padding: '12px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: updating ? 'not-allowed' : 'pointer',
            }}
          >
            {t.reset}
          </button>
        </div>
      )}

      {/* Stocks List */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredStocks.map((item) => {
            const hasEdit = editedStocks[item.skuId] !== undefined;
            const displayAmount = hasEdit ? editedStocks[item.skuId] : item.amount;

            return (
              <div key={item.skuId} className="uzum-card" style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: window.innerWidth > 640 ? 'row' : 'column',
                  gap: '16px',
                }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.productTitle}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.skuTitle}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '12px',
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        color: '#666',
                      }}>
                        SKU: {item.skuId}
                      </span>
                      {item.barcode && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          color: '#666',
                        }}>
                          {item.barcode}
                        </span>
                      )}
                      {item.fbsLinked && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}>
                          {t.fbs}
                        </span>
                      )}
                      {item.dbsLinked && (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#fef3c7',
                          color: '#ca8a04',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}>
                          {t.dbs}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Input */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {t.currentStock}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#666' }}>
                        {item.amount}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', color: '#ccc' }}>→</div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {t.newStock}
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={displayAmount}
                        onChange={(e) => handleStockChange(item.skuId, e.target.value)}
                        style={{
                          width: '80px',
                          padding: '8px',
                          fontSize: '16px',
                          fontWeight: 600,
                          textAlign: 'center',
                          border: hasEdit ? '2px solid #10b981' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          backgroundColor: hasEdit ? '#f0fdf4' : 'white',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
