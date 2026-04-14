import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import "./RollingGallery.css";

const IMGS: string[] = [
  "/joker-portrait.jpg",
  "/joker-portrait.jpg",
  "/joker-portrait.jpg",
  "/joker-portrait.jpg",
  "/joker-portrait.jpg",
  "/joker-portrait.jpg",
  "/joker-portrait.jpg",
  "https://plus.unsplash.com/premium_photo-1664910706524-e783eed89e71?q=80&w=3869&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "/joker-portrait.jpg",
  "/joker-portrait.jpg",
];

interface RollingGalleryProps {
  autoplay?: boolean;
  pauseOnHover?: boolean;
  images?: string[];
}

const RollingGallery: React.FC<RollingGalleryProps> = ({
  autoplay = false,
  pauseOnHover = false,
  images = IMGS,
}) => {
  const [isScreenSizeSm, setIsScreenSizeSm] = useState<boolean>(
    window.innerWidth <= 640
  );

  const cylinderWidth: number = isScreenSizeSm ? 1100 : 1800;
  const faceCount: number = images.length;
  const faceWidth: number = (cylinderWidth / faceCount) * 1.5;
  const dragFactor: number = 0.05;
  const radius: number = cylinderWidth / (2 * Math.PI);

  const rotation = useMotionValue(0);
  const dragStartRotation = useRef<number>(0);
  const autoplayControls = useRef<AnimationPlaybackControls | null>(null);

  const startAutoplay = () => {
    autoplayControls.current = animate(rotation, [rotation.get(), rotation.get() - 360], {
      duration: 20,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });
  };

  const stopAutoplay = () => {
    autoplayControls.current?.stop();
    autoplayControls.current = null;
  };

  useEffect(() => {
    if (autoplay) {
      startAutoplay();
      return () => stopAutoplay();
    }
  }, [autoplay]);

  useEffect(() => {
    const handleResize = () => {
      setIsScreenSizeSm(window.innerWidth <= 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDragStart = (): void => {
    dragStartRotation.current = rotation.get();
    stopAutoplay();
  };

  const handleDrag = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: any
  ): void => {
    rotation.set(dragStartRotation.current + info.offset.x * dragFactor);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: any
  ): void => {
    animate(rotation, rotation.get() + info.velocity.x * dragFactor, {
      type: "spring",
      stiffness: 60,
      damping: 20,
      mass: 0.1,
      onComplete: () => {
        if (autoplay) startAutoplay();
      },
    });
  };

  const handleMouseEnter = (): void => {
    if (autoplay && pauseOnHover && autoplayControls.current) stopAutoplay();
  };

  const handleMouseLeave = (): void => {
    if (autoplay && pauseOnHover) startAutoplay();
  };

  return (
    <div className="gallery-container">
      <div className="gallery-gradient gallery-gradient-left"></div>
      <div className="gallery-gradient gallery-gradient-right"></div>
      <div className="gallery-content">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          className="gallery-track"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {images.map((url, i) => (
            <div
              key={i}
              className="gallery-item"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${(360 / faceCount) * i}deg) translateZ(${radius}px)`,
              }}
            >
              <img src={url} alt="gallery" className="gallery-img" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default RollingGallery;
