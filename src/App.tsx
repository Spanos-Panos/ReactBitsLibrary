import { useEffect, useMemo, useState, useRef } from "react";
import manifest from "./reactbits-manifest.json";
import Iridescence from "./components/Backgrounds/Iridescence/Iridescence";
import GradientText from "./components/TextAnimations/GradientText/GradientText";
import FlowingMenu from "./components/Components/FlowingMenu/FlowingMenu";
import PillNav from "./components/Components/PillNav/PillNav";
import SplitText from "./components/TextAnimations/SplitText/SplitText";
import ProjectBuilderPanel from "./components/ProjectBuilderPanel";
import "./TaskStyles.css";

interface Task {
  id: string;
  name: string;
  projectName: string;
  progress: string;
  logs: string[];
  status: 'running' | 'success' | 'error';
  error?: string;
  path?: string;
}

type ReactBitsItem = (typeof manifest)[number];

const CATEGORY_LABELS: Record<string, string> = {
  Components: "Components",
  Animations: "Animations",
  Backgrounds: "Backgrounds",
  TextAnimations: "Text animations",
};

function groupByCategory(items: ReactBitsItem[]): Record<string, ReactBitsItem[]> {
  return items.reduce<Record<string, ReactBitsItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

const GRADIENT_COLORS = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"];

const PILL_NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'Components', label: 'Components' },
  { id: 'Animations', label: 'Animations' },
  { id: 'TextAnimations', label: 'Text Animations' },
  { id: 'Backgrounds', label: 'Backgrounds' }
];

const IRIDESCENCE_COLOR: [number, number, number] = [0, 0.7, 0.7];

