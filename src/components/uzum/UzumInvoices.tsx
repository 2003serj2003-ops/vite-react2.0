import { useState, useEffect } from 'react';
import { getShops, getShopInvoices, getShopInvoiceProducts, getShopReturns, getShopReturnDetails } from '../../lib/uzum-api';
import CoolLoader from '../CoolLoader';

interface UzumInvoicesProps {
  lang: 'ru' | 'uz';
  token: string;
}

type TabType = 'invoices' | 'returns';

export default function UzumInvoices({ lang, token }: UzumInvoicesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceProducts, setInvoiceProducts] = useState<any[]>([]);
  const [returnDetails, setReturnDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [shopId, setShopId] = useState<number | null>(null);

  const T = {
    ru: {
      title: 'Накладные',
      invoices: 'Накладные поставки',
      returns: 'Накладные возврата',
      loading: 'Загрузка...',
      noInvoices: 'Накладные не найдены',
      noReturns: 'Возвраты не найдены',
      invoiceNumber: 'Накладная №',
      returnNumber: 'Возврат №',
      date: 'Дата',
      status: 'Статус',
      totalItems: 'Товаров',
      viewDetails: 'Подробнее',
      hideDetails: 'Скрыть',
      products: 'Товары в накладной',
      productName: 'Наименование',
      quantity: 'Количество',
      price: 'Цена',
      total: 'Сумма',
      loadingDetails: 'Загрузка состава...',
      errorLoading: 'Ошибка загрузки',
    },
    uz: {
      title: 'Hisob-fakturalar',
      invoices: 'Yetkazib berish hisob-fakturalari',
      returns: 'Qaytarish hisob-fakturalari',
      loading: 'Yuklanmoqda...',
      noInvoices: 'Hisob-fakturalar topilmadi',
      noReturns: 'Qaytarishlar topilmadi',
      invoiceNumber: 'Hisob-faktura №',
      returnNumber: 'Qaytarish №',
      date: 'Sana',
      status: 'Holati',
      totalItems: 'Mahsulotlar',
      viewDetails: 'Batafsil',
      hideDetails: 'Yashirish',
      products: 'Hisob-fakturadagi mahsulotlar',
      productName: 'Nomi',
      quantity: 'Miqdor',
      price: 'Narx',
      total: 'Summa',
      loadingDetails: 'Tarkib yuklanmoqda...',
      errorLoading: 'Yuklashda xatolik',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadData();
  }, [token, activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      // Get shop ID first
      const shopsResult = await getShops(token);
      if (!shopsResult.success || !shopsResult.shops?.length) {
        console.error('No shops found');
        setLoading(false);
        return;
      }

      const currentShopId = shopsResult.shops[0].id;
      setShopId(currentShopId);

      if (activeTab === 'invoices') {
        await loadInvoices(currentShopId);
      } else {
        await loadReturns(currentShopId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadInvoices(shopId: number) {
    const result = await getShopInvoices(token, shopId, { limit: 100 });
    console.log('📋 Invoices result:', result);
    if (result.success && result.invoices) {
      setInvoices(result.invoices);
    }
  }

  async function loadReturns(shopId: number) {
    const result = await getShopReturns(token, shopId, { limit: 100 });
    console.log('🔙 Returns result:', result);
    if (result.success && result.returns) {
      setReturns(result.returns);
    }
  }

  async function loadInvoiceDetails(invoiceId: string | number) {
    if (!shopId) return;
    
    setLoadingDetails(true);
    try {
      console.log('📦 [loadInvoiceDetails] Fetching products for invoice:', invoiceId);
      const result = await getShopInvoiceProducts(token, shopId, { invoiceId });
      console.log('📦 [loadInvoiceDetails] Full API response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.products) {
        console.log('📦 [loadInvoiceDetails] Products count:', result.products.length);
        if (result.products.length > 0) {
          console.log('📦 [loadInvoiceDetails] Sample product (first item):', JSON.stringify(result.products[0], null, 2));
          console.log('📦 [loadInvoiceDetails] Available keys in first product:', Object.keys(result.products[0]));
        }
        setInvoiceProducts(result.products);
      } else {
        console.warn('⚠️ [loadInvoiceDetails] No products found or error:', result.error);
        setInvoiceProducts([]);
      }
    } catch (error) {
      console.error('❌ [loadInvoiceDetails] Error loading invoice details:', error);
      setInvoiceProducts([]);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function loadReturnDetails(returnId: string | number) {
    if (!shopId) return;
    
    setLoadingDetails(true);
    try {
      const result = await getShopReturnDetails(token, shopId, returnId);
      console.log('🔙 Return details:', result);
      if (result.success && result.returnDetails) {
        setReturnDetails(result.returnDetails);
      }
    } catch (error) {
      console.error('Error loading return details:', error);
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleToggleDetails(id: string | number) {
    if (expandedId === String(id)) {
      setExpandedId(null);
      setInvoiceProducts([]);
      setReturnDetails(null);
    } else {
      setExpandedId(String(id));
      if (activeTab === 'invoices') {
        loadInvoiceDetails(id);
      } else {
        loadReturnDetails(id);
      }
    }
  }

  function formatDate(dateString: string | number): string {
    if (!dateString) return 'Нет данных';
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) return 'Неверная дата';
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
  }

  if (loading) {
    return <CoolLoader text={t.loading} />;
  }

  const currentData = activeTab === 'invoices' ? invoices : returns;

  return (
    <div className="list" style={{
      width: '100%',
      maxWidth: '100%',
    }}>
      {/* Header with Refresh */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#111',
          margin: 0,
        }}>
          {t.title}
        </h1>
        <button
          onClick={() => {
            setLoading(true);
            loadData();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--accent-success)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🔄 Обновить
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '8px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '8px',
      }}>
        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: activeTab === 'invoices' ? 'var(--accent-success)' : 'transparent',
            color: activeTab === 'invoices' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📋 {t.invoices}
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: activeTab === 'returns' ? 'var(--accent-success)' : 'transparent',
            color: activeTab === 'returns' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🔙 {t.returns}
        </button>
      </div>

      {/* List */}
      {currentData.length === 0 ? (
        <div className="cardCream" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#9ca3af',
          fontSize: '16px',
        }}>
          {activeTab === 'invoices' ? t.noInvoices : t.noReturns}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {currentData.map((item: any) => {
            const itemId = item.id || item.invoiceId || item.returnId;
            const isExpanded = expandedId === String(itemId);

            return (
              <div
                key={itemId}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  border: isExpanded ? '2px solid var(--accent-success)' : '2px solid transparent',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => handleToggleDetails(itemId)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        marginBottom: '8px',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span>
                          {activeTab === 'invoices' ? t.invoiceNumber : t.returnNumber}
                          {item.invoiceNumber || item.returnNumber || itemId}
                        </span>
                        <span style={{
                          fontSize: '16px',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}>
                          ▼
                        </span>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '8px',
                      }}>
                        {t.date}: {formatDate(item.date || item.createdAt || item.created_at)}
                      </div>
                      {item.status && (
                        <div style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: 'var(--accent-success)',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}>
                          {item.status}
                        </div>
                      )}
                    </div>
                    <div style={{
                      textAlign: 'right',
                    }}>
                      {item.totalAmount && (
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: activeTab === 'invoices' ? 'var(--accent-success)' : 'var(--accent-danger)',
                          marginBottom: '4px',
                        }}>
                          {formatPrice(item.totalAmount)}
                        </div>
                      )}
                      {item.itemsCount !== undefined && (
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7280',
                        }}>
                          {t.totalItems}: {item.itemsCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    borderTop: '2px solid #f3f4f6',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                  }}>
                    {loadingDetails ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6b7280',
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid #f3f4f6',
                          borderTopColor: 'var(--accent-success)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 12px',
                        }} />
                        {t.loadingDetails}
                      </div>
                    ) : (
                      <>
                        {activeTab === 'invoices' && invoiceProducts.length > 0 && (
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              marginBottom: '12px',
                              color: '#111827',
                            }}>
                              {t.products} ({invoiceProducts.length})
                            </div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}>
                              {invoiceProducts.map((product: any, idx: number) => {
                                // Расширенное извлечение данных с логированием
                                console.log(`📦 [Product ${idx}] Full data:`, JSON.stringify(product, null, 2));
                                
                                // Извлекаем имя продукта из возможных полей
                                const productName = 
                                  product.name || 
                                  product.title || 
                                  product.productName || 
                                  product.product_name ||
                                  product.itemName ||
                                  product.item_name ||
                                  product.description ||
                                  product.sku ||
                                  product.skuTitle ||
                                  product.sku_title ||
                                  `Товар ${idx + 1}`;
                                
                                // Извлекаем количество
                                const quantity = 
                                  product.quantity || 
                                  product.amount || 
                                  product.qty || 
                                  product.count ||
                                  product.itemQuantity ||
                                  product.item_quantity ||
                                  product.orderedQuantity ||
                                  product.ordered_quantity ||
                                  0;
                                
                                // Извлекаем цену
                                const price = 
                                  product.price || 
                                  product.unitPrice || 
                                  product.unit_price ||
                                  product.sellPrice || 
                                  product.sell_price ||
                                  product.purchasePrice ||
                                  product.purchase_price ||
                                  product.itemPrice ||
                                  product.item_price ||
                                  0;
                                
                                // Извлекаем общую стоимость
                                const totalPrice = 
                                  product.totalPrice || 
                                  product.total_price ||
                                  product.total || 
                                  product.totalAmount ||
                                  product.total_amount ||
                                  product.summa ||
                                  (price * quantity) || 
                                  0;
                                
                                console.log(`📦 [Product ${idx}] Extracted:`, {
                                  productName,
                                  quantity,
                                  price,
                                  totalPrice
                                });
                                
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      padding: '16px',
                                      backgroundColor: 'white',
                                      borderRadius: '12px',
                                      border: '2px solid #e5e7eb',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      gap: '16px',
                                      flexWrap: 'wrap',
                                    }}>
                                      <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{
                                          fontWeight: '700',
                                          marginBottom: '8px',
                                          color: '#111827',
                                          fontSize: '15px',
                                        }}>
                                          {productName}
                                        </div>
                                        <div style={{
                                          fontSize: '14px',
                                          color: '#6b7280',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                        }}>
                                          <span style={{
                                            padding: '4px 12px',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '6px',
                                            fontWeight: '600',
                                          }}>
                                            {t.quantity}: {quantity}
                                          </span>
                                        </div>
                                      </div>
                                      <div style={{
                                        textAlign: 'right',
                                      }}>
                                        {price > 0 && (
                                          <div style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: 'var(--accent-success)',
                                            marginBottom: '4px',
                                          }}>
                                            {formatPrice(price)}
                                          </div>
                                        )}
                                        {totalPrice > 0 && totalPrice !== price && (
                                          <div style={{
                                            fontSize: '14px',
                                            color: '#6b7280',
                                            fontWeight: '600',
                                          }}>
                                            {t.total}: {formatPrice(totalPrice)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {activeTab === 'returns' && returnDetails && (
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              marginBottom: '12px',
                              color: '#111827',
                            }}>
                              {t.products}
                            </div>
                            <div style={{
                              padding: '16px',
                              backgroundColor: 'white',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                            }}>
                              <pre style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#374151',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}>
                                {JSON.stringify(returnDetails, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {activeTab === 'invoices' && invoiceProducts.length === 0 && !loadingDetails && (
                          <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#9ca3af',
                          }}>
                            {t.noInvoices}
                          </div>
                        )}

                        {activeTab === 'returns' && !returnDetails && !loadingDetails && (
                          <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#9ca3af',
                          }}>
                            {t.noReturns}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
