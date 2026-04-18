import './GenerationQueue.css';
import type { Task } from '../../types/index';

interface Props {
  tasks: Record<string, Task>;
  onKill: (id: string) => void;
  onSelect: (id: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  running: 'Running',
  success: 'Done',
  error: 'Error',
};

export default function GenerationQueue({ tasks, onKill, onSelect }: Props) {
  const taskList = Object.values(tasks).sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <div className="gq-container">
      <div className="gq-header">
        <span className="gq-title">Generations</span>
      </div>

      <div className="gq-scroll">
        {taskList.length === 0 ? (
          <p className="gq-empty">No active generations</p>
        ) : taskList.map(task => (
          <div
            key={task.id}
            className={`gq-card gq-card--${task.status}`}
            onClick={() => onSelect(task.id)}
          >
            <div className="gq-card-row">
              <span className={`gq-dot gq-dot--${task.status}`} />

              <span className="gq-name">{task.name}</span>

              <span className={`gq-badge gq-badge--${task.type ?? 'component'}`}>
                {task.type === 'web' ? 'WEB' : 'COMP'}
              </span>

              <button
                className="gq-kill"
                title="Stop"
                onClick={e => { e.stopPropagation(); onKill(task.id); }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                  <rect x="0.5" y="0.5" width="8" height="8" rx="1.5" />
                </svg>
              </button>
            </div>

            <div className="gq-card-row gq-card-row--meta">
              <span className="gq-status-label">{STATUS_LABEL[task.status]}</span>
              <span className="gq-progress">{task.progress}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
