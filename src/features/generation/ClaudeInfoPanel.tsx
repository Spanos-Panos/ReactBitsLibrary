import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Task } from "../../shared/types";
import "./ClaudeInfoPanel.css";

interface Props {
  tasks: Record<string, Task>;
  messages?: ClaudeConsoleMessage[];
  onClearMessages?: () => void;
  onClearMessagesByLevel?: (level: ClaudeConsoleMessage["level"]) => void;
}

export type ClaudeConsoleMessageLevel = "info" | "success" | "warning" | "error";

export type ClaudeConsoleMessage = {
  id: string;
  createdAt: number;
  level: ClaudeConsoleMessageLevel;
  title?: string;
  message: string;
  source: "toast";
};

interface ReviewerMetrics {
  costUsd?: number;
  turns?: number;
  plan?: string;
  budgetUsd?: number;
  passes: string[];
}

interface ReviewLifecycleMetrics {
  attempts: number;
  escalations: number;
  finalGate: 'PASS' | 'FAIL' | 'unknown';
}

function parseReviewerMetrics(logs: string[]): ReviewerMetrics {
  const metrics: ReviewerMetrics = { passes: [] };
  let totalCost = 0;
  for (const line of logs) {
    const planMatch = line.match(/\bplan=([a-z]+)/i);
    if (planMatch) metrics.plan = planMatch[1];

    const passMatch = line.match(/Pass=([a-zA-Z]+)/);
    if (passMatch && !metrics.passes.includes(passMatch[1])) {
      metrics.passes.push(passMatch[1]);
    }

    const budgetMatch = line.match(/budget=\$(\d+(?:\.\d+)?)/i);
    if (budgetMatch) metrics.budgetUsd = Number(budgetMatch[1]);

    const turnsAttrMatch = line.match(/turns=(\d+)/i);
    if (turnsAttrMatch) metrics.turns = Number(turnsAttrMatch[1]);
    else {
      const turnsTextMatch = line.match(/(\d+)\s+turns/i);
      if (turnsTextMatch) metrics.turns = Number(turnsTextMatch[1]);
    }

    if (line.includes('[Reviewer]') && /ended|complete/i.test(line)) {
      const allCosts = [...line.matchAll(/\$(\d+(?:\.\d+)?)/g)];
      if (allCosts.length > 0) {
        const cost = Number(allCosts[allCosts.length - 1][1]);
        if (Number.isFinite(cost)) totalCost += cost;
      }
    }
  }
  if (totalCost > 0) metrics.costUsd = totalCost;
  return metrics;
}

function parseReviewLifecycle(logs: string[]): ReviewLifecycleMetrics {
  let attempts = 0;
  let escalations = 0;
  let finalGate: 'PASS' | 'FAIL' | 'unknown' = 'unknown';
  for (const line of logs) {
    if (line.includes('[Reviewer] Pass=')) attempts += 1;
    if (/escalating to \$\d/i.test(line)) escalations += 1;
    const gateMatch = line.match(/\[QA\]\s+Gate result:\s+(PASS|FAIL)/i);
    if (gateMatch) finalGate = gateMatch[1].toUpperCase() as 'PASS' | 'FAIL';
  }
  return { attempts, escalations, finalGate };
}

function formatUsd(value?: number): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `$${value.toFixed(4)}`;
}

function formatMs(ms?: number): string {
  if (!ms || ms <= 0) return "running";
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function promptPreview(rawPrompt?: string): string {
  if (!rawPrompt?.trim()) return "No prompt captured";
  return rawPrompt.length > 120 ? `${rawPrompt.slice(0, 120)}...` : rawPrompt;
}

function responsePreview(enhancedPrompt?: Record<string, unknown> | null): string {
  if (!enhancedPrompt || typeof enhancedPrompt !== "object") return "No enhanced response captured";
  const meta = enhancedPrompt.projectMeta as { title?: string; mood?: string } | undefined;
  const overrides = enhancedPrompt.contentOverrides as Record<string, unknown> | undefined;
  const overrideCount = overrides ? Object.keys(overrides).length : 0;
  return `${meta?.title || "Untitled"}${meta?.mood ? ` • ${meta.mood}` : ""} • overrides: ${overrideCount}`;
}

export default function ClaudeInfoPanel({ tasks, messages = [], onClearMessages, onClearMessagesByLevel }: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "messages">("analytics");
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<ClaudeConsoleMessageLevel | "all">("all");
  const firstTabButtonRef = useRef<HTMLButtonElement | null>(null);
  const analytics = useMemo(() => {
    return Object.values(tasks)
      .filter((task) => !!task.aiAnalytics)
      .map((task) => {
        const reviewer = parseReviewerMetrics(task.logs || []);
        const lifecycleFromLogs = parseReviewLifecycle(task.logs || []);
        const lifecycle = {
          attempts: task.aiAnalytics?.reviewerSummary?.attempts ?? lifecycleFromLogs.attempts,
          escalations: task.aiAnalytics?.reviewerSummary?.escalations ?? lifecycleFromLogs.escalations,
          finalGate: task.aiAnalytics?.reviewerSummary?.finalGate ?? lifecycleFromLogs.finalGate,
        };
        const enhancerCost = task.aiAnalytics?.enhancerTelemetry?.totalEstimatedCostUsd || 0;
        const reviewerCost = reviewer.costUsd ?? 0;
        const durationMs = task.completedAt && task.createdAt ? task.completedAt - task.createdAt : undefined;
        return {
          id: task.id,
          name: task.projectName || task.name,
          status: task.status,
          rawPrompt: task.aiAnalytics?.rawPrompt,
          enhancedPrompt: task.aiAnalytics?.enhancedPrompt,
          qualityScore: task.aiAnalytics?.qualityScore,
          enhancerCost,
          reviewerCost,
          totalCost: enhancerCost + reviewerCost,
          durationMs,
          reviewer,
          lifecycle,
          enhancerStages: task.aiAnalytics?.enhancerTelemetry?.stages || [],
        };
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [tasks]);

  const totals = useMemo(() => {
    return analytics.reduce(
      (acc, curr) => {
        acc.projects += 1;
        acc.enhancer += curr.enhancerCost;
        acc.reviewer += curr.reviewerCost;
        acc.total += curr.totalCost;
        return acc;
      },
      { projects: 0, enhancer: 0, reviewer: 0, total: 0 }
    );
  }, [analytics]);

  const filteredMessages = useMemo(() => {
    const base = Array.isArray(messages) ? messages : [];
    return base
      .filter((m) => levelFilter === "all" ? true : m.level === levelFilter)
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [messages, levelFilter]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // focus first tab on open for keyboard users
    const t = window.setTimeout(() => firstTabButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className="claude-info-wrap">
      <button
        className={`nav-action-btn${open ? " nav-action-btn--active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Command Center"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16" />
          <path d="M7 6v12" />
          <path d="M17 6v12" />
          <path d="M4 18h16" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <div className="wizard-overlay" style={{ zIndex: 99999 }}>
            <div
              className="claude-console__backdrop"
              onMouseDown={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              className="claude-console"
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.9 }}
              onMouseDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Claude Console"
            >
              <div className="claude-console__header">
                <span className="claude-console__title">Command Center</span>
                <button className="claude-console__close" onClick={() => setOpen(false)} aria-label="Close">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="claude-console__tabs" role="tablist" aria-label="Claude console tabs">
                <button
                  ref={firstTabButtonRef}
                  type="button"
                  className={`claude-console__tab${activeTab === "analytics" ? " claude-console__tab--active" : ""}`}
                  onClick={() => setActiveTab("analytics")}
                  role="tab"
                  aria-selected={activeTab === "analytics"}
                >
                  Analytics
                </button>
                <button
                  type="button"
                  className={`claude-console__tab${activeTab === "messages" ? " claude-console__tab--active" : ""}`}
                  onClick={() => setActiveTab("messages")}
                  role="tab"
                  aria-selected={activeTab === "messages"}
                >
                  Messages
                  {messages.length > 0 ? <span className="claude-console__tab-count">{messages.length}</span> : null}
                </button>
              </div>

              <div className="claude-console__body">
                {activeTab === "analytics" && (
                  <div className="claude-analytics">
                    <div className="claude-info-header">
                      <h4>Generation Analytics</h4>
                      <span>{totals.projects} projects</span>
                    </div>

                    <div className="claude-info-summary">
                      <div>Enhancer: {formatUsd(totals.enhancer)}</div>
                      <div>Reviewer: {formatUsd(totals.reviewer)}</div>
                      <div>Total: {formatUsd(totals.total)}</div>
                    </div>

                    <div className="claude-info-list">
                      {analytics.length === 0 && <p className="claude-info-empty">No AI-assisted projects yet.</p>}
                      {analytics.map((item) => (
                        <div key={item.id} className="claude-info-card">
                          <div className="claude-info-title-row">
                            <strong>{item.name}</strong>
                            <span className={`claude-status claude-status--${item.status}`}>{item.status}</span>
                          </div>
                          <div className="claude-info-grid">
                            <span>Prompt:</span>
                            <span title={item.rawPrompt}>{promptPreview(item.rawPrompt)}</span>
                            <span>Response:</span>
                            <span title={JSON.stringify(item.enhancedPrompt || {}, null, 2)}>{responsePreview(item.enhancedPrompt)}</span>
                            <span>Tokens:</span>
                            <span>
                              {item.enhancerStages.length > 0
                                ? item.enhancerStages.map((s) => `${s.stage}: ${s.usage.inputTokens + s.usage.outputTokens}`).join(" | ")
                                : "n/a"}
                            </span>
                            <span>Cost:</span>
                            <span>
                              enhancer {formatUsd(item.enhancerCost)} + reviewer {formatUsd(item.reviewerCost)} = {formatUsd(item.totalCost)}
                            </span>
                            <span>Reviewer:</span>
                            <span>
                              {item.reviewer.plan || "n/a"} • turns {item.reviewer.turns ?? "n/a"} • budget {formatUsd(item.reviewer.budgetUsd)}
                            </span>
                            <span>Passes:</span>
                            <span>
                              {item.reviewer.passes.length > 0 ? item.reviewer.passes.join(" → ") : "n/a"}
                            </span>
                            <span>Attempts:</span>
                            <span>
                              {item.lifecycle.attempts || 0} • escalations {item.lifecycle.escalations || 0} • gate {item.lifecycle.finalGate}
                            </span>
                            <span>Duration:</span>
                            <span>{formatMs(item.durationMs)}</span>
                            <span>Quality:</span>
                            <span>{item.qualityScore ?? "n/a"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "messages" && (
                  <div className="claude-messages">
                    <div className="claude-messages__toolbar">
                      <div className="claude-messages__filters" role="group" aria-label="Message level filter">
                        {(["all", "info", "success", "warning", "error"] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            className={`claude-messages__filter${levelFilter === lvl ? " claude-messages__filter--active" : ""}`}
                            onClick={() => setLevelFilter(lvl)}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                      <div className="claude-messages__actions">
                        <button type="button" className="claude-messages__action" onClick={() => onClearMessages?.()} disabled={!onClearMessages || messages.length === 0}>
                          Clear all
                        </button>
                        {levelFilter !== "all" && (
                          <button
                            type="button"
                            className="claude-messages__action"
                            onClick={() => onClearMessagesByLevel?.(levelFilter)}
                            disabled={!onClearMessagesByLevel || filteredMessages.length === 0}
                          >
                            Clear {levelFilter}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="claude-messages__list">
                      {filteredMessages.length === 0 ? (
                        <div className="claude-info-empty">No messages yet.</div>
                      ) : (
                        filteredMessages.map((m) => {
                          const isExpanded = expandedMessageId === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              className={`claude-msg claude-msg--${m.level}${isExpanded ? " claude-msg--expanded" : ""}`}
                              onClick={() => setExpandedMessageId((curr) => (curr === m.id ? null : m.id))}
                            >
                              <div className="claude-msg__row">
                                <span className="claude-msg__badge">{m.level}</span>
                                <span className="claude-msg__title">{m.title || "Status"}</span>
                                <span className="claude-msg__time">{new Date(m.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="claude-msg__body">
                                {isExpanded ? (
                                  <pre className="claude-msg__pre">{m.message}</pre>
                                ) : (
                                  <span className="claude-msg__preview">{m.message}</span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
