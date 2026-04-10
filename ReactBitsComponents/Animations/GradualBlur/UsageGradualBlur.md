import GradualBlur from './components/Animations/GradualBlur/GradualBlur';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#000' }}>
      
      {/* Changed height to 100vh to fill the whole screen */}
      <section style={{ 
        position: 'relative', 
        height: '100vh', 
        width: '100%', 
        overflow: 'hidden', 
        background: '#0a0a0a' 
      }}>
        
        <div style={{ height: '100%', overflowY: 'auto', padding: '4rem 2rem' }}>
          {/* Example Content */}
          <h1 style={{ color: 'white', fontSize: '4rem', marginBottom: '2rem' }}>
            High Definition Blur
          </h1>
          <img 
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80" 
            alt="Forest" 
            style={{ width: '100%', borderRadius: '2rem', marginBottom: '4rem' }}
          />
          <div style={{ height: '100vh', color: '#444' }}>
            Scroll down to see the gradual transition...
          </div>
        </div>
      
        {/* The Blur Component */}
        <GradualBlur
          target="parent"
          position="bottom"
          height="40vh"   // Increased height to 40% of the screen for a better "fade"
          strength={4}     // Increased strength for that HD look
          divCount={10}    // More divs = smoother, less "stepped" look
          curve="bezier"
          exponential={true}
          opacity={1}
        />
      </section>
    </div>
  );
}