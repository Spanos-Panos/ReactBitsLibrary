import React, { useState, useEffect, useRef, ReactNode, HTMLAttributes } from "react";

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2, // Lower = stronger movement
  activeTransition = "transform 0.1s ease-out", // Fast tracking
  inactiveTransition = "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)", // Smooth snap back
  wrapperClassName = "",
  innerClassName = "",
  ...props
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;

      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      
      // Calculate the center of the element relative to the viewport
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Distance between mouse and center
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;

      // Check if mouse is within the "magnetic field" (padding)
      if (Math.abs(distX) < width / 2 + padding && Math.abs(distY) < height / 2 + padding) {
        setIsActive(true);
        // Apply the movement
        const offsetX = distX / magnetStrength;
        const offsetY = distY / magnetStrength;
        setPosition({ x: offsetX, y: offsetY });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [padding, disabled, magnetStrength]);

  return (
    <div
      ref={magnetRef}
      className={wrapperClassName}
      style={{ position: "relative", display: "inline-block" }}
      {...props}
    >
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          // If active, use very fast transition or 'none'. If inactive, snap back smoothly.
          transition: isActive ? activeTransition : inactiveTransition,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
