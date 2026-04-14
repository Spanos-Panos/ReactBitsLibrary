import PixelTrail from './components/Animations/PixelTrail/PixelTrail';

export default function App() {
  return (
    /* Full Screen setup */
    <div style={{ width: '100vw', height: '100vh', background: '#000', margin: 0, padding: 0 }}>
      
      <div style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <PixelTrail
          gridSize={60}
          trailSize={0.08}
          maxAge={300}
          interpolate={2}
          color="#5227FF"
          // Correct prop structure
          gooeyFilter={{ id: "custom-goo-filter", strength: 4 }}
        />
        
        {/* Optional text overlay */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          pointerEvents: 'none' 
        }}>
          <h1 style={{ color: 'white', fontSize: '4rem', fontWeight: 900 }}>PIXEL</h1>
        </div>
      </div>

    </div>
  );
}