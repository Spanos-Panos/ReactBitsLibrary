import type { PageConfig } from '../types';
import type { ClientBrief, DesignRules, StyleDirection } from '../../features/project-builder/builderTypes';

export interface ResolvedPageIntent {
  id: string;
  title: string;
  type: PageConfig['type'];
  componentIds: string[];
  overridesEnabled: boolean;
  content: NonNullable<PageConfig['overrides']>['content'];
  resolvedBrief: ClientBrief;
  resolvedStyleDirection: StyleDirection;
  resolvedDesignRules: DesignRules;
}

const mergeUnique = (base: string[], override?: string[]) => {
  if (!override || override.length === 0) return base;
  return Array.from(new Set(override));
};

export function resolvePageIntent(
  page: PageConfig,
  globals: {
    clientBrief: ClientBrief;
    styleDirection: StyleDirection;
    designRules: DesignRules;
  },
): ResolvedPageIntent {
  const overridesEnabled = page.overrides?.enabled === true;
  const briefOverrides = overridesEnabled ? page.overrides?.brief : undefined;
  const styleOverrides = overridesEnabled ? page.overrides?.style : undefined;
  const designOverrides = overridesEnabled ? page.overrides?.design : undefined;

  const resolvedBrief: ClientBrief = {
    ...globals.clientBrief,
    ...(briefOverrides?.tagline ? { tagline: briefOverrides.tagline } : {}),
    ...(briefOverrides?.description ? { description: briefOverrides.description } : {}),
    ...(briefOverrides?.callToAction ? { callToAction: briefOverrides.callToAction } : {}),
    ...(briefOverrides?.tone && briefOverrides.tone !== 'inherit' ? { tone: briefOverrides.tone } : {}),
  };

  const resolvedStyleDirection: StyleDirection = {
    ...globals.styleDirection,
    ...(styleOverrides?.siteType ? { siteType: styleOverrides.siteType } : {}),
    ...(styleOverrides?.aesthetics?.length ? { aesthetics: styleOverrides.aesthetics as StyleDirection['aesthetics'] } : {}),
    ...(styleOverrides?.colorStrategy ? { colorStrategy: styleOverrides.colorStrategy as StyleDirection['colorStrategy'] } : {}),
    ...(styleOverrides?.typographyIntensity ? { typographyIntensity: styleOverrides.typographyIntensity as StyleDirection['typographyIntensity'] } : {}),
    ...(styleOverrides?.visualEffects?.length ? { visualEffects: mergeUnique(globals.styleDirection.visualEffects, styleOverrides.visualEffects) } : {}),
    ...(styleOverrides?.audience ? { audience: styleOverrides.audience } : {}),
  };

  const resolvedDesignRules: DesignRules = {
    ...globals.designRules,
    ...(designOverrides?.fonts?.length ? { fonts: designOverrides.fonts as DesignRules['fonts'] } : {}),
    ...(designOverrides?.colors?.length ? { colors: designOverrides.colors as DesignRules['colors'] } : {}),
    sizes: {
      ...globals.designRules.sizes,
      ...(designOverrides?.optimizationTarget && designOverrides.optimizationTarget !== 'inherit'
        ? { optimizationTarget: designOverrides.optimizationTarget }
        : {}),
      ...(designOverrides?.spacingScale && designOverrides.spacingScale !== 'inherit'
        ? { spacingScale: designOverrides.spacingScale }
        : {}),
      ...(designOverrides?.borderRadius && designOverrides.borderRadius !== 'inherit'
        ? { borderRadius: designOverrides.borderRadius }
        : {}),
    },
  };

  return {
    id: page.id,
    title: page.title,
    type: page.type,
    componentIds: Array.isArray(page.componentIds) ? page.componentIds : [],
    overridesEnabled,
    content: page.overrides?.content,
    resolvedBrief,
    resolvedStyleDirection,
    resolvedDesignRules,
  };
}

export function resolvePageIntents(
  pages: PageConfig[],
  globals: {
    clientBrief: ClientBrief;
    styleDirection: StyleDirection;
    designRules: DesignRules;
  },
): ResolvedPageIntent[] {
  return (pages || []).map(page => resolvePageIntent(page, globals));
}
