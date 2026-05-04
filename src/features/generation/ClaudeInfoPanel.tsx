import { useMemo, useState } from "react";
import type { Task } from "../../shared/types";
import "./ClaudeInfoPanel.css";

interface Props {
  tasks: Record<string, Task>;
}

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

export default function ClaudeInfoPanel({ tasks }: Props) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="claude-info-wrap">
      <button
        className={`claude-info-btn${open ? " claude-info-btn--active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Claude generation analytics"
      >
        Claude Info
      </button>

      {open && (
        <div className="claude-info-panel">
          <div className="claude-info-header">
            <h4>Claude Analytics</h4>
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
                    {item.reviewer.passes.length > 0 ? item.reviewer.passes.join(' → ') : 'n/a'}
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
    </div>
  );
}
