import { useEffect, useMemo, useState } from "react";
import type { ReactBitsItem } from "./types/index";
import "./types/api";
import { useComponentLoader }   from "./hooks/useComponentLoader";
import { useTaskManager }       from "./hooks/useTaskManager";
import { useGenerationWizard }  from "./hooks/useGenerationWizard";
import Iridescence from "./components/Backgrounds/Iridescence/Iridescence";
import GradientText from "./components/TextAnimations/GradientText/GradientText";
import FlowingMenu from "./components/Components/FlowingMenu/FlowingMenu";
import PillNav from "./components/Components/PillNav/PillNav";
import ProjectBuilderPanel, { DEFAULT_DESIGN_RULES, type DesignRules } from "./components/ProjectBuilderPanel";
import LayoutConceptPicker from "./components/LayoutConceptPicker";
import type { LayoutConcept } from "./lib/layoutConceptGenerator";
import PresetManager, { type SavedPreset } from "./components/PresetManager";
import AddComponentModal from "./components/AddComponentModal";
import ComponentListPane from "./views/ComponentListPane";
import ComponentInspector from "./views/ComponentInspector";
import GenerateWizard from "./views/GenerateWizard";
import TaskOverlay from "./views/TaskOverlay";
import TaskBar from "./views/TaskBar";

const CATEGORY_LABELS: Record<string, string> = {
  Components: "Components",
  Animations: "Animations",
  Backgrounds: "Backgrounds",
  TextAnimations: "Text animations",
};

const CATEGORY_LIMITS: Record<string, number> = {
  Backgrounds: 1, TextAnimations: 2, Animations: 3, Components: 5,
};

const GRADIENT_COLORS = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"];
const PILL_NAV_ITEMS = [
  { id: 'home',           label: 'Home' },
  { id: 'Components',     label: 'Components' },
  { id: 'Animations',     label: 'Animations' },
  { id: 'TextAnimations', label: 'Text Animations' },
  { id: 'Backgrounds',    label: 'Backgrounds' },
];
const IRIDESCENCE_COLOR: [number, number, number] = [0, 0.7, 0.7];

