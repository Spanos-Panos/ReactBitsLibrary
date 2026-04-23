import { useEffect, useMemo, useState, useRef } from "react";
import type { ReactBitsItem, LayoutConfig, LayoutItem, PageConfig } from "./shared/types/index";
import { getRoleData } from "./shared/data/componentRoles";
import "./shared/types/api";
import { useComponentLoader }   from "./shared/hooks/useComponentLoader";
import { useTaskManager }       from "./shared/hooks/useTaskManager";
import { useGenerationWizard }  from "./shared/hooks/useGenerationWizard";
import PlasmaWave from "./showcase/Backgrounds/PlasmaWave/PlasmaWave";
import CardNav from "./showcase/UIComponents/CardNav/CardNav";
import ProjectBuilderPanel, { DEFAULT_DESIGN_RULES, DEFAULT_STYLE_DIRECTION, DEFAULT_CLIENT_BRIEF, type DesignRules, type StyleDirection, type ClientBrief, type ScrollbarStyle } from "./features/project-builder/ProjectBuilderPanel";
import PresetManager, { type SavedPreset, PRESET_SCHEMA_VERSION } from "./features/preset-manager/PresetManager";
import logo from '../images/ReactIcons/ReactIcon.svg';
import ComponentAddPanel from "./features/browser/ComponentAddPanel";
import ComponentListPane from "./features/browser/ComponentListPane";
import ComponentInspector from "./features/inspector/ComponentInspector";
import GenerationQueue from "./features/generation/GenerationQueue/GenerationQueue";
import GenerateWizard from "./features/generation/GenerateWizard";
import StructureWizard from "./features/generation/StructureWizard";
import { useStructureWizard } from "./shared/hooks/useStructureWizard";
import TaskOverlay from "./features/generation/TaskOverlay";
import LoadingScreen from "./features/generation/LoadingScreen";
import LayoutPreviewModal from "./features/project-builder/LayoutPreviewModal";
import VisionReworkModal from "./features/generation/VisionReworkModal";
import type { VisionReworkReadyData } from "./shared/types/api";

const CATEGORY_LIMITS: Record<string, number> = {
  Backgrounds: 1, TextAnimations: 2, Animations: 3, Components: 5,
};

