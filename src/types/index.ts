export interface Task {
  id: string;
  name: string;
  projectName: string;
  progress: string;
  logs: string[];
  status: 'running' | 'success' | 'error';
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
