// Site configuration
export const siteConfig = {
  // Site URL for canonical links and structured data
  siteUrl: 'https://screensizecalculators.com',

  features: {
    // Disable comparison SEO pages without deleting their source files.
    comparisonSeoPages: false,
    // Keep the noindex compare tool out of global navigation by default.
    compareToolGlobalNav: false,
  },

  // Amazon Affiliate Program
  amazon: {
    enabled: true, // Set to true to enable Amazon affiliate links
    affiliateTag: 'screensizecal-20',
    baseUrl: 'https://www.amazon.com',
  },

  // SEO constraints
  seo: {
    metaDescriptionMinLength: 120,
    metaDescriptionMaxLength: 160,
    titleMaxLength: 60,
  },
};

export type ComparisonBrowseCategory = 'phone' | 'tablet' | 'tv' | 'monitor' | 'projector';

const comparisonBrowseFallbackMap: Record<ComparisonBrowseCategory, string> = {
  phone: '/devices/phones',
  tablet: '/devices/tablets',
  tv: '/devices/tvs',
  monitor: '/devices/monitors',
  projector: '/devices/projectors',
};

export function isComparisonSeoEnabled(): boolean {
  return siteConfig.features.comparisonSeoPages;
}

export function isCompareToolGlobalNavEnabled(): boolean {
  return siteConfig.features.compareToolGlobalNav;
}

export function getComparisonBrowseUrl(category?: ComparisonBrowseCategory): string {
  if (isComparisonSeoEnabled()) {
    if (!category) return '/comparison';
    if (category === 'phone') return '/comparison/phones';
    if (category === 'tablet') return '/comparison/tablets';
    if (category === 'tv') return '/comparison/tvs';
    if (category === 'monitor') return '/comparison/monitors';
    return '/comparison/projectors';
  }

  return category ? comparisonBrowseFallbackMap[category] : '/devices';
}

// Truncate and validate meta description for SEO
export function sanitizeMetaDescription(description: string, pageId?: string): string {
  const { metaDescriptionMaxLength } = siteConfig.seo;

  if (!description || description.trim() === '') {
    return '';
  }

  // Remove extra whitespace
  let sanitized = description.replace(/\s+/g, ' ').trim();

  // Log validation warning in development mode
  if (import.meta.env.DEV) {
    const validation = validateMetaDescription(sanitized);
    if (!validation.valid && validation.warning) {
      console.warn(`[SEO]${pageId ? ` ${pageId}:` : ''} ${validation.warning}`);
    }
  }

  // Truncate if too long, trying to break at word boundary
  if (sanitized.length > metaDescriptionMaxLength) {
    sanitized = sanitized.substring(0, metaDescriptionMaxLength - 3);
    const lastSpace = sanitized.lastIndexOf(' ');
    if (lastSpace > metaDescriptionMaxLength * 0.7) {
      sanitized = sanitized.substring(0, lastSpace);
    }
    sanitized += '...';
  }

  return sanitized;
}

// Validate meta description length (for build-time warnings)
export function validateMetaDescription(description: string): { valid: boolean; warning?: string } {
  const { metaDescriptionMinLength, metaDescriptionMaxLength } = siteConfig.seo;

  if (description.length < metaDescriptionMinLength) {
    return {
      valid: false,
      warning: `Meta description too short (${description.length} chars). Recommended: ${metaDescriptionMinLength}-${metaDescriptionMaxLength} chars.`
    };
  }

  if (description.length > metaDescriptionMaxLength) {
    return {
      valid: false,
      warning: `Meta description too long (${description.length} chars). Will be truncated. Recommended: ${metaDescriptionMinLength}-${metaDescriptionMaxLength} chars.`
    };
  }

  return { valid: true };
}

// Comparison indexing policy — rule engine + tiered quotas
export const comparisonIndexConfig = {
  version: '1.0',
  enabled: true,

  thresholds: {
    model: 55,
    sizeProfile: 50,
    mixed: 70,
  },

  categoryQuotas: {
    phone: 200,
    tablet: 60,
    monitor: 15,
    tv: 36,
    projector: 3,
    'projector-tv': 27,
  },

  // Keep critical comparison URLs indexed even if score/quotas are tight.
  pinnedSlugs: [] as string[],

  // Limit matrix explosion from one device linking to too many near-duplicate pairs.
  selectionPolicy: {
    maxIndexedPerDevice: {
      model: 12,
      sizeProfile: 12,
      mixed: 4,
    },
    duplicatePenalty: {
      startsAfter: 8,
      perExtra: 1,
      max: 8,
    },
  },

  modelPrefixes: ['iphone', 'ipad', 'samsung', 'google-pixel', 'surface'],

  profiles: {
    model: [
      { scorer: 'intent', weight: 30 },
      { scorer: 'generation', weight: 20 },
      { scorer: 'demand', weight: 5 },
      { scorer: 'completeness', weight: 15 },
      { scorer: 'recency', weight: 20 },
      { scorer: 'quality', weight: 10 },
    ],
    sizeProfile: [
      { scorer: 'intent', weight: 35 },
      { scorer: 'scene', weight: 25 },
      { scorer: 'completeness', weight: 20 },
      { scorer: 'demand', weight: 10 },
      { scorer: 'quality', weight: 10 },
    ],
    mixed: [
      { scorer: 'intent', weight: 30 },
      { scorer: 'scene', weight: 25 },
      { scorer: 'completeness', weight: 20 },
      { scorer: 'demand', weight: 10 },
      { scorer: 'quality', weight: 15 },
    ],
  },
} as const;

// Template version dates - update ONLY when you actually modify the templates
// These serve as fallback dates, actual content dates take priority if newer
export const templateVersions = {
  // Device detail page ([deviceId]-screen-size.astro)
  deviceTemplate: '2026-04-16',

  // Comparison page (comparison/[slug].astro)
  comparisonTemplate: '2025-12-29',

  // Blog post template (BlogPost.astro)
  blogTemplate: '2025-12-26',

  // Static pages (homepage, calculators, etc.)
  staticPages: '2025-12-26',
};

// Helper function to generate Amazon search URL with affiliate tag
export function getAmazonSearchUrl(keyword: string): string {
  const { affiliateTag, baseUrl } = siteConfig.amazon;
  return `${baseUrl}/s?tag=${affiliateTag}&k=${encodeURIComponent(keyword)}`;
}

// Helper function to generate Amazon URL with affiliate tag
export function getAmazonUrl(path: string = ''): string {
  const { affiliateTag, baseUrl } = siteConfig.amazon;
  const separator = path.includes('?') ? '&' : '?';
  return `${baseUrl}${path}${separator}tag=${affiliateTag}`;
}
