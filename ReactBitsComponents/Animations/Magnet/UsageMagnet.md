import Magnet from './components/Animations/Magnet/Magnet'

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignSelf: 'center', 
      alignItems: 'center', 
      backgroundColor: '#0d0d0d' 
    }}>
      
      <Magnet 
        padding={150} 
        disabled={false} 
        magnetStrength={8} // 8 provides a nice "gentle" follow
      >
        <button style={{
          padding: '1.5rem 3rem',
          fontSize: '1.2rem',
          backgroundColor: '#fff',
          color: '#000',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
        }}>
          Hover Near Me!
        </button>
      </Magnet>
      
    </div>
  );
}