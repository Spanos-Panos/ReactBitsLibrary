import { useEffect, useState } from 'react';
import MetallicPaint from '../../ReactBitsComponents/Animations/MetalicPaint/MetalicPaint';

interface Props {
  onDone: () => void;
}

export default function LoadingScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [assetsReady, setAssetsReady] = useState(false);
  const logoSrc = './ReactIcon.svg';

  useEffect(() => {
    const image = new Image();
    image.src = logoSrc;
    image.onload = () => setAssetsReady(true);
    image.onerror = () => setAssetsReady(true);
  }, [logoSrc]);

  useEffect(() => {
    if (!assetsReady) return;
    const t = setTimeout(() => setPhase('out'), 3500);
    return () => clearTimeout(t);
  }, [assetsReady]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && phase === 'out') onDone();
  };

  return (
    <div
      className={`loading-screen${phase === 'out' ? ' loading-screen--out' : ''}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className={`loading-screen__content${assetsReady ? ' loading-screen__content--ready' : ''}`}>
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
