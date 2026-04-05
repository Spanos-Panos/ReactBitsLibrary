import Lightning from './components/Backgrounds/Lightning/Lightning'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Lightning
        hue={220}
        xOffset={0}
        speed={1}
        intensity={1}
        size={1}
      />
    </div>
  );
}
