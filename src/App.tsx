import { useEffect, useMemo, useState, useRef } from "react";
import type { ReactBitsItem, PageConfig } from "./shared/types/index";
import { getRoleData, WEIGHT_BUDGETS, DEFAULT_PERFORMANCE_PROFILE_ID } from "./shared/data/componentRoles";
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
import ClaudeInfoPanel from "./features/generation/ClaudeInfoPanel";
import { useStructureWizard } from "./shared/hooks/useStructureWizard";
import TaskOverlay from "./features/generation/TaskOverlay";
import LoadingScreen from "./features/generation/LoadingScreen";
import type { ComponentContext, EnhancePromptResult } from "./shared/types/api";
import type { ProjectStructureOptions } from "./shared/types";
import { resolvePageIntents } from "./shared/lib/pageConfigResolver";

const CATEGORY_LIMITS: Record<string, number> = {
  Backgrounds: 1, TextAnimations: 3, Animations: 3, Components: 5,
};

/** Shown in project panel assembly as `n / max` selected. */
const MAX_SELECTED_COMPONENTS_TOTAL = 10;

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

type EnhancedPromptData = NonNullable<EnhancePromptResult["enhancedPrompt"]>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function getEnhancedProjectTitle(prompt: EnhancedPromptData | null, fallback: string): string {
  if (!prompt || typeof prompt !== "object") return fallback;
  const projectMeta = (prompt as { projectMeta?: unknown }).projectMeta;
  if (!projectMeta || typeof projectMeta !== "object") return fallback;
  const title = (projectMeta as { title?: unknown }).title;
  return typeof title === "string" && title.trim() ? title : fallback;
}

