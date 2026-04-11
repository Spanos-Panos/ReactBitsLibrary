import FluidGlass from './FluidGlass';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <FluidGlass
        mode="lens"
        glb="/sphere.glb"
        lensProps={{
          scale: 0.25,
          ior: 1.15,
          thickness: 5,
          chromaticAberration: 0.1,
          anisotropy: 0.01,
        }}
      />
    </div>
  );
}
