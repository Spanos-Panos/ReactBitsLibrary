import DecryptedText from './components/TextAnimations/DecryptedText/DecryptedText';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#111', 
      color: 'white',
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2rem',
      padding: '2rem' 
    }}>
      <DecryptedText text="Hover me!" />
      
      <DecryptedText
        text="Customize me"
        speed={100}
        maxIterations={20}
        characters="ABCD1234!?"
      />
      
      <DecryptedText
        text="This text animates when in view"
        animateOn="view"
        revealDirection="center"
      />
    </div>
  );
}