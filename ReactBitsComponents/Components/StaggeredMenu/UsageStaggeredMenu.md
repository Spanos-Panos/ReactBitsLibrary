import StaggeredMenu from './components/Components/StaggeredMenu/StaggeredMenu';

export default function App() {
  const menuItems = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
    { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
    { label: 'Services', ariaLabel: 'View our services', link: '/services' },
    { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
  ];
  
  const socialItems = [
    { label: 'Twitter', link: 'https://twitter.com' },
    { label: 'GitHub', link: 'https://github.com' },
    { label: 'LinkedIn', link: 'https://linkedin.com' }
  ];

  // IMPORTANT: StaggeredMenu uses position:absolute internally for its sliding
  // panel and prelayers. It MUST live inside a container that has:
  //   position: relative (or fixed), width: 100%, height: 100vh (or 100%)
  // If placed as a flex-column item with no height, the panel will collapse.
  // For multi-page layouts use a fixed overlay wrapper (see MainLayout pattern).

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{ height: '100vh', background: '#1a1a1a' }}>
        <StaggeredMenu
          position="right"
          items={menuItems}
          socialItems={socialItems}
          displaySocials={true}
          displayItemNumbering={true}
          menuButtonColor="#fff"
          openMenuButtonColor="#111"
          changeMenuColorOnOpen={true}
          colors={['#B19EEF', '#5227FF']}
          logoUrl="/logo.svg"
          accentColor="#ff6b6b"
          onMenuOpen={() => console.log('Menu opened')}
          onMenuClose={() => console.log('Menu closed')}
        />
      </div>
    </div>
  );
}
