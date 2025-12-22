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
};

// Content dates for SEO (ISO 8601 format)
// Update these when a category of templates is changed
export const contentDates = {
  // For device pages and comparison pages.
  // Update when [deviceId]-screen-size.astro or comparison/[slug].astro templates change.
  deviceContent: '2025-12-22',

  // For blog posts.
  // Update when BlogPost.astro or other blog templates change.
  blogContent: '2025-12-22',

  // For all other static pages (homepage, calculators, etc.).
  // Update when a main static page's structure or content changes.
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
