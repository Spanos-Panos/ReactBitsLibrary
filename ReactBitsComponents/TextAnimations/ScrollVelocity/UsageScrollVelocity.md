import ScrollVelocity from './ScrollVelocity';

export default function App() {
  const velocity = 100;
  return (
    <div style={{ background: '#000', color: '#fff', overflowX: 'hidden' }}>
      <div style={{ height: '48vh' }} />
      <ScrollVelocity
        texts={['React Bits', 'Scroll Down', 'Beautiful UI', 'Open Source']}
        velocity={velocity}
        className="custom-scroll-text"
      />
      <div style={{ height: '48vh' }} />
    </div>
  );
}
