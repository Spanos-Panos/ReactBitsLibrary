import StickerPeel from './components/Animations/StickerPeel/StickerPeel'
import logo from '../public/ReactIcon.svg'; // Correct import for ReactIcon.svg

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <StickerPeel
        imageSrc={logo}
        width={200}
        rotate={0}
        peelBackHoverPct={30}
        peelBackActivePct={40}
        shadowIntensity={0.1}
        lightingIntensity={0.5}
        initialPosition={{ x: 0, y: 0 }}
        peelDirection={0}
      />
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100px',
          height: '100px',
        }}
      >
        <img
          src={logo}
          alt="React Icon"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}