import GooeyNav from './GooeyNav';

export default function App() {
  const items = [
    { label: "Home", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ];

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      // FIX: Center the child horizontally
      display: 'flex',
      justifyContent: 'center',
      // Dark background so the gooey highlight (white) is visible
      backgroundColor: '#0a0a0a',
      overflow: 'hidden'
    }}>
      <div style={{ width: '100%', position: 'relative' }}>
        <GooeyNav
          items={items}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          initialActiveIndex={0}
          animationTime={600}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>
    </div>
  );
}