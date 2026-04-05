import RippleGrid from './components/Backgrounds/RippleGrid/RippleGrid';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
        <RippleGrid
          enableRainbow={true}
          gridColor="#ffffff"
          rippleIntensity={0.05}
          gridSize={10}
          gridThickness={15}
          mouseInteraction={true}
          mouseInteractionRadius={1.2}
          opacity={0.8}
          // --- NEW PROP ---
          // Set to 0.0 to fill the whole screen. 
          // Set to 2.0+ to make edges fade out.
          vignetteStrength={0} 
        />
      </div>
    </div>
  );
}