/**
 * Comparison utilities for generating and managing device comparison pairs
 */

import type { Device } from '../data/devices';
import { isValidComparison } from '../data/devices';
import { getComparisonSlug, getComparisonLink } from './url';
import type { SearchItem } from '../components/ComparisonSearch';

/**
 * Represents a comparison pair between two devices
 */
export interface ComparisonPair {
  a: Device;
  b: Device;
  slug: string;
  href: string;
  searchText: string;
}

/**
 * Category icon mapping
 */
const CATEGORY_ICONS: Record<Device['category'], string> = {
  phone: '📱',
  tablet: '📱',
  monitor: '🖥️',
  tv: '📺',
  projector: '📽️',
};

/**
 * Generate search text for a comparison pair
 * Used for filtering comparisons in search components
 */
export function generateSearchText(a: Device, b: Device): string {
  return `${a.name} ${b.name} ${a.category}`.toLowerCase();
}

/**
 * Convert a ComparisonPair to a lightweight SearchItem
 * This reduces serialized data size significantly
 */
export function toSearchItem(pair: ComparisonPair): SearchItem {
  return {
    searchText: pair.searchText,
    href: pair.href,
    label: `${pair.a.name} vs ${pair.b.name}`,
    subtitle: `${pair.a.diagonal}" vs ${pair.b.diagonal}" • ${pair.a.category}`,
    icon: CATEGORY_ICONS[pair.a.category] || '📺',
  };
}

/**
 * Convert an array of ComparisonPairs to SearchItems
 */
export function toSearchItems(pairs: ComparisonPair[]): SearchItem[] {
  return pairs.map(toSearchItem);
}

/**
 * Generate all valid comparison pairs from a list of devices
 *
 * @param devices - Array of devices to generate pairs from
 * @param filterFn - Optional filter function to include only specific pairs
 * @returns Array of comparison pairs with pre-computed search text and links
 */
export function generateComparisonPairs(
  devices: Device[],
  filterFn?: (a: Device, b: Device) => boolean
): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];

  for (let i = 0; i < devices.length; i++) {
    for (let j = i + 1; j < devices.length; j++) {
      const a = devices[i];
      const b = devices[j];

      // Skip if categories can't be compared
      if (!isValidComparison(a.category, b.category)) continue;

      // Skip if custom filter rejects the pair
      if (filterFn && !filterFn(a, b)) continue;

      const linkData = getComparisonLink(a.id, b.id);
      pairs.push({
        a,
        b,
        slug: getComparisonSlug(a.id, b.id),
        href: linkData.href,
        searchText: generateSearchText(a, b),
      });
    }
  }

  return pairs;
}

/**
 * Generate comparison pairs for a single category
 * Convenience wrapper for same-category comparisons
 */
export function generateCategoryPairs(
  devices: Device[],
  category: Device['category']
): ComparisonPair[] {
  const categoryDevices = devices.filter(d => d.category === category);
  return generateComparisonPairs(categoryDevices);
}

/**
 * Generate cross-category comparison pairs (e.g., TV vs Projector)
 */
export function generateCrossCategoryPairs(
  devices: Device[],
  categoryA: Device['category'],
  categoryB: Device['category']
): ComparisonPair[] {
  const devicesA = devices.filter(d => d.category === categoryA);
  const devicesB = devices.filter(d => d.category === categoryB);

  const pairs: ComparisonPair[] = [];

  for (const a of devicesA) {
    for (const b of devicesB) {
      if (!isValidComparison(a.category, b.category)) continue;

      const linkData = getComparisonLink(a.id, b.id);
      pairs.push({
        a,
        b,
        slug: getComparisonSlug(a.id, b.id),
        href: linkData.href,
        searchText: generateSearchText(a, b),
      });
    }
  }

  return pairs;
}

/**
 * Group devices by category
 */
export function groupDevicesByCategory(
  devices: Device[]
): Record<Device['category'], Device[]> {
  return {
    phone: devices.filter(d => d.category === 'phone'),
    tablet: devices.filter(d => d.category === 'tablet'),
    monitor: devices.filter(d => d.category === 'monitor'),
    tv: devices.filter(d => d.category === 'tv'),
    projector: devices.filter(d => d.category === 'projector'),
  };
}
