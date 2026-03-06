/**
 * URL utilities for comparison pages
 * Ensures consistent canonical URLs by enforcing alphabetical order
 */

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
 * Generate a canonical comparison URL for two device IDs
 * Always returns static canonical page: /comparison/a-vs-b
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Canonical comparison URL path
 */
export function getComparisonUrl(id1: string, id2: string): string {
  return `/comparison/${getComparisonSlug(id1, id2)}`;
}

/**
 * Link data for comparison pages with SEO attributes
 */
export interface ComparisonLinkData {
  href: string;
  isStatic: boolean;
}

/**
 * Generate internal comparison link data.
 * All internal comparison links should point to canonical static pages.
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Link data
 */
export function getComparisonLink(id1: string, id2: string): ComparisonLinkData {
  return {
    href: getComparisonUrl(id1, id2),
    isStatic: true,
  };
}
