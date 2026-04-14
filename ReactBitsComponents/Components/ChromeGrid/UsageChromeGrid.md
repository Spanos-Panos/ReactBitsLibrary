import ChromaGrid from './ChromeGrid';

export default function App() {
  const items = [
    {
      image: "https://i.pravatar.cc/300?img=1",
      title: "Sarah Johnson",
      subtitle: "Frontend Developer",
      handle: "@sarahjohnson",
      borderColor: "#3B82F6",
      gradient: "linear-gradient(145deg, #3B82F6, #000)",
      url: "https://github.com"
    },
    {
      image: "https://i.pravatar.cc/300?img=2",
      title: "Mike Chen",
      subtitle: "Backend Engineer",
      handle: "@mikechen",
      borderColor: "#10B981",
      gradient: "linear-gradient(180deg, #10B981, #000)",
      url: "https://github.com"
    },
    {
      image: "https://i.pravatar.cc/300?img=3",
      title: "Aria Lopez",
      subtitle: "UI Designer",
      handle: "@arialopez",
      borderColor: "#F59E0B",
      gradient: "linear-gradient(160deg, #F59E0B, #000)",
      url: "https://github.com"
    },
    {
      image: "https://i.pravatar.cc/300?img=4",
      title: "James Park",
      subtitle: "DevOps Engineer",
      handle: "@jamespark",
      borderColor: "#EF4444",
      gradient: "linear-gradient(135deg, #EF4444, #000)",
      url: "https://github.com"
    },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <ChromaGrid
        items={items}
        radius={300}
        damping={0.45}
        fadeOut={0.6}
        ease="power3.out"
      />
    </div>
  );
}