/** Shown in project panel assembly as `n / max` selected. */
const MAX_SELECTED_COMPONENTS_TOTAL = 5;

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
  const [styleDirection,       setStyleDirection]       = useState<StyleDirection>(DEFAULT_STYLE_DIRECTION);
  const [clientBrief,          setClientBrief]          = useState<ClientBrief>(DEFAULT_CLIENT_BRIEF);
  const [layoutConfig,         setLayoutConfig]         = useState<LayoutConfig>([]);
  const [scrollbarStyle,       setScrollbarStyle]       = useState<ScrollbarStyle>({ mode: 'default' });
  const [pages,                setPages]                = useState<PageConfig[]>([{ id: 'page-1', title: 'Home', type: 'home', componentIds: [] }]);
  const structureWizard = useStructureWizard();
  const [polishPass,           setPolishPass]           = useState(false);

  const [lastEnhancedPrompt,   setLastEnhancedPrompt]   = useState<any>(null);
  const [generateStatus,       setGenerateStatus]       = useState("");
  const [toastType,            setToastType]            = useState<"info" | "warning" | "success">("info");

  const [appReady,             setAppReady]             = useState(false);
  const [presetsOpen,          setPresetsOpen]          = useState(false);
  const [showLayoutIntelligence, setShowLayoutIntelligence] = useState(false);

  // ── Vision Rework state ───────────────────────────────────────────────────
  const [visionReworkOpen,     setVisionReworkOpen]     = useState(false);
  const [visionReworkData,     setVisionReworkData]     = useState<VisionReworkReadyData | null>(null);
  const [visionReworkTaskId,   setVisionReworkTaskId]   = useState<string | null>(null);
  const [reworkReadyTaskIds,   setReworkReadyTaskIds]   = useState<Set<string>>(new Set());
  // Store the last enhanced prompt used per task so rework can reference original preset
  const lastPresetByTaskId = useRef<Record<string, object>>({});
  // Track reserved names during the current JS tick to prevent races
  const pendingProjectNamesRef = useRef<Set<string>>(new Set());

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

  // ── Auto-populate layoutConfig when selectedComponents changes ───────────
  useEffect(() => {
    setLayoutConfig(prev => {
      const prevMap = new Map(prev.map((i: LayoutItem) => [i.componentName, i]));
      return selectedComponents.map((comp): LayoutItem => {
        if (prevMap.has(comp.name)) return prevMap.get(comp.name)!;
        if (comp.category === 'Backgrounds')
          return { componentName: comp.name, category: comp.category, position: 'fixed',   xAlign: 'full-width', zLayer: 'background', heightHint: 'fullscreen', entranceAnimation: 'none', widthHint: 'full' };
        return       { componentName: comp.name, category: comp.category, position: 'in-flow', xAlign: 'full-width', zLayer: 'content',    heightHint: 'medium', entranceAnimation: 'none', widthHint: 'full' };
      });
    });
  }, [selectedComponents]);

  // ── Helper: Unique Project Name Resolution ───────────────────────────────
  const getUniqueProjectName = async (baseName: string, targetFolder: string) => {
    let currentName = baseName;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const fullPath = `${targetFolder}\\${currentName}`;

      // 1. Check synchronous pending ref to prevent rapid click races
      if (pendingProjectNamesRef.current.has(fullPath)) {
        currentName = `${baseName}-${counter}`;
        counter++;
        continue;
      }

      // 2. Check currently active tasks
      const inUseByTasks = Object.values(tasks).some(t => 
        (t.status === 'running' || t.status === 'success') && 
        t.projectName === currentName && 
        (t.path === targetFolder || t.path?.includes(targetFolder))
      );
      
      // 3. Check filesystem
      let inUseByFS = false;
      if (window.reactBitsApi?.checkDirectoryExists) {
        inUseByFS = await window.reactBitsApi.checkDirectoryExists(fullPath);
      }

      if (!inUseByTasks && !inUseByFS) {
        isUnique = true;
        pendingProjectNamesRef.current.add(fullPath); // Reserve it immediately!
      } else {
        currentName = `${baseName}-${counter}`;
        counter++;
      }
    }
    return currentName;
  };

  // ── Event Handlers ────────────────────────────────────────────────────────
  const handleSelectComponent = (id: string) => {
    setSelectedId(id);
    setGenerateStatus("");
    setInstallTab('cli');
  };

  const handleGenerate = () => {
    if (selected) setProjectName(`${selected.name} Demo`);
    setShowGenerateWizard(true);
  };

  const handleCloseTask = async (id: string) => {
    await window.reactBitsApi?.terminateTask?.(id);
    setTasks(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (activeTaskIdRef.current === id) setActiveTaskId(null);
    // Clean up rework state for this task
    setReworkReadyTaskIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    delete lastPresetByTaskId.current[id];
  };

  const handleStopTask = async (id: string) => {
    await window.reactBitsApi?.terminateTask?.(id);
    setTasks(prev => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], progress: 'Server Stopped' }
      };
    });
  };

  const handleClearAllTasks = async () => {
    const ids = Object.keys(tasks);
    if (ids.length === 0) return;
    await Promise.all(ids.map(id => window.reactBitsApi?.terminateTask?.(id)));
    setTasks({});
    setActiveTaskId(null);
    setReworkReadyTaskIds(new Set());
    lastPresetByTaskId.current = {};
  };

  const confirmGenerate = async () => {
    if (!projectPath || !window.reactBitsApi?.generatePlayground) return;
    const isMasterBuild = !!lastEnhancedPrompt;
    if (!isMasterBuild && !selected) return;
    if (Object.values(tasks).filter(t => t.status === 'running').length >= 5) {
      setToastType("warning");
      setGenerateStatus("Task limit reached (max 5 running). Please wait for some to finish!");
      setTimeout(() => setGenerateStatus(""), 4000);
      return;
    }
    const taskId = Date.now().toString();
    const uniqueProjectName = await getUniqueProjectName(projectName, projectPath);
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        id: taskId,
        name: isMasterBuild ? (lastEnhancedPrompt.projectMeta?.title || "AI Project") : selected!.name,
        type: isMasterBuild ? 'web' : 'component',
        projectName: uniqueProjectName, progress: "Initializing project generation...",
        logs: ["Initializing Build Environment...\n"], status: 'running',
        runWhenDoneUsed: runWhenDone,
        autoKillOnErrorUsed: autoKillOnError,
        hasTerminalError: false,
      },
    }));
    setActiveTaskId(null);
    setShowGenerateWizard(false);
    setGenerateStatus("");
    try {
      let result;
      if (isMasterBuild) {
        result = await window.reactBitsApi.generatePlayground({
          options: { installMethod: installTab, packageManager, installData: parsedInstallData, projectName: uniqueProjectName, projectPath, openWhenDone, runWhenDone, autoKillOnError, layoutConfig: layoutConfig.length > 0 ? layoutConfig : null, scrollbarStyle: scrollbarStyle.mode !== 'default' ? scrollbarStyle : null, polishPass },
          selectedComponents: await Promise.all(selectedComponents.map(c => window.reactBitsApi.getComponentFullContext(c.category, c.name, c.id))),
          enhancedPrompt: lastEnhancedPrompt,
        }, null, taskId);
      } else {
        result = await window.reactBitsApi.generatePlayground(
          selected!.category, selected!.name, selected!.usageMarkdown, componentFiles,
          { installMethod: installTab, packageManager, installData: parsedInstallData, projectName: uniqueProjectName, projectPath, openWhenDone, runWhenDone, autoKillOnError },
          taskId
        );
      }
      if (result.success) {
        setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'success', progress: runWhenDone ? "Generation Complete! Auto Run Enabled." : "Generation Complete!", path: result.path, hasTerminalError: false } }));
        setGenerateStatus(result.message || "Success!");
        // Remember the preset used for this task so Vision Rework can reference it
        if (isMasterBuild && lastEnhancedPrompt) {
          lastPresetByTaskId.current[taskId] = lastEnhancedPrompt;
        }
        if (isMasterBuild) setLastEnhancedPrompt(null);
      } else {
        if (autoKillOnError) {
          await handleCloseTask(taskId);
          setGenerateStatus(`Failed and auto-cleared: ${result.error || "Unknown error"}`);
        } else {
          setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'error', progress: "Error occurred", error: result.error, hasTerminalError: true } }));
          setGenerateStatus(`Failed: ${result.error || "Unknown error"}`);
        }
      }
    } catch (e: any) {
      if (autoKillOnError) {
        await handleCloseTask(taskId);
        setGenerateStatus(`Error and auto-cleared: ${e.message}`);
      } else {
        setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'error', progress: "Crash!", error: e.message, hasTerminalError: true } }));
        setGenerateStatus(`Error: ${e.message}`);
      }
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
    await window.reactBitsApi?.savePreset?.({
      id: `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}_${stamp}`,
      name,
      savedAt: now.toISOString(),
      schemaVersion: PRESET_SCHEMA_VERSION,
      projectPrompt,
      selectedComponentIds: selectedIds,
      designRules,
      layoutConfig,
      projectName,
      packageManager,
      styleDirection,
      clientBrief,
      pages,
    });
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    setProjectPrompt(preset.projectPrompt ?? '');
    setSelectedIds(preset.selectedComponentIds ?? []);
    setDesignRules(preset.designRules ?? DEFAULT_DESIGN_RULES);
    setLayoutConfig(preset.layoutConfig ?? []);
    setProjectName(preset.projectName ?? '');
    setPackageManager((preset.packageManager ?? 'npm') as typeof packageManager);
    // v2 fields — fall back to defaults for old presets that don't have them
    setStyleDirection(preset.styleDirection ?? DEFAULT_STYLE_DIRECTION);
    setClientBrief(preset.clientBrief ?? DEFAULT_CLIENT_BRIEF);
    // v4 field — fall back to a single Home page for old presets
    setPages(preset.pages ?? [{ id: 'page-1', title: 'Home', type: 'home', componentIds: [] }]);
    setToastType('success');
    setGenerateStatus(`✓ Loaded "${preset.name}"`);
    setTimeout(() => setGenerateStatus(''), 3000);
  };

  const handleDeletePreset = async (id: string) => { await window.reactBitsApi?.deletePreset?.(id); };

  const handleBuilderGenerate = async () => {
    const runningTasksCount = Object.values(tasks).filter(t => t.status === 'running').length;
    if (runningTasksCount >= 5) {
      setToastType("warning");
      setGenerateStatus("Task limit reached (max 5 running). Please wait for some to finish!");
      setTimeout(() => setGenerateStatus(""), 4000);
      return;
    }
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
      const componentRoleContext = selectedComponents.map(c => {
        const role = getRoleData(c.name);
        return { name: c.name, role: role?.roles[0] ?? 'ui', footprint: role?.footprint ?? 'contained', behaviors: role?.behavior ?? [] };
      });
      const responsiveDirective = (() => {
        switch (designRules.sizes.optimizationTarget) {
          case 'mobile':
            return "CRITICAL: Design this EXCLUSIVELY for Mobile viewports (max-width: 480px). Assume the canvas is a phone screen. Use 100% width, large touch targets (min 44px), stacked `flex-col` layouts. DO NOT write media queries for larger screens. Use mobile typography (14px-18px).";
          case 'tablet':
            return "CRITICAL: Design this EXCLUSIVELY for medium screens (768px - 1024px). Balance grid layouts with touch-friendly spacing. DO NOT optimize for tiny phones or massive monitors.";
          case 'desktop':
            return "CRITICAL: Design this EXCLUSIVELY for large monitors (1024px+). Utilize advanced CSS grid (3-4 columns), sidebars, horizontal layouts, and complex hover states. Enforce a max-width container (e.g., `mx-auto max-w-7xl`). DO NOT add mobile media queries or stack layouts. Force a desktop-first structure.";
          case 'adaptive':
          default:
            return `RESPONSIVE & LAYOUT RULES:
- Mobile First Base (0-767px): 100% width, padding 12px-16px. Flex column layouts. Use font-size: clamp(14px, 4vw, 18px); for body. Spacing vars: --space-sm: 6px, --space-md: 12px, --space-lg: 20px.
- Tablet (min-width: 768px): 2-column grids allowed. font-size: clamp(15px, 2.5vw, 20px);. Spacing vars: --space-sm: 8px, --space-md: 16px, --space-lg: 28px.
- Monitor (min-width: 1024px): 3-4 column grids. Typography clamp(16px, 1.5vw, 22px);. Spacing vars: --space-sm: 10px, --space-md: 20px, --space-lg: 40px.
- Container: Apply max-width: 1200px; margin: 0 auto; at the Monitor breakpoint. Use Tailwind responsive prefixes (md:, lg:) to enforce these rules.`;
        }
      })();

      const enhanceResult = await window.reactBitsApi.enhancePrompt({
        rawPrompt: projectPrompt, selectedComponents: componentsWithContext,
        systemContext: { framework: "Vite + React (TypeScript)", styling: "Tailwind CSS v4", icons: "Lucide React", animations: ["Framer Motion", "GSAP"], architectureRules: ["Use literal HEX codes (#XXXXXX) for WebGL/Canvas component props.", "Maintain a Z-Index strategy where Backgrounds stay at Z:0.", "Use Lucide React for iconography."], designRules, responsiveDirective, styleDirection, clientBrief, layoutConfig: layoutConfig.length > 0 ? layoutConfig : null, componentRoleContext },
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

  const handleGenerateStructure = (pgs: PageConfig[], navbarId: string) => {
    let defaultName = 'Project Structure';
    if (navbarId) {
      const navComp = items.find(i => i.id === navbarId);
      if (navComp) defaultName = `${navComp.name} Structure`;
    }
    structureWizard.open(pgs, navbarId, defaultName);
  };

  const handleStructureConfirm = async () => {
    const runningTasksCount = Object.values(tasks).filter(t => t.status === 'running').length;
    if (runningTasksCount >= 5) {
      setToastType("warning");
      setGenerateStatus("Task limit reached (max 5 running). Please wait for some to finish!");
      setTimeout(() => setGenerateStatus(""), 4000);
      return;
    }
    const uniqueProjectName = await getUniqueProjectName(structureWizard.projectName, structureWizard.outputPath);
    const taskId = `structure-${Date.now()}`;
    const task = { 
      id: taskId, 
      name: 'Structure', 
      projectName: uniqueProjectName, 
      progress: 'Starting...', 
      logs: [
        `[System] Initializing structure synthesis for ${uniqueProjectName}...\n`,
        `[System] Target Directory: ${structureWizard.outputPath}\n`,
        `[System] Pages to generate: ${structureWizard.pages.length}\n`,
        `[System] Package Manager: ${structureWizard.packageManager}\n`
      ], 
      status: 'running' as const, 
      type: 'structure' as const, 
      path: `${structureWizard.outputPath}/${uniqueProjectName}`,
      runWhenDoneUsed: false, 
      autoKillOnErrorUsed: false, 
      hasTerminalError: false,
    };
    setTasks(prev => ({ ...prev, [taskId]: task }));
    setActiveTaskId(null);
    structureWizard.close();

    const componentsWithFiles = await Promise.all(
      selectedComponents.map(async (comp) => {
        try { return await window.reactBitsApi.getComponentFullContext(comp.category, comp.name, comp.id); }
        catch { return { id: comp.id, name: comp.name, category: comp.category, files: [], usage: '', install: '' }; }
      })
    );

    const result = await window.reactBitsApi.generateStructure({
      pages: structureWizard.pages,
      navbarComponentId: structureWizard.navbarId,
      projectName: uniqueProjectName,
      outputPath: structureWizard.outputPath,
      packageManager: structureWizard.packageManager,
      openWhenDone: structureWizard.openWhenDone,
      selectedComponents: componentsWithFiles as any,
      taskId: taskId,
    } as any);

    const pageCount = structureWizard.pages.length;
    const successMsg = `${uniqueProjectName} — ${pageCount} page${pageCount !== 1 ? 's' : ''} ready`;

    setTasks(prev => ({
      ...prev,
      [taskId]: { 
        ...prev[taskId], 
        status: result.success ? 'success' : 'error', 
        progress: result.success ? successMsg : (result.error ?? 'Failed'), 
        path: result.success ? (result.path || `${structureWizard.outputPath}/${uniqueProjectName}`) : prev[taskId].path,
        hasTerminalError: !result.success 
      },
    }));

    if (result.success) {
      setToastType('success');
      setGenerateStatus(successMsg);
      setTimeout(() => setGenerateStatus(''), 6000);
    } else {
      setToastType('warning');
      setGenerateStatus(`Structure generation failed: ${result.error ?? 'Unknown error'}`);
      setTimeout(() => setGenerateStatus(''), 6000);
    }
  };

  // ── Vision Rework IPC listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!window.reactBitsApi?.onVisionReworkReady) return;
    const unsubscribe = window.reactBitsApi.onVisionReworkReady((data) => {
      setReworkReadyTaskIds(prev => new Set([...prev, data.taskId]));
      setVisionReworkData(data);
      setVisionReworkTaskId(data.taskId);
      setVisionReworkOpen(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!window.reactBitsApi?.onVisionReworkProgress) return;
    const unsubscribe = window.reactBitsApi.onVisionReworkProgress((msg, taskId) => {
      setTasks(prev => {
        if (!prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            logs: [...(prev[taskId].logs || []), msg + '\n'],
            progress: msg,
          },
        };
      });
    });
    return unsubscribe;
  }, []);

  const handleVisionRework = (taskId: string) => {
    // Re-open modal for this task (e.g. user closed it and clicked Rework pill)
    setVisionReworkTaskId(taskId);
    setVisionReworkOpen(true);
  };

  const handleVisionReworkConfirm = async (payload: {
    projectPath: string; projectName: string; originalPreset: object;
    referenceImagePath: string; screenshotPath?: string;
    weaknessesMd: string; backupFirst: boolean; taskId: string;
  }) => {
    setVisionReworkOpen(false);
    const reworkId = payload.taskId;
    setTasks(prev => ({
      ...prev,
      [reworkId]: {
        id: reworkId,
        name: 'Vision Rework',
        type: 'web' as const,
        projectName: payload.projectName,
        progress: 'Running vision rework…',
        logs: ['Starting Vision Rework pass...\n'],
        status: 'running' as const,
        runWhenDoneUsed: false,
        autoKillOnErrorUsed: false,
        hasTerminalError: false,
      },
    }));
    setActiveTaskId(reworkId);
    const result = await window.reactBitsApi.runVisionRework(payload);
    setTasks(prev => ({
      ...prev,
      [reworkId]: {
        ...prev[reworkId],
        status: result.success ? 'success' : 'error',
        progress: result.success ? 'Vision Rework Complete!' : `Rework failed: ${result.error}`,
        hasTerminalError: !result.success,
      },
    }));
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
            <ComponentAddPanel
              isOpen={showAddModal}
              onToggle={() => setShowAddModal(v => !v)}
              onAdded={(entry) => {
                setItems(prev => [...prev.filter(i => i.id !== entry.id), entry as ReactBitsItem]);
                setToastType("success");
                setGenerateStatus(`Component "${entry.name}" added to ${entry.category}!`);
                setTimeout(() => setGenerateStatus(""), 4000);
              }}
            />

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
            logo={logo}
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
              onClearAll={handleClearAllTasks}
              onVisionRework={handleVisionRework}
              reworkReadyTaskIds={reworkReadyTaskIds}
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
              maxSelectedComponents={MAX_SELECTED_COMPONENTS_TOTAL}
              categoryLimits={CATEGORY_LIMITS}
              prompt={projectPrompt}
              onPromptChange={setProjectPrompt}
              onGenerate={handleBuilderGenerate}
              designRules={designRules}
              onDesignRulesChange={setDesignRules}
              layoutConfig={layoutConfig}
              onLayoutConfigChange={setLayoutConfig}
              styleDirection={styleDirection}
              onStyleDirectionChange={setStyleDirection}
              clientBrief={clientBrief}
              onClientBriefChange={setClientBrief}
              scrollbarStyle={scrollbarStyle}
              onScrollbarStyleChange={setScrollbarStyle}
              onOpenLayoutIntelligence={() => setShowLayoutIntelligence(true)}
              onRestoreFromHistory={(p: string, sels: any[]) => {
                setProjectPrompt(p);
                setSelectedIds(sels.map((s: any) => s.id));
                setGenerateStatus("Restored project from history!");
                setTimeout(() => setGenerateStatus(""), 3000);
              }}
              pages={pages}
              onPagesChange={setPages}
              onGenerateStructure={handleGenerateStructure}
              allComponents={items}
              onToggleComponent={(id) => toggleSelection(id, { stopPropagation: () => {} } as React.MouseEvent)}
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
        polishPass={polishPass}
        onPolishPassChange={setPolishPass}
        onConfirm={confirmGenerate}
      />

      <LayoutPreviewModal
        isOpen={showLayoutIntelligence}
        onClose={() => setShowLayoutIntelligence(false)}
        layoutConfig={layoutConfig}
      />

      <StructureWizard
        open={structureWizard.isOpen}
        onClose={structureWizard.close}
        pages={structureWizard.pages}
        navbarName={selectedComponents.find(c => `${c.category}/${c.name}` === structureWizard.navbarId || c.name === structureWizard.navbarId)?.name ?? ''}
        projectName={structureWizard.projectName}
        onProjectNameChange={structureWizard.setProjectName}
        outputPath={structureWizard.outputPath}
        onBrowse={async () => { const p = await window.reactBitsApi.selectDirectory(); if (p) structureWizard.setOutputPath(p); }}
        packageManager={structureWizard.packageManager}
        onPackageManagerChange={structureWizard.setPackageManager}
        openWhenDone={structureWizard.openWhenDone}
        onOpenWhenDoneChange={structureWizard.setOpenWhenDone}
        onConfirm={handleStructureConfirm}
        allComponentNames={Object.fromEntries(selectedComponents.map(c => [`${c.category}/${c.name}`, c.name]))}
      />

      <VisionReworkModal
        open={visionReworkOpen}
        onClose={() => setVisionReworkOpen(false)}
        reworkData={visionReworkData}
        projectName={visionReworkTaskId ? (tasks[visionReworkTaskId]?.projectName ?? '') : ''}
        originalPreset={visionReworkTaskId ? (lastPresetByTaskId.current[visionReworkTaskId] ?? null) : null}
        onConfirm={handleVisionReworkConfirm as any}
      />

      {activeTaskId && tasks[activeTaskId] && (
        <TaskOverlay 
          task={tasks[activeTaskId]} 
          terminalRef={terminalRef} 
          onHide={() => setActiveTaskId(null)} 
          onStop={handleStopTask}
          onClear={handleCloseTask}
        />
      )}

{generateStatus && <div className={`status-toast ${toastType}`}>{generateStatus}</div>}

      {/* ComponentAddPanel is now handled in the top bar actions */}
    </div>
    </>
  );
}

export default App;
