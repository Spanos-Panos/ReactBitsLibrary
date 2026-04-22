export interface Task {
  id: string;
  name: string;
  projectName: string;
  progress: string;
  logs: string[];
  status: 'running' | 'success' | 'error';
  type?: 'component' | 'web' | 'structure';
  error?: string;
  path?: string;
  runWhenDoneUsed?: boolean;
  autoKillOnErrorUsed?: boolean;
  hasTerminalError?: boolean;
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
export type EntranceAnimation = 'none' | 'fade-in' | 'slide-up' | 'scale-up' | 'blur-in';
export type WidthHint         = 'full' | 'half' | 'third';

export interface LayoutItem {
  componentName: string;
  category: string;
  position: PositionType;
  xAlign: XAlign;
  zLayer: ZLayer;
  heightHint: HeightHint;
  entranceAnimation: EntranceAnimation;
  widthHint: WidthHint;
}

export type LayoutConfig = LayoutItem[];

// ── Multi-Page Generation ──────────────────────────────────────────────────────

export type PageType = 'home' | 'about' | 'services' | 'contact' | 'custom';

export interface PageConfig {
  id: string;
  title: string;
  type: PageType;
  componentIds: string[];
}

export interface ProjectStructureOptions {
  pages: PageConfig[];
  navbarComponentId: string;
  projectName: string;
  outputPath: string;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  taskId?: string;
}

export interface StructureGenerateResult {
  success: boolean;
  path?: string;
  error?: string;
}
