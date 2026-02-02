import { useState, useEffect } from 'react';
import { getShops, getProducts, getProductDetails, updateProductPrices } from '../../lib/uzum-api';
import SmartLoader from '../SmartLoader';

interface UzumProductsProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
}

export default function UzumProducts({ lang, token, onNavigateBack, onNavigateHome }: UzumProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // SKU модальное окно
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [productSkus, setProductSkus] = useState<any[]>([]);
  const [loadingSkus, setLoadingSkus] = useState(false);
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editingSkuPrice, setEditingSkuPrice] = useState<string>('');
  const [savingSkuPrice, setSavingSkuPrice] = useState<string | null>(null);
  
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

  // Открыть модальное окно со списком SKU
  async function openSkuModal(product: any) {
    if (!shopId) return;
    
    setSelectedProduct(product);
    setShowSkuModal(true);
    setLoadingSkus(true);
    
    try {
      const productId = product.id || product.productId;
      
      console.log('📦 [openSkuModal] Opening modal for product:', {
        productId,
        sku: product.sku,
        title: product.title
      });
      
      // Сначала пытаемся получить детали продукта через API
      const result = await getProductDetails(token, shopId, productId);
      
      console.log('📦 [openSkuModal] getProductDetails result:', result);
      
      let foundSkus: any[] = [];
      
      if (result.success && result.skus && result.skus.length > 0) {
        foundSkus = result.skus;
        console.log('📦 [openSkuModal] Using SKUs from API:', foundSkus.length);
      } else {
        // Альтернатива: ищем все SKU для этого productId в списке продуктов
        const relatedProducts = products.filter(p => {
          const pId = p.id || p.productId;
          return pId === productId;
        });
        
        console.log('📦 [openSkuModal] Related products found:', relatedProducts.length);
        
        if (relatedProducts.length > 1) {
          // Несколько продуктов с одним productId = это разные SKU
          foundSkus = relatedProducts.map(p => ({
            sku: p.sku,
            skuId: p.sku,
            price: p.price,
            stock: p.stock || p.quantity || 0,
            barcode: p.barcode,
            title: p.title || p.name,
            productId: p.id || p.productId
          }));
          console.log('📦 [openSkuModal] Using SKUs from products list:', foundSkus.length);
        } else {
          // Единственный продукт - создаем один SKU
          foundSkus = [{
            sku: product.sku,
            skuId: product.sku,
            price: product.price,
            stock: product.stock || product.quantity || 0,
            barcode: product.barcode,
            title: product.title || product.name,
            productId: product.id || product.productId
          }];
          console.log('📦 [openSkuModal] Using single SKU from product data');
        }
      }
      
      setProductSkus(foundSkus);
      console.log('📦 [openSkuModal] Final SKUs set:', foundSkus.length);
      
    } catch (error) {
      console.error('📦 [openSkuModal] Error loading SKUs:', error);
      setToast({ message: t.priceError, type: 'error' });
      // Fallback - показываем хотя бы один SKU
      setProductSkus([{
        sku: product.sku,
        skuId: product.sku,
        price: product.price,
        stock: product.stock || product.quantity || 0,
        barcode: product.barcode,
        title: product.title || product.name,
        productId: product.id || product.productId
      }]);
    } finally {
      setLoadingSkus(false);
    }
  }

  // Закрыть модальное окно SKU
  function closeSkuModal() {
    setShowSkuModal(false);
    setSelectedProduct(null);
    setProductSkus([]);
    setEditingSkuId(null);
    setEditingSkuPrice('');
  }

  // Начать редактирование цены SKU
  function startEditSkuPrice(skuItem: any) {
    const skuId = skuItem.sku || skuItem.skuId;
    setEditingSkuId(skuId);
    setEditingSkuPrice(skuItem.price?.toString() || '');
  }

  // Отмена редактирования SKU
  function cancelEditSkuPrice() {
    setEditingSkuId(null);
    setEditingSkuPrice('');
  }

  // Сохранение цены SKU
  async function saveSkuPrice(skuItem: any) {
    const newPrice = parseFloat(editingSkuPrice);
    
    // Валидация
    if (isNaN(newPrice) || newPrice < 0) {
      setToast({ message: t.invalidPrice, type: 'error' });
      return;
    }

    const skuId = skuItem.sku || skuItem.skuId;
    setSavingSkuPrice(skuId);

    try {
      if (!shopId) {
        throw new Error('Shop ID not found');
      }
      
      // Вызов API для обновления цены
      const result = await updateProductPrices(token, shopId, [
        { sku: skuId, price: newPrice }
      ]);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update price');
      }
      
      // Обновляем локально в списке SKU
      const updatedSkus = productSkus.map(s => {
        const sId = s.sku || s.skuId;
        return sId === skuId ? { ...s, price: newPrice } : s;
      });
      setProductSkus(updatedSkus);
      
      // Обновляем в списке продуктов
      const updatedProducts = products.map(p => {
        if (p.sku === skuId) {
          return { ...p, price: newPrice };
        }
        return p;
      });
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      
      setToast({ message: t.priceUpdated, type: 'success' });
      setEditingSkuId(null);
    } catch (error) {
      console.error('SKU price update error:', error);
      setToast({ message: t.priceError, type: 'error' });
    } finally {
      setSavingSkuPrice(null);
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
              
              {/* Price Section - кнопка для открытия SKU */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                {/* Цена - главный элемент */}
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  flex: 1,
                }}>
                  {product.price ? formatPrice(product.price) : 'N/A'}
                </div>
                {/* Кнопка редактирования - открывает модальное окно со SKU */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openSkuModal(product);
                  }}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'var(--accent-warning-bg)',
                    color: 'var(--accent-warning)',
                    border: `1px solid var(--accent-warning-border)`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-warning)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-warning-bg)';
                    e.currentTarget.style.color = 'var(--accent-warning)';
                  }}
                >
                  ✏️ {t.editPrice}
                </button>
              </div>
              
              {/* Stock - вторичный индикатор */}
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

      {/* SKU Modal - для редактирования цен */}
      {showSkuModal && selectedProduct && (
        <div
          onClick={closeSkuModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="cardCream"
            style={{
              maxWidth: '700px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%',
            }}
          >
            {/* Header */}
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid var(--border-primary)',
            }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                {selectedProduct.title || selectedProduct.name || 'Продукт'}
              </h3>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>ID: {selectedProduct.id || selectedProduct.productId}</span>
                <span>•</span>
                <span>SKU: {selectedProduct.sku}</span>
              </div>
            </div>

            {/* SKU List */}
            {loadingSkus ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <div>Загрузка SKU...</div>
              </div>
            ) : productSkus.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                <div>SKU не найдены</div>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                {productSkus.map((skuItem: any) => {
                  const skuId = skuItem.sku || skuItem.skuId;
                  const isEditing = editingSkuId === skuId;
                  const isSaving = savingSkuPrice === skuId;
                  
                  return (
                    <div
                      key={skuId}
                      style={{
                        padding: '16px',
                        backgroundColor: isEditing ? 'var(--accent-warning-bg)' : 'var(--bg-secondary)',
                        borderRadius: '12px',
                        marginBottom: '12px',
                        border: `2px solid ${isEditing ? 'var(--accent-warning)' : 'var(--border-primary)'}`,
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* SKU Info */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '4px',
                          }}>
                            {skuItem.title || skuId}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}>
                            SKU: {skuId}
                          </div>
                          {skuItem.barcode && (
                            <div style={{
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                            }}>
                              Штрихкод: {skuItem.barcode}
                            </div>
                          )}
                        </div>
                        
                        {/* Stock Badge */}
                        {skuItem.stock !== undefined && (
                          <div style={{
                            padding: '4px 10px',
                            backgroundColor: skuItem.stock > 0 ? 'var(--accent-success-bg)' : 'var(--accent-danger-bg)',
                            color: skuItem.stock > 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}>
                            {t.stock}: {skuItem.stock}
                          </div>
                        )}
                      </div>

                      {/* Price Editor */}
                      {!isEditing ? (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}>
                            {skuItem.price ? formatPrice(skuItem.price) : 'N/A'}
                          </div>
                          <button
                            onClick={() => startEditSkuPrice(skuItem)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: 'var(--accent-warning)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            ✏️ {t.editPrice}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '8px',
                          }}>
                            <input
                              type="number"
                              value={editingSkuPrice}
                              onChange={(e) => setEditingSkuPrice(e.target.value)}
                              placeholder={t.enterNewPrice}
                              autoFocus
                              disabled={isSaving}
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                fontSize: '16px',
                                fontWeight: 600,
                                border: '2px solid var(--accent-warning)',
                                borderRadius: '8px',
                                outline: 'none',
                                backgroundColor: 'white',
                                color: 'var(--text-primary)',
                              }}
                            />
                            <button
                              onClick={() => saveSkuPrice(skuItem)}
                              disabled={isSaving || !editingSkuPrice}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: isSaving || !editingSkuPrice ? '#e5e7eb' : 'var(--accent-success)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: isSaving || !editingSkuPrice ? 'not-allowed' : 'pointer',
                                minWidth: '80px',
                              }}
                            >
                              {isSaving ? '⏳' : '✓ ' + t.savePrice}
                            </button>
                            <button
                              onClick={cancelEditSkuPrice}
                              disabled={isSaving}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                              }}
                            >
                              × {t.cancel}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={closeSkuModal}
              className="btnPrimary"
              style={{ width: '100%' }}
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
