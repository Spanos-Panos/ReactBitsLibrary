import React, { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./CardNav.css";

const TOP_BAR_HEIGHT = 56;
const CONTENT_GAP = 16;

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
};

export interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items?: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
  categories?: { id: string; label: string }[];
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = "Logo",
  items = [],
  className = "",
  ease = "power3.out",
  baseColor = "rgba(9, 12, 20, 0.55)",
  menuColor = "rgba(255,255,255,0.8)",
  searchValue = "",
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories = [],
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content") as HTMLElement;
      if (contentEl) {
        const wasVisibility = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;
        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";
        contentEl.offsetHeight;
        const contentHeight = contentEl.scrollHeight;
        contentEl.style.visibility = wasVisibility;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;
        return TOP_BAR_HEIGHT + contentHeight + CONTENT_GAP;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: TOP_BAR_HEIGHT, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, "-=0.1");
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); tlRef.current = null; };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        gsap.set(navRef.current, { height: calculateHeight() });
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) { newTl.progress(1); tlRef.current = newTl; }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) tlRef.current = newTl;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const [leftCard, ...restCards] = items;

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""}`}
        style={{ backgroundColor: baseColor }}
      >
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <img src={logo} alt={logoAlt} className="logo" />
          </div>

          <div className="card-nav-search-wrapper">
            <svg className="card-nav-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="card-nav-search"
              type="search"
              placeholder="Search components..."
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* ── Expanded cards ───────────────────────────────────────────── */}
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {/* Left card — categories */}
          <div
            className="nav-card"
            ref={setCardRef(0)}
            style={{ backgroundColor: leftCard?.bgColor, color: leftCard?.textColor }}
          >
            <div className="nav-card-label">{leftCard?.label ?? "Categories"}</div>
            <div className="nav-card-categories">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`nav-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => { onCategoryChange?.(cat.id); toggleMenu(); }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Middle + right cards — decorative placeholders */}
          {restCards.map((item, i) => (
            <div
              key={item.label}
              className="nav-card nav-card--placeholder"
              ref={setCardRef(i + 1)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
