import GlassSurface from './components/Components/GlassSurface/GlassSurface'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassSurface
        width={300} 
        height={200}
        borderRadius={24}
        displace={15}
        distortionScale={-150}
        redOffset={5}
        greenOffset={15}
        blueOffset={25}
        brightness={60}
        opacity={0.8}
        mixBlendMode="screen"
      >
        <span style={{color: "white"}}>Advanced Glass Distortion</span>
      </GlassSurface>
    </div>
  );
}