import { useState } from 'react';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiDollarSign,
  FiFileText,
  FiBarChart2,
  FiArrowRight,
  FiArrowLeft,
  FiX,
  FiCheck
} from 'react-icons/fi';

interface UzumTourProps {
  lang: 'ru' | 'uz';
  onComplete: () => void;
}

export default function UzumTour({ lang, onComplete }: UzumTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const T = {
    ru: {
      title: 'Знакомство с Uzum Integration',
      skip: 'Пропустить',
      next: 'Далее',
      back: 'Назад',
      finish: 'Начать работу',
      steps: [
        {
          icon: FiHome,
          title: 'Главная панель',
          subtitle: 'Ваш центр управления',
          description: 'Здесь вы видите ключевые показатели: товары на складе, активные заказы, выручку и прибыль',
          features: [
            'Статистика в реальном времени',
            'Быстрый доступ к разделам',
            'Недельный график заказов',
            'Финансовые показатели'
          ],
          color: '#1E6FDB'
        },
        {
          icon: FiPackage,
          title: 'Товары',
          subtitle: 'Управление каталогом',
          description: 'Просматривайте свои товары, проверяйте остатки на складах и статусы',
          features: [
            'Поиск по артикулу и названию',
            'Остатки FBS/FBO/DBS',
            'Цены и статусы',
            'Детальная информация'
          ],
          color: '#FF9F1C'
        },
        {
          icon: FiShoppingCart,
          title: 'Заказы',
          subtitle: 'Отслеживание продаж',
          description: 'Управляйте заказами: фильтруйте по статусам, просматривайте детали, печатайте этикетки',
          features: [
            'Фильтрация по статусам',
            'История заказов',
            'Детали доставки',
            'Печать этикеток'
          ],
          color: '#4CAF50'
        },
        {
          icon: FiDollarSign,
          title: 'Финансы',
          subtitle: 'Контроль денег',
          description: 'Отслеживайте выплаты, комиссии, логистику и другие расходы',
          features: [
            'История выплат',
            'Детализация расходов',
            'Комиссии Uzum',
            'Логистические затраты'
          ],
          color: '#4CAF50'
        },
        {
          icon: FiFileText,
          title: 'Накладные',
          subtitle: 'Документооборот',
          description: 'Просматривайте накладные и возвраты, проверяйте состав и статусы',
          features: [
            'Список накладных',
            'Возвраты товаров',
            'Детальный состав',
            'Статусы обработки'
          ],
          color: '#1E6FDB'
        },
        {
          icon: FiBarChart2,
          title: 'Отчеты',
          subtitle: 'Аналитика продаж',
          description: 'Анализируйте продажи, остатки и другие показатели в удобных отчетах',
          features: [
            'Отчет по продажам',
            'Анализ остатков',
            'Графики и диаграммы',
            'Экспорт данных'
          ],
          color: '#3FA9F5'
        }
      ]
    },
    uz: {
      title: 'Uzum Integration bilan tanishuv',
      skip: 'Otkazish',
      next: 'Keyingisi',
      back: 'Orqaga',
      finish: 'Boshlash',
      steps: [
        {
          icon: FiHome,
          title: 'Asosiy panel',
          subtitle: 'Boshqaruv markazi',
          description: 'Bu yerda asosiy ko\'rsatkichlar: ombordagi mahsulotlar, faol buyurtmalar, daromad va foyda',
          features: [
            'Real vaqtda statistika',
            'Bo\'limlarga tez kirish',
            'Haftalik buyurtmalar grafigi',
            'Moliyaviy ko\'rsatkichlar'
          ],
          color: '#1E6FDB'
        },
        {
          icon: FiPackage,
          title: 'Mahsulotlar',
          subtitle: 'Katalog boshqaruvi',
          description: 'Mahsulotlaringizni ko\'ring, ombordagi qoldiqlarni va holatlarni tekshiring',
          features: [
            'Artikul va nom bo\'yicha qidirish',
            'FBS/FBO/DBS qoldiqlari',
            'Narxlar va holatlar',
            'Batafsil ma\'lumot'
          ],
          color: '#FF9F1C'
        },
        {
          icon: FiShoppingCart,
          title: 'Buyurtmalar',
          subtitle: 'Sotuvlarni kuzatish',
          description: 'Buyurtmalarni boshqaring: holatlar bo\'yicha filtrlang, tafsilotlarni ko\'ring',
          features: [
            'Holat bo\'yicha filtrlash',
            'Buyurtmalar tarixi',
            'Yetkazib berish tafsilotlari',
            'Yorliqlarni chop etish'
          ],
          color: '#4CAF50'
        },
        {
          icon: FiDollarSign,
          title: 'Moliya',
          subtitle: 'Pul nazorati',
          description: 'To\'lovlar, komissiyalar, logistika va boshqa xarajatlarni kuzating',
          features: [
            'To\'lovlar tarixi',
            'Xarajatlar tafsiloti',
            'Uzum komissiyalari',
            'Logistika xarajatlari'
          ],
          color: '#4CAF50'
        },
        {
          icon: FiFileText,
          title: 'Hujjatlar',
          subtitle: 'Hujjat aylanmasi',
          description: 'Hujjatlar va qaytarilgan mahsulotlarni ko\'ring, tarkib va holatlarni tekshiring',
          features: [
            'Hujjatlar ro\'yxati',
            'Mahsulot qaytarish',
            'Batafsil tarkib',
            'Qayta ishlash holati'
          ],
          color: '#1E6FDB'
        },
        {
          icon: FiBarChart2,
          title: 'Hisobotlar',
          subtitle: 'Sotuvlar tahlili',
          description: 'Sotuvlar, qoldiqlar va boshqa ko\'rsatkichlarni qulay hisobotlarda tahlil qiling',
          features: [
            'Sotuvlar hisoboti',
            'Qoldiqlar tahlili',
            'Grafiklar va diagrammalar',
            'Ma\'lumotlarni eksport'
          ],
          color: '#3FA9F5'
        }
      ]
    }
  };

  const t = T[lang];
  const step = t.steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / t.steps.length) * 100;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Header with gradient */}
        <div style={{
          background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
          padding: '32px 32px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            top: '-100px',
            right: '-50px',
            filter: 'blur(40px)',
          }} />
          
          <div style={{
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Close button */}
            <button
              onClick={onComplete}
              style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <FiX size={20} />
            </button>

            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '12px',
              letterSpacing: '0.5px',
            }}>
              {t.title}
            </div>

            <h2 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'white',
              margin: '0 0 8px 0',
            }}>
              {step.title}
            </h2>

            <div style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.95)',
              fontWeight: '600',
            }}>
              {step.subtitle}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            marginTop: '24px',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'white',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
          maxHeight: 'calc(90vh - 280px)',
          overflowY: 'auto',
        }}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${step.color}15, ${step.color}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <Icon size={40} color={step.color} />
          </div>

          {/* Description */}
          <p style={{
            fontSize: '16px',
            color: '#374151',
            lineHeight: '1.6',
            marginBottom: '24px',
          }}>
            {step.description}
          </p>

          {/* Features */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#6b7280',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {lang === 'ru' ? 'Возможности' : 'Imkoniyatlar'}
            </div>
            {step.features.map((feature, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: i < step.features.length - 1 ? '12px' : '0',
                  animation: `fadeIn 0.3s ease-out ${i * 0.1}s both`,
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '8px',
                  backgroundColor: step.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FiCheck size={14} color="white" />
                </div>
                <span style={{
                  fontSize: '15px',
                  color: '#374151',
                  fontWeight: '500',
                }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* Step indicator */}
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '600',
          }}>
            {currentStep + 1} / {t.steps.length}
          </div>

          {/* Navigation buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <FiArrowLeft size={18} />
                {t.back}
              </button>
            )}

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
                background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: `0 4px 12px ${step.color}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 16px ${step.color}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${step.color}40`;
              }}
            >
              {currentStep === t.steps.length - 1 ? t.finish : t.next}
              <FiArrowRight size={18} />
            </button>
          </div>
        </div>

        <style>{`
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
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  );
}
