import './GenerationQueue.css';
import type { Task } from '../../../shared/types/index';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState, useLayoutEffect } from 'react';

interface Props {
  tasks: Record<string, Task>;
  onKill: (id: string) => void;
  onSelect: (id: string) => void;
  onClearAll: () => void;
  onVisionRework?: (taskId: string) => void;
  reworkReadyTaskIds?: Set<string>;
}

type QueueStage =
  | 'success-auto-run'
  | 'success-static'
  | 'generating'
  | 'error-static'
  | 'error-auto-close';

function getQueueStage(task: Task): QueueStage {
  const runWhenDoneUsed = task.runWhenDoneUsed ?? /auto run/i.test(task.progress);
  const autoKillOnErrorUsed = task.autoKillOnErrorUsed ?? false;
  const hasError = task.status === 'error' || !!task.error || !!task.hasTerminalError;

  if (hasError) return autoKillOnErrorUsed ? 'error-auto-close' : 'error-static';
  if (task.status === 'running') return 'generating';
  
  // If the server was manually stopped, downgrade to static success to remove border effects
  if (task.progress === 'Server Stopped') return 'success-static';
  
  return runWhenDoneUsed ? 'success-auto-run' : 'success-static';
}

function getSortBucket(stage: QueueStage): number {
  if (stage === 'success-auto-run') return 0;
  if (stage === 'success-static') return 1;
  if (stage === 'generating') return 2;
  return 3;
}

function StatusIcon({ status }: { status: 'running' | 'success' | 'error' }) {
  if (status === 'running') {
    return (
      <div className="gq-status-icon gq-status-icon--running">
        <svg
          className="gq-spinner"
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
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

function truncateByWordsToWidth(value: string, maxWidth: number, font: string): string {
  const text = value.trim();
  if (!text || maxWidth <= 0) return '';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text;
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) return text;

  const words = text.split(/\s+/).filter(Boolean);
  let out = '';
  for (const word of words) {
    const candidate = out ? `${out} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      out = candidate;
      continue;
    }
    break;
  }
  return out;
}

function ProjectNameLabel({ value, fallbackLabel }: { value: string; fallbackLabel: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visibleText, setVisibleText] = useState(value);

  useLayoutEffect(() => {
    const target = ref.current;
    if (!target) return;

    const update = () => {
      const computed = getComputedStyle(target);
      const width = target.clientWidth;
      const font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const truncated = truncateByWordsToWidth(value, width, font);
      setVisibleText(truncated || fallbackLabel);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(target);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [value, fallbackLabel]);

  return (
    <span ref={ref} className="gq-name" title={value}>
      {visibleText}
    </span>
  );
}

export default function GenerationQueue({
  tasks, onKill, onSelect, onClearAll,
  onVisionRework, reworkReadyTaskIds = new Set(),
}: Props) {
  const taskList = Object.values(tasks)
    .filter(task => getQueueStage(task) !== 'error-auto-close')
    .sort((a, b) => {
      const stageA = getQueueStage(a);
      const stageB = getQueueStage(b);
      const bucketDelta = getSortBucket(stageA) - getSortBucket(stageB);
      if (bucketDelta !== 0) return bucketDelta;
      return Number(a.id) - Number(b.id);
    });

  return (
    <div className="gq-container">
      <div className="gq-header">
        <div className="gq-header-side" /> {/* Spacer to balance centered title */}
        <span className="gq-title">Generations</span>
        <div className="gq-header-side gq-header-side--right">
          {taskList.length > 0 && (
            <button className="gq-clear-all" title="Clear All" onClick={onClearAll}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m4.9 4.9 14.2 14.2" />
              </svg>
            </button>
          )}
        </div>
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
            const stage = getQueueStage(task);
            const isStructure = task.type === 'structure';
            const isAiBuild   = !isStructure && (task.name?.toLowerCase().includes('ai') || task.name?.toLowerCase().includes('build'));
            const isCompleted = stage === 'success-auto-run' || stage === 'success-static';
            const reworkReady = reworkReadyTaskIds.has(task.id);
            const primaryName = task.projectName?.trim() || task.name;

            // Labels matching user request: PROJECT, DEMO, STRUCTURE
            const typeLabel = isStructure ? 'STRUCTURE' : (isAiBuild ? 'PROJECT' : 'DEMO');
            const fallbackLabel =
              typeLabel === 'PROJECT'
                ? 'Untitled Project'
                : typeLabel === 'STRUCTURE'
                  ? 'Untitled Structure'
                  : 'Untitled Demo';

            const cardContent = (
              <div className={`gq-card-inner gq-card-inner--${stage}`}>
                <div className="gq-card-row gq-card-row--title">
                  <div className="gq-title-line">
                    <div className="gq-name-wrap">
                      <ProjectNameLabel value={primaryName} fallbackLabel={fallbackLabel} />
                    </div>
                    <span className={`gq-badge gq-badge--${typeLabel.toLowerCase()}`}>
                      {typeLabel}
                    </span>
                  </div>
                  <div className="gq-actions-slot gq-actions-slot--right">
                    <button
                      className="gq-kill"
                      title="Terminate & Clear"
                      onClick={e => { e.stopPropagation(); onKill(task.id); }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m4.9 4.9 14.2 14.2" />
                      </svg>
                    </button>

                    <StatusIcon status={task.status} />
                  </div>
                </div>

                <div className="gq-card-row gq-card-row--meta">
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
              </div>
            );

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`gq-card gq-card--stage-${stage}`}
                onClick={() => onSelect(task.id)}
              >
                {cardContent}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
