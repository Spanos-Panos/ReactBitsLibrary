import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const lerp = (a: number, b: number, n: number): number => (1 - n) * a + n * b;

interface CrosshairProps {
  color?: string;
  containerRef?: React.RefObject<HTMLElement | null>;
}

const Crosshair: React.FC<CrosshairProps> = ({ color = 'white', containerRef }) => {
  const lineHorizontalRef = useRef<HTMLDivElement>(null);
  const lineVerticalRef = useRef<HTMLDivElement>(null);
  const filterXRef = useRef<SVGFETurbulenceElement>(null);
  const filterYRef = useRef<SVGFETurbulenceElement>(null);
  
  // Refs for tracking values outside the render cycle
  const mouse = useRef({ x: 0, y: 0 });
  const renderedStyles = useRef({
    tx: { previous: 0, current: 0, amt: 0.15 },
    ty: { previous: 0, current: 0, amt: 0.15 }
  });
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const target = containerRef?.current || window;

    // --- MOUSE TRACKING ---
    const handleMouseMove = (ev: Event) => {
      const mouseEvent = ev as MouseEvent;
      if (containerRef?.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        mouse.current.x = mouseEvent.clientX - bounds.left;
        mouse.current.y = mouseEvent.clientY - bounds.top;

        // Auto-show/hide based on bounds
        const isInside = 
          mouseEvent.clientX >= bounds.left &&
          mouseEvent.clientX <= bounds.right &&
          mouseEvent.clientY >= bounds.top &&
          mouseEvent.clientY <= bounds.bottom;

        gsap.to([lineHorizontalRef.current, lineVerticalRef.current], {
          opacity: isInside ? 1 : 0,
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        mouse.current.x = mouseEvent.clientX;
        mouse.current.y = mouseEvent.clientY;
      }
    };

    // --- NOISE ANIMATION ---
    const primitiveValues = { turbulence: 0 };
    const tl = gsap.timeline({
      paused: true,
      onStart: () => {
        if (lineHorizontalRef.current) lineHorizontalRef.current.style.filter = 'url(#filter-noise-x)';
        if (lineVerticalRef.current) lineVerticalRef.current.style.filter = 'url(#filter-noise-y)';
      },
      onUpdate: () => {
        if (filterXRef.current) filterXRef.current.setAttribute('baseFrequency', primitiveValues.turbulence.toString());
        if (filterYRef.current) filterYRef.current.setAttribute('baseFrequency', primitiveValues.turbulence.toString());
      },
      onComplete: () => {
        if (lineHorizontalRef.current) lineHorizontalRef.current.style.filter = 'none';
        if (lineVerticalRef.current) lineVerticalRef.current.style.filter = 'none';
      }
    }).to(primitiveValues, {
      duration: 0.5,
      startAt: { turbulence: 0.08 }, // Subtler noise scale
      turbulence: 0,
      ease: 'power2.out'
    });

    const onMouseEnterLink = () => tl.restart();

    // --- RENDER LOOP ---
    const render = () => {
      renderedStyles.current.tx.current = mouse.current.x;
      renderedStyles.current.ty.current = mouse.current.y;

      // Lerp for smooth "lagging" movement
      renderedStyles.current.tx.previous = lerp(
        renderedStyles.current.tx.previous, 
        renderedStyles.current.tx.current, 
        renderedStyles.current.tx.amt
      );
      renderedStyles.current.ty.previous = lerp(
        renderedStyles.current.ty.previous, 
        renderedStyles.current.ty.current, 
        renderedStyles.current.ty.amt
      );

      // Apply coordinates
      if (lineVerticalRef.current) {
        gsap.set(lineVerticalRef.current, { x: renderedStyles.current.tx.previous });
      }
      if (lineHorizontalRef.current) {
        gsap.set(lineHorizontalRef.current, { y: renderedStyles.current.ty.previous });
      }

      requestRef.current = requestAnimationFrame(render);
    };

    // Initialize
    target.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(render);

    const links = (containerRef?.current || document).querySelectorAll('a');
    links.forEach(link => link.addEventListener('mouseenter', onMouseEnterLink));

    return () => {
      target.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
      links.forEach(link => link.removeEventListener('mouseenter', onMouseEnterLink));
      tl.kill();
    };
  }, [containerRef]);

  return (
    <div
      className="crosshair-wrapper"
      style={{
        position: containerRef ? 'absolute' : 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {/* SVG Filters for the noise effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="filter-noise-x">
            <feTurbulence type="fractalNoise" baseFrequency="0" numOctaves="1" ref={filterXRef} />
            <feDisplacementMap in="SourceGraphic" scale="30" />
          </filter>
          <filter id="filter-noise-y">
            <feTurbulence type="fractalNoise" baseFrequency="0" numOctaves="1" ref={filterYRef} />
            <feDisplacementMap in="SourceGraphic" scale="30" />
          </filter>
        </defs>
      </svg>

      {/* Crosshair Lines */}
      <div
        ref={lineHorizontalRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '1px',
          background: color,
          opacity: 0,
          willChange: 'transform, opacity'
        }}
      />
      <div
        ref={lineVerticalRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '1px',
          height: '100%',
          background: color,
          opacity: 0,
          willChange: 'transform, opacity'
        }}
      />
    </div>
  );
};

export default Crosshair;
