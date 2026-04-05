import GridMotion from './components/Backgrounds/GridMotion/GridMotion'

export default function App() {
  // Generates 28 random images for the grid
  const items = Array.from({ length: 28 }, (_, i) => {
    return `https://picsum.photos/800/800?random=${i}`;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#111' }}>
      <GridMotion items={items} />
    </div>
  );
}