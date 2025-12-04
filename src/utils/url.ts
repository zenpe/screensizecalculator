/**
 * URL utilities for comparison pages
 * Ensures consistent canonical URLs by enforcing alphabetical order
 */

/**
 * Generate a canonical comparison URL for two device IDs
 * Always returns alphabetically sorted URL to prevent duplicate content
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Canonical comparison URL path (e.g., "/comparison/apple-vs-samsung")
 *
 * @example
 * getComparisonUrl('samsung-s24', 'iphone-16') // returns '/comparison/iphone-16-vs-samsung-s24'
 * getComparisonUrl('iphone-16', 'samsung-s24') // returns '/comparison/iphone-16-vs-samsung-s24'
 */
export function getComparisonUrl(id1: string, id2: string): string {
  const [a, b] = [id1, id2].sort();
  return `/comparison/${a}-vs-${b}`;
}

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
