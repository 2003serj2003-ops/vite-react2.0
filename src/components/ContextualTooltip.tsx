import React, { useState } from 'react';

interface ContextualTooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
}

export default function ContextualTooltip({
  content,
  children,
  position = 'top',
  trigger = 'hover',
}: ContextualTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-8px)',
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(8px)',
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(-8px)',
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(8px)',
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Trigger button */}
      {!children && (
        <button
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(30,111,219,0.15)',
            border: '2px solid rgba(30,111,219,0.3)',
            color: '#1E6FDB',
            fontSize: '12px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .2s',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(30,111,219,0.25)';
            e.currentTarget.style.borderColor = 'rgba(30,111,219,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(30,111,219,0.15)';
            e.currentTarget.style.borderColor = 'rgba(30,111,219,0.3)';
          }}
        >
          i
        </button>
      )}

      {children && <div>{children}</div>}

      {/* Tooltip */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...positionStyles[position],
            background: 'linear-gradient(135deg, #1E6FDB, #3FA9F5)',
            color: '#fff',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            lineHeight: '1.4',
            maxWidth: '200px',
            zIndex: 1000,
            whiteSpace: 'normal',
            boxShadow: '0 4px 12px rgba(30,111,219,0.3)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {content}

          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              background: '#1E6FDB',
              transform: 'rotate(45deg)',
              ...(position === 'top' && {
                bottom: '-4px',
                left: '50%',
                marginLeft: '-4px',
              }),
              ...(position === 'bottom' && {
                top: '-4px',
                left: '50%',
                marginLeft: '-4px',
              }),
              ...(position === 'left' && {
                right: '-4px',
                top: '50%',
                marginTop: '-4px',
              }),
              ...(position === 'right' && {
                left: '-4px',
                top: '50%',
                marginTop: '-4px',
              }),
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
