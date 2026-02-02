/**
 * MIT License
 * Copyright © 2026 CloudGrove (@CloudGrove)
 */

import { useState, useEffect } from 'react';
import { getProducts, updateProductPrices } from '../../lib/uzum-api';
import SmartLoader from '../SmartLoader';
import { FiDollarSign, FiSearch, FiCheckCircle, FiX, FiTrendingUp, FiTrendingDown, FiPackage } from 'react-icons/fi';

interface UzumPricesProps {
  lang: 'ru' | 'uz';
  token: string;
  shopId: number;
  onNavigate?: (page: string) => void;
}

interface PriceItem {
  sku: string;
  productId?: number;
  productTitle: string;
  skuTitle: string;
  price: number;
  barcode?: string;
  image?: string;
  previewImage?: string;
  stock?: number;
}

export default function UzumPrices({ lang, token, shopId }: UzumPricesProps) {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const T = {
    ru: {
      title: 'Обновление цен',
      back: 'Назад',
      loading: 'Загрузка...',
      search: 'Поиск по названию или SKU...',
      totalItems: 'Всего товаров',
      updateAll: 'Сохранить изменения',
      reset: 'Отменить',
      updating: 'Обновление...',
      noChanges: 'Нет изменений для сохранения',
      updated: 'Цены успешно обновлены',
      error: 'Ошибка при обновлении',
      currentPrice: 'Текущая',
      newPrice: 'Новая',
      quickActions: 'Быстрые действия',
      changesSaved: 'Изменения',
      stock: 'Остаток',
      enterPrice: 'Введите цену',
    },
    uz: {
      title: 'Narxlarni yangilash',
      back: 'Orqaga',
      loading: 'Yuklanmoqda...',
      search: 'Nomi yoki SKU bo\'yicha qidirish...',
      totalItems: 'Jami mahsulotlar',
      updateAll: 'O\'zgarishlarni saqlash',
      reset: 'Bekor qilish',
      updating: 'Yangilanmoqda...',
      noChanges: 'Saqlash uchun o\'zgarishlar yo\'q',
      updated: 'Narxlar muvaffaqiyatli yangilandi',
      error: 'Yangilashda xato',
      currentPrice: 'Joriy',
      newPrice: 'Yangi',
      quickActions: 'Tez harakatlar',
      changesSaved: 'O\'zgarishlar',
      stock: 'Qoldiq',
      enterPrice: 'Narxni kiriting',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadPrices();
  }, [token, shopId]);

  async function loadPrices() {
    setLoading(true);
    try {
      const result = await getProducts(token, shopId);
      
      if (result.success && result.products) {
        // Преобразуем products в price items
        const priceItems: PriceItem[] = [];
        
        for (const product of result.products) {
          // В Uzum каждый SKU - отдельный продукт
          if (product.sku) {
            priceItems.push({
              sku: product.sku,
              productId: product.id || product.productId,
              productTitle: product.title || product.name || 'Без названия',
              skuTitle: product.sku,
              price: product.price || 0,
              barcode: product.barcode,
              image: product.photo || product.mainPhoto || product.image,
              previewImage: product.previewImage,
              stock: product.stock || product.quantity || 0,
            });
          }
          
          // Если есть skuList, добавляем их тоже
          if (product.skuList && Array.isArray(product.skuList)) {
            for (const sku of product.skuList) {
              if (sku.sku || sku.skuId) {
                priceItems.push({
                  sku: sku.sku || sku.skuId?.toString() || '',
                  productId: product.id || product.productId,
                  productTitle: product.title || product.name || 'Без названия',
                  skuTitle: sku.title || sku.sku || sku.skuId?.toString() || '',
                  price: sku.price || product.price || 0,
                  barcode: sku.barcode || product.barcode,
                  image: sku.previewImage || product.photo || product.mainPhoto || product.image,
                  previewImage: sku.previewImage,
                  stock: sku.stock || sku.quantity || product.stock || 0,
                });
              }
            }
          }
        }
        
        setPrices(priceItems);
      }
    } catch (error) {
      console.error('Error loading prices:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePriceChange(sku: string, value: string) {
    const numValue = parseFloat(value) || 0;
    setEditedPrices(prev => ({
      ...prev,
      [sku]: numValue
    }));
  }

  function handleQuickChange(sku: string, currentPrice: number, delta: number) {
    const newPrice = Math.max(0, currentPrice + delta);
    setEditedPrices(prev => ({
      ...prev,
      [sku]: newPrice
    }));
  }

  function handleReset() {
    setEditedPrices({});
  }

  async function handleUpdateAll() {
    if (Object.keys(editedPrices).length === 0) {
      alert(t.noChanges);
      return;
    }

    setUpdating(true);
    try {
      const updates = Object.entries(editedPrices).map(([sku, price]) => ({
        sku: sku,
        price: price
      }));

      console.log('💰 [UzumPrices] Updating prices:', updates);

      const result = await updateProductPrices(token, shopId, updates);
      
      if (result.success) {
        alert(t.updated);
        setEditedPrices({});
        await loadPrices();
      } else {
        alert(t.error + ': ' + result.error);
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      alert(t.error);
    } finally {
      setUpdating(false);
    }
  }

  const filteredPrices = prices.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.skuTitle.toLowerCase().includes(query) ||
      item.productTitle.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.barcode?.toLowerCase().includes(query)
    );
  });

  const hasChanges = Object.keys(editedPrices).length > 0;

  if (loading) {
    return <SmartLoader type="general" />;
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1C2D 0%, var(--accent-success) 50%, #10B981 100%)',
        padding: '24px 20px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FiDollarSign size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            {t.title}
          </h1>
        </div>

        {/* Stats */}
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
            {filteredPrices.length}
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
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-success)'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Changes Indicator */}
        {hasChanges && (
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-success) 0%, #10B981 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiCheckCircle size={24} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>
                  {t.changesSaved}: {Object.keys(editedPrices).length}
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
                  color: 'var(--accent-success)',
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

        {/* Price Items List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: '100px', // Отступ для нижней навигации
        }}>
          {filteredPrices.map((item) => {
            const hasEdit = editedPrices[item.sku] !== undefined;
            const displayPrice = hasEdit ? editedPrices[item.sku] : item.price;

            return (
              <div
                key={item.sku}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: hasEdit 
                    ? '0 4px 16px rgba(34, 197, 94, 0.2)' 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  border: hasEdit ? '2px solid var(--accent-success)' : '2px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Indicator */}
                {hasEdit && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'var(--accent-success)',
                  }} />
                )}

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
                        SKU: {item.sku}
                      </span>
                      {item.barcode && (
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: '#e0e7ff',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#4338ca',
                          fontFamily: 'monospace',
                          border: '1px solid #c7d2fe',
                        }}>
                          📊 {item.barcode}
                        </span>
                      )}
                      {item.stock !== undefined && (
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: item.stock > 0 ? '#d1fae5' : '#fee2e2',
                          color: item.stock > 0 ? '#065f46' : '#991b1b',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}>
                          {t.stock}: {item.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Controls */}
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
                      onClick={() => handleQuickChange(item.sku, displayPrice, 10000)}
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
                      +10k
                    </button>
                    <button
                      onClick={() => handleQuickChange(item.sku, displayPrice, -10000)}
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
                      -10k
                    </button>
                  </div>

                  {/* Current Price */}
                  <div style={{ 
                    textAlign: 'center', 
                    flex: 1,
                    padding: '8px',
                    background: 'white',
                    borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: '600' }}>
                      {t.currentPrice}
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'var(--accent-success)',
                      lineHeight: '1',
                    }}>
                      {item.price.toLocaleString()} ₸
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ fontSize: '24px', color: '#d1d5db', fontWeight: '700' }}>→</div>

                  {/* New Price Input */}
                  <div style={{ flex: 1.2 }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#9ca3af', 
                      marginBottom: '6px', 
                      textAlign: 'center',
                      fontWeight: '600',
                    }}>
                      {t.newPrice}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={displayPrice}
                      onChange={(e) => handlePriceChange(item.sku, e.target.value)}
                      placeholder={t.enterPrice}
                      style={{
                        width: '100%',
                        padding: '12px 8px',
                        fontSize: '18px',
                        fontWeight: '700',
                        textAlign: 'center',
                        border: hasEdit ? '3px solid var(--accent-success)' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        outline: 'none',
                        background: 'white',
                        color: '#111',
                        boxShadow: hasEdit ? '0 0 0 3px rgba(34,197,94,0.1)' : 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-success)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.1)';
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

        {filteredPrices.length === 0 && (
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
