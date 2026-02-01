import { useState } from 'react';
import { FiInfo } from 'react-icons/fi';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ text, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-8px)',
      marginBottom: '4px',
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(8px)',
      marginTop: '4px',
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(-8px)',
      marginRight: '4px',
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(8px)',
      marginLeft: '4px',
    },
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onMouseEnter={(e) => {
          setShow(true);
          e.currentTarget.style.borderColor = '#1E6FDB';
          e.currentTarget.style.color = '#1E6FDB';
        }}
        onMouseLeave={(e) => {
          setShow(false);
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.color = '#6b7280';
        }}
        onClick={() => setShow(!show)}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '2px solid #d1d5db',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'help',
          transition: 'all 0.2s',
          color: '#6b7280',
        }}
      >
        <FiInfo size={12} />
      </button>

      {show && (
        <div style={{
          position: 'absolute',
          ...positionStyles[position],
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          whiteSpace: 'normal',
          maxWidth: '250px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'tooltipFadeIn 0.2s ease-out',
          pointerEvents: 'none',
        }}>
          {text}
          
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            backgroundColor: '#1f2937',
            transform: 'rotate(45deg)',
            ...(position === 'top' ? {
              bottom: '-4px',
              left: '50%',
              marginLeft: '-4px',
            } : position === 'bottom' ? {
              top: '-4px',
              left: '50%',
              marginLeft: '-4px',
            } : position === 'left' ? {
              right: '-4px',
              top: '50%',
              marginTop: '-4px',
            } : {
              left: '-4px',
              top: '50%',
              marginTop: '-4px',
            }),
          }} />

          <style>{`
            @keyframes tooltipFadeIn {
              from {
                opacity: 0;
                transform: ${
                  position === 'top' ? 'translateX(-50%) translateY(-4px)' :
                  position === 'bottom' ? 'translateX(-50%) translateY(4px)' :
                  position === 'left' ? 'translateY(-50%) translateX(-4px)' :
                  'translateY(-50%) translateX(4px)'
                };
              }
              to {
                opacity: 1;
                transform: ${
                  position === 'top' ? 'translateX(-50%) translateY(-8px)' :
                  position === 'bottom' ? 'translateX(-50%) translateY(8px)' :
                  position === 'left' ? 'translateY(-50%) translateX(-8px)' :
                  'translateY(-50%) translateX(8px)'
                };
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
