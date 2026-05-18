export interface Task {
  id: string;
  name: string;
  projectName: string;
  progress: string;
  logs: string[];
  status: 'running' | 'success' | 'warning' | 'error';
  type?: 'component' | 'web' | 'structure';
  error?: string;
  path?: string;
  runWhenDoneUsed?: boolean;
  autoKillOnErrorUsed?: boolean;
  hasTerminalError?: boolean;
  completedWithWarnings?: boolean;
  warnings?: string[];
  createdAt?: number;
  completedAt?: number;
  aiAnalytics?: {
    rawPrompt?: string;
    enhancedPrompt?: Record<string, unknown> | null;
    qualityScore?: number;
    reviewerSummary?: {
      attempts?: number;
      escalations?: number;
      finalGate?: 'PASS' | 'FAIL' | 'unknown';
    };
    enhancerTelemetry?: {
      createdAt: string;
      totalEstimatedCostUsd: number;
      stages: Array<{
        stage: string;
        model: string;
        usage: {
          inputTokens: number;
          outputTokens: number;
          cacheReadTokens: number;
          cacheWriteTokens: number;
        };
        estimatedCostUsd: number | null;
      }>;
    };
  };
}

export interface ComponentFile {
  name: string;
  content: string;
}

export type ComponentLibrary = 'reactbits' | 'universal';

export interface ReactBitsItem {
  id: string;
  name: string;
  category: string;
  usageMarkdown: string;
  relativePath: string;
  /** Defaults to reactbits when omitted (legacy manifest entries). */
  library?: ComponentLibrary;
}

export interface ParsedInstallData {
  cli: Record<string, string>;
  manual: Record<string, string>;
}



// ── Multi-Page Generation ──────────────────────────────────────────────────────

export type PageType = 'home' | 'about' | 'services' | 'pricing' | 'contact' | 'custom';

export type PageTone = 'inherit' | 'formal' | 'casual' | 'technical' | 'friendly' | 'bold' | 'playful';
export type PageDensity = 'inherit' | 'compact' | 'comfortable' | 'spacious';
export type PageEmphasis = 'inherit' | 'hero' | 'editorial' | 'grid';

export interface PageContentBlock {
  pageTitle?: string;
  tagline?: string;
  description?: string;
  callToAction?: string;
  valueProps?: string[];
  services?: Array<{ name: string; description: string }>;
  projects?: Array<{ title: string; summary?: string; tag?: string }>;
  founder?: { name: string; role: string; bio?: string };
  leadership?: Array<{ name: string; role: string; bio?: string }>;
  teamMembers?: Array<{ name: string; role: string }>;
  faqs?: Array<{ q: string; a: string }>;
}

export interface PageBriefOverrides {
  tagline?: string;
  description?: string;
  callToAction?: string;
  tone?: PageTone;
}

export interface PageStyleOverrides {
  siteType?: string;
  aesthetics?: string[];
  colorStrategy?: string;
  typographyIntensity?: string;
  visualEffects?: string[];
  audience?: string;
}

export interface PageDesignOverrides {
  colors?: Array<{ value: string; role: string }>;
  fonts?: Array<{ value: string; role: string }>;
  spacingScale?: 'inherit' | 'compact' | 'comfortable' | 'spacious';
  borderRadius?: 'inherit' | 'none' | 'small' | 'medium' | 'large' | 'pill';
  optimizationTarget?: 'inherit' | 'mobile' | 'tablet' | 'desktop' | 'adaptive';
}

export interface PageLayoutOverrides {
  density?: PageDensity;
  emphasis?: PageEmphasis;
}

export interface PageOverrides {
  enabled?: boolean;
  brief?: PageBriefOverrides;
  style?: PageStyleOverrides;
  design?: PageDesignOverrides;
  layout?: PageLayoutOverrides;
  content?: PageContentBlock;
}

export interface PageConfig {
  id: string;
  title: string;
  type: PageType;
  componentIds: string[];
  overrides?: PageOverrides;
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
