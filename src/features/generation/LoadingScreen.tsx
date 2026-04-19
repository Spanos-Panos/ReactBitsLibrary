import { useEffect, useState } from 'react';
import MetallicPaint from '../../../ReactBitsComponents/Animations/MetalicPaint/MetalicPaint';

interface Props {
  onDone: () => void;
}

const logoSrc = './ReactIcon.svg';

export default function LoadingScreen({ onDone }: Props) {
  const [visible, setVisible]  = useState(false);
  const [exiting, setExiting]  = useState(false);

  useEffect(() => {
    let raf1: number, raf2: number;

    const show = () => {
      // Wait 2 frames so MetallicPaint has rendered at least one frame
      // before we fade in — ensures logo and title appear at the same time
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    };

    const img = new Image();
    img.src = logoSrc;
    img.onload  = show;
    img.onerror = show;

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setExiting(true), 3200);
    return () => clearTimeout(t);
  }, [visible]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && exiting) onDone();
  };

  return (
    <div
      className={`loading-screen${exiting ? ' loading-screen--out' : ''}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className={`loading-screen__content${visible ? ' loading-screen__content--visible' : ''}`}>
        <div className="loading-screen__logo">
          <MetallicPaint
            imageSrc={logoSrc}
            speed={0.4}
            scale={3.5}
            brightness={2.2}
            liquid={0.85}
            lightColor="#e2e8f0"
            darkColor="#0f0f1a"
            tintColor="#6366f1"
            chromaticSpread={1.8}
            refraction={0.012}
          />
        </div>
        <p className="loading-screen__title">BitForge</p>
      </div>
    </div>
  );
}
