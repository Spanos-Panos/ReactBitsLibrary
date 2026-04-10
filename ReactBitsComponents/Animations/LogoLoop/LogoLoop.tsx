import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './LogoLoop.css';

export type LogoItem =
  | { node: React.ReactNode; href?: string; title?: string; ariaLabel?: string; }
  | { src: string; alt?: string; href?: string; title?: string; srcSet?: string; sizes?: string; width?: number; height?: number; };

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  verticalPosition?: 'top' | 'center' | 'bottom';
}

const SMOOTH_TAU = 0.15;
const MIN_COPIES = 2;

const toCssLength = (v?: number | string) =>
  typeof v === 'number' ? `${v}px` : (v ?? '100%');

export const LogoLoop: React.FC<LogoLoopProps> = ({
  logos,
  speed = 120,
  direction = 'left',
  width = '100%',
  logoHeight = 28,
  gap = 32,
  pauseOnHover,
  hoverSpeed,
  fadeOut = false,
  fadeOutColor = '#000000',
  scaleOnHover = false,
  ariaLabel = 'Logo loop',
  className,
  style,
  verticalPosition = 'center',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [seqHeight, setSeqHeight] = useState(0);
  const [copyCount, setCopyCount] = useState(MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  const isVertical = direction === 'up' || direction === 'down';

  const effectiveHoverSpeed = useMemo(() => {
    if (hoverSpeed !== undefined) return hoverSpeed;
    return pauseOnHover ? 0 : undefined;
  }, [hoverSpeed, pauseOnHover]);

  const targetVelocity = useMemo(() => {
    const magnitude = Math.abs(speed);
    const dirMult = direction === 'left' || direction === 'up' ? 1 : -1;
    return magnitude * dirMult;
  }, [speed, direction]);

  const updateDimensions = useCallback(() => {
    const container = containerRef.current;
    const seq = seqRef.current;
    if (!container || !seq) return;

    const rect = seq.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    if (isVertical) {
      const h = Math.ceil(rect.height);
      if (h > 0) {
        setSeqHeight(h);
        setCopyCount(Math.max(MIN_COPIES, Math.ceil(container.offsetHeight / h) + 2));
      }
    } else {
      const w = Math.ceil(rect.width);
      if (w > 0) {
        setSeqWidth(w);
        setCopyCount(Math.max(MIN_COPIES, Math.ceil(container.offsetWidth / w) + 2));
      }
    }
  }, [isVertical]);

  useEffect(() => {
    const ro = new ResizeObserver(updateDimensions);
    if (containerRef.current) ro.observe(containerRef.current);
    if (seqRef.current) ro.observe(seqRef.current);
    // Defer to ensure layout is complete
    const t = setTimeout(updateDimensions, 50);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [updateDimensions, logos, gap, logoHeight]);

  // Animation refs — live outside the effect so cancel always works
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const animate = (time: number) => {
      // First frame: just record timestamp, don't move yet
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Cap delta to avoid a huge jump after tab is backgrounded
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const target =
        isHovered && effectiveHoverSpeed !== undefined
          ? effectiveHoverSpeed
          : targetVelocity;

      const easing = 1 - Math.exp(-delta / SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easing;

      const size = isVertical ? seqHeight : seqWidth;
      if (size > 0) {
        // Positive modulo so offset never goes negative
        offsetRef.current =
          ((offsetRef.current + velocityRef.current * delta) % size + size) % size;
        const x = isVertical ? 0 : -offsetRef.current;
        const y = isVertical ? -offsetRef.current : 0;
        track.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      // Always store the latest RAF id so cleanup can cancel it
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [isVertical, seqWidth, seqHeight, isHovered, effectiveHoverSpeed, targetVelocity]);

  const alignSelf =
    verticalPosition === 'top' ? 'flex-start'
    : verticalPosition === 'bottom' ? 'flex-end'
    : 'center';

  const classes = [
    'logoloop',
    isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
    fadeOut ? 'logoloop--fade' : '',
    scaleOnHover ? 'logoloop--scale-hover' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={classes}
      style={{
        width: isVertical ? 'auto' : toCssLength(width),
        height: isVertical ? '100%' : undefined,
        alignSelf,
        '--logoloop-gap': `${gap}px`,
        '--logoloop-logoHeight': `${logoHeight}px`,
        '--logoloop-fadeColor': fadeOutColor,
        ...style,
      } as React.CSSProperties}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={() => { if (effectiveHoverSpeed !== undefined) setIsHovered(true); }}
      onMouseLeave={() => { if (effectiveHoverSpeed !== undefined) setIsHovered(false); }}
    >
      <div className="logoloop__track" ref={trackRef}>
        {Array.from({ length: copyCount }).map((_, i) => (
          <ul
            className="logoloop__list"
            key={i}
            ref={i === 0 ? seqRef : null}
            aria-hidden={i > 0}
          >
            {logos.map((logo, idx) => (
              <li className="logoloop__item" key={idx}>
                {'node' in logo ? (
                  <div className="logoloop__node">{logo.node}</div>
                ) : (
                  <img
                    src={logo.src}
                    srcSet={(logo as any).srcSet}
                    sizes={(logo as any).sizes}
                    width={(logo as any).width}
                    height={(logo as any).height}
                    alt={logo.alt ?? ''}
                    title={logo.title}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};

LogoLoop.displayName = 'LogoLoop';
export default LogoLoop;
