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
      statusColor = '#10b981';
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
      padding: '16px',
      background: `linear-gradient(135deg, ${statusColor}15, ${statusColor}08)`,
      border: `2px solid ${statusColor}40`,
      borderRadius: '16px',
      marginBottom: '16px',
    }}>
      {/* Заголовок с иконкой статуса */}
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
          <span style={{ fontSize: '32px' }}>🛒</span>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 900,
              color: '#111',
              marginBottom: '2px',
            }}>
              {t.title}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: statusColor,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>{statusIcon}</span>
              {statusLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Описание */}
      <div style={{
        fontSize: '13px',
        color: 'rgba(0,0,0,0.65)',
        marginBottom: '12px',
        lineHeight: '1.5',
      }}>
        {description}
      </div>

      {/* Кнопки действия */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {showConnectBtn && (
          <button
            onClick={onConnect}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: statusColor,
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all .2s',
              boxShadow: `0 4px 12px ${statusColor}40`,
              flex: '1',
              minWidth: '120px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${statusColor}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${statusColor}40`;
            }}
          >
            {t.connect}
          </button>
        )}
        {showOpenBtn && (
          <button
            onClick={onOpen}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: statusColor,
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all .2s',
              boxShadow: `0 4px 12px ${statusColor}40`,
              flex: '1',
              minWidth: '120px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${statusColor}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${statusColor}40`;
            }}
          >
            {t.open} →
          </button>
        )}
      </div>
    </div>
  );
}
