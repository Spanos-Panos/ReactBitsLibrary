import Ballpit from './components/Backgrounds/Ballpit/Ballpit'

export default function App() {
  return (
    
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Ballpit
        count={100}
        gravity={0.9}
        friction={0.8}
        wallBounce={0.95}
        followCursor={true}
      />
    </div>
  );
}