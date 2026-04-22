import './GenerationQueue.css';
import type { Task } from '../../../shared/types/index';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  tasks: Record<string, Task>;
  onKill: (id: string) => void;
  onSelect: (id: string) => void;
  onClearAll: () => void;
  onVisionRework?: (taskId: string) => void;
  reworkReadyTaskIds?: Set<string>;
}

const STATUS_LABEL: Record<string, string> = {
  running: 'Synthesizing',
  success: 'Success',
  error: 'Failed',
};

function StatusIcon({ status }: { status: 'running' | 'success' | 'error' }) {
  if (status === 'running') {
    return (
      <div className="gq-status-icon gq-status-icon--running">
        <motion.svg 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </motion.svg>
      </div>
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
  return (
    <div className="gq-status-icon gq-status-icon--error">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

export default function GenerationQueue({
  tasks, onKill, onSelect, onClearAll,
  onVisionRework, reworkReadyTaskIds = new Set(),
}: Props) {
  const taskList = Object.values(tasks).sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="gq-container">
      <div className="gq-header">
        <span className="gq-title">Generations</span>
        {taskList.length > 0 && (
          <button className="gq-clear-all" onClick={onClearAll}>Clear All</button>
        )}
      </div>

      <div className="gq-scroll">
        <AnimatePresence initial={false}>
          {taskList.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="gq-empty"
            >
              No active generations
            </motion.p>
          ) : taskList.map(task => {
            const isStructure = task.type === 'structure';
            const isAiBuild   = !isStructure && (task.name?.toLowerCase().includes('ai') || task.name?.toLowerCase().includes('build'));
            const isCompleted = task.status === 'success';
            const reworkReady = reworkReadyTaskIds.has(task.id);

            // Labels matching user request: PROJECT, DEMO, STRUCTURE
            const typeLabel = isStructure ? 'STRUCTURE' : (isAiBuild ? 'PROJECT' : 'DEMO');

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`gq-card gq-card--${task.status}`}
                onClick={() => onSelect(task.id)}
              >
                <div className="gq-card-row">
                  <span className="gq-name">{task.name}</span>

                  <div className="gq-row-spacer" />
                  
                  <StatusIcon status={task.status} />

                  <button
                    className="gq-kill"
                    title="Stop & Clear"
                    onClick={e => { e.stopPropagation(); onKill(task.id); }}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="gq-card-row gq-card-row--meta">
                  <span className={`gq-badge gq-badge--${typeLabel.toLowerCase()}`}>
                    {typeLabel}
                  </span>
                  <span className="gq-meta-div">·</span>
                  <span className="gq-info-hint">Click for more information</span>

                  {/* Vision Rework Action */}
                  {isAiBuild && isCompleted && onVisionRework && (
                    <button
                      className={`gq-rework-btn ${reworkReady ? 'rework-ready' : ''}`}
                      onClick={e => { e.stopPropagation(); onVisionRework(task.id); }}
                    >
                      <AnimatePresence mode="wait">
                        {reworkReady && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="gq-rework-dot"
                          />
                        )}
                      </AnimatePresence>
                      🎨 Rework
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
