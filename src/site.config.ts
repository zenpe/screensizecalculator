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
