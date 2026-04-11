import CardNav from './CardNav';

const App = () => {
  const items = [
    {
      label: "About",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Company", href: "#", ariaLabel: "About Company" },
        { label: "Careers", href: "#", ariaLabel: "About Careers" }
      ]
    },
    {
      label: "Projects", 
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Featured", href: "#", ariaLabel: "Featured Projects" },
        { label: "Case Studies", href: "#", ariaLabel: "Project Case Studies" }
      ]
    },
    {
      label: "Contact",
      bgColor: "#271E37", 
      textColor: "#fff",
      links: [
        { label: "Email", href: "#", ariaLabel: "Email us" },
        { label: "Twitter", href: "#", ariaLabel: "Twitter" },
        { label: "LinkedIn", href: "#", ariaLabel: "LinkedIn" }
      ]
    }
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050505' }}>
      <CardNav
        // Since the file is in /public/ReactIcon.svg, 
        // Vite sees it at the root URL "/"
        logo="/ReactIcon.svg"
        logoAlt="Company Logo"
        items={items}
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      />
    </div>
  );
};

// CRITICAL FIX: This solves the 'export named default' error
export default App;