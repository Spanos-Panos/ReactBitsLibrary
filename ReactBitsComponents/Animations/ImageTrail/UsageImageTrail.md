import ImageTrail from './components/Animations/ImageTrail/ImageTrail';

export default function App() {
  const images = [
    'https://picsum.photos/id/287/300/300',
    'https://picsum.photos/id/1001/300/300',
    'https://picsum.photos/id/1025/300/300',
    'https://picsum.photos/id/1026/300/300',
    'https://picsum.photos/id/1027/300/300',
    'https://picsum.photos/id/1028/300/300',
    'https://picsum.photos/id/1029/300/300',
    'https://picsum.photos/id/1030/300/300',
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden'}}>
        <ImageTrail
          items={images}
          variant={1}
        />
      </div>
    </div>
  );
}