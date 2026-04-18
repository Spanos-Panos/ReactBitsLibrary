import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ProjectBuilderPanel.css';
import type { LayoutConcept } from '../lib/layoutConceptGenerator';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ComponentItem {
  id: string;
  name: string;
  category: string;
  usageMarkdown: string;
}

export type FontRole = 'heading' | 'body' | 'accent' | '';
export type ColorRole = 'background' | 'text' | 'components' | 'accent' | '';

export interface FontEntry { value: string; role: FontRole }
export interface ColorEntry { value: string; role: ColorRole }

export interface ImageEntry {
  name: string;
  path: string;
  base64: string;
}

export interface DesignRules {
  fonts: FontEntry[];
  colors: ColorEntry[];
  sizes: { strategy: 'mobile-first' | 'desktop-first' | 'both'; maxWidth: string };
  images: ImageEntry[];
}

export type AestheticPreset =
  | 'Editorial' | 'Brutalist' | 'Minimal' | 'Futuristic'
  | 'Organic' | 'Playful' | 'Luxury' | 'Corporate';

export type TypographyIntensity = 'subtle' | 'dramatic' | 'experimental';

export type ColorStrategy =
  | 'dark-bold-accent' | 'light-subtle' | 'high-contrast-bw'
  | 'monochromatic' | 'colorful';

export interface StyleDirection {
  aesthetics: AestheticPreset[];
  siteType: string;
  typographyIntensity: TypographyIntensity;
  visualEffects: string[];
  colorStrategy: ColorStrategy;
  audience: string;
}

export interface ProjectBuilderPanelProps {
  selectedComponents: ComponentItem[];
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  designRules: DesignRules;
  onDesignRulesChange: (rules: DesignRules) => void;
  layoutConcept: LayoutConcept | null;
  onOpenLayoutPicker: () => void;
  styleDirection: StyleDirection;
  onStyleDirectionChange: (s: StyleDirection) => void;
  clientBrief: ClientBrief;
  onClientBriefChange: (b: ClientBrief) => void;
}

