const { generatePlayground } = require('./DemoCLI/index.cjs');

const payload = {
  options: {
    projectPath: __dirname,
    projectName: 'test-minimal-landing-2',
    packageManager: 'npm',
    styleDirection: {
      aesthetics: ['Minimal'],
      siteType: 'Landing'
    },
    designRules: {
      colors: { primary: '#000000', secondary: '#ffffff', background: '#f5f5f5', text: '#333333', accent: '#ff0000' },
      fonts: { heading: 'Inter', body: 'Inter' },
      sizes: { optimizationTarget: 'adaptive' }
    },
    clientBrief: {
      brandName: 'TestBrand',
      tagline: 'We test things',
      callToAction: 'Click Me'
    },
    pages: [{ id: 'page-1', title: 'Home', type: 'home', componentIds: [] }],
    aiSupport: false,
    runWhenDone: false,
    openWhenDone: false
  },
  selectedComponents: [],
  enhancedPrompt: null
};

generatePlayground(payload, null, 'task-1').then(res => {
  console.log('Result:', res);
  process.exit(res.success ? 0 : 1);
});
