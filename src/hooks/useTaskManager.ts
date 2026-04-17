import { useState, useRef, useEffect } from 'react';
import type { Task } from '../types/index';

/**
 * Owns the task lifecycle: creation, progress/log IPC listeners,
 * active task tracking, and terminal auto-scroll.
 */
export function useTaskManager() {
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const terminalRef = useRef<HTMLPreElement>(null);
  const activeTaskIdRef = useRef<string | null>(null);

  // Keep the ref in sync so IPC callbacks can read the latest value without
  // capturing a stale closure
  useEffect(() => { activeTaskIdRef.current = activeTaskId; }, [activeTaskId]);

  // Register IPC listeners for task progress and log lines
  useEffect(() => {
    const cleanupProgress = window.reactBitsApi?.onGenerateProgress?.((msg: string, taskId: string) => {
      if (msg === '!ERROR_KILL') {
        window.reactBitsApi?.terminateTask?.(taskId);
        setTasks(prev => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        if (activeTaskIdRef.current === taskId) setActiveTaskId(null);
        return;
      }
      setTasks(prev =>
        prev[taskId]
          ? { ...prev, [taskId]: { ...prev[taskId], progress: msg } }
          : prev
      );
    });

    const cleanupLog = window.reactBitsApi?.onGenerateLog?.((msg: string, taskId: string) => {
      setTasks(prev =>
        prev[taskId]
          ? { ...prev, [taskId]: { ...prev[taskId], logs: [...prev[taskId].logs.slice(-300), msg] } }
          : prev
      );
    });

    return () => { cleanupProgress?.(); cleanupLog?.(); };
  }, []);

  // Auto-scroll terminal to the bottom when new logs arrive
  useEffect(() => {
    if (activeTaskId && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [tasks, activeTaskId]);

  return { tasks, setTasks, activeTaskId, setActiveTaskId, activeTaskIdRef, terminalRef };
}
