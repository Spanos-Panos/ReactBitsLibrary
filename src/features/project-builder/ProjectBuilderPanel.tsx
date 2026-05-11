import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './ProjectBuilderPanel.css';
import type { ReactBitsItem, PageConfig, PageType } from '../../shared/types/index';
import {
  isNavigationComponentName,
  getWeight,
  tallyWeights,
  describeBudgetViolations,
  WEIGHT_BUDGETS,
  DEFAULT_PERFORMANCE_PROFILE_ID,
  type WeightTier,
  type PerformanceProfile,
} from '../../shared/data/componentRoles';
import type {
  AestheticPreset,
  ClientBrief,
  ColorEntry,
  ColorRole,
  ColorStrategy,
  ComponentItem,
  DesignRules,
  FontEntry,
  FontRole,
  ImageCategory,
  ImageEntry,
  ProjectBuilderPanelProps,
  ScrollbarStyle,
  StyleDirection,
  TypographyIntensity,
} from './builderTypes';
import { DEFAULT_DESIGN_RULES, DEFAULT_STYLE_DIRECTION, DEFAULT_CLIENT_BRIEF } from './builderDefaults';

type Tab = 'Brief' | 'Style' | 'Fonts' | 'Colors' | 'Sizes' | 'Images' | 'Output' | 'Pages';
const TABS: Tab[] = ['Brief', 'Style', 'Fonts', 'Colors', 'Sizes', 'Pages', 'Images', 'Output'];


type AssemblyCategoryId = 'Components' | 'Backgrounds' | 'Animations' | 'TextAnimations';

/** Grid order: top Components | Backgrounds, bottom Animations | Text */
const ASSEMBLY_GRID_CATEGORIES: { id: AssemblyCategoryId; tileLabel: string; popoverTitle: string }[] = [
  { id: 'Components', tileLabel: 'Components', popoverTitle: 'Components' },
  { id: 'Backgrounds', tileLabel: 'Backgrounds', popoverTitle: 'Backgrounds' },
  { id: 'Animations', tileLabel: 'Animations', popoverTitle: 'Animations' },
  { id: 'TextAnimations', tileLabel: 'Text', popoverTitle: 'Text animations' },
];

function groupSelectedByAssemblyCategory(components: ComponentItem[]): Record<AssemblyCategoryId, ComponentItem[]> {
  const buckets: Record<AssemblyCategoryId, ComponentItem[]> = {
    Components: [],
    Backgrounds: [],
    Animations: [],
    TextAnimations: [],
  };
  for (const c of components) {
    if (c.category in buckets) buckets[c.category as AssemblyCategoryId].push(c);
  }
  return buckets;
}

function WeightBadge({ weight, size = 'sm' }: { weight: WeightTier; size?: 'xs' | 'sm' }) {
  const titleMap: Record<WeightTier, string> = {
    light: 'Light — minimal runtime cost',
    medium: 'Medium — moderate runtime cost',
    heavy: 'Heavy — significant GPU/CPU cost',
  };
  const labelMap: Record<WeightTier, string> = {
    light: 'L',
    medium: 'M',
    heavy: 'H',
  };
  return (
    <span
      title={titleMap[weight]}
      className={`pbp-weight-badge pbp-weight-badge--${weight} ${size === 'xs' ? 'pbp-weight-badge--xs' : 'pbp-weight-badge--sm'}`}
    >
      {labelMap[weight]}
    </span>
  );
}

function AssemblySelectedCategories({
  selectedComponents,
  maxSelectedComponents,
  performanceProfile,
}: {
  selectedComponents: ComponentItem[];
  maxSelectedComponents: number;
  performanceProfile: PerformanceProfile;
}) {
  const grouped = useMemo(() => groupSelectedByAssemblyCategory(selectedComponents), [selectedComponents]);
  const [popover, setPopover] = useState<{ id: AssemblyCategoryId; rect: DOMRect } | null>(null);

  const weightTally = useMemo(
    () => tallyWeights(selectedComponents.map(c => c.name)),
    [selectedComponents],
  );
  const violations = useMemo(
    () => describeBudgetViolations(weightTally, performanceProfile),
    [weightTally, performanceProfile],
  );
  const overBudget = violations.length > 0;

  useEffect(() => {
    if (!popover) return;
    const close = () => setPopover(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [popover]);

  const openTile = (id: AssemblyCategoryId, e: React.MouseEvent<HTMLButtonElement>) => {
    if (popover?.id === id) { setPopover(null); return; }
    setPopover({ id, rect: e.currentTarget.getBoundingClientRect() });
  };

  // Keep last valid computed display data alive during exit animation
  const lastPopoverDataRef = useRef<{
    meta: typeof ASSEMBLY_GRID_CATEGORIES[0] | undefined;
    items: ComponentItem[];
    style: { top: number; left: number; width: number };
  } | null>(null);

  const popoverItems = popover ? grouped[popover.id] : [];
  const popoverMeta = popover ? ASSEMBLY_GRID_CATEGORIES.find(c => c.id === popover.id) : null;

  const popStyle = popover
    ? (() => {
        const { rect } = popover;
        const w = 256;
        const margin = 10;
        let left = rect.right - w;
        if (left < margin) left = margin;
        if (left + w > window.innerWidth - margin) left = window.innerWidth - w - margin;
        let top = rect.bottom + 8;
        const est = Math.min(280, 48 + popoverItems.length * 40);
        if (top + est > window.innerHeight - margin) {
          top = Math.max(margin, rect.top - est - 8);
        }
        return { top, left, width: w } as const;
      })()
    : null;

  // Update ref whenever popover is open with fresh data
  if (popover && popStyle && popoverMeta !== undefined) {
    lastPopoverDataRef.current = {
      meta: popoverMeta ?? undefined,
      items: popoverItems,
      style: popStyle,
    };
  }

  // During exit animation, fall back to the last recorded data
  const displayMeta = popoverMeta ?? lastPopoverDataRef.current?.meta;
  const displayItems = popover ? popoverItems : (lastPopoverDataRef.current?.items ?? []);
  const displayStyle = popStyle ?? lastPopoverDataRef.current?.style ?? null;

  return (
    <>
      <div className="pbp-assembly-selected-head">
        <span className="pbp-brief-label">Selected components</span>
        <span className="pbp-brief-label pbp-assembly-selected-cap" aria-live="polite" style={{ position: 'relative', overflow: 'hidden', display: 'inline-flex' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={selectedComponents.length}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              style={{ display: 'inline-block' }}
            >
              {selectedComponents.length}/{maxSelectedComponents}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <div className="pbp-assembly-cat-grid" role="group" aria-label="Selected components by category">
        {ASSEMBLY_GRID_CATEGORIES.map(cat => {
          const count = grouped[cat.id].length;
          return (
            <button
              key={cat.id}
              type="button"
              className={`pbp-assembly-cat-tile${count === 0 ? ' pbp-assembly-cat-tile--zero' : ''}`}
              onClick={e => openTile(cat.id, e)}
              aria-expanded={popover?.id === cat.id}
              aria-haspopup="dialog"
            >
              <span className="pbp-assembly-cat-tile-inner">
                <span className="pbp-assembly-cat-tile-label">{cat.tileLabel}</span>
                <span className="pbp-assembly-cat-tile-count" style={{ position: 'relative', overflow: 'hidden', display: 'inline-flex', minWidth: '1ch' }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={count}
                      initial={{ y: 10, opacity: 0, scale: 0.7 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -10, opacity: 0, scale: 0.7 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ display: 'inline-block' }}
                    >
                      {count}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Performance advisory tally */}
      {selectedComponents.length > 0 && (
        <div
          className={`pbp-perf-tally${overBudget ? ' pbp-perf-tally--over' : ''}`}
          aria-live="polite"
        >
          <span className="pbp-perf-tally__profile">{performanceProfile.label}</span>
          <div className="pbp-perf-tally__stats">
            <span className="pbp-perf-tally__stat">
              <WeightBadge weight="light" size="xs" /> {weightTally.light}
            </span>
            <span className="pbp-perf-tally__stat">
              <WeightBadge weight="medium" size="xs" /> {weightTally.medium}
              <span className="pbp-perf-tally__cap">/ {performanceProfile.mediumMax}</span>
            </span>
            <span className="pbp-perf-tally__stat">
              <WeightBadge weight="heavy" size="xs" /> {weightTally.heavy}
              <span className="pbp-perf-tally__cap">/ {performanceProfile.heavyMax}</span>
            </span>
          </div>
          {overBudget && (
            <span className="pbp-perf-tally__warn" title={violations.join(' ')}>
              Over budget — advisory
            </span>
          )}
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {popover && displayStyle && (
            <motion.div
              key="popover-overlay"
              className="pbp-assembly-popover-overlay"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onMouseDown={e => {
                e.preventDefault();
                setPopover(null);
              }}
            />
          )}
          {popover && displayStyle && (
            <motion.div
              key="popover-panel"
              className="pbp-assembly-popover"
              role="dialog"
              aria-label={displayMeta?.popoverTitle ?? ''}
              style={{ top: displayStyle.top, left: displayStyle.left, width: displayStyle.width }}
              onMouseDown={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              <div className="pbp-assembly-popover-head">
                <span className="pbp-assembly-popover-title">{displayMeta?.popoverTitle}</span>
                <button type="button" className="pbp-assembly-popover-close" onClick={() => setPopover(null)} aria-label="Close">
                  ×
                </button>
              </div>
              <ul className="pbp-assembly-popover-list">
                {displayItems.length === 0 ? (
                  <li className="pbp-assembly-popover-empty">None in this category.</li>
                ) : (
                  displayItems.map((c, idx) => (
                    <motion.li
                      key={c.id}
                      className="pbp-assembly-popover-item"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 28, delay: idx * 0.04 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                    >
                      <span>{c.name}</span>
                      <WeightBadge weight={getWeight(c.name)} size="xs" />
                    </motion.li>
                  ))
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

const MotionDiv = motion.div;

/** Same stroke play icon as ComponentInspector `BuildIcon` (generate demo). */
function AssemblyGenerateBuildIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

/* ── PREMIUM UNDERLINE BUTTON ──────────────────────────────────────── */

function PremiumUnderlineButton({
  children,
  onClick,
  disabled,
  active,
  primary,
  small,
  danger,
  fullWidth
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
  small?: boolean;
  danger?: boolean;
  fullWidth?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        padding: small ? '5px 4px' : '6px 4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
        fontSize: small ? '0.7rem' : '0.78rem',
        fontWeight: small ? 700 : 600,
        color: disabled
          ? 'rgba(255,255,255,0.15)'
          : (isHovered || active) ? '#f1f5f9' : 'rgba(241,245,249,0.35)',
        position: 'relative',
        transition: 'color 0.25s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: fullWidth ? 'center' : 'flex-start',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        gap: 8
      }}
    >
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {children}
        <motion.div
          initial={false}
          animate={{
            scaleX: active ? 1 : (isHovered && !disabled ? 0.65 : 0),
            opacity: active ? (disabled ? 0.2 : 1) : (isHovered && !disabled ? 0.5 : 0),
            background: danger ? '#ef4444' : (primary ? '#6366f1' : 'rgba(255,255,255,0.8)')
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            position: 'absolute',
            bottom: -4,
            left: 0,
            right: 0,
            height: 2,
            borderRadius: 2,
            transformOrigin: 'left',
          }}
        />
      </span>
    </button>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AnimatedSelect({
  value,
  options,
  onChange,
  className = '',
  variant = 'default',
  placeholder = 'Select...',
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  className?: string;
  variant?: 'default' | 'role';
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top?: number; bottom?: number; left: number; width: number }>({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Close on scroll to prevent floating away
    const handleScroll = (e: Event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const toggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const width = variant === 'role' ? Math.max(130, rect.width) : rect.width;
      let left = rect.left;

      if (variant === 'role') {
        left = rect.right - width;
      }

      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < 220 && spaceAbove > spaceBelow) {
        // Open upwards
        setDropdownStyle({
          bottom: windowHeight - rect.top + 6,
          left,
          width
        });
      } else {
        // Open downwards
        setDropdownStyle({
          top: rect.bottom + 6,
          left,
          width
        });
      }
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(o => o.value === value);

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          className="pbp-animated-select-dropdown"
          style={{ position: 'fixed', zIndex: 999999, ...dropdownStyle }}
          initial={{ opacity: 0, scale: 0.98, y: dropdownStyle.bottom !== undefined ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: dropdownStyle.bottom !== undefined ? 4 : -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="pbp-animated-select-scroll">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`pbp-animated-select-option ${value === opt.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                {value === opt.value && (
                  <svg className="pbp-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`pbp-animated-select-root pbp-animated-select-root--${variant} ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`pbp-animated-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={toggle}
      >
        <span className="pbp-animated-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`pbp-animated-select-icon ${isOpen ? 'open' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={variant === 'role' ? { position: 'absolute', right: '0.2rem' } : {}}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {createPortal(dropdownContent, document.body)}
    </div>
  );
}

// ── Font & Color preset data ───────────────────────────────────────────────────

const FONT_PAIRINGS: { id: string; name: string; desc: string; fonts: FontEntry[] }[] = [
  { id: 'editorial',  name: 'Editorial',  desc: 'Luxury print feel',    fonts: [{ value: 'Playfair Display',   role: 'heading' }, { value: 'Inter',         role: 'body'   }, { value: 'DM Mono',         role: 'accent' }] },
  { id: 'modern',     name: 'Modern',     desc: 'SaaS & tech product',  fonts: [{ value: 'Plus Jakarta Sans',  role: 'heading' }, { value: 'Inter',         role: 'body'   }, { value: 'Fira Code',       role: 'accent' }] },
  { id: 'geometric',  name: 'Geometric',  desc: 'Bold & structured',    fonts: [{ value: 'Space Grotesk',     role: 'heading' }, { value: 'DM Sans',       role: 'body'   }, { value: 'DM Mono',         role: 'accent' }] },
  { id: 'brutalist',  name: 'Brutalist',  desc: 'Raw & expressive',     fonts: [{ value: 'Archivo Black',     role: 'heading' }, { value: 'IBM Plex Mono', role: 'body'   }, { value: 'Space Mono',      role: 'accent' }] },
  { id: 'luxury',     name: 'Luxury',     desc: 'Refined & elegant',    fonts: [{ value: 'Cormorant Garamond',role: 'heading' }, { value: 'Jost',          role: 'body'   }, { value: 'EB Garamond',     role: 'accent' }] },
  { id: 'technical',  name: 'Technical',  desc: 'Dev tools & systems',  fonts: [{ value: 'JetBrains Mono',   role: 'heading' }, { value: 'Inter',         role: 'body'   }, { value: 'Roboto Mono',     role: 'accent' }] },
  { id: 'minimalist', name: 'Minimalist', desc: 'Clean & invisible',    fonts: [{ value: 'Inter',             role: 'heading' }, { value: 'Inter',         role: 'body'   }, { value: 'Fira Code',       role: 'accent' }] },
  { id: 'elegant',    name: 'Elegant',    desc: 'Soft & classical',     fonts: [{ value: 'Lora',              role: 'heading' }, { value: 'Nunito',        role: 'body'   }, { value: 'Space Mono',      role: 'accent' }] },
  { id: 'quaint',     name: 'Quaint',     desc: 'Friendly & warm',      fonts: [{ value: 'Merriweather',      role: 'heading' }, { value: 'Lato',          role: 'body'   }, { value: 'Roboto Mono',     role: 'accent' }] },
  { id: 'pop',        name: 'Pop',        desc: 'Vibrant & loud',       fonts: [{ value: 'Clash Display',     role: 'heading' }, { value: 'DM Sans',       role: 'body'   }, { value: 'JetBrains Mono',  role: 'accent' }] },
  { id: 'neon',       name: 'Neon',       desc: 'High energy',          fonts: [{ value: 'Bebas Neue',        role: 'heading' }, { value: 'Outfit',        role: 'body'   }, { value: 'Fira Code',       role: 'accent' }] },
  { id: 'writer',     name: 'Writer',     desc: 'Typewriter feel',      fonts: [{ value: 'EB Garamond',       role: 'heading' }, { value: 'IBM Plex Mono', role: 'body'   }, { value: 'JetBrains Mono',  role: 'accent' }] },
  { id: 'impact',     name: 'Impact',     desc: 'Heavy & striking',     fonts: [{ value: 'Anton',             role: 'heading' }, { value: 'Inter',         role: 'body'   }, { value: 'JetBrains Mono',  role: 'accent' }] },
  { id: 'classic',    name: 'Classic',    desc: 'Traditional beauty',   fonts: [{ value: 'Playfair Display',  role: 'heading' }, { value: 'Lora',          role: 'body'   }, { value: 'EB Garamond',     role: 'accent' }] },
  { id: 'industrial', name: 'Industrial', desc: 'Engineered structure', fonts: [{ value: 'Big Shoulders Display',role:'heading'}, { value: 'DM Sans',       role: 'body'   }, { value: 'Fira Code',       role: 'accent' }] },
  { id: 'clean',      name: 'Clean Air',  desc: 'Airy & open',          fonts: [{ value: 'Raleway',           role: 'heading' }, { value: 'Lato',          role: 'body'   }, { value: 'Roboto Mono',     role: 'accent' }] },
  { id: 'editorial2', name: 'Magazine',   desc: 'Editorial modern',     fonts: [{ value: 'DM Serif Display',  role: 'heading' }, { value: 'Figtree',       role: 'body'   }, { value: 'Space Mono',      role: 'accent' }] },
  { id: 'startup',    name: 'Startup',    desc: 'Bold & fast',          fonts: [{ value: 'Bebas Neue',        role: 'heading' }, { value: 'Outfit',        role: 'body'   }, { value: 'DM Mono',         role: 'accent' }] },
  { id: 'developer',  name: 'Developer',  desc: 'Code aesthetic',       fonts: [{ value: 'Space Grotesk',     role: 'heading' }, { value: 'Plus Jakarta Sans',role:'body' }, { value: 'JetBrains Mono',  role: 'accent' }] },
  { id: 'headline',   name: 'Headline',   desc: 'Chunky text',          fonts: [{ value: 'Archivo Black',     role: 'heading' }, { value: 'Inter',         role: 'body'   }, { value: 'IBM Plex Mono',   role: 'accent' }] },
  { id: 'academic',   name: 'Academic',   desc: 'Scholarly papers',     fonts: [{ value: 'Cormorant Garamond',role: 'heading' }, { value: 'Merriweather',  role: 'body'   }, { value: 'EB Garamond',     role: 'accent' }] },
  { id: 'edgy',       name: 'Edgy',       desc: 'Sharp & modern',       fonts: [{ value: 'Clash Display',     role: 'heading' }, { value: 'Figtree',       role: 'body'   }, { value: 'Roboto Mono',     role: 'accent' }] },
  { id: 'friendly',   name: 'Friendly',   desc: 'Playful interface',    fonts: [{ value: 'Plus Jakarta Sans', role: 'heading' }, { value: 'Nunito',        role: 'body'   }, { value: 'Fira Code',       role: 'accent' }] },
  { id: 'scandi',     name: 'Scandi',     desc: 'Nordic minimal',       fonts: [{ value: 'Jost',              role: 'heading' }, { value: 'Lato',          role: 'body'   }, { value: 'DM Mono',         role: 'accent' }] },
];

const FONT_BROWSE_CATEGORIES: { name: string; role: FontRole; fonts: string[] }[] = [
  { name: 'Display',  role: 'heading', fonts: ['Clash Display', 'Archivo Black', 'Bebas Neue', 'Big Shoulders Display', 'Anton', 'Raleway'] },
  { name: 'Serif',    role: 'heading', fonts: ['Playfair Display', 'Cormorant Garamond', 'Lora', 'Merriweather', 'EB Garamond', 'DM Serif Display'] },
  { name: 'Sans',     role: 'body',    fonts: ['Inter', 'DM Sans', 'Space Grotesk', 'Plus Jakarta Sans', 'Nunito', 'Lato', 'Jost', 'Outfit', 'Figtree'] },
  { name: 'Mono',     role: 'accent',  fonts: ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'DM Mono', 'Space Mono', 'Roboto Mono'] },
];

const COLOR_PALETTES: { id: string; name: string; desc: string; colors: ColorEntry[] }[] = [
  { id: 'midnight',  name: 'Midnight',   desc: 'Dark + indigo',  colors: [{ value: '#0a0a12', role: 'background' }, { value: '#f1f5f9', role: 'text' }, { value: '#6366f1', role: 'accent' }] },
  { id: 'obsidian',  name: 'Obsidian',   desc: 'Dark + amber',   colors: [{ value: '#0a0a0a', role: 'background' }, { value: '#f5f0e8', role: 'text' }, { value: '#f59e0b', role: 'accent' }] },
  { id: 'ocean',     name: 'Ocean',      desc: 'Dark + cyan',    colors: [{ value: '#061220', role: 'background' }, { value: '#e0f2fe', role: 'text' }, { value: '#0ea5e9', role: 'accent' }] },
  { id: 'forest',    name: 'Forest',     desc: 'Dark + emerald', colors: [{ value: '#071a0f', role: 'background' }, { value: '#f0fdf4', role: 'text' }, { value: '#10b981', role: 'accent' }] },
  { id: 'rose',      name: 'Rose',       desc: 'Dark + rose',    colors: [{ value: '#0d0508', role: 'background' }, { value: '#fff1f2', role: 'text' }, { value: '#f43f5e', role: 'accent' }] },
  { id: 'cream',     name: 'Cream Gold', desc: 'Luxury warmth',  colors: [{ value: '#080604', role: 'background' }, { value: '#f5f0e8', role: 'text' }, { value: '#d4af37', role: 'accent' }] },
  { id: 'ivory',     name: 'Ivory',      desc: 'Light & minimal', colors: [{ value: '#fafaf9', role: 'background' }, { value: '#0f172a', role: 'text' }, { value: '#6366f1', role: 'accent' }] },
  { id: 'contrast',  name: 'B&W Pop',    desc: 'High contrast',  colors: [{ value: '#000000', role: 'background' }, { value: '#ffffff', role: 'text' }, { value: '#ff3b00', role: 'accent' }] },
  { id: 'cyberpunk', name: 'Cyberpunk',  desc: 'Neon grid',      colors: [{ value: '#0f0f1b', role: 'background' }, { value: '#ff007f', role: 'text' }, { value: '#00f0ff', role: 'accent' }] },
  { id: 'sunset',    name: 'Sunset',     desc: 'Warm evenings',  colors: [{ value: '#2a0a18', role: 'background' }, { value: '#ff8c42', role: 'text' }, { value: '#ffdd4a', role: 'accent' }] },
  { id: 'matcha',    name: 'Matcha',     desc: 'Earthy green',   colors: [{ value: '#f4fadd', role: 'background' }, { value: '#2d3a1f', role: 'text' }, { value: '#8b9a46', role: 'accent' }] },
  { id: 'lavender',  name: 'Lavender',   desc: 'Soft dream',     colors: [{ value: '#f3e8fa', role: 'background' }, { value: '#4a2574', role: 'text' }, { value: '#8a4fff', role: 'accent' }] },
  { id: 'crimson',   name: 'Crimson',    desc: 'Deep power',     colors: [{ value: '#1a1a1a', role: 'background' }, { value: '#f0f0f0', role: 'text' }, { value: '#dc143c', role: 'accent' }] },
  { id: 'aqua',      name: 'Aqua',       desc: 'Cool water',     colors: [{ value: '#0a192f', role: 'background' }, { value: '#8892b0', role: 'text' }, { value: '#64ffda', role: 'accent' }] },
  { id: 'mono',      name: 'Monochrome', desc: 'Wireframe',      colors: [{ value: '#ffffff', role: 'background' }, { value: '#000000', role: 'text' }, { value: '#666666', role: 'accent' }] },
  { id: 'synth',     name: 'Synthwave',  desc: '80s retro',      colors: [{ value: '#120b29', role: 'background' }, { value: '#f773ff', role: 'text' }, { value: '#00ebff', role: 'accent' }] },
  { id: 'autumn',    name: 'Autumn',     desc: 'Fallen leaves',  colors: [{ value: '#2d1810', role: 'background' }, { value: '#f4d3c4', role: 'text' }, { value: '#e06d06', role: 'accent' }] },
  { id: 'glacier',   name: 'Glacier',    desc: 'Ice & frost',    colors: [{ value: '#e2f1f8', role: 'background' }, { value: '#0f172a', role: 'text' }, { value: '#0284c7', role: 'accent' }] },
  { id: 'mint',      name: 'Neon Mint',  desc: 'Glowing green',  colors: [{ value: '#0d1a15', role: 'background' }, { value: '#eafff5', role: 'text' }, { value: '#2dd4bf', role: 'accent' }] },
  { id: 'velvet',    name: 'Velvet',     desc: 'Rich purple',    colors: [{ value: '#1e0a29', role: 'background' }, { value: '#f1e6f9', role: 'text' }, { value: '#a855f7', role: 'accent' }] },
  { id: 'retrotech', name: 'Retro Tech', desc: 'Old hardware',   colors: [{ value: '#252525', role: 'background' }, { value: '#e8e8e8', role: 'text' }, { value: '#ff7f50', role: 'accent' }] },
  { id: 'deepsea',   name: 'Deep Sea',   desc: 'Ocean trench',   colors: [{ value: '#08121f', role: 'background' }, { value: '#cddcf5', role: 'text' }, { value: '#3b82f6', role: 'accent' }] },
  { id: 'terracotta',name: 'Terracotta', desc: 'Clay & earth',   colors: [{ value: '#fffbf7', role: 'background' }, { value: '#2c1a14', role: 'text' }, { value: '#c2410c', role: 'accent' }] },
  { id: 'hacker',    name: 'Terminal',   desc: 'Command line',   colors: [{ value: '#000000', role: 'background' }, { value: '#00ff00', role: 'text' }, { value: '#39ff14', role: 'accent' }] },
];

// ── Tab components ─────────────────────────────────────────────────────────────

const MAX_FONTS = 5;
const MAX_COLORS = 6;

function FontsTab({ rules, onChange }: { rules: DesignRules; onChange: (r: DesignRules) => void }) {
  const [browseCategory, setBrowseCategory] = useState(0);
  const [page, setPage] = useState(0);
  const maxPage = Math.ceil(FONT_PAIRINGS.length / 6) - 1;

  useEffect(() => {
    const GOOGLE_FONTS = [
      'Playfair+Display:wght@400;700', 'Inter:wght@400;700', 'Plus+Jakarta+Sans:wght@400;700',
      'Space+Grotesk:wght@400;700', 'DM+Sans:wght@400;700', 'Archivo+Black',
      'IBM+Plex+Mono:wght@400;700', 'Cormorant+Garamond:wght@400;700', 'Jost:wght@400;700',
      'JetBrains+Mono:wght@400;700', 'Bebas+Neue', 'Big+Shoulders+Display:wght@400;700',
      'Anton', 'Raleway:wght@400;700', 'Lora:wght@400;700', 'Merriweather:wght@400;700',
      'EB+Garamond:wght@400;700', 'DM+Serif+Display', 'Nunito:wght@400;700', 'Lato:wght@400;700',
      'Outfit:wght@400;700', 'Figtree:wght@400;700', 'Fira+Code:wght@400;700',
      'DM+Mono:wght@400;700', 'Space+Mono:wght@400;700', 'Roboto+Mono:wght@400;700',
      'Clash+Display:wght@400;700'
    ];
    const linkId = 'pbp-google-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(f => `family=${f}`).join('&')}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  const togglePairing = (p: typeof FONT_PAIRINGS[0]) => {
    if (activePairingId === p.id) {
      onChange({ ...rules, fonts: [] });
    } else {
      onChange({ ...rules, fonts: p.fonts.map(f => ({ ...f })) });
    }
  };

  const activePairingId = FONT_PAIRINGS.find(p =>
    p.fonts.length === rules.fonts.length &&
    p.fonts.every((pf, i) => rules.fonts[i]?.value === pf.value && rules.fonts[i]?.role === pf.role)
  )?.id ?? null;

  const addBrowseFont = (fontName: string, role: FontRole) => {
    if (rules.fonts.length >= MAX_FONTS) return;
    if (rules.fonts.some(f => f.value === fontName)) return;
    onChange({ ...rules, fonts: [...rules.fonts, { value: fontName, role }] });
  };

  const removeFont = (i: number) => onChange({ ...rules, fonts: rules.fonts.filter((_, idx) => idx !== i) });

  const updateFont = (i: number, patch: Partial<FontEntry>) =>
    onChange({ ...rules, fonts: rules.fonts.map((f, idx) => idx === i ? { ...f, ...patch } : f) });

  const cat = FONT_BROWSE_CATEGORIES[browseCategory];

  const ROLE_OPTS = [
    { label: 'Auto', value: '' },
    { label: 'Heading', value: 'heading' },
    { label: 'Body', value: 'body' },
    { label: 'Accent', value: 'accent' },
  ];

  return (
    <>
      <div className="pbp-rule-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pbp-rule-label">Pairings</span>
          <button className="pbp-refresh-btn" onClick={() => setPage(p => p >= maxPage ? 0 : p + 1)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
        <span className="pbp-rule-hint">click to apply</span>
      </div>
      <div className="pbp-font-pairings-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {FONT_PAIRINGS.slice(page * 6, (page + 1) * 6).map(p => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pbp-font-pairing-card${activePairingId === p.id ? ' pbp-font-pairing-card--active' : ''}`}
              onClick={() => togglePairing(p)}
            >
            <span className="pbp-fpc-name">{p.name}</span>
            <span className="pbp-fpc-desc">{p.desc}</span>
            <div className="pbp-fpc-fonts">
              {p.fonts.map((f, i) => (
                <span key={i} className="pbp-fpc-font-pill">
                  <span className="pbp-fpc-role">{(f.role || 'A')[0].toUpperCase()}</span>
                  <span className="pbp-fpc-fontname" style={{ fontFamily: `'${f.value}', serif` }}>{f.value}</span>
                </span>
              ))}
            </div>
          </motion.button>
        ))}
        </AnimatePresence>
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Browse</span>
        <div className="pbp-font-cat-tabs">
          {FONT_BROWSE_CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              className={`pbp-font-cat-tab${browseCategory === i ? ' pbp-font-cat-tab--active' : ''}`}
              onClick={() => setBrowseCategory(i)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="pbp-font-browse-grid">
        {cat.fonts.map(fontName => {
          const already = rules.fonts.some(f => f.value === fontName);
          const full = rules.fonts.length >= MAX_FONTS;
          return (
            <button
              key={fontName}
              className={`pbp-font-browse-chip${already ? ' pbp-font-browse-chip--added' : ''}${full && !already ? ' pbp-font-browse-chip--disabled' : ''}`}
              onClick={() => addBrowseFont(fontName, cat.role)}
              disabled={full && !already}
              style={{ fontFamily: `'${fontName}', sans-serif` }}
            >
              {already && <span className="pbp-fbc-check" style={{ fontFamily: 'var(--font-body, Satoshi, sans-serif)' }}>✓</span>}
              {fontName}
            </button>
          );
        })}
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Your Selection</span>
        {rules.fonts.length < MAX_FONTS && (
          <button className="pbp-add-btn" onClick={() => onChange({ ...rules, fonts: [...rules.fonts, { value: '', role: '' }] })}>+ Custom</button>
        )}
      </div>
      {rules.fonts.length === 0 && <p className="pbp-empty-hint">No fonts set — AI will choose. Use pairings or browse above.</p>}
      <AnimatePresence initial={false}>
        {rules.fonts.map((font, i) => (
          <motion.div
            key={`${i}-${font.value}`}
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: -10, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pbp-font-entry"
            >
              <div className="pbp-font-entry-role">
                <AnimatedSelect variant="role" value={font.role} onChange={v => updateFont(i, { role: v as FontRole })} options={ROLE_OPTS} />
              </div>
              <input
                className="pbp-text-input"
                placeholder="Font name…"
                value={font.value}
                onChange={e => updateFont(i, { value: e.target.value })}
              />
              <button className="pbp-remove-btn" onClick={() => removeFont(i)}>×</button>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}

function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastColor(hex: string): string {
  return hexLuminance(hex) > 0.22 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
}

function ColorsTab({ rules, onChange }: { rules: DesignRules; onChange: (r: DesignRules) => void }) {
  const [page, setPage] = useState(0);
  const maxPage = Math.ceil(COLOR_PALETTES.length / 8) - 1;

  const applyPalette = (p: typeof COLOR_PALETTES[0]) =>
    onChange({ ...rules, colors: p.colors.map(c => ({ ...c })) });

  const activePaletteId = COLOR_PALETTES.find(p =>
    p.colors.length === rules.colors.length &&
    p.colors.every((pc, i) => rules.colors[i]?.value === pc.value && rules.colors[i]?.role === pc.role)
  )?.id ?? null;

  const addColor = () => {
    if (rules.colors.length >= MAX_COLORS) return;
    onChange({ ...rules, colors: [...rules.colors, { value: '#6366f1', role: '' }] });
  };

  const removeColor = (i: number) => onChange({ ...rules, colors: rules.colors.filter((_, idx) => idx !== i) });

  const updateColor = (i: number, patch: Partial<ColorEntry>) =>
    onChange({ ...rules, colors: rules.colors.map((c, idx) => idx === i ? { ...c, ...patch } : c) });

  const ROLE_OPTS = [
    { label: 'Auto', value: '' },
    { label: 'Background', value: 'background' },
    { label: 'Text', value: 'text' },
    { label: 'Components', value: 'components' },
    { label: 'Accent', value: 'accent' },
  ];

  return (
    <>
      <div className="pbp-rule-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pbp-rule-label">Palettes</span>
          <button className="pbp-refresh-btn" onClick={() => setPage(p => p >= maxPage ? 0 : p + 1)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
        <span className="pbp-rule-hint">click to apply</span>
      </div>
      <div className="pbp-palette-grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {COLOR_PALETTES.slice(page * 8, (page + 1) * 8).map(p => {
            const [bg, secondary, accent] = p.colors;
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pbp-palette-card${activePaletteId === p.id ? ' pbp-palette-card--active' : ''}`}
              onClick={() => applyPalette(p)}
            >
              <div 
                className="pbp-palette-preview"
                style={{ background: `linear-gradient(135deg, ${bg?.value} 0%, ${bg?.value} 55%, ${secondary?.value} 55%, ${secondary?.value} 85%, ${accent?.value} 85%, ${accent?.value} 100%)` }}
              >
                <div className="pbp-palette-label-overlay">
                  <span className="pbp-palette-label-name">{p.name}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
        </AnimatePresence>
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Your Colors</span>
        {rules.colors.length < MAX_COLORS && <button className="pbp-add-btn" onClick={addColor}>+ Add</button>}
      </div>
      {rules.colors.length === 0 && <p className="pbp-empty-hint">No colors set — AI will choose. Select a palette above.</p>}
      <AnimatePresence initial={false}>
        {rules.colors.map((color, i) => (
          <motion.div
            key={`${i}-${color.value}`}
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: -10, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pbp-color-entry"
            >
              <div className="pbp-color-swatch-btn" style={{ background: color.value }}>
                <input
                  type="color"
                  className="pbp-color-picker-hidden"
                  value={color.value}
                  onChange={e => updateColor(i, { value: e.target.value })}
                />
              </div>
              <input
                type="text"
                className="pbp-text-input pbp-hex-input"
                value={color.value}
                onChange={e => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateColor(i, { value: v });
                }}
                maxLength={7}
                spellCheck={false}
              />
              <AnimatedSelect variant="role" value={color.role} onChange={v => updateColor(i, { role: v as ColorRole })} options={ROLE_OPTS} />
              <button className="pbp-remove-btn" onClick={() => removeColor(i)}>×</button>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}



function SizesTab({
  rules,
  onChange,
  style,
  onStyleChange,
}: {
  rules: DesignRules;
  onChange: (r: DesignRules) => void;
  style: StyleDirection;
  onStyleChange: (s: StyleDirection) => void;
}) {
  const set = (key: keyof DesignRules['sizes'], val: string) =>
    onChange({ ...rules, sizes: { ...rules.sizes, [key]: val } });

  const activeProfileId = style.performanceProfileId || DEFAULT_PERFORMANCE_PROFILE_ID;
  const profileOrder: PerformanceProfile['id'][] = ['low-end', 'balanced', 'showcase'];

  return (
    <div className="pbp-sizes-tab">

      {/* Performance Profile */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Performance Profile</span>
      </div>
      <p className="pbp-empty-hint" style={{ marginTop: 0, marginBottom: '12px' }}>
        Advisory budget for component selection. Heavier presets use full-screen WebGL effects; lighter ones avoid GPU pressure.
      </p>
      <div className="pbp-sizes-chip-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', display: 'grid', gap: '8px' }}>
        {profileOrder.map(id => {
          const profile = WEIGHT_BUDGETS[id];
          const active = activeProfileId === id;
          return (
            <button
              key={id}
              className={`pbp-sizes-chip ${active ? 'pbp-sizes-chip--active' : ''}`}
              onClick={() => onStyleChange({ ...style, performanceProfileId: id })}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 4, padding: '10px 12px', minHeight: 64, textAlign: 'left',
              }}
              title={profile.description}
            >
              <span style={{ fontWeight: 700, opacity: active ? 1 : 0.78 }}>
                {profile.label}
              </span>
              <span style={{
                fontSize: '0.6rem', opacity: 0.55,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                letterSpacing: '0.04em',
              }}>
                heavy ≤ {profile.heavyMax} · medium ≤ {profile.mediumMax}
              </span>
            </button>
          );
        })}
      </div>

      {/* Target Optimization */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Target Optimization</span>
      </div>
      <p className="pbp-empty-hint" style={{ marginTop: 0, marginBottom: '12px' }}>
        Focus the AI on a specific device tier for better precision, or choose Adaptive for a fully responsive build.
      </p>
      <div className="pbp-sizes-chip-grid" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '8px' }}>
        {(['mobile', 'tablet', 'desktop', 'adaptive'] as const).map(target => {
          const labels = {
            mobile: 'Mobile (0-480px)',
            tablet: 'Tablet (768px-1024px)',
            desktop: 'Desktop (1024px+)',
            adaptive: 'Adaptive (All Devices)'
          };
          const icons = {
            mobile: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
            tablet: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
            desktop: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>,
            adaptive: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
          };
          return (
            <button
              key={target}
              className={`pbp-sizes-chip ${rules.sizes.optimizationTarget === target ? 'pbp-sizes-chip--active' : ''}`}
              onClick={() => set('optimizationTarget', target)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', padding: '10px' }}
            >
              <span style={{ opacity: rules.sizes.optimizationTarget === target ? 1 : 0.6 }}>{icons[target]}</span>
              <span>{labels[target]}</span>
            </button>
          );
        })}
      </div>

      {/* Spacing Scale */}
      <div className="pbp-rule-header" style={{ marginTop: '16px' }}>
        <span className="pbp-rule-label">Spacing Scale</span>
      </div>
      <div className="pbp-sizes-chip-grid">
        {(['compact', 'comfortable', 'spacious'] as const).map(s => (
          <button
            key={s}
            className={`pbp-sizes-chip ${rules.sizes.spacingScale === s ? 'pbp-sizes-chip--active' : ''}`}
            onClick={() => set('spacingScale', rules.sizes.spacingScale === s ? '' : s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Border Radius */}
      <div className="pbp-rule-header" style={{ marginTop: '16px' }}>
        <span className="pbp-rule-label">Corner Radius</span>
      </div>
      <div className="pbp-radius-grid">
        {(['none', 'small', 'medium', 'large', 'pill'] as const).map(s => (
          <button
            key={s}
            className={`pbp-radius-btn ${rules.sizes.borderRadius === s ? 'pbp-radius-btn--active' : ''}`}
            onClick={() => set('borderRadius', rules.sizes.borderRadius === s ? '' : s)}
          >
            <div className="pbp-radius-preview" data-radius={s} />
            <span className="pbp-radius-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
          </button>
        ))}
      </div>

    </div>
  );
}

function ImgGrid({
  items,
  limit,
  onPick,
  onRemove,
  addLabel = 'Upload',
  wide = false,
}: {
  items: ImageEntry[];
  limit: number;
  onPick: () => void;
  onRemove: (img: ImageEntry) => void;
  addLabel?: string;
  wide?: boolean;
}) {
  return (
    <div className={`pbp-img-grid${wide ? ' pbp-img-grid--wide' : ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((img, i) => (
          <motion.div
            layout
            key={`${img.name}-${i}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className={`pbp-img-card${wide ? ' pbp-img-card--wide' : ''}`}
          >
            <img src={img.base64} alt={img.name} className="pbp-img-element" />
            <div className="pbp-img-overlay">
              <button className="pbp-img-delete" onClick={() => onRemove(img)} title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </motion.div>
        ))}
        {items.length < limit && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className={`pbp-img-add-card${wide ? ' pbp-img-card--wide' : ''}`}
            onClick={onPick}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span className="pbp-img-add-text">{addLabel}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImagesTab({
  images,
  onPick,
  onRemove,
  limits,
}: {
  images: ImageEntry[];
  onPick: (category: ImageCategory) => void;
  onRemove: (img: ImageEntry) => void;
  limits: Record<ImageCategory, number>;
}) {
  const logoImages = images.filter(img => img.category === 'logo');
  const productImages = images.filter(img => img.category === 'product');
  const inspirationImages = images.filter(img => !img.category || img.category === 'inspiration');

  return (
    <div className="pbp-images-tab">
      {/* Logo */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Brand Logo</span>
        <span className="pbp-rule-hint">{logoImages.length}/{limits.logo}</span>
      </div>
      <p className="pbp-empty-hint" style={{ marginTop: 0, marginBottom: '8px' }}>Used as the site logo — SVG or PNG preferred.</p>
      <ImgGrid items={logoImages} limit={limits.logo} onPick={() => onPick('logo')} onRemove={onRemove} addLabel="Upload Logo" />

      {/* Products */}
      <div className="pbp-rule-header" style={{ marginTop: '16px' }}>
        <span className="pbp-rule-label">Product / Hero Images</span>
        <span className="pbp-rule-hint">{productImages.length}/{limits.product}</span>
      </div>
      <p className="pbp-empty-hint" style={{ marginTop: 0, marginBottom: '8px' }}>Actual product shots, team photos, or hero visuals.</p>
      <ImgGrid items={productImages} limit={limits.product} onPick={() => onPick('product')} onRemove={onRemove} addLabel="Add Image" />

      {/* Inspiration */}
      <div className="pbp-rule-header" style={{ marginTop: '16px' }}>
        <span className="pbp-rule-label">Style References</span>
        <span className="pbp-rule-hint">{inspirationImages.length}/{limits.inspiration}</span>
      </div>
      <p className="pbp-empty-hint" style={{ marginTop: 0, marginBottom: '8px' }}>Mood board, competitor sites, or design references.</p>
      <ImgGrid items={inspirationImages} limit={limits.inspiration} onPick={() => onPick('inspiration')} onRemove={onRemove} addLabel="Add Reference" />
    </div>
  );
}

function BriefTab({ brief, onChange }: { brief: ClientBrief; onChange: (b: ClientBrief) => void }) {
  const INDUSTRIES = [
    'Tech / Software', 'Agency / Creative', 'E-commerce', 'Healthcare', 'Finance',
    'Education', 'Real Estate', 'Food & Beverage', 'Fashion', 'Fitness / Wellness',
    'Entertainment', 'Consulting', 'Non-profit', 'Architecture / Design', 'Photography', 'Other',
  ];
  const TONES = ['Formal', 'Casual', 'Technical', 'Friendly', 'Bold', 'Playful'];
  const set = (key: keyof ClientBrief, val: string) => onChange({ ...brief, [key]: val });

  return (
    <>
      {/* Identity */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Identity</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Brand / Project Name</span>
          <input className="pbp-brief-input" placeholder="Acme Corp" value={brief.brandName} onChange={e => set('brandName', e.target.value)} />
        </div>
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Industry</span>
          <AnimatedSelect
            value={brief.industry}
            onChange={v => set('industry', v)}
            options={[
              { label: '— select —', value: '' },
              ...INDUSTRIES.map(ind => ({ label: ind, value: ind }))
            ]}
          />
        </div>
        <div className="pbp-brief-field pbp-brief-field--full">
          <span className="pbp-brief-label">Tagline / Slogan</span>
          <input className="pbp-brief-input" placeholder="Build fast, ship now." value={brief.tagline} onChange={e => set('tagline', e.target.value)} />
        </div>
      </div>

      {/* About */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">About</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field pbp-brief-field--full">
          <span className="pbp-brief-label">Description — what it does, what the goal is</span>
          <textarea className="pbp-brief-textarea" rows={3} placeholder="A SaaS platform that helps teams ship code 3× faster by automating code reviews and CI/CD…" value={brief.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="pbp-brief-field pbp-brief-field--full">
          <span className="pbp-brief-label">USP — what makes you different from competitors</span>
          <input className="pbp-brief-input" placeholder="The only tool with AI-powered review + one-click deploy" value={brief.usp} onChange={e => set('usp', e.target.value)} />
        </div>
        <div className="pbp-brief-field pbp-brief-field--full">
          <span className="pbp-brief-label">Services / Products — one per line</span>
          <textarea className="pbp-brief-textarea" rows={2} placeholder={"Code review\nCI/CD pipelines\nTeam analytics"} value={brief.services} onChange={e => set('services', e.target.value)} />
        </div>
      </div>

      {/* Audience & Goals */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Audience & Goals</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Target Audience</span>
          <input className="pbp-brief-input" placeholder="Startup CTOs, dev teams" value={brief.targetAudience} onChange={e => set('targetAudience', e.target.value)} />
        </div>
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Primary CTA</span>
          <input className="pbp-brief-input" placeholder="Start Free Trial" value={brief.callToAction} onChange={e => set('callToAction', e.target.value)} />
        </div>
        <div className="pbp-brief-field pbp-brief-field--full">
          <span className="pbp-brief-label">Key Benefits — one per line</span>
          <textarea className="pbp-brief-textarea" rows={2} placeholder={"Ship 3× faster\nZero config setup\n99.9% uptime SLA"} value={brief.keyBenefits} onChange={e => set('keyBenefits', e.target.value)} />
        </div>
      </div>

      {/* Tone & Personality */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Tone & Personality</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field pbp-brief-field--full">
          <span className="pbp-brief-label">Tone of Voice</span>
          <div className="pbp-preset-grid">
            {TONES.map(t => (
              <button
                key={t}
                className={`pbp-preset-chip${brief.tone === t ? ' pbp-preset-chip--active' : ''}`}
                onClick={() => set('tone', brief.tone === t ? '' : t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="pbp-brief-field pbp-brief-field--full">
          <span className="pbp-brief-label">Brand Personality Keywords</span>
          <input className="pbp-brief-input" placeholder="Innovative, trustworthy, human, precise…" value={brief.personality} onChange={e => set('personality', e.target.value)} />
        </div>
      </div>

      {/* Contact */}
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Contact — optional</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Email</span>
          <input className="pbp-brief-input" type="email" placeholder="hello@acme.com" value={brief.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
        </div>
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Phone</span>
          <input className="pbp-brief-input" type="tel" placeholder="+1 555 000 000" value={brief.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
        </div>
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Location</span>
          <input className="pbp-brief-input" placeholder="New York, USA" value={brief.location} onChange={e => set('location', e.target.value)} />
        </div>
        <div className="pbp-brief-field">
          <span className="pbp-brief-label">Social Links</span>
          <input className="pbp-brief-input" placeholder="twitter.com/acme, linkedin.com/…" value={brief.socialLinks} onChange={e => set('socialLinks', e.target.value)} />
        </div>
      </div>
    </>
  );
}

function StyleTab({ style, onChange }: { style: StyleDirection; onChange: (s: StyleDirection) => void }) {
  const AESTHETICS: AestheticPreset[] = ['Editorial', 'Brutalist', 'Minimal', 'Futuristic'];
  const SITE_TYPES = ['Portfolio', 'Landing', 'SaaS', 'Agency'];
  const COLOR_STRATEGIES: { value: ColorStrategy; label: string }[] = [
    { value: 'dark-bold-accent', label: 'Dark + Accent' },
    { value: 'light-subtle', label: 'Light' },
    { value: 'high-contrast-bw', label: 'B&W + Pop' },
    { value: 'monochromatic', label: 'Mono' },
    { value: 'colorful', label: 'Colorful' },
  ];
  const TYPOGRAPHY_OPTS: { value: TypographyIntensity; label: string }[] = [
    { value: 'subtle', label: 'Subtle' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'experimental', label: 'Experimental' },
  ];
  const EFFECTS = ['Grain texture', 'Glow / neon', 'Mesh grid', 'Bold borders', 'Color overlays'];

  const toggleAesthetic = (a: AestheticPreset) => {
    const cur = style.aesthetics;
    if (cur.includes(a)) {
      onChange({ ...style, aesthetics: cur.filter(x => x !== a) });
    } else if (cur.length < 2) {
      onChange({ ...style, aesthetics: [...cur, a] });
    }
  };

  const toggleEffect = (e: string) => {
    const cur = style.visualEffects;
    onChange({ ...style, visualEffects: cur.includes(e) ? cur.filter(x => x !== e) : [...cur, e] });
  };

  return (
    <>
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Aesthetic (Pick up to 2)</span>
      </div>
      <div className="pbp-preset-grid">
        {AESTHETICS.map(a => {
          const active = style.aesthetics.includes(a);
          const blocked = !active && style.aesthetics.length >= 2;
          return (
            <button
              key={a}
              className={`pbp-preset-chip${active ? ' pbp-preset-chip--active' : ''}${blocked ? ' pbp-preset-chip--blocked' : ''}`}
              onClick={() => toggleAesthetic(a)}
              disabled={blocked}
            >
              {a}
            </button>
          );
        })}
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Site Type</span>
      </div>
      <AnimatedSelect
        value={style.siteType}
        onChange={v => onChange({ ...style, siteType: v })}
        options={SITE_TYPES.map(t => ({ label: t, value: t }))}
      />

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Color Strategy</span>
      </div>
      <div className="pbp-color-strategy-row">
        {COLOR_STRATEGIES.map(({ value, label }) => (
          <button
            key={value}
            className={`pbp-type-btn${style.colorStrategy === value ? ' pbp-type-btn--active' : ''}`}
            onClick={() => onChange({ ...style, colorStrategy: style.colorStrategy === value ? '' : value })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Typography Intensity</span>
      </div>
      <div className="pbp-color-strategy-row">
        {TYPOGRAPHY_OPTS.map(({ value, label }) => (
          <button
            key={value}
            className={`pbp-type-btn${style.typographyIntensity === value ? ' pbp-type-btn--active' : ''}`}
            onClick={() => onChange({ ...style, typographyIntensity: style.typographyIntensity === value ? '' : value })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Visual Effects</span>
      </div>
      <div className="pbp-preset-grid">
        {EFFECTS.map(e => (
          <button
            key={e}
            className={`pbp-preset-chip${style.visualEffects.includes(e) ? ' pbp-preset-chip--active' : ''}`}
            onClick={() => toggleEffect(e)}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Target Audience — optional</span>
      </div>
      <input
        className="pbp-brief-input"
        placeholder="e.g. Startup founders, indie designers…"
        value={style.audience}
        onChange={e => onChange({ ...style, audience: e.target.value })}
      />
    </>
  );
}

// ── Output Tab (scroll behavior + scrollbar) ──────────────────────────────────

// ── Pages Tab ─────────────────────────────────────────────────────────────────
const PAGE_TYPES: PageType[] = ['home', 'about', 'services', 'pricing', 'contact', 'custom'];
const DEFAULT_PAGE_TITLES: Record<PageType, string> = {
  home: 'Home',
  about: 'About',
  services: 'Services',
  pricing: 'Pricing',
  contact: 'Contact',
  custom: 'Page',
};

function PagesTab({
  pages, onChange, selectedComponents, allComponents = [], onToggleComponent,
}: {
  pages: PageConfig[];
  onChange: (pages: PageConfig[]) => void;
  selectedComponents: ComponentItem[];
  allComponents?: ComponentItem[];
  onToggleComponent?: (id: string) => void;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const [flashWarning, setFlashWarning] = useState(false);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  // Safety: Ensure pages is always an array
  const safePages = Array.isArray(pages) ? pages : [];

  const navbarComponent = selectedComponents.find(c => isNavigationComponentName(c?.name));
  const allSelectedNavbars = selectedComponents.filter(c => isNavigationComponentName(c?.name));
  const nonNavbarComponents = selectedComponents.filter(c => !isNavigationComponentName(c?.name));

  // Safety net — ensure there's always at least one page
  useEffect(() => {
    if (safePages.length === 0) {
      onChange([{ id: 'page-1', title: 'Home', type: 'home', componentIds: [] }]);
    }
  }, [safePages.length, onChange]);

  useEffect(() => {
    if (safePages.length === 0) {
      setActivePageId(null);
      return;
    }
    if (!activePageId || !safePages.some(p => p.id === activePageId)) {
      setActivePageId(safePages[0].id);
    }
  }, [safePages, activePageId]);

  const handleLockedClick = () => {
    if (!navbarComponent) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setFlashWarning(true);
      setTimeout(() => setFlashWarning(false), 800);
    }
  };

  const addPage = () => {
    if (safePages.length >= 4) return;
    const id = `page-${Date.now()}`;
    const type: PageType = 'custom';
    onChange([...safePages, { id, title: `Page ${safePages.length + 1}`, type, componentIds: [] }]);
  };

  const removePage = () => {
    if (safePages.length <= 1) return;
    onChange(safePages.slice(0, -1));
  };

  const updatePage = (idx: number, patch: Partial<PageConfig>) => {
    const next = safePages.map((p, i) => i === idx ? { ...p, ...patch } : p);
    onChange(next);
  };

  const updatePageById = (id: string, patch: Partial<PageConfig>) => {
    const next = safePages.map((p) => p.id === id ? { ...p, ...patch } : p);
    onChange(next);
  };

  const toggleComponentOnPage = (pageIdx: number, compId: string) => {
    const page = safePages[pageIdx];
    if (!page) return;
    const ids = page.componentIds.includes(compId)
      ? page.componentIds.filter(id => id !== compId)
      : [...page.componentIds, compId];
    updatePage(pageIdx, { componentIds: ids });
  };

  const activePage = safePages.find(p => p.id === activePageId) ?? safePages[0];
  const activePageIndex = activePage ? safePages.findIndex(p => p.id === activePage.id) : -1;
  const pageOverridesEnabled = !!activePage?.overrides?.enabled;

  const setActivePageOverride = (patch: Partial<NonNullable<PageConfig['overrides']>>) => {
    if (!activePage) return;
    updatePageById(activePage.id, {
      overrides: {
        ...(activePage.overrides ?? {}),
        ...patch,
      },
    });
  };

  const updateActivePageContent = (patch: Partial<NonNullable<NonNullable<PageConfig['overrides']>['content']>>) => {
    if (!activePage) return;
    setActivePageOverride({
      content: {
        ...(activePage.overrides?.content ?? {}),
        ...patch,
      },
    });
  };

  const resetToInherited = () => {
    if (!activePage) return;
    updatePageById(activePage.id, { overrides: undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Core Navigation</span>
      </div>
      
      {navbarComponent ? (
        <div style={{ marginBottom: 20 }}>
          <AnimatedSelect
            value={navbarComponent.id}
            onChange={(newId) => {
              if (newId === 'none') {
                allSelectedNavbars.forEach(c => onToggleComponent?.(c.id));
              } else {
                // Deselect all navbars except the new one
                allSelectedNavbars.forEach(c => {
                  if (c.id !== newId) onToggleComponent?.(c.id);
                });
                // If the new one isn't already selected, select it
                if (!allSelectedNavbars.some(c => c.id === newId)) {
                  onToggleComponent?.(newId);
                }
              }
            }}
            options={[
              { label: '— None —', value: 'none' },
              ...allComponents
                .filter(c => isNavigationComponentName(c?.name))
                .map(c => ({ label: c?.name || 'Unnamed', value: c?.id }))
            ]}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <AnimatedSelect
            value="none"
            placeholder="Select a navigation component..."
            onChange={(newId) => {
              if (newId !== 'none') {
                // In case any navbars are somehow selected but not identified as 'none'
                allSelectedNavbars.forEach(c => onToggleComponent?.(c.id));
                onToggleComponent?.(newId);
              }
            }}
            options={[
              { label: '— None —', value: 'none' },
              ...allComponents
                .filter(c => isNavigationComponentName(c?.name))
                .map(c => ({ label: c?.name || 'Unnamed', value: c?.id }))
            ]}
          />
          {!navbarComponent && flashWarning && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: '#f87171', fontSize: '0.65rem', marginTop: 6, marginLeft: 4, fontWeight: 500 }}
            >
              Please select at least one navigation component to use this feature.
            </motion.div>
          )}
        </div>
      )}

      <div className="pbp-rule-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pbp-rule-label" style={{ color: !navbarComponent && flashWarning ? '#f87171' : undefined, transition: 'color 0.3s ease' }}>Sitemap Configuration</span>
          {!navbarComponent && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={flashWarning ? "#f87171" : "rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s ease' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: navbarComponent ? 1 : 0.4 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(165,180,252,0.3)', fontFamily: 'var(--font-mono)' }}>{safePages.length} / 4</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <PremiumUnderlineButton onClick={removePage} disabled={!navbarComponent || safePages.length <= 1} small>
               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </PremiumUnderlineButton>
            <PremiumUnderlineButton onClick={addPage} disabled={!navbarComponent || safePages.length >= 4} small primary>
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </PremiumUnderlineButton>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {!navbarComponent && (
          <div 
            onClick={handleLockedClick}
            style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer' }}
          />
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity: navbarComponent ? 1 : 0.35, pointerEvents: navbarComponent ? 'auto' : 'none', filter: navbarComponent ? 'none' : 'grayscale(100%)', transition: 'all 0.3s ease' }}>
          <div className="pbp-brief-field">
            <span className="pbp-brief-label">Page Inspector</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 6px', marginTop: 4 }}>
              {safePages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                  className={`pbp-preset-chip${activePage?.id === page.id ? ' pbp-preset-chip--active' : ''}`}
                  style={{ padding: '4px 9px 5px', fontSize: '0.68rem' }}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>

          {activePage && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="pbp-brief-grid" style={{ marginBottom: 12 }}>
                  <div className="pbp-brief-field">
                    <span className="pbp-brief-label">Page Title</span>
                    <input
                      className="pbp-brief-input"
                      value={activePage.title}
                      onChange={e => updatePageById(activePage.id, { title: e.target.value })}
                      placeholder="e.g. Products"
                    />
                  </div>
                  <div className="pbp-brief-field">
                    <span className="pbp-brief-label">Route Type</span>
                    <AnimatedSelect
                      value={activePage.type}
                      onChange={v => updatePageById(activePage.id, { type: v as PageType, title: activePage.title === DEFAULT_PAGE_TITLES[activePage.type] ? DEFAULT_PAGE_TITLES[v as PageType] : activePage.title })}
                      options={PAGE_TYPES.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
                    />
                  </div>
                </div>

                <div className="pbp-brief-field" style={{ marginBottom: 12 }}>
                  <span className="pbp-brief-label">Page Layout — targeted components</span>
                  {nonNavbarComponents.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 6px', marginTop: 4 }}>
                      {nonNavbarComponents.map(comp => {
                        const active = activePage.componentIds.includes(comp.id);
                        return (
                          <button
                            key={comp.id}
                            onClick={() => activePageIndex >= 0 && toggleComponentOnPage(activePageIndex, comp.id)}
                            className={`pbp-preset-chip${active ? ' pbp-preset-chip--active' : ''}`}
                            style={{ padding: '4px 9px 5px', fontSize: '0.68rem' }}
                          >
                            {comp.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'rgba(241,245,249,0.2)', padding: '6px 0', fontStyle: 'italic' }}>
                      No components selected to assign.
                    </div>
                  )}
                </div>

                <div className="pbp-rule-header" style={{ marginTop: 8 }}>
                  <span className="pbp-rule-label">Per-page Overrides</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!pageOverridesEnabled ? (
                      <button className="pbp-add-btn" onClick={() => setActivePageOverride({ enabled: true })}>Enable</button>
                    ) : (
                      <button className="pbp-add-btn" onClick={resetToInherited}>Reset To Inherit</button>
                    )}
                  </div>
                </div>

                {!pageOverridesEnabled ? (
                  <p className="pbp-empty-hint">This page currently inherits global Brief + Forge settings.</p>
                ) : (
                  <>
                    <div className="pbp-rule-header">
                      <span className="pbp-rule-label">Content Overrides</span>
                    </div>
                    <div className="pbp-brief-grid">
                      <div className="pbp-brief-field">
                        <span className="pbp-brief-label">Page headline</span>
                        <input
                          className="pbp-brief-input"
                          placeholder="Custom headline for this page"
                          value={activePage.overrides?.content?.pageTitle ?? ''}
                          onChange={(e) => updateActivePageContent({ pageTitle: e.target.value })}
                        />
                      </div>
                      <div className="pbp-brief-field">
                        <span className="pbp-brief-label">Page tagline</span>
                        <input
                          className="pbp-brief-input"
                          placeholder="Custom subheading"
                          value={activePage.overrides?.content?.tagline ?? ''}
                          onChange={(e) => updateActivePageContent({ tagline: e.target.value })}
                        />
                      </div>
                      <div className="pbp-brief-field pbp-brief-field--full">
                        <span className="pbp-brief-label">CTA override</span>
                        <input
                          className="pbp-brief-input"
                          placeholder="Get Started"
                          value={activePage.overrides?.content?.callToAction ?? ''}
                          onChange={(e) => updateActivePageContent({ callToAction: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pbp-rule-header">
                      <span className="pbp-rule-label">Style Overrides</span>
                    </div>
                    <div className="pbp-brief-grid">
                      <div className="pbp-brief-field">
                        <span className="pbp-brief-label">Site type</span>
                        <AnimatedSelect
                          value={activePage.overrides?.style?.siteType ?? ''}
                          placeholder="Inherit global"
                          onChange={(v) => setActivePageOverride({ style: { ...(activePage.overrides?.style ?? {}), siteType: v } })}
                          options={[
                            { label: 'Inherit', value: '' },
                            ...['Portfolio', 'Landing', 'SaaS', 'Agency'].map(v => ({ label: v, value: v })),
                          ]}
                        />
                      </div>
                      <div className="pbp-brief-field">
                        <span className="pbp-brief-label">Color strategy</span>
                        <AnimatedSelect
                          value={activePage.overrides?.style?.colorStrategy ?? ''}
                          placeholder="Inherit global"
                          onChange={(v) => setActivePageOverride({ style: { ...(activePage.overrides?.style ?? {}), colorStrategy: v } })}
                          options={[
                            { label: 'Inherit', value: '' },
                            { label: 'Dark + Accent', value: 'dark-bold-accent' },
                            { label: 'Light', value: 'light-subtle' },
                            { label: 'B&W + Pop', value: 'high-contrast-bw' },
                            { label: 'Mono', value: 'monochromatic' },
                            { label: 'Colorful', value: 'colorful' },
                          ]}
                        />
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function OutputTab({ style, onChange }: { style: ScrollbarStyle; onChange: (s: ScrollbarStyle) => void }) {
  const modes: ScrollbarStyle['mode'][] = ['default', 'hidden', 'custom'];
  const modeLabel: Record<ScrollbarStyle['mode'], string> = { default: 'Browser', hidden: 'Hidden', custom: 'Custom' };

  return (
    <div className="pbp-sizes-tab">
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Scroll Behavior</span>
      </div>
      <div className="pbp-sizes-chip-grid" style={{ display: 'flex', gap: 16 }}>
        {(['default', 'smooth'] as const).map(m => (
          <PremiumUnderlineButton
            key={m}
            active={(style.scrollBehavior ?? 'default') === m}
            onClick={() => onChange({ ...style, scrollBehavior: m })}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </PremiumUnderlineButton>
        ))}
      </div>

      <div className="pbp-rule-header" style={{ marginTop: '20px' }}>
        <span className="pbp-rule-label">Scrollbar Style</span>
      </div>
      <div className="pbp-sizes-chip-grid" style={{ display: 'flex', gap: 16 }}>
        {modes.map(m => (
          <PremiumUnderlineButton
            key={m}
            active={style.mode === m}
            onClick={() => onChange({ ...style, mode: m })}
          >
            {modeLabel[m]}
          </PremiumUnderlineButton>
        ))}
      </div>
      {style.mode === 'custom' && (
        <div className="pbp-sizes-grid" style={{ marginTop: 14 }}>
          <div className="pbp-sizes-field">
            <span className="pbp-sizes-label">Track color</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={style.track || '#000000'}
                onChange={e => onChange({ ...style, track: e.target.value })}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'none' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{style.track || '#000000'}</span>
            </div>
          </div>
          <div className="pbp-sizes-field">
            <span className="pbp-sizes-label">Thumb color</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={style.thumb || '#555555'}
                onChange={e => onChange({ ...style, thumb: e.target.value })}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'none' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{style.thumb || '#555555'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProjectBuilderPanel({
  selectedComponents,
  maxSelectedComponents = 5,
  prompt,
  onPromptChange,
  onGenerate,
  designRules,
  onDesignRulesChange,
  styleDirection,
  onStyleDirectionChange,
  clientBrief,
  onClientBriefChange,
  onRestoreFromHistory,
  scrollbarStyle,
  onScrollbarStyleChange,
  pages,
  onPagesChange,
  onGenerateStructure,
  allComponents,
  onToggleComponent,
}: ProjectBuilderPanelProps) {
  const navbarComponent = selectedComponents.find(c => isNavigationComponentName(c.name));
  const [activeTab, setActiveTab] = useState<Tab>('Brief');
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollstate = (el: HTMLDivElement) => {
    setTopOpacity(Math.min(el.scrollTop / 30, 1));
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setBottomOpacity(el.scrollHeight <= el.clientHeight ? 0 : Math.min(dist / 30, 1));
  };

  useEffect(() => {
    if (scrollRef.current) {
      updateScrollstate(scrollRef.current);
    }
  }, [activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    updateScrollstate(e.currentTarget);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.focus();
  };


  const IMG_LIMITS: Record<ImageCategory, number> = { logo: 1, product: 6, inspiration: 8 };

  const handlePickImages = async (category: ImageCategory) => {
    const picked = await window.reactBitsApi.pickDesignImages?.() ?? [];
    if (!picked.length) return;
    const tagged = picked.map(img => ({ ...img, category }));
    const existing = designRules.images ?? [];
    const others = existing.filter(img => (img.category ?? 'inspiration') !== category);
    const same = existing.filter(img => (img.category ?? 'inspiration') === category);
    const merged = [...same, ...tagged].slice(0, IMG_LIMITS[category]);
    onDesignRulesChange({ ...designRules, images: [...others, ...merged] });
  };

  const handleRemoveImage = (img: ImageEntry) =>
    onDesignRulesChange({
      ...designRules,
      images: (designRules.images ?? []).filter(m => m !== img),
    });

  return (
    <div className="pbp-root">
      <div className="pbp-main-header">
        <span className="pbp-main-title">PROJECT</span>
      </div>

      {/* NEW: Unified Sub-panel Header Bar */}
      <div className="pbp-unified-header-bar">
        <div className="pbp-col-header pbp-col-header--forge">
          <span className="pbp-nav-header-text">Forge</span>
        </div>
        <div />
        <div className="pbp-col-header pbp-col-header--assembly">
          <span className="pbp-panel-title-text">ASSEMBLY ACTIONS</span>
        </div>
        <div className="pbp-config-title-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={activeTab}
              className="pbp-workspace-title-text"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {`${activeTab.toUpperCase()} CONFIGURATION`}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="pbp-columns-area">
        <div className="pbp-nav-sidebar">
          <div
            className="pbp-nav-scroll"
            onScroll={handleScroll}
            ref={scrollRef}
            tabIndex={0}
            onMouseEnter={handleMouseEnter}
            style={{ outline: 'none' }}
          >
            <div className="pbp-nav-items">
              {TABS.map((t, idx) => (
                <motion.button
                  key={t}
                  initial={{ opacity: 0, x: -10, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className={`pbp-tab-btn ${activeTab === t ? 'pbp-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {activeTab === t && (
                    <motion.div
                      layoutId="active-pill"
                      className="pbp-active-pill"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="pbp-tab-text">{t}</span>
                </motion.button>
              ))}
            </div>
          </div>
          <div className="pbp-nav-gradient pbp-nav-gradient--top" style={{ opacity: topOpacity }} />
          <div className="pbp-nav-gradient pbp-nav-gradient--bottom" style={{ opacity: bottomOpacity }} />
        </div>

        <div className="pbp-config-workspace">
          <div
            className="pbp-tab-content-root"
            tabIndex={0}
            onMouseEnter={handleMouseEnter}
          >
            <AnimatePresence mode="wait">
              <MotionDiv
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%' }}
              >
                {activeTab === 'Brief' && <BriefTab brief={clientBrief} onChange={onClientBriefChange} />}
                {activeTab === 'Style' && <StyleTab style={styleDirection} onChange={onStyleDirectionChange} />}
                {activeTab === 'Fonts' && <FontsTab rules={designRules} onChange={onDesignRulesChange} />}
                {activeTab === 'Colors' && <ColorsTab rules={designRules} onChange={onDesignRulesChange} />}
                {activeTab === 'Sizes' && (
                  <SizesTab
                    rules={designRules}
                    onChange={onDesignRulesChange}
                    style={styleDirection}
                    onStyleChange={onStyleDirectionChange}
                  />
                )}
                {activeTab === 'Images' && <ImagesTab images={designRules.images ?? []} onPick={handlePickImages} onRemove={handleRemoveImage} limits={IMG_LIMITS} />}
                {activeTab === 'Output' && <OutputTab style={scrollbarStyle} onChange={onScrollbarStyleChange} />}
                {activeTab === 'Pages' && <PagesTab pages={pages} onChange={onPagesChange} selectedComponents={selectedComponents} allComponents={allComponents} onToggleComponent={onToggleComponent} />}
              </MotionDiv>
            </AnimatePresence>
          </div>
        </div>

        <div className="pbp-action-center">
          <div
            className="pbp-action-scroll"
            tabIndex={0}
            onMouseEnter={handleMouseEnter}
          >
            <div className="pbp-assembly-stack">
              <div className="pbp-assembly-block pbp-assembly-components">
                <AssemblySelectedCategories
                  selectedComponents={selectedComponents}
                  maxSelectedComponents={maxSelectedComponents}
                  performanceProfile={WEIGHT_BUDGETS[styleDirection.performanceProfileId || DEFAULT_PERFORMANCE_PROFILE_ID]}
                />
              </div>

              <div className="pbp-assembly-block pbp-prompt-container">
                <span className="pbp-brief-label">Command Brief</span>
                <textarea
                  className="pbp-brief-textarea"
                  placeholder="Describe the soul of your project..."
                  value={prompt}
                  onChange={e => onPromptChange(e.target.value)}
                />
                <div className="pbp-prompt-generate-wrap">
                  <PremiumUnderlineButton
                    onClick={onGenerate}
                    primary
                    fullWidth
                  >
                    <span className="pbp-assembly-generate-btn-label">Generate project</span>
                    <span className="pbp-assembly-generate-btn-icon">
                      <AssemblyGenerateBuildIcon />
                    </span>
                  </PremiumUnderlineButton>

                  <PremiumUnderlineButton
                    disabled={!navbarComponent}
                    onClick={() => {
                      if (navbarComponent) {
                        onGenerateStructure(pages, `${navbarComponent.category}/${navbarComponent.name}`);
                      }
                    }}
                    primary
                    fullWidth
                  >
                    <span className="pbp-assembly-generate-btn-label">Generate Project Structure</span>
                    <span className="pbp-assembly-generate-btn-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </span>
                  </PremiumUnderlineButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
