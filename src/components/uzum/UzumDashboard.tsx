import { useState, useEffect } from 'react';
import { getShops, getProducts, getFbsOrdersCount } from '../../lib/uzum-api';

interface UzumDashboardProps {
  lang: 'ru' | 'uz';
  token: string;
  onNavigate: (page: 'products' | 'orders' | 'finance') => void;
}

export default function UzumDashboard({ lang, token, onNavigate }: UzumDashboardProps) {
  const [shops, setShops] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  const T = {
    ru: {
      title: 'Панель управления',
      loading: 'Загрузка...',
      shops: 'Мои магазины',
      products: 'Товары',
      orders: 'Заказы',
      finance: 'Финансы',
      totalProducts: 'Всего товаров',
      activeOrders: 'Активные',
      pendingOrders: 'Ожидают',
      viewAll: 'Смотреть все',
      shop: 'Магазин',
      error: 'Ошибка загрузки данных',
    },
    uz: {
      title: 'Boshqaruv paneli',
      loading: 'Yuklanmoqda...',
      shops: 'Mening dokonlarim',
      products: 'Mahsulotlar',
      orders: 'Buyurtmalar',
      finance: 'Moliya',
      totalProducts: 'Jami mahsulotlar',
      activeOrders: 'Faol',
      pendingOrders: 'Kutilmoqda',
      viewAll: 'Barchasini korish',
      shop: 'Dokon',
      error: 'Malumotlarni yuklashda xatolik',
    },
  };

  const t = T[lang];

  useEffect(() => {
    loadDashboard();
  }, [token]);

  async function loadDashboard() {
    setLoading(true);
    try {
      // Load shops
      const shopsResult = await getShops(token);
      if (shopsResult.success && shopsResult.shops) {
        setShops(shopsResult.shops);

        // Load products for first shop
        if (shopsResult.shops.length > 0) {
          const shopId = shopsResult.shops[0].id;
          const productsResult = await getProducts(token, shopId);
          
          if (productsResult.success && productsResult.products) {
            setStats(prev => ({
              ...prev,
              totalProducts: productsResult.products?.length || 0,
            }));
          }
        }
      }

      // Load orders count
      const ordersResult = await getFbsOrdersCount(token);
      if (ordersResult.success && ordersResult.count !== undefined) {
        setStats(prev => ({
          ...prev,
          activeOrders: ordersResult.count || 0,
        }));
      }

      // Load pending orders
      const pendingResult = await getFbsOrdersCount(token, { status: 'pending' });
      if (pendingResult.success && pendingResult.count !== undefined) {
        setStats(prev => ({
          ...prev,
          pendingOrders: pendingResult.count || 0,
        }));
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        fontSize: '16px',
        color: '#6b7280',
      }}>
        🔄 {t.loading}
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Shops Section */}
      {shops.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#111827',
          }}>
            {t.shops}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {shops.map((shop: any) => (
              <div
                key={shop.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '2px solid #f3f4f6',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(111,0,255,0.15)';
                  e.currentTarget.style.borderColor = '#7c3aed';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#f3f4f6';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '16px',
                }}>
                  🏪
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#111827',
                }}>
                  {shop.name}
                </h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  margin: 0,
                }}>
                  ID: {shop.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {/* Products Card */}
        <div
          onClick={() => onNavigate('products')}
          style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(124,58,237,0.15)';
            e.currentTarget.style.borderColor = '#7c3aed';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#7c3aed',
            marginBottom: '8px',
          }}>
            {stats.totalProducts}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '12px',
          }}>
            {t.totalProducts}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#7c3aed',
            fontWeight: '500',
          }}>
            {t.viewAll} →
          </div>
        </div>

        {/* Orders Card */}
        <div
          onClick={() => onNavigate('orders')}
          style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(34,197,94,0.15)';
            e.currentTarget.style.borderColor = '#22c55e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#22c55e',
            marginBottom: '8px',
          }}>
            {stats.activeOrders}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '12px',
          }}>
            {t.activeOrders}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#22c55e',
            fontWeight: '500',
          }}>
            {t.viewAll} →
          </div>
        </div>

        {/* Finance Card */}
        <div
          onClick={() => onNavigate('finance')}
          style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(245,158,11,0.15)';
            e.currentTarget.style.borderColor = '#f59e0b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b',
            marginBottom: '8px',
          }}>
            {stats.pendingOrders}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '12px',
          }}>
            {t.pendingOrders}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#f59e0b',
            fontWeight: '500',
          }}>
            {t.viewAll} →
          </div>
        </div>
      </div>
    </div>
  );
}
