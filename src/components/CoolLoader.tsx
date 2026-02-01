// Компонент крутого лоадера
interface CoolLoaderProps {
  text?: string;
}

export default function CoolLoader({ text = 'Загрузка' }: CoolLoaderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '24px',
    }}>
      {/* Animated circles */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '4px solid transparent',
              borderTopColor: i === 0 ? '#22c55e' : i === 1 ? '#7c3aed' : '#f59e0b',
              borderRadius: '50%',
              animation: `spin ${1 + i * 0.3}s linear infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Loading text with dots */}
      <div style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span>{text}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                animation: `bounce 1.4s infinite ease-in-out`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '200px',
        height: '4px',
        backgroundColor: '#e5e7eb',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: '100%',
          background: 'linear-gradient(90deg, #22c55e 0%, #7c3aed 50%, #f59e0b 100%)',
          animation: 'slide 1.5s infinite',
        }} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
