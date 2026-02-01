import { useState, useEffect } from 'react';
import { getIntegrationStatus, disconnectIntegration, checkIntegrationHealth, type IntegrationStatus } from '../lib/integration-api';

interface ProfileProps {
  lang: 'ru' | 'uz';
  onNavigateBack: () => void;
}

export default function Profile({ lang, onNavigateBack }: ProfileProps) {
  const [loading, setLoading] = useState(true);
  const [uzumStatus, setUzumStatus] = useState<IntegrationStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const t = lang === 'ru' ? {
    title: 'Профиль',
    back: 'Назад',
    integrations: 'Интеграции',
    uzum: 'UZUM Market',
    connected: 'Подключено',
    disconnected: 'Не подключено',
    error: 'Ошибка',
    connectedAt: 'Подключено',
    shops: 'Магазины',
    tokenLast4: 'Токен',
    checkConnection: 'Проверить подключение',
    disconnect: 'Отключить',
    reconnect: 'Переподключить',
    checking: 'Проверка...',
    disconnectConfirm: 'Отключить интеграцию UZUM?',
    disconnectSuccess: 'Интеграция отключена',
    checkSuccess: 'Подключение работает',
    checkFailed: 'Ошибка подключения',
    loading: 'Загрузка...',
  } : {
    title: 'Profil',
    back: 'Orqaga',
    integrations: 'Integratsiyalar',
    uzum: 'UZUM Market',
    connected: 'Ulangan',
    disconnected: 'Ulanmagan',
    error: 'Xato',
    connectedAt: 'Ulangan',
    shops: 'Do\'konlar',
    tokenLast4: 'Token',
    checkConnection: 'Ulanishni tekshirish',
    disconnect: 'O\'chirish',
    reconnect: 'Qayta ulash',
    checking: 'Tekshirilmoqda...',
    disconnectConfirm: 'UZUM integratsiyasini o\'chirish?',
    disconnectSuccess: 'Integratsiya o\'chirildi',
    checkSuccess: 'Ulanish ishlayapti',
    checkFailed: 'Ulanish xatosi',
    loading: 'Yuklanmoqda...',
  };

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const status = await getIntegrationStatus('uzum');
      setUzumStatus(status);
    } catch (error) {
      console.error('Failed to load integration status:', error);
      setUzumStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckConnection() {
    setChecking(true);
    try {
      await checkIntegrationHealth('uzum');
      alert(t.checkSuccess);
    } catch (error) {
      console.error('Health check failed:', error);
      alert(t.checkFailed);
    } finally {
      setChecking(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm(t.disconnectConfirm)) return;
    
    setDisconnecting(true);
    try {
      await disconnectIntegration('uzum');
      alert(t.disconnectSuccess);
      await loadStatus();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert(t.checkFailed);
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="uzum-container" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="uzum-container">
      {/* Header */}
      <div className="uzum-header">
        <button
          onClick={onNavigateBack}
          className="uzum-back-btn"
          style={{
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← {t.back}
        </button>
        <h1 className="uzum-header-title">{t.title}</h1>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Integrations Section */}
        <div className="uzum-card" style={{ marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#111',
            marginBottom: '16px',
          }}>
            {t.integrations}
          </h2>

          {/* UZUM Integration */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: `2px solid ${uzumStatus?.connected ? '#10b981' : '#e5e7eb'}`,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '32px' }}>🛍️</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>
                    {t.uzum}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: uzumStatus?.connected ? '#10b981' : '#9ca3af',
                  }}>
                    {uzumStatus?.connected ? '✅ ' + t.connected : uzumStatus?.status === 'error' ? '⚠️ ' + t.error : '❌ ' + t.disconnected}
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            {uzumStatus?.connected && (
              <div style={{
                fontSize: '13px',
                color: '#666',
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                {uzumStatus.connected_at && (
                  <div>
                    <strong>{t.connectedAt}:</strong> {new Date(uzumStatus.connected_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}
                  </div>
                )}
                {uzumStatus.shop_ids && uzumStatus.shop_ids.length > 0 && (
                  <div>
                    <strong>{t.shops}:</strong> {uzumStatus.shop_ids.length}
                  </div>
                )}
                {uzumStatus.token_last4 && (
                  <div>
                    <strong>{t.tokenLast4}:</strong> ...{uzumStatus.token_last4}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              {uzumStatus?.connected && (
                <>
                  <button
                    onClick={handleCheckConnection}
                    disabled={checking}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '10px 16px',
                      backgroundColor: checking ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: checking ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {checking ? t.checking : t.checkConnection}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '10px 16px',
                      backgroundColor: disconnecting ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: disconnecting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {t.disconnect}
                  </button>
                </>
              )}
              {!uzumStatus?.connected && (
                <button
                  onClick={onNavigateBack}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.reconnect}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
