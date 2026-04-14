import React, { useState, useMemo } from 'react';
import { EnhancePromptButton } from './EnhancePromptButton';
import type { LayoutConcept } from '../lib/layoutConceptGenerator';

interface ComponentItem {
  id: string;
  name: string;
  category: string;
  usageMarkdown: string;
}

export type FontRole = 'heading' | 'body' | 'accent' | '';
export type ColorRole = 'background' | 'text' | 'components' | 'accent' | '';

export interface FontEntry { value: string; role: FontRole }
export interface ColorEntry { value: string; role: ColorRole }

export interface DesignRules {
  fonts: FontEntry[];
  colors: ColorEntry[];
  sizes: { strategy: 'mobile-first' | 'desktop-first' | 'both'; maxWidth: string };
}

export const DEFAULT_DESIGN_RULES: DesignRules = {
  fonts: [],
  colors: [],
  sizes: { strategy: 'mobile-first', maxWidth: '1280px' }
};

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

const ProjectBuilderPanel: React.FC<ProjectBuilderPanelProps> = ({
  selectedComponents,
  categoryLimits,
  prompt,
  onPromptChange,
  onGenerate,
  designRules,
  onDesignRulesChange,
  layoutConcept,
  onOpenLayoutPicker,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [designRulesOpen, setDesignRulesOpen] = useState(false);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const categories = Object.keys(categoryLimits);

  const grouped = useMemo(() => {
    const res: Record<string, ComponentItem[]> = {};
    categories.forEach(cat => {
      res[cat] = selectedComponents.filter(c => c.category === cat);
    });
    return res;
  }, [selectedComponents, categories]);

  const MAX_ENTRIES = 5;

  const addFont = () => {
    if (designRules.fonts.length >= MAX_ENTRIES) return;
    onDesignRulesChange({ ...designRules, fonts: [...designRules.fonts, { value: '', role: '' }] });
  };
  const removeFont = (i: number) =>
    onDesignRulesChange({ ...designRules, fonts: designRules.fonts.filter((_, idx) => idx !== i) });
  const updateFont = (i: number, patch: Partial<FontEntry>) =>
    onDesignRulesChange({ ...designRules, fonts: designRules.fonts.map((f, idx) => idx === i ? { ...f, ...patch } : f) });

  const addColor = () => {
    if (designRules.colors.length >= MAX_ENTRIES) return;
    onDesignRulesChange({ ...designRules, colors: [...designRules.colors, { value: '#0f172a', role: '' }] });
  };
  const removeColor = (i: number) =>
    onDesignRulesChange({ ...designRules, colors: designRules.colors.filter((_, idx) => idx !== i) });
  const updateColor = (i: number, patch: Partial<ColorEntry>) =>
    onDesignRulesChange({ ...designRules, colors: designRules.colors.map((c, idx) => idx === i ? { ...c, ...patch } : c) });

  const setSize = (key: keyof DesignRules['sizes'], val: string) =>
    onDesignRulesChange({ ...designRules, sizes: { ...designRules.sizes, [key]: val } });

  const hasRules =
    designRules.fonts.length > 0 ||
    designRules.colors.length > 0 ||
    designRules.sizes.strategy !== 'mobile-first' ||
    designRules.sizes.maxWidth !== '1280px';

  return (
    <div className="project-builder-pane">
      <header className="preview-header">
        <h3>Project Builder</h3>
        <span className="category-comment">// V0.2.2 Alpha</span>
      </header>

      <div className="builder-content">
        <label className="builder-label">Selected Elements</label>

        <div className="category-placeholders">
          {categories.map(cat => {
            const count = grouped[cat].length;
            const limit = categoryLimits[cat];
            const isExpanded = expandedCategories.includes(cat);

            return (
              <div key={cat} className={`category-summary-box ${count > 0 ? 'has-selection' : ''} ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="category-summary-row"
                  onClick={() => toggleCategory(cat)}
                >
                  <span className="cat-name">{cat}</span>
                  <div className="cat-status">
                    <span className={`cat-count ${count >= limit ? 'limit-reached' : ''}`}>
                      {count}/{limit}
                    </span>
                    <span className="expand-chevron">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="selected-elements-list mini">
                    {grouped[cat].length > 0 ? (
                      grouped[cat].map((item, i) => (
                        <div key={i} className="selected-element-tag">
                          {item.name}
                        </div>
                      ))
                    ) : (
                      <p className="builder-empty-text small">No {cat} selected.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="builder-section" style={{ marginTop: '1rem' }}>
          <label className="builder-label">AI Project Prompt</label>
          <textarea
            className="builder-textarea"
            placeholder="Describe the project you want to build with these components..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
        </div>

        {/* ── Layout Concept ────────────────────────────────────────────── */}
        <div className="layout-concept-row">
          <button
            type="button"
            className={`layout-set-btn ${layoutConcept ? 'has-concept' : ''}`}
            onClick={onOpenLayoutPicker}
            disabled={selectedComponents.length < 2}
          >
            <span className="layout-set-icon">⊞</span>
            <span>{layoutConcept ? layoutConcept.name : 'Set Layout'}</span>
          </button>
          {layoutConcept && (
            <span className="layout-concept-badge">{layoutConcept.zones.filter(z => z.heightHint !== 'overlay').length} zones</span>
          )}
        </div>

        {/* ── Design Rules ──────────────────────────────────────────────── */}
        <div className="design-rules-container">
          <button
            className={`design-rules-toggle ${designRulesOpen ? 'open' : ''} ${hasRules ? 'has-rules' : ''}`}
            onClick={() => setDesignRulesOpen(prev => !prev)}
            type="button"
          >
            <span className="design-rules-toggle-icon">⚙</span>
            <span className="design-rules-toggle-label">Design Rules</span>
            {hasRules && <span className="design-rules-badge">active</span>}
            <span className="design-rules-chevron">{designRulesOpen ? '▲' : '▼'}</span>
          </button>

          {designRulesOpen && (
            <div className="design-rules-panel">

              {/* Fonts */}
              <div className="design-rule-group">
                <div className="design-rule-group-header">
                  <span className="design-rule-group-label">Fonts</span>
                  {designRules.fonts.length < MAX_ENTRIES && (
                    <button type="button" className="design-add-btn" onClick={addFont}>+ Add</button>
                  )}
                </div>
                {designRules.fonts.length === 0 && (
                  <p className="design-empty-hint">Click + Add to specify fonts for the AI to use.</p>
                )}
                <div className="design-rule-inputs">
                  {designRules.fonts.map((font, i) => (
                    <div key={i} className="design-input-row">
                      <input
                        type="text"
                        className="design-text-input"
                        placeholder="Font name, URL, or file..."
                        value={font.value}
                        onChange={e => updateFont(i, { value: e.target.value })}
                      />
                      <select
                        className="design-role-select"
                        value={font.role}
                        onChange={e => updateFont(i, { role: e.target.value as FontRole })}
                      >
                        <option value="">Auto</option>
                        <option value="heading">Heading</option>
                        <option value="body">Body</option>
                        <option value="accent">Accent</option>
                      </select>
                      <button type="button" className="design-remove-btn" onClick={() => removeFont(i)}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="design-rule-group">
                <div className="design-rule-group-header">
                  <span className="design-rule-group-label">Colors</span>
                  {designRules.colors.length < MAX_ENTRIES && (
                    <button type="button" className="design-add-btn" onClick={addColor}>+ Add</button>
                  )}
                </div>
                {designRules.colors.length === 0 && (
                  <p className="design-empty-hint">Click + Add to give the AI color ideas.</p>
                )}
                <div className="design-rule-inputs">
                  {designRules.colors.map((color, i) => (
                    <div key={i} className="design-input-row">
                      <div className="design-color-row">
                        <input
                          type="color"
                          className="design-color-picker"
                          value={color.value}
                          onChange={e => updateColor(i, { value: e.target.value })}
                        />
                        <input
                          type="text"
                          className="design-text-input design-hex-input"
                          value={color.value}
                          onChange={e => {
                            const v = e.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateColor(i, { value: v });
                          }}
                          maxLength={7}
                        />
                      </div>
                      <select
                        className="design-role-select"
                        value={color.role}
                        onChange={e => updateColor(i, { role: e.target.value as ColorRole })}
                      >
                        <option value="">Auto</option>
                        <option value="background">Background</option>
                        <option value="text">Text</option>
                        <option value="components">Components</option>
                        <option value="accent">Accent</option>
                      </select>
                      <button type="button" className="design-remove-btn" onClick={() => removeColor(i)}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="design-rule-group">
                <span className="design-rule-group-label">Sizes</span>
                <div className="design-rule-inputs">
                  <div className="design-input-row">
                    <label className="design-input-label">Strategy</label>
                    <div className="design-toggle-row">
                      {(['mobile-first', 'desktop-first', 'both'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`design-strategy-btn ${designRules.sizes.strategy === s ? 'active' : ''}`}
                          onClick={() => setSize('strategy', s)}
                        >
                          {s === 'mobile-first' ? '📱 Mobile' : s === 'desktop-first' ? '🖥 Desktop' : '⊞ Both'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="design-input-row">
                    <label className="design-input-label">Max Width</label>
                    <input
                      type="text"
                      className="design-text-input"
                      value={designRules.sizes.maxWidth}
                      onChange={e => setSize('maxWidth', e.target.value)}
                      placeholder="1280px"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      <div className="builder-footer">
        <button
          className="primary-btn generate-project-btn"
          onClick={onGenerate}
          disabled={selectedComponents.length === 0}
        >
          Generate Demo Project
        </button>
      </div>
    </div>
  );
};

export default ProjectBuilderPanel;
