import type { ComponentFile, ReactBitsItem } from './index';

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
  screenshotPath?: string;
  weaknessesMd: string;
  backupFirst: boolean;
  taskId: string;
}

export interface VisionReworkReadyData {
  taskId: string;
  projectPath: string;
  screenshotPath: string | null;
  screenshotError: string | null;
  presetJsonPath: string | null;
}

export interface ReactBitsApi {
  getItems(): ReactBitsItem[];
  getDiagnostics(): unknown;
  getComponentFiles(category: string, name: string): ComponentFile[];
  getComponentFullContext(category: string, name: string, id: string): Promise<ComponentContext>;
  generatePlayground(...args: unknown[]): Promise<GenerateResult>;
  onGenerateProgress(cb: (msg: string, taskId: string) => void): () => void;
  onGenerateLog(cb: (msg: string, taskId: string) => void): () => void;
  selectDirectory(): Promise<string | null>;
  savePrompt(data: unknown): Promise<unknown>;
  getHistory(): Promise<unknown>;
  clearHistory(): Promise<unknown>;
  openHistoryFolder(): Promise<unknown>;
  enhancePrompt(payload: unknown): Promise<unknown>;
  terminateTask(taskId: string): Promise<{ success: boolean; error?: string }>;
  savePreset(preset: unknown): Promise<unknown>;
  listPresets(): Promise<unknown>;
  deletePreset(id: string): Promise<unknown>;
  openPresetsFolder(): Promise<unknown>;
  importPreset(): Promise<{ success?: boolean; preset?: unknown; canceled?: boolean; error?: string }>;
  addComponent(payload: NewComponentPayload): Promise<AddComponentResult>;
  pickDesignImages(): Promise<Array<{ name: string; path: string; base64: string }>>;
  captureProjectScreenshot(projectPath: string): Promise<ScreenshotResult>;
  runVisionRework(payload: VisionReworkPayload): Promise<{ success: boolean; taskId?: string; error?: string }>;
  pickSingleFile(filters: Array<{ name: string; extensions: string[] }>): Promise<PickFileResult | null>;
  onVisionReworkReady(cb: (data: VisionReworkReadyData) => void): () => void;
  onVisionReworkProgress(cb: (msg: string, taskId: string) => void): () => void;
}

declare global {
  interface Window {
    reactBitsApi: ReactBitsApi;
  }
}
