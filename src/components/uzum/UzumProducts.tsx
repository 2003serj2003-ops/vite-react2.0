import { useState, useEffect } from 'react';
import { getShops, getProducts } from '../../lib/uzum-api';

interface UzumProductsProps {
  lang: 'ru' | 'uz';
  token: string;
  onBack: () => void;
}

export default function UzumProducts({ lang, token, onBack }: UzumProductsProps) {
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
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            ← {t.back}
          </button>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: 0,
            color: '#111827',
          }}>
            📦 {t.title}
          </h1>
        </div>
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#7c3aed',
          color: 'white',
          borderRadius: '8px',
          fontWeight: '600',
        }}>
          {filteredProducts.length}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 20px',
            fontSize: '16px',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#7c3aed';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#9ca3af',
          fontSize: '16px',
        }}>
          📭 {t.noProducts}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {filteredProducts.map((product: any) => (
            <div
              key={product.id || product.sku}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                border: '2px solid transparent',
              }}
              onClick={() => setSelectedProduct(product)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = '#7c3aed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              {/* Product Image Placeholder */}
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}>
                📦
              </div>

              {/* Product Info */}
              <div style={{ padding: '16px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {product.title || product.name || 'Без названия'}
                </h3>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '12px',
                }}>
                  {t.sku}: {product.sku || 'N/A'}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#7c3aed',
                  }}>
                    {product.price ? formatPrice(product.price) : 'N/A'}
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    backgroundColor: product.stock > 0 ? '#dcfce7' : '#fee2e2',
                    color: product.stock > 0 ? '#166534' : '#991b1b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {t.stock}: {product.stock || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                flex: 1,
              }}>
                {selectedProduct.title || selectedProduct.name}
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginLeft: '16px',
                }}
              >
                {t.close}
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}>
                  {t.sku}
                </div>
                <div style={{ fontSize: '16px' }}>
                  {selectedProduct.sku || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}>
                  {t.price}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#7c3aed',
                }}>
                  {selectedProduct.price ? formatPrice(selectedProduct.price) : 'N/A'}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}>
                  {t.stock}
                </div>
                <div style={{ fontSize: '16px' }}>
                  {selectedProduct.stock || 0} шт.
                </div>
              </div>

              {selectedProduct.barcode && (
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}>
                    Barcode
                  </div>
                  <div style={{ fontSize: '16px', fontFamily: 'monospace' }}>
                    {selectedProduct.barcode}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
