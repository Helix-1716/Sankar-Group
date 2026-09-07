export default function ProgressBar({ value = 0, height = 6, showLabel = false }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const getColor = () => {
    if (clampedValue >= 80) return 'linear-gradient(90deg, #10b981, #34d399)';
    if (clampedValue >= 40) return 'linear-gradient(90deg, #6366f1, #8b5cf6)';
    return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  };

  return (
    <div className="progress-bar-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        className="progress-bar-track"
        style={{
          flex: 1,
          height,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: height,
          overflow: 'hidden',
        }}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${clampedValue}%`,
            height: '100%',
            background: getColor(),
            borderRadius: height,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'progressFill 1s ease forwards',
            boxShadow: clampedValue > 0 ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none',
          }}
        />
      </div>
      {showLabel && (
        <span style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          minWidth: 36,
          textAlign: 'right',
        }}>
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
