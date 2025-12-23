/**
 * Content Variants System
 * Generates varied content while preserving SEO keywords
 * Uses deterministic hashing to ensure consistent output per device
 */

import type { Device } from '../data/devices';

// Deterministic hash function for consistent variant selection
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Select variant based on device ID
export function selectVariant<T>(deviceId: string, variants: T[]): T {
  const index = hashString(deviceId) % variants.length;
  return variants[index];
}

// Shuffle array deterministically based on device ID
export function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const result = [...array];
  const hash = hashString(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = (hash + i * 31) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generate varied intro text while keeping core keywords
 * Core keywords preserved: device name, "screen size", diagonal, dimensions
 */
export function getIntroVariant(
  device: Device,
  dims: { width: number; height: number },
  area: number
): string {
  const fmt = (n: number, d = 1) => n.toFixed(d);

  const variants = [
    // Variant 1: Standard
    `${device.name} screen size is ${device.diagonal}" diagonally, with physical dimensions of ${fmt(dims.width, 2)}" × ${fmt(dims.height, 2)}". This provides ${fmt(area, 1)} square inches of viewing area.`,

    // Variant 2: Dimension-focused
    `The ${device.name} features a ${device.diagonal}" screen size, measuring ${fmt(dims.width, 2)}" wide by ${fmt(dims.height, 2)}" tall. The total screen area is ${fmt(area, 1)} square inches.`,

    // Variant 3: Area-focused
    `With ${fmt(area, 1)} square inches of screen area, the ${device.name} screen size measures ${device.diagonal}" diagonally (${fmt(dims.width, 2)}" × ${fmt(dims.height, 2)}").`,

    // Variant 4: Comparison-ready
    `At ${device.diagonal}" diagonal, the ${device.name} screen size offers dimensions of ${fmt(dims.width, 2)}" × ${fmt(dims.height, 2)}", totaling ${fmt(area, 1)} square inches of display.`,
  ];

  return selectVariant(device.id, variants);
}

/**
 * Generate device-specific insights based on attributes
 * These are unique content blocks that only appear for devices with specific features
 */
export function getDeviceInsights(device: Device): string[] {
  const insights: string[] = [];

  if (device.category === 'phone') {
    // Size-based insights
    if (device.diagonal <= 6.1) {
      insights.push(`The compact ${device.diagonal}" form factor makes ${device.name} ideal for one-handed use and fits comfortably in most pockets.`);
    } else if (device.diagonal >= 6.7) {
      insights.push(`With its large ${device.diagonal}" display, ${device.name} excels at media consumption, gaming, and productivity tasks that benefit from extra screen real estate.`);
    }

    // Phone-specific attributes
    if (device.phone?.refreshRate && device.phone.refreshRate >= 120) {
      insights.push(`The ${device.phone.refreshRate}Hz refresh rate delivers buttery-smooth scrolling and responsive touch input, particularly noticeable in gaming and everyday navigation.`);
    }

    if (device.phone?.peakBrightness && device.phone.peakBrightness >= 2000) {
      insights.push(`With ${device.phone.peakBrightness} nits peak brightness, ${device.name} remains easily readable even in direct sunlight, making it excellent for outdoor use.`);
    }

    if (device.phone?.weight) {
      if (device.phone.weight < 175) {
        insights.push(`At just ${device.phone.weight}g, ${device.name} is notably lightweight, reducing hand fatigue during extended use.`);
      } else if (device.phone.weight > 220) {
        insights.push(`The ${device.phone.weight}g weight gives ${device.name} a premium, substantial feel in hand, though it may be noticeable during long sessions.`);
      }
    }

    if (device.phone?.battery) {
      if (device.phone.battery >= 5000) {
        insights.push(`The large ${device.phone.battery}mAh battery provides excellent endurance, typically lasting well over a full day of heavy use.`);
      } else if (device.phone.battery < 4000) {
        insights.push(`The ${device.phone.battery}mAh battery prioritizes a slim profile, suitable for users who can charge throughout the day.`);
      }
    }

    if (device.phone?.screenType) {
      if (device.phone.screenType.includes('OLED') || device.phone.screenType.includes('AMOLED')) {
        insights.push(`The ${device.phone.screenType} display delivers deep blacks, vibrant colors, and excellent contrast ratios for an immersive viewing experience.`);
      }
    }

    if (device.phone?.alwaysOnDisplay) {
      insights.push(`Always-on display support lets you check time, notifications, and widgets at a glance without fully waking the screen.`);
    }
  }

  if (device.category === 'tv') {
    if (device.diagonal >= 75) {
      insights.push(`A ${device.diagonal}" TV creates a truly cinematic experience, best suited for dedicated home theater rooms or large open-concept living spaces.`);
    } else if (device.diagonal <= 50) {
      insights.push(`The ${device.diagonal}" size is perfect for bedrooms, offices, or smaller living rooms where viewing distance is typically under 8 feet.`);
    }

    if (device.diagonal >= 65) {
      insights.push(`For 4K content, this screen size allows you to appreciate the full detail of high-resolution video at typical living room viewing distances.`);
    }
  }

  if (device.category === 'monitor') {
    if (device.diagonal >= 32) {
      insights.push(`A ${device.diagonal}" monitor provides ample space for side-by-side windows, making it excellent for productivity, coding, and content creation.`);
    }

    if (device.ratio > 2) {
      insights.push(`The ultrawide aspect ratio eliminates the bezels of a dual-monitor setup while providing seamless screen real estate for multitasking.`);
    }
  }

  if (device.category === 'tablet') {
    if (device.diagonal >= 12) {
      insights.push(`At ${device.diagonal}", this tablet approaches laptop-class screen size, making it suitable as a primary productivity device with keyboard accessories.`);
    } else if (device.diagonal <= 8.5) {
      insights.push(`The compact ${device.diagonal}" size prioritizes portability, fitting easily in bags and comfortable for extended handheld reading sessions.`);
    }
  }

  if (device.category === 'projector') {
    if (device.diagonal >= 120) {
      insights.push(`A ${device.diagonal}" projection delivers a true cinema experience that no consumer TV can match, transforming your room into a private theater.`);
    }
  }

  return insights;
}

/**
 * Generate varied comparison intro text
 */
export function getComparisonIntroVariant(
  deviceA: Device,
  deviceB: Device,
  percentDiff: number,
  larger: Device,
  smaller: Device
): string {
  const variants = [
    // Variant 1: Size difference focus
    `This ${deviceA.name} vs ${deviceB.name} screen size comparison reveals a ${Math.abs(percentDiff).toFixed(0)}% difference in viewing area. The ${larger.name} (${larger.diagonal}") offers more screen real estate than the ${smaller.name} (${smaller.diagonal}").`,

    // Variant 2: Visual comparison focus
    `Compare ${deviceA.name} and ${deviceB.name} screen sizes side by side. With ${larger.diagonal}" vs ${smaller.diagonal}" diagonal measurements, the size difference becomes clear in our visual overlay.`,

    // Variant 3: Decision-focused
    `Choosing between ${deviceA.name} and ${deviceB.name}? This screen size comparison shows the ${larger.name} is ${Math.abs(percentDiff).toFixed(0)}% larger in viewing area, which may influence your decision.`,

    // Variant 4: Specification-focused
    `${deviceA.name} vs ${deviceB.name}: comparing ${deviceA.diagonal}" against ${deviceB.diagonal}" screen sizes. See exact dimensions, area calculations, and visual scale comparison below.`,
  ];

  return selectVariant(deviceA.id + deviceB.id, variants);
}

/**
 * Get varied supplementary phrases for descriptions
 */
export function getSupplementaryPhrase(deviceId: string, category: string): string {
  const phoneVariants = [
    'Perfect for everyday smartphone tasks.',
    'Balances screen size with portability.',
    'Designed for modern mobile experiences.',
    'Optimized for apps, media, and communication.',
  ];

  const tvVariants = [
    'Ideal for immersive home entertainment.',
    'Brings movies and shows to life.',
    'Perfect for family viewing experiences.',
    'Designed for modern living rooms.',
  ];

  const monitorVariants = [
    'Built for productivity and focus.',
    'Enhances your desktop workspace.',
    'Ideal for work and creative tasks.',
    'Optimized for extended computer use.',
  ];

  const tabletVariants = [
    'Versatile for work and entertainment.',
    'Portable productivity companion.',
    'Perfect for on-the-go computing.',
    'Balances capability with portability.',
  ];

  const projectorVariants = [
    'Creates a true cinema experience.',
    'Transforms any room into a theater.',
    'Ultimate large-screen entertainment.',
    'For the most immersive viewing.',
  ];

  const variantMap: Record<string, string[]> = {
    phone: phoneVariants,
    tv: tvVariants,
    monitor: monitorVariants,
    tablet: tabletVariants,
    projector: projectorVariants,
  };

  const variants = variantMap[category] || phoneVariants;
  return selectVariant(deviceId, variants);
}
