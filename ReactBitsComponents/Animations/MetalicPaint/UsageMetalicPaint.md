import MetallicPaint from "./components/Animations/MetalicPaint/MetalicPaint";
// If you don't have vite.svg, you can use any remote image URL
const logo = 'https://vitejs.dev/logo.svg'; 

export default function App() {
  const autoPlay = true; // true = animation plays automatically, false = controlled by mouse hover

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Container for the logo */}
      <div style={{ width: '400px', height: '400px' }}>
        <MetallicPaint
          imageSrc={logo}
          // Pattern settings
          seed={42}
          scale={4}
          patternSharpness={1}
          noiseScale={0.5}
          // Animation settings
          speed={0.3}
          liquid={0.75}
          mouseAnimation={!autoPlay}
          // Visual settings
          brightness={1.5}
          contrast={1.1}
          refraction={0.015}
          blur={0.01}
          chromaticSpread={2}
          fresnel={1}
          angle={0}
          waveAmplitude={1}
          distortion={1}
          contour={0.2}
          // Metallic Colors
          lightColor="#ffffff"
          darkColor="#000000"
          tintColor="#feb3ff"
        />
      </div>
    </div>
  );
}