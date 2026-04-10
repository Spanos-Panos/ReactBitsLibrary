import { useRef } from 'react';
import Crosshair from './components/Animations/Crosshair/Crosshair';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '100vh', 
        width: '100%', 
        overflow: 'hidden', 
        position: 'relative', 
        background: '#111' 
      }}
    >
      <Crosshair containerRef={containerRef} color='#ffffff' />
      
      <div style={{ padding: '20px', color: 'white' }}>
        <a href="#" style={{ color: '#00ffcc' }}>Hover me for noise effect</a>
      </div>
    </div>
  );
}