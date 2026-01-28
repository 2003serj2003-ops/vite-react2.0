import { useState, useEffect } from 'react';
import { getShops, getProducts } from '../../lib/uzum-api';

interface UzumProductsProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export default function UzumProducts({ lang, token, onNavigateBack, onNavigateHome }: UzumProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        const shopId = shopsResult.shops[0].id;
        const productsResult = await getProducts(token, shopId);
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
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ fontSize: '16px', color: '#6b7280' }}>
          {t.loading}
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="list">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button
            onClick={onNavigateBack}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            ← {t.back}
          </button>
          <button
            onClick={onNavigateHome}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            🏠
          </button>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#111',
          }}>
            📦 {t.title}
          </div>
        </div>
        <div style={{
          padding: '6px 12px',
          backgroundColor: '#7c3aed',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          {filteredProducts.length}
        </div>
      </div>

      {/* Search */}
      <div className="cardCream" style={{ marginBottom: '12px' }}>
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
        <div className="cardCream" style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#999',
        }}>
          📭 {t.noProducts}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
        }}>
          {filteredProducts.map((product: any) => {
            const images = getProductImages(product);
            const firstImage = images[0];
            
            return (
            <div
              key={product.id || product.productId || product.sku}
              onClick={() => {
                setSelectedProduct(product);
                setCurrentImageIndex(0);
              }}
              className="cardCream"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
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

              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#111',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {product.title || product.name || 'Без названия'}
              </div>
              
              {/* Product ID */}
              {(product.id || product.productId) && (
                <div style={{
                  fontSize: '11px',
                  color: '#999',
                  marginBottom: '4px',
                }}>
                  ID: {product.id || product.productId}
                </div>
              )}
              
              {/* SKU */}
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '8px',
              }}>
                {t.sku}: {product.sku || 'N/A'}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#7c3aed',
                }}>
                  {product.price ? formatPrice(product.price) : 'N/A'}
                </div>
                {product.stock !== undefined && (
                  <div style={{
                    padding: '2px 8px',
                    backgroundColor: product.stock > 0 ? '#dcfce7' : '#fee2e2',
                    color: product.stock > 0 ? '#166534' : '#991b1b',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    {product.stock}
                  </div>
                )}
              </div>
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
                              backgroundColor: idx === currentImageIndex ? '#7c3aed' : '#d1d5db',
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
                  color: '#7c3aed',
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
    </div>
  );
}
