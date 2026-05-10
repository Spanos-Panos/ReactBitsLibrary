import { DEFAULT_PERFORMANCE_PROFILE_ID } from '../../shared/data/componentRoles';
import type { ClientBrief, DesignRules, StyleDirection } from './builderTypes';

export const DEFAULT_DESIGN_RULES: DesignRules = {
  fonts: [],
  colors: [],
  sizes: {
    optimizationTarget: 'adaptive',
    spacingScale: '',
    borderRadius: '',
  },
  images: [],
};

export const DEFAULT_STYLE_DIRECTION: StyleDirection = {
  aesthetics: [],
  siteType: 'Landing',
  typographyIntensity: 'dramatic',
  visualEffects: [],
  colorStrategy: 'dark-bold-accent',
  audience: '',
  performanceProfileId: DEFAULT_PERFORMANCE_PROFILE_ID,
};

export const DEFAULT_CLIENT_BRIEF: ClientBrief = {
  brandName: '', tagline: '', industry: '', description: '', usp: '',
  services: '', targetAudience: '', callToAction: '', keyBenefits: '',
  tone: '', personality: '', contactEmail: '', contactPhone: '', location: '', socialLinks: '',
};
