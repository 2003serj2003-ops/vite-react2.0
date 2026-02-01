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
      padding: 'var(--spacing-2xl) var(--spacing-lg)',
      textAlign: 'center',
      background: bgColor,
      borderRadius: 'var(--radius-lg)',
      border: `2px solid ${borderColor}`,
      margin: 'var(--spacing-lg)',
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: 'var(--spacing-lg)',
        lineHeight: '1',
      }}>
        {icon}
      </div>

      <h3 style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 700,
        color: textColor,
        marginBottom: 'var(--spacing-xs)',
        margin: `0 0 var(--spacing-xs) 0`,
        lineHeight: 1.3,
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: 'var(--text-sm)',
        color: textColor,
        opacity: 0.8,
        marginBottom: actionText ? 'var(--spacing-lg)' : '0',
        margin: `0 0 ${actionText ? 'var(--spacing-lg)' : '0'} 0`,
        lineHeight: '1.5',
      }}>
        {subtitle}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: '#1E6FDB',
            color: '#fff',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(30,111,219,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
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
