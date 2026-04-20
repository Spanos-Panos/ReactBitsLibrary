import type { Task } from "../../shared/types/index";

interface TaskBarProps {
  tasks: Record<string, Task>;
  activeTaskId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onClearAll: () => void;
  onVisionRework?: (taskId: string) => void;
  reworkReadyTaskIds?: Set<string>;
}

export default function TaskBar({
  tasks, activeTaskId, onSelect, onClose, onClearAll,
  onVisionRework, reworkReadyTaskIds = new Set(),
}: TaskBarProps) {
  const taskList = Object.values(tasks);
  if (taskList.length === 0) return null;

  return (
    <div className="task-bar">
      <span style={{ fontSize: '12px', opacity: 0.6, marginRight: '8px' }}>Active Tasks:</span>
      {taskList.map(task => {
        const isAiBuild   = task.name?.toLowerCase().includes('ai') || task.name?.toLowerCase().includes('build');
        const isCompleted = task.status === 'success';
        const reworkReady = reworkReadyTaskIds.has(task.id);

        return (
          <div
            key={task.id}
            className={`task-bar-item ${task.status} ${activeTaskId === task.id ? 'active' : ''}`}
            onClick={() => onSelect(task.id)}
          >
            <div className="status-dot"></div>
            <span className="task-name">{task.name} ({task.projectName})</span>

            {/* Vision Rework pill — shown on completed AI Build tasks */}
            {isAiBuild && isCompleted && onVisionRework && (
              <span
                title={reworkReady ? 'Screenshot ready — open Vision Rework' : 'Open Vision Rework'}
                onClick={e => { e.stopPropagation(); onVisionRework(task.id); }}
                style={{
                  marginLeft: 6,
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '2px 7px',
                  borderRadius: 6,
                  border: `1px solid ${reworkReady ? 'rgba(165,180,252,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  background: reworkReady ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  color: reworkReady ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                  e.currentTarget.style.color = '#c7d2fe';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = reworkReady ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = reworkReady ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.4)';
                }}
              >
                {reworkReady && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc', display: 'inline-block' }} />
                )}
                🎨 Rework
              </span>
            )}

            {(task.status === 'success' || task.status === 'error' || task.status === 'running') && (
              <span
                className="close-task"
                title="Terminate process and clear task"
                onClick={e => { e.stopPropagation(); onClose(task.id); }}
              >
                &times;
              </span>
            )}
          </div>
        );
      })}
      <button
        className="secondary-btn mini"
        style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px' }}
        onClick={onClearAll}
      >
        CLEAR ALL
      </button>
    </div>
  );
}
