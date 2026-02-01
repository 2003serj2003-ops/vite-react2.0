interface UzumStatusBlockProps {
  lang: 'ru' | 'uz';
  isConnected: boolean;
  hasData: boolean;
  onConnect: () => void;
  onOpen: () => void;
  userName?: string;
}

export default function UzumStatusBlock({ 
  lang, 
  isConnected, 
  hasData,
  onConnect, 
  onOpen,
  userName 
}: UzumStatusBlockProps) {
  const T = {
    ru: {
      title: 'Интеграция Uzum',
      notConnected: 'Не подключено',
      connectedNoData: 'Подключено (данных нет)',
      connected: 'Подключено',
      connect: 'Подключить',
      open: 'Открыть',
      description: 'Синхронизируйте свой аккаунт для доступа к заказам и аналитике',
      descriptionNoData: 'Аккаунт подключён, но данных нет',
      descriptionConnected: `Добро пожаловать, ${userName}! Управляйте заказами и финансами`,
    },
    uz: {
      title: 'Uzum Integratsiyasi',
      notConnected: 'Ulanmagan',
      connectedNoData: 'Ulangan (malumot yo\'q)',
      connected: 'Ulangan',
      connect: 'Ulaning',
      open: 'Ochish',
      description: 'Buyurtmalar va tahlilga kirish uchun hisobingizni sinxronizatsiya qiling',
      descriptionNoData: 'Hisob ulangan, lekin malumot yo\'q',
      descriptionConnected: `Xush kelibsiz, ${userName}! Buyurtmalar va moliyani boshqaring`,
    },
  };

  const t = T[lang];

  let statusColor = '#ef4444';
  let statusLabel = t.notConnected;
  let statusIcon = '❌';
  let description = t.description;
  let showConnectBtn = true;
  let showOpenBtn = false;

  if (isConnected) {
    if (hasData) {
      statusColor = '#4CAF50';
      statusLabel = t.connected;
      statusIcon = '✅';
      description = t.descriptionConnected;
      showConnectBtn = false;
      showOpenBtn = true;
    } else {
      statusLabel = t.connectedNoData;
      statusIcon = '⏳';
      description = t.descriptionNoData;
      showConnectBtn = false;
      showOpenBtn = true;
    }
  }

  return (
    <div style={{
      position: 'relative',
      padding: '24px',
      background: isConnected && hasData 
        ? 'linear-gradient(135deg, #4CAF5010 0%, #34d39920 100%)'
        : isConnected 
        ? 'linear-gradient(135deg, #FF9F1C10 0%, #fbbf2420 100%)'
        : 'linear-gradient(135deg, #ef444410 0%, #f8717120 100%)',
      border: `2px solid ${statusColor}30`,
      borderRadius: '20px',
      marginBottom: '20px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: isConnected && hasData 
        ? '0 8px 24px rgba(76,175,80, 0.12)'
        : '0 4px 16px rgba(0, 0, 0, 0.08)',
    }}>
      {/* Decorative background pattern */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: `${statusColor}15`,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      {/* Заголовок с иконкой статуса */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}>
            🛒
          </div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 900,
              color: '#111',
              marginBottom: '6px',
              letterSpacing: '-0.3px',
            }}>
              {t.title}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              color: statusColor,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <span style={{ fontSize: '16px' }}>{statusIcon}</span>
              {statusLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Описание */}
      <div style={{
        fontSize: '14px',
        color: '#4b5563',
        marginBottom: '20px',
        lineHeight: '1.6',
        position: 'relative',
        zIndex: 1,
      }}>
        {description}
      </div>

      {/* Кнопки действия */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
      }}>
        {showConnectBtn && (
          <button
            onClick={onConnect}
            style={{
              padding: '14px 24px',
              borderRadius: '14px',
              border: 'none',
              background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 4px 16px ${statusColor}50`,
              flex: '1',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${statusColor}70`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px ${statusColor}50`;
            }}
          >
            <span>🔗</span>
            {t.connect}
          </button>
        )}
        {showOpenBtn && (
          <button
            onClick={onOpen}
            style={{
              padding: '14px 24px',
              borderRadius: '14px',
              border: 'none',
              background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 4px 16px ${statusColor}50`,
              flex: '1',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${statusColor}70`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px ${statusColor}50`;
            }}
          >
            {t.open}
            <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
