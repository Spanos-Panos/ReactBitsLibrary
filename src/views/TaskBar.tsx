import type { Task } from "../types/index";

interface TaskBarProps {
  tasks: Record<string, Task>;
  activeTaskId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onClearAll: () => void;
}

export default function TaskBar({ tasks, activeTaskId, onSelect, onClose, onClearAll }: TaskBarProps) {
  const taskList = Object.values(tasks);
  if (taskList.length === 0) return null;

  return (
    <div className="task-bar">
      <span style={{ fontSize: '12px', opacity: 0.6, marginRight: '8px' }}>Active Tasks:</span>
      {taskList.map(task => (
        <div
          key={task.id}
          className={`task-bar-item ${task.status} ${activeTaskId === task.id ? 'active' : ''}`}
          onClick={() => onSelect(task.id)}
        >
          <div className="status-dot"></div>
          <span className="task-name">{task.name} ({task.projectName})</span>
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
      ))}
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
