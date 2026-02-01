import { useState, useEffect } from 'react';
import { getFbsSkuStocks, updateFbsSkuStocks, getProducts } from '../../lib/uzum-api';
import SmartLoader from '../SmartLoader';
import { FiPackage, FiSearch, FiCheckCircle, FiX, FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';

interface UzumStocksProps {
  lang: 'ru' | 'uz';
  token: string;
  shopId: number;
  onNavigate?: (page: string) => void;
}

interface StockItem {
  skuId: number;
  productId?: number;
  productTitle: string;
  skuTitle: string;
  amount: number;
  barcode?: string;
  fbsLinked?: boolean;
  dbsLinked?: boolean;
  image?: string;
  previewImage?: string;
}

export default function UzumStocks({ lang, token, shopId }: UzumStocksProps) {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editedStocks, setEditedStocks] = useState<{ [key: number]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const T = {
    ru: {
      title: 'Инвентаризация склада',
      back: 'Назад',
      loading: 'Загрузка...',
      search: 'Поиск по названию или SKU...',
      totalItems: 'Всего товаров',
      totalStock: 'Всего остатков',
      updateAll: 'Сохранить изменения',
      reset: 'Отменить',
      updating: 'Обновление...',
      noChanges: 'Нет изменений для сохранения',
      updated: 'Остатки успешно обновлены',
      error: 'Ошибка при обновлении',
      currentStock: 'Текущий',
      newStock: 'Новый',
      fbs: 'FBS',
      dbs: 'DBS',
      lowStock: 'Низкий',
      mediumStock: 'Средний',
      highStock: 'Высокий',
      all: 'Все',
      quickActions: 'Быстрые действия',
      changesSaved: 'Изменения',
    },
    uz: {
      title: 'Ombor inventarizatsiyasi',
      back: 'Orqaga',
      loading: 'Yuklanmoqda...',
      search: 'Nomi yoki SKU bo\'yicha qidirish...',
      totalItems: 'Jami mahsulotlar',
      totalStock: 'Jami qoldiqlar',
      updateAll: 'O\'zgarishlarni saqlash',
      reset: 'Bekor qilish',
      updating: 'Yangilanmoqda...',
      noChanges: 'Saqlash uchun o\'zgarishlar yo\'q',
      updated: 'Qoldiqlar muvaffaqiyatli yangilandi',
      error: 'Yangilashda xato',
      currentStock: 'Joriy',
      newStock: 'Yangi',
      fbs: 'FBS',
      dbs: 'DBS',
      lowStock: 'Past',
      mediumStock: 'O\'rta',
      highStock: 'Yuqori',
      all: 'Hammasi',
      quickActions: 'Tez harakatlar',
      changesSaved: 'O\'zgarishlar',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadStocks();
  }, [token, shopId]);

  async function loadStocks() {
    setLoading(true);
    try {
      const result = await getFbsSkuStocks(token, { limit: 1000 });
      
      if (result.success && result.stocks) {
        let enrichedStocks = result.stocks;
        
        // Обогащаем данные изображениями из products API
        const productsResult = await getProducts(token, shopId);
        if (productsResult.success && productsResult.products) {
          const skuImageMap = new Map<number, string>();
          
          for (const product of productsResult.products) {
            if (product.skuList) {
              for (const sku of product.skuList) {
                if (sku.skuId && (sku.previewImage || product.image)) {
                  skuImageMap.set(Number(sku.skuId), sku.previewImage || product.image);
                }
              }
            }
          }
          
          enrichedStocks = result.stocks.map(stock => ({
            ...stock,
            image: skuImageMap.get(Number(stock.skuId)) || stock.image,
          }));
        }
        
        setStocks(enrichedStocks);
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

  function handleQuickChange(skuId: number, currentAmount: number, delta: number) {
    const newAmount = Math.max(0, currentAmount + delta);
    setEditedStocks(prev => ({
      ...prev,
      [skuId]: newAmount
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

      const result = await updateFbsSkuStocks(token, updates, shopId);
      
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

  function getStockLevel(amount: number): 'low' | 'medium' | 'high' {
    if (amount <= 5) return 'low';
    if (amount <= 20) return 'medium';
    return 'high';
  }

  function getStockLevelColor(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'low': return 'var(--accent-danger)';
      case 'medium': return 'var(--accent-warning)';
      case 'high': return 'var(--accent-success)';
    }
  }

  const filteredStocks = stocks.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.skuTitle.toLowerCase().includes(query) ||
      item.productTitle.toLowerCase().includes(query) ||
      item.skuId.toString().includes(query) ||
      item.barcode?.toLowerCase().includes(query);
    
    if (!matchesSearch) return false;
    
    if (filterLevel === 'all') return true;
    return getStockLevel(item.amount) === filterLevel;
  });

  const totalStock = filteredStocks.reduce((sum, item) => sum + item.amount, 0);
  const hasChanges = Object.keys(editedStocks).length > 0;
  const lowStockCount = stocks.filter(s => getStockLevel(s.amount) === 'low').length;

  if (loading) {
    return <SmartLoader type="general" />;
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1C2D 0%, #1E6FDB 50%, #3FA9F5 100%)',
        padding: '24px 20px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FiPackage size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            {t.title}
          </h1>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 640 ? 'repeat(3, 1fr)' : '1fr',
          gap: '12px',
          marginTop: '16px',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>
              {t.totalItems}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>
              {filteredStocks.length}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>
              {t.totalStock}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>
              {totalStock.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: lowStockCount > 0 
              ? 'rgba(239, 68, 68, 0.2)' 
              : 'rgba(76,175,80, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: `1px solid ${lowStockCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(76,175,80, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <FiAlertCircle size={24} />
            <div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '2px' }}>
                {t.lowStock}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {lowStockCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-lg">
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <FiSearch size={20} style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            style={{
              width: '100%',
              padding: '14px 14px 14px 48px',
              fontSize: '15px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border 0.2s',
              backgroundColor: 'white',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#1E6FDB'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Stock Level Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { key: 'all', label: t.all, color: '#6b7280' },
            { key: 'low', label: t.lowStock, color: 'var(--accent-danger)' },
            { key: 'medium', label: t.mediumStock, color: 'var(--accent-warning)' },
            { key: 'high', label: t.highStock, color: 'var(--accent-success)' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilterLevel(key as any)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                background: filterLevel === key ? color : 'white',
                color: filterLevel === key ? 'white' : '#6b7280',
                boxShadow: filterLevel === key 
                  ? `0 4px 12px ${color}40` 
                  : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              {key !== 'all' && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: filterLevel === key ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                  fontSize: '12px',
                }}>
                  {stocks.filter(s => getStockLevel(s.amount) === key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div style={{
            background: 'linear-gradient(135deg, #1E6FDB 0%, var(--accent-success) 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(30,111,219, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiCheckCircle size={24} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>
                  {t.changesSaved}: {Object.keys(editedStocks).length}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  {t.quickActions}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleReset}
                disabled={updating}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiX size={16} />
                {t.reset}
              </button>
              <button
                onClick={handleUpdateAll}
                disabled={updating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#1E6FDB',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FiCheckCircle size={16} />
                {updating ? t.updating : t.updateAll}
              </button>
            </div>
          </div>
        )}

        {/* Stock Items List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: '100px', // Отступ для нижней навигации
        }}>
          {filteredStocks.map((item) => {
            const hasEdit = editedStocks[item.skuId] !== undefined;
            const displayAmount = hasEdit ? editedStocks[item.skuId] : item.amount;
            const stockLevel = getStockLevel(item.amount);
            const stockColor = getStockLevelColor(stockLevel);

            return (
              <div
                key={item.skuId}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: hasEdit 
                    ? '0 4px 16px rgba(30,111,219, 0.2)' 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  border: hasEdit ? '2px solid #1E6FDB' : '2px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Stock Level Indicator */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: stockColor,
                }} />

                {/* Product Header */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  {/* Image */}
                  {(item.image || item.previewImage) && (
                    <div style={{
                      width: '64px',
                      height: '64px',
                      flexShrink: 0,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#f3f4f6',
                    }}>
                      <img
                        src={item.image || item.previewImage}
                        alt={item.productTitle}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#111',
                      marginBottom: '4px',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.productTitle}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '6px',
                    }}>
                      {item.skuTitle}
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        fontFamily: 'monospace',
                      }}>
                        SKU: {item.skuId}
                      </span>
                      {item.fbsLinked && (
                        <span style={{
                          padding: '4px 10px',
                          background: 'var(--accent-success)',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {t.fbs}
                        </span>
                      )}
                      {item.dbsLinked && (
                        <span style={{
                          padding: '4px 10px',
                          background: 'var(--accent-warning)',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {t.dbs}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Controls - Full Width */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: hasEdit ? '#f0fdf4' : '#f9fafb',
                  borderRadius: '12px',
                }}>
                  {/* Quick Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => handleQuickChange(item.skuId, displayAmount, 10)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--accent-success)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minWidth: '70px',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <FiTrendingUp size={14} />
                      +10
                    </button>
                    <button
                      onClick={() => handleQuickChange(item.skuId, displayAmount, -10)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--accent-danger)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minWidth: '70px',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <FiTrendingDown size={14} />
                      -10
                    </button>
                  </div>

                  {/* Current Stock */}
                  <div style={{ 
                    textAlign: 'center', 
                    flex: 1,
                    padding: '8px',
                    background: 'white',
                    borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: '600' }}>
                      {t.currentStock}
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: stockColor,
                      lineHeight: '1',
                    }}>
                      {item.amount}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ fontSize: '24px', color: '#d1d5db', fontWeight: '700' }}>→</div>

                  {/* New Stock Input - Larger */}
                  <div style={{ flex: 1.2 }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#9ca3af', 
                      marginBottom: '6px', 
                      textAlign: 'center',
                      fontWeight: '600',
                    }}>
                      {t.newStock}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={displayAmount}
                      onChange={(e) => handleStockChange(item.skuId, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '24px',
                        fontWeight: '700',
                        textAlign: 'center',
                        border: hasEdit ? '3px solid #1E6FDB' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        outline: 'none',
                        background: 'white',
                        color: '#111',
                        boxShadow: hasEdit ? '0 0 0 3px rgba(30,111,219,0.1)' : 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1E6FDB';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,111,219,0.1)';
                      }}
                      onBlur={(e) => {
                        if (!hasEdit) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStocks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af',
          }}>
            <FiPackage size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              Товары не найдены
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
