import { useState, useEffect } from 'react';
import { getShops, getProducts } from '../../lib/uzum-api';
import SmartLoader from '../SmartLoader';

interface UzumProductsProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
  onNavigateToPrices?: () => void;
}

export default function UzumProducts({ lang, token, onNavigateBack, onNavigateHome, onNavigateToPrices }: UzumProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [_shopId, setShopId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const T = {
    ru: {
      title: 'Товары',
      back: 'Назад',
      loading: 'Загрузка товаров...',
      search: 'Поиск товаров...',
      noProducts: 'Товары не найдены',
      sku: 'Артикул',
      productId: 'ID товара',
      price: 'Цена',
      stock: 'Остаток',
      status: 'Статус',
      details: 'Подробнее',
      close: 'Закрыть',
      category: 'Категория',
      description: 'Описание',
      active: 'Активен',
      inactive: 'Неактивен',
      barcode: 'Штрихкод',
      brand: 'Бренд',
      editPrice: 'Изменить цену',
      savePrice: 'Сохранить',
      cancel: 'Отмена',
      priceUpdated: 'Цена обновлена',
      priceError: 'Ошибка обновления цены',
      invalidPrice: 'Некорректная цена',
      enterNewPrice: 'Введите новую цену',
      updatePrices: 'Обновить цены',
    },
    uz: {
      title: 'Mahsulotlar',
      back: 'Orqaga',
      loading: 'Mahsulotlar yuklanmoqda...',
      search: 'Mahsulotlarni qidirish...',
      noProducts: 'Mahsulotlar topilmadi',
      sku: 'Artikul',
      productId: 'Mahsulot ID',
      price: 'Narxi',
      stock: 'Qoldiq',
      status: 'Holati',
      details: 'Batafsil',
      close: 'Yopish',
      category: 'Kategoriya',
      description: 'Tavsif',
      active: 'Faol',
      inactive: 'Nofaol',
      barcode: 'Shtrix-kod',
      brand: 'Brend',
      editPrice: 'Narxni o\'zgartirish',
      savePrice: 'Saqlash',
      cancel: 'Bekor qilish',
      priceUpdated: 'Narx yangilandi',
      priceError: 'Narxni yangilashda xatolik',
      invalidPrice: 'Noto\'g\'ri narx',
      enterNewPrice: 'Yangi narxni kiriting',
      updatePrices: 'Narxlarni yangilash',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadProducts();
  }, [token]);

  useEffect(() => {
    // Filter products based on search query
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter((p: any) =>
          p.title?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  async function loadProducts() {
    setLoading(true);
    try {
      const shopsResult = await getShops(token);
      console.log('🏪 [Products] Shops:', shopsResult);
      if (shopsResult.success && shopsResult.shops && shopsResult.shops.length > 0) {
        const currentShopId = shopsResult.shops[0].id;
        setShopId(currentShopId);
        const productsResult = await getProducts(token, currentShopId);
        console.log('📦 [Products] Products:', productsResult);
        
        if (productsResult.success && productsResult.products) {
          setProducts(productsResult.products);
          setFilteredProducts(productsResult.products);
        }
      }
    } catch (error) {
      console.error('Products load error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Toast автоскрытие
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
  }

  // Получить массив фото товара (может быть в разных форматах)
  function getProductImages(product: any): string[] {
    const images: string[] = [];
    
    // Разные варианты структуры данных
    if (product.photos && Array.isArray(product.photos)) {
      images.push(...product.photos);
    } else if (product.images && Array.isArray(product.images)) {
      images.push(...product.images);
    } else if (product.photoLinks && Array.isArray(product.photoLinks)) {
      images.push(...product.photoLinks);
    } else if (product.mainPhoto) {
      images.push(product.mainPhoto);
    } else if (product.photo) {
      images.push(product.photo);
    } else if (product.imageUrl) {
      images.push(product.imageUrl);
    } else if (product.image) {
      images.push(product.image);
    }
    
    return images.filter(img => img && typeof img === 'string');
  }

  // Переключение фото
  function handleNextImage() {
    if (!selectedProduct) return;
    const images = getProductImages(selectedProduct);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }

  function handlePrevImage() {
    if (!selectedProduct) return;
    const images = getProductImages(selectedProduct);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  // Обработка свайпа
  let touchStartX = 0;
  let touchEndX = 0;

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        handleNextImage(); // Свайп влево - следующее фото
      } else {
        handlePrevImage(); // Свайп вправо - предыдущее фото
      }
    }
  }

  if (loading) {
    return <SmartLoader type="products" />;
  }

  return (
    <div className="uzum-container">
      {/* Header */}
      <div className="uzum-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onNavigateBack} className="uzum-btn-secondary">
            ← {window.innerWidth > 640 ? t.back : ''}
          </button>
          <button onClick={onNavigateHome} className="uzum-btn-secondary">
            🏠
          </button>
          <div style={{
            fontSize: window.innerWidth > 640 ? '18px' : '16px',
            fontWeight: 700,
            color: '#111',
          }}>
            📦 {window.innerWidth > 640 ? t.title : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {onNavigateToPrices && (
            <button
              onClick={onNavigateToPrices}
              className="uzum-btn-warning"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'var(--accent-success)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              💰 {window.innerWidth > 640 ? t.updatePrices : '💰'}
            </button>
          )}
          <button
            onClick={() => {
              setLoading(true);
              loadProducts();
            }}
            className="uzum-btn-success"
          >
            🔄 {window.innerWidth > 640 ? 'Обновить' : ''}
          </button>
          <div style={{
            padding: '6px 12px',
            backgroundColor: '#1E6FDB',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
          }}>
            {filteredProducts.length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="uzum-search">
        <input
          type="text"
          className="input"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="uzum-card" style={{
          textAlign: 'center',
          padding: window.innerWidth > 640 ? '40px 20px' : '30px 15px',
          color: '#999',
        }}>
          📭 {t.noProducts}
        </div>
      ) : (
        <div className="uzum-product-grid">
          {filteredProducts.map((product: any) => {
            const images = getProductImages(product);
            const firstImage = images[0];
            const productId = product.id || product.productId || product.sku;
            
            return (
            <div
              key={productId}
              className="cardCream"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onClick={() => {
                setSelectedProduct(product);
                setCurrentImageIndex(0);
              }}
            >
              {/* Product Image or Placeholder */}
              {firstImage ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={firstImage}
                    alt={product.title || product.name}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      backgroundColor: '#f9fafb',
                    }}
                  />
                  {images.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      📸 {images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '160px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                }}>
                  📦
                </div>
              )}

              {/* Product Title - улучшенная иерархия */}
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text-primary)',
                lineHeight: '1.4',
                minHeight: '42px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {product.title || product.name || 'Без названия'}
              </div>
              
              {/* SKU - приглушённый */}
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{ opacity: 0.7 }}>{t.sku}:</span>
                <span style={{ fontWeight: 500 }}>{product.sku || 'N/A'}</span>
              </div>
              
              {/* Price Section */}
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}>
                {product.price ? formatPrice(product.price) : 'N/A'}
              </div>
              
              {/* Stock - индикатор */}
              {product.stock !== undefined && (
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  backgroundColor: product.stock > 0 ? 'var(--accent-success-bg)' : 'var(--accent-danger-bg)',
                  color: product.stock > 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {t.stock}: {product.stock}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="cardCream"
            style={{
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%',
            }}
          >
            {/* Image Gallery */}
            {(() => {
              const images = getProductImages(selectedProduct);
              return images.length > 0 ? (
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{
                      width: '100%',
                      height: '300px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#f9fafb',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={images[currentImageIndex]}
                      alt={selectedProduct.title || selectedProduct.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                  
                  {/* Navigation Buttons */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={handleNextImage}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        →
                      </button>
                      
                      {/* Image Counter */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '4px 12px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {currentImageIndex + 1} / {images.length}
                      </div>
                      
                      {/* Dots */}
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        justifyContent: 'center',
                        marginTop: '12px',
                      }}>
                        {images.map((_, idx) => (
                          <div
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: idx === currentImageIndex ? '#1E6FDB' : '#d1d5db',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : null;
            })()}
            
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '16px',
              color: '#111',
            }}>
              {selectedProduct.title || selectedProduct.name}
            </div>
            
            <div style={{
              display: 'grid',
              gap: '8px',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              {(selectedProduct.id || selectedProduct.productId) && (
                <div style={{ color: '#666' }}>
                  <strong style={{ color: '#111' }}>{t.productId}:</strong> {selectedProduct.id || selectedProduct.productId}
                </div>
              )}
              <div style={{ color: '#666' }}>
                <strong style={{ color: '#111' }}>{t.sku}:</strong> {selectedProduct.sku || 'N/A'}
              </div>
              {selectedProduct.barcode && (
                <div style={{ color: '#666' }}>
                  <strong style={{ color: '#111' }}>{t.barcode}:</strong> {selectedProduct.barcode}
                </div>
              )}
              <div style={{ color: '#666' }}>
                <strong style={{ color: '#111' }}>{t.price}:</strong>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1E6FDB',
                  marginLeft: '8px',
                }}>
                  {selectedProduct.price ? formatPrice(selectedProduct.price) : 'N/A'}
                </span>
              </div>
              {selectedProduct.stock !== undefined && (
                <div style={{ color: '#666' }}>
                  <strong style={{ color: '#111' }}>{t.stock}:</strong> {selectedProduct.stock}
                </div>
              )}
              {selectedProduct.brand && (
                <div style={{ color: '#666' }}>
                  <strong style={{ color: '#111' }}>{t.brand}:</strong> {selectedProduct.brand}
                </div>
              )}
              {selectedProduct.category && (
                <div style={{ color: '#666' }}>
                  <strong style={{ color: '#111' }}>{t.category}:</strong> {selectedProduct.category}
                </div>
              )}
              {selectedProduct.description && (
                <div style={{ color: '#666' }}>
                  <strong style={{ color: '#111' }}>{t.description}:</strong> {selectedProduct.description}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedProduct(null)}
              className="btnPrimary"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '12px 24px',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideDown 0.3s ease',
        }}>
          {toast.type === 'success' ? '✓' : '⚠️'} {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
