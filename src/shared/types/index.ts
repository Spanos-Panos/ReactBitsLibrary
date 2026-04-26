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
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  openWhenDone?: boolean;
  selectedComponents?: Array<{
    id: string;
    name: string;
    category: string;
    files?: ComponentFile[];
    usage?: string;
    install?: string;
  }>;
  taskId?: string;
}

export interface StructureGenerateResult {
  success: boolean;
  path?: string;
  error?: string;
}
