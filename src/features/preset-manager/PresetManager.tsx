import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../shared/types/api";
import type { DesignRules, StyleDirection, ClientBrief } from '../project-builder/ProjectBuilderPanel';
import type { LayoutConfig } from '../../shared/types/index';

// ── Schema version ──────────────────────────────────────────────────────────────
// v1: original  (projectPrompt, selectedComponentIds, designRules, layoutConcept, projectName, packageManager)
// v2: adds      styleDirection, clientBrief
// v3: adds      layoutConfig (replaces layoutConcept)
export const PRESET_SCHEMA_VERSION = 3;

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: string;
  schemaVersion: number;
  projectPrompt: string;
  selectedComponentIds: string[];
  designRules: DesignRules;
  layoutConfig?: LayoutConfig;
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
  if (preset.layoutConfig?.length) badges.push({ label: `${preset.layoutConfig.length} Zones`, color: '#fb923c' });
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
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── data loading ─────────────────────────────────────────── */

  const loadPresets = async () => {
    const list = (await api()?.listPresets?.() ?? []) as SavedPreset[];
    setPresets(list);
    try {
      const stored = localStorage.getItem('rb_recent_presets');
      if (stored) setRecentIds(JSON.parse(stored));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isOpen) {
      loadPresets();
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setInfoId(null);
      setConfirmLoadId(null);
      setConfirmDeleteId(null);
      setHoveredId(null);
    }
  }, [isOpen]);

  const pushRecent = (id: string) => {
    const next = [id, ...recentIds.filter(r => r !== id)].slice(0, 5);
    setRecentIds(next);
    localStorage.setItem('rb_recent_presets', JSON.stringify(next));
  };

  /* ── handlers ─────────────────────────────────────────────── */

  const handleImport = async () => {
    const result = await api()?.importPreset?.();
    if (result?.canceled) return;
    if (result?.success) {
      setImportStatus('ok');
      await loadPresets();
    } else {
      setImportStatus('err');
    }
    setTimeout(() => setImportStatus('idle'), 1800);
  };

  const handleClose = () => {
    if (infoId || confirmLoadId || confirmDeleteId) {
      setInfoId(null);
      setConfirmLoadId(null);
      setConfirmDeleteId(null);
      // We don't close the whole thing immediately if a subpanel is open
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
    onLoad(preset);
    setConfirmLoadId(null);
    onToggle();
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

  /* ── derived ──────────────────────────────────────────────── */

  const recentPresets = recentIds
    .map(id => presets.find(p => p.id === id))
    .filter((p): p is SavedPreset => !!p);
  const displayed = recentPresets.length > 0 ? recentPresets : presets.slice(0, 5);

  const infoPreset = presets.find(p => p.id === infoId);
  const confirmLoadPreset = presets.find(p => p.id === confirmLoadId);
  const confirmDeletePreset = presets.find(p => p.id === confirmDeleteId);
  const hasSubPanel = !!(infoId || confirmLoadId || confirmDeleteId);

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
        <AnimatePresence>
          {presets.length > 0 && !isOpen && (
            <motion.span key="badge" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              style={{ position: 'absolute', top: -2, right: -2, background: '#6366f1', color: '#fff', borderRadius: 9999, fontSize: 9, fontWeight: 800, lineHeight: 1, padding: '2px 5px', border: '2.5px solid #0f172a', pointerEvents: 'none' }}>
              {presets.length}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="wizard-overlay" style={{ zIndex: 99999 }}>
            {/* wrapper stack */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }} onClick={e => e.stopPropagation()}>

              {/* ═══ MAIN PANEL ═══ */}
              <motion.div
                key="pm-main"
                initial={{ opacity: 0, scale: 0.94, y: 18 }}
                animate={{
                  opacity: 1, scale: 1, y: 0,
                  borderBottomLeftRadius: hasSubPanel ? 0 : 18,
                  borderBottomRightRadius: hasSubPanel ? 0 : 18,
                }}
                exit={{ opacity: 0, scale: 0.94, y: 18 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
                style={{
                  width: 400, flexShrink: 0,
                  background: 'rgba(9, 12, 20, 0.78)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 18,
                  overflow: 'hidden',
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
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

                  {/* Section 1 — Create */}
                  <section>
                    <SectionLabel>Create Preset</SectionLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
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

                  {/* Divider */}
                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '0 -20px' }} />

                  {/* Section 2 — Recent */}
                  <section>
                    <SectionLabel>Recent</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {displayed.length === 0 && (
                          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ padding: '28px 0', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.78rem', fontFamily: "var(--font-body, 'Satoshi', sans-serif)" }}>
                            No presets saved yet
                          </motion.div>
                        )}
                        {displayed.map((preset, i) => {
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
                                {/* Info */}
                                <MiniBtn
                                  title="Info"
                                  active={infoId === preset.id}
                                  onClick={() => { setConfirmLoadId(null); setConfirmDeleteId(null); setInfoId(infoId === preset.id ? null : preset.id); }}
                                >
                                  <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1 }}>!</span>
                                </MiniBtn>

                                {/* Delete */}
                                <MiniBtn
                                  title="Delete"
                                  active={confirmDeleteId === preset.id}
                                  onClick={() => { setInfoId(null); setConfirmLoadId(null); setConfirmDeleteId(confirmDeleteId === preset.id ? null : preset.id); }}
                                  danger
                                >
                                  {isDel
                                    ? <span style={{ fontSize: 10 }}>…</span>
                                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                  }
                                </MiniBtn>

                                {/* Load */}
                                <MiniBtn
                                  title="Load"
                                  accent
                                  active={confirmLoadId === preset.id}
                                  onClick={() => { setInfoId(null); setConfirmDeleteId(null); setConfirmLoadId(confirmLoadId === preset.id ? null : preset.id); }}
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

                  {/* Divider */}
                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '0 -20px' }} />

                  {/* Section 3 — Browser */}
                  <section>
                    <SectionLabel>Browser</SectionLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Import Preset */}
                      <button
                        onClick={handleImport}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 10,
                          background: importStatus === 'ok' ? 'rgba(74,222,128,0.06)' : importStatus === 'err' ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.02)',
                          border: `1px dashed ${importStatus === 'ok' ? 'rgba(74,222,128,0.3)' : importStatus === 'err' ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          color: importStatus === 'ok' ? '#4ade80' : importStatus === 'err' ? '#f87171' : 'rgba(255,255,255,0.35)',
                          fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
                          transition: 'background .18s, color .18s, border-color .18s',
                        }}
                        onMouseEnter={e => { if (importStatus === 'idle') { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; } }}
                        onMouseLeave={e => { if (importStatus === 'idle') { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
                      >
                        {importStatus === 'ok' ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : importStatus === 'err' ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        )}
                        {importStatus === 'ok' ? 'Imported!' : importStatus === 'err' ? 'Invalid File' : 'Import Preset'}
                      </button>
                      {/* Open Presets Folder */}
                      <button
                        onClick={() => api()?.openPresetsFolder?.()}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
                          transition: 'background .18s, color .18s, border-color .18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        Open Folder
                      </button>
                    </div>
                  </section>
                </div>
              </motion.div>

              {/* ═══ SUB-PANELS (Stacking below) ═══ */}
              <AnimatePresence initial={false}>
                {(infoId || confirmLoadId || confirmDeleteId) && (
                  <motion.div
                    key="pm-sub"
                    initial={{ opacity: 0, height: 0, y: -20, scale: 0.98 }}
                    animate={{ opacity: 1, height: 'auto', y: -1, scale: 1 }}
                    exit={{ opacity: 0, height: 0, y: -20, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    style={{
                      width: 400, flexShrink: 0, overflow: 'hidden',
                      background: 'rgba(9, 12, 20, 0.88)',
                      backdropFilter: 'blur(50px) saturate(200%)',
                      borderLeft: '1px solid rgba(255,255,255,0.08)',
                      borderRight: '1px solid rgba(255,255,255,0.08)',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      borderTop: '1px solid rgba(255,255,255,0.03)',
                      borderRadius: '0 0 18px 18px',
                      boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                      zIndex: 1,
                    }}
                  >
                    {/* INFO SUB-PANEL */}
                    {infoId && infoPreset && (
                      <InfoPanelContent
                        preset={infoPreset}
                        onClose={() => setInfoId(null)}
                      />
                    )}

                    {/* CONFIRM LOAD SUB-PANEL */}
                    {confirmLoadId && confirmLoadPreset && (
                      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                          <span style={{
                            fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                            fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(165, 180, 252, 0.45)',
                          }}>Load Confirmation</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>Switch to this preset?</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.45, marginBottom: 20 }}>
                          Current active configuration will be replaced with <strong style={{ color: '#818cf8' }}>{confirmLoadPreset.name}</strong>.
                        </div>
                        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                          <PremiumUnderlineButton onClick={() => setConfirmLoadId(null)}>Cancel</PremiumUnderlineButton>
                          <PremiumUnderlineButton onClick={() => handleLoadConfirmed(confirmLoadPreset)} active primary>Yes, Load</PremiumUnderlineButton>
                        </div>
                      </div>
                    )}

                    {/* CONFIRM DELETE SUB-PANEL */}
                    {confirmDeleteId && confirmDeletePreset && (
                      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                          <span style={{
                            fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                            fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(248, 113, 113, 0.45)',
                          }}>Delete Safety</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>Remove this preset?</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.45, marginBottom: 20 }}>
                          Preset <strong style={{ color: '#fca5a5' }}>{confirmDeletePreset.name}</strong> will be permanently deleted from disk.
                        </div>
                        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                          <PremiumUnderlineButton onClick={() => setConfirmDeleteId(null)}>Keep it</PremiumUnderlineButton>
                          <PremiumUnderlineButton
                            onClick={() => handleDeleteConfirmed(confirmDeletePreset.id)}
                            disabled={!!deletingId}
                            active
                            danger
                          >
                            {deletingId ? 'Deleting...' : 'Yes, Delete'}
                          </PremiumUnderlineButton>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
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
  danger
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
      fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: 'rgba(241, 245, 249, 0.42)', marginBottom: 8,
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
    <div style={{ width: '100%', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 600, overflowY: 'auto' }}>
      {/* sub-panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16 }}>
        <span style={{
          fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
          fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: 'rgba(165, 180, 252, 0.45)',
        }}>
          Detailed Information
        </span>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', right: -2, top: '50%', transform: 'translateY(-50%)',
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
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

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
  );
}

