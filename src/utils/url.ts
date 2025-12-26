/**
 * URL utilities for comparison pages
 * Ensures consistent canonical URLs by enforcing alphabetical order
 */

import { shouldIndexComparison } from '../site.config';

/**
 * Generate a canonical comparison slug for two device IDs
 * Always returns alphabetically sorted slug
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Canonical comparison slug (e.g., "apple-vs-samsung")
 */
export function getComparisonSlug(id1: string, id2: string): string {
  const [a, b] = [id1, id2].sort();
  return `${a}-vs-${b}`;
}

/**
 * Check if a comparison should use the static page (whitelisted)
 */
export function isStaticComparison(id1: string, id2: string): boolean {
  const slug = getComparisonSlug(id1, id2);
  return shouldIndexComparison(slug);
}

/**
 * Generate a canonical comparison URL for two device IDs
 * - Whitelisted comparisons → static page: /comparison/a-vs-b
 * - Non-whitelisted comparisons → dynamic page: /compare?a=x&b=y
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Canonical comparison URL path
 */
export function getComparisonUrl(id1: string, id2: string): string {
  const [a, b] = [id1, id2].sort();
  const slug = `${a}-vs-${b}`;

  if (shouldIndexComparison(slug)) {
    return `/comparison/${slug}`;
  }

  return `/compare?a=${a}&b=${b}`;
}

/**
 * Link data for comparison pages with SEO attributes
 */
export interface ComparisonLinkData {
  href: string;
  rel?: 'nofollow';
  isStatic: boolean;
}

/**
 * Generate comparison link data with appropriate SEO attributes
 * - Whitelisted: normal link (passes PageRank)
 * - Non-whitelisted: nofollow link (doesn't pass PageRank)
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Link data with href and optional rel attribute
 */
export function getComparisonLink(id1: string, id2: string): ComparisonLinkData {
  const [a, b] = [id1, id2].sort();
  const slug = `${a}-vs-${b}`;
  const isStatic = shouldIndexComparison(slug);

  if (isStatic) {
    return {
      href: `/comparison/${slug}`,
      isStatic: true,
    };
  }

  return {
    href: `/compare?a=${a}&b=${b}`,
    rel: 'nofollow',
    isStatic: false,
  };
}
