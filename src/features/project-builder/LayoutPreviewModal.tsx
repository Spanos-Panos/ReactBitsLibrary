import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LayoutConfig } from '../../shared/types';
import './LayoutPreviewModal.css';

interface LayoutPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutConfig: LayoutConfig;
}

/* ── REUSABLE PREMIUM UI COMPONENTS (1:1 Style Match with PresetManager) ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
      fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
      color: 'rgba(241, 245, 249, 0.35)', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function PremiumUnderlineButton({
  children,
  onClick,
  disabled,
  active,
  primary,
  danger,
  small
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
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
        fontSize: small ? '0.72rem' : '0.78rem',
        fontWeight: 600,
        color: disabled 
          ? 'rgba(255,255,255,0.15)' 
          : (isHovered || active) ? '#fff' : 'rgba(241,245,249,0.45)',
        position: 'relative',
        transition: 'color 0.25s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
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

/* ── MAIN COMPONENT ──────────────────────────────────────────────────────── */

export default function LayoutPreviewModal({ isOpen, onClose, layoutConfig }: LayoutPreviewModalProps) {
  const getWidth = (hint: string) => {
    if (hint === 'half') return 'calc(50% - 4px)';
    if (hint === 'third') return 'calc(33.333% - 6px)';
    return '100%';
  };

  const getHeight = (hint: string) => {
    if (hint === 'fullscreen') return '100%'; 
    if (hint === 'large') return '70%'; 
    if (hint === 'medium') return '40%';
    if (hint === 'strip') return '15%';
    return '40%';
  };

  // Metrics extraction
  const totalLayers = layoutConfig.length;
  const fixedLayers = layoutConfig.filter(l => l.position === 'fixed' || l.zLayer === 'overlay').length;
  const bgLayers = layoutConfig.filter(l => l.zLayer === 'background').length;
  const segmentsCount = layoutConfig.filter(l => l.widthHint === 'half' || l.widthHint === 'third').length;
  const interactiveLayers = layoutConfig.filter(l => l.entranceAnimation && l.entranceAnimation !== 'none').length;
  const fullWidthCount = totalLayers - segmentsCount - bgLayers;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="wizard-overlay" style={{ zIndex: 100000 }}>
          <div 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
          >
            <motion.div
              layoutId="layout-intel-panel"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
              style={{
                width: 1060,
                height: 720,
                background: 'rgba(9, 12, 20, 0.85)',
                backdropFilter: 'blur(60px) saturate(220%)',
                WebkitBackdropFilter: 'blur(60px) saturate(220%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 22,
                overflow: 'hidden',
                zIndex: 2,
                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header Bar - Identical to PresetManager */}
              <div style={{
                height: 28, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                background: 'rgba(0, 0, 0, 0.15)',
              }}>
                <span style={{
                  fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                  fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: 'rgba(241, 245, 249, 0.35)',
                }}>
                  Layout Intelligence Generator
                </span>
                <button 
                  onClick={onClose} 
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', borderRadius: 6,
                    color: 'rgba(255,255,255,0.25)', fontSize: 16, cursor: 'pointer', padding: 0,
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .25s ease',
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

              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Area (Simulator) - Now on the left */}
                <div style={{ flex: 1, padding: '32px', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="pbp-blueprint-frame">
                    <div className="pbp-blueprint-chrome" style={{ justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "var(--font-display, 'Clash Display', sans-serif)" }}>Project Structure Simulation</div>
                    </div>
                    <div className="pbp-blueprint-viewport">
                      {layoutConfig.map((item, i) => {
                        const isBg = item.zLayer === 'background';
                        const isOverlay = item.zLayer === 'overlay' || item.position === 'fixed';
                        
                        let className = 'pbp-blueprint-box';
                        if (isBg) className += ' pbp-blueprint-box--bg';
                        else if (isOverlay) className += ' pbp-blueprint-box--overlay';
                        else className += ' pbp-blueprint-box--content';

                        const animState = item.entranceAnimation && item.entranceAnimation !== 'none' 
                          ? { animation: 'pulseIndicator 2.5s infinite ease-in-out' } : {};

                        return (
                          <div 
                            key={i}
                            className={className}
                            data-align={item.xAlign}
                            style={{
                              width: isBg || isOverlay ? '100%' : getWidth(item.widthHint || 'full'),
                              height: getHeight(item.heightHint),
                              ...animState
                            }}
                          >
                            <span style={{ 
                              color: isOverlay ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', 
                              fontSize: isOverlay ? '0.9rem' : '0.8rem',
                              fontWeight: isOverlay ? 800 : 600,
                              fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
                              letterSpacing: '-0.01em'
                            }}>
                              {item.componentName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar (Analytics) - Swapped to the right */}
                <div style={{ width: 340, background: 'rgba(0, 0, 0, 0.2)', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 26, overflowY: 'auto' }}>
                  
                  <InfoBlock label="Simulation Analytics">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <MetricsRow label="Total Layers" value={totalLayers} />
                      <MetricsRow label="Active Overlays" value={fixedLayers} />
                      <MetricsRow label="Motion Triggers" value={interactiveLayers} />
                    </div>
                  </InfoBlock>

                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '0 -24px' }} />

                  <InfoBlock label="Layout Composition">
                    <div style={{ display: 'flex', gap: 10 }}>
                      <GridPill label="Full Width" value={fullWidthCount} />
                      <GridPill label="Grid Splits" value={segmentsCount} />
                    </div>
                  </InfoBlock>

                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '0 -24px' }} />

                  <InfoBlock label="Architecture Stack">
                    <div className="pbp-hierarchy-list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {layoutConfig.map((l, i) => (
                        <div key={i} style={{ 
                          padding: '8px 12px', borderRadius: 8, 
                          background: 'rgba(255,255,255,0.015)', 
                          border: '1px solid rgba(255,255,255,0.03)',
                          display: 'flex', alignItems: 'center', gap: 10 
                        }}>
                          <div style={{ 
                            width: 22, height: 22, borderRadius: 6, fontSize: 8, fontWeight: 900,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'rgba(255,255,255,0.25)',
                          }}>
                            {l.zLayer === 'background' ? 'BG' : l.zLayer === 'overlay' ? 'FX' : 'ST'}
                          </div>
                          <span style={{ 
                            fontSize: '0.78rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', 
                            fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {l.componentName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </InfoBlock>

                  <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', gap: 12 }}>
                    <PremiumUnderlineButton onClick={onClose} primary active>
                      Validate Architecture
                    </PremiumUnderlineButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── SMALL ATOMS ────────────────────────────────────────────────────── */

function MetricsRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,0,0,0.12)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.35)', fontFamily: "var(--font-body, 'Satoshi', sans-serif)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: '#f1f5f9', fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>{value}</span>
    </div>
  );
}

function GridPill({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{value}</div>
      <div style={{ fontSize: '0.54rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}
