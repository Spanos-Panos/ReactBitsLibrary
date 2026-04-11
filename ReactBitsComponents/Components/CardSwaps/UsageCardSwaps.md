import CardSwap, { Card } from './CardSwaps';

export default function App() {
  const cards = [
    { img: '/joker-portrait.jpg',   num: '01', label: 'Design',   title: 'Creative Direction' },
    { img: '/joker-landscape.jpg',  num: '02', label: 'Develop',  title: 'Clean Architecture' },
    { img: '/joker-square.jpg',     num: '03', label: 'Deploy',   title: 'Ship Fast'          },
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      
      {/* SCALED UP: Mini Text Center-Left */}
      <div style={{
        position: 'absolute',
        left: '10%',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        maxWidth: '320px' // Increased width for larger text
      }}>
        <h4 style={{ 
          color: 'rgba(255,255,255,0.3)', 
          fontSize: '0.9rem', // Larger label
          letterSpacing: '0.4em', 
          textTransform: 'uppercase',
          margin: '0 0 20px 0'
        }}>
          Showcase v.2
        </h4>
        <p style={{ 
          color: '#fff', 
          fontSize: '1.2rem', // Larger body text
          lineHeight: '1.5', 
          fontWeight: 300,
          margin: 0,
          opacity: 0.9
        }}>
          Interactive card stack utilizing GSAP for smooth orbital transitions and depth perception.
        </p>
        <div style={{ 
          marginTop: '30px', 
          width: '60px', 
          height: '2px', 
          background: 'rgba(255,255,255,0.4)' 
        }} />
      </div>

      {/* SCALED UP: CardSwap Component */}
      <CardSwap
        width={480}   // Larger width
        height={360}  // Larger height
        cardDistance={70}     // Increased spacing for larger cards
        verticalDistance={80} // Increased spacing
        delay={4500}
        pauseOnHover={true}
        easing="elastic"
        bottom="-10%"
        right="-5%"
      >
        {cards.map(({ img, num, label, title }) => (
          <Card key={num}>
            <img
              src={img}
              alt={title}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '32px', // More padding for the bigger cards
              color: '#fff',
            }}>
              <p style={{ 
                margin: '0 0 8px', 
                fontSize: '0.8rem', // Scaled text inside card
                letterSpacing: '0.15em', 
                textTransform: 'uppercase', 
                color: 'rgba(255,255,255,0.5)' 
              }}>
                {num} — {label}
              </p>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.6rem', // Larger Title
                fontWeight: 600 
              }}>{title}</h3>
            </div>
          </Card>
        ))}
      </CardSwap>
    </div>
  );
}