export interface ClientBrief {
  brandName: string;
  tagline: string;
  industry: string;
  description: string;
  usp: string;
  services: string;
  targetAudience: string;
  callToAction: string;
  keyBenefits: string;
  tone: string;
  personality: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  socialLinks: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEFAULT_DESIGN_RULES: DesignRules = {
  fonts: [],
  colors: [],
  sizes: { strategy: 'mobile-first', maxWidth: '1280px' },
  images: [],
};

export const DEFAULT_STYLE_DIRECTION: StyleDirection = {
  aesthetics: [],
  siteType: 'Landing',
  typographyIntensity: 'dramatic',
  visualEffects: [],
  colorStrategy: 'dark-bold-accent',
  audience: '',
};

export const DEFAULT_CLIENT_BRIEF: ClientBrief = {
  brandName: '', tagline: '', industry: '', description: '', usp: '',
  services: '', targetAudience: '', callToAction: '', keyBenefits: '',
  tone: '', personality: '', contactEmail: '', contactPhone: '', location: '', socialLinks: '',
};

type Tab = 'Brief' | 'Style' | 'Fonts' | 'Colors' | 'Layout' | 'Sizes' | 'Images';
const TABS: Tab[] = ['Brief', 'Style', 'Fonts', 'Colors', 'Layout', 'Sizes', 'Images'];


const CHIP_CATEGORY_CLASS: Record<string, string> = {
  Components: 'pbp-chip--components',
  Backgrounds: 'pbp-chip--backgrounds',
  TextAnimations: 'pbp-chip--textanimations',
  Animations: 'pbp-chip--animations',
};

const MotionDiv = motion.div;

// ── Sub-components ─────────────────────────────────────────────────────────────

const MAX = 5;

function FontsTab({ rules, onChange }: { rules: DesignRules; onChange: (r: DesignRules) => void }) {
  const add = () => {
    if (rules.fonts.length >= MAX) return;
    onChange({ ...rules, fonts: [...rules.fonts, { value: '', role: '' }] });
  };
  const remove = (i: number) => onChange({ ...rules, fonts: rules.fonts.filter((_, idx) => idx !== i) });
  const update = (i: number, patch: Partial<FontEntry>) =>
    onChange({ ...rules, fonts: rules.fonts.map((f, idx) => idx === i ? { ...f, ...patch } : f) });

  return (
    <>
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Fonts</span>
        {rules.fonts.length < MAX && <button className="pbp-add-btn" onClick={add}>+ Add</button>}
      </div>
      {rules.fonts.length === 0 && <p className="pbp-empty-hint">No fonts set — AI will choose.</p>}
      {rules.fonts.map((font, i) => (
        <div key={i} className="pbp-input-row">
          <input
            className="pbp-text-input"
            placeholder="Font name, URL…"
            value={font.value}
            onChange={e => update(i, { value: e.target.value })}
          />
          <select
            className="pbp-role-select"
            value={font.role}
            onChange={e => update(i, { role: e.target.value as FontRole })}
          >
            <option value="">Auto</option>
            <option value="heading">Heading</option>
            <option value="body">Body</option>
            <option value="accent">Accent</option>
          </select>
          <button className="pbp-remove-btn" onClick={() => remove(i)}>×</button>
        </div>
      ))}
    </>
  );
}

function ColorsTab({ rules, onChange }: { rules: DesignRules; onChange: (r: DesignRules) => void }) {
  const add = () => {
    if (rules.colors.length >= MAX) return;
    onChange({ ...rules, colors: [...rules.colors, { value: '#0f172a', role: '' }] });
  };
  const remove = (i: number) => onChange({ ...rules, colors: rules.colors.filter((_, idx) => idx !== i) });
  const update = (i: number, patch: Partial<ColorEntry>) =>
    onChange({ ...rules, colors: rules.colors.map((c, idx) => idx === i ? { ...c, ...patch } : c) });

  return (
    <>
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Colors</span>
        {rules.colors.length < MAX && <button className="pbp-add-btn" onClick={add}>+ Add</button>}
      </div>
      {rules.colors.length === 0 && <p className="pbp-empty-hint">No colors set — AI will choose.</p>}
      {rules.colors.map((color, i) => (
        <div key={i} className="pbp-input-row">
          <div className="pbp-color-row">
            <input
              type="color"
              className="pbp-color-picker"
              value={color.value}
              onChange={e => update(i, { value: e.target.value })}
            />
            <input
              type="text"
              className="pbp-text-input pbp-hex-input"
              value={color.value}
              onChange={e => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update(i, { value: v });
              }}
              maxLength={7}
            />
          </div>
          <select
            className="pbp-role-select"
            value={color.role}
            onChange={e => update(i, { role: e.target.value as ColorRole })}
          >
            <option value="">Auto</option>
            <option value="background">Background</option>
            <option value="text">Text</option>
            <option value="components">Components</option>
            <option value="accent">Accent</option>
          </select>
          <button className="pbp-remove-btn" onClick={() => remove(i)}>×</button>
        </div>
      ))}
    </>
  );
}

function LayoutTab({ concept, onOpen, disabled }: { concept: LayoutConcept | null; onOpen: () => void; disabled: boolean }) {
  return (
    <>
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Layout Concept</span>
      </div>
      {concept ? (
        <div className="pbp-layout-card">
          <div className="pbp-layout-info">
            <div className="pbp-layout-name">{concept.name}</div>
            <div className="pbp-layout-desc">{concept.description}</div>
          </div>
          <span className="pbp-layout-zones">
            {concept.zones.filter(z => z.heightHint !== 'overlay').length} zones
          </span>
        </div>
      ) : (
        <p className="pbp-empty-hint">No layout set — select 2+ components to enable.</p>
      )}
      <button className="pbp-layout-btn" onClick={onOpen} disabled={disabled}>
        {concept ? 'Change Layout' : '+ Set Layout'}
      </button>
    </>
  );
}

