import ScrollReveal from './ScrollReveal';

export default function App() {
  return (
    <div style={{ background: '#000', color: '#fff', overflowX: 'hidden' }}>
      <div style={{ height: '48vh' }} />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        <ScrollReveal
          baseOpacity={0}
          enableBlur={true}
          baseRotation={5}
          blurStrength={10}
        >
          When does a man die? When he is hit by a bullet? No! When he suffers a disease? No! When he ate a soup made out of a poisonous mushroom? No! A man dies when he is forgotten! So as long as we remember the ones we love, they remain alive within us. Their stories, their laughter, their wisdom — all of it lives on through the memories we carry. And so they are never truly gone.
        </ScrollReveal>
      </div>
      <div style={{ height: '48vh' }} />
    </div>
  );
}
