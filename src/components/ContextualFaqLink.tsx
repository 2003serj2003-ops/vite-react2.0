interface ContextualFaqLinkProps {
  text: string;
  onClick: () => void;
  icon?: string;
}

export default function ContextualFaqLink({
  text,
  onClick,
  icon = '❓'
}: ContextualFaqLinkProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '12px',
        marginTop: '8px',
        backgroundColor: 'rgba(111,0,255,0.08)',
        border: '1px solid rgba(111,0,255,0.2)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        color: '#6F00FF',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(111,0,255,0.15)';
        e.currentTarget.style.borderColor = 'rgba(111,0,255,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(111,0,255,0.08)';
        e.currentTarget.style.borderColor = 'rgba(111,0,255,0.2)';
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span>{text}</span>
      <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}>→</span>
    </button>
  );
}