function App() {
  // ── Hooks ─────────────────────────────────────────────────────────────────
  const {
    items, setItems,
    selectedId, setSelectedId,
    selected,
    componentFiles,
    parsedInstallData,
    rawInstallMarkdown,
  } = useComponentLoader();

  const {
    tasks, setTasks,
    activeTaskId, setActiveTaskId,
    activeTaskIdRef,
    terminalRef,
  } = useTaskManager();

  const {
    showGenerateWizard, setShowGenerateWizard,
    projectName,        setProjectName,
    projectPath,
    installTab,         setInstallTab,
    packageManager,     setPackageManager,
    openWhenDone,       setOpenWhenDone,
    runWhenDone,        setRunWhenDone,
    autoKillOnError,    setAutoKillOnError,
    handleSelectDirectory,
  } = useGenerationWizard();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [selectedIds,          setSelectedIds]          = useState<string[]>([]);
  const [activeCategory,       setActiveCategory]       = useState<string | "all">("all");
  const [hoveredComponentId,   setHoveredComponentId]   = useState<string | null>(null);
  const [searchQuery,          setSearchQuery]          = useState("");
  const [showAddModal,         setShowAddModal]         = useState(false);

  const [primaryTab,           setPrimaryTab]           = useState<'code' | 'docs' | 'install'>('code');
  const [activeCodeFileIndex,  setActiveCodeFileIndex]  = useState(0);
  const [activeDocTab,         setActiveDocTab]         = useState<'usage' | 'install'>('usage');

  const [projectPrompt,        setProjectPrompt]        = useState("");
  const [designRules,          setDesignRules]          = useState<DesignRules>(DEFAULT_DESIGN_RULES);
  const [layoutConcept,        setLayoutConcept]        = useState<LayoutConcept | null>(null);
  const [showLayoutPicker,     setShowLayoutPicker]     = useState(false);

  const [lastEnhancedPrompt,   setLastEnhancedPrompt]   = useState<any>(null);
  const [generateStatus,       setGenerateStatus]       = useState("");
  const [toastType,            setToastType]            = useState<"info" | "warning" | "success">("info");

  // ── Derived state ─────────────────────────────────────────────────────────
  useEffect(() => { setSearchQuery(""); }, [activeCategory]);

  const filtered = useMemo(() =>
    items
      .filter(i => activeCategory === "all" || i.category === activeCategory)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [items, activeCategory]
  );

  const displayedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? filtered.filter(i => i.name.toLowerCase().includes(q)) : filtered;
  }, [filtered, searchQuery]);

  const selectedComponents = useMemo(
    () => selectedIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ReactBitsItem[],
    [selectedIds, items]
  );

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const handleSelectComponent = (id: string) => {
    setSelectedId(id);
    setGenerateStatus("");
    setPrimaryTab('code');
    setActiveCodeFileIndex(0);
    setActiveDocTab('usage');
    setInstallTab('cli');
  };

  const handleGenerate = () => {
    if (selected) setProjectName(`rb-demo-${selected.name.toLowerCase().replace(/\s+/g, '-')}`);
    setShowGenerateWizard(true);
  };

  const confirmGenerate = async () => {
    if (!projectPath || !window.reactBitsApi?.generatePlayground) return;
    const isMasterBuild = !!lastEnhancedPrompt;
    if (!isMasterBuild && !selected) return;
    if (Object.keys(tasks).length >= 5) {
      setToastType("warning");
      setGenerateStatus("Task limit reached (max 5). Please close completed tasks first!");
      setTimeout(() => setGenerateStatus(""), 4000);
      return;
    }
    const taskId = Date.now().toString();
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        id: taskId,
        name: isMasterBuild ? (lastEnhancedPrompt.projectMeta?.title || "AI Project") : selected!.name,
        projectName, progress: "Initializing project generation...",
        logs: ["Initializing Build Environment...\n"], status: 'running',
      },
    }));
    setActiveTaskId(null);
    setShowGenerateWizard(false);
    setGenerateStatus("");
    try {
      let result;
      if (isMasterBuild) {
        result = await window.reactBitsApi.generatePlayground({
          options: { installMethod: installTab, packageManager, installData: parsedInstallData, projectName, projectPath, openWhenDone, runWhenDone, autoKillOnError },
          selectedComponents: await Promise.all(selectedComponents.map(c => window.reactBitsApi.getComponentFullContext(c.category, c.name, c.id))),
          enhancedPrompt: lastEnhancedPrompt,
        }, null, taskId);
      } else {
        result = await window.reactBitsApi.generatePlayground(
          selected!.category, selected!.name, selected!.usageMarkdown, componentFiles,
          { installMethod: installTab, packageManager, installData: parsedInstallData, projectName, projectPath, openWhenDone, runWhenDone, autoKillOnError },
          taskId
        );
      }
      if (result.success) {
        const finalStatus = runWhenDone ? 'running' : 'success';
        setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: finalStatus, progress: runWhenDone ? "Local Server Running! (Check Browser)" : "Generation Complete!", path: result.path } }));
        setGenerateStatus(result.message || "Success!");
        if (isMasterBuild) setLastEnhancedPrompt(null);
      } else {
        setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'error', progress: "Error occurred", error: result.error } }));
        setGenerateStatus(`Failed: ${result.error || "Unknown error"}`);
      }
    } catch (e: any) {
      setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'error', progress: "Crash!", error: e.message } }));
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

  const handleSavePreset = async (name: string) => {
    const now = new Date();
    const stamp = `${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    await window.reactBitsApi?.savePreset?.({ id: `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}_${stamp}`, name, savedAt: now.toISOString(), projectPrompt, selectedComponentIds: selectedIds, designRules, layoutConcept, projectName, packageManager });
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    setProjectPrompt(preset.projectPrompt);
    setSelectedIds(preset.selectedComponentIds);
    setDesignRules(preset.designRules);
    setLayoutConcept(preset.layoutConcept);
    setProjectName(preset.projectName ?? '');
    setPackageManager((preset.packageManager ?? 'npm') as typeof packageManager);
    setToastType('success');
    setGenerateStatus(`Loaded preset "${preset.name}"`);
    setTimeout(() => setGenerateStatus(''), 3000);
  };

  const handleDeletePreset = async (id: string) => { await window.reactBitsApi?.deletePreset?.(id); };

  const handleBuilderGenerate = async () => {
    if (!projectPrompt.trim()) { setToastType("warning"); setGenerateStatus("Please enter a prompt for your project!"); setTimeout(() => setGenerateStatus(""), 4000); return; }
    if (selectedComponents.length === 0) { setToastType("warning"); setGenerateStatus("Please select at least one component!"); setTimeout(() => setGenerateStatus(""), 4000); return; }
    setGenerateStatus("Scavenging component source code...");
    try {
      const componentsWithContext = await Promise.all(
        selectedComponents.map(async (comp) => {
          try { return await window.reactBitsApi.getComponentFullContext(comp.category, comp.name, comp.id); }
          catch (e) { console.warn(`Failed to gather context for ${comp.name}`, e); return { id: comp.id, name: comp.name, category: comp.category }; }
        })
      );
      setGenerateStatus("AI Architect is designing your project...");
      const enhanceResult = await window.reactBitsApi.enhancePrompt({
        rawPrompt: projectPrompt, selectedComponents: componentsWithContext,
        systemContext: { framework: "Vite + React (TypeScript)", styling: "Tailwind CSS v4", icons: "Lucide React", animations: ["Framer Motion", "GSAP"], architectureRules: ["Use literal HEX codes (#XXXXXX) for WebGL/Canvas component props.", "Maintain a Z-Index strategy where Backgrounds stay at Z:0.", "Use Lucide React for iconography."], designRules, layoutMd: layoutConcept?.layoutMd ?? null },
      });
      const enhanceData = enhanceResult as any;
      if (enhanceData.success) {
        setGenerateStatus("Project Design Ready!"); setToastType("success");
        setLastEnhancedPrompt(enhanceData.enhancedPrompt);
        setProjectName(enhanceData.enhancedPrompt?.projectMeta?.title || "reactbits-ai-project");
        setShowGenerateWizard(true);
      } else {
        setToastType("warning"); setGenerateStatus(`AI Error: ${enhanceData.error}`);
      }
    } catch (err: any) { setToastType("warning"); setGenerateStatus(`Error: ${err.message}`); }
    setTimeout(() => setGenerateStatus(""), 5000);
  };

  const handleCloseTask = async (id: string) => {
    await window.reactBitsApi?.terminateTask?.(id);
    setTasks(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const handleClearAllTasks = async () => {
    for (const id of Object.keys(tasks)) await window.reactBitsApi?.terminateTask?.(id);
    setTasks({}); setActiveTaskId(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-root">
      <div className="background-container">
        <Iridescence color={IRIDESCENCE_COLOR} mouseReact={false} amplitude={0.1} speed={0.3} />
      </div>

      <div className="scene-container">
        <section className="scene">
          <main className={`gallery-container ${activeCategory === "all" ? "no-scroll" : ""}`}>
            <div className="filter-bar">
              <GradientText colors={GRADIENT_COLORS} animationSpeed={10} showBorder={false} className="modern-title">
                ReactBits Explorer
              </GradientText>
            </div>

            <div className="comp-showcase-container">
              {activeCategory === "all" ? (
                <FlowingMenu
                  items={Object.keys(CATEGORY_LABELS).map(cat => ({ text: CATEGORY_LABELS[cat], onClick: () => setActiveCategory(cat) }))}
                />
              ) : (
                <div className="sub-menu-container">
                  <div className="back-nav-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                    <PillNav
                      items={PILL_NAV_ITEMS}
                      activeId={activeCategory}
                      onItemClick={(id: string) => id === 'home' ? setActiveCategory('all') : setActiveCategory(id)}
                      baseColor="#94a3b8" pillColor="rgba(15, 23, 42, 0.6)" hoveredPillTextColor="#ffffff" pillTextColor="#e2e8f0"
                    />
                  </div>

                  <div className="split-view-container">
                    <ComponentListPane
                      displayedItems={displayedItems}
                      selectedId={selectedId}
                      selectedIds={selectedIds}
                      hoveredComponentId={hoveredComponentId}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      onSelect={handleSelectComponent}
                      onToggleSelect={toggleSelection}
                      onHover={setHoveredComponentId}
                      onAddClick={() => setShowAddModal(true)}
                    />

                    <ComponentInspector
                      selected={selected}
                      componentFiles={componentFiles}
                      primaryTab={primaryTab}
                      onPrimaryTabChange={setPrimaryTab}
                      activeCodeFileIndex={activeCodeFileIndex}
                      onCodeFileChange={setActiveCodeFileIndex}
                      activeDocTab={activeDocTab}
                      onDocTabChange={setActiveDocTab}
                      installTab={installTab}
                      onInstallTabChange={setInstallTab}
                      packageManager={packageManager}
                      onPackageManagerChange={setPackageManager}
                      parsedInstallData={parsedInstallData}
                      rawInstallMarkdown={rawInstallMarkdown}
                      hoveredComponentId={hoveredComponentId}
                      filteredItems={filtered}
                      onGenerate={handleGenerate}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 6px 0' }}>
                      <PresetManager onSave={handleSavePreset} onLoad={handleLoadPreset} onDelete={handleDeletePreset} />
                    </div>
                    <ProjectBuilderPanel
                      selectedComponents={selectedComponents}
                      categoryLimits={CATEGORY_LIMITS}
                      prompt={projectPrompt}
                      onPromptChange={setProjectPrompt}
                      onGenerate={handleBuilderGenerate}
                      designRules={designRules}
                      onDesignRulesChange={setDesignRules}
                      layoutConcept={layoutConcept}
                      onOpenLayoutPicker={() => setShowLayoutPicker(true)}
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

      <GenerateWizard
        open={showGenerateWizard}
        onClose={() => setShowGenerateWizard(false)}
        selected={selected}
        lastEnhancedPrompt={lastEnhancedPrompt}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        projectPath={projectPath}
        onBrowse={handleSelectDirectory}
        installTab={installTab}
        onInstallTabChange={setInstallTab}
        packageManager={packageManager}
        onPackageManagerChange={setPackageManager}
        openWhenDone={openWhenDone}
        onOpenWhenDoneChange={setOpenWhenDone}
        runWhenDone={runWhenDone}
        onRunWhenDoneChange={setRunWhenDone}
        autoKillOnError={autoKillOnError}
        onAutoKillChange={setAutoKillOnError}
        onConfirm={confirmGenerate}
      />

      {activeTaskId && tasks[activeTaskId] && (
        <TaskOverlay task={tasks[activeTaskId]} terminalRef={terminalRef} onHide={() => setActiveTaskId(null)} />
      )}

      <TaskBar
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelect={setActiveTaskId}
        onClose={handleCloseTask}
        onClearAll={handleClearAllTasks}
      />

      {generateStatus && <div className={`status-toast ${toastType}`}>{generateStatus}</div>}

      {showLayoutPicker && (
        <LayoutConceptPicker
          selectedComponentNames={selectedComponents.map(c => c.name)}
          currentConcept={layoutConcept}
          onConfirm={(concept) => { setLayoutConcept(concept); setShowLayoutPicker(false); }}
          onClose={() => setShowLayoutPicker(false)}
        />
      )}

      <AddComponentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={(entry) => {
          setItems(prev => [...prev.filter(i => i.id !== entry.id), entry as ReactBitsItem]);
          setToastType("success");
          setGenerateStatus(`Component "${entry.name}" added to ${entry.category}!`);
          setTimeout(() => setGenerateStatus(""), 4000);
        }}
      />
    </div>
  );
}

export default App;
