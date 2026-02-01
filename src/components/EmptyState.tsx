interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  type?: 'error' | 'empty' | 'loading';
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
  type = 'empty',
}: EmptyStateProps) {
  const bgColor = {
    empty: '#f3f4f6',
    error: '#fee2e2',
    loading: '#f0f9ff',
  }[type];

  const borderColor = {
    empty: '#e5e7eb',
    error: '#fecaca',
    loading: '#bfdbfe',
  }[type];

  const textColor = {
    empty: '#6b7280',
    error: '#991b1b',
    loading: '#0369a1',
  }[type];

  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      background: bgColor,
      borderRadius: '12px',
      border: `2px solid ${borderColor}`,
      margin: '20px',
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
        lineHeight: '1',
      }}>
        {icon}
      </div>

      <h3 style={{
        fontSize: '16px',
        fontWeight: 900,
        color: textColor,
        marginBottom: '6px',
        margin: '0 0 6px 0',
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '13px',
        color: textColor,
        opacity: 0.8,
        marginBottom: actionText ? '16px' : '0',
        margin: `0 0 ${actionText ? '16px' : '0'} 0`,
        lineHeight: '1.5',
      }}>
        {subtitle}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#1E6FDB',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all .2s',
            boxShadow: '0 2px 8px rgba(30,111,219,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,111,219,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,111,219,0.2)';
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
