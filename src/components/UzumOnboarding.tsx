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
      skip: 'Пропустить',
      next: 'Далее',
      finish: 'Завершить',
      steps: [
        {
          icon: '🔑',
          title: 'Получите токен доступа',
          description: 'Для подключения интеграции вам понадобится токен API',
          content: [
            '1. Зайдите в личный кабинет Uzum Seller',
            '2. Откройте раздел "Настройки" → "API"',
            '3. Нажмите "Создать токен"',
            '4. Скопируйте полученный токен',
            '5. Никому не передавайте ваш токен!'
          ],
          link: 'https://seller.uzum.uz/settings/api',
          linkText: '→ Открыть настройки Uzum Seller'
        },
        {
          icon: '📝',
          title: 'Добавьте токен в профиль',
          description: 'Сохраните токен в вашем профиле для безопасного хранения',
          content: [
            '1. Откройте ваш профиль в приложении',
            '2. Найдите раздел "Интеграции"',
            '3. Нажмите "Добавить Uzum Market"',
            '4. Вставьте скопированный токен',
            '5. Нажмите "Сохранить"'
          ]
        },
        {
          icon: '📊',
          title: 'Готово к работе!',
          description: 'Теперь вы можете управлять заказами и товарами',
          content: [
            '✅ Просматривайте заказы и их статусы',
            '✅ Управляйте товарами и остатками',
            '✅ Отслеживайте финансы и расходы',
            '✅ Получайте ежедневные отчеты в Telegram',
            '✅ Анализируйте продажи в отчетах'
          ]
        }
      ]
    },
    uz: {
      title: 'Uzum Market ni ulash',
      skip: 'Otkazish',
      next: 'Keyingisi',
      finish: 'Tugatish',
      steps: [
        {
          icon: '🔑',
          title: 'Kirish tokenini oling',
          description: 'Integratsiyani ulash uchun API token kerak',
          content: [
            '1. Uzum Seller shaxsiy kabinetiga kiring',
            '2. "Sozlamalar" → "API" bo\'limini oching',
            '3. "Token yaratish" tugmasini bosing',
            '4. Olingan tokenni nusxalang',
            '5. Tokeningizni hech kimga bermang!'
          ],
          link: 'https://seller.uzum.uz/settings/api',
          linkText: '→ Uzum Seller sozlamalarini ochish'
        },
        {
          icon: '📝',
          title: 'Tokenni profilga qo\'shing',
          description: 'Xavfsiz saqlash uchun tokenni profilingizga saqlang',
          content: [
            '1. Ilovada profilingizni oching',
            '2. "Integratsiyalar" bo\'limini toping',
            '3. "Uzum Market qo\'shish" tugmasini bosing',
            '4. Nusxalangan tokenni joylashtiring',
            '5. "Saqlash" tugmasini bosing'
          ]
        },
        {
          icon: '📊',
          title: 'Ishga tayyor!',
          description: 'Endi siz buyurtmalar va mahsulotlarni boshqarishingiz mumkin',
          content: [
            '✅ Buyurtmalar va ularning holatini ko\'ring',
            '✅ Mahsulotlar va qoldiqlarni boshqaring',
            '✅ Moliya va xarajatlarni kuzating',
            '✅ Telegramda kunlik hisobotlar oling',
            '✅ Hisobotlarda sotuvlarni tahlil qiling'
          ]
        }
      ]
    }
  };

  const t = T[lang];
  const step = t.steps[currentStep];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#111',
              margin: 0,
            }}>
              {t.title}
            </h2>
            <button
              onClick={onComplete}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 600,
              }}
            >
              {t.skip}
            </button>
          </div>
          
          {/* Progress */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '20px',
          }}>
            {t.steps.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: i <= currentStep ? '#7c3aed' : '#e5e7eb',
                  borderRadius: '2px',
                  transition: 'background-color 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
        }}>
          <div style={{
            fontSize: '48px',
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            {step.icon}
          </div>
          
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#111',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            {step.title}
          </h3>
          
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
            marginBottom: '24px',
            textAlign: 'center',
          }}>
            {step.description}
          </p>

          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            {step.content.map((text, i) => (
              <div
                key={i}
                style={{
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: text.startsWith('✅') ? '8px' : '12px',
                  lineHeight: '1.6',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                {text.startsWith('✅') ? (
                  <span>{text}</span>
                ) : (
                  <span>{text}</span>
                )}
              </div>
            ))}
          </div>

          {step.link && (
            <a
              href={step.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '12px 20px',
                backgroundColor: '#7c3aed',
                color: 'white',
                textAlign: 'center',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              {step.linkText}
            </a>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: currentStep === 0 ? '#f3f4f6' : 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: currentStep === 0 ? '#9ca3af' : '#374151',
            }}
          >
            ← Назад
          </button>
          
          <button
            onClick={() => {
              if (currentStep === t.steps.length - 1) {
                onComplete();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              flex: 1,
            }}
          >
            {currentStep === t.steps.length - 1 ? t.finish : t.next} →
          </button>
        </div>
      </div>
    </div>
  );
}
