import { useState, useEffect } from 'react';
import { getShops, getProducts } from '../../lib/uzum-api';

interface UzumProductsProps {
  lang: 'ru' | 'uz';
  token: string;
}

export default function UzumProducts({ lang, token }: UzumProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const T = {
    ru: {
      title: 'Товары',
      back: 'Назад',
      loading: 'Загрузка товаров...',
      search: 'Поиск товаров...',
      noProducts: 'Товары не найдены',
      sku: 'Артикул',
      price: 'Цена',
      stock: 'Остаток',
      status: 'Статус',
      details: 'Подробнее',
      close: 'Закрыть',
      category: 'Категория',
      description: 'Описание',
      active: 'Активен',
      inactive: 'Неактивен',
    },
    uz: {
      title: 'Mahsulotlar',
      back: 'Orqaga',
      loading: 'Mahsulotlar yuklanmoqda...',
      search: 'Mahsulotlarni qidirish...',
      noProducts: 'Mahsulotlar topilmadi',
      sku: 'Artikul',
      price: 'Narxi',
      stock: 'Qoldiq',
      status: 'Holati',
      details: 'Batafsil',
      close: 'Yopish',
      category: 'Kategoriya',
      description: 'Tavsif',
      active: 'Faol',
      inactive: 'Nofaol',
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
      if (shopsResult.success && shopsResult.shops && shopsResult.shops.length > 0) {
        const shopId = shopsResult.shops[0].id;
        const productsResult = await getProducts(token, shopId);
        
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
          fontSize: '18px',
          fontWeight: 700,
          color: '#111',
        }}>
          📦 {t.title}
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
          {filteredProducts.map((product: any) => (
            <div
              key={product.id || product.sku}
              onClick={() => setSelectedProduct(product)}
              className="cardCream"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* Product Image or Placeholder */}
              {product.photo ? (
                <img
                  src={product.photo}
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
          ))}
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
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%',
            }}
          >
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
              <div style={{ color: '#666' }}>
                <strong style={{ color: '#111' }}>{t.sku}:</strong> {selectedProduct.sku || 'N/A'}
              </div>
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
