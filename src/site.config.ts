// Site configuration
export const siteConfig = {
  // Site URL for canonical links and structured data
  siteUrl: 'https://screensizecalculators.com',

  // Amazon Affiliate Program
  amazon: {
    enabled: false, // Set to true to enable Amazon affiliate links
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

// High-value comparison pages whitelist (keep SEO indexing)
// Other comparison pages will be noindex to avoid thin content penalty
// Based on GSC data analysis (28-day: 2025-12-26)
export const indexedComparisons = new Set([
  // === iPhone 17 comparisons (P0 - highest traffic) ===
  'iphone-13-vs-iphone-17',                    // 5 clicks, 1358 impressions
  'iphone-16-plus-vs-iphone-17',               // 5 clicks, 1337 impressions
  'iphone-16-vs-iphone-17-pro-max',            // 4 clicks, 1165 impressions
  'iphone-13-vs-iphone-17-pro',                // 5 clicks, 950 impressions
  'iphone-16-pro-vs-iphone-17',                // 4 clicks, 906 impressions
  'iphone-13-pro-max-vs-iphone-17-pro',        // 5 clicks, 812 impressions
  'iphone-15-vs-iphone-17',                    // 1 click, 749 impressions
  'iphone-15-vs-iphone-17-pro',                // 1 click, 894 impressions
  'iphone-15-pro-vs-iphone-17-pro',            // 3 clicks, 532 impressions
  'iphone-13-vs-iphone-17-pro-max',            // 4 clicks, 458 impressions
  'iphone-16-vs-iphone-17-air',                // 2 clicks, 408 impressions
  'iphone-16-pro-max-vs-iphone-17-air',        // 3 clicks, 314 impressions
  'iphone-17-air-vs-iphone-17-pro',            // 2 clicks, 558 impressions

  // === iPhone cross-generation (adjacent) ===
  // Note: slugs must be alphabetically sorted (e.g., iphone-13 < iphone-14)
  // 'iphone-13-vs-iphone-14',
  // 'iphone-13-vs-iphone-15',
  // 'iphone-14-vs-iphone-15',
  'iphone-15-vs-iphone-16',                    // 3 clicks, 634 impressions
  // 'iphone-15-pro-vs-iphone-16-pro',
  // 'iphone-15-pro-max-vs-iphone-16-pro-max',
  'iphone-16-vs-iphone-17',
  // 'iphone-16-pro-vs-iphone-17-pro',
  // 'iphone-16-pro-max-vs-iphone-17-pro-max',

  // === Cross-brand comparisons (iPhone vs Samsung) ===
  'iphone-17-vs-samsung-galaxy-s25',           // 5 clicks, 309 impressions
  'iphone-17-vs-samsung-galaxy-s25-ultra',     // 4 clicks, 157 impressions
  'iphone-17-pro-vs-samsung-galaxy-s25-ultra', // 2 clicks, 117 impressions
  'iphone-17-pro-max-vs-samsung-galaxy-s25',   // 3 clicks, 131 impressions

  // === Samsung comparisons ===
  'samsung-galaxy-s24-vs-samsung-galaxy-s25',
  'samsung-galaxy-s24-ultra-vs-samsung-galaxy-s25-ultra',
  'samsung-galaxy-s25-vs-samsung-galaxy-s25-ultra', // 3 clicks, 839 impressions
  'samsung-galaxy-s25-vs-samsung-galaxy-s25-plus',  // 2 clicks, 337 impressions

  // === Monitor comparisons ===
  '24-inch-monitor-vs-27-inch-monitor',
  '24-inch-monitor-vs-34-inch-ultrawide-monitor', // 2 clicks, 141 impressions
  '27-inch-monitor-vs-32-inch-monitor',
  '27-inch-monitor-vs-34-inch-ultrawide-monitor',
  '32-inch-monitor-vs-34-inch-ultrawide-monitor', // 4 clicks, 160 impressions
  '34-inch-ultrawide-monitor-vs-49-inch-super-ultrawide-monitor', // 2 clicks, 65 impressions

  // === TV comparisons ===
  '43-inch-tv-vs-55-inch-tv',
  '55-inch-tv-vs-65-inch-tv',
  '55-inch-tv-vs-75-inch-tv',
  '65-inch-tv-vs-75-inch-tv',
  '65-inch-tv-vs-85-inch-tv',                  // 2 clicks, 133 impressions
  '75-inch-tv-vs-85-inch-tv',

  // === Projector comparisons ===
  '100-inch-projector-screen-vs-120-inch-projector-screen',
  '120-inch-projector-screen-vs-150-inch-projector-screen', // 2 clicks, 31 impressions
]);

export const shouldIndexComparison = (slug: string): boolean => indexedComparisons.has(slug);

// Template version dates - update ONLY when you actually modify the templates
// These serve as fallback dates, actual content dates take priority if newer
export const templateVersions = {
  // Device detail page ([deviceId]-screen-size.astro)
  deviceTemplate: '2025-12-29',

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
