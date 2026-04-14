import ScrollStack, { ScrollStackItem } from './components/Components/ScrollStack/ScrollStack'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ScrollStack>
        <ScrollStackItem>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              🔥
            </div>
            <h2>Welcome</h2>
          </div>
          <p>Discover the power of smooth scrolling animations with our interactive stack component. Each card reveals itself with elegant transitions.</p>
        </ScrollStackItem>
        
        <ScrollStackItem>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              ⚡
            </div>
            <h2>Performance</h2>
          </div>
          <p>Built with optimized animations and smooth scrolling using Lenis for buttery-smooth performance across all devices.</p>
        </ScrollStackItem>
        
        <ScrollStackItem>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              🎨
            </div>
            <h2>Customizable</h2>
          </div>
          <p>Fully customizable with props for scaling, rotation, blur effects, and positioning. Create unique experiences with ease.</p>
        </ScrollStackItem>
      </ScrollStack>
    </div>
  );
}