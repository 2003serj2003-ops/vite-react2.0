import { useState, useEffect } from 'react';
import { getIntegrationStatus, disconnectIntegration, checkIntegrationHealth, type IntegrationStatus } from '../lib/integration-api';

interface ProfileProps {
  lang: 'ru' | 'uz';
  onNavigateBack?: () => void;
  onNavigateToUzum?: () => void;
}

export default function Profile({ lang, onNavigateBack, onNavigateToUzum }: ProfileProps) {
  const [, setLoading] = useState(true);
  const [uzumStatus, setUzumStatus] = useState<IntegrationStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Get Telegram user data
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const firstName = tgUser?.first_name || 'User';
  const lastName = tgUser?.last_name || '';
  const username = tgUser?.username || '';
  const userId = tgUser?.id || 0;
  const photoUrl = (tgUser as any)?.photo_url;

  const t = lang === 'ru' ? {
    passport: 'ПАСПОРТ',
    title: 'Профиль пользователя',
    back: 'Назад',
    surname: 'Фамилия',
    name: 'Имя',
    username: 'Username',
    userId: 'ID пользователя',
    integrations: 'ВИЗЫ',
    visa: 'ВИЗА',
    uzum: 'UZUM Market',
    provider: 'Провайдер',
    status: 'Статус',
    connected: 'АКТИВНА',
    disconnected: 'НЕ ПОДКЛЮЧЕНА',
    error: 'ОШИБКА',
    validFrom: 'Действительна с',
    shops: 'Магазинов',
    tokenLast4: 'Токен',
    checkConnection: 'Проверить',
    disconnect: 'Аннулировать',
    reconnect: 'Получить визу',
    checking: 'Проверка...',
    disconnectConfirm: 'Аннулировать визу UZUM?',
    disconnectSuccess: 'Виза аннулирована',
    checkSuccess: 'Виза действительна',
    checkFailed: 'Виза недействительна',
    loading: 'Загрузка...',
    nationality: 'Гражданство',
    country: 'UZBEKISTAN',
    footer: '© 2026 Все права защищены. Powered by @CloudGrove',
  } : {
    passport: 'PASPORT',
    title: 'Foydalanuvchi profili',
    back: 'Orqaga',
    surname: 'Familiya',
    name: 'Ism',
    username: 'Username',
    userId: 'Foydalanuvchi ID',
    integrations: 'VIZALAR',
    visa: 'VIZA',
    uzum: 'UZUM Market',
    provider: 'Provayder',
    status: 'Holat',
    connected: 'FAOL',
    disconnected: 'ULANMAGAN',
    error: 'XATO',
    validFrom: 'Amal qiladi',
    shops: 'Do\'konlar',
    tokenLast4: 'Token',
    checkConnection: 'Tekshirish',
    disconnect: 'Bekor qilish',
    reconnect: 'Viza olish',
    checking: 'Tekshirilmoqda...',
    disconnectConfirm: 'UZUM vizasini bekor qilish?',
    disconnectSuccess: 'Viza bekor qilindi',
    checkSuccess: 'Viza haqiqiy',
    checkFailed: 'Viza noto\'g\'ri',
    loading: 'Yuklanmoqda...',
    nationality: 'Fuqarolik',
    country: 'O\'ZBEKISTON',
    footer: '© 2026 Barcha huquqlar himoyalangan. Powered by @CloudGrove ',
  };

  useEffect(() => {
    loadStatus();
    
    // Слушаем события подключения интеграции
    const handleIntegrationUpdate = () => {
      console.log('[Profile] Integration updated, reloading status...');
      loadStatus();
    };
    
    window.addEventListener('uzum-integration-updated', handleIntegrationUpdate);
    
    return () => {
      window.removeEventListener('uzum-integration-updated', handleIntegrationUpdate);
    };
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

  return (
    <div style={{
      minHeight: '100vh',
      maxHeight: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      paddingBottom: '100px', // Отступ для bottomBar
      // Скрываем скроллбар
      scrollbarWidth: 'none', // Firefox
      msOverflowStyle: 'none', // IE and Edge
    }} className="profile-container">
      {/* Passport Cover */}
      <div style={{
        maxWidth: '420px',
        margin: '0 auto',
        backgroundColor: '#8B0000',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '2px solid #A52A2A',
      }}>
        {/* Back Button */}
        <button
          onClick={onNavigateBack}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
            fontWeight: 600,
          }}
        >
          ← {t.back}
        </button>

        {/* Passport Header */}
        <div style={{
          textAlign: 'center',
          borderBottom: '2px solid rgba(255,255,255,0.3)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 600,
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            {t.country}
          </div>
          <div style={{
            fontSize: '24px',
            color: 'white',
            fontWeight: 700,
            letterSpacing: '4px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}>
            {t.passport}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
            marginTop: '4px',
            letterSpacing: '1px',
          }}>
            TELEGRAM MINI APP
          </div>
        </div>

        {/* Passport Content */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '400px',
        }}>
          {/* Photo & Name Section */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '2px solid #e5e7eb',
          }}>
            {/* Photo */}
            <div style={{
              width: '100px',
              height: '130px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '2px solid #d1d5db',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="User" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              ) : (
                <div style={{
                  fontSize: '48px',
                  color: '#9ca3af',
                }}>
                  👤
                </div>
              )}
            </div>

            {/* Personal Data */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Surname */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '9px',
                  color: '#374151',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}>
                  {t.surname.toUpperCase()}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#111',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  {lastName || '—'}
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '9px',
                  color: '#374151',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}>
                  {t.name.toUpperCase()}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#111',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  {firstName}
                </div>
              </div>

              {/* Username */}
              {username && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '9px',
                    color: '#374151',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    marginBottom: '2px',
                  }}>
                    {t.username.toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1f2937',
                  }}>
                    @{username}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User ID */}
          <div style={{
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '2px solid #e5e7eb',
          }}>
            <div style={{
              fontSize: '9px',
              color: '#374151',
              fontWeight: 600,
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}>
              {t.userId.toUpperCase()}
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#111',
              fontFamily: 'monospace',
              letterSpacing: '1px',
            }}>
              {userId}
            </div>
          </div>

          {/* Integrations / Visas Section */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#8B0000',
              letterSpacing: '2px',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e5e7eb',
            }}>
              {t.integrations}
            </div>

            {/* UZUM Visa */}
            <div style={{
              border: '3px solid ' + (uzumStatus?.connected ? '#10b981' : '#e5e7eb'),
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
              position: 'relative',
            }}>
              {/* Visa Stamp Effect - Green for connected, Red for disconnected */}
              {uzumStatus?.connected ? (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '60px',
                  height: '60px',
                  border: '3px solid #10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-15deg)',
                  opacity: 0.3,
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#10b981',
                    textAlign: 'center',
                    lineHeight: '12px',
                  }}>
                    VALID<br/>✓
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '60px',
                  height: '60px',
                  border: '3px solid #ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-15deg)',
                  opacity: 0.3,
                }}>
                  <div style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#ef4444',
                    textAlign: 'center',
                    lineHeight: '11px',
                  }}>
                    DENIED<br/>✖
                  </div>
                </div>
              )}

              {/* Visa Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <div style={{ fontSize: '32px' }}>🛍️</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '9px',
                    color: '#374151',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    marginBottom: '2px',
                  }}>
                    {t.visa}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#111',
                  }}>
                    {t.uzum}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '12px 16px',
                fontSize: '12px',
                marginBottom: '12px',
              }}>
                <div style={{ color: '#374151', fontWeight: 600 }}>{t.status}:</div>
                <div style={{
                  fontWeight: 700,
                  color: uzumStatus?.connected ? '#10b981' : uzumStatus?.status === 'error' ? '#ef4444' : '#6b7280',
                  letterSpacing: '0.5px',
                }}>
                  {uzumStatus?.connected ? t.connected : uzumStatus?.status === 'error' ? t.error : t.disconnected}
                </div>

                {uzumStatus?.connected_at && (
                  <>
                    <div style={{ color: '#374151', fontWeight: 600 }}>{t.validFrom}:</div>
                    <div style={{ fontWeight: 600, color: '#111' }}>
                      {new Date(uzumStatus.connected_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}
                    </div>
                  </>
                )}

                {uzumStatus?.shop_ids && uzumStatus.shop_ids.length > 0 && (
                  <>
                    <div style={{ color: '#374151', fontWeight: 600 }}>{t.shops}:</div>
                    <div style={{ fontWeight: 700, color: '#7c3aed' }}>
                      {uzumStatus.shop_ids.length}
                    </div>
                  </>
                )}

                {uzumStatus?.token_last4 && (
                  <>
                    <div style={{ color: '#374151', fontWeight: 600 }}>{t.tokenLast4}:</div>
                    <div style={{ fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>
                      ••••{uzumStatus.token_last4}
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '16px',
              }}>
                {uzumStatus?.connected ? (
                  <>
                    <button
                      onClick={handleCheckConnection}
                      disabled={checking}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '10px 12px',
                        backgroundColor: checking ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
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
                        minWidth: '100px',
                        padding: '10px 12px',
                        backgroundColor: disconnecting ? '#9ca3af' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: disconnecting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {t.disconnect}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onNavigateBack}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.reconnect}
                  </button>
                )}
                
                {/* Кнопка перехода к дашборду UZUM если интеграция подключена */}
                {uzumStatus?.connected && (
                  <button
                    onClick={onNavigateToUzum}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '8px',
                    }}
                  >
                    {lang === 'ru' ? '🛍️ Открыть UZUM Dashboard' : '🛍️ UZUM Dashboard ochish'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Passport Footer */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          textAlign: 'center',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.5px',
          lineHeight: '1.4',
        }}>
          <div style={{ marginBottom: '4px' }}>
            {t.footer}
          </div>
          <div style={{ opacity: 0.5 }}>
            TELEGRAM MINI APP ID: {userId}
          </div>
        </div>
      </div>
    </div>
  );
}
