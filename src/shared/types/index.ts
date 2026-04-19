export interface Task {
  id: string;
  name: string;
  projectName: string;
  progress: string;
  logs: string[];
  status: 'running' | 'success' | 'error';
  type?: 'component' | 'web';
  error?: string;
  path?: string;
}

export interface ComponentFile {
  name: string;
  content: string;
}

export interface ReactBitsItem {
  id: string;
  name: string;
  category: string;
  usageMarkdown: string;
  relativePath: string;
}

export interface ParsedInstallData {
  cli: Record<string, string>;
  manual: Record<string, string>;
}

// ── Layout Config ──────────────────────────────────────────────────────────────

export type ZLayer       = 'background' | 'content' | 'overlay';
export type XAlign       = 'full-width' | 'left' | 'center' | 'right';
export type PositionType = 'fixed' | 'in-flow';
export type HeightHint   = 'fullscreen' | 'large' | 'medium' | 'strip';

export interface LayoutItem {
  componentName: string;
  category: string;
  position: PositionType;
  xAlign: XAlign;
  zLayer: ZLayer;
  heightHint: HeightHint;
}

export type LayoutConfig = LayoutItem[];
