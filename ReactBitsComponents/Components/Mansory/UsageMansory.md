import Masonry from './Mansory';

export default function App() {
  const items = [
    { id: "1", img: "/joker-landscape.jpg", height: 600, url: "#" },
    { id: "2", img: "/joker-portrait.jpg", height: 300, url: "#" },
    { id: "3", img: "/joker-square.jpg", height: 400, url: "#" },
    { id: "4", img: "/joker-landscape.jpg", height: 350, url: "#" },
    { id: "5", img: "/joker-portrait.jpg", height: 500, url: "#" },
    { id: "6", img: "/joker-square.jpg", height: 300, url: "#" },
    { id: "7", img: "/joker-landscape.jpg", height: 450, url: "#" },
    { id: "8", img: "/joker-portrait.jpg", height: 350, url: "#" },
    { id: "9", img: "/joker-square.jpg", height: 550, url: "#" },
    { id: "10", img: "/joker-landscape.jpg", height: 400, url: "#" },
    { id: "11", img: "/joker-portrait.jpg", height: 320, url: "#" },
    { id: "12", img: "/joker-square.jpg", height: 520, url: "#" },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', overflow: 'hidden' }}>
      <Masonry
        items={items}
        containerWidth="100vw"
        containerHeight="100vh"
        gap={12}
        ease="power3.out"
        duration={0.8}
        stagger={0.03}
        animateFrom="bottom"
        scaleOnHover={true}
        hoverScale={1.05}
        blurToFocus={true}
        colorShiftOnHover={false}
      />
    </div>
  );
}
