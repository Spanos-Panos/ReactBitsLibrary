import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../shared/types/api";
import type { DesignRules, StyleDirection, ClientBrief } from '../project-builder/ProjectBuilderPanel';
import type { LayoutConcept } from '../../shared/lib/layoutConceptGenerator';

// ── Schema version ──────────────────────────────────────────────────────────────
// v1: original  (projectPrompt, selectedComponentIds, designRules, layoutConcept, projectName, packageManager)
// v2: adds      styleDirection, clientBrief
export const PRESET_SCHEMA_VERSION = 2;

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: string;
  schemaVersion: number;
  projectPrompt: string;
  selectedComponentIds: string[];
  designRules: DesignRules;
  layoutConcept: LayoutConcept | null;
  projectName: string;
  packageManager: string;
  // v2 additions — may be absent in old presets, always fall back to defaults on load
  styleDirection?: StyleDirection;
  clientBrief?: ClientBrief;
}

interface PresetManagerProps {
  isOpen: boolean;
  onToggle: () => void;
  onSave: (name: string) => Promise<void>;
  onLoad: (preset: SavedPreset) => void;
  onDelete: (id: string) => Promise<void>;
}

const api = () => window.reactBitsApi;

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const getPresetBadges = (preset: SavedPreset) => {
  const badges: { label: string; color: string }[] = [];
  if ((preset.schemaVersion ?? 1) >= 2) {
    if (preset.styleDirection?.aesthetics?.length) badges.push({ label: 'Style', color: '#818cf8' });
    if (preset.clientBrief?.brandName) badges.push({ label: 'Brief', color: '#34d399' });
  }
  if (preset.layoutConcept) badges.push({ label: 'Layout', color: '#fb923c' });
  if (preset.designRules?.fonts?.length) badges.push({ label: `${preset.designRules.fonts.length} Font${preset.designRules.fonts.length > 1 ? 's' : ''}`, color: '#a78bfa' });
  if (preset.designRules?.colors?.length) badges.push({ label: `${preset.designRules.colors.length} Color${preset.designRules.colors.length > 1 ? 's' : ''}`, color: '#f472b6' });
  if (preset.designRules?.images?.length) badges.push({ label: `${preset.designRules.images.length} Img`, color: '#facc15' });
  return badges;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function PresetManager({ isOpen, onToggle, onSave, onLoad, onDelete }: PresetManagerProps) {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPresets = async () => {
    const list = (await api()?.listPresets?.() ?? []) as SavedPreset[];
    setPresets(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadPresets();
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      setName('');
      await loadPresets();
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (preset: SavedPreset) => {
    onLoad(preset);
    setLoadedId(preset.id);
    onToggle();
    setTimeout(() => setLoadedId(null), 2500);
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 2500);
      return;
    }
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await onDelete(id);
      await loadPresets();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        className={`nav-action-btn${isOpen ? ' nav-action-btn--active' : ''}`}
        onClick={() => { if (!isOpen) onToggle(); }}
        title="Save or load project presets"
        style={{ position: 'relative' }}
      >
        {/* stack/bookmark icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <AnimatePresence>
          {presets.length > 0 && !isOpen && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                background: '#6366f1',
                color: '#fff',
                borderRadius: '9999px',
                fontSize: '8px',
                fontWeight: 700,
                lineHeight: 1,
                padding: '2px 4px',
                pointerEvents: 'none',
              }}
            >
              {presets.length}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Modal Panel (portal-free, anchored) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(2px)',
              }}
              aria-hidden
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: '56px',
                left: '12px',
                width: '360px',
                maxHeight: 'calc(100vh - 80px)',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(8, 10, 18, 0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
                overflow: 'hidden',
                zIndex: 1001,
                backdropFilter: 'blur(32px)',
              }}
            >
              {/* ── Panel Header ── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 700, letterSpacing: '0.07em', fontFamily: 'var(--font-display)' }}>
                    PROJECT PRESETS
                  </span>
                  {presets.length > 0 && (
                    <span style={{
                      background: 'rgba(99,102,241,0.2)',
                      border: '1px solid rgba(99,102,241,0.35)',
                      color: '#a5b4fc',
                      borderRadius: '9999px',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 7px',
                    }}>
                      {presets.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={onToggle}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    color: '#64748b',
                    width: '24px', height: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {/* ── Save Row ── */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '7px', textTransform: 'uppercase' }}>
                  Save current state
                </div>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="Give this preset a name…"
                    style={{
                      flex: 1, padding: '8px 11px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#e2e8f0', fontSize: '12px', outline: 'none',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    style={{
                      padding: '8px 14px',
                      background: name.trim() ? 'rgba(99,102,241,0.75)' : 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.4)',
                      borderRadius: '8px',
                      color: name.trim() ? '#e0e7ff' : '#4338ca',
                      fontSize: '12px', fontWeight: 600,
                      cursor: name.trim() ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}
                  >
                    {saving ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 0.7s linear infinite' }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17 21 17 13 7 13 7 21"/>
                          <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Save
                      </>
                    )}
                  </button>
                </div>

                {/* What gets saved hint */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                  {['Prompt', 'Components', 'Brief', 'Style', 'Fonts', 'Colors', 'Layout', 'Sizes', 'Images'].map(f => (
                    <span key={f} style={{
                      fontSize: '9px', padding: '2px 6px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '4px',
                      color: '#475569', fontWeight: 500,
                    }}>{f}</span>
                  ))}
                </div>
              </div>

              {/* ── Preset List ── */}
              <div style={{
                overflowY: 'auto',
                flex: 1,
                minHeight: 0,
              }}>
                <AnimatePresence initial={false}>
                  {presets.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ padding: '32px 16px', textAlign: 'center' }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(71,85,105,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block' }}>
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                      <div style={{ color: '#334155', fontSize: '12px', fontWeight: 500 }}>No saved presets yet</div>
                      <div style={{ color: '#1e2a3a', fontSize: '11px', marginTop: '4px' }}>Fill in your project and hit Save above</div>
                    </motion.div>
                  ) : (
                    presets.map((preset, idx) => {
                      const badges = getPresetBadges(preset);
                      const isV1 = (preset.schemaVersion ?? 1) < 2;
                      const isLoaded = loadedId === preset.id;
                      const isConfirming = confirmDeleteId === preset.id;
                      const isDeleting = deletingId === preset.id;

                      return (
                        <motion.div
                          key={preset.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.18 }}
                          style={{
                            padding: '11px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isLoaded ? 'rgba(99,102,241,0.08)' : 'transparent',
                            transition: 'background 0.3s',
                          }}
                        >
                          {/* Row 1: name + actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                color: '#e2e8f0', fontSize: '12.5px', fontWeight: 600,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: '6px',
                              }}>
                                {isLoaded && (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#34d399" stroke="none">
                                    <polyline points="20 6 9 17 4 12" stroke="#34d399" strokeWidth="3" fill="none" strokeLinecap="round"/>
                                  </svg>
                                )}
                                {preset.name}
                                {isV1 && (
                                  <span style={{ fontSize: '9px', color: '#78716c', background: 'rgba(120,113,108,0.1)', border: '1px solid rgba(120,113,108,0.2)', borderRadius: '3px', padding: '1px 4px', fontWeight: 500 }}>
                                    v1
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Load button */}
                            <button
                              onClick={() => handleLoad(preset)}
                              title="Load this preset"
                              style={{
                                padding: '4px 10px',
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                borderRadius: '6px',
                                color: '#a5b4fc',
                                fontSize: '11px', fontWeight: 600,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                              }}
                            >
                              Load
                            </button>

                            {/* Delete button (2-click confirm) */}
                            <button
                              onClick={() => handleDelete(preset.id)}
                              disabled={isDeleting}
                              title={isConfirming ? 'Click again to confirm delete' : 'Delete preset'}
                              style={{
                                padding: '4px 8px',
                                background: isConfirming ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.08)',
                                border: `1px solid ${isConfirming ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.2)'}`,
                                borderRadius: '6px',
                                color: isConfirming ? '#ef4444' : '#f87171',
                                fontSize: '11px', fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                minWidth: '44px', textAlign: 'center',
                              }}
                            >
                              {isDeleting ? '…' : isConfirming ? 'Sure?' : '×'}
                            </button>
                          </div>

                          {/* Row 2: meta + badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#334155', fontSize: '10px' }}>
                              {formatDate(preset.savedAt)}
                            </span>
                            <span style={{ color: '#1e2a3a', fontSize: '10px' }}>·</span>
                            <span style={{ color: '#334155', fontSize: '10px' }}>
                              {preset.selectedComponentIds.length} component{preset.selectedComponentIds.length !== 1 ? 's' : ''}
                            </span>
                            {badges.map(b => (
                              <span key={b.label} style={{
                                fontSize: '9px', padding: '1px 5px',
                                background: `${b.color}18`,
                                border: `1px solid ${b.color}40`,
                                borderRadius: '4px',
                                color: b.color,
                                fontWeight: 600,
                              }}>
                                {b.label}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* ── Footer ── */}
              {presets.length > 0 && (
                <div style={{
                  padding: '8px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  color: '#1e2a3a',
                  fontSize: '10px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Presets saved to Documents/.reactBitsExplorer/presets
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
