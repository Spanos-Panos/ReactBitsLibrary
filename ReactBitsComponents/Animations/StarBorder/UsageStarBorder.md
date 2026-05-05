import StarBorder from './components/Animations/StarBorder/StarBorder'

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        margin: 0,
        padding: 0
      }}
    >
      <StarBorder
        as="button"
        color="#f43f5e"
        speed="5s"
        starCount={3}
        fullPath={true}
        thickness={1}
        trailLength={30}
        glowIntensity={1}
      >
        Get Started
      </StarBorder>
    </div>
  );
}
