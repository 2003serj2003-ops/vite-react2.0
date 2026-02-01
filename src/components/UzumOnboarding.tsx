import { useState } from 'react';

interface UzumOnboardingProps {
  lang: 'ru' | 'uz';
  onComplete: () => void;
}

export default function UzumOnboarding({ lang, onComplete }: UzumOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const T = {
    ru: {
      title: 'Подключение Uzum Market',
      subtitle: 'Пошаговая инструкция для интеграции',
      skip: 'Пропустить',
      back: 'Назад',
      next: 'Далее',
      finish: 'Начать работу',
      stepOf: 'Шаг',
      steps: [
        {
          icon: '🔑',
          title: 'Получите API токен',
          description: 'Токен необходим для безопасной работы с Uzum Market API',
          content: [
            'Зайдите в личный кабинет Uzum Seller',
            'Откройте раздел "Настройки"',
            'Перейдите во вкладку "API"',
            'Нажмите кнопку "Создать новый токен"',
            'Скопируйте токен (он показывается только один раз!)',
          ],
          tips: [
            '💡 Сохраните токен в надежном месте',
            '⚠️ Не передавайте токен третьим лицам',
            '🔒 Токен дает полный доступ к вашему магазину',
          ],
          link: 'https://seller.uzum.uz/settings/api',
          linkText: 'Открыть настройки Uzum Seller'
        },
        {
          icon: '✨',
          title: 'Добавьте токен в систему',
          description: 'Сохраните токен в вашем профиле для начала работы',
          content: [
            'Откройте свой профиль в приложении',
            'Найдите раздел "Интеграции"',
            'Выберите "Uzum Market"',
            'Вставьте скопированный токен в поле',
            'Нажмите "Сохранить" для активации',
          ],
          tips: [
            '🔐 Токен хранится в зашифрованном виде',
            '🔄 Токен можно обновить в любое время',
            '✅ После сохранения интеграция активируется автоматически',
          ],
        },
        {
          icon: '🚀',
          title: 'Готово к работе!',
          description: 'Теперь вам доступны все возможности интеграции',
          content: [
            '📊 Единая панель управления магазином',
            '📦 Управление товарами и остатками',
            '📋 Отслеживание заказов в реальном времени',
            '💰 Финансовая аналитика и отчеты',
            '📱 Уведомления в Telegram',
            '📈 Графики продаж и аналитика',
          ],
          tips: [
            '💡 Данные обновляются автоматически',
            '⚡ Все изменения синхронизируются мгновенно',
            '🎯 Используйте дашборд для быстрого доступа к важным метрикам',
          ],
        }
      ]
    },
    uz: {
      title: 'Uzum Market ni ulash',
      subtitle: 'Integratsiya uchun bosqichma-bosqich ko\'rsatma',
      skip: 'Otkazish',
      back: 'Orqaga',
      next: 'Keyingisi',
      finish: 'Ishni boshlash',
      stepOf: 'Qadam',
      steps: [
        {
          icon: '🔑',
          title: 'API tokenini oling',
          description: 'Token Uzum Market API bilan xavfsiz ishlash uchun kerak',
          content: [
            'Uzum Seller shaxsiy kabinetiga kiring',
            '"Sozlamalar" bo\'limini oching',
            '"API" yorlig\'iga o\'ting',
            '"Yangi token yaratish" tugmasini bosing',
            'Tokenni nusxalang (u faqat bir marta ko\'rsatiladi!)',
          ],
          tips: [
            '💡 Tokenni ishonchli joyda saqlang',
            '⚠️ Tokenni uchinchi shaxslarga bermang',
            '🔒 Token do\'koningizga to\'liq kirish huquqini beradi',
          ],
          link: 'https://seller.uzum.uz/settings/api',
          linkText: 'Uzum Seller sozlamalarini ochish'
        },
        {
          icon: '✨',
          title: 'Tokenni tizimga qo\'shing',
          description: 'Ishni boshlash uchun tokenni profilingizga saqlang',
          content: [
            'Ilovada profilingizni oching',
            '"Integratsiyalar" bo\'limini toping',
            '"Uzum Market" ni tanlang',
            'Nusxalangan tokenni maydonga joylashtiring',
            'Faollashtirish uchun "Saqlash" tugmasini bosing',
          ],
          tips: [
            '🔐 Token shifrlangan holda saqlanadi',
            '🔄 Tokenni istalgan vaqtda yangilash mumkin',
            '✅ Saqlashdan keyin integratsiya avtomatik faollashadi',
          ],
        },
        {
          icon: '🚀',
          title: 'Ishga tayyor!',
          description: 'Endi sizga barcha integratsiya imkoniyatlari mavjud',
          content: [
            '📊 Do\'konni boshqarish uchun yagona panel',
            '📦 Mahsulotlar va qoldiqlarni boshqarish',
            '📋 Buyurtmalarni real vaqt rejimida kuzatish',
            '💰 Moliyaviy tahlil va hisobotlar',
            '📱 Telegramda bildirishnomalar',
            '📈 Sotuvlar grafikalari va tahlil',
          ],
          tips: [
            '💡 Ma\'lumotlar avtomatik yangilanadi',
            '⚡ Barcha o\'zgarishlar bir zumda sinxronlanadi',
            '🎯 Muhim ko\'rsatkichlarga tez kirish uchun boshqaruv panelidan foydalaning',
          ],
        }
      ]
    },
  };

  const t = T[lang];
  const step = t.steps[currentStep];
  const isLastStep = currentStep === t.steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #1E6FDB 0%, #3FA9F5 100%)',
          padding: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}>
              <div>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.5px',
                }}>
                  {t.title}
                </h2>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.9,
                  margin: 0,
                }}>
                  {t.subtitle}
                </p>
              </div>
              <button
                onClick={onComplete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                {t.skip}
              </button>
            </div>

            {/* Progress bar */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '24px',
            }}>
              {t.steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: i <= currentStep ? '100%' : '0%',
                    backgroundColor: 'white',
                    borderRadius: '2px',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: i <= currentStep ? '0 0 8px rgba(255, 255, 255, 0.5)' : 'none',
                  }} />
                </div>
              ))}
            </div>

            {/* Step indicator */}
            <div style={{
              marginTop: '16px',
              fontSize: '13px',
              opacity: 0.9,
              fontWeight: 500,
            }}>
              {t.stepOf} {currentStep + 1} / {t.steps.length}
            </div>
          </div>
        </div>

        {/* Content - scrollable */}
        <div style={{
          padding: '32px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {/* Icon */}
          <div style={{
            fontSize: '64px',
            textAlign: 'center',
            marginBottom: '24px',
            animation: 'slideUp 0.5s ease-out',
          }}>
            {step.icon}
          </div>

          {/* Title & Description */}
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '12px',
            textAlign: 'center',
            animation: 'slideUp 0.5s ease-out 0.1s both',
          }}>
            {step.title}
          </h3>
          
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '32px',
            lineHeight: '1.6',
            animation: 'slideUp 0.5s ease-out 0.2s both',
          }}>
            {step.description}
          </p>

          {/* Content list */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb',
            animation: 'slideUp 0.5s ease-out 0.3s both',
          }}>
            {step.content.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: i === step.content.length - 1 ? 0 : '16px',
                  animation: `slideUp 0.5s ease-out ${0.4 + i * 0.1}s both`,
                }}
              >
                <div style={{
                  minWidth: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1E6FDB 0%, #3FA9F5 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginTop: '2px',
                }}>
                  {item.startsWith('✅') || item.startsWith('📊') || item.startsWith('📦') || item.startsWith('📋') || item.startsWith('💰') || item.startsWith('📱') || item.startsWith('📈') ? 
                    item.charAt(0) : 
                    (i + 1)
                  }
                </div>
                <div style={{
                  flex: 1,
                  fontSize: '15px',
                  color: '#374151',
                  lineHeight: '1.6',
                }}>
                  {item.startsWith('✅') || item.startsWith('📊') || item.startsWith('📦') || item.startsWith('📋') || item.startsWith('💰') || item.startsWith('📱') || item.startsWith('📈') ? 
                    item.substring(2) : 
                    item
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {step.tips && (
            <div style={{
              marginBottom: '24px',
              animation: 'slideUp 0.5s ease-out 0.6s both',
            }}>
              {step.tips.map((tip, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: tip.includes('⚠️') ? '#fef3c7' : tip.includes('🔒') || tip.includes('🔐') ? '#dbeafe' : '#d1fae5',
                    border: `1px solid ${tip.includes('⚠️') ? '#fbbf24' : tip.includes('🔒') || tip.includes('🔐') ? '#60a5fa' : '#34d399'}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: i === step.tips.length - 1 ? 0 : '8px',
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.5',
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          )}

          {/* External link */}
          {step.link && (
            <a
              href={step.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '14px 24px',
                backgroundColor: '#1E6FDB',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                transition: 'all 0.2s',
                animation: 'slideUp 0.5s ease-out 0.7s both',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#5568d3';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#1E6FDB';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {step.linkText} →
            </a>
          )}
        </div>

        {/* Footer with navigation */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          backgroundColor: '#fafafa',
        }}>
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={isFirstStep}
            style={{
              padding: '12px 24px',
              backgroundColor: isFirstStep ? '#f3f4f6' : 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              cursor: isFirstStep ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              color: isFirstStep ? '#9ca3af' : '#374151',
              opacity: isFirstStep ? 0.5 : 1,
              transition: 'all 0.2s',
              minWidth: '120px',
            }}
            onMouseEnter={e => {
              if (!isFirstStep) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
            onMouseLeave={e => {
              if (!isFirstStep) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }
            }}
          >
            ← {t.back}
          </button>

          <button
            onClick={() => {
              if (isLastStep) {
                onComplete();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #1E6FDB 0%, #3FA9F5 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              color: 'white',
              transition: 'all 0.2s',
              minWidth: '120px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            {isLastStep ? t.finish : t.next} →
          </button>
        </div>
      </div>
    </div>
  );
}
