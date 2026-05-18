import type { PerformanceProfile } from '../../shared/data/componentRoles';
import type { PageConfig } from '../../shared/types/index';

export interface ComponentItem {
  id: string;
  name: string;
  category: string;
  usageMarkdown: string;
  library?: 'reactbits' | 'universal';
}

export type FontRole = 'heading' | 'body' | 'accent' | '';
export type ColorRole = 'background' | 'text' | 'components' | 'accent' | 'surface' | '';

export interface FontEntry { value: string; role: FontRole }
export interface ColorEntry { value: string; role: ColorRole }

export type ImageCategory = 'logo' | 'product' | 'inspiration';

export interface ImageEntry {
  name: string;
  path: string;
  base64: string;
  category?: ImageCategory;
}

export interface DesignRules {
  fonts: FontEntry[];
  colors: ColorEntry[];
  sizes: {
    optimizationTarget: 'mobile' | 'tablet' | 'desktop' | 'adaptive';
    spacingScale: 'compact' | 'comfortable' | 'spacious' | '';
    borderRadius: 'none' | 'small' | 'medium' | 'large' | 'pill' | '';
  };
  images: ImageEntry[];
}

export type AestheticPreset =
  | 'Editorial' | 'Brutalist' | 'Minimal' | 'Futuristic';

export type TypographyIntensity = 'subtle' | 'dramatic' | 'experimental' | '';

export type ColorStrategy =
  | 'dark-bold-accent' | 'light-subtle' | 'high-contrast-bw'
  | 'monochromatic' | 'colorful' | '';

export interface StyleDirection {
  aesthetics: AestheticPreset[];
  siteType: string;
  typographyIntensity: TypographyIntensity;
  visualEffects: string[];
  colorStrategy: ColorStrategy;
  audience: string;
  performanceProfileId?: PerformanceProfile['id'];
}

export interface ClientBrief {
  brandName: string;
  tagline: string;
  industry: string;
  description: string;
  usp: string;
  services: string;
  targetAudience: string;
  callToAction: string;
  keyBenefits: string;
  tone: string;
  personality: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  socialLinks: string;
}

export interface ScrollbarStyle {
  mode: 'default' | 'hidden' | 'custom';
  track?: string;
  thumb?: string;
  scrollBehavior?: 'smooth' | 'default';
}

export interface ProjectBuilderPanelProps {
  selectedComponents: ComponentItem[];
  maxSelectedComponents?: number;
  categoryLimits?: Record<string, number>;
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  designRules: DesignRules;
  onDesignRulesChange: (rules: DesignRules) => void;

  styleDirection: StyleDirection;
  onStyleDirectionChange: (s: StyleDirection) => void;
  clientBrief: ClientBrief;
  onClientBriefChange: (b: ClientBrief) => void;

  onRestoreFromHistory?: (prompt: string, selectedComponents: ComponentItem[]) => void;
  scrollbarStyle: ScrollbarStyle;
  onScrollbarStyleChange: (s: ScrollbarStyle) => void;
  pages: PageConfig[];
  onPagesChange: (pages: PageConfig[]) => void;
  onGenerateStructure: (pages: PageConfig[], navbarComponentId: string) => void;
  allComponents?: ComponentItem[];
  onToggleComponent?: (id: string) => void;
}
