import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VisionReworkModal.css';
import type { VisionReworkReadyData } from '../../shared/types/api';

interface VisionReworkModalProps {
  open: boolean;
  onClose: () => void;
  reworkData: VisionReworkReadyData | null;
  projectName: string;
  originalPreset: object | null;
  onConfirm: (payload: {
    projectPath: string;
    projectName: string;
    originalPreset: object;
    referenceImagePath: string;
    screenshotPath: string | null;
    weaknessesMd: string;
    backupFirst: boolean;
    taskId: string;
  }) => void;
}

export default function VisionReworkModal({
  open, onClose, reworkData, projectName, originalPreset, onConfirm
}: VisionReworkModalProps) {

  const [referenceImage, setReferenceImage] = useState<{ path: string; base64: string } | null>(null);
  const [weaknessMd, setWeaknessMd]         = useState<{ path: string; content: string; preview: string } | null>(null);
  const [backupFirst, setBackupFirst]       = useState(true);
  const [recapturing, setRecapturing]       = useState(false);
  const [captureStatus, setCaptureStatus]   = useState<{ type: 'idle' | 'capturing' | 'success' | 'error'; msg?: string }>({ type: 'idle' });
  const [screenshotPath, setScreenshotPath] = useState<string | null>(reworkData?.screenshotPath ?? null);
  const [screenshotB64, setScreenshotB64]   = useState<string | null>(null);

  // Sync screenshotPath when reworkData changes (e.g. modal re-opened for a different task)
  React.useEffect(() => {
    if (reworkData) {
      setScreenshotPath(reworkData.screenshotPath);
      setCaptureStatus(
        reworkData.screenshotPath
          ? { type: 'success', msg: 'Auto-captured' }
          : reworkData.screenshotError
          ? { type: 'error', msg: reworkData.screenshotError }
          : { type: 'idle' }
      );
      setScreenshotB64(null);
    }
  }, [reworkData]);

  // Reset uploads when modal is opened fresh
  React.useEffect(() => {
    if (!open) {
      setReferenceImage(null);
      setWeaknessMd(null);
    }
  }, [open]);

  const handlePickReference = useCallback(async () => {
    const result = await window.reactBitsApi.pickSingleFile([
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
    ]);
    if (!result || result.canceled) return;
    if (result.base64 && result.path) {
      setReferenceImage({ path: result.path, base64: result.base64 });
    }
  }, []);

  const handlePickMd = useCallback(async () => {
    const result = await window.reactBitsApi.pickSingleFile([
      { name: 'Markdown', extensions: ['md', 'txt'] },
    ]);
    if (!result || result.canceled) return;
    if (result.content && result.path) {
      const preview = result.content.split('\n').slice(0, 4).join(' · ').slice(0, 120);
      setWeaknessMd({ path: result.path, content: result.content, preview });
    }
  }, []);

  const handleRecapture = useCallback(async () => {
    if (!reworkData?.projectPath) return;
    setRecapturing(true);
    setCaptureStatus({ type: 'capturing', msg: 'Building + screenshot…' });
    setScreenshotB64(null);
    const result = await window.reactBitsApi.captureProjectScreenshot(reworkData.projectPath);
    setRecapturing(false);
    if (result.success && result.screenshotPath) {
      setScreenshotPath(result.screenshotPath);
      setCaptureStatus({ type: 'success', msg: 'Re-captured successfully' });
    } else {
      setCaptureStatus({ type: 'error', msg: result.error || 'Capture failed' });
    }
  }, [reworkData]);

  const handleCopyPresetPath = useCallback(() => {
    if (!reworkData?.projectPath) return;
    // The preset is embedded in the originalPreset object — offer copying the projectPath for reference
    const text = reworkData.projectPath;
    navigator.clipboard.writeText(text).catch(() => {});
  }, [reworkData]);

  const canSubmit = !!referenceImage && !!weaknessMd && !!reworkData;

  const handleConfirm = useCallback(() => {
    if (!canSubmit || !reworkData || !referenceImage || !weaknessMd || !originalPreset) return;
    onConfirm({
      projectPath:        reworkData.projectPath,
      projectName,
      originalPreset,
      referenceImagePath: referenceImage.path,
      screenshotPath:     screenshotPath,
      weaknessesMd:       weaknessMd.content,
      backupFirst,
      taskId: `rework-${Date.now()}`,
    });
  }, [canSubmit, reworkData, referenceImage, weaknessMd, originalPreset, projectName, screenshotPath, backupFirst, onConfirm]);

  if (!open) return null;

  const shotSrc = screenshotB64 || (screenshotPath ? `file://${screenshotPath}` : null);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="wizard-overlay" style={{ zIndex: 99999 }} onClick={e => e.stopPropagation()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
            style={{
              width: 480,
              background: 'rgba(9, 12, 20, 0.88)',
              backdropFilter: 'blur(60px) saturate(220%)',
              WebkitBackdropFilter: 'blur(60px) saturate(220%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div style={{
              height: 28, padding: '0 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              background: 'rgba(0,0,0,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span style={{
                  fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                  fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: 'rgba(241, 245, 249, 0.35)',
                }}>
                  Vision Rework
                </span>
              </div>
              <CloseButton onClick={onClose} />
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Project info */}
              <div>
                <SectionLabel>Target Project</SectionLabel>
                <div style={{
                  background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
                    {projectName || 'Unknown project'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {reworkData?.projectPath || '—'}
                  </div>
                </div>
              </div>

              {/* Auto-captured screenshot */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <SectionLabel>Generated Output Screenshot</SectionLabel>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <PillButton onClick={handleCopyPresetPath} title="Copy project path">
                      Copy Path
                    </PillButton>
                    <PillButton onClick={handleRecapture} disabled={recapturing}>
                      {recapturing ? 'Capturing…' : 'Re-capture'}
                    </PillButton>
                  </div>
                </div>

                {shotSrc ? (
                  <img src={shotSrc} alt="Generated project screenshot" className="vrm-screenshot-thumb" />
                ) : (
                  <div style={{
                    width: '100%', height: 110, borderRadius: 10,
                    background: 'rgba(0,0,0,0.25)', border: '1px dashed rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                  }}>
                    {captureStatus.type === 'capturing' ? (
                      <><div className="vrm-spinner" /><span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Capturing…</span></>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
                          {captureStatus.type === 'error' ? captureStatus.msg : 'No screenshot yet — click Re-capture'}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {captureStatus.type !== 'idle' && captureStatus.type !== 'capturing' && (
                  <div className={`vrm-capture-status ${captureStatus.type}`}>
                    {captureStatus.type === 'success' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {captureStatus.type === 'error' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                    <span>{captureStatus.msg}</span>
                  </div>
                )}

                <div style={{ marginTop: 8, fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
                  Upload this screenshot + the preset JSON to{' '}
                  <span style={{ color: 'rgba(165,180,252,0.6)', fontWeight: 600 }}>claude.ai/design</span>
                  {' '}to get the design reference &amp; weakness report.
                </div>
              </div>

              {/* Upload inputs */}
              <div>
                <SectionLabel>Upload from Claude Design</SectionLabel>
                <div className="vrm-upload-zone">

                  {/* Field 1: Reference image */}
                  <div className={`vrm-upload-row ${referenceImage ? 'filled' : ''}`}>
                    <div className={`vrm-upload-icon ${referenceImage ? 'has-image' : ''}`}>
                      {referenceImage ? (
                        <img src={referenceImage.base64} alt="reference" />
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                    <div className="vrm-upload-info">
                      <div className="vrm-upload-label">
                        Design Reference{!referenceImage && <span className="vrm-required-badge">required</span>}
                      </div>
                      {referenceImage ? (
                        <div className="vrm-upload-name">{referenceImage.path.split(/[\\/]/).pop()}</div>
                      ) : (
                        <div className="vrm-upload-preview">Redesign screenshot from claude.ai/design</div>
                      )}
                    </div>
                    <PillButton onClick={handlePickReference}>
                      {referenceImage ? 'Change' : 'Pick PNG'}
                    </PillButton>
                  </div>

                  {/* Field 2: Weakness MD */}
                  <div className={`vrm-upload-row ${weaknessMd ? 'filled' : ''}`}>
                    <div className="vrm-upload-icon">
                      {weaknessMd ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                        </svg>
                      )}
                    </div>
                    <div className="vrm-upload-info">
                      <div className="vrm-upload-label">
                        Weakness Report{!weaknessMd && <span className="vrm-required-badge">required</span>}
                      </div>
                      {weaknessMd ? (
                        <>
                          <div className="vrm-upload-name">{weaknessMd.path.split(/[\\/]/).pop()}</div>
                          <div className="vrm-upload-preview">{weaknessMd.preview}</div>
                        </>
                      ) : (
                        <div className="vrm-upload-preview">Weaknesses .md from claude.ai/design</div>
                      )}
                    </div>
                    <PillButton onClick={handlePickMd}>
                      {weaknessMd ? 'Change' : 'Pick MD'}
                    </PillButton>
                  </div>

                </div>
              </div>

              {/* Options */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12, cursor: 'pointer',
              }} onClick={() => setBackupFirst(v => !v)}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: backupFirst ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${backupFirst ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <AnimatePresence mode="wait">
                    {backupFirst && (
                      <motion.svg key="check"
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="#a5b4fc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"/>
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Backup src/ before rework</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>Copies src/ to src_backup/ so originals are safe</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: 12, paddingBottom: 4, justifyContent: 'flex-end' }}>
                <PremiumUnderlineButton onClick={onClose}>Dismiss</PremiumUnderlineButton>
                <PremiumUnderlineButton
                  onClick={handleConfirm}
                  disabled={!canSubmit}
                  active
                  primary
                >
                  Run Vision Rework
                </PremiumUnderlineButton>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Atom components ───────────────────────────────────────────────────────────

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

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', borderRadius: 6,
        color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0,
        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  );
}

function PillButton({ onClick, disabled, children, title }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '5px 11px', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.03em',
        color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
        transition: 'all 0.18s', flexShrink: 0,
        fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'; }}
    >
      {children}
    </button>
  );
}

function PremiumUnderlineButton({ children, onClick, disabled, active, primary }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean; primary?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none', border: 'none', padding: '8px 4px', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "var(--font-body, 'Satoshi', sans-serif)", fontSize: '0.8rem', fontWeight: 600,
        color: disabled ? 'rgba(255,255,255,0.15)' : (isHovered || active) ? '#fff' : 'rgba(241,245,249,0.45)',
        position: 'relative', transition: 'color 0.25s ease', display: 'flex', alignItems: 'center',
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
            background: primary ? '#6366f1' : 'rgba(255,255,255,0.8)',
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 2, borderRadius: 2, transformOrigin: 'left' }}
        />
      </span>
    </button>
  );
}
