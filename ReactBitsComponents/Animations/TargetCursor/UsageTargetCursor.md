import TargetCursor from './components/Animations/TargetCursor/TargetCursor';

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '48px',
      userSelect: 'none',
    }}>
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Target Cursor
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '1rem', color: '#666' }}>
          Hover over the cards below to see the effect
        </p>
      </div>

      {/* Target cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        width: '680px',
      }}>
        {[
          { label: 'Design',     sub: 'Creative direction' },
          { label: 'Develop',    sub: 'Clean code'          },
          { label: 'Deploy',     sub: 'Ship fast'           },
          { label: 'Animate',    sub: 'Fluid motion'        },
          { label: 'Optimise',   sub: 'Peak performance'    },
          { label: 'Iterate',    sub: 'Always improving'    },
        ].map(({ label, sub }) => (
          <div
            key={label}
            className="cursor-target"
            style={{
              padding: '28px 24px',
              borderRadius: '12px',
              border: '1px solid #222',
              background: '#111',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: '0.8rem', color: '#555' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        className="cursor-target"
        style={{
          padding: '14px 40px',
          borderRadius: '8px',
          border: '1px solid #333',
          background: 'transparent',
          color: '#fff',
          fontSize: '0.95rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
          cursor: 'none',
        }}
      >
        GET STARTED
      </button>
    </div>
  );
}
