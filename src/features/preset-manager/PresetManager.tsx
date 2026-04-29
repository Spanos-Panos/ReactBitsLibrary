import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../shared/types/api";
import type { DesignRules, StyleDirection, ClientBrief, ScrollbarStyle } from '../project-builder/ProjectBuilderPanel';
import type { PageConfig } from '../../shared/types/index';

// ── Schema version ──────────────────────────────────────────────────────────────
// v1: original  (projectPrompt, selectedComponentIds, designRules, layoutConcept, projectName, packageManager)
// v2: adds      styleDirection, clientBrief
// v3: adds      layoutConfig (replaces layoutConcept)
// v4: adds      pages (multi-page structure config)
// v5: adds      scrollbarStyle (output tab settings)
// v6: adds      page overrides persistence (per-page inheritance controls)
export const PRESET_SCHEMA_VERSION = 6;

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: string;
  schemaVersion: number;
  projectPrompt: string;
  selectedComponentIds: string[];
  designRules: DesignRules;

  projectName: string;
  packageManager: string;
  // v2 additions — may be absent in old presets, always fall back to defaults on load
  styleDirection?: StyleDirection;
  clientBrief?: ClientBrief;
  // v4 addition — absent in old presets, falls back to a single Home page on load
  pages?: PageConfig[];
  // v5 addition — absent in old presets, falls back to default output settings
  scrollbarStyle?: ScrollbarStyle;
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

  if (preset.pages && preset.pages.length > 1) badges.push({ label: `${preset.pages.length} Pages`, color: '#fb923c' });
  const pagesWithOverrides = (preset.pages || []).filter(p => p.overrides?.enabled).length;
  if (pagesWithOverrides > 0) badges.push({ label: `${pagesWithOverrides} Override${pagesWithOverrides > 1 ? 's' : ''}`, color: '#22d3ee' });
  if (preset.designRules?.fonts?.length) badges.push({ label: `${preset.designRules.fonts.length} Font${preset.designRules.fonts.length > 1 ? 's' : ''}`, color: '#a78bfa' });
  if (preset.designRules?.colors?.length) badges.push({ label: `${preset.designRules.colors.length} Color${preset.designRules.colors.length > 1 ? 's' : ''}`, color: '#f472b6' });
  if (preset.designRules?.images?.length) badges.push({ label: `${preset.designRules.images.length} Img`, color: '#facc15' });
  return badges;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function PresetManager({ isOpen, onToggle, onSave, onLoad, onDelete }: PresetManagerProps) {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [confirmLoadId, setConfirmLoadId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [subPanelVisible, setSubPanelVisible] = useState(false);
  const [infoPanelVisible, setInfoPanelVisible] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  const inputRef = useRef<HTMLInputElement>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const SUBPANEL_CLOSE_MS = 240;
  const MAIN_CLOSE_MS = 260;

  useEffect(() => {
    const hasConfirm = !!(confirmLoadId || confirmDeleteId);
    if (hasConfirm) { setSubPanelVisible(true); return; }
    const t = setTimeout(() => setSubPanelVisible(false), 320);
    return () => clearTimeout(t);
  }, [confirmLoadId, confirmDeleteId]);

  useEffect(() => {
    if (infoId) { setInfoPanelVisible(true); return; }
    const t = setTimeout(() => setInfoPanelVisible(false), 320);
    return () => clearTimeout(t);
  }, [infoId]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── data loading ─────────────────────────────────────────── */

  const loadPresets = useCallback(async () => {
    const list = (await api()?.listPresets?.() ?? []) as SavedPreset[];
    setPresets(list);
  }, []);

  const loadRecentIds = useCallback(() => {
    try {
      const stored = localStorage.getItem('rb_recent_presets');
      if (stored) setRecentIds(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPresets();
      loadRecentIds();
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setInfoId(null);
      setConfirmLoadId(null);
      setConfirmDeleteId(null);
      setHoveredId(null);
    }
  }, [isOpen, loadPresets, loadRecentIds]);

  useEffect(() => {
    if (!isOpen) return;

    let isDisposed = false;
    let removeListener: (() => void) | undefined;

    const clearRefreshTimer = () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    const scheduleRefresh = () => {
      clearRefreshTimer();
      refreshTimerRef.current = window.setTimeout(async () => {
        if (isDisposed) return;
        await loadPresets();
      }, 180);
    };

    (async () => {
      await api()?.startPresetWatch?.();
      removeListener = api()?.onPresetDirectoryChanged?.(() => {
        scheduleRefresh();
      });
    })();

    return () => {
      isDisposed = true;
      clearRefreshTimer();
      removeListener?.();
      api()?.stopPresetWatch?.();
    };
  }, [isOpen, loadPresets]);


  const pushRecent = (id: string) => {
    const next = [id, ...recentIds.filter(r => r !== id)].slice(0, 5);
    setRecentIds(next);
    localStorage.setItem('rb_recent_presets', JSON.stringify(next));
  };

  /* ── handlers ─────────────────────────────────────────────── */

  const handleImport = async () => {
    const result = await api()?.importPreset?.();
    if (result && !result.canceled && result.success) {
      await loadPresets();
    }
  };

  const closeModalSequentially = (afterMainClose?: () => void) => {
    setInfoId(null);
    setConfirmLoadId(null);
    setConfirmDeleteId(null);

    window.setTimeout(() => {
      onToggle();
      if (afterMainClose) {
        window.setTimeout(afterMainClose, MAIN_CLOSE_MS);
      }
    }, SUBPANEL_CLOSE_MS);
  };

  const handleClose = () => {
    if (infoId || confirmLoadId || confirmDeleteId) {
      closeModalSequentially();
      return;
    }
    onToggle();
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      setName('');
      await loadPresets();
    } finally { setSaving(false); }
  };

  const handleLoadConfirmed = (preset: SavedPreset) => {
    pushRecent(preset.id);
    closeModalSequentially(() => onLoad(preset));
  };

  const handleDeleteConfirmed = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      if (infoId === id) setInfoId(null);
      if (confirmLoadId === id) setConfirmLoadId(null);
      setConfirmDeleteId(null);
      const next = recentIds.filter(r => r !== id);
      setRecentIds(next);
      localStorage.setItem('rb_recent_presets', JSON.stringify(next));
      await loadPresets();
    } finally { setDeletingId(null); }
  };

  const triggerSubPanel = (type: 'info' | 'load' | 'delete', id: string | null) => {
    const currInfo = infoId;
    const currLoad = confirmLoadId;
    const currDelete = confirmDeleteId;

    const isTogglingOff = (type === 'info' && currInfo === id) ||
      (type === 'load' && currLoad === id) ||
      (type === 'delete' && currDelete === id) ||
      id === null;

    if (isTogglingOff) {
      setInfoId(null);
      setConfirmLoadId(null);
      setConfirmDeleteId(null);
      return;
    }

    if (currInfo || currLoad || currDelete) {
      setInfoId(null);
      setConfirmLoadId(null);
      setConfirmDeleteId(null);

      const delay = currInfo ? 360 : 320;
      setTimeout(() => {
        if (type === 'info') setInfoId(id);
        else if (type === 'load') setConfirmLoadId(id);
        else if (type === 'delete') setConfirmDeleteId(id);
      }, delay);
      return;
    }

    if (type === 'info') setInfoId(id);
    else if (type === 'load') setConfirmLoadId(id);
    else if (type === 'delete') setConfirmDeleteId(id);
  };

  /* ── derived ──────────────────────────────────────────────── */

  const recentPresets = recentIds
    .map(id => presets.find(p => p.id === id))
    .filter((p): p is SavedPreset => !!p);

  const infoPreset = presets.find(p => p.id === infoId);
  const confirmLoadPreset = presets.find(p => p.id === confirmLoadId);
  const confirmDeletePreset = presets.find(p => p.id === confirmDeleteId);
  const hasSidePanel = infoPanelVisible || subPanelVisible;
  const maxModalWidth = Math.max(320, viewportWidth - 32);
  const minMainWidthWhenSplit = 360;
  const preferredSideWidth = Math.min(400, maxModalWidth * 0.36);
  const maxAllowedSideWidth = Math.max(0, maxModalWidth - minMainWidthWhenSplit);
  const sidePanelWidth = hasSidePanel ? Math.min(preferredSideWidth, maxAllowedSideWidth) : 0;
  const mainPanelWidth = hasSidePanel ? Math.max(320, maxModalWidth - sidePanelWidth) : Math.min(920, maxModalWidth);
  /* ── render ───────────────────────────────────────────────── */

  return (
    <>
      {/* Trigger button */}
      <button
        className={`nav-action-btn${isOpen ? ' nav-action-btn--active' : ''}`}
        onClick={() => { if (!isOpen) onToggle(); }}
        title="Presets"
        style={{ position: 'relative' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="wizard-overlay" style={{ zIndex: 99999, alignItems: 'center' }}>
            {/* outer row: main+confirm column | info column */}
            <motion.div
              animate={{ x: hasSidePanel ? -(sidePanelWidth / 2) : 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Top: Main Panel + Info Panel (Strictly matched heights) */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
                {/* ═══ MAIN PANEL ═══ */}
                <motion.div
                  key="pm-main"
                  initial={{ opacity: 0, scale: 0.94, y: 18 }}
                  animate={{
                    opacity: 1, scale: 1, y: 0,
                    borderTopRightRadius: (infoPanelVisible || subPanelVisible) ? 0 : 18,
                    borderBottomRightRadius: (subPanelVisible || infoPanelVisible) ? 0 : 18,
                    borderBottomLeftRadius: 18,
                  }}
                  exit={{ opacity: 0, scale: 0.94, y: 18 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
                  style={{
                    width: mainPanelWidth, flexShrink: 0,
                    background: 'rgba(9, 12, 20, 0.78)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    maxHeight: '88vh',
                    zIndex: 2,
                    boxShadow: '0 40px 90px -20px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.03)',
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {/* Integrated Header Bar (No Divider) */}
                  <div style={{
                    height: 28, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                    background: 'rgba(0, 0, 0, 0.15)',
                  }}>
                    <span style={{
                      fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                      fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: 'rgba(241, 245, 249, 0.35)',
                    }}>
                      Presets Intelligence
                    </span>
                    <button
                      onClick={handleClose}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', borderRadius: 6,
                        color: 'rgba(255,255,255,0.25)', fontSize: 16, cursor: 'pointer', padding: 0,
                        width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {/* Section 1 — Create */}
                    <section>
                      <SectionLabel>Create Preset</SectionLabel>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          ref={inputRef} type="text" value={name}
                          onChange={e => setName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSave()}
                          placeholder="Preset name…"
                          style={{
                            flex: 1, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 10, padding: '9px 14px', color: '#f1f5f9', fontSize: '0.82rem',
                            fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
                            outline: 'none', transition: 'border-color .2s, box-shadow .2s',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        <PremiumUnderlineButton
                          onClick={handleSave}
                          disabled={saving || !name.trim()}
                          primary
                          active={saving}
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </PremiumUnderlineButton>
                      </div>
                    </section>

                    {/* Horizontal Divider */}
                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '0 -20px' }} />

                    {/* Two-Column Grid for Recent and Browser */}
                    <div style={{ display: 'grid', gridTemplateColumns: mainPanelWidth < 760 ? '1fr' : '1fr 1fr', gap: mainPanelWidth < 760 ? 20 : 32 }}>
                      {/* Section 2 — Recent */}
                      <section>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 26, marginBottom: 14 }}>
                          <SectionLabel style={{ marginBottom: 0 }}>Recent Intelligence</SectionLabel>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                          <AnimatePresence mode="popLayout" initial={false}>
                            {recentPresets.length === 0 && (
                              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.72rem', fontFamily: "var(--font-body, 'Satoshi', sans-serif)" }}>
                                Double-click a preset in the browser
                              </motion.div>
                            )}
                            {recentPresets.map((preset, i) => {
                              const isHov = hoveredId === preset.id;
                              const isActive = infoId === preset.id || confirmLoadId === preset.id || confirmDeleteId === preset.id;
                              const isDel = deletingId === preset.id;
                              return (
                                <motion.div
                                  key={preset.id}
                                  layout
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, x: -8 }}
                                  transition={{ delay: i * 0.03, duration: 0.22 }}
                                  onMouseEnter={() => setHoveredId(preset.id)}
                                  onMouseLeave={() => setHoveredId(null)}
                                  style={{
                                    padding: '10px 12px', borderRadius: 10,
                                    background: isActive ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)'}`,
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    cursor: 'default', transition: 'background .18s, border-color .18s',
                                  }}
                                >
                                  {/* preset name */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)',
                                      fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                      {preset.name}
                                    </div>
                                    <div style={{
                                      fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', marginTop: 2,
                                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    }}>
                                      {formatDate(preset.savedAt)}
                                    </div>
                                  </div>

                                  {/* hover action buttons */}
                                  <motion.div
                                    initial={false}
                                    animate={{ opacity: isHov ? 1 : 0, x: isHov ? 0 : 8, pointerEvents: isHov ? 'auto' as const : 'none' as const }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: 'flex', gap: 4, flexShrink: 0 }}
                                  >
                                    <MiniBtn
                                      title="Info"
                                      active={infoId === preset.id}
                                      onClick={() => triggerSubPanel('info', infoId === preset.id ? null : preset.id)}
                                    >
                                      <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1 }}>!</span>
                                    </MiniBtn>

                                    <MiniBtn
                                      title="Delete"
                                      active={confirmDeleteId === preset.id}
                                      onClick={() => triggerSubPanel('delete', confirmDeleteId === preset.id ? null : preset.id)}
                                      danger
                                    >
                                      {isDel
                                        ? <span style={{ fontSize: 10 }}>…</span>
                                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                      }
                                    </MiniBtn>

                                    <MiniBtn
                                      title="Load"
                                      accent
                                      active={confirmLoadId === preset.id}
                                      onClick={() => triggerSubPanel('load', confirmLoadId === preset.id ? null : preset.id)}
                                    >
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    </MiniBtn>
                                  </motion.div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </section>

                      {/* Section 3 — Browser */}
                      <section>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 26, marginBottom: 14 }}>
                          <SectionLabel style={{ marginBottom: 0 }}>Global Browser · {presets.length}</SectionLabel>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <PremiumUnderlineButton onClick={handleImport} title="Open presets folder" primary>
                              Import
                            </PremiumUnderlineButton>
                          </div>
                        </div>

                        {/* Scrollable preset list */}
                        {presets.length === 0 ? (
                          <div style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: '0.72rem', fontFamily: "var(--font-body, 'Satoshi', sans-serif)" }}>
                            No presets
                          </div>
                        ) : (
                          <div style={{
                            maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4,
                            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
                            paddingRight: 4,
                          }}>
                            {presets.map(preset => {
                              const isPinned = pinnedId === preset.id;
                              return (
                                <div
                                  key={preset.id}
                                  onDoubleClick={() => {
                                    pushRecent(preset.id);
                                    setPinnedId(preset.id);
                                    setTimeout(() => setPinnedId(null), 900);
                                  }}
                                  title="Double-click to pin to Recent"
                                  style={{
                                    padding: '10px 12px', borderRadius: 10,
                                    background: isPinned ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isPinned ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)'}`,
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    cursor: 'default', userSelect: 'none',
                                    transition: 'background .18s, border-color .18s',
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: '0.82rem', fontWeight: 600,
                                      color: isPinned ? '#a5b4fc' : 'rgba(255,255,255,0.88)',
                                      fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                      transition: 'color .15s',
                                    }}>
                                      {preset.name}
                                    </div>
                                    <div style={{
                                      fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', marginTop: 2,
                                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    }}>
                                      {formatDate(preset.savedAt)}
                                    </div>
                                  </div>
                                  {isPinned && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence initial={false}>
                  {(infoId || confirmLoadId || confirmDeleteId) && (
                    <motion.div
                      key="pm-side-panel"
                      initial={{ width: sidePanelWidth, opacity: 0, x: 22 }}
                      animate={{ width: sidePanelWidth, opacity: 1, x: 0 }}
                      exit={{ width: sidePanelWidth, opacity: 0, x: 16 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        position: 'absolute', top: 0, bottom: 0, left: mainPanelWidth,
                        width: sidePanelWidth, flexShrink: 0, overflow: 'hidden',
                        background: 'rgba(9, 12, 20, 0.78)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        borderRight: '1px solid rgba(255,255,255,0.08)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '0 18px 18px 0',
                        boxShadow: '0 40px 90px -20px rgba(0,0,0,0.7)',
                      }}
                    >
                      <div style={{ width: sidePanelWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {infoId && infoPreset && <InfoPanelContent preset={infoPreset} onClose={() => setInfoId(null)} />}

                        {confirmLoadId && confirmLoadPreset && (
                          <div style={{ padding: '24px 20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                              <span style={{ fontFamily: "var(--font-display, 'Clash Display', sans-serif)", fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(165, 180, 252, 0.45)' }}>Load Confirmation</span>
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>Switch to this preset?</div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.45, marginBottom: 20 }}>
                              Current configuration will be replaced with <strong style={{ color: '#818cf8' }}>{confirmLoadPreset.name}</strong>.
                            </div>
                            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                              <PremiumUnderlineButton onClick={() => setConfirmLoadId(null)}>Cancel</PremiumUnderlineButton>
                              <PremiumUnderlineButton onClick={() => handleLoadConfirmed(confirmLoadPreset)} active primary>Yes, Load</PremiumUnderlineButton>
                            </div>
                          </div>
                        )}

                        {confirmDeleteId && confirmDeletePreset && (
                          <div style={{ padding: '24px 20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                              <span style={{ fontFamily: "var(--font-display, 'Clash Display', sans-serif)", fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(248, 113, 113, 0.45)' }}>Delete Safety</span>
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>Remove this preset?</div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.45, marginBottom: 20 }}>
                              Preset <strong style={{ color: '#fca5a5' }}>{confirmDeletePreset.name}</strong> will be permanently deleted.
                            </div>
                            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                              <PremiumUnderlineButton onClick={() => setConfirmDeleteId(null)}>Keep it</PremiumUnderlineButton>
                              <PremiumUnderlineButton onClick={() => handleDeleteConfirmed(confirmDeletePreset.id)} disabled={!!deletingId} active danger>
                                {deletingId ? 'Deleting...' : 'Yes, Delete'}
                              </PremiumUnderlineButton>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


            </motion.div>{/* end outer row */}
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

/* ── PREMIUM UNDERLINE BUTTON ──────────────────────────────────────── */

function PremiumUnderlineButton({
  children,
  onClick,
  disabled,
  active,
  primary,
  danger,
  title
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
  danger?: boolean;
  title?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        padding: '8px 4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
        fontSize: '0.78rem',
        fontWeight: 600,
        color: disabled
          ? 'rgba(255,255,255,0.15)'
          : (isHovered || active) ? '#fff' : 'rgba(241,245,249,0.45)',
        position: 'relative',
        transition: 'color 0.25s ease',
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ position: 'relative' }}>
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

/* ── tiny sub-components ───────────────────────────────────────────────── */

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
      fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: 'rgba(241, 245, 249, 0.42)', marginBottom: 8,
      ...style
    }}>
      {children}
    </div>
  );
}

function MiniBtn({ children, title, onClick, active, danger, accent }: {
  children: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void;
  active?: boolean; danger?: boolean; accent?: boolean;
}) {
  const base: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all .15s ease', padding: 0,
    background: active
      ? (accent ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.15)')
      : danger ? 'rgba(239,68,68,0.08)' : accent ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
    color: active
      ? (accent ? '#34d399' : '#a5b4fc')
      : danger ? 'rgba(239,68,68,0.6)' : accent ? '#10b981' : 'rgba(255,255,255,0.4)',
  };
  return <button title={title} onClick={onClick} style={base}>{children}</button>;
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

/* ── Info Panel Content (extracted for readability) ──────────────────── */

function InfoPanelContent({ preset, onClose }: { preset: SavedPreset; onClose: () => void }) {
  const [promptExpanded, setPromptExpanded] = useState(false);

  // Parse component names from IDs like "Category/Name" -> "Name"
  const componentNames = preset.selectedComponentIds.map(id => {
    const parts = id.split('/');
    return parts[parts.length - 1];
  });

  // Group by category
  const componentsByCategory: Record<string, string[]> = {};
  preset.selectedComponentIds.forEach(id => {
    const parts = id.split('/');
    const category = parts.length > 1 ? parts[0] : 'Other';
    const name = parts[parts.length - 1];
    if (!componentsByCategory[category]) componentsByCategory[category] = [];
    componentsByCategory[category].push(name);
  });

  const badges = getPresetBadges(preset);
  const promptPreview = preset.projectPrompt?.slice(0, 80) || '';
  const hasLongPrompt = (preset.projectPrompt?.length ?? 0) > 80;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar — matches main panel "Presets Intelligence" style */}
      <div style={{
        height: 28, padding: '0 16px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        background: 'rgba(0, 0, 0, 0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
          fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: 'rgba(241, 245, 249, 0.35)',
        }}>
          Preset Details
        </span>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', borderRadius: 6,
            color: 'rgba(255,255,255,0.25)', fontSize: 16, cursor: 'pointer', padding: 0,
            width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Project Name */}
        {preset.projectName && (
          <InfoBlock label="Project Tracking">
            <span style={{ fontSize: '0.88rem', color: '#f1f5f9', fontWeight: 600, fontFamily: "var(--font-body, 'Satoshi', sans-serif)" }}>
              {preset.projectName || 'Untitled Project'}
            </span>
          </InfoBlock>
        )}

        {/* Prompt */}
        {preset.projectPrompt && (
          <InfoBlock label="Logical Prompt">
            <div style={{
              fontSize: '0.68rem', lineHeight: 1.5, color: 'rgba(165,180,252,0.7)',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.1)',
              borderRadius: 8, padding: '10px 12px',
              maxHeight: promptExpanded ? 300 : 52, overflowY: promptExpanded ? 'auto' : 'hidden',
              transition: 'max-height .3s ease',
              position: 'relative',
            }}>
              {promptExpanded ? preset.projectPrompt : promptPreview + (hasLongPrompt ? '…' : '')}
            </div>
            {hasLongPrompt && (
              <button
                onClick={() => setPromptExpanded(!promptExpanded)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0',
                  fontSize: '0.56rem', fontWeight: 700, color: '#818cf8', letterSpacing: '0.03em',
                  textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: promptExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {promptExpanded ? 'Collapse Full View' : 'View Full Prompt'}
              </button>
            )}
          </InfoBlock>
        )}

        {/* Components — listed by category */}
        <InfoBlock label={`Component Inventory · ${componentNames.length}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(componentsByCategory).map(([cat, names]) => (
              <div key={cat}>
                <div style={{
                  fontSize: '0.54rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                  letterSpacing: '0.04em', marginBottom: 6,
                }}>
                  {cat}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {names.map(n => (
                    <span key={n} style={{
                      fontSize: '0.64rem', fontWeight: 600, padding: '4px 10px',
                      borderRadius: 6, color: 'rgba(241,245,249,0.7)',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {componentNames.length === 0 && (
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No components registered</span>
            )}
          </div>
        </InfoBlock>

        {/* Badges / Payload */}
        {badges.length > 0 && (
          <InfoBlock label="Payload Signature">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {badges.map((b, i) => (
                <span key={i} style={{
                  fontSize: '0.58rem', fontWeight: 700, padding: '4px 9px',
                  borderRadius: 6, color: b.color,
                  background: `${b.color}18`, border: `1px solid ${b.color}35`,
                }}>
                  {b.label}
                </span>
              ))}
            </div>
          </InfoBlock>
        )}

        {/* Design Rules Summary */}
        {preset.designRules && (
          <InfoBlock label="Design Tokens">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {preset.designRules.fonts?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.54rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700, width: 42, flexShrink: 0, textTransform: 'uppercase' }}>Fonts</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {preset.designRules.fonts.map((f: any, i: number) => (
                      <span key={i} style={{ fontSize: '0.62rem', color: '#a78bfa', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{f.value}{i < preset.designRules.fonts.length - 1 ? ',' : ''}</span>
                    ))}
                  </div>
                </div>
              )}
              {preset.designRules.colors?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.54rem', color: 'rgba(255,255,255,0.2)', fontWeight: 700, width: 42, flexShrink: 0, textTransform: 'uppercase' }}>Colors</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {preset.designRules.colors.slice(0, 8).map((c: any, i: number) => (
                      <div key={i} style={{
                        width: 16, height: 16, borderRadius: 4, background: c.value,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }} title={c.value} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InfoBlock>
        )}

        {/* Footer Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.15)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              SCHEMA_v{preset.schemaVersion ?? 1}
            </span>
            {preset.packageManager && (
              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.15)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                PKM_{preset.packageManager.toUpperCase()}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
            REGISTERED: {formatDate(preset.savedAt)}
          </span>
        </div>

      </div>
    </div>
  );
}

