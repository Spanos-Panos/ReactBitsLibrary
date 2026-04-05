import Plasma from './components/Backgrounds/Plasma/Plasma';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Plasma 
        color="#3498db"
        speed={1.0}
        scale={1.0}
        // --- NEW CUSTOMIZATION PROPS ---
        twist={10.0}        // Higher = more spiral/winding
        topWidth={0.6}      // Width at the top of the screen
        bottomWidth={0.02}  // Width at the bottom (0.01 is a sharp point)
        flarePow={1.6}      // 1.0 is linear, 2.0+ is a curved "funnel" look
        opacity={1}
      />
    </div>
  );
}
