// Device age calculation utilities for dynamic content freshness

import type { Device } from '../data/devices';

/**
 * Calculate the number of months between a release date and now
 */
function getMonthsDiff(releasedAt: string): number {
  const [year, month] = releasedAt.split('-').map(Number);
  const now = new Date();
  const released = new Date(year, month - 1);
  return (now.getFullYear() - released.getFullYear()) * 12 + (now.getMonth() - released.getMonth());
}

/**
 * Generate upgrade insight when comparing two devices
 * Returns null if devices are too similar in age or comparison doesn't make sense
 */
export interface UpgradeInsight {
  title: string;
  content: string;
  newerDevice: Device;
  olderDevice: Device;
  monthsDiff: number;
}

// Age tier thresholds and descriptors
type AgeTier = 'mild' | 'moderate' | 'significant';

const AGE_TIERS: Record<AgeTier, { intensity: string; suffix: string }> = {
  mild: { intensity: 'incremental', suffix: 'updates' },
  moderate: { intensity: 'noticeable', suffix: 'upgrades' },
  significant: { intensity: 'major', suffix: 'improvements' },
};

// Category-specific upgrade highlights
const CATEGORY_HIGHLIGHTS: Record<Device['category'], string[]> = {
  phone: ['camera', 'chip performance', 'software support'],
  tablet: ['display', 'chip performance', 'productivity features'],
  monitor: ['panel quality', 'refresh rate', 'color accuracy'],
  tv: ['picture quality', 'smart features', 'HDR support'],
  projector: ['brightness', 'resolution', 'smart features'],
};

function getAgeTier(monthsDiff: number): AgeTier {
  if (monthsDiff < 18) return 'mild';
  if (monthsDiff < 36) return 'moderate';
  return 'significant';
}

function formatTimeDiff(monthsDiff: number): string {
  const years = Math.floor(monthsDiff / 12);
  if (years >= 1) return `${years} year${years > 1 ? 's' : ''}`;
  return `${monthsDiff} months`;
}

export function getUpgradeInsight(deviceA: Device, deviceB: Device): UpgradeInsight | null {
  if (!deviceA.releasedAt || !deviceB.releasedAt) return null;
  if (deviceA.category !== deviceB.category) return null;

  const monthsA = getMonthsDiff(deviceA.releasedAt);
  const monthsB = getMonthsDiff(deviceB.releasedAt);
  const monthsDiff = Math.abs(monthsA - monthsB);

  if (monthsDiff < 10) return null;

  const [newerDevice, olderDevice] = monthsA < monthsB ? [deviceA, deviceB] : [deviceB, deviceA];
  const tier = AGE_TIERS[getAgeTier(monthsDiff)];
  const highlights = CATEGORY_HIGHLIGHTS[newerDevice.category].join(', ');

  return {
    title: 'Upgrade Insight',
    content: `The ${newerDevice.name} is ${formatTimeDiff(monthsDiff)} newer, with ${tier.intensity} ${tier.suffix} in ${highlights}.`,
    newerDevice,
    olderDevice,
    monthsDiff,
  };
}
