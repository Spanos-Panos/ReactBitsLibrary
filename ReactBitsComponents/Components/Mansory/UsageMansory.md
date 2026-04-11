import Masonry from './Mansory';

export default function App() {
  const items = [
    { id: "1", img: "https://picsum.photos/id/1015/600/900", height: 400 },
    { id: "2", img: "https://picsum.photos/id/1011/600/750", height: 250 },
    { id: "3", img: "https://picsum.photos/id/1020/600/800", height: 600 },
    { id: "4", img: "https://picsum.photos/id/1035/600/700", height: 350 },
    { id: "5", img: "https://picsum.photos/id/1043/600/850", height: 500 },
    { id: "6", img: "https://picsum.photos/id/1050/600/600", height: 300 },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', overflow: 'hidden' }}>
      <Masonry
        items={items}
        ease="power3.out"
        duration={0.6}
        stagger={0.05}
        animateFrom="bottom"
        scaleOnHover={true}
        hoverScale={0.95}
        blurToFocus={true}
        colorShiftOnHover={false}
      />
    </div>
  );
}
