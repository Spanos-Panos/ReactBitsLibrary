import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactBitsItem } from '../../shared/types/index';

type Category = 'Components' | 'Animations' | 'Backgrounds' | 'TextAnimations';
type Language = 'ts-css' | 'ts-tailwind' | 'js-css' | 'js-tailwind';

const CATEGORIES: Category[] = ['Components', 'Animations', 'Backgrounds', 'TextAnimations'];
const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'ts-css', label: 'TS + CSS' },
  { value: 'ts-tailwind', label: 'TS + Tailwind' },
  { value: 'js-css', label: 'JS + CSS' },
  { value: 'js-tailwind', label: 'JS + Tailwind' },
];

const PMS = ['pnpm', 'npm', 'yarn', 'bun'] as const;
type PM = typeof PMS[number];

interface ComponentAddPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onAdded: (entry: ReactBitsItem) => void;
}

export default function ComponentAddPanel({ isOpen, onToggle, onAdded }: ComponentAddPanelProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Components');
  const [language, setLanguage] = useState<Language>('ts-css');
  const [code, setCode] = useState('');
  const [css, setCss] = useState('');
  const [usage, setUsage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Installation Tab state
  const [installTab, setInstallTab] = useState<'cli' | 'manual'>('cli');
  const [cliCmds, setCliCmds] = useState<Record<PM, string>>({ pnpm: '', npm: '', yarn: '', bun: '' });
  const [manualCmds, setManualCmds] = useState<Record<PM, string>>({ pnpm: '', npm: '', yarn: '', bun: '' });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    } else {
      reset();
    }
  }, [isOpen]);

  const reset = () => {
    setName(''); setCategory('Components'); setLanguage('ts-css');
    setCode(''); setCss(''); setUsage(''); setInstallTab('cli');
    setCliCmds({ pnpm: '', npm: '', yarn: '', bun: '' });
    setManualCmds({ pnpm: '', npm: '', yarn: '', bun: '' });
    setError(null);
  };

  const handleClose = () => { onToggle(); };

  const handleSubmit = async () => {
    setError(null);
    const trimmedName = name.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!trimmedName) { setError('Name is required'); return; }
    if (!code.trim()) { setError('Code is required'); return; }

    // Build install markdown
    const lines = ['CLI'];
    PMS.forEach(pm => { if (cliCmds[pm].trim()) lines.push(`${pm} = ${cliCmds[pm].trim()}`); });
    lines.push('', 'Manual');
    PMS.forEach(pm => { if (manualCmds[pm].trim()) lines.push(`${pm} = ${manualCmds[pm].trim()}`); });
    const install = lines.join('\n');

    setLoading(true);
    try {
      const result = await window.reactBitsApi?.addComponent?.({
        name: trimmedName, category, language, code, css, install, usage,
      });
      if (result?.ok && result.entry) {
        onAdded(result.entry);
        onToggle();
      } else { setError(result?.error || 'Failed to add component'); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button
        className={`nav-action-btn${isOpen ? ' nav-action-btn--active' : ''}`}
        onClick={() => { if (!isOpen) onToggle(); }}
        title="Add Component"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <div className="wizard-overlay" style={{ zIndex: 99999 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }} onClick={e => e.stopPropagation()}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 18 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
                style={{
                  width: 520, flexShrink: 0,
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
                    Register Component
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

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22, maxHeight: '82vh', overflowY: 'auto' }}>
                  {/* IDENTITY ROW */}
                  <div style={{ display: 'flex', gap: 18 }}>
                    <div style={{ flex: 1.4 }}>
                      <SectionLabel>Identity</SectionLabel>
                      <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Component name"
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <SectionLabel>Classification</SectionLabel>
                      <PremiumSelect
                        value={category}
                        onChange={v => setCategory(v as Category)}
                        options={CATEGORIES.map(c => ({ label: c, value: c }))}
                      />
                    </div>
                  </div>

                  {/* TECH STACK */}
                  <div>
                    <SectionLabel>Technical Architecture</SectionLabel>
                    <PremiumSelect
                      value={language}
                      onChange={v => setLanguage(v as Language)}
                      options={LANGUAGES}
                    />
                  </div>

                  {/* IMPLEMENTATION */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <SectionLabel>Component implementation (.tsx/.jsx)</SectionLabel>
                      <textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder="Paste source code"
                        style={TEXTAREA_STYLE}
                      />
                    </div>

                    {!language.includes('tailwind') && (
                      <div>
                        <SectionLabel>Style definitions (.css)</SectionLabel>
                        <textarea
                          value={css}
                          onChange={e => setCss(e.target.value)}
                          placeholder="Paste CSS rules"
                          style={{ ...TEXTAREA_STYLE, minHeight: 80 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* USAGE (MOVED UP) */}
                  <div>
                    <SectionLabel>Usage Narrative (Usage.md)</SectionLabel>
                    <textarea
                      value={usage}
                      onChange={e => setUsage(e.target.value)}
                      placeholder="Usage examples"
                      style={{ ...TEXTAREA_STYLE, minHeight: 100 }}
                    />
                  </div>

                  {/* INSTALLATION (MOVED DOWN & TABBED) */}
                  <div>
                    <SectionLabel>Installation Infrastructure</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Tabs Bar */}
                      <div style={{ display: 'flex', gap: 18, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 4 }}>
                        <PremiumUnderlineButton 
                          onClick={() => setInstallTab('cli')} 
                          active={installTab === 'cli'}
                          small
                        >
                          CLI PROVISIONING
                        </PremiumUnderlineButton>
                        <PremiumUnderlineButton 
                          onClick={() => setInstallTab('manual')} 
                          active={installTab === 'manual'}
                          small
                        >
                          MANUAL DEPENDENCIES
                        </PremiumUnderlineButton>
                      </div>
                      
                      <div style={{ padding: '8px 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                          {PMS.map(pm => (
                             <div key={pm} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                               <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.12)', width: 32, textTransform: 'uppercase' }}>{pm}</span>
                               <input 
                                 type="text" 
                                 value={installTab === 'cli' ? cliCmds[pm] : manualCmds[pm]} 
                                 onChange={e => {
                                   const setter = installTab === 'cli' ? setCliCmds : setManualCmds;
                                   setter(p => ({ ...p, [pm]: e.target.value }));
                                 }}
                                 placeholder="Enter command"
                                 style={{ ...INPUT_STYLE, padding: '8px 12px', fontSize: '0.68rem', borderRadius: 9, background: 'rgba(0,0,0,0.18)' }} 
                               />
                             </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>


                  {error && (
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* BOTTOM ACTIONS */}
                  <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingBottom: 6, justifyContent: 'flex-end' }}>
                    <PremiumUnderlineButton onClick={handleClose}>Dismiss</PremiumUnderlineButton>
                    <PremiumUnderlineButton
                      onClick={handleSubmit}
                      disabled={loading || !name.trim() || !code.trim()}
                      active
                      primary
                    >
                      {loading ? 'Processing Registration...' : 'Register Component'}
                    </PremiumUnderlineButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
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
        fontSize: small ? '0.62rem' : '0.8rem',
        fontWeight: small ? 700 : 600,
        letterSpacing: small ? '0.04em' : 'normal',
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

/* ── PREMIUM SELECT COMPONENT ─────────────────────────────────────── */

function PremiumSelect({ value, options, onChange }: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...INPUT_STYLE, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderColor: isOpen ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.35)',
          transition: 'all .25s ease',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 500 }}>{selected?.label}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .3s ease', opacity: 0.4 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
              background: 'rgba(15, 18, 25, 0.98)',
              backdropFilter: 'blur(30px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, overflow: 'hidden', zIndex: 10,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{
                  width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none',
                  color: value === opt.value ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                  background: value === opt.value ? 'rgba(99,102,241,0.12)' : 'transparent',
                  fontSize: '0.75rem', fontWeight: value === opt.value ? 700 : 500,
                  cursor: 'pointer', transition: 'all .15s ease',
                }}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── UI ATOMS ────────────────────────────────────────────────────── */

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
  width: '100%',
  background: 'rgba(0,0,0,0.28)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#f1f5f9',
  fontSize: '0.85rem',
  fontFamily: "var(--font-body, 'Satoshi', sans-serif)",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .2s ease',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 80,
  maxHeight: 180,
  resize: 'none',
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: '0.7rem',
  lineHeight: 1.6,
};
