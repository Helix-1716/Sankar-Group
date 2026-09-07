export default function Avatar({ name, color, size = 32, style = {} }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bgColor = color || '#6366f1';

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: 'white',
        letterSpacing: '0.02em',
        boxShadow: `0 2px 8px ${bgColor}44`,
        ...style,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
