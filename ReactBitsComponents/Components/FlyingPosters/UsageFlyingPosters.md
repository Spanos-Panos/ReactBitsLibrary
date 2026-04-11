import FlyingPosters from './FlyingPosters';

export default function App() {
  const items = [
    'https://picsum.photos/500/500?grayscale', 
    'https://picsum.photos/600/600?grayscale', 
    'https://picsum.photos/400/400?grayscale'
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ height: '100vh', position: 'relative' }}>
        <FlyingPosters items={items}/>
      </div>
    </div>
  );
}