function SizesTab({ rules, onChange }: { rules: DesignRules; onChange: (r: DesignRules) => void }) {
  const set = (key: keyof DesignRules['sizes'], val: string) =>
    onChange({ ...rules, sizes: { ...rules.sizes, [key]: val } });

  return (
    <>
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Responsive Strategy</span>
      </div>
      <div className="pbp-strategy-group">
        {(['mobile-first', 'desktop-first', 'both'] as const).map(s => (
          <button
            key={s}
            className={`pbp-strategy-btn${rules.sizes.strategy === s ? ' pbp-strategy-btn--active' : ''}`}
            onClick={() => set('strategy', s)}
          >
            {s === 'mobile-first' ? 'Mobile' : s === 'desktop-first' ? 'Desktop' : 'Both'}
          </button>
        ))}
      </div>
      <div className="pbp-rule-header" style={{ marginTop: '0.5rem' }}>
        <span className="pbp-rule-label">Max Width</span>
      </div>
      <div className="pbp-input-row">
        <span className="pbp-input-label">Max width</span>
        <input
          type="text"
          className="pbp-text-input"
          value={rules.sizes.maxWidth}
          onChange={e => set('maxWidth', e.target.value)}
          placeholder="1280px"
        />
      </div>
    </>
  );
}

function ImagesTab({
  images,
  onPick,
  onRemove,
}: {
  images: ImageEntry[];
  onPick: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <>
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Inspiration Images</span>
        {images.length > 0 && <span className="pbp-img-count">{images.length} / 6</span>}
      </div>
      {images.length === 0 && <p className="pbp-empty-hint">Add images as visual references for the AI.</p>}
      {images.length > 0 && (
        <div className="pbp-img-grid">
          {images.map((img, i) => (
            <div key={i} className="pbp-img-wrap">
              <img src={img.base64} alt={img.name} className="pbp-img-thumb" />
              <button className="pbp-img-remove" onClick={() => onRemove(i)} title="Remove">×</button>
            </div>
          ))}
        </div>
      )}
      {images.length < 6 && (
        <button className="pbp-add-img" onClick={onPick}>+ Add images</button>
      )}
    </>
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
      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Identity</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field">
          <label className="pbp-brief-label">Brand / Project Name</label>
          <input className="pbp-brief-input" placeholder="Acme Corp" value={brief.brandName} onChange={e => set('brandName', e.target.value)} />
        </div>
        <div className="pbp-brief-field">
          <label className="pbp-brief-label">Industry</label>
          <select className="pbp-brief-select" value={brief.industry} onChange={e => set('industry', e.target.value)}>
            <option value="">— Select —</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="pbp-brief-field pbp-brief-field--full">
          <label className="pbp-brief-label">Tagline / Slogan</label>
          <input className="pbp-brief-input" placeholder="Build fast, ship now." value={brief.tagline} onChange={e => set('tagline', e.target.value)} />
        </div>
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">About</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field pbp-brief-field--full">
          <label className="pbp-brief-label">Description</label>
          <textarea className="pbp-brief-textarea" rows={3} placeholder="Describe your goal…" value={brief.description} onChange={e => set('description', e.target.value)} />
        </div>
      </div>

      <div className="pbp-rule-header">
        <span className="pbp-rule-label">Tone & Personality</span>
      </div>
      <div className="pbp-brief-grid">
        <div className="pbp-brief-field pbp-brief-field--full">
          <label className="pbp-brief-label">Tone of Voice</label>
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
      </div>
    </>
  );
}

function StyleTab({ style, onChange }: { style: StyleDirection; onChange: (s: StyleDirection) => void }) {
  const AESTHETICS: AestheticPreset[] = ['Editorial', 'Brutalist', 'Minimal', 'Futuristic', 'Organic', 'Playful', 'Luxury', 'Corporate'];
  const SITE_TYPES = ['Portfolio', 'Landing', 'Agency', 'SaaS', 'E-commerce', 'Blog', 'Event'];
  const COLOR_STRATEGIES: { value: ColorStrategy; label: string }[] = [
    { value: 'dark-bold-accent', label: 'Dark + Accent' },
    { value: 'light-subtle', label: 'Light' },
    { value: 'high-contrast-bw', label: 'B&W + Pop' },
    { value: 'monochromatic', label: 'Mono' },
    { value: 'colorful', label: 'Colorful' },
  ];

  const toggleAesthetic = (a: AestheticPreset) => {
    const cur = style.aesthetics;
    if (cur.includes(a)) {
      onChange({ ...style, aesthetics: cur.filter(x => x !== a) });
    } else if (cur.length < 2) {
      onChange({ ...style, aesthetics: [...cur, a] });
    }
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

      <div className="pbp-rule-header" style={{ marginTop: '0.4rem' }}>
        <span className="pbp-rule-label">Site Type</span>
      </div>
      <select
        className="pbp-site-type-select"
        value={style.siteType}
        onChange={e => onChange({ ...style, siteType: e.target.value })}
      >
        {SITE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <div className="pbp-rule-header" style={{ marginTop: '0.4rem' }}>
        <span className="pbp-rule-label">Color Strategy</span>
      </div>
      <div className="pbp-color-strategy-row">
        {COLOR_STRATEGIES.map(({ value, label }) => (
          <button
            key={value}
            className={`pbp-type-btn${style.colorStrategy === value ? ' pbp-type-btn--active' : ''}`}
            onClick={() => onChange({ ...style, colorStrategy: value })}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProjectBuilderPanel({
  selectedComponents,
  prompt,
  onPromptChange,
  onGenerate,
  designRules,
  onDesignRulesChange,
  layoutConcept,
  onOpenLayoutPicker,
  styleDirection,
  onStyleDirectionChange,
  clientBrief,
  onClientBriefChange,
}: ProjectBuilderPanelProps) {
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


  const handlePickImages = async () => {
    const picked = await window.reactBitsApi.pickDesignImages?.() ?? [];
    if (!picked.length) return;
    onDesignRulesChange({
      ...designRules,
      images: [...(designRules.images ?? []), ...picked].slice(0, 6),
    });
  };

  const handleRemoveImage = (i: number) =>
    onDesignRulesChange({
      ...designRules,
      images: (designRules.images ?? []).filter((_, idx) => idx !== i),
    });

  const getTabIcon = (tab: Tab) => {
    switch (tab) {
      case 'Brief': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
      case 'Style': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.5 1-4.7 2.7-6.3L12 12V2z" /></svg>;
      case 'Fonts': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>;
      case 'Colors': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>;
      case 'Layout': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>;
      case 'Sizes': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="18" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12" y2="18" /></svg>;
      case 'Images': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    }
  };

  return (
    <div className="pbp-root">
      <div className="pbp-main-header">
        <span className="pbp-main-title">PROJECT</span>
      </div>

      {/* NEW: Unified Sub-panel Header Bar */}
      <div className="pbp-unified-header-bar">
        <div className="pbp-col-header" style={{ width: '180px' }}>
          <span className="pbp-nav-header-text">Forge</span>
        </div>
        <div className="pbp-col-header" style={{ flex: 1 }}>
          <span className="pbp-workspace-title-text">{activeTab.toUpperCase()} CONFIGURATION</span>
        </div>
        <div className="pbp-col-header" style={{ width: '200px' }}>
          <span className="pbp-panel-title-text">ASSEMBLY</span>
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
                {activeTab === 'Layout' && <LayoutTab concept={layoutConcept} onOpen={onOpenLayoutPicker} disabled={selectedComponents.length < 2} />}
                {activeTab === 'Sizes' && <SizesTab rules={designRules} onChange={onDesignRulesChange} />}
                {activeTab === 'Images' && <ImagesTab images={designRules.images ?? []} onPick={handlePickImages} onRemove={handleRemoveImage} />}
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
            <div className="pbp-section-card">
              <span className="pbp-section-label">Components</span>
              <div className="pbp-chips-box">
                {selectedComponents.length === 0
                  ? <p className="pbp-chips-empty">Select components to build</p>
                  : (
                    <AnimatePresence>
                      {selectedComponents.map(c => (
                        <MotionDiv
                          key={c.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`pbp-chip ${CHIP_CATEGORY_CLASS[c.category] ?? ''}`}
                        >
                          {c.name}
                        </MotionDiv>
                      ))}
                    </AnimatePresence>
                  )
                }
              </div>
            </div>

            <div className="pbp-section-card pbp-prompt-container">
              <span className="pbp-section-label">Command Brief</span>
              <textarea
                className="pbp-prompt-area"
                placeholder="Describe the soul of your project..."
                value={prompt}
                onChange={e => onPromptChange(e.target.value)}
              />
            </div>

            <div style={{ padding: '0 0.6rem 0.6rem' }}>
              <button
                className="pbp-generate-trigger"
                disabled={selectedComponents.length === 0 || !prompt.trim()}
                onClick={onGenerate}
              >
                Generate Architecture
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
