const assert = require('assert');
const { buildBudgetPlan, clampStageBudget, GLOBAL_TASK_CAP_USD } = require('../electron/budgetPolicy.cjs');

function testBudgetPlanBounds() {
  const plan = buildBudgetPlan({
    selectedComponents: new Array(5).fill(0).map((_, i) => ({ name: `Comp${i}` })),
    layoutConfig: [
      { position: 'fixed' },
      { position: 'in-flow', entranceAnimation: 'slide-up', widthHint: 'half' },
      { position: 'in-flow', entranceAnimation: 'fade-in', widthHint: 'third' },
    ],
    pages: [{}, {}, {}, {}],
  });

  assert(plan.globalCapUsd <= GLOBAL_TASK_CAP_USD, 'Global cap exceeds $1.00');
  assert(plan.generationCapUsd > 0, 'Generation cap must be positive');
  assert(plan.reworkCapUsd > 0, 'Rework cap must be positive');
  assert((plan.generationCapUsd + plan.reworkCapUsd + plan.enhanceReserveUsd) <= 1.01, 'Planned budgets exceed global cap envelope');
}

function testClampStageBudget() {
  assert.strictEqual(clampStageBudget(10), 1.0, 'Budget should clamp to $1.00 max');
  assert.strictEqual(clampStageBudget(-2), 0.05, 'Budget should clamp to minimum positive bound');
  assert.strictEqual(clampStageBudget(NaN, 0.4), 0.4, 'Fallback should be used for invalid input');
}

function run() {
  testBudgetPlanBounds();
  testClampStageBudget();
  console.log('budgetPolicy tests passed');
}

run();
