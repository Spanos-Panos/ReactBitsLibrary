import { useState } from 'react';
import './ProjectBuilderPanel.css';
import type { LayoutConcept } from '../lib/layoutConceptGenerator';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FontRole = 'heading' | 'body' | 'accent' | '';
export type ColorRole = 'background' | 'text' | 'components' | 'accent' | '';

export interface FontEntry  { value: string; role: FontRole }
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

export const DEFAULT_DESIGN_RULES: DesignRules = {
  fonts: [],
  colors: [],
  sizes: { strategy: 'mobile-first', maxWidth: '1280px' },
  images: [],
};

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

// ── Main component ─────────────────────────────────────────────────────────────

type Tab = 'Fonts' | 'Colors' | 'Layout' | 'Sizes' | 'Images';
const TABS: Tab[] = ['Fonts', 'Colors', 'Layout', 'Sizes', 'Images'];

const CHIP_CATEGORY_CLASS: Record<string, string> = {
  Components:     'pbp-chip--components',
  Backgrounds:    'pbp-chip--backgrounds',
  TextAnimations: 'pbp-chip--textanimations',
  Animations:     'pbp-chip--animations',
};

interface ComponentItem { id: string; name: string; category: string; usageMarkdown: string }

interface ProjectBuilderPanelProps {
  selectedComponents: ComponentItem[];
  categoryLimits: Record<string, number>;
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  onRestoreFromHistory?: (prompt: string, selectedComponents: ComponentItem[]) => void;
  designRules: DesignRules;
  onDesignRulesChange: (rules: DesignRules) => void;
  layoutConcept: LayoutConcept | null;
  onOpenLayoutPicker: () => void;
}

export default function ProjectBuilderPanel({
  selectedComponents,
  prompt,
  onPromptChange,
  onGenerate,
  designRules,
  onDesignRulesChange,
  layoutConcept,
  onOpenLayoutPicker,
}: ProjectBuilderPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Fonts');

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

  return (
    <div className="pbp-root">
      {/* ── Left: project ── */}
      <div className="pbp-left">
        <span className="pbp-label">Project</span>

        <div className="pbp-chips">
          {selectedComponents.length === 0
            ? <p className="pbp-chips-empty">No components selected</p>
            : selectedComponents.map(c => (
                <span
                  key={c.id}
                  className={`pbp-chip ${CHIP_CATEGORY_CLASS[c.category] ?? ''}`}
                >
                  {c.name}
                </span>
              ))
          }
        </div>

        <textarea
          className="pbp-prompt"
          placeholder="Describe your project…"
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
        />

        <button
          className="pbp-generate"
          disabled={selectedComponents.length === 0 || !prompt.trim()}
          onClick={onGenerate}
        >
          Generate Project
        </button>
      </div>

      {/* ── Right: design suitcase ── */}
      <div className="pbp-right">
        <div className="pbp-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`pbp-tab${activeTab === t ? ' pbp-tab--active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="pbp-tab-body">
          {activeTab === 'Fonts'  && <FontsTab  rules={designRules} onChange={onDesignRulesChange} />}
          {activeTab === 'Colors' && <ColorsTab rules={designRules} onChange={onDesignRulesChange} />}
          {activeTab === 'Layout' && <LayoutTab concept={layoutConcept} onOpen={onOpenLayoutPicker} disabled={selectedComponents.length < 2} />}
          {activeTab === 'Sizes'  && <SizesTab  rules={designRules} onChange={onDesignRulesChange} />}
          {activeTab === 'Images' && <ImagesTab images={designRules.images ?? []} onPick={handlePickImages} onRemove={handleRemoveImage} />}
        </div>
      </div>
    </div>
  );
}
