import Noise from './components/Animations/Noise/Noise';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#050505' 
    }}>
      {/* Container for the Noise */}
      <div style={{
        width: '600px', 
        height: '400px', 
        position: 'relative', 
        overflow: 'hidden',
        borderRadius: '12px',
        border: '1px solid #333'
      }}>
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={20} // Slightly higher for better visibility
        />
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <h1 style={{ color: 'white', zIndex: 1, pointerEvents: 'none' }}>Grain Overlay</h1>
        </div>
      </div>
    </div>
  );
}