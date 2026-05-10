export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx} style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
          <td style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={skStyles.circle} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ ...skStyles.bar, width: '120px' }} />
                <div style={{ ...skStyles.bar, width: '90px', opacity: 0.5 }} />
              </div>
            </div>
          </td>
          <td style={{ padding: '16px 24px' }}>
            <div style={{ ...skStyles.bar, width: '80px' }} />
          </td>
          <td style={{ padding: '16px 24px' }}>
            <div style={{ ...skStyles.bar, width: '64px', borderRadius: '20px' }} />
          </td>
          <td style={{ padding: '16px 24px' }}>
            <div style={{ ...skStyles.bar, width: '96px' }} />
          </td>
          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
            <div style={{ ...skStyles.bar, width: '96px', marginLeft: 'auto' }} />
          </td>
        </tr>
      ))}
    </>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div style={skStyles.card}>
      <div style={skStyles.shimmer} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ ...skStyles.circle, width: '44px', height: '44px', borderRadius: '12px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ ...skStyles.bar, width: '96px' }} />
          <div style={{ ...skStyles.bar, width: '128px', height: '28px' }} />
          <div style={{ ...skStyles.bar, width: '160px', opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
};

const skStyles = {
  card: {
    background: 'rgba(10,22,40,0.7)',
    border: '1px solid rgba(56,189,248,0.12)',
    borderRadius: '16px',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.06) 50%, transparent 100%)',
    backgroundSize: '600px 100%',
    animation: 'shimmer 1.8s infinite',
  },
  bar: {
    height: '13px',
    background: 'rgba(56,189,248,0.1)',
    borderRadius: '6px',
    animation: 'pulse 1.8s ease-in-out infinite',
  },
  circle: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(56,189,248,0.1)',
    animation: 'pulse 1.8s ease-in-out infinite',
    flexShrink: 0,
  },
};
