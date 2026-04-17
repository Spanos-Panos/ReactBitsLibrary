import PlasmaWave from './PlasmaWave';
  
<div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#000'
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <PlasmaWave
          colors={['#7C3AED', '#22D3EE']}
          speed1={0.018}
          speed2={0.026}
          focalLength={1.05}
          bend1={0.55}
          bend2={0.35}
          dir2={1}
          rotationDeg={-8}
        />
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 42%, rgba(16, 24, 42, 0.08) 0%, rgba(2, 6, 23, 0.68) 56%, rgba(1, 2, 7, 0.96) 100%)'
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.06,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.7) 0.7px, transparent 0)',
          backgroundSize: '3px 3px'
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(2, 6, 23, 0.35) 0%, transparent 30%, transparent 70%, rgba(2, 6, 23, 0.4) 100%)'
        }}
      />
    </div>