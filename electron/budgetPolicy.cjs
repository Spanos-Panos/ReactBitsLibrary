'use strict';

const GLOBAL_TASK_CAP_USD = 1.0;
const ENHANCE_RESERVE_USD = 0.18;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toFixedNumber(value) {
  return Number(value.toFixed(2));
}

function computeComplexityScore({ selectedComponents = [], layoutConfig = [], pages = [] }) {
  const componentFactor = clamp(selectedComponents.length / 5, 0, 1);
  const pageFactor = clamp((Math.max(1, pages.length) - 1) / 3, 0, 1);

  const layoutItems = Array.isArray(layoutConfig) ? layoutConfig : [];
  const fixedLayers = layoutItems.filter(i => i?.position === 'fixed').length;
  const animated = layoutItems.filter(i => i?.entranceAnimation && i.entranceAnimation !== 'none').length;
  const splitWidth = layoutItems.filter(i => i?.widthHint === 'half' || i?.widthHint === 'third').length;
  const layoutFactorRaw = (animated * 0.5 + splitWidth * 0.3 + fixedLayers * 0.2) / Math.max(1, layoutItems.length);
  const layoutFactor = clamp(layoutFactorRaw, 0, 1);

  return clamp(componentFactor * 0.5 + pageFactor * 0.3 + layoutFactor * 0.2, 0, 1);
}

function buildBudgetPlan({ selectedComponents = [], layoutConfig = [], pages = [] }) {
  const complexity = computeComplexityScore({ selectedComponents, layoutConfig, pages });
  const remainingAfterEnhance = clamp(GLOBAL_TASK_CAP_USD - ENHANCE_RESERVE_USD, 0.4, GLOBAL_TASK_CAP_USD);
  const generationWeight = clamp(0.6 + complexity * 0.25, 0.55, 0.85);
  const generationCapUsd = toFixedNumber(remainingAfterEnhance * generationWeight);
  const reworkCapUsd = toFixedNumber(clamp(remainingAfterEnhance - generationCapUsd, 0.15, 0.5));

  return {
    globalCapUsd: GLOBAL_TASK_CAP_USD,
    enhanceReserveUsd: ENHANCE_RESERVE_USD,
    generationCapUsd,
    reworkCapUsd,
    complexityScore: Number(complexity.toFixed(3)),
  };
}

function clampStageBudget(value, fallback = 0.5) {
  const safeValue = Number.isFinite(value) ? value : fallback;
  return toFixedNumber(clamp(safeValue, 0.05, GLOBAL_TASK_CAP_USD));
}

module.exports = {
  GLOBAL_TASK_CAP_USD,
  buildBudgetPlan,
  clampStageBudget,
};
