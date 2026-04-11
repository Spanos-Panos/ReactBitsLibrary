import PillNav from './PillNav';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
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
        ease="power2.out"
        baseColor="#ffffff"
        pillColor="#ffffff"
        hoveredPillTextColor="#000000"
        pillTextColor="#ffffff"
      />
    </div>
  );
}
