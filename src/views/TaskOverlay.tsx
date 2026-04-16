import type { RefObject } from "react";
import type { Task } from "../types/index";

interface TaskOverlayProps {
  task: Task;
  terminalRef: RefObject<HTMLPreElement | null>;
  onHide: () => void;
}

export default function TaskOverlay({ task, terminalRef, onHide }: TaskOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content expanded">
        {task.status === 'running' && <div className="spinner"></div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <h3 style={{ margin: 0 }}>
            {task.status === 'running' ? 'Generating Project...' : 'Generation Result'}
          </h3>
          {task.status !== 'running' && (
            <button className="secondary-btn mini" onClick={onHide}>Close Overlay</button>
          )}
        </div>
        <p className="loading-progress-text">{task.progress}</p>
        <div className="terminal-container">
          <div className="terminal-header">
            <div className="window-controls mini">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <span className="terminal-title">bash - build ({task.name})</span>
            <button className="hide-btn" onClick={onHide}>Hide</button>
          </div>
          <pre className="terminal-body" ref={terminalRef}>
            {task.logs.map((log, i) => <span key={i}>{log}</span>)}
          </pre>
        </div>
      </div>
    </div>
  );
}
