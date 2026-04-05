import Silk from './components/Backgrounds/Silk/Silk';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000', overflow: 'hidden' }}>
      <Silk
        speed={0.5}        // Slowed down for a silkier feel
        scale={0.5}        // Adjusted scale
        color="#7B7481"
        noiseIntensity={0.2}
        rotation={Math.PI / -1}
      />
    </div>
  );
}