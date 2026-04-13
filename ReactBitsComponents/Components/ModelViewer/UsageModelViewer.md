import ModelViewer from './ModelViewer';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ModelViewer
        url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb"
        width="100vw"
        height="100vh"
        modelScale={550}
        modelXOffset={0}
        modelYOffset={0}
        enableMouseParallax={false}
        enableHoverRotation={false}
        enableManualZoom={false}
        environmentPreset="city"
        autoRotate
        autoRotateSpeed={0.5}
        showScreenshotButton={false}
      />
    </div>
  );
}
