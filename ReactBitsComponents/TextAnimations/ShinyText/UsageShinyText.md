import ShinyText from './components/TextAnimations/ShinyText/ShinyText';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#111' // Dark background makes it pop!
    }}>
      <ShinyText 
        text="✨ Shiny Text Effect" 
        disabled={false} 
        speed={2} 
        className='custom-class' 
        color="#555555"
        shineColor="#ffffff"
      />
    </div>
  );
}