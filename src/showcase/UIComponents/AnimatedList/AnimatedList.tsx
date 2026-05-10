import React, { useRef, useEffect, useState, UIEvent } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import "./AnimatedList.css";

export type ListSectionItem = {
  id: string;
  name: string;
  /** Optional performance weight tier — drives the small "L/M/H" badge on the right. */
  weight?: 'light' | 'medium' | 'heavy';
};

export type ListSection = {
  id: string;
  label: string;
  items: ListSectionItem[];
};

const AnimatedItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("al-item-wrap--visible");
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="al-item-wrap">
      {children}
    </div>
  );
};

interface AnimatedListProps {
  sections: ListSection[];
  selectedId?: string | null;
  selectedIds?: string[];
  activeCategory?: string;
  showGradients?: boolean;
  onItemClick?: (id: string) => void;
  onItemHover?: (id: string | null) => void;
  onItemCheck?: (id: string, e: React.MouseEvent) => void;
  className?: string;
}

export default function AnimatedList({
  sections,
  selectedId,
  selectedIds = [],
  activeCategory,
  showGradients = true,
  onItemClick,
  onItemHover,
  onItemCheck,
  className = "",
}: AnimatedListProps) {
  const [btnHoverId, setBtnHoverId] = useState<string | null>(null);
  const [recentCheckedId, setRecentCheckedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevCategoryRef = useRef<string | null>(null);
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);
  const contentControls = useAnimationControls();

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setTopOpacity(Math.min(el.scrollTop / 50, 1));
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setBottomOpacity(el.scrollHeight <= el.clientHeight ? 0 : Math.min(dist / 50, 1));
  };

  useEffect(() => {
    if (!activeCategory) return;
    const prevIdx = sections.findIndex(s => s.id === (prevCategoryRef.current ?? activeCategory));
    const nextIdx = sections.findIndex(s => s.id === activeCategory);
    const dir = nextIdx >= prevIdx ? 1 : -1;
    prevCategoryRef.current = activeCategory;
    contentControls.set({ opacity: 0, y: dir * 28 });
    contentControls.start({ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } });
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = sectionRefs.current[activeCategory];
        const container = listRef.current;
        if (!el || !container) return;
        const relativeTop = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
        container.scrollTop = relativeTop - 8;
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [activeCategory]);

  return (
    <div className={`al-container ${className}`}>
      <div ref={listRef} className="al-scroll" onScroll={handleScroll} onMouseLeave={() => onItemHover?.(null)}>
        <motion.div animate={contentControls}>
        {sections.map(section => (
          <div key={section.id} className="al-section" ref={el => { sectionRefs.current[section.id] = el; }}>
            <div className="al-section-header">
              {section.label}
            </div>

            {section.items.map(item => {
              const isActive = selectedId === item.id;
              const isSelected = selectedIds.includes(item.id);
              return (
                <AnimatedItem key={item.id}>
                  <div
                    className={`al-item ${isActive ? "al-item--active" : ""} ${isSelected ? "al-item--selected" : ""}`}
                    onClick={() => onItemClick?.(item.id)}
                    onMouseEnter={() => onItemHover?.(item.id)}
                  >
                    <button
                      className={`al-select-btn ${isSelected ? "al-select-btn--selected" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // If we are selecting (not deselecting), set a temporary success state
                        if (!isSelected) {
                          setRecentCheckedId(item.id);
                          setTimeout(() => setRecentCheckedId(null), 1200);
                        }
                        onItemCheck?.(item.id, e);
                      }}
                      onMouseEnter={() => setBtnHoverId(item.id)}
                      onMouseLeave={() => setBtnHoverId(null)}
                      title={isSelected ? "Remove from project" : "Add to project"}
                    >
                      <AnimatePresence mode="wait">
                        {!isSelected ? (
                          <motion.svg
                            key="plus"
                            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </motion.svg>
                        ) : btnHoverId === item.id && recentCheckedId !== item.id ? (
                          <motion.svg
                            key="remove"
                            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </motion.svg>
                        ) : (
                          <motion.svg
                            key="check"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"/>
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </button>
                    <span className="al-item-name">
                      <span className="al-item-name__text">{item.name}</span>
                    </span>
                  </div>
                </AnimatedItem>
              );
            })}

            {section.items.length === 0 && (
              <p className="al-empty">No results</p>
            )}
          </div>
        ))}
        </motion.div>
      </div>

      {showGradients && (
        <>
          <div className="al-gradient al-gradient--top" style={{ opacity: topOpacity }} />
          <div className="al-gradient al-gradient--bottom" style={{ opacity: bottomOpacity }} />
        </>
      )}
    </div>
  );
}
