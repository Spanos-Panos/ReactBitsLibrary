import type { ComponentFile, ReactBitsItem, ProjectStructureOptions, StructureGenerateResult } from './index';
import type { ClientBrief, DesignRules, StyleDirection, ComponentItem as BuilderComponentItem, ScrollbarStyle } from '../../features/project-builder/ProjectBuilderPanel';

export interface ComponentContext {
  id: string;
  name: string;
  category: string;
  files: ComponentFile[];
  usage: string;
  install: string;
}

export interface NewComponentPayload {
  name: string;
  category: string;
  language: string;
  code: string;
  css: string;
  install: string;
  usage: string;
}

export interface AddComponentResult {
  ok: boolean;
  entry?: ReactBitsItem;
  error?: string;
}

export interface GenerateResult {
  success: boolean;
  path?: string;
  message?: string;
  error?: string;
}

export interface PickFileResult {
  canceled: boolean;
  path?: string;
  base64?: string;   // for image files
  content?: string;  // for text/md files
}

export interface ScreenshotResult {
  success: boolean;
  screenshotPath?: string;
  error?: string;
}

export interface VisionReworkPayload {
  projectPath: string;
  projectName: string;
  originalPreset: object;
  referenceImagePath: string;
  screenshotPath?: string | null;
  weaknessesMd: string;
  userPrompt: string;
  deviceTarget?: string;
  backupFirst: boolean;
  taskId: string;
  maxBudgetUsd?: number;
}

export interface EnhancePromptSystemContext {
  framework?: string;
  styling?: string;
  icons?: string;
  animations?: string[];
  architectureRules?: string[];
  designRules?: DesignRules;
  responsiveDirective?: string;
  styleDirection?: StyleDirection;
  clientBrief?: ClientBrief;
  layoutConfig?: unknown[] | null;
  componentRoleContext?: Array<{ name: string; role: string; footprint: string; behaviors: string[] }>;
}

export interface EnhancePromptPayload {
  rawPrompt: string;
  selectedComponents: Array<BuilderComponentItem | ComponentContext | Pick<ComponentContext, 'id' | 'name' | 'category'>>;
  systemContext?: EnhancePromptSystemContext;
}

export interface EnhancePromptResult {
  success: boolean;
  enhancedPrompt?: Record<string, unknown>;
  savedPaths?: { original: string; enhanced: string };
  qualityReport?: {
    attempt: number;
    shapeOk: boolean;
    shapeIssues: string[];
    qualityScore: number;
    qualityPenalties: string[];
  };
  error?: string;
  stage?: string;
}

export interface GeneratePlaygroundOptions {
  installMethod: 'cli' | 'manual';
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  installData: unknown;
  projectName: string;
  projectPath: string;
  openWhenDone: boolean;
  runWhenDone: boolean;
  autoKillOnError: boolean;
  layoutConfig?: unknown[] | null;
  scrollbarStyle?: ScrollbarStyle | null;
  polishPass?: boolean;
}

export interface GeneratePlaygroundPayload {
  options: GeneratePlaygroundOptions;
  selectedComponents: ComponentContext[];
  enhancedPrompt?: Record<string, unknown> | null;
}

export interface GeneratePlaygroundLegacyArgs {
  category: string;
  name: string;
  usageCode: string;
  componentFiles: ComponentFile[];
  options: GeneratePlaygroundOptions;
  taskId: string;
}

export interface VisionReworkReadyData {
  taskId: string;
  projectPath: string;
  screenshotPath: string | null;
  screenshotError: string | null;
  presetJsonPath: string | null;
  deviceTarget?: string;
}

export interface ReactBitsApi {
  getItems(): ReactBitsItem[];
  getDiagnostics(): unknown;
  getComponentFiles(category: string, name: string): ComponentFile[];
  getComponentFullContext(category: string, name: string, id: string): Promise<ComponentContext>;
  generatePlayground(payload: GeneratePlaygroundPayload, _legacyPlaceholder: null, taskId: string): Promise<GenerateResult>;
  generatePlayground(
    category: string,
    name: string,
    usageCode: string,
    componentFiles: ComponentFile[],
    options: GeneratePlaygroundOptions,
    taskId: string
  ): Promise<GenerateResult>;
  onGenerateProgress(cb: (msg: string, taskId: string) => void): () => void;
  onGenerateLog(cb: (msg: string, taskId: string) => void): () => void;
  selectDirectory(): Promise<string | null>;
  savePrompt(data: unknown): Promise<unknown>;
  getHistory(): Promise<unknown>;
  clearHistory(): Promise<unknown>;
  openHistoryFolder(): Promise<unknown>;
  enhancePrompt(payload: EnhancePromptPayload): Promise<EnhancePromptResult>;
  terminateTask(taskId: string): Promise<{ success: boolean; error?: string }>;
  savePreset(preset: unknown): Promise<unknown>;
  listPresets(): Promise<unknown>;
  deletePreset(id: string): Promise<unknown>;
  openPresetsFolder(): Promise<unknown>;
  importPreset(): Promise<{ success?: boolean; preset?: unknown; canceled?: boolean; error?: string }>;
  addComponent(payload: NewComponentPayload): Promise<AddComponentResult>;
  pickDesignImages(): Promise<Array<{ name: string; path: string; base64: string }>>;
  captureProjectScreenshot(opts: { projectPath: string; deviceTarget?: string }): Promise<ScreenshotResult>;
  runVisionRework(payload: VisionReworkPayload): Promise<{ success: boolean; taskId?: string; error?: string }>;
  pickSingleFile(filters: Array<{ name: string; extensions: string[] }>): Promise<PickFileResult | null>;
  onVisionReworkReady(cb: (data: VisionReworkReadyData) => void): () => void;
  onVisionReworkProgress(cb: (msg: string, taskId: string) => void): () => void;
  generateStructure(options: ProjectStructureOptions): Promise<StructureGenerateResult>;
  openPath(path: string): Promise<void>;
  checkDirectoryExists(path: string): Promise<boolean>;
  openInVSCode(path: string): Promise<void>;
}

declare global {
  interface Window {
    reactBitsApi: ReactBitsApi;
  }
}
