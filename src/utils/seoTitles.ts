/**
 * SEO Title Generation System
 *
 * Generates dynamic, deterministic titles for device detail and comparison pages.
 * Uses device characteristics to select from multiple templates, ensuring:
 * - Same device always gets the same title (deterministic)
 * - Different devices may get different title patterns (variety)
 * - All titles are SEO-optimized and within character limits
 */

import type { Device } from '../data/devices';

// ============================================================================
// Types
// ============================================================================

type TitleGenerator<T extends unknown[]> = (...args: T) => string;

interface CategoryTemplates {
  detail: TitleGenerator<[Device]>[];
  detailH1: TitleGenerator<[Device]>[];
  detailDescription: TitleGenerator<[Device, Dimensions]>[];
}

interface ComparisonTemplates {
  sameSize: TitleGenerator<[string, string, number]>[];
  differentSize: TitleGenerator<[string, string, number, number]>[];
  h1: TitleGenerator<[string, string]>[];
  description: TitleGenerator<[Device, Device, number, number]>[];
}

interface Dimensions {
  width: number;
  height: number;
}

// ============================================================================
// Configuration - Title Templates
// ============================================================================

const DETAIL_TEMPLATES: Record<string, CategoryTemplates> = {
  phone: {
    detail: [
      (d) => `${d.name} Screen Size: ${d.diagonal}" Dimensions`,
      (d) => `${d.name} Display: ${d.diagonal} Inch Screen Size`,
      (d) => `How Big is ${d.name}? ${d.diagonal}" Screen`,
      (d) => `${d.name}: ${d.diagonal}" Screen Size & Specs`,
    ],
    detailH1: [
      (d) => `${d.name} Screen Size`,
      (d) => `${d.name} Display Size`,
      (d) => `How Big is ${d.name}?`,
      (d) => `${d.name} Screen Size`,
    ],
    detailDescription: [
      (d, dims) => {
        const specs = buildPhoneSpecs(d);
        return `${d.name} screen is ${d.diagonal}" (${fmt(dims.width)}" wide × ${fmt(dims.height)}" tall).${specs} Compare sizes & specs.`;
      },
    ],
  },

  tv: {
    detail: [
      (d) => `${d.diagonal}" TV Size: Dimensions & Viewing Distance`,
      (d) => `${d.diagonal} Inch TV: Width, Height & Distance Guide`,
      (d) => `How Big is a ${d.diagonal}" TV? Dimensions in Inches`,
    ],
    detailH1: [
      (d) => `${d.diagonal}" TV Size`,
      (d) => `${d.diagonal} Inch TV Dimensions`,
      (d) => `How Big is a ${d.diagonal}" TV?`,
    ],
    detailDescription: [
      (d, dims) => {
        const [minDist, maxDist] = calcViewingDistance(d.diagonal);
        return `${d.diagonal}" TV is ${fmt(dims.width)}" wide × ${fmt(dims.height)}" tall. Viewing distance: ${minDist}-${maxDist}ft. Size guide.`;
      },
    ],
  },

  monitor: {
    detail: [
      (d) => `${d.diagonal}" Monitor Size: Screen Dimensions`,
      (d) => `${d.diagonal} Inch Monitor: Dimensions & Desk Space`,
      (d) => `How Big is a ${d.diagonal}" Monitor? Size Guide`,
    ],
    detailH1: [
      (d) => `${d.diagonal}" Monitor Size`,
      (d) => `${d.diagonal} Inch Monitor Dimensions`,
      (d) => `How Big is a ${d.diagonal}" Monitor?`,
    ],
    detailDescription: [
      (d, dims) => `${d.diagonal}" monitor is ${fmt(dims.width)}" wide × ${fmt(dims.height)}" tall. Compare sizes for your desk setup.`,
    ],
  },

  tablet: {
    detail: [
      (d) => `${d.name} Size: ${d.diagonal}" Screen Dimensions`,
      (d) => `${d.name} Display: ${d.diagonal} Inch Screen`,
      (d) => `How Big is ${d.name}? ${d.diagonal}" Tablet Size`,
    ],
    detailH1: [
      (d) => `${d.name} Size`,
      (d) => `${d.name} Display Size`,
      (d) => `How Big is ${d.name}?`,
    ],
    detailDescription: [
      (d, dims) => `${d.name} is ${d.diagonal}" (${fmt(dims.width)}" wide × ${fmt(dims.height)}" tall). Compare tablet sizes for your needs.`,
    ],
  },

  projector: {
    detail: [
      (d) => `${d.diagonal}" Projector Screen: Size & Throw Distance`,
      (d) => `${d.diagonal} Inch Screen: Projector Distance Guide`,
    ],
    detailH1: [
      (d) => `${d.diagonal}" Projector Screen Size`,
      (d) => `${d.diagonal} Inch Projector Screen`,
    ],
    detailDescription: [
      (d, dims) => `${d.diagonal}" screen is ${fmt(dims.width)}" wide × ${fmt(dims.height)}" tall. Throw distance & room size guide.`,
    ],
  },
};

const COMPARISON_TEMPLATES: Record<string, ComparisonTemplates> = {
  phone: {
    sameSize: [
      (a, b, diag) => `${a} vs ${b}: Same ${diag}" Size Compared`,
      (a, b) => `Are ${a} and ${b} the Same Size? Comparison`,
      (a, b) => `${a} vs ${b}: Identical Screen Size?`,
    ],
    differentSize: [
      (a, b, da, db) => `${a} vs ${b} Size: ${da}" vs ${db}"`,
      (a, b) => `${a} vs ${b}: Screen Size Comparison`,
      (a, b) => `${a} vs ${b}: Which is Bigger?`,
      (a, b, da, db) => `${a} vs ${b}: ${Math.abs(da - db).toFixed(1)}" Difference`,
    ],
    h1: [
      (a, b) => `${a} vs ${b} Size Comparison`,
    ],
    description: [
      (a, b, areaA, areaB) => {
        const pct = calcAreaDiffPercent(areaA, areaB);
        const [larger, smaller] = areaA > areaB ? [a, b] : [b, a];
        return pct > 1
          ? `${larger.name} is ${pct}% bigger than ${smaller.name}. Visual size comparison with full specs.`
          : `${a.name} and ${b.name} are nearly identical in size. Compare dimensions & specs side by side.`;
      },
    ],
  },

  tv: {
    sameSize: [
      (a, b, diag) => `${diag}" TVs Compared: ${a} vs ${b}`,
    ],
    differentSize: [
      (a, b, da, db) => `${da}" vs ${db}" TV: Size & Viewing Distance`,
      (a, b, da, db) => `${da} vs ${db} Inch TV: Which Size to Buy?`,
      (a, b, da, db) => `${da}" vs ${db}" TV Size Comparison`,
    ],
    h1: [
      (a, b) => `${a} vs ${b} TV Size Comparison`,
    ],
    description: [
      (a, b) => {
        const [minA, maxA] = calcViewingDistance(a.diagonal);
        const [minB, maxB] = calcViewingDistance(b.diagonal);
        return `${a.diagonal}" vs ${b.diagonal}" TV comparison. Viewing distance: ${minA}-${maxA}ft vs ${minB}-${maxB}ft.`;
      },
    ],
  },

  monitor: {
    sameSize: [
      (a, b, diag) => `${diag}" Monitors Compared: Size & Specs`,
    ],
    differentSize: [
      (a, b, da, db) => `${da} vs ${db} Inch Monitor Size Compared`,
      (a, b, da, db) => `${da}" vs ${db}" Monitor: Size Difference`,
      (a, b, da, db) => `${da} vs ${db} Inch Monitor: Which to Choose?`,
    ],
    h1: [
      (a, b) => `${a} vs ${b} Monitor Size Comparison`,
    ],
    description: [
      (a, b) => `${a.diagonal}" vs ${b.diagonal}" monitor comparison. Compare dimensions & desk space requirements.`,
    ],
  },

  tablet: {
    sameSize: [
      (a, b, diag) => `${a} vs ${b}: Same ${diag}" Tablet Size`,
    ],
    differentSize: [
      (a, b, da, db) => `${a} vs ${b}: ${da}" vs ${db}" Tablet Size`,
      (a, b) => `${a} vs ${b}: Tablet Size Comparison`,
    ],
    h1: [
      (a, b) => `${a} vs ${b} Size Comparison`,
    ],
    description: [
      (a, b, areaA, areaB) => {
        const pct = calcAreaDiffPercent(areaA, areaB);
        return `${a.name} vs ${b.name} tablet comparison.${pct > 5 ? ` ${pct}% size difference.` : ''} Compare portability & specs.`;
      },
    ],
  },

  projector: {
    sameSize: [
      (a, b, diag) => `${diag}" Projector Screens Compared`,
    ],
    differentSize: [
      (a, b, da, db) => `${da}" vs ${db}" Projector Screen: Size Guide`,
      (a, b, da, db) => `${da} vs ${db} Inch Screen: Throw Distance`,
    ],
    h1: [
      (a, b) => `${a} vs ${b} Screen Size Comparison`,
    ],
    description: [
      (a, b) => `${a.diagonal}" vs ${b.diagonal}" projector screen comparison. Throw distance & room size guide.`,
    ],
  },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate deterministic hash from string
 * Same input always produces same output
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Select template deterministically based on device ID
 */
function selectTemplate<T>(templates: T[], deviceId: string): T {
  const index = hashString(deviceId) % templates.length;
  return templates[index];
}

/**
 * Shorten device name if too long (for title length limits)
 */
function shortenName(name: string, maxLength = 25): string {
  if (name.length <= maxLength) return name;

  // Remove common prefixes
  const prefixes = ['Samsung ', 'Apple ', 'Google '];
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
  }

  return name;
}

// ============================================================================
// Helper Functions
// ============================================================================

function fmt(num: number, decimals = 1): string {
  return num.toFixed(decimals);
}

function buildPhoneSpecs(device: Device): string {
  const specs: string[] = [];
  if (device.phone?.weight) specs.push(`${device.phone.weight}g`);
  if (device.phone?.battery) specs.push(`${device.phone.battery}mAh`);
  if (device.phone?.refreshRate) specs.push(`${device.phone.refreshRate}Hz`);
  return specs.length > 0 ? ` ${specs.join(', ')}.` : '';
}

function calcViewingDistance(diagonal: number): [string, string] {
  const min = (diagonal * 1.2 / 12).toFixed(1);
  const max = (diagonal * 2.5 / 12).toFixed(1);
  return [min, max];
}

function calcAreaDiffPercent(areaA: number, areaB: number): number {
  const larger = Math.max(areaA, areaB);
  const smaller = Math.min(areaA, areaB);
  return Math.round(((larger - smaller) / smaller) * 100);
}

// ============================================================================
// Public API - Detail Pages
// ============================================================================

/**
 * Generate SEO title for device detail page
 */
export function generateDetailTitle(device: Device): string {
  const templates = DETAIL_TEMPLATES[device.category]?.detail
    ?? DETAIL_TEMPLATES.phone.detail;

  const generator = selectTemplate(templates, device.id);
  return generator(device);
}

/**
 * Generate SEO description for device detail page
 */
export function generateDetailDescription(
  device: Device,
  dims: Dimensions
): string {
  const templates = DETAIL_TEMPLATES[device.category]?.detailDescription
    ?? DETAIL_TEMPLATES.phone.detailDescription;

  const generator = selectTemplate(templates, device.id);
  return generator(device, dims);
}

/**
 * Generate H1 for device detail page (consistent with title)
 */
export function generateDetailH1(device: Device): string {
  const templates = DETAIL_TEMPLATES[device.category]?.detailH1
    ?? DETAIL_TEMPLATES.phone.detailH1;

  const generator = selectTemplate(templates, device.id);
  return generator(device);
}

// ============================================================================
// Public API - Comparison Pages
// ============================================================================

/**
 * Generate SEO title for comparison page
 */
export function generateComparisonTitle(
  deviceA: Device,
  deviceB: Device,
  areaA: number,
  areaB: number
): string {
  const sizeDiff = Math.abs(deviceA.diagonal - deviceB.diagonal);
  const category = deviceA.category;
  const templates = COMPARISON_TEMPLATES[category] ?? COMPARISON_TEMPLATES.phone;

  // Use combined IDs for deterministic selection
  const combinedId = `${deviceA.id}-${deviceB.id}`;

  // Shorten names for title length
  const nameA = shortenName(deviceA.name);
  const nameB = shortenName(deviceB.name);

  if (sizeDiff < 0.2) {
    const generator = selectTemplate(templates.sameSize, combinedId);
    return generator(nameA, nameB, deviceA.diagonal);
  }

  const generator = selectTemplate(templates.differentSize, combinedId);
  return generator(nameA, nameB, deviceA.diagonal, deviceB.diagonal);
}

/**
 * Generate SEO description for comparison page
 */
export function generateComparisonDescription(
  deviceA: Device,
  deviceB: Device,
  areaA: number,
  areaB: number
): string {
  const category = deviceA.category;
  const templates = COMPARISON_TEMPLATES[category]?.description
    ?? COMPARISON_TEMPLATES.phone.description;

  const combinedId = `${deviceA.id}-${deviceB.id}`;
  const generator = selectTemplate(templates, combinedId);

  return generator(deviceA, deviceB, areaA, areaB);
}

/**
 * Generate H1 for comparison page (consistent with title)
 */
export function generateComparisonH1(
  deviceA: Device,
  deviceB: Device
): string {
  const category = deviceA.category;
  const templates = COMPARISON_TEMPLATES[category]?.h1
    ?? COMPARISON_TEMPLATES.phone.h1;

  const combinedId = `${deviceA.id}-${deviceB.id}`;
  const nameA = shortenName(deviceA.name);
  const nameB = shortenName(deviceB.name);

  const generator = selectTemplate(templates, combinedId);
  return generator(nameA, nameB);
}
