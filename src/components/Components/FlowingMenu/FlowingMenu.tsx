import React from "react";
import { gsap } from "gsap";
import "./FlowingMenu.css";

interface MenuItemProps {
  text: string;
  onClick: () => void;
}

interface FlowingMenuProps {
  items?: MenuItemProps[];
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({ items = [] }) => {
  return (
    <div className="flowing-menu-wrap">
      <nav className="flowing-menu">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} />
        ))}
      </nav>
    </div>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ text, onClick }) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const marqueeInnerRef = React.useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const animationDefaults: gsap.TweenVars = { duration: 0.4, ease: "power2.out" };

  const distMetric = (x: number, y: number, x2: number, y2: number): number => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ): "top" | "bottom" => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const handleMouseEnter = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (isTransitioning) return;
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    const tl = gsap.timeline({ defaults: { duration: 0.3, ease: "power3.out" } });
    const content = itemRef.current.querySelector(".flowing-menu__item-content");

    // Clear any previous animations to avoid "below" position bugs
    gsap.killTweensOf([marqueeRef.current, marqueeInnerRef.current, content]);

    tl.set(marqueeRef.current, {
      yPercent: edge === "top" ? -100 : 100,
      autoAlpha: 1
    }, 0)
      .set(marqueeInnerRef.current, { yPercent: edge === "top" ? 100 : -100 }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { yPercent: 0 }, 0)
      .to(content, { opacity: 0, duration: 0.1 }, 0);
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (isTransitioning) return;
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    const tl = gsap.timeline({ defaults: { duration: 0.3, ease: "power3.inOut" } });
    const content = itemRef.current.querySelector(".flowing-menu__item-content");

    tl.to(marqueeRef.current, { yPercent: edge === "top" ? -100 : 100, autoAlpha: 0 }, 0)
      .to(marqueeInnerRef.current, { yPercent: edge === "top" ? 100 : -100 }, 0)
      .to(content, { opacity: 1, duration: 0.2 }, 0);
  };

  const handleItemClick = () => {
    if (isTransitioning || !marqueeRef.current) return;
    
    setIsTransitioning(true);
    
    // Stop all active hover animations
    gsap.killTweensOf([marqueeRef.current, marqueeInnerRef.current]);

    // Capture exact current coordinates to prevent teleporting
    const rect = marqueeRef.current.getBoundingClientRect();

    // Transition to full screen
    const tl = gsap.timeline({
      onComplete: () => {
        onClick();
      }
    });

    // Seemlessly snap to fixed position before animating
    tl.set(marqueeRef.current, {
      position: "fixed",
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      margin: 0,
      zIndex: 9999
    });

    tl.to(marqueeRef.current, {
      duration: 4,
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "#0ea5e9", // Ensure it's the solid brand color
      ease: "power2.inOut",
      webkitMaskImage: "none", // Remove mask for full screen coverage
      maskImage: "none"
    });
  };

  const repeatedMarqueeContent = React.useMemo(() => {
    return Array.from({ length: 8 }).map((_, idx) => (
      <React.Fragment key={idx}>
        <span className="marquee__text">{text}</span>
      </React.Fragment>
    ));
  }, [text]);

  return (
    <div className="flowing-menu__item" ref={itemRef}>
      <div
        className="flowing-menu__item-link"
        onClick={handleItemClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flowing-menu__item-content">
          <span className="item-text">{text}</span>
        </div>

        <div className="flowing-marquee" ref={marqueeRef}>
          <div className="flowing-marquee__inner-wrap" ref={marqueeInnerRef}>
            <div className="flowing-marquee__inner" aria-hidden="true">
              {repeatedMarqueeContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowingMenu;
