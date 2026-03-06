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

// Comparison indexing policy:
// All valid comparison pairs are generated as static /comparison/{slug} pages.

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
