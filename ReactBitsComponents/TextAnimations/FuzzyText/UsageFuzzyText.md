import FuzzyText from './components/TextAnimations/FuzzyText/FuzzyText';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000', // Set background to black so white text shows
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <FuzzyText
        color="#ffffff" 
        baseIntensity={0.2} 
        // Removed the broken lines
      >
        404
      </FuzzyText>
    </div>
  );
}