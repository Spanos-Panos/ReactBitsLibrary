import DecayCard from './DecayCard';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#0d0d0d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <DecayCard 
        width={350} 
        height={500} 
        image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600&h=800"
      >
        <h2>Digital<br/>Decay</h2>
      </DecayCard>
    </div>
  );
}