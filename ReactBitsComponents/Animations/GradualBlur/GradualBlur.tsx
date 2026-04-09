import React, { CSSProperties, useRef, useState, useMemo, PropsWithChildren } from 'react';

type GradualBlurProps = {
  position?: 'top' | 'bottom' | 'left' | 'right';
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  opacity?: number;
  curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out';
  target?: 'parent' | 'page';
  className?: string;
  style?: CSSProperties;
};

const CURVE_FUNCTIONS: Record<string, (p: number) => number> = {
  linear: p => p,
  bezier: p => p * p * (3 - 2 * p),
  'ease-in': p => p * p,
  'ease-out': p => 1 - Math.pow(1 - p, 2),
  'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
};

const GradualBlur: React.FC<PropsWithChildren<GradualBlurProps>> = ({
  position = 'bottom',
  strength = 2,
  height = '6rem',
  width = '100%',
  divCount = 8,
  exponential = false,
  zIndex = 1000,
  opacity = 1,
  curve = 'linear',
  target = 'parent',
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const curveFunc = CURVE_FUNCTIONS[curve] || CURVE_FUNCTIONS.linear;
    
    // Direction map for the mask
    const directions = { top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' };
    const dir = directions[position];

    for (let i = 1; i <= divCount; i++) {
      const progress = curveFunc(i / divCount);
      
      // Calculate Blur Value
      const blurValue = exponential 
        ? Math.pow(2, progress * 4) * 0.0625 * strength 
        : progress * strength;

      // Mask logic: we create overlapping strips to ensure no "cracks" appear
      const pStart = Math.max(0, ((i - 1) / divCount) * 100 - 1); // -1 for overlap
      const pEnd = (i / divCount) * 100;

      const divStyle: CSSProperties = {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        // Layering masks based on the position prop
        WebkitMaskImage: `linear-gradient(${dir}, transparent ${pStart}%, black ${pEnd}%)`,
        maskImage: `linear-gradient(${dir}, transparent ${pStart}%, black ${pEnd}%)`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: opacity,
        willChange: 'backdrop-filter',
      };

      divs.push(<div key={i} style={divStyle} />);
    }
    return divs;
  }, [position, strength, divCount, exponential, opacity, curve]);

  const containerStyle: CSSProperties = useMemo(() => {
    const isVertical = ['top', 'bottom'].includes(position);
    
    return {
      position: target === 'page' ? 'fixed' : 'absolute',
      zIndex,
      left: 0,
      right: 0,
      top: position === 'top' ? 0 : 'auto',
      bottom: position === 'bottom' ? 0 : 'auto',
      height: isVertical ? height : '100%',
      width: isVertical ? '100%' : width,
      pointerEvents: 'none',
      ...style
    };
  }, [position, target, height, width, zIndex, style]);

  return (
    <div ref={containerRef} className={`gradual-blur ${className}`} style={containerStyle}>
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {blurDivs}
      </div>
    </div>
  );
};

export default React.memo(GradualBlur);
