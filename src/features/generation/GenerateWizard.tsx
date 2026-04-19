import type { ReactBitsItem } from "../types/index";

type InstallTab = 'cli' | 'manual';
type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

interface GenerateWizardProps {
  open: boolean;
  onClose: () => void;
  selected: ReactBitsItem | null;
  lastEnhancedPrompt: any;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  projectPath: string;
  onBrowse: () => void;
  installTab: InstallTab;
  onInstallTabChange: (tab: InstallTab) => void;
  packageManager: PackageManager;
  onPackageManagerChange: (pm: PackageManager) => void;
  openWhenDone: boolean;
  onOpenWhenDoneChange: (v: boolean) => void;
  runWhenDone: boolean;
  onRunWhenDoneChange: (v: boolean) => void;
  autoKillOnError: boolean;
  onAutoKillChange: (v: boolean) => void;
  onConfirm: () => void;
}

const PM_LIST: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export default function GenerateWizard({
  open,
  onClose,
  selected,
  lastEnhancedPrompt,
  projectName,
  onProjectNameChange,
  projectPath,
  onBrowse,
  installTab,
  onInstallTabChange,
  packageManager,
  onPackageManagerChange,
  openWhenDone,
  onOpenWhenDoneChange,
  runWhenDone,
  onRunWhenDoneChange,
  autoKillOnError,
  onAutoKillChange,
  onConfirm,
}: GenerateWizardProps) {
  if (!open || (!selected && !lastEnhancedPrompt)) return null;

  const isAiBuild = !!lastEnhancedPrompt;
  const title = isAiBuild ? "Generate AI Master Project" : "Generate Demo Project";
  const subjectName = isAiBuild
    ? (lastEnhancedPrompt.projectMeta?.title || "AI Project")
    : selected?.name;

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-modal" onClick={e => e.stopPropagation()}>
        <header className="wizard-header">
          <div className="window-controls">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="wizard-body">
          <p className="wizard-subtitle">
            Generate a standalone, ready-to-run project for <strong>{subjectName}</strong>.
          </p>

          <div className="wizard-section">
            <label>Project Name</label>
            <input
              type="text"
              className="wizard-input"
              value={projectName}
              onChange={e => onProjectNameChange(e.target.value)}
              placeholder="e.g. my-cool-demo"
            />
          </div>

          <div className="wizard-section">
            <label>Save To</label>
            <div className="path-selector">
              <input type="text" className="wizard-input path-input" value={projectPath} readOnly placeholder="Click Browse to select folder..." />
              <button className="secondary-btn browse-btn" onClick={onBrowse}>Browse</button>
            </div>
          </div>

          <div className="wizard-row">
            <div className="wizard-section" style={{ flex: 1 }}>
              <label>Installation Method</label>
              <div className="sub-tabs mini">
                <button className={`sub-tab ${installTab === 'cli' ? 'active' : ''}`} onClick={() => onInstallTabChange('cli')}>CLI</button>
                <button className={`sub-tab ${installTab === 'manual' ? 'active' : ''}`} onClick={() => onInstallTabChange('manual')}>Manual</button>
              </div>
            </div>
            <div className="wizard-section" style={{ flex: 1.5 }}>
              <label>Package Manager</label>
              <div className="tertiary-tabs mini">
                {PM_LIST.map(pm => (
                  <button key={pm} className={`tertiary-tab ${packageManager === pm ? 'active' : ''}`} onClick={() => onPackageManagerChange(pm)}>{pm}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="wizard-section checkbox-section">
            <label className="checkbox-label">
              <input type="checkbox" checked={openWhenDone} onChange={e => onOpenWhenDoneChange(e.target.checked)} />
              <span>Open project automatically in VS Code when finished</span>
            </label>
          </div>

          <div className="wizard-section checkbox-section" style={{ marginTop: '-0.5rem' }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={runWhenDone} onChange={e => onRunWhenDoneChange(e.target.checked)} />
              <span>Run project automatically (npm run dev)</span>
            </label>
          </div>

          {runWhenDone && (
            <div className="wizard-section checkbox-section" style={{ marginTop: '-0.5rem', marginLeft: '1.5rem', opacity: 0.8 }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={autoKillOnError} onChange={e => onAutoKillChange(e.target.checked)} />
                <span>Auto-kill/close project if browser errors out</span>
              </label>
            </div>
          )}
        </div>

        <div className="wizard-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button
            className="primary-btn generate-btn"
            onClick={onConfirm}
            disabled={!projectName || !projectPath}
          >
            Start Generation
          </button>
        </div>
      </div>
    </div>
  );
}
