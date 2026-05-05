import React from 'react';
import './StarBorder.css';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
  starCount?: number;
  fullPath?: boolean;
  trailLength?: number; // In percentage (0-100)
  glowIntensity?: number; // 0 to 1
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 2,
  starCount = 1,
  fullPath = false,
  trailLength = 10,
  glowIntensity = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  // Helper to convert hex to rgba for intensity control
  const getRGBA = (hex: string, alpha: number) => {
    // Simple hex to rgba (assuming hex input like #f43f5e)
    if (hex.startsWith('#') && hex.length === 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex; // Fallback if not hex
  };

  const stars = Array.from({ length: starCount }).map((_, i) => {
    if (fullPath) {
      // Rotating variant uses a conic-gradient for a "longer line" trail
      const rotationOffset = (360 / starCount) * i;
      const baseAlpha = 0.8 * glowIntensity;
      
      // We use a conic-gradient centered on the component
      // The "star" is a colored segment of the circle
      return (
        <div
          key={i}
          className="star-element star-rotating"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${getRGBA(color, baseAlpha)} ${trailLength / 2}%, transparent ${trailLength}%)`,
            animationDuration: speed,
            transform: `rotate(${rotationOffset}deg)`,
            top: '-100%',
            left: '-100%',
            width: '300%',
            height: '300%',
          }}
        />
      );
    } else {
      // Sliding variant uses radial gradients
      const isTop = i % 2 === 0;
      const baseAlpha = 0.8 * glowIntensity;
      const glowAlpha = 0.2 * glowIntensity;
      
      return (
        <div
          key={i}
          className={`star-element ${isTop ? 'star-sliding-top' : 'star-sliding-bottom'}`}
          style={{
            background: `radial-gradient(circle at center, ${getRGBA(color, baseAlpha)} 0%, ${getRGBA(color, glowAlpha)} 30%, transparent 70%)`,
            animationDuration: speed,
            animationDelay: `${(parseFloat(speed as string) / starCount) * i}s`,
            width: `${trailLength * 3}%`, // Scale width based on trailLength
            height: '100%',
          }}
        />
      );
    }
  });

  return (
    <Component
      className={`star-border-container ${className}`}
      {...(rest as any)}
      style={{
        padding: `${thickness}px`,
        ...(rest as any).style
      }}
    >
      {stars}
      <div className="inner-content">{children}</div>
    </Component>
  );
};



export default StarBorder;

