export default function PrimeLogo({ size = 36, light = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Outer heart-shaped path */}
        <path
          d="M22 38C22 38 7 28 7 16.5C7 11 11.25 7 16.5 7C19.5 7 21 8.5 22 10C23 8.5 24.5 7 27.5 7C32.75 7 37 11 37 16.5C37 28 22 38 22 38Z"
          stroke="#4F46E5"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={light ? 'rgba(255, 255, 255, 0.1)' : 'rgba(79, 70, 229, 0.06)'}
        />
        {/* Inner stylized tooth path */}
        <path
          d="M17 15C15.2 15 13.8 17.2 13.8 20C13.8 24 16 27.5 17.5 27.5C18.8 27.5 18.8 25.5 20 25.5C21.2 25.5 21.2 27.5 22.5 27.5C24 27.5 26.2 24 26.2 20C26.2 17.2 24.8 15 23 15C21.2 15 20.6 16.2 20 16.2C19.4 16.2 18.8 15 17 15Z"
          stroke="#4F46E5"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#4F46E5"
          fillOpacity="0.18"
        />
      </svg>
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: typeof size === 'number' ? size * 0.72 : '1.5rem',
          letterSpacing: '-0.03em',
          color: light ? '#FFFFFF' : '#0F172A',
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <span>Prime</span>
        <span style={{ color: '#4F46E5' }}>care</span>
      </span>
    </div>
  );
}
