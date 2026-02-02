import { useState, useEffect } from 'react';
import { getIntegrationStatus, disconnectIntegration, checkIntegrationHealth, type IntegrationStatus } from '../lib/integration-api';
import { FiShoppingCart, FiCheckCircle, FiXCircle, FiClock, FiShield } from 'react-icons/fi';
import { Theme, toggleTheme as toggleThemeUtil, getStoredTheme } from '../lib/theme';
import ThemeToggle from './ThemeToggle';

interface ProfileProps {
  lang: 'ru' | 'uz';
  onNavigateBack?: () => void;
  onNavigateToUzum?: () => void;
}

export default function Profile({ lang, onNavigateBack, onNavigateToUzum }: ProfileProps) {
  const [, setLoading] = useState(true);
  const [uzumStatus, setUzumStatus] = useState<IntegrationStatus | null>(null);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  const handleToggleTheme = () => {
    const newTheme = toggleThemeUtil();
    setTheme(newTheme);
  };
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
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #1E6FDB 0%, #1E6FDB 50%, #5B21B6 100%)',
      padding: '16px',
      paddingBottom: '100px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      <style>{`
        .profile-container::-webkit-scrollbar {
          display: none;
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: #22C55E; box-shadow: 0 0 0 0 rgba(34,197,94, 0.7); }
          50% { border-color: #22C55E; box-shadow: 0 0 0 4px rgba(34,197,94, 0); }
        }
        @keyframes pulse-border-red {
          0%, 100% { border-color: #EF4444; box-shadow: 0 0 0 0 rgba(239,68,68, 0.7); }
          50% { border-color: #EF4444; box-shadow: 0 0 0 4px rgba(239,68,68, 0); }
        }
        .valid-stamp {
          animation: pulse-border 2s ease-in-out infinite;
        }
        .denied-stamp {
          animation: pulse-border-red 2s ease-in-out infinite;
        }
        @keyframes rotate-stamp {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(-12deg); }
        }
        .stamp-seal {
          animation: rotate-stamp 3s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        {/* Header with Back Button and Theme Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: 'white',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ← {t.back}
            </button>
          )}
          
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </div>

        {/* UZUM MEMBERSHIP Passport */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
          border: '3px solid #1E6FDB',
        }}>
          {/* Passport Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1E6FDB 0%, #1E6FDB 100%)',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative Elements */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            
            <div style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <FiShoppingCart size={32} color="white" />
                <div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: 'white',
                    letterSpacing: '2px',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}>
                    UZUM
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '3px',
                  }}>
                    MEMBERSHIP
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '1px',
                marginTop: '8px',
              }}>
                SELLER INTEGRATION PASSPORT
              </div>
            </div>
          </div>

          {/* Passport Content */}
          <div style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
            padding: '24px',
          }}>
            {/* User Identity Section */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>
              {/* Photo */}
              <div style={{
                width: '100px',
                height: '130px',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '3px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
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
                    filter: 'grayscale(1) opacity(0.3)',
                  }}>
                    👤
                  </div>
                )}
                {/* Hologram Effect */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(126,34,206,0.1) 100%)',
                }} />
              </div>

              {/* Personal Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '1px',
                    marginBottom: '3px',
                  }}>
                    {t.surname.toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#111',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    {lastName || '—'}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#6b7280',
                    letterSpacing: '1px',
                    marginBottom: '3px',
                  }}>
                    {t.name.toUpperCase()}
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#111',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    {firstName}
                  </div>
                </div>

                {username && (
                  <div>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '1px',
                      marginBottom: '3px',
                    }}>
                      TELEGRAM
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#1E6FDB',
                    }}>
                      @{username}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User ID Card */}
            <div style={{
              padding: '16px 20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              marginBottom: '24px',
            }}>
              <div style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#6b7280',
                letterSpacing: '1px',
                marginBottom: '4px',
              }}>
                TELEGRAM USER ID
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 900,
                color: '#111',
                fontFamily: 'monospace',
                letterSpacing: '2px',
              }}>
                {userId}
              </div>
            </div>

            {/* VISA Section */}
            <div 
              className={uzumStatus?.connected ? 'valid-stamp' : 'denied-stamp'}
              style={{
              padding: '20px',
              background: uzumStatus?.connected 
                ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderRadius: '12px',
              border: uzumStatus?.connected ? '3px solid #22C55E' : '3px solid #EF4444',
              boxShadow: uzumStatus?.connected 
                ? '0 8px 24px rgba(34,197,94,0.35), inset 0 2px 8px rgba(34,197,94,0.15)' 
                : '0 8px 24px rgba(239,68,68,0.35), inset 0 2px 8px rgba(239,68,68,0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Watermark */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '80px',
                fontWeight: 900,
                color: uzumStatus?.connected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                letterSpacing: '6px',
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                {uzumStatus?.connected ? 'APPROVED' : 'DENIED'}
              </div>

              {/* Visa Stamp - Круглая печать */}
              <div 
                className="stamp-seal"
                style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '90px',
                height: '90px',
                border: `5px solid ${uzumStatus?.connected ? '#22C55E' : '#EF4444'}`,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-15deg)',
                background: uzumStatus?.connected 
                  ? 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 70%)' 
                  : 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 70%)',
                boxShadow: uzumStatus?.connected 
                  ? 'inset 0 0 15px rgba(34,197,94,0.3), 0 4px 12px rgba(34,197,94,0.4)'
                  : 'inset 0 0 15px rgba(239,68,68,0.3), 0 4px 12px rgba(239,68,68,0.4)',
                zIndex: 2,
              }}>
                {uzumStatus?.connected ? (
                  <>
                    <FiCheckCircle size={32} color="#22C55E" strokeWidth={3} />
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#22C55E',
                      marginTop: '4px',
                      letterSpacing: '1px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}>
                      APPROVED
                    </div>
                  </>
                ) : (
                  <>
                    <FiXCircle size={32} color="#EF4444" strokeWidth={3} />
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: '#EF4444',
                      marginTop: '4px',
                      letterSpacing: '1px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}>
                      DENIED
                    </div>
                  </>
                )}
              </div>

              {/* Visa Header */}
              <div style={{
                position: 'relative',
                zIndex: 1,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <FiShield 
                    size={36} 
                    color={uzumStatus?.connected ? '#22C55E' : '#EF4444'} 
                    strokeWidth={2.5}
                  />
                  <div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '1.5px',
                      marginBottom: '4px',
                    }}>
                      {t.visa.toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: '#111',
                      letterSpacing: '1.5px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}>
                      UZUM SELLER
                    </div>
                  </div>
                </div>

                {/* Status Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth > 400 ? '1fr 1fr' : '1fr',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  {/* Status */}
                  <div style={{
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '1px',
                      marginBottom: '6px',
                    }}>
                      STATUS
                    </div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      color: uzumStatus?.connected ? '#22C55E' : '#EF4444',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {uzumStatus?.connected ? (
                        <>
                          <FiCheckCircle size={18} strokeWidth={2.5} />
                          {t.connected}
                        </>
                      ) : (
                        <>
                          <FiXCircle size={18} strokeWidth={2.5} />
                          {t.disconnected}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Valid From */}
                  {uzumStatus?.connected_at && (
                    <div style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#6b7280',
                        letterSpacing: '1px',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FiClock size={10} />
                        {t.validFrom.toUpperCase()}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#111',
                      }}>
                        {new Date(uzumStatus.connected_at).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  )}

                  {/* Shops Count */}
                  {uzumStatus?.shop_ids && uzumStatus.shop_ids.length > 0 && (
                    <div style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#6b7280',
                        letterSpacing: '1px',
                        marginBottom: '6px',
                      }}>
                        {t.shops.toUpperCase()}
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#1E6FDB',
                      }}>
                        {uzumStatus.shop_ids.length}
                      </div>
                    </div>
                  )}

                  {/* Token */}
                  {uzumStatus?.token_last4 && (
                    <div style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#6b7280',
                        letterSpacing: '1px',
                        marginBottom: '6px',
                      }}>
                        TOKEN
                      </div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#111',
                        fontFamily: 'monospace',
                      }}>
                        ••••{uzumStatus.token_last4}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  {uzumStatus?.connected ? (
                    <>
                      {onNavigateToUzum && (
                        <button
                          onClick={onNavigateToUzum}
                          style={{
                            flex: 1,
                            minWidth: '160px',
                            padding: '14px 16px',
                            background: 'linear-gradient(135deg, #1E6FDB 0%, #1E6FDB 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(126,34,206,0.4)',
                            transition: 'all 0.3s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(126,34,206,0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(126,34,206,0.4)';
                          }}
                        >
                          <FiShoppingCart size={18} />
                          {lang === 'ru' ? 'Открыть Dashboard' : 'Dashboard ochish'}
                        </button>
                      )}
                      <button
                        onClick={handleCheckConnection}
                        disabled={checking}
                        style={{
                          flex: 1,
                          minWidth: '100px',
                          padding: '14px 16px',
                          background: checking ? '#9ca3af' : '#1E6FDB',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: checking ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
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
                          padding: '14px 16px',
                          background: disconnecting ? '#9ca3af' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: disconnecting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
                        }}
                      >
                        {t.disconnect}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onNavigateToUzum}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, #1E6FDB 0%, #1E6FDB 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(126,34,206,0.4)',
                      }}
                    >
                      {t.reconnect}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Passport Footer */}
          <div style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.5px',
              lineHeight: '1.6',
            }}>
              {t.footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
