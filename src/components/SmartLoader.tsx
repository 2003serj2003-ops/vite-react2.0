import { useState, useEffect } from 'react';
import { 
  FiPackage, 
  FiTruck, 
  FiShoppingCart, 
  FiBarChart2,
  FiDatabase,
  FiRefreshCw
} from 'react-icons/fi';

interface SmartLoaderProps {
  type?: 'orders' | 'products' | 'finance' | 'reports' | 'general';
  text?: string;
}

const loadingMessages = {
  orders: [
    { icon: FiShoppingCart, text: 'Собираем заказы...' },
    { icon: FiPackage, text: 'Проверяем статусы...' },
    { icon: FiTruck, text: 'Обновляем доставки...' }
  ],
  products: [
    { icon: FiPackage, text: 'Загружаем товары...' },
    { icon: FiDatabase, text: 'Ищем вашу ячейку на складе...' },
    { icon: FiBarChart2, text: 'Считаем остатки...' }
  ],
  finance: [
    { icon: FiBarChart2, text: 'Собираем финансы...' },
    { icon: FiRefreshCw, text: 'Анализируем расходы...' },
    { icon: FiDatabase, text: 'Проверяем выплаты...' }
  ],
  reports: [
    { icon: FiBarChart2, text: 'Генерируем отчет...' },
    { icon: FiDatabase, text: 'Собираем данные...' },
    { icon: FiRefreshCw, text: 'Строим графики...' }
  ],
  general: [
    { icon: FiRefreshCw, text: 'Загрузка...' },
    { icon: FiDatabase, text: 'Обработка данных...' },
    { icon: FiBarChart2, text: 'Почти готово...' }
  ]
};

export default function SmartLoader({ type = 'general', text }: SmartLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = loadingMessages[type];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[messageIndex];
  const Icon = currentMessage.icon;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '32px',
      padding: '40px 20px',
    }}>
      {/* Animated Icon Container */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
      }}>
        {/* Outer rotating ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '4px solid #f3f4f6',
          borderTopColor: '#1E6FDB',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        
        {/* Middle rotating ring */}
        <div style={{
          position: 'absolute',
          width: '80%',
          height: '80%',
          top: '10%',
          left: '10%',
          border: '3px solid #f3f4f6',
          borderRightColor: '#4CAF50',
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite reverse',
        }} />

        {/* Icon in center */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <Icon size={48} color="#1E6FDB" />
        </div>
      </div>

      {/* Loading Text */}
      <div style={{
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease-in-out',
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px',
        }}>
          {text || currentMessage.text}
        </div>
        
        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: messageIndex === i ? '#1E6FDB' : '#e5e7eb',
                animation: messageIndex === i ? 'bounce 0.6s infinite' : 'none',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '200px',
        height: '4px',
        backgroundColor: '#f3f4f6',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #1E6FDB, #4CAF50)',
          borderRadius: '2px',
          animation: 'slideProgress 2s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
