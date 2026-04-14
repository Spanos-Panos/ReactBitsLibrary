import GlassSurface from './GlassSurface'

export default function App() {
  return (
    <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassSurface
        width={500}
        height={100}
        borderRadius={50}
        backgroundOpacity={0.1}
        saturation={1}
        borderWidth={0.07}
        displace={0.5}
        distortionScale={-180}
        blur={11}
        redOffset={0}
        greenOffset={10}
        blueOffset={20}
        brightness={50}
        opacity={0.93}
        mixBlendMode="screen"
      >
        <span style={{ color: 'white', fontWeight: 'bold' }}>Glass Surface Content</span>
      </GlassSurface>
    </div>
  );
}