import RollingGallery from './components/Components/RollingGallery/RollingGallery'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <RollingGallery autoplay={true} pauseOnHover={true} />
    </div>
  );
}