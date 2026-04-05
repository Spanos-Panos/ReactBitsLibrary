import Prism from './components/Backgrounds/Prism/Prism';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Prism
          animationType="rotate"
          timeScale={0.3}
          height={2.5}
          baseWidth={5}
          scale={3}
          hueShift={0}
          colorFrequency={2}
          noise={0.1}
          glow={1}
        />
    </div>
  );
}
