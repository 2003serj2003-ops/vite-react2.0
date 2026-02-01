import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface FullScreenChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function FullScreenChartModal({ isOpen, onClose, title, children }: FullScreenChartModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Lock scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Handle Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out',
        // Safe area for iOS notch/home indicator
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            color: '#111',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: '#374151',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.color = '#111';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Chart Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1400px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
