import GridDistortion from './components/Backgrounds/GridDistortion/GridDistortion';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
  <GridDistortion
    imageSrc="https://picsum.photos/1920/1080?grayscale"
    grid={10}
    mouse={0.1}
    strength={0.15}
    relaxation={0.9}
    className="custom-class"
  />
</div>
  );
}
