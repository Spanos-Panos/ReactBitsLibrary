import FadeContent from './components/Animations/FadeContent/FadeContent';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#111', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden' 
    }}>
      
      <FadeContent 
        blur={true} 
        duration={1000} 
        delay={200} 
        initialOpacity={0}
        yOffset={40}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '3rem', margin: 0 }}>
            Tornado of Smoke
          </h1>
          <p style={{ color: '#888', fontSize: '1.2rem' }}>
            Scroll or refresh to see me fade in.
          </p>
        </div>
      </FadeContent>

    </div>
  );
}