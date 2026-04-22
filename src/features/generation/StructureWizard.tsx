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
  onConfirm: () => void;
  allComponentNames: Record<string, string>; // id → name
}

const PM_LIST: Array<'npm' | 'pnpm' | 'yarn'> = ['npm', 'pnpm', 'yarn'];

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 13px', fontSize: '0.8rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, color: '#f1f5f9', outline: 'none', fontFamily: 'inherit',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(241,245,249,0.3)', marginBottom: 8 }}>
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
        padding: small ? '6px 4px' : '8px 4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "var(--font-body, 'Inter', sans-serif)",
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

export default function StructureWizard({
  open, onClose, pages, navbarName, projectName, onProjectNameChange,
  outputPath, onBrowse, packageManager, onPackageManagerChange, onConfirm,
  allComponentNames,
}: StructureWizardProps) {
  if (!open) return null;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div
          className="wizard-overlay"
          style={{ zIndex: 99999 }}
          onClick={onClose}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
              style={{
                width: 460, flexShrink: 0,
                background: 'rgba(9,12,20,0.92)',
                backdropFilter: 'blur(60px) saturate(220%)',
                WebkitBackdropFilter: 'blur(60px) saturate(220%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 22, overflow: 'hidden',
                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{ height: 28, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'rgba(0,0,0,0.15)' }}>
                <span style={{ fontFamily: "var(--font-display, 'Clash Display', sans-serif)", fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(241,245,249,0.35)' }}>
                  Generate Project Structure
                </span>
                <button
                  onClick={onClose}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Project name + path */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <SectionLabel>Project Name</SectionLabel>
                    <input
                      type="text"
                      value={projectName}
                      onChange={e => onProjectNameChange(e.target.value)}
                      placeholder="my-multi-page-app"
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <SectionLabel>Output Directory</SectionLabel>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="text" value={outputPath} readOnly placeholder="Select target directory..." style={{ ...INPUT_STYLE, flex: 1, cursor: 'default' }} />
                      <PremiumUnderlineButton onClick={onBrowse}>Browse</PremiumUnderlineButton>
                    </div>
                  </div>
                </div>

                {/* Package manager */}
                <div>
                  <SectionLabel>Package Manager</SectionLabel>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {PM_LIST.map(pm => (
                      <PremiumUnderlineButton key={pm} onClick={() => onPackageManagerChange(pm)} active={packageManager === pm} small>
                        {pm}
                      </PremiumUnderlineButton>
                    ))}
                  </div>
                </div>

                {/* Approach selector */}
                <div>
                  <SectionLabel>Generation Approach</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { id: 'free', label: 'Free', desc: 'Template scaffold, no AI', active: true },
                      { id: 'smart', label: 'Smart', desc: 'Claude-assisted ($0.15 max)', active: false },
                      { id: 'mixed', label: 'Mixed', desc: 'Template + AI polish', active: false },
                    ].map(opt => (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${opt.id === 'free' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          background: opt.id === 'free' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                          opacity: opt.active ? 1 : 0.4,
                          cursor: opt.active ? 'default' : 'not-allowed',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.id === 'free' ? '#6366f1' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: opt.active ? '#f1f5f9' : 'rgba(241,245,249,0.5)' }}>{opt.label}</div>
                            <div style={{ fontSize: '0.67rem', color: 'rgba(241,245,249,0.35)' }}>{opt.desc}</div>
                          </div>
                        </div>
                        {!opt.active && (
                          <span style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(241,245,249,0.3)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 4 }}>Soon</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Page summary */}
                <div>
                  <SectionLabel>Structure Preview</SectionLabel>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, fontSize: '0.68rem', color: 'rgba(241,245,249,0.4)' }}>
                      <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>Navbar: <span style={{ color: 'rgba(241,245,249,0.7)' }}>{navbarName}</span></span>
                      <span>·</span>
                      <span>React Router</span>
                    </div>
                    <div style={{ padding: '6px 0' }}>
                      {pages.map(page => {
                        const comps = page.componentIds.map(id => allComponentNames[id] || id).filter(Boolean);
                        return (
                          <div key={page.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '5px 14px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#f1f5f9', fontWeight: 500, minWidth: 80 }}>{page.title}</span>
                            <span style={{ fontSize: '0.67rem', color: 'rgba(241,245,249,0.35)', fontFamily: 'monospace' }}>{pageRoute(page.type, page.title)}</span>
                            {comps.length > 0 && (
                              <span style={{ fontSize: '0.64rem', color: 'rgba(241,245,249,0.4)', marginLeft: 'auto' }}>
                                [{comps.join(', ')}]
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 14, marginTop: 4, paddingBottom: 6, justifyContent: 'flex-end' }}>
                  <PremiumUnderlineButton onClick={onClose}>Dismiss</PremiumUnderlineButton>
                  <PremiumUnderlineButton
                    onClick={onConfirm}
                    disabled={!projectName || !outputPath}
                    active
                    primary
                  >
                    Initialize Structure
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