function normalizePresetPages(rawPages: SavedPreset['pages'] | undefined): PageConfig[] {
  const fallback: PageConfig[] = [{ id: 'page-1', title: 'Home', type: 'home', componentIds: [] }];
  if (!Array.isArray(rawPages) || rawPages.length === 0) return fallback;
  return rawPages.map((page, idx) => ({
    id: page.id || `page-${idx + 1}`,
    title: page.title || 'Page',
    type: page.type || 'custom',
    componentIds: Array.isArray(page.componentIds) ? page.componentIds : [],
    overrides: page.overrides?.enabled ? page.overrides : undefined,
  }));
}

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
  const [aiSupport,            setAiSupport]            = useState(true);
  const [pages,                setPages]                = useState<PageConfig[]>([{ id: 'home', title: 'Home', type: 'home', componentIds: [] }]);
  const [scrollbarStyle,       setScrollbarStyle]       = useState<ScrollbarStyle>({ mode: 'custom' });
  const structureWizard = useStructureWizard();

  const [lastEnhancedPrompt,   setLastEnhancedPrompt]   = useState<EnhancedPromptData | null>(null);
  const [lastEnhancerQualityScore, setLastEnhancerQualityScore] = useState<number | undefined>(undefined);
  const [lastEnhancerTelemetry, setLastEnhancerTelemetry] = useState<EnhancePromptResult["telemetry"] | undefined>(undefined);
  const [generateStatus,       setGenerateStatus]       = useState("");
  const [toastType,            setToastType]            = useState<"info" | "warning" | "success">("info");

  const [appReady,             setAppReady]             = useState(false);
  const [presetsOpen,          setPresetsOpen]          = useState(false);
  const [loadedPresetName,     setLoadedPresetName]     = useState('');

  // Track reserved names during the current JS tick to prevent races
  const pendingProjectNamesRef = useRef<Set<string>>(new Set());
  // Set to true when the wizard is opened from the builder panel (not the inspector)
  const builderModeRef = useRef(false);

  // ── Derived state ─────────────────────────────────────────────────────────
  useEffect(() => { setSearchQuery(""); }, [activeCategory]);

  const filtered = useMemo(() =>
    items
      .filter(i => activeCategory === "all" || i.category === activeCategory)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [items, activeCategory]
  );

  const selectedComponents = useMemo(
    () => selectedIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ReactBitsItem[],
    [selectedIds, items]
  );

  const resolvedPageIntents = useMemo(() => resolvePageIntents(pages, {
    clientBrief,
    styleDirection,
    designRules,
  }), [pages, clientBrief, styleDirection, designRules]);



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

  const showStatus = (type: "info" | "warning" | "success", message: string, timeoutMs = 4000) => {
    setToastType(type);
    setGenerateStatus(message);
    setTimeout(() => setGenerateStatus(""), timeoutMs);
  };

  const handleGenerate = () => {
    if (selected) setProjectName(`${selected.name} Demo`);
    setShowGenerateWizard(true);
  };

  const handleCloseTask = async (id: string) => {
    await window.reactBitsApi?.terminateTask?.(id);
    setTasks(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (activeTaskIdRef.current === id) setActiveTaskId(null);
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
  };

  const buildEnhancePayload = async (preloadedComponents?: ComponentContext[]) => {
    const componentsWithContext = preloadedComponents ?? await Promise.all(
      selectedComponents.map(async (comp) => {
        try { return await window.reactBitsApi.getComponentFullContext(comp.category, comp.name, comp.id); }
        catch (e) {
          console.warn(`Failed to gather context for ${comp.name}`, e);
          return { id: comp.id, name: comp.name, category: comp.category, files: [], usage: '', install: '' };
        }
      })
    );
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

    const profileId = styleDirection.performanceProfileId || DEFAULT_PERFORMANCE_PROFILE_ID;
    const profile = WEIGHT_BUDGETS[profileId];
    const performanceProfile = {
      id: profile.id,
      label: profile.label,
      heavyMax: profile.heavyMax,
      mediumMax: profile.mediumMax,
    };

    return {
      rawPrompt: projectPrompt,
      selectedComponents: componentsWithContext,
      systemContext: {
        framework: "Vite + React (TypeScript)",
        styling: "Tailwind CSS v4",
        icons: "Inline SVG or Unicode where needed",
        animations: ["Framer Motion", "GSAP"],
        architectureRules: ["Use literal HEX codes (#XXXXXX) for WebGL/Canvas component props.", "Maintain a Z-Index strategy where Backgrounds stay at Z:0.", "Avoid introducing new icon-library imports in App.tsx."],
        designRules,
        responsiveDirective,
        styleDirection,
        clientBrief,
        componentRoleContext,
        performanceProfile,
        pages: resolvedPageIntents.map(p => ({
          id: p.id,
          title: p.title,
          type: p.type,
          overridesEnabled: p.overridesEnabled,
          content: p.content,
        })),
      },
    };
  };

  const confirmGenerate = async () => {
    if (!projectPath || !window.reactBitsApi?.generatePlayground) return;
    const isBuilderGeneration = builderModeRef.current;
    builderModeRef.current = false;
    if (!isBuilderGeneration && !selected) return;
    if (Object.values(tasks).filter(t => t.status === 'running').length >= 5) {
      showStatus("warning", "Task limit reached (max 5 running). Please wait for some to finish!");
      return;
    }
    let effectiveEnhancedPrompt = lastEnhancedPrompt;
    let effectiveEnhancerQualityScore = lastEnhancerQualityScore;
    let effectiveEnhancerTelemetry = lastEnhancerTelemetry;

    if (isBuilderGeneration && aiSupport && !effectiveEnhancedPrompt) {
      setGenerateStatus("AI Support enabled: generating design brief...");
      try {
        const enhancePayload = await buildEnhancePayload();
        const enhanceResult = await window.reactBitsApi.enhancePrompt(enhancePayload);
        const enhanceData = enhanceResult as EnhancePromptResult;
        if (!enhanceData.success || !enhanceData.enhancedPrompt) {
          showStatus("warning", `AI Error: ${enhanceData.error ?? "Enhancer returned no prompt."}`, 5000);
          return;
        }
        effectiveEnhancedPrompt = enhanceData.enhancedPrompt;
        effectiveEnhancerQualityScore = enhanceData.qualityReport?.qualityScore;
        effectiveEnhancerTelemetry = enhanceData.telemetry;
        setLastEnhancedPrompt(enhanceData.enhancedPrompt);
        setLastEnhancerQualityScore(enhanceData.qualityReport?.qualityScore);
        setLastEnhancerTelemetry(enhanceData.telemetry);
      } catch (err: unknown) {
        showStatus("warning", `AI Error: ${getErrorMessage(err)}`, 5000);
        return;
      }
    }
    const taskId = Date.now().toString();
    const createdAt = Date.now();
    const uniqueProjectName = await getUniqueProjectName(projectName, projectPath);
    const taskLabel = effectiveEnhancedPrompt
      ? getEnhancedProjectTitle(effectiveEnhancedPrompt, "AI Project")
      : (clientBrief.brandName || (selectedComponents[0]?.name ?? selected?.name ?? "Project"));
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        id: taskId,
        name: taskLabel,
        type: isBuilderGeneration ? 'web' : 'component',
        createdAt,
        projectName: uniqueProjectName, progress: "Initializing project generation...",
        logs: ["Initializing Build Environment...\n"], status: 'running',
        runWhenDoneUsed: runWhenDone,
        hasTerminalError: false,
        aiAnalytics: isBuilderGeneration && aiSupport
          ? {
              rawPrompt: projectPrompt,
              enhancedPrompt: effectiveEnhancedPrompt,
              qualityScore: effectiveEnhancerQualityScore,
              enhancerTelemetry: effectiveEnhancerTelemetry,
            }
          : undefined,
      },
    }));
    setActiveTaskId(null);
    setShowGenerateWizard(false);
    setGenerateStatus("");
    try {
      let result;
      if (isBuilderGeneration) {
        const profileId = styleDirection.performanceProfileId || DEFAULT_PERFORMANCE_PROFILE_ID;
        const profile = WEIGHT_BUDGETS[profileId];
        const performanceProfile = {
          id: profile.id,
          label: profile.label,
          heavyMax: profile.heavyMax,
          mediumMax: profile.mediumMax,
        };
        result = await window.reactBitsApi.generatePlayground({
          options: {
            installMethod: installTab, packageManager, installData: parsedInstallData,
            projectName: uniqueProjectName, projectPath, openWhenDone, runWhenDone,
            scrollbarStyle: scrollbarStyle.mode !== 'default' ? scrollbarStyle : null,
            aiSupport,
            pages,
            resolvedPages: resolvedPageIntents,
            styleDirection,
            designRules,
            clientBrief,
            presetName: loadedPresetName,
            enhancerQualityScore: effectiveEnhancerQualityScore,
            performanceProfile,
          },
          selectedComponents: await Promise.all(selectedComponents.map(c => window.reactBitsApi.getComponentFullContext(c.category, c.name, c.id))),
          enhancedPrompt: effectiveEnhancedPrompt,
        }, null, taskId);
      } else {
        result = await window.reactBitsApi.generatePlayground(
          selected!.category, selected!.name, selected!.usageMarkdown, componentFiles,
          { installMethod: installTab, packageManager, installData: parsedInstallData, projectName: uniqueProjectName, projectPath, openWhenDone, runWhenDone },
          taskId
        );
      }
      if (result.success) {
        const warnings = Array.isArray(result.warnings) ? result.warnings : [];
        const completedWithWarnings = !!result.completedWithWarnings || warnings.length > 0;
        const finalStatus: 'success' | 'warning' = completedWithWarnings ? 'warning' : 'success';
        const completionMessage = completedWithWarnings
          ? `Generation Complete with ${warnings.length} warning(s).`
          : (runWhenDone ? "Generation Complete! Auto Run Enabled." : "Generation Complete!");
        setTasks(prev => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: finalStatus,
            progress: completionMessage,
            path: result.path,
            hasTerminalError: false,
            warnings,
            completedWithWarnings,
            completedAt: Date.now(),
          },
        }));
        setGenerateStatus(result.message || (completedWithWarnings ? `Done with ${warnings.length} warning(s).` : "Success!"));

        if (lastEnhancedPrompt) setLastEnhancedPrompt(null);
        setLastEnhancerQualityScore(undefined);
        setLastEnhancerTelemetry(undefined);
      } else {
        setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'error', progress: "Error occurred", error: result.error, hasTerminalError: true, completedAt: Date.now() } }));
        setGenerateStatus(`Failed: ${result.error || "Unknown error"}`);
      }
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      setTasks(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'error', progress: "Crash!", error: message, hasTerminalError: true, completedAt: Date.now() } }));
      setGenerateStatus(`Error: ${message}`);
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
      if (selectedIds.length >= MAX_SELECTED_COMPONENTS_TOTAL) {
        showStatus("warning", `Maximum ${MAX_SELECTED_COMPONENTS_TOTAL} components allowed.`, 5000);
        return;
      }
      const categoryCount = selectedIds.filter(sid => items.find(i => i.id === sid)?.category === item.category).length;
      const limit = CATEGORY_LIMITS[item.category] || 99;
      if (categoryCount >= limit) {
        showStatus("warning", `Limit reached! You can only select up to ${limit} ${item.category}.`, 5000);
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
      projectName,
      packageManager,
      styleDirection,
      clientBrief,
      pages,
      scrollbarStyle,
    });
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    setLoadedPresetName(preset.name ?? '');
    const VALID_AESTHETICS = ['Minimal', 'Editorial', 'Brutalist', 'Futuristic'];
    const VALID_SITE_TYPES = ['Landing', 'Portfolio', 'SaaS', 'Agency'];

    setProjectPrompt(preset.projectPrompt ?? '');
    setSelectedIds((preset.selectedComponentIds ?? []).slice(0, MAX_SELECTED_COMPONENTS_TOTAL));
    setDesignRules(preset.designRules ?? DEFAULT_DESIGN_RULES);
    setProjectName(preset.projectName ?? '');
    setPackageManager((preset.packageManager ?? 'npm') as typeof packageManager);

    // Sanitize styleDirection — filter out removed aesthetics/siteTypes so old presets don't break
    const rawStyle = preset.styleDirection ?? DEFAULT_STYLE_DIRECTION;
    const sanitizedStyle = {
      ...rawStyle,
      aesthetics: (rawStyle.aesthetics ?? []).filter((a: string) => VALID_AESTHETICS.includes(a)),
      siteType: VALID_SITE_TYPES.includes(rawStyle.siteType ?? '') ? rawStyle.siteType : 'Landing',
    };
    // If all aesthetics were filtered out (old preset), default to Minimal
    if (sanitizedStyle.aesthetics.length === 0) sanitizedStyle.aesthetics = ['Minimal'];
    setStyleDirection(sanitizedStyle);

    setClientBrief(preset.clientBrief ?? DEFAULT_CLIENT_BRIEF);
    // v4-v6 field — migrate old page payloads safely to inheritance model
    setPages(normalizePresetPages(preset.pages));
    // v5 field — fall back safely for older presets
    setScrollbarStyle(preset.scrollbarStyle ?? { mode: 'custom' });
    showStatus('success', `✓ Loaded "${preset.name}"`, 3000);
  };

  const handleDeletePreset = async (id: string) => { await window.reactBitsApi?.deletePreset?.(id); };

  const handleBuilderGenerate = async () => {
    const runningTasksCount = Object.values(tasks).filter(t => t.status === 'running').length;
    if (runningTasksCount >= 5) {
      showStatus("warning", "Task limit reached (max 5 running). Please wait for some to finish!");
      return;
    }

    if (!aiSupport) {
      setLastEnhancedPrompt(null);
      setLastEnhancerQualityScore(undefined);
      setLastEnhancerTelemetry(undefined);
      // Default project name: use brand name > selected component > site type
      const defaultName = clientBrief.brandName
        ? clientBrief.brandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : selected
          ? `${selected.name.toLowerCase()}-demo`
          : `${(styleDirection.siteType || 'project').toLowerCase()}-site`;
      setProjectName(defaultName || 'my-project');
      builderModeRef.current = true;
      setShowGenerateWizard(true);
      return;
    }

    setGenerateStatus("Scavenging component source code...");
    setLastEnhancerQualityScore(undefined);
    setLastEnhancerTelemetry(undefined);
    try {
      const componentsWithContext = await Promise.all(
        selectedComponents.map(async (comp) => {
          try { return await window.reactBitsApi.getComponentFullContext(comp.category, comp.name, comp.id); }
          catch (e) {
            console.warn(`Failed to gather context for ${comp.name}`, e);
            return { id: comp.id, name: comp.name, category: comp.category, files: [], usage: '', install: '' };
          }
        })
      );
      setGenerateStatus("AI Architect is designing your project...");
      const enhanceResult = await window.reactBitsApi.enhancePrompt(await buildEnhancePayload(componentsWithContext));
      const enhanceData = enhanceResult as EnhancePromptResult;
      if (enhanceData.success) {
        const enhancedPrompt = enhanceData.enhancedPrompt ?? null;
        if (!enhancedPrompt) {
          showStatus("warning", "AI returned success without an enhanced prompt.");
          return;
        }
        setToastType("success");
        setGenerateStatus("Project Design Ready!");
        setLastEnhancedPrompt(enhancedPrompt);
        setLastEnhancerQualityScore(enhanceData.qualityReport?.qualityScore);
        setLastEnhancerTelemetry(enhanceData.telemetry);
        setProjectName(typeof enhancedPrompt.projectMeta === "object" && enhancedPrompt.projectMeta && "title" in enhancedPrompt.projectMeta
          ? String((enhancedPrompt.projectMeta as { title?: string }).title || "reactbits-ai-project")
          : "reactbits-ai-project");
        builderModeRef.current = true;
        setShowGenerateWizard(true);
      } else {
        showStatus("warning", `AI Error: ${enhanceData.error ?? "Unknown error"}`, 5000);
      }
    } catch (err: unknown) {
      showStatus("warning", `Error: ${getErrorMessage(err)}`, 5000);
    }
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
      createdAt: Date.now(),
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

    const structureOptions: ProjectStructureOptions = {
      pages: structureWizard.pages,
      navbarComponentId: structureWizard.navbarId,
      projectName: uniqueProjectName,
      outputPath: structureWizard.outputPath,
      packageManager: structureWizard.packageManager,
      openWhenDone: structureWizard.openWhenDone,
      selectedComponents: componentsWithFiles,
      taskId: taskId,
    };
    const result = await window.reactBitsApi.generateStructure(structureOptions);

    const pageCount = structureWizard.pages.length;
    const successMsg = `${uniqueProjectName} — ${pageCount} page${pageCount !== 1 ? 's' : ''} ready`;

    setTasks(prev => ({
      ...prev,
      [taskId]: { 
        ...prev[taskId], 
        status: result.success ? 'success' : 'error', 
        progress: result.success ? successMsg : (result.error ?? 'Failed'), 
        path: result.success ? (result.path || `${structureWizard.outputPath}/${uniqueProjectName}`) : prev[taskId].path,
        hasTerminalError: !result.success,
        completedAt: Date.now(),
      },
    }));

    if (result.success) {
      showStatus('success', successMsg, 6000);
    } else {
      showStatus('warning', `Structure generation failed: ${result.error ?? 'Unknown error'}`, 6000);
    }
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
          <ClaudeInfoPanel tasks={tasks} />
        </div>

        <section className="scene">
          <aside className="component-sidebar">
            <ComponentListPane
              items={items}
              selectedId={selectedId}
              selectedIds={selectedIds}
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
              styleDirection={styleDirection}
              onStyleDirectionChange={setStyleDirection}
              clientBrief={clientBrief}
              onClientBriefChange={setClientBrief}
              scrollbarStyle={scrollbarStyle}
              onScrollbarStyleChange={setScrollbarStyle}
              onRestoreFromHistory={(p: string, sels: Array<{ id: string }>) => {
                setProjectPrompt(p);
                setSelectedIds(sels.map((s: { id: string }) => s.id));
                showStatus("success", "Restored project from history!", 3000);
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
        onClose={() => { builderModeRef.current = false; setShowGenerateWizard(false); }}
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
        aiSupport={aiSupport}
        onAiSupportChange={setAiSupport}
        onConfirm={confirmGenerate}
        builderMode={showGenerateWizard && builderModeRef.current}
        generationSummary={
          selectedComponents.length > 0 || styleDirection.aesthetics.length > 0
            ? `${styleDirection.aesthetics[0] ?? 'Default'} · ${styleDirection.siteType}${selectedComponents.length > 0 ? ` · ${selectedComponents.length} component${selectedComponents.length !== 1 ? 's' : ''}` : ''}`
            : undefined
        }
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
