import PillNav from './PillNav';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#000000', // Deep dark background
      position: 'relative',
      overflow: 'hidden'
    }}>
      <PillNav
        logo="/ReactIcon.svg"
        logoAlt="Logo"
        items={[
          { label: 'Home', href: '#' },
          { label: 'About', href: '#about' },
          { label: 'Services', href: '#services' },
          { label: 'Contact', href: '#contact' },
        ]}
        activeHref="#"
        ease="power3.out"
        baseColor="#ffffff" 
        pillColor="#1a1a1a" 
        pillTextColor="#ffffff" 
        hoveredPillTextColor="#000000" 
      />
    </div>
  );
}
