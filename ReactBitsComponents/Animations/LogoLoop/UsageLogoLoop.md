import LogoLoop from './components/Animations/LogoLoop/LogoLoop';
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss } from 'react-icons/si';

export default function App() {
  const techLogos = [
    { node: <SiReact color="#61DAFB" />, title: "React" },
    { node: <SiNextdotjs color="#ffffff" />, title: "Next.js" },
    { node: <SiTypescript color="#3178C6" />, title: "TypeScript" },
    { node: <SiTailwindcss color="#06B6D4" />, title: "Tailwind" },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center' }}>
        <LogoLoop
          logos={techLogos}
          speed={60}
          direction="left"
          logoHeight={60}
          gap={80}
          scaleOnHover={true}
          fadeOut={true}
          fadeOutColor="#000000"
          verticalPosition="center"
        />
      </div>
    </div>
  );
}