function App() {
  const [items] = useState<ReactBitsItem[]>(manifest);
  const [view, setView] = useState<"gallery" | "detail">("gallery");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [componentFiles, setComponentFiles] = useState<{ name: string; content: string }[]>([]);
  const [primaryTab, setPrimaryTab] = useState<'code' | 'docs' | 'install'>('code');
  const [activeCodeFileIndex, setActiveCodeFileIndex] = useState(0);
  const [activeDocTab, setActiveDocTab] = useState<'usage' | 'install'>('usage');
  const [installTab, setInstallTab] = useState<"cli" | "manual">("cli");
  const [packageManager, setPackageManager] = useState<"pnpm" | "npm" | "yarn" | "bun">("pnpm");
  const [generateStatus, setGenerateStatus] = useState<string>("");
  const [toastType, setToastType] = useState<"info" | "warning" | "success">("info");
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [showGenerateWizard, setShowGenerateWizard] = useState(false);
  
  // Multi-Tasking State
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const terminalRef = useRef<HTMLPreElement>(null);
  const [projectName, setProjectName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [openWhenDone, setOpenWhenDone] = useState(true);
  const [runWhenDone, setRunWhenDone] = useState(false);
  const [parsedInstallData, setParsedInstallData] = useState<{
    cli: Record<string, string>;
    manual: Record<string, string>;
  }>({ cli: {}, manual: {} });
  const [rawInstallMarkdown, setRawInstallMarkdown] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // V0.2.1 Multi-Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [projectPrompt, setProjectPrompt] = useState("");

  const CATEGORY_LIMITS: Record<string, number> = {
    Backgrounds: 1,
    TextAnimations: 2,
    Animations: 3,
    Components: 5
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      return activeCategory === "all" || item.category === activeCategory;
    });
  }, [items, activeCategory]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const selectedComponents = useMemo(() => {
    return selectedIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ReactBitsItem[];
  }, [selectedIds, items]);

  useEffect(() => {
    if (selected && (window as any).reactBitsApi?.getComponentFiles) {
      let files = (window as any).reactBitsApi.getComponentFiles(selected.category, selected.name);
      files = files
        .filter((f: any) => !f.name.endsWith('.md'))
        .sort((a: any, b: any) => {
          const aIsMain = a.name.endsWith('.tsx') || a.name.endsWith('.jsx');
          const bIsMain = b.name.endsWith('.tsx') || b.name.endsWith('.jsx');
          const aIsCss = a.name.endsWith('.css');
          const bIsCss = b.name.endsWith('.css');
          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;
          if (aIsCss && !bIsCss) return -1;
          if (!aIsCss && bIsCss) return 1;
          return a.name.localeCompare(b.name);
        });
      setComponentFiles(files);
      setActiveCodeFileIndex(0);
    } else {
      setComponentFiles([]);
      setActiveCodeFileIndex(0);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selected) {
      setParsedInstallData({ cli: {}, manual: {} });
      setRawInstallMarkdown("");
      return;
    }
    const installPath = `ReactBitsComponents/${selected.id}/${selected.name}Install.md`;
    fetch(installPath)
      .then(res => res.text())
      .then(text => {
        setRawInstallMarkdown(text);
        const data: { cli: Record<string, string>; manual: Record<string, string> } = { cli: {}, manual: {} };
        let currentBlock: 'cli' | 'manual' | null = null;
        const lines = text.split(/\r?\n/);
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.toLowerCase() === 'cli') currentBlock = 'cli';
          else if (trimmed.toLowerCase() === 'manual') currentBlock = 'manual';
          else if (trimmed.includes('=') && currentBlock) {
            const eqIndex = trimmed.indexOf('=');
            const k = trimmed.substring(0, eqIndex).trim().toLowerCase();
            const v = trimmed.substring(eqIndex + 1).trim();
            if (k && v) data[currentBlock][k] = v;
          }
        });
        setParsedInstallData(data);
      })
      .catch(() => {
        setParsedInstallData({ cli: {}, manual: {} });
        setRawInstallMarkdown("// Failed to load installation instructions.");
      });
  }, [selected]);

  useEffect(() => {
    if ((window as any).reactBitsApi?.onGenerateProgress) {
      (window as any).reactBitsApi.onGenerateProgress((msg: string, taskId: string) => {
        setTasks(prev => {
          if (!prev[taskId]) return prev;
          return {
            ...prev,
            [taskId]: { ...prev[taskId], progress: msg }
          };
        });
      });
    }
    if ((window as any).reactBitsApi?.onGenerateLog) {
      (window as any).reactBitsApi.onGenerateLog((msg: string, taskId: string) => {
        setTasks(prev => {
          if (!prev[taskId]) return prev;
          return {
            ...prev,
            [taskId]: {
              ...prev[taskId],
              logs: [...prev[taskId].logs.slice(-300), msg]
            }
          };
        });
      });
    }
  }, []);

  useEffect(() => {
    if (activeTaskId && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [tasks, activeTaskId]);

  const handleSelectComponent = (id: string) => {
    setSelectedId(id);
    setGenerateStatus("");
    setPrimaryTab('code');
    setActiveCodeFileIndex(0);
    setActiveDocTab('usage');
    setInstallTab('cli');
  };

  const handleBackToGallery = () => setView("gallery");

  const handleGenerate = () => {
    if (selected) setProjectName(`rb-demo-${selected.name.toLowerCase().replace(/\s+/g, '-')}`);
    setShowGenerateWizard(true);
  };

  const handleSelectDirectory = async () => {
    if (!(window as any).reactBitsApi?.selectDirectory) return;
    const path = await (window as any).reactBitsApi.selectDirectory();
    if (path) setProjectPath(path);
  };

  const confirmGenerate = async () => {
    if (!selected || !projectPath || !(window as any).reactBitsApi?.generatePlayground) return;
    
    const currentTasksCount = Object.keys(tasks).length;
    if (currentTasksCount >= 5) {
      setToastType("warning");
      setGenerateStatus("Task limit reached (max 5). Please close completed tasks first!");
      setTimeout(() => setGenerateStatus(""), 4000);
      return;
    }

    const taskId = Date.now().toString();
    const newTask: Task = {
      id: taskId,
      name: selected.name,
      projectName,
      progress: "Initializing project generation...",
      logs: ["Initializing Build Environment...\n"],
      status: 'running'
    };

    setTasks(prev => ({ ...prev, [taskId]: newTask }));
    setActiveTaskId(null); // Auto-hide: Don't set active taskId, so it starts in background
    setShowGenerateWizard(false);
    setGenerateStatus("");

    try {
      const result = await (window as any).reactBitsApi.generatePlayground(
        selected.category, selected.name, selected.usageMarkdown, componentFiles,
        { installMethod: installTab, packageManager, installData: parsedInstallData, projectName, projectPath, openWhenDone, runWhenDone },
        taskId
      );

      if (result.success) {
        const finalStatus = runWhenDone ? 'running' : 'success';
        const finalProgress = runWhenDone ? "Local Server Running! (Check Browser)" : "Generation Complete!";
        
        setTasks(prev => ({
          ...prev,
          [taskId]: { 
            ...prev[taskId], 
            status: finalStatus, 
            progress: finalProgress,
            path: result.path 
          }
        }));
        setGenerateStatus(result.message || "Success!");
      } else {
        setTasks(prev => ({
          ...prev,
          [taskId]: { ...prev[taskId], status: 'error', progress: "Error occurred", error: result.error }
        }));
        setGenerateStatus(`Failed: ${result.error || "Unknown error"}`);
      }
    } catch (e: any) {
      setTasks(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], status: 'error', progress: "Crash!", error: e.message }
      }));
      setGenerateStatus(`Error: ${e.message}`);
    }
    setTimeout(() => setGenerateStatus(""), 8000);
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(curr => curr !== id));
    } else {
      const categoryCount = selectedIds.filter(sid => items.find(i => i.id === sid)?.category === item.category).length;
      const limit = CATEGORY_LIMITS[item.category] || 99;
      if (categoryCount >= limit) {
        setToastType("warning");
        setGenerateStatus(`Limit reached! You can only select up to ${limit} ${item.category}.`);
        setTimeout(() => setGenerateStatus(""), 5000);
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBuilderGenerate = async () => {
    if (!projectPrompt.trim()) {
      setToastType("warning");
      setGenerateStatus("Please enter a prompt for your project!");
      setTimeout(() => setGenerateStatus(""), 4000);
      return;
    }
    if (selectedComponents.length === 0) {
      setToastType("warning");
      setGenerateStatus("Please select at least one component!");
      setTimeout(() => setGenerateStatus(""), 4000);
      return;
    }
    setGenerateStatus("Scavenging component source code...");
    try {
      // 1. GATHER CONTEXT
      const componentsWithContext = await Promise.all(
        selectedComponents.map(async (comp) => {
          try {
            return await (window as any).reactBitsApi.getComponentFullContext(comp.category, comp.name, comp.id);
          } catch (e) {
            console.warn(`Failed to gather context for ${comp.name}`, e);
            return { id: comp.id, name: comp.name, category: comp.category };
          }
        })
      );

      // 2. TRIGGER AI ARCHITECT (It will save both original & enhanced files)
      setGenerateStatus("AI Architect is designing your project...");
      const enhanceResult = await (window as any).reactBitsApi.enhancePrompt({
        rawPrompt: projectPrompt,
        selectedComponents: componentsWithContext,
        systemContext: {
          framework: "Vite + React (TypeScript)",
          styling: "Tailwind CSS v4",
          icons: "Lucide React",
          animations: ["Framer Motion", "GSAP"],
          architectureRules: [
            "Use literal HEX codes (#XXXXXX) for WebGL/Canvas component props.",
            "Maintain a Z-Index strategy where Backgrounds stay at Z:0.",
            "Use Lucide React for iconography."
          ]
        }
      });

      if (enhanceResult.success) {
        setGenerateStatus("Project Design Ready! (Synced snapshots saved)");
        setToastType("success");
      } else {
        setToastType("warning");
        setGenerateStatus(`AI Error: ${enhanceResult.error}`);
      }
    } catch (err: any) {
      setToastType("warning");
      setGenerateStatus(`Error: ${err.message}`);
    }
    setTimeout(() => setGenerateStatus(""), 5000);
  };

  return (
    <div className="app-root">
      <div className="background-container">
        <Iridescence color={IRIDESCENCE_COLOR} mouseReact={false} amplitude={0.1} speed={0.3} />
      </div>

      <div className="scene-container">
        <section className={`scene ${view === "gallery" ? "" : "hidden-left"}`}>
          <main className={`gallery-container ${activeCategory === "all" ? "no-scroll" : ""}`}>
            <div className="filter-bar">
              <GradientText colors={GRADIENT_COLORS} animationSpeed={10} showBorder={false} className="modern-title">
                ReactBits Explorer
              </GradientText>
            </div>

            <div className="comp-showcase-container">
              {activeCategory === "all" ? (
                <FlowingMenu
                  items={Object.keys(CATEGORY_LABELS).map(cat => ({
                    text: CATEGORY_LABELS[cat],
                    onClick: () => setActiveCategory(cat)
                  }))}
                />
              ) : (
                <div className="sub-menu-container">
                  <div className="back-nav-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                    <PillNav
                      items={PILL_NAV_ITEMS}
                      activeId={activeCategory}
                      onItemClick={(id: string) => {
                        if (id === 'home') setActiveCategory('all');
                        else setActiveCategory(id);
                      }}
                      baseColor="#94a3b8" pillColor="rgba(15, 23, 42, 0.6)" hoveredPillTextColor="#ffffff" pillTextColor="#e2e8f0"
                    />
                  </div>

                  <div className="split-view-container">
                    <div className="component-list-pane" onMouseLeave={() => setHoveredComponentId(null)}>
                      {filtered.map((item) => (
                        <div
                          key={item.id}
                          className={`split-list-item ${hoveredComponentId === item.id ? 'hovered' : ''} ${selectedId === item.id ? 'active' : ''}`}
                          onMouseEnter={() => setHoveredComponentId(item.id)}
                          onClick={() => handleSelectComponent(item.id)}
                        >
                          <div className="split-list-item-content">
                            <span className="split-list-item-title">{item.name}</span>
                          </div>
                          
                          <div className="selection-container">
                            <div 
                              className="checkbox-custom" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(item.id, e);
                              }}
                            >
                              <input type="checkbox" checked={selectedIds.includes(item.id)} readOnly />
                              <span className="checkmark"></span>
                            </div>
                            <span className="split-list-item-arrow">→</span>
                          </div>
                        </div>
                      ))}
                      {filtered.length === 0 && <div className="empty-state"><p>No components found.</p></div>}
                    </div>

                    <div className="component-preview-pane">
                      {selected ? (
                        <div className="preview-content-active">
                          <header className="preview-header">
                            <div className="header-title-column">
                              <h3>{selected.name}</h3>
                              <span className="category-comment">// {selected.category}</span>
                            </div>
                            <div className="inspector-tabs primary-level">
                              <div className={`inspector-tab ${primaryTab === 'code' ? 'active' : ''}`} onClick={() => setPrimaryTab('code')}>Code</div>
                              <div className={`inspector-tab ${primaryTab === 'docs' ? 'active' : ''}`} onClick={() => setPrimaryTab('docs')}>Docs</div>
                              <div className={`inspector-tab ${primaryTab === 'install' ? 'active' : ''}`} onClick={() => setPrimaryTab('install')}>Install</div>
                            </div>
                          </header>

                          {primaryTab === 'code' && componentFiles.length > 0 && (
                            <div className="inspector-tabs secondary-level">
                              {componentFiles.map((f, i) => (
                                <div key={i} className={`inspector-tab ${activeCodeFileIndex === i ? "active" : ""}`} onClick={() => setActiveCodeFileIndex(i)}>{f.name}</div>
                              ))}
                            </div>
                          )}

                          {primaryTab === 'docs' && (
                            <div className="inspector-tabs secondary-level">
                              <div className={`inspector-tab ${activeDocTab === 'usage' ? "active" : ""}`} onClick={() => setActiveDocTab('usage')}>usage.md</div>
                              <div className={`inspector-tab ${activeDocTab === 'install' ? "active" : ""}`} onClick={() => setActiveDocTab('install')}>install.md</div>
                            </div>
                          )}

                          {primaryTab === 'install' ? (
                            <div className="installation-panel">
                              <div className="sub-tabs">
                                <button className={`sub-tab ${installTab === 'cli' ? 'active' : ''}`} onClick={() => setInstallTab('cli')}>CLI</button>
                                <button className={`sub-tab ${installTab === 'manual' ? 'active' : ''}`} onClick={() => setInstallTab('manual')}>Manual</button>
                              </div>
                              <div className="tertiary-tabs">
                                {["pnpm", "npm", "yarn", "bun"].map((pm) => (
                                  <button key={pm} className={`tertiary-tab ${packageManager === pm ? 'active' : ''}`} onClick={() => setPackageManager(pm as any)}>{pm}</button>
                                ))}
                              </div>
                              <div className="code-viewer preview-code-box installation-code-box">
                                <pre className="code-view">
                                  {installTab === 'manual' ? (parsedInstallData.manual[packageManager] || `// No manual instructions found for ${packageManager}.`) : (parsedInstallData.cli[packageManager] || `# No CLI command found for ${packageManager}.\nnpx react-bits add ${selected.id}`)}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="code-viewer preview-code-box">
                              <pre className="code-view">
                                {primaryTab === 'docs' ? (activeDocTab === 'usage' ? selected.usageMarkdown : rawInstallMarkdown) : (componentFiles[activeCodeFileIndex]?.content || "No source code loaded.")}
                              </pre>
                            </div>
                          )}

                          <div className="action-buttons preview-actions">
                            <button className="primary-btn" onClick={handleGenerate}>Generate Project with {selected.name}</button>
                            <button
                              className={`secondary-btn ${isCopied ? 'copied' : ''}`}
                              onClick={() => {
                                let content = "";
                                if (primaryTab === 'code') content = componentFiles[activeCodeFileIndex]?.content || "";
                                else if (primaryTab === 'docs') content = activeDocTab === 'usage' ? selected.usageMarkdown : rawInstallMarkdown;
                                else content = installTab === 'manual' ? (parsedInstallData.manual[packageManager] || "") : (parsedInstallData.cli[packageManager] || "");
                                navigator.clipboard.writeText(content);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                              }}
                              style={isCopied ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', borderColor: '#22c55e' } : {}}
                            >
                              {isCopied ? "Copied!" : "Copy Code"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="preview-placeholder">
                          <header className="preview-header">
                            <h3>{hoveredComponentId ? (filtered.find(i => i.id === hoveredComponentId)?.name || 'Preview') : 'Select a component'}</h3>
                            <div className="mock-tabs" style={{ opacity: hoveredComponentId ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                              <span className="mock-tab active">React</span>
                              <span className="mock-tab">CSS</span>
                              <span className="mock-tab">Tailwind</span>
                            </div>
                          </header>
                          <div className="preview-box">
                            <span className="preview-text">{hoveredComponentId ? 'Click to view code and information' : 'Hover over a component to view information'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <ProjectBuilderPanel
                      selectedComponents={selectedComponents}
                      categoryLimits={CATEGORY_LIMITS}
                      prompt={projectPrompt}
                      onPromptChange={setProjectPrompt}
                      onGenerate={handleBuilderGenerate}
                      onRestoreFromHistory={(p: string, sels: any[]) => {
                        setProjectPrompt(p);
                        setSelectedIds(sels.map((s: any) => s.id));
                        setGenerateStatus("Restored project from history!");
                        setTimeout(() => setGenerateStatus(""), 3000);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </main>
        </section>
      </div>

      {showGenerateWizard && selected && (
        <div className="wizard-overlay" onClick={() => setShowGenerateWizard(false)}>
          <div className="wizard-modal" onClick={e => e.stopPropagation()}>
            <header className="wizard-header">
              <div className="window-controls"><span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span></div>
              <h2>Generate Demo Project</h2>
              <button className="close-btn" onClick={() => setShowGenerateWizard(false)}>&times;</button>
            </header>
            <div className="wizard-body">
              <p className="wizard-subtitle">Generate a standalone, ready-to-run project for <strong>{selected.name}</strong>.</p>
              <div className="wizard-section">
                <label>Project Name</label>
                <input type="text" className="wizard-input" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. my-cool-demo" />
              </div>
              <div className="wizard-section">
                <label>Save To</label>
                <div className="path-selector">
                  <input type="text" className="wizard-input path-input" value={projectPath} readOnly placeholder="Click Browse to select folder..." />
                  <button className="secondary-btn browse-btn" onClick={handleSelectDirectory}>Browse</button>
                </div>
              </div>
              <div className="wizard-row">
                <div className="wizard-section" style={{ flex: 1 }}>
                  <label>Installation Method</label>
                  <div className="sub-tabs mini">
                    <button className={`sub-tab ${installTab === 'cli' ? 'active' : ''}`} onClick={() => setInstallTab('cli')}>CLI</button>
                    <button className={`sub-tab ${installTab === 'manual' ? 'active' : ''}`} onClick={() => setInstallTab('manual')}>Manual</button>
                  </div>
                </div>
                <div className="wizard-section" style={{ flex: 1.5 }}>
                  <label>Package Manager</label>
                  <div className="tertiary-tabs mini">
                    {["pnpm", "npm", "yarn", "bun"].map((pm) => (
                      <button key={pm} className={`tertiary-tab ${packageManager === pm ? 'active' : ''}`} onClick={() => setPackageManager(pm as any)}>{pm}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="wizard-section checkbox-section">
                <label className="checkbox-label"><input type="checkbox" checked={openWhenDone} onChange={(e) => setOpenWhenDone(e.target.checked)} /><span>Open project automatically in VS Code when finished</span></label>
              </div>
              <div className="wizard-section checkbox-section" style={{ marginTop: '-0.5rem' }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={runWhenDone} onChange={(e) => setRunWhenDone(e.target.checked)} />
                  <span>Run project automatically (npm run dev)</span>
                </label>
              </div>
            </div>
            <div className="wizard-actions">
              <button className="secondary-btn" onClick={() => setShowGenerateWizard(false)}>Cancel</button>
              <button className="primary-btn generate-btn" onClick={confirmGenerate} disabled={!projectName || !projectPath}>Start Generation</button>
            </div>
          </div>
        </div>
      )}

      {activeTaskId && tasks[activeTaskId] && (
        <div className="loading-overlay">
          <div className="loading-content expanded">
            {tasks[activeTaskId].status === 'running' && <div className="spinner"></div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              <h3 style={{ margin: 0 }}>{tasks[activeTaskId].status === 'running' ? 'Generating Project...' : 'Generation Result'}</h3>
              {tasks[activeTaskId].status !== 'running' && (
                <button className="secondary-btn mini" onClick={() => setActiveTaskId(null)}>Close Overlay</button>
              )}
            </div>
            <p className="loading-progress-text">{tasks[activeTaskId].progress}</p>
            <div className="terminal-container">
              <div className="terminal-header">
                <div className="window-controls mini"><span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span></div>
                <span className="terminal-title">bash - build ({tasks[activeTaskId].name})</span>
                <button className="hide-btn" onClick={() => setActiveTaskId(null)}>Hide</button>
              </div>
              <pre className="terminal-body" ref={terminalRef}>{tasks[activeTaskId].logs.map((log, i) => <span key={i}>{log}</span>)}</pre>
            </div>
          </div>
        </div>
      )}

      {Object.keys(tasks).length > 0 && (
        <div className="task-bar">
          <span style={{ fontSize: '12px', opacity: 0.6, marginRight: '8px' }}>Active Tasks:</span>
          {Object.values(tasks).map(task => (
            <div 
              key={task.id} 
              className={`task-bar-item ${task.status} ${activeTaskId === task.id ? 'active' : ''}`}
              onClick={() => setActiveTaskId(task.id)}
            >
              <div className="status-dot"></div>
              <span className="task-name">{task.name} ({task.projectName})</span>
              {(task.status === 'success' || task.status === 'error' || task.status === 'running') && (
                <span 
                  className="close-task" 
                  title="Terminate process and clear task"
                  onClick={async (e) => {
                    e.stopPropagation();
                    // Always try to terminate the associated process if any
                    if ((window as any).reactBitsApi?.terminateTask) {
                      await (window as any).reactBitsApi.terminateTask(task.id);
                    }
                    setTasks(prev => {
                      const next = { ...prev };
                      delete next[task.id];
                      return next;
                    });
                    if (activeTaskId === task.id) setActiveTaskId(null);
                  }}
                >
                  &times;
                </span>
              )}
            </div>
          ))}
          <button 
            className="secondary-btn mini" 
            style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px' }}
            onClick={async () => {
              if ((window as any).reactBitsApi?.terminateTask) {
                // Terminate all processes
                for (const taskId of Object.keys(tasks)) {
                  await (window as any).reactBitsApi.terminateTask(taskId);
                }
              }
              setTasks({});
              setActiveTaskId(null);
            }}
          >
            CLEAR ALL
          </button>
        </div>
      )}
      {generateStatus && <div className={`status-toast ${toastType}`}>{generateStatus}</div>}
    </div>
  );
}

export default App;