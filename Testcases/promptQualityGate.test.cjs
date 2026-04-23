const assert = require('assert');
const { _internals } = require('../electron/promptEnhancer.cjs');

function buildValidPrompt() {
  return {
    projectMeta: { title: 'Race Palace', mood: 'editorial' },
    designTokens: { colors: { primary: '#111111' } },
    siteArchitecture: {
      sections: [
        { id: 'hero', componentRef: 'HeroCard', props: {}, content: { headline: 'Performance telemetry suite', body: 'Track lap analytics, pit strategy, and sponsor ROI in one dashboard.' } },
        { id: 'features', componentRef: 'FeatureGrid', props: {}, content: { headline: 'Race-day operations', body: 'Service catalog with tire, fuel, and crew scheduling modules.' } },
        { id: 'cta', componentRef: 'CtaStrip', props: {}, content: { headline: 'Book a launch review', body: 'Get a 30 minute architecture review with our motorsport UX team.' } },
      ],
    },
    technicalRequirements: {
      dependencies: ['framer-motion'],
      layoutStrategy: 'Hero-first narrative with max-width 1200px and staggered content rhythm.',
    },
    generatorSteps: ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'],
  };
}

function run() {
  const selected = [{ name: 'HeroCard' }, { name: 'FeatureGrid' }, { name: 'CtaStrip' }];
  const valid = buildValidPrompt();

  const shapeValid = _internals.validateEnhancedPromptShape(valid, selected);
  assert.strictEqual(shapeValid.ok, true, 'Expected valid prompt shape to pass');

  const score = _internals.scoreEnhancedPromptQuality(valid);
  assert(score.score >= 78, 'Expected quality score to meet threshold');

  const invalid = { ...valid, siteArchitecture: { sections: [{ id: '', componentRef: '' }] }, generatorSteps: ['a'] };
  const shapeInvalid = _internals.validateEnhancedPromptShape(invalid, selected);
  assert.strictEqual(shapeInvalid.ok, false, 'Expected invalid prompt shape to fail');
  assert(shapeInvalid.issues.length > 0, 'Expected shape issues for invalid prompt');

  console.log('prompt quality gate tests passed');
}

run();
