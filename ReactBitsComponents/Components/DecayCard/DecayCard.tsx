import React, { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import "./DecayCard.css";

interface DecayCardProps {
  width?: number;
  height?: number;
  image?: string;
  children?: ReactNode;
}

const DecayCard: React.FC<DecayCardProps> = ({
  width = 300,
  height = 400,
  image = "https://picsum.photos/600/800?grayscale",
  children,
}) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const displacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
  const cursor = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cachedCursor = useRef({ ...cursor.current });
  const winsize = useRef({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    let isActive = true; // FIX: Flag to stop the loop on unmount

    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
    const map = (x: number, a: number, b: number, c: number, d: number) => 
      ((x - a) * (d - c)) / (b - a) + c;
    const distance = (x1: number, x2: number, y1: number, y2: number) => 
      Math.hypot(x1 - x2, y1 - y2);

    const handleResize = () => {
      winsize.current = { width: window.innerWidth, height: window.innerHeight };
    };

    const handleMouseMove = (ev: MouseEvent) => {
      cursor.current = { x: ev.clientX, y: ev.clientY };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    const imgValues = {
      imgTransforms: { x: 0, y: 0, rz: 0 },
      displacementScale: 0,
    };

    const render = () => {
      if (!isActive) return; // FIX: Stop loop if component is gone

      let targetX = lerp(
        imgValues.imgTransforms.x,
        map(cursor.current.x, 0, winsize.current.width, -80, 80),
        0.1
      );
      let targetY = lerp(
        imgValues.imgTransforms.y,
        map(cursor.current.y, 0, winsize.current.height, -80, 80),
        0.1
      );
      let targetRz = lerp(
        imgValues.imgTransforms.rz,
        map(cursor.current.x, 0, winsize.current.width, -5, 5),
        0.1
      );

      // Limit the movement bounds
      const bound = 40;
      if (targetX > bound) targetX = bound + (targetX - bound) * 0.2;
      if (targetX < -bound) targetX = -bound + (targetX + bound) * 0.2;
      
      imgValues.imgTransforms.x = targetX;
      imgValues.imgTransforms.y = targetY;
      imgValues.imgTransforms.rz = targetRz;

      if (svgRef.current) {
        gsap.set(svgRef.current, {
          x: imgValues.imgTransforms.x,
          y: imgValues.imgTransforms.y,
          rotateZ: imgValues.imgTransforms.rz,
        });
      }

      const movedDist = distance(
        cachedCursor.current.x, cursor.current.x,
        cachedCursor.current.y, cursor.current.y
      );

      imgValues.displacementScale = lerp(
        imgValues.displacementScale,
        map(movedDist, 0, 150, 0, 300),
        0.08
      );

      if (displacementMapRef.current) {
        gsap.set(displacementMapRef.current, {
          attr: { scale: imgValues.displacementScale },
        });
      }

      cachedCursor.current = { ...cursor.current };
      requestAnimationFrame(render);
    };

    render();

    return () => {
      isActive = false; // Kill loop
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="decay-card-wrapper"
      style={{ width: `${width}px`, height: `${height}px` }}
      ref={svgRef}
    >
      <svg
        viewBox="0 0 600 800"
        className="decay-svg"
      >
        <filter id="decayFilter">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="3"
            seed="2"
            result="noise"
          />
          <feDisplacementMap
            ref={displacementMapRef}
            in="SourceGraphic"
            in2="noise"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <image
          href={image}
          x="0"
          y="0"
          width="600"
          height="800"
          filter="url(#decayFilter)"
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
      <div className="card-text-overlay">{children}</div>
    </div>
  );
};

export default DecayCard;
