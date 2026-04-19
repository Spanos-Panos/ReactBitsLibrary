import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactBitsItem } from "../../shared/types/index";

type InstallTab = 'cli' | 'manual';
type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

interface GenerateWizardProps {
  open: boolean;
  onClose: () => void;
  selected: ReactBitsItem | null;
  lastEnhancedPrompt: any;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  projectPath: string;
  onBrowse: () => void;
  installTab: InstallTab;
  onInstallTabChange: (tab: InstallTab) => void;
  packageManager: PackageManager;
  onPackageManagerChange: (pm: PackageManager) => void;
  openWhenDone: boolean;
  onOpenWhenDoneChange: (v: boolean) => void;
  runWhenDone: boolean;
  onRunWhenDoneChange: (v: boolean) => void;
  autoKillOnError: boolean;
  onAutoKillChange: (v: boolean) => void;
  onConfirm: () => void;
}

const PM_LIST: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export default function GenerateWizard({
  open, onClose, selected, lastEnhancedPrompt,
  projectName, onProjectNameChange, projectPath, onBrowse,
  installTab, onInstallTabChange, packageManager, onPackageManagerChange,
  openWhenDone, onOpenWhenDoneChange, runWhenDone, onRunWhenDoneChange,
  autoKillOnError, onAutoKillChange, onConfirm
}: GenerateWizardProps) {

  if (!open || (!selected && !lastEnhancedPrompt)) return null;

  const isAiBuild = !!lastEnhancedPrompt;
  const titleText = isAiBuild ? "Generate AI Master Project" : "Generate Demo Project";

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="wizard-overlay" style={{ zIndex: 99999 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }} onClick={e => e.stopPropagation()}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
              style={{
                width: 440, flexShrink: 0,
                background: 'rgba(9, 12, 20, 0.85)',
                backdropFilter: 'blur(60px) saturate(220%)',
                WebkitBackdropFilter: 'blur(60px) saturate(220%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 22,
                overflow: 'hidden',
                zIndex: 2,
                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)',
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
                  {titleText}
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

              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ID & Scope */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <SectionLabel>Logical Handle</SectionLabel>
                    <input
                      type="text"
                      value={projectName}
                      onChange={e => onProjectNameChange(e.target.value)}
                      placeholder="rb-demo-project"
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <SectionLabel>Filesystem Destination</SectionLabel>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        value={projectPath}
                        readOnly
                        placeholder="Select target directory..."
                        style={{ ...INPUT_STYLE, flex: 1, cursor: 'default' }}
                      />
                      <PremiumUnderlineButton onClick={onBrowse}>Browse</PremiumUnderlineButton>
                    </div>
                  </div>
                </div>

                {/* Provisioning Engine */}
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <SectionLabel>Routine</SectionLabel>
                    <div style={{ display: 'flex', gap: 14 }}>
                        <PremiumUnderlineButton 
                          onClick={() => onInstallTabChange('cli')} 
                          active={installTab === 'cli'}
                          small
                        >
                          CLI
                        </PremiumUnderlineButton>
                        <PremiumUnderlineButton 
                          onClick={() => onInstallTabChange('manual')} 
                          active={installTab === 'manual'}
                          small
                        >
                          Manual
                        </PremiumUnderlineButton>
                     </div>
                  </div>
                  <div style={{ flex: 1.6 }}>
                    <SectionLabel>Core Tech</SectionLabel>
                    <div style={{ display: 'flex', gap: 14 }}>
                        {PM_LIST.map(pm => (
                          <PremiumUnderlineButton 
                            key={pm} 
                            onClick={() => onPackageManagerChange(pm)} 
                            active={packageManager === pm}
                            small
                          >
                            {pm}
                          </PremiumUnderlineButton>
                        ))}
                     </div>
                  </div>
                </div>

                {/* Unified Automation Suite */}
                <div>
                  <SectionLabel>Automation Routines</SectionLabel>
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden'
                  }}>
                    <AutomationRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0.5-5" /><path d="M8 7h6" /><path d="M8 11h8" /></svg>}
                      title="Auto-Surface IDE"
                      subtext="Open project in VS Code after synthesis"
                      checked={openWhenDone}
                      onChange={onOpenWhenDoneChange}
                    />

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

                    <AutomationRow
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                      title="Immediate Execution"
                      subtext="Automatic 'npm run dev' initialization"
                      checked={runWhenDone}
                      onChange={onRunWhenDoneChange}
                    />

                    <AnimatePresence>
                      {runWhenDone && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.03)' }}
                        >
                          <AutomationRow
                            child
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                            title="Fault Gate"
                            subtext="Process termination if browser fails"
                            checked={autoKillOnError}
                            onChange={onAutoKillChange}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Final Confirmation */}
                <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingBottom: 6, justifyContent: 'flex-end' }}>
                  <PremiumUnderlineButton onClick={onClose}>Dismiss</PremiumUnderlineButton>
                  <PremiumUnderlineButton
                    onClick={onConfirm}
                    disabled={!projectName || !projectPath}
                    active
                    primary
                  >
                    Initialize Synthesis
                  </PremiumUnderlineButton>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── PREMIUM UNDERLINE BUTTON ──────────────────────────────────────── */

function PremiumUnderlineButton({
  children,
  onClick,
  disabled,
  active,
  primary,
  small
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
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
        fontSize: small ? '0.66rem' : '0.8rem',
        fontWeight: small ? 700 : 600,
        letterSpacing: small ? '0.02em' : 'normal',
        color: disabled 
          ? 'rgba(255,255,255,0.15)' 
          : (isHovered || active) ? (small ? '#a5b4fc' : '#fff') : 'rgba(241,245,249,0.45)',
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

/* ── UI ATOMS ────────────────────────────────────────────────────── */

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

      {/* Select-style Button Icon */}
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

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '12px 16px', color: '#f1f5f9', fontSize: '0.85rem',
  fontFamily: "var(--font-body, 'Satoshi', sans-serif)", outline: 'none', boxSizing: 'border-box',
};
