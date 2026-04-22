import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageConfig } from '../../shared/types/index';

interface StructureWizardProps {
  open: boolean;
  onClose: () => void;
  pages: PageConfig[];
  navbarName: string;
  projectName: string;
  onProjectNameChange: (v: string) => void;
  outputPath: string;
  onBrowse: () => void;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  onPackageManagerChange: (v: 'npm' | 'pnpm' | 'yarn') => void;
  openWhenDone: boolean;
  onOpenWhenDoneChange: (v: boolean) => void;
  onConfirm: () => void;
  allComponentNames: Record<string, string>; // id → name
}

const PM_LIST: Array<'npm' | 'pnpm' | 'yarn'> = ['npm', 'pnpm', 'yarn'];

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '12px 16px', color: '#f1f5f9', fontSize: '0.85rem',
  fontFamily: "var(--font-body, 'Satoshi', sans-serif)", outline: 'none', boxSizing: 'border-box',
};

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

function AutomationRow({ icon, title, subtext, checked, onChange, child }: {
  icon: React.ReactNode; title: string; subtext: string; checked: boolean; onChange: (v: boolean) => void; child?: boolean;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer',
        transition: 'background .2s',
        background: child ? 'rgba(99,102,241,0.02)' : 'transparent',
        paddingLeft: child ? 36 : 20,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = child ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = child ? 'rgba(99,102,241,0.02)' : 'transparent'; }}
    >
      <div style={{
        width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: checked ? '#a5b4fc' : 'rgba(255,255,255,0.2)', transition: 'color .2s'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: checked ? '#f8fafc' : 'rgba(255,255,255,0.3)', transition: 'color .2s' }}>{title}</div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', marginTop: 1 }}>{subtext}</div>
      </div>

      <div style={{
        width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        color: checked ? '#6366f1' : 'rgba(255,255,255,0.1)', transition: 'all .22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <AnimatePresence mode="wait">
          {!checked ? (
            <motion.svg key="plus" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </motion.svg>
          ) : (
            <motion.svg key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PremiumUnderlineButton({
  children,
  onClick,
  disabled,
  active,
  primary,
  small,
  fullWidth
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
  small?: boolean;
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
            background: primary ? '#6366f1' : 'rgba(255,255,255,0.8)'
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

// Route helper (mirrors structure-generator.cjs)
function pageRoute(type: string, title: string) {
  if (type === 'home') return '/';
  if (type === 'about') return '/about';
  if (type === 'services') return '/services';
  if (type === 'contact') return '/contact';
  return '/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function StrategyRow({
  icon, title, subtext, active, onClick, disabled
}: {
  icon: React.ReactNode; title: string; subtext: string; active: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .2s',
        background: 'transparent',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.15)', transition: 'color .2s'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: active ? '#f8fafc' : 'rgba(255,255,255,0.3)', transition: 'color .2s' }}>{title}</div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', marginTop: 1 }}>{subtext}</div>
      </div>

      <div style={{
        width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        color: active ? '#6366f1' : 'rgba(255,255,255,0.06)', transition: 'all .22s ease',
      }}>
        <AnimatePresence mode="wait">
          {active ? (
            <motion.svg key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          ) : (
            <motion.div key="plus" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
               {!disabled && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
               {disabled && <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.15)' }}>SOON</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function StructureWizard({
  open, onClose, pages, navbarName, projectName, onProjectNameChange,
  outputPath, onBrowse, packageManager, onPackageManagerChange, onConfirm,
  allComponentNames, openWhenDone, onOpenWhenDoneChange
}: StructureWizardProps) {
  const [isStrategiesExpanded, setIsStrategiesExpanded] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<'scaffold' | 'ai' | 'hybrid'>('scaffold');



  const handleConfirm = () => {
    setIsStrategiesExpanded(false);
    setTimeout(() => {
      onConfirm();
    }, 150);
  };

  const handleClose = () => {
    setIsStrategiesExpanded(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="structure-wizard-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="wizard-overlay"
          style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div 
            layout 
            style={{ display: 'flex', alignItems: 'flex-start', padding: '40px 0' }} 
            onClick={e => e.stopPropagation()}
          >
            
            {/* Main Modal */}
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
              style={{
                width: 560, flexShrink: 0,
                background: 'rgba(9, 12, 20, 0.85)',
                backdropFilter: 'blur(60px) saturate(220%)',
                WebkitBackdropFilter: 'blur(60px) saturate(220%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRight: isStrategiesExpanded ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: isStrategiesExpanded ? '22px 0 0 22px' : '22px', 
                overflow: 'hidden',
                boxShadow: isStrategiesExpanded ? '0 40px 100px -20px rgba(0,0,0,0.8)' : '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)',
                display: 'flex', flexDirection: 'column',
                zIndex: 2,
                transition: 'border-radius 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-right 0.5s ease',
              }}
            >
              {/* Header - Fixed at top */}
              <div style={{ height: 32, flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: "var(--font-display, 'Clash Display', sans-serif)", fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(241,245,249,0.35)' }}>
                  Initialize Project Structure
                </span>
                <button
                  onClick={handleClose}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Body Content Area (No Scrolling) */}
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1.2 }}>
                    <SectionLabel>Logical Handle</SectionLabel>
                    <input
                      type="text"
                      value={projectName}
                      onChange={e => onProjectNameChange(e.target.value)}
                      placeholder="my-multi-page-app"
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                     <SectionLabel>Provisioning Engine</SectionLabel>
                     <div style={{ display: 'flex', gap: 10 }}>
                       {PM_LIST.map(pm => (
                         <PremiumUnderlineButton key={pm} onClick={() => onPackageManagerChange(pm)} active={packageManager === pm} small>
                           {pm}
                         </PremiumUnderlineButton>
                       ))}
                     </div>
                  </div>
                </div>

                <div>
                  <SectionLabel>Filesystem Destination</SectionLabel>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input type="text" value={outputPath} readOnly placeholder="Select target directory..." style={{ ...INPUT_STYLE, flex: 1, cursor: 'default' }} />
                    <PremiumUnderlineButton onClick={onBrowse}>Browse</PremiumUnderlineButton>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 28, marginBottom: 8 }}>
                      <div style={{
                        fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                        fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                        color: 'rgba(241, 245, 249, 0.42)'
                      }}>
                        Automation Routines
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                      overflow: 'hidden'
                    }}>
                      <AutomationRow
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0.5-5" /><path d="M8 7h6" /><path d="M8 11h8" /></svg>}
                        title="Auto-Surface IDE"
                        subtext="Open in VS Code"
                        checked={openWhenDone}
                        onChange={onOpenWhenDoneChange}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 28, marginBottom: 8 }}>
                      <div style={{
                        fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                        fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                        color: 'rgba(241, 245, 249, 0.42)'
                      }}>
                        Generation Strategy
                      </div>
                      <PremiumUnderlineButton 
                        onClick={() => setIsStrategiesExpanded(!isStrategiesExpanded)}
                        small
                      >
                        {isStrategiesExpanded ? 'Hide' : 'Change'}
                      </PremiumUnderlineButton>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                      overflow: 'hidden'
                    }}>
                      <StrategyRow
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
                        title={activeStrategy === 'scaffold' ? "Scaffold" : activeStrategy === 'ai' ? "AI" : "Hybrid"}
                        subtext="Pre-defined structure"
                        active={true}
                        onClick={() => setIsStrategiesExpanded(true)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionLabel>Architecture Preview</SectionLabel>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 12, fontSize: '0.62rem', color: 'rgba(241,245,249,0.3)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      <span>{pages.length} PAGE{pages.length !== 1 ? 'S' : ''}</span>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <span>NAVBAR: <span style={{ color: '#a5b4fc', opacity: 0.8 }}>{navbarName.toUpperCase()}</span></span>
                    </div>
                    <div style={{ 
                      padding: '8px 0', 
                      display: 'grid', 
                      gridTemplateColumns: pages.length > 2 ? '1fr 1fr' : '1fr',
                      gap: '0 20px'
                    }}>
                      {pages.map(page => {
                        const comps = page.componentIds.map(id => allComponentNames[id] || id).filter(Boolean);
                        return (
                          <div key={page.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 16px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600, minWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</span>
                            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-mono, monospace)' }}>{pageRoute(page.type, page.title)}</span>
                            {comps.length > 0 && (
                              <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.1)', marginLeft: 'auto', fontStyle: 'italic' }}>
                                {comps.length} bits
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, marginTop: 4, justifyContent: 'flex-end' }}>
                  <PremiumUnderlineButton onClick={handleClose}>Dismiss</PremiumUnderlineButton>
                  <PremiumUnderlineButton
                    onClick={handleConfirm}
                    disabled={!projectName || !outputPath}
                    primary
                  >
                    Initialize Synthesis
                  </PremiumUnderlineButton>
                </div>

              </div>
            </motion.div>

            {/* Side Panel (Strategy Picker) */}
            <AnimatePresence>
              {isStrategiesExpanded && (
                <motion.div
                  layout
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
                  style={{
                    flexShrink: 0,
                    background: 'rgba(9, 12, 20, 0.85)',
                    backdropFilter: 'blur(60px) saturate(220%)',
                    WebkitBackdropFilter: 'blur(60px) saturate(220%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderLeft: 'none',
                    borderRadius: '0 22px 22px 0', 
                    overflow: 'hidden',
                    boxShadow: '40px 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)',
                    display: 'flex', flexDirection: 'column',
                    marginTop: 0,
                    alignSelf: 'stretch',
                    maxHeight: 'calc(100vh - 80px)',
                    zIndex: 1,
                  }}
                >
                   <div style={{ height: 32, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily: "var(--font-display, 'Clash Display', sans-serif)", fontSize: '0.52rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(241,245,249,0.35)' }}>
                      Select Strategy
                    </span>
                    <button
                      onClick={() => setIsStrategiesExpanded(false)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
                    <StrategyRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
                      title="Template Scaffold"
                      subtext="Pre-defined multi-page structure"
                      active={activeStrategy === 'scaffold'}
                      onClick={() => { setActiveStrategy('scaffold'); setIsStrategiesExpanded(false); }}
                    />
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />
                    <StrategyRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z"/><path d="M12 12L2.2 9"/><path d="M12 12L19.8 9"/></svg>}
                      title="AI Synthesis"
                      subtext="Dynamic assembly & logic generation"
                      active={activeStrategy === 'ai'}
                      disabled
                      onClick={() => {}}
                    />
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />
                    <StrategyRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                      title="Hybrid Flow"
                      subtext="Template based with AI polish"
                      active={activeStrategy === 'hybrid'}
                      disabled
                      onClick={() => {}}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
