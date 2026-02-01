import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiDollarSign,
  FiFileText,
  FiBarChart2,
  FiLayers
} from 'react-icons/fi';

interface UzumNavigationProps {
  currentPage: 'dashboard' | 'products' | 'orders' | 'finance' | 'invoices' | 'reports' | 'stocks';
  onNavigate: (page: 'dashboard' | 'products' | 'orders' | 'finance' | 'invoices' | 'reports' | 'stocks') => void;
  lang: 'ru' | 'uz';
}

export default function UzumNavigation({ currentPage, onNavigate, lang }: UzumNavigationProps) {
  const T = {
    ru: {
      dashboard: 'Главная',
      products: 'Товары',
      orders: 'Заказы',
      finance: 'Финансы',
      stocks: 'Остатки',
      invoices: 'Накладные',
      reports: 'Отчеты'
    },
    uz: {
      dashboard: 'Asosiy',
      products: 'Mahsulotlar',
      orders: 'Buyurtmalar',
      finance: 'Moliya',
      stocks: 'Qoldiqlar',
      invoices: 'Hujjatlar',
      reports: 'Hisobotlar'
    }
  };

  const t = T[lang];

  const navItems = [
    { id: 'dashboard', icon: FiHome, label: t.dashboard, color: '#1E6FDB' },
    { id: 'products', icon: FiPackage, label: t.products, color: 'var(--accent-warning)' },
    { id: 'orders', icon: FiShoppingCart, label: t.orders, color: 'var(--accent-success)' },
    { id: 'finance', icon: FiDollarSign, label: t.finance, color: 'var(--accent-success)' },
    { id: 'stocks', icon: FiLayers, label: t.stocks, color: '#9333EA' },
    { id: 'invoices', icon: FiFileText, label: t.invoices, color: '#1E6FDB' },
    { id: 'reports', icon: FiBarChart2, label: t.reports, color: '#3FA9F5' },
  ] as const;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border-primary)',
      padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
      display: 'flex',
      justifyContent: 'space-around',
      gap: '4px',
      zIndex: 100,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
    }}>
      {navItems.map((item) => {
        const isActive = currentPage === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 4px',
              border: 'none',
              borderRadius: '12px',
              backgroundColor: isActive ? `${item.color}15` : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32px',
                height: '3px',
                backgroundColor: item.color,
                borderRadius: '0 0 3px 3px',
              }} />
            )}

            {/* Icon */}
            <div style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              backgroundColor: isActive ? item.color : 'transparent',
              transition: 'all 0.2s',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}>
              <Icon 
                size={18} 
                color={isActive ? 'white' : 'var(--text-secondary)'}
                style={{ transition: 'all 0.2s' }}
              />
            </div>

            {/* Label */}
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? '700' : '500',
              color: isActive ? item.color : 'var(--text-secondary)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
