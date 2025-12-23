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

// Generate a deterministic offset (0-6 days) based on string hash
function getDateOffset(id: string): number {
  let hash = 0;
  for (const char of id) hash = ((hash << 5) - hash) + char.charCodeAt(0);
  return Math.abs(hash) % 7;
}

// Get Monday as base date
// Mon-Wed: use last week's Monday (ensures 4-10 days spread)
// Thu-Sun: use this week's Monday (ensures 0-6 days spread)
function getBaseMonday(): Date {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon, ...
  const daysSinceMonday = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6

  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  // Mon(0), Tue(1), Wed(2) → use last week's Monday
  if (daysSinceMonday <= 2) {
    monday.setDate(monday.getDate() - 7);
  }

  return monday;
}

// Get scattered date for a page, ensuring it doesn't exceed today
export function getScatteredDate(pageId: string): string {
  const baseDate = getBaseMonday();
  const offset = getDateOffset(pageId);
  baseDate.setDate(baseDate.getDate() + offset);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const finalDate = baseDate > today ? today : baseDate;
  return finalDate.toISOString().split('T')[0];
}

// Content dates for sitemap (blog and static pages)
export const contentDates = {
  blogContent: '2025-12-22',
  staticContent: '2025-12-22',
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
