import ScrollFloat from './ScrollFloat';

export default function App() {
  return (
    <div style={{ background: '#000', color: '#fff', overflowX: 'hidden' }}>
      <div style={{ height: '48vh' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '0 2rem', textAlign: 'center' }}>
        <ScrollFloat animationDuration={1} ease='back.inOut(2)' scrollStart='center bottom+=50%' scrollEnd='bottom bottom-=40%' stagger={0.03}>
          Scroll Float
        </ScrollFloat>
        <ScrollFloat animationDuration={1} ease='back.inOut(2)' scrollStart='center bottom+=50%' scrollEnd='bottom bottom-=40%' stagger={0.03}>
          React Bits
        </ScrollFloat>
        <ScrollFloat animationDuration={1.2} ease='back.inOut(2)' scrollStart='center bottom+=50%' scrollEnd='bottom bottom-=40%' stagger={0.04}>
          Beautiful Text
        </ScrollFloat>
        <ScrollFloat animationDuration={0.8} ease='back.inOut(2)' scrollStart='center bottom+=50%' scrollEnd='bottom bottom-=40%' stagger={0.02}>
          Animations
        </ScrollFloat>
        <ScrollFloat animationDuration={1} ease='back.inOut(2)' scrollStart='center bottom+=50%' scrollEnd='bottom bottom-=40%' stagger={0.03}>
          For Your App
        </ScrollFloat>
      </div>
      <div style={{ height: '48vh' }} />
    </div>
  );
}
