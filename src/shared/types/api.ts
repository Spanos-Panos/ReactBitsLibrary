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
  addComponent(payload: NewComponentPayload): Promise<AddComponentResult>;
  pickDesignImages(): Promise<Array<{ name: string; path: string; base64: string }>>;
}

declare global {
  interface Window {
    reactBitsApi: ReactBitsApi;
  }
}
