import { motion, AnimatePresence } from "framer-motion";
import type { RefObject } from "react";
import type { Task } from "../../shared/types/index";

interface TaskOverlayProps {
  task: Task;
  terminalRef: RefObject<HTMLPreElement | null>;
  onHide: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-display, 'Clash Display', sans-serif)",
      fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: 'rgba(241, 245, 249, 0.35)', marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

export default function TaskOverlay({ task, terminalRef, onHide }: TaskOverlayProps) {
  const isRunning = task.status === 'running';
  const titleText = isRunning ? 'System Synthesis' : 'Process Archive';

  return (
    <AnimatePresence>
      <div className="wizard-overlay" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onHide}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.9 }}
            style={{
              width: 680, flexShrink: 0,
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
            {/* Header bar */}
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
                onClick={onHide}
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

            {/* Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 28 }}>
                <div style={{ flex: 1 }}>
                  <SectionLabel>Target</SectionLabel>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                    color: 'rgba(241,245,249,0.85)', fontWeight: 500,
                  }}>
                    {task.projectName || task.name}
                  </span>
                </div>
                <div>
                  <SectionLabel>Status</SectionLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isRunning && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        style={{ color: '#818cf8', display: 'flex' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      </motion.div>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                      color: isRunning ? '#a5b4fc' : task.status === 'success' ? '#4ade80' : '#f87171',
                    }}>
                      {isRunning ? 'RUNNING' : task.status === 'success' ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terminal */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <SectionLabel>Output Stream</SectionLabel>
                  <span style={{
                    fontSize: '0.58rem', color: 'rgba(255,255,255,0.18)',
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
                  }}>
                    {task.logs.length} lines
                  </span>
                </div>
                <pre
                  ref={terminalRef}
                  style={{
                    margin: 0,
                    padding: '16px 20px',
                    height: 360,
                    overflowY: 'auto',
                    fontFamily: "'JetBrains Mono', var(--font-mono), monospace",
                    fontSize: '0.76rem',
                    lineHeight: 1.65,
                    color: 'rgba(241, 245, 249, 0.6)',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.08) transparent',
                  }}
                >
                  {task.logs.map((log, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 2,
                        paddingLeft: log.includes('Error') || log.includes('error') ? 10 : 0,
                        borderLeft: log.includes('Error') || log.includes('error') ? '2px solid rgba(248,113,113,0.5)' : 'none',
                        color: log.includes('Error') || log.includes('error')
                          ? '#f87171'
                          : log.startsWith('✓') || log.startsWith('✅')
                          ? '#4ade80'
                          : 'inherit',
                      }}
                    >
                      {log}
                    </div>
                  ))}
                </pre>
              </div>

              {/* Progress footer */}
              {task.progress && (
                <div style={{
                  fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.25)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.02em',
                }}>
                  {task.progress}
                </div>
              )}

            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
