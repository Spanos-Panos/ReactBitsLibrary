import { useState } from "react";
import type { ReactBitsItem, ParsedInstallData } from "../types/index";

type PrimaryTab = 'code' | 'docs' | 'install';
type DocTab = 'usage' | 'install';
type InstallTab = 'cli' | 'manual';
type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

interface ComponentInspectorProps {
  selected: ReactBitsItem | null;
  componentFiles: { name: string; content: string }[];
  primaryTab: PrimaryTab;
  onPrimaryTabChange: (tab: PrimaryTab) => void;
  activeCodeFileIndex: number;
  onCodeFileChange: (index: number) => void;
  activeDocTab: DocTab;
  onDocTabChange: (tab: DocTab) => void;
  installTab: InstallTab;
  onInstallTabChange: (tab: InstallTab) => void;
  packageManager: PackageManager;
  onPackageManagerChange: (pm: PackageManager) => void;
  parsedInstallData: ParsedInstallData;
  rawInstallMarkdown: string;
  hoveredComponentId: string | null;
  filteredItems: ReactBitsItem[];
  onGenerate: () => void;
}

const PM_LIST: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export default function ComponentInspector({
  selected,
  componentFiles,
  primaryTab,
  onPrimaryTabChange,
  activeCodeFileIndex,
  onCodeFileChange,
  activeDocTab,
  onDocTabChange,
  installTab,
  onInstallTabChange,
  packageManager,
  onPackageManagerChange,
  parsedInstallData,
  rawInstallMarkdown,
  hoveredComponentId,
  filteredItems,
  onGenerate,
}: ComponentInspectorProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    let content = "";
    if (primaryTab === 'code') content = componentFiles[activeCodeFileIndex]?.content || "";
    else if (primaryTab === 'docs') content = activeDocTab === 'usage' ? (selected?.usageMarkdown || "") : rawInstallMarkdown;
    else content = installTab === 'manual'
      ? (parsedInstallData.manual[packageManager] || "")
      : (parsedInstallData.cli[packageManager] || "");
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!selected) {
    return (
      <div className="component-preview-pane">
        <div className="preview-placeholder">
          <header className="preview-header">
            <h3>
              {hoveredComponentId
                ? (filteredItems.find(i => i.id === hoveredComponentId)?.name || 'Preview')
                : 'Select a component'}
            </h3>
            <div className="mock-tabs" style={{ opacity: hoveredComponentId ? 1 : 0.3, transition: 'opacity 0.3s' }}>
              <span className="mock-tab active">React</span>
              <span className="mock-tab">CSS</span>
              <span className="mock-tab">Tailwind</span>
            </div>
          </header>
          <div className="preview-box">
            <span className="preview-text">
              {hoveredComponentId ? 'Click to view code and information' : 'Hover over a component to view information'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="component-preview-pane">
      <div className="preview-content-active">
        <header className="preview-header">
          <div className="header-title-column">
            <h3>{selected.name}</h3>
            <span className="category-comment">// {selected.category}</span>
          </div>
          <div className="inspector-tabs primary-level">
            <div className={`inspector-tab ${primaryTab === 'code' ? 'active' : ''}`} onClick={() => onPrimaryTabChange('code')}>Code</div>
            <div className={`inspector-tab ${primaryTab === 'docs' ? 'active' : ''}`} onClick={() => onPrimaryTabChange('docs')}>Docs</div>
            <div className={`inspector-tab ${primaryTab === 'install' ? 'active' : ''}`} onClick={() => onPrimaryTabChange('install')}>Install</div>
          </div>
        </header>

        {primaryTab === 'code' && componentFiles.length > 0 && (
          <div className="inspector-tabs secondary-level">
            {componentFiles.map((f, i) => (
              <div key={i} className={`inspector-tab ${activeCodeFileIndex === i ? "active" : ""}`} onClick={() => onCodeFileChange(i)}>
                {f.name}
              </div>
            ))}
          </div>
        )}

        {primaryTab === 'docs' && (
          <div className="inspector-tabs secondary-level">
            <div className={`inspector-tab ${activeDocTab === 'usage' ? "active" : ""}`} onClick={() => onDocTabChange('usage')}>usage.md</div>
            <div className={`inspector-tab ${activeDocTab === 'install' ? "active" : ""}`} onClick={() => onDocTabChange('install')}>install.md</div>
          </div>
        )}

        {primaryTab === 'install' ? (
          <div className="installation-panel">
            <div className="sub-tabs">
              <button className={`sub-tab ${installTab === 'cli' ? 'active' : ''}`} onClick={() => onInstallTabChange('cli')}>CLI</button>
              <button className={`sub-tab ${installTab === 'manual' ? 'active' : ''}`} onClick={() => onInstallTabChange('manual')}>Manual</button>
            </div>
            <div className="tertiary-tabs">
              {PM_LIST.map((pm) => (
                <button key={pm} className={`tertiary-tab ${packageManager === pm ? 'active' : ''}`} onClick={() => onPackageManagerChange(pm)}>{pm}</button>
              ))}
            </div>
            <div className="code-viewer preview-code-box installation-code-box">
              <pre className="code-view">
                {installTab === 'manual'
                  ? (parsedInstallData.manual[packageManager] || `// No manual instructions found for ${packageManager}.`)
                  : (parsedInstallData.cli[packageManager] || `# No CLI command found for ${packageManager}.\nnpx react-bits add ${selected.id}`)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="code-viewer preview-code-box">
            <pre className="code-view">
              {primaryTab === 'docs'
                ? (activeDocTab === 'usage' ? selected.usageMarkdown : rawInstallMarkdown)
                : (componentFiles[activeCodeFileIndex]?.content || "No source code loaded.")}
            </pre>
          </div>
        )}

        <div className="action-buttons preview-actions">
          <button className="primary-btn" onClick={onGenerate}>
            Generate Project with {selected.name}
          </button>
          <button
            className={`secondary-btn ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
            style={isCopied ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', borderColor: '#22c55e' } : {}}
          >
            {isCopied ? "Copied!" : "Copy Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
