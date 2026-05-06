import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState, useEffect, useRef, type RefObject } from "react";
import type { Task } from "../../shared/types/index";

interface TaskOverlayProps {
  task: Task;
  terminalRef: RefObject<HTMLPreElement | null>;
  onHide: () => void;
  onStop: (id: string) => void;
  onClear: (id: string) => void;
}

function StatusIcon({ status }: { status: 'running' | 'success' | 'warning' | 'error' }) {
  if (status === 'running') {
    return (
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="gq-status-icon gq-status-icon--running"
      >
        <svg
          className="gq-spinner"
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </motion.div>
    );
  }
  if (status === 'success') {
    return (
      <div className="gq-status-icon gq-status-icon--success">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (status === 'warning') {
    return (
      <div className="gq-status-icon gq-status-icon--warning" title="Completed with advisory warnings">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="gq-status-icon gq-status-icon--error">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 18 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { 
      type: 'spring', damping: 30, stiffness: 400, mass: 0.9,
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, scale: 0.94, y: 18, 
    transition: { 
      type: 'spring', damping: 32, stiffness: 400, mass: 1,
      opacity: { duration: 0.2 } 
    } 
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function TaskOverlay({ task, terminalRef, onHide, onStop, onClear }: TaskOverlayProps) {
  const [copied, setCopied] = useState(false);

  const isRunningPhase = task.status === 'running';
  const isSuccess = task.status === 'success' || task.status === 'warning';
  const isWarning = task.status === 'warning';
  const isError = task.status === 'error';

  const isProcessActive = isRunningPhase || (isSuccess && task.runWhenDoneUsed && task.progress !== 'Server Stopped');

  const isStructure = task.type === 'structure';
  const isAiBuild   = !isStructure && (task.name?.toLowerCase().includes('ai') || task.name?.toLowerCase().includes('build'));
  const typeLabel = isStructure ? 'STRUCTURE' : (isAiBuild ? 'PROJECT' : 'DEMO');

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [task.logs]);

  const handleCopy = () => {
    const text = task.logs.join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenVSCode = () => {
    if (task.path) window.reactBitsApi.openInVSCode(task.path);
  };

  const handleRevealExplorer = () => {
    if (task.path) window.reactBitsApi.openPath(task.path);
  };

  return (
    <AnimatePresence>
      <div className="wizard-overlay" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Removed onClick={onHide} to prevent accidental closing
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              width: 720, flexShrink: 0,
              background: 'rgba(9, 12, 20, 0.82)',
              backdropFilter: 'blur(60px) saturate(220%)',
              WebkitBackdropFilter: 'blur(60px) saturate(220%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              overflow: 'hidden',
              zIndex: 2,
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header Bar */}
            <div style={{
              height: 32, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              background: 'rgba(0, 0, 0, 0.2)',
            }}>
              <span style={{
                fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
                fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'rgba(241, 245, 249, 0.4)',
              }}>
                Process Analysis
              </span>
              <button
                onClick={onHide}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', borderRadius: 6,
                  color: 'rgba(255,255,255,0.25)', fontSize: 16, cursor: 'pointer', padding: 0,
                  width: 24, height: 24,
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 28 }}>
              
              {/* Meta Specs Section */}
              <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'flex-start' }}>
                {/* Project Specs */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <MetaItem label="Logical Handle" value={task.projectName || task.name} />
                  <MetaItem 
                    label="Filesystem Destination" 
                    value={task.path || 'Pending...'} 
                    mono 
                    dim={!task.path}
                  />
                </div>

                {/* Vertical Divider */}
                <div style={{ width: 1, height: 80, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)', margin: '0 32px' }} />

                {/* Process Specs */}
                <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <MetaItem label="Process Status">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800,
                        color: task.progress === 'Server Stopped'
                          ? 'rgba(255,255,255,0.4)'
                          : (isRunningPhase
                              ? '#818cf8'
                              : isWarning
                                ? '#fbbf24'
                                : isSuccess ? '#4ade80' : '#f87171'),
                        letterSpacing: '0.04em',
                        textShadow: (isRunningPhase || isProcessActive)
                          ? `0 0 15px ${isRunningPhase ? 'rgba(129, 140, 248, 0.3)' : isWarning ? 'rgba(251, 191, 36, 0.25)' : 'rgba(74, 222, 128, 0.2)'}`
                          : 'none'
                      }}>
                        {task.progress === 'Server Stopped'
                          ? 'STOPPED'
                          : isWarning
                            ? `COMPLETED · ${(task.warnings && task.warnings.length) || 0} WARNING(S)`
                            : (isStructure && isSuccess ? 'SUCCESS' : (isProcessActive && isSuccess ? 'SUCCEED (RUNNING)' : task.status.toUpperCase()))}
                      </span>
                      <StatusIcon status={task.status} />
                    </div>
                  </MetaItem>
                  <MetaItem label="Generation Type">
                     <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-start' }}>
                        <span className={`gq-badge gq-badge--${typeLabel.toLowerCase()}`} style={{ 
                          fontSize: '0.62rem', padding: '5px 12px', borderRadius: 4,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                          marginLeft: 0
                        }}>
                          {typeLabel}
                        </span>
                     </div>
                  </MetaItem>
                </div>
              </motion.div>

              {/* Action Bar */}
              <motion.div variants={itemVariants} style={{ 
                display: 'flex', 
                gap: 8, 
                alignItems: 'center', 
                justifyContent: isStructure ? 'center' : 'space-between' 
              }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <PremiumActionBtn 
                    onClick={handleOpenVSCode}
                    disabled={!task.path || task.status === 'running'}
                    label="Open in VS Code"
                  />
                  <PremiumActionBtn 
                    onClick={handleRevealExplorer}
                    disabled={!task.path || task.status === 'running'}
                    label="Reveal in Explorer"
                  />
                </div>

                {!isStructure && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)', margin: '0 8px' }} />}

                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {!isStructure && (
                    <PremiumActionBtn 
                      onClick={() => onStop(task.id)}
                      disabled={!isProcessActive}
                      label="Stop Running"
                    />
                  )}

                  <PremiumActionBtn 
                    onClick={() => { onClear(task.id); onHide(); }}
                    danger
                    label="Terminate & Clear"
                  />
                </div>
              </motion.div>


              {/* Terminal Section */}
              <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SectionLabel>System Stream</SectionLabel>
                    {isRunningPhase && (
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ 
                          width: 4, height: 4, borderRadius: '50%', 
                          background: '#818cf8',
                          boxShadow: '0 0 8px #818cf8'
                        }} 
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                     <PremiumActionBtn 
                        onClick={handleCopy}
                        label={copied ? '✓ COPIED' : 'COPY LOGS'}
                        small
                     />
                  </div>
                </div>

                <div className="fake-terminal-wrapper" style={{
                  position: 'relative',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  <pre
                    ref={terminalRef}
                    style={{
                      margin: 0,
                      padding: '24px',
                      height: 380,
                      overflowY: 'auto',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: '0.78rem',
                      lineHeight: 1.7,
                      color: 'rgba(241, 245, 249, 0.55)',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    <style>{`
                      pre::-webkit-scrollbar { display: none; }
                    `}</style>
                    {task.logs.map((log, i) => (
                      <TerminalLine key={i} text={log} />
                    ))}
                  </pre>
                  
                  {/* Decorative terminal elements */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent)' }} />
                </div>
              </motion.div>



            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

function MetaItem({ label, value, mono, dim, children }: { label: string; value?: string; mono?: boolean; dim?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {children ? children : (
          <span style={{
            fontFamily: mono ? 'var(--font-mono)' : "var(--font-display, 'Clash Display', sans-serif)",
            fontSize: mono ? '0.74rem' : '0.88rem',
            fontWeight: mono ? 400 : 500,
            color: dim ? 'rgba(241,245,249,0.3)' : 'rgba(241,245,249,0.9)',
            wordBreak: 'break-all',
            lineHeight: 1.4,
            letterSpacing: mono ? '0' : '0.01em'
          }}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
      fontSize: '0.54rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'rgba(241, 245, 249, 0.35)',
    }}>
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: 'running' | 'success' | 'warning' | 'error' }) {
  const color =
    status === 'running' ? '#818cf8'
    : status === 'success' ? '#4ade80'
    : status === 'warning' ? '#fbbf24'
    : '#f87171';
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', background: color,
      boxShadow: `0 0 12px ${color}`
    }} />
  );
}

function PremiumActionBtn({ onClick, disabled, label, danger, small }: { onClick: () => void; disabled?: boolean; label: string; danger?: boolean; small?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: small ? '6px 12px' : '10px 20px',
        background: 'none', border: 'none',
        color: disabled 
          ? 'rgba(255,255,255,0.15)' 
          : (isHovered ? (danger ? '#f87171' : '#a5b4fc') : 'rgba(255,255,255,0.45)'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "var(--font-body)", 
        fontSize: small ? '0.62rem' : '0.75rem', 
        fontWeight: 700,
        position: 'relative', transition: 'all .25s ease',
        letterSpacing: small ? '0.05em' : 'normal'
      }}
    >
      {label}
      <motion.div
        initial={false}
        animate={{
          scaleX: isHovered && !disabled ? 1 : 0,
          opacity: isHovered && !disabled ? 1 : 0,
        }}
        style={{
          position: 'absolute', bottom: small ? 2 : 4, left: small ? 12 : 20, right: small ? 12 : 20, 
          height: small ? 1 : 2,
          background: danger ? '#ef4444' : '#6366f1', transformOrigin: 'center'
        }}
      />
    </button>
  );
}

function TerminalLine({ text }: { text: string }) {
  const isError = text.toLowerCase().includes('error') || text.toLowerCase().includes('fail');
  const isSuccess = text.includes('✓') || text.toLowerCase().includes('success') || text.includes('✅');
  const isWarning = text.toLowerCase().includes('warn');

  let color = 'inherit';
  if (isError) color = '#f87171';
  else if (isSuccess) color = '#4ade80';
  else if (isWarning) color = '#fbbf24';

  return (
    <div style={{ 
      color, 
      borderLeft: isError ? '3px solid rgba(248,113,113,0.4)' : 'none',
      paddingLeft: isError ? 12 : 0,
      marginBottom: 3
    }}>
      {text}
    </div>
  );
}
