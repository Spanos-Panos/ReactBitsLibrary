import { useEffect, useMemo, useState } from "react";
import type { ReactBitsItem } from "./types/index";
import "./types/api";
import { useComponentLoader }   from "./hooks/useComponentLoader";
import { useTaskManager }       from "./hooks/useTaskManager";
import { useGenerationWizard }  from "./hooks/useGenerationWizard";
import PlasmaWave from "./components/Backgrounds/PlasmaWave/PlasmaWave";
import CardNav from "./components/Components/CardNav/CardNav";
import ProjectBuilderPanel, { DEFAULT_DESIGN_RULES, type DesignRules } from "./components/ProjectBuilderPanel";
import LayoutConceptPicker from "./components/LayoutConceptPicker";
import type { LayoutConcept } from "./lib/layoutConceptGenerator";
import PresetManager, { type SavedPreset } from "./components/PresetManager";
import AddComponentModal from "./components/AddComponentModal";
import ComponentListPane from "./views/ComponentListPane";
import ComponentInspector from "./views/ComponentInspector";
import GenerationQueue from "./components/GenerationQueue/GenerationQueue";
import GenerateWizard from "./views/GenerateWizard";
import TaskOverlay from "./views/TaskOverlay";
import TaskBar from "./views/TaskBar";
import LoadingScreen from "./views/LoadingScreen";

const CATEGORY_LIMITS: Record<string, number> = {
  Backgrounds: 1, TextAnimations: 2, Animations: 3, Components: 5,
};

const PILL_NAV_ITEMS = [
  { id: 'Components',     label: 'Components' },
  { id: 'Animations',     label: 'Animations' },
  { id: 'TextAnimations', label: 'Text Animations' },
  { id: 'Backgrounds',    label: 'Backgrounds' },
];

const CARD_NAV_ITEMS = [
  { label: 'Categories', bgColor: 'rgba(255,255,255,0.04)', textColor: '#f1f5f9' },
  { label: 'Favorites',  bgColor: 'rgba(255,255,255,0.03)', textColor: '#64748b' },
  { label: 'Recent',     bgColor: 'rgba(255,255,255,0.03)', textColor: '#64748b' },
];

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
  const [activeCategory,       setActiveCategory]       = useState<string>("Components");
  const [hoveredComponentId,   setHoveredComponentId]   = useState<string | null>(null);
  const [searchQuery,          setSearchQuery]          = useState("");
  const [showAddModal,         setShowAddModal]         = useState(false);


  const [projectPrompt,        setProjectPrompt]        = useState("");
  const [designRules,          setDesignRules]          = useState<DesignRules>(DEFAULT_DESIGN_RULES);
  const [layoutConcept,        setLayoutConcept]        = useState<LayoutConcept | null>(null);
  const [showLayoutPicker,     setShowLayoutPicker]     = useState(false);

  const [lastEnhancedPrompt,   setLastEnhancedPrompt]   = useState<any>(null);
  const [generateStatus,       setGenerateStatus]       = useState("");
  const [toastType,            setToastType]            = useState<"info" | "warning" | "success">("info");

  const [appReady,             setAppReady]             = useState(false);
  const [presetsOpen,          setPresetsOpen]          = useState(false);

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
        type: isMasterBuild ? 'web' : 'component',
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
    <>
    {!appReady && <LoadingScreen onDone={() => setAppReady(true)} />}
    <div className="app-root" style={appReady ? undefined : { visibility: 'hidden' }}>
      <div className="background-container">
        {appReady && <PlasmaWave colors={['#6366f1', '#06B6D4']} speed1={0.04} speed2={0.04} bend1={0.8} bend2={0.4} />}
      </div>

      <div className="scene-container">
        <div className="top-bar">
          <div className="top-bar-actions">
            {/* Add component */}
            <button
              className="nav-action-btn"
              title="Add component"
              onClick={() => setShowAddModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            {/* Presets */}
            <PresetManager
              isOpen={presetsOpen}
              onToggle={() => setPresetsOpen(v => !v)}
              onSave={handleSavePreset}
              onLoad={handleLoadPreset}
              onDelete={handleDeletePreset}
            />
          </div>

          <CardNav
            logo="/ReactIcon.svg"
            logoAlt="BitForge"
            items={CARD_NAV_ITEMS}
            categories={PILL_NAV_ITEMS}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <div className="top-bar-spacer" />
        </div>

        <section className="scene">
          <aside className="component-sidebar">
            <ComponentListPane
              items={items}
              selectedId={selectedId}
              selectedIds={selectedIds}
              hoveredComponentId={hoveredComponentId}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              onSelect={handleSelectComponent}
              onToggleSelect={toggleSelection}
              onHover={setHoveredComponentId}
            />
          </aside>

          <aside className="generation-sidebar">
            <GenerationQueue
              tasks={tasks}
              onKill={handleCloseTask}
              onSelect={setActiveTaskId}
            />
          </aside>

          <main className="gallery-container">
            <div className="comp-showcase-container">
              <div className="sub-menu-container">
                <div className="split-view-container">
                  <ComponentInspector
                    selected={selected}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelection}
                    componentFiles={componentFiles}
                    parsedInstallData={parsedInstallData}
                    rawInstallMarkdown={rawInstallMarkdown}
                    onGenerate={handleGenerate}
                  />
                </div>
              </div>
            </div>
          </main>

          <div className="bottom-panel">
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
    </>
  );
}

export default App;
