import TextTrail from './components/TextAnimations/PixelTrail/TextTrail'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <TextTrail 
        text="React Bits"
        fontFamily="Arial"
        fontWeight="900"
        noiseFactor={1.2}
        noiseScale={0.001}
        rgbPersistFactor={0.95}
        alphaPersistFactor={0.92}
        animateColor={true}
        startColor="#ff6b6b"
        textColor="#4ecdc4"
        backgroundColor="#000"
        colorCycleInterval={2000}
        supersample={2}
      />
    </div>
  );
}