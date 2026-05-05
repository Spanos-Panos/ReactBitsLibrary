'use strict';

// Global spend cap per generation task (all stages combined).
const GLOBAL_TASK_CAP_USD = 3.0;

// Fixed budget split — these three must sum to 1.0.
const ENHANCE_FRACTION    = 0.10; // prompt enhancement
const GENERATION_FRACTION = 0.70; // AI-first generation + repair
const REWORK_FRACTION     = 0.20; // reserved for follow-up rework

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toFixedNumber(value) {
  return Number(value.toFixed(2));
}

function buildBudgetPlan() {
  const enhanceReserveUsd  = toFixedNumber(GLOBAL_TASK_CAP_USD * ENHANCE_FRACTION);
  const generationCapUsd   = toFixedNumber(GLOBAL_TASK_CAP_USD * GENERATION_FRACTION);
  const reworkCapUsd       = toFixedNumber(GLOBAL_TASK_CAP_USD * REWORK_FRACTION);

  return {
    globalCapUsd: GLOBAL_TASK_CAP_USD,
    enhanceReserveUsd,
    generationCapUsd,
    reworkCapUsd,
  };
}

function clampStageBudget(value, fallback = 1.5) {
  const safeValue = Number.isFinite(value) ? value : fallback;
  return toFixedNumber(clamp(safeValue, 0.05, GLOBAL_TASK_CAP_USD));
}

module.exports = {
  GLOBAL_TASK_CAP_USD,
  buildBudgetPlan,
  clampStageBudget,
};
