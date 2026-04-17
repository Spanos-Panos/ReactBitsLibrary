import React, { useRef, useEffect, useState, UIEvent } from "react";
import "./AnimatedList.css";

export type ListSectionItem = {
  id: string;
  name: string;
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
        if (entry.isIntersecting) el.classList.add("al-item-wrap--visible");
        else el.classList.remove("al-item-wrap--visible");
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
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setTopOpacity(Math.min(el.scrollTop / 50, 1));
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setBottomOpacity(el.scrollHeight <= el.clientHeight ? 0 : Math.min(dist / 50, 1));
  };

  useEffect(() => {
    if (!activeCategory) return;
    const el = sectionRefs.current[activeCategory];
    if (el && listRef.current) {
      listRef.current.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
    }
  }, [activeCategory]);

  let globalIndex = 0;

  return (
    <div className={`al-container ${className}`}>
      <div ref={listRef} className="al-scroll" onScroll={handleScroll} onMouseLeave={() => onItemHover?.(null)}>
        {sections.map(section => (
          <div key={section.id} className="al-section">
            <div
              ref={el => { sectionRefs.current[section.id] = el; }}
              className="al-section-header"
            >
              {section.label}
              <span className="al-section-count">{section.items.length}</span>
            </div>

            {section.items.map(item => {
              globalIndex++;
              const isActive = selectedId === item.id;
              const isChecked = selectedIds.includes(item.id);
              return (
                <AnimatedItem key={item.id}>
                  <div
                    className={`al-item ${isActive ? "al-item--active" : ""}`}
                    onClick={() => onItemClick?.(item.id)}
                    onMouseEnter={() => onItemHover?.(item.id)}
                  >
                    <span className="al-item-name">{item.name}</span>
                    <div className="al-item-right">
                      <div
                        className={`al-checkbox ${isChecked ? "al-checkbox--checked" : ""}`}
                        onClick={e => { e.stopPropagation(); onItemCheck?.(item.id, e); }}
                        title={isChecked ? "Deselect" : "Select for build"}
                      >
                        {isChecked && (
                          <svg viewBox="0 0 10 8" fill="none" aria-hidden="true">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedItem>
              );
            })}

            {section.items.length === 0 && (
              <p className="al-empty">No results</p>
            )}
          </div>
        ))}
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
