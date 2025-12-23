// Utility functions for generating unique comparison content

import type { Device } from '../data/devices';
import { hashString, selectVariant } from './contentVariants';

// Pocket fit thresholds (in mm for body height, inches for screen diagonal)
const POCKET_FIT_THRESHOLDS = {
  BODY_HEIGHT_EASY: 155,    // < 155mm fits easily
  BODY_HEIGHT_TIGHT: 165,   // 155-165mm tight fit
  DIAGONAL_EASY: 6.5,       // <= 6.5" fits easily
  DIAGONAL_TIGHT: 6.8,      // 6.5-6.8" tight fit
} as const;

// Helper to select variant based on comparison pair
function selectComparisonVariant<T>(deviceA: Device, deviceB: Device, variants: T[]): T {
  const seed = `${deviceA.id}-${deviceB.id}`;
  const index = hashString(seed) % variants.length;
  return variants[index];
}

// Determine pocket fit based on body height (if available) or screen diagonal
// Body height thresholds based on real-world pocket sizes:
// - < 155mm: Fits easily in most pockets
// - 155-165mm: Tight fit in standard pockets
// - > 165mm: May not fit in smaller pockets
function getPocketFit(device: Device): string {
  // Use body height if available (more accurate)
  if (device.phone?.dimensions?.height) {
    const bodyHeight = device.phone.dimensions.height;
    if (bodyHeight < POCKET_FIT_THRESHOLDS.BODY_HEIGHT_EASY) return 'Fits easily';
    if (bodyHeight <= POCKET_FIT_THRESHOLDS.BODY_HEIGHT_TIGHT) return 'Tight fit';
    return 'May not fit';
  }

  // Fallback to screen diagonal (less accurate)
  if (device.diagonal <= POCKET_FIT_THRESHOLDS.DIAGONAL_EASY) return 'Fits easily';
  if (device.diagonal <= POCKET_FIT_THRESHOLDS.DIAGONAL_TIGHT) return 'Tight fit';
  return 'May not fit';
}

interface ComparisonDimensions {
  width: number;
  height: number;
}

/**
 * Generate phone-specific comparison content
 */
function generatePhoneSpecificContent(deviceA: Device, deviceB: Device): string {
  const parts: string[] = [];

  // Battery comparison - only mention capacity difference, avoid unreliable time estimates
  if (deviceA.phone?.battery && deviceB.phone?.battery) {
    const batteryDiff = Math.abs(deviceA.phone.battery - deviceB.phone.battery);
    if (batteryDiff > 400) {
      const biggerBattery = deviceA.phone.battery > deviceB.phone.battery ? deviceA : deviceB;
      const smallerBattery = deviceA.phone.battery > deviceB.phone.battery ? deviceB : deviceA;
      parts.push(`${biggerBattery.name} has a larger ${biggerBattery.phone!.battery}mAh battery compared to ${smallerBattery.phone!.battery}mAh on ${smallerBattery.name}.`);
    }
  }

  // Weight comparison - use higher threshold (20g+)
  if (deviceA.phone?.weight && deviceB.phone?.weight) {
    const weightDiff = Math.abs(deviceA.phone.weight - deviceB.phone.weight);
    if (weightDiff >= 20) {
      const lighter = deviceA.phone.weight < deviceB.phone.weight ? deviceA : deviceB;
      const heavier = deviceA.phone.weight < deviceB.phone.weight ? deviceB : deviceA;
      parts.push(`${lighter.name} weighs ${lighter.phone!.weight}g, ${weightDiff}g lighter than ${heavier.name} at ${heavier.phone!.weight}g.`);
    }
  }

  // Refresh rate comparison - only when difference is significant (30Hz+)
  if (deviceA.phone?.refreshRate && deviceB.phone?.refreshRate) {
    const rateDiff = Math.abs(deviceA.phone.refreshRate - deviceB.phone.refreshRate);
    if (rateDiff >= 30) {
      const higherRate = deviceA.phone.refreshRate > deviceB.phone.refreshRate ? deviceA : deviceB;
      const lowerRate = deviceA.phone.refreshRate > deviceB.phone.refreshRate ? deviceB : deviceA;
      parts.push(`${higherRate.name} has a ${higherRate.phone!.refreshRate}Hz display versus ${lowerRate.phone!.refreshRate}Hz on ${lowerRate.name}.`);
    }
  }

  // Brightness comparison
  if (deviceA.phone?.peakBrightness && deviceB.phone?.peakBrightness) {
    const brightnessDiff = Math.abs(deviceA.phone.peakBrightness - deviceB.phone.peakBrightness);
    if (brightnessDiff > 500) {
      const brighter = deviceA.phone.peakBrightness > deviceB.phone.peakBrightness ? deviceA : deviceB;
      parts.push(`${brighter.name} reaches ${brighter.phone!.peakBrightness} nits peak brightness for better outdoor visibility.`);
    }
  }

  // Screen type comparison - only if meaningfully different
  if (deviceA.phone?.screenType && deviceB.phone?.screenType && deviceA.phone.screenType !== deviceB.phone.screenType) {
    const isOLED = (type: string) => type.includes('OLED') || type.includes('AMOLED');
    const aIsOLED = isOLED(deviceA.phone.screenType);
    const bIsOLED = isOLED(deviceB.phone.screenType);
    // Only mention if one is OLED and other is LCD
    if (aIsOLED !== bIsOLED) {
      const oledDevice = aIsOLED ? deviceA : deviceB;
      const lcdDevice = aIsOLED ? deviceB : deviceA;
      parts.push(`${oledDevice.name} uses ${oledDevice.phone!.screenType} with deeper blacks, while ${lcdDevice.name} has ${lcdDevice.phone!.screenType}.`);
    }
  }

  return parts.length > 0 ? ' ' + parts.slice(0, 2).join(' ') : '';
}

/**
 * Generate a unique 200-300 word description for a comparison
 * Uses multiple template variants for content diversity
 */
export function generateComparisonDescription(
  deviceA: Device,
  deviceB: Device,
  areaA: number,
  areaB: number,
  dimsA: ComparisonDimensions,
  dimsB: ComparisonDimensions
): string {
  const larger = areaA > areaB ? deviceA : deviceB;
  const smaller = areaA > areaB ? deviceB : deviceA;
  const largerArea = Math.max(areaA, areaB);
  const smallerArea = Math.min(areaA, areaB);

  const sizeDiff = Math.abs(deviceA.diagonal - deviceB.diagonal);
  const areaDiff = smallerArea > 0 ? ((largerArea - smallerArea) / smallerArea) * 100 : 0;
  const widthDiff = Math.abs(dimsA.width - dimsB.width);
  const heightDiff = Math.abs(dimsA.height - dimsB.height);

  // Opening variants
  const openingVariants = [
    `When comparing the ${deviceA.name} and ${deviceB.name}, `,
    `Looking at ${deviceA.name} versus ${deviceB.name}, `,
    `In this ${deviceA.name} vs ${deviceB.name} comparison, `,
    `Comparing the ${deviceA.name} with the ${deviceB.name}, `,
    `Between the ${deviceA.name} and ${deviceB.name}, `,
  ];

  let description = selectComparisonVariant(deviceA, deviceB, openingVariants);

  // Size difference analysis with multiple variants
  if (sizeDiff > 3) {
    const largeDiffVariants = [
      `there's a substantial ${sizeDiff.toFixed(1)}-inch gap in diagonal screen size. The ${larger.name} measures ${larger.diagonal}" diagonally, while the ${smaller.name} comes in at ${smaller.diagonal}". `,
      `the screen size difference is immediately apparent at ${sizeDiff.toFixed(1)} inches. With ${larger.diagonal}" on the ${larger.name} versus ${smaller.diagonal}" on the ${smaller.name}, this is a significant jump. `,
      `we see a ${sizeDiff.toFixed(1)}" difference in diagonal measurements—${larger.name} at ${larger.diagonal}" versus the ${smaller.name}'s ${smaller.diagonal}" display. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, largeDiffVariants);
  } else if (sizeDiff > 1) {
    const mediumDiffVariants = [
      `the screens differ by ${sizeDiff.toFixed(1)}" diagonally, a moderate but noticeable gap between ${larger.diagonal}" and ${smaller.diagonal}". `,
      `there's a ${sizeDiff.toFixed(1)}-inch difference in diagonal size—${larger.name} at ${larger.diagonal}" versus ${smaller.name} at ${smaller.diagonal}". `,
      `the ${sizeDiff.toFixed(1)}" diagonal difference (${larger.diagonal}" vs ${smaller.diagonal}") creates a visible size distinction. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, mediumDiffVariants);
  } else if (sizeDiff > 0.3) {
    const smallDiffVariants = [
      `both devices are close in size at ${deviceA.diagonal}" and ${deviceB.diagonal}", with just ${sizeDiff.toFixed(1)}" separating them. `,
      `the ${sizeDiff.toFixed(1)}" diagonal difference between ${deviceA.diagonal}" and ${deviceB.diagonal}" is subtle but measurable. `,
      `screen sizes are similar—${deviceA.diagonal}" versus ${deviceB.diagonal}"—a ${sizeDiff.toFixed(1)}" gap that's hard to notice side-by-side. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, smallDiffVariants);
  } else {
    const nearlyIdenticalVariants = [
      `both feature nearly identical screens at ${deviceA.diagonal}" and ${deviceB.diagonal}", making size a non-factor in your decision. `,
      `the screens are virtually the same size at ${deviceA.diagonal}" and ${deviceB.diagonal}", so other factors become more important. `,
      `with ${deviceA.diagonal}" and ${deviceB.diagonal}" diagonal measurements, the size difference is negligible. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, nearlyIdenticalVariants);
  }

  // Area difference with variants
  if (areaDiff > 20) {
    const largeAreaVariants = [
      `In actual viewing area, the ${larger.name} has ${areaDiff.toFixed(0)}% more screen space—${largerArea.toFixed(1)} square inches compared to ${smallerArea.toFixed(1)} square inches. `,
      `This translates to ${areaDiff.toFixed(0)}% more usable screen space on the ${larger.name} (${largerArea.toFixed(1)} sq in vs ${smallerArea.toFixed(1)} sq in). `,
      `The area difference is notable: ${larger.name} offers ${largerArea.toFixed(1)} square inches versus ${smallerArea.toFixed(1)} on ${smaller.name}—a ${areaDiff.toFixed(0)}% increase. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, largeAreaVariants);
  } else if (areaDiff > 8) {
    const mediumAreaVariants = [
      `The ${larger.name} provides ${areaDiff.toFixed(0)}% more screen area, a difference you'll notice in daily use. `,
      `Screen area favors the ${larger.name} by ${areaDiff.toFixed(0)}%, offering ${largerArea.toFixed(1)} vs ${smallerArea.toFixed(1)} square inches. `,
      `With ${areaDiff.toFixed(0)}% more viewing area, the ${larger.name} gives you noticeably more content on screen. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, mediumAreaVariants);
  } else if (areaDiff > 2) {
    const smallAreaVariants = [
      `Screen areas are close, with the ${larger.name} offering a modest ${areaDiff.toFixed(0)}% advantage. `,
      `The ${areaDiff.toFixed(0)}% area difference between these displays is minimal in practice. `,
      `Both provide similar viewing space—the ${larger.name}'s ${areaDiff.toFixed(0)}% edge is barely perceptible. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, smallAreaVariants);
  }

  // Dimension specifics with category-appropriate language
  if (widthDiff > 0.5 || heightDiff > 0.5) {
    const isTvProjectorComparison =
      (deviceA.category === 'tv' && deviceB.category === 'projector') ||
      (deviceA.category === 'projector' && deviceB.category === 'tv');

    // Determine which device is wider (not necessarily the larger area one)
    const widerDevice = dimsA.width > dimsB.width ? deviceA : deviceB;

    if (isTvProjectorComparison) {
      description += `Physical dimensions differ by ${widthDiff.toFixed(1)}" in width and ${heightDiff.toFixed(1)}" in height, affecting room setup and viewing distance. `;
    } else if (deviceA.category === 'phone') {
      const phoneImpactVariants = [
        `The ${widthDiff.toFixed(2)}" width and ${heightDiff.toFixed(2)}" height difference affects how each phone feels in hand. `,
        `${widerDevice.name} is ${widthDiff.toFixed(2)}" wider, which affects grip and one-handed use. `,
        `These size differences (${widthDiff.toFixed(2)}" × ${heightDiff.toFixed(2)}") affect pocket fit and handling. `,
      ];
      description += selectComparisonVariant(deviceA, deviceB, phoneImpactVariants);
    } else if (deviceA.category === 'tablet') {
      description += `${widerDevice.name} is ${widthDiff.toFixed(1)}" wider, affecting portability and how it feels to hold. `;
    } else if (deviceA.category === 'monitor') {
      description += `Desk space differs by ${widthDiff.toFixed(1)}" in width, worth considering for your setup. `;
    } else if (deviceA.category === 'tv') {
      description += `Wall space requirements differ by ${widthDiff.toFixed(1)}" × ${heightDiff.toFixed(1)}", important for mounting. `;
    }
  }

  // Category-specific insights with variants
  if (deviceA.category === 'phone' && deviceB.category === 'phone') {
    // Add phone-specific technical comparisons
    description += generatePhoneSpecificContent(deviceA, deviceB);

    const phoneInsightVariants = [
      `These differences matter for one-handed use, media viewing, and how the phone fits in your pocket. `,
      `In daily use, this affects typing comfort, video watching, and portability. `,
      `This impacts how the phone handles in your hand and fits in your pocket. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, phoneInsightVariants);

    if (larger.diagonal > 6.7) {
      description += `The ${larger.name}'s large display is great for videos and reading but harder to use one-handed. `;
    } else if (smaller.diagonal < 6.2) {
      description += `The ${smaller.name}'s compact size makes it easier to use with one hand. `;
    }
  } else if (deviceA.category === 'tv' || deviceB.category === 'tv') {
    const tvInsightVariants = [
      `For home entertainment, the ${larger.name} suits rooms with ${(larger.diagonal * 1.5 / 12).toFixed(1)}-${(larger.diagonal * 2.5 / 12).toFixed(1)} feet viewing distance, while the ${smaller.name} works at ${(smaller.diagonal * 1.5 / 12).toFixed(1)}-${(smaller.diagonal * 2.5 / 12).toFixed(1)} feet. `,
      `Optimal viewing distance is ${(larger.diagonal * 1.5 / 12).toFixed(1)}-${(larger.diagonal * 2.5 / 12).toFixed(1)} feet for the ${larger.name} and ${(smaller.diagonal * 1.5 / 12).toFixed(1)}-${(smaller.diagonal * 2.5 / 12).toFixed(1)} feet for the ${smaller.name}—measure your room before deciding. `,
      `Room size matters: the ${larger.name} needs ${(larger.diagonal * 1.5 / 12).toFixed(1)}+ feet viewing distance for comfortable watching, versus ${(smaller.diagonal * 1.5 / 12).toFixed(1)}+ feet for the ${smaller.name}. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, tvInsightVariants);
  } else if (deviceA.category === 'monitor' || deviceB.category === 'monitor') {
    const monitorInsightVariants = [
      `For desktop productivity, the ${larger.name} provides more workspace for multitasking, while the ${smaller.name} suits smaller desks or closer viewing distances. `,
      `The ${larger.name} accommodates more windows side-by-side, whereas the ${smaller.name} requires less desk depth and eye movement. `,
      `Workspace needs differ: ${larger.name} for spreadsheets and multi-window workflows, ${smaller.name} for focused single-task work. `,
    ];
    description += selectComparisonVariant(deviceA, deviceB, monitorInsightVariants);
  }

  return description;
}

/**
 * Generate use case scenarios based on device category
 * Uses device-specific data for more varied content
 */
export function generateUseCaseScenarios(deviceA: Device, deviceB: Device) {
  // Handle cross-category comparisons (TV vs Projector)
  const isTvProjectorComparison =
    (deviceA.category === 'tv' && deviceB.category === 'projector') ||
    (deviceA.category === 'projector' && deviceB.category === 'tv');

  if (isTvProjectorComparison) {
    // Helper to evaluate both TV and Projector with same criteria
    const evalDevice = (d: Device) => ({
      smallRoom: d.diagonal < 65 ? 'Suitable' : d.diagonal < 85 ? 'Possible' : 'Too large',
      largeRoom: d.diagonal >= 75 ? 'Excellent' : d.diagonal >= 55 ? 'Good' : 'May feel small',
      ambientLight: d.category === 'tv' ? 'Better' : 'Needs dark room',
      cinematic: d.diagonal >= 100 ? 'Cinema-like' : d.diagonal >= 75 ? 'Immersive' : 'Standard',
    });
    const evalA = evalDevice(deviceA);
    const evalB = evalDevice(deviceB);

    return [
      {
        icon: '🛋️',
        title: 'Living Room Setup',
        deviceA: evalA.smallRoom,
        deviceB: evalB.smallRoom,
        description: 'Standard living room with mixed lighting'
      },
      {
        icon: '🎭',
        title: 'Home Theater',
        deviceA: evalA.largeRoom,
        deviceB: evalB.largeRoom,
        description: 'Dedicated theater room with controlled lighting'
      },
      {
        icon: '☀️',
        title: 'Ambient Light',
        deviceA: evalA.ambientLight,
        deviceB: evalB.ambientLight,
        description: 'Performance in rooms with windows or lights on'
      },
      {
        icon: '🎬',
        title: 'Cinematic Experience',
        deviceA: evalA.cinematic,
        deviceB: evalB.cinematic,
        description: 'Immersion level for movies and sports'
      }
    ];
  }

  const category = deviceA.category;

  if (category === 'phone') {
    // More nuanced phone evaluations using actual specs
    const evalOneHanded = (d: Device) => {
      if (d.phone?.dimensions?.width) {
        if (d.phone.dimensions.width < 70) return 'Easy';
        if (d.phone.dimensions.width < 75) return 'Comfortable';
        if (d.phone.dimensions.width < 78) return 'Manageable';
        return 'Challenging';
      }
      if (d.diagonal < 6.1) return 'Easy';
      if (d.diagonal < 6.5) return 'Comfortable';
      if (d.diagonal < 6.7) return 'Manageable';
      return 'Challenging';
    };

    const evalVideo = (d: Device) => {
      let score = 0;
      if (d.diagonal > 6.5) score += 2;
      else if (d.diagonal > 6.2) score += 1;
      if (d.phone?.refreshRate && d.phone.refreshRate >= 120) score += 1;
      if (d.phone?.peakBrightness && d.phone.peakBrightness >= 1500) score += 1;
      if (d.phone?.screenType?.includes('OLED') || d.phone?.screenType?.includes('AMOLED')) score += 1;
      if (score >= 4) return 'Excellent';
      if (score >= 2) return 'Very Good';
      return 'Good';
    };

    const evalGaming = (d: Device) => {
      let score = 0;
      // Refresh rate scoring (mutually exclusive)
      if (d.phone?.refreshRate && d.phone.refreshRate >= 120) score += 2;
      else if (d.phone?.refreshRate && d.phone.refreshRate >= 90) score += 1;
      // Screen size
      if (d.diagonal >= 6.5) score += 1;
      // Brightness for HDR gaming
      if (d.phone?.peakBrightness && d.phone.peakBrightness >= 1200) score += 1;
      if (score >= 3) return 'Excellent';
      if (score >= 2) return 'Very Good';
      return 'Good';
    };

    const evalBattery = (d: Device) => {
      if (d.phone?.battery) {
        if (d.phone.battery >= 5000) return 'All-day+';
        if (d.phone.battery >= 4500) return 'All-day';
        if (d.phone.battery >= 4000) return 'Full day';
        return 'Moderate';
      }
      return 'Unknown';
    };

    const scenarios = [
      {
        icon: '👋',
        title: 'One-Handed Use',
        deviceA: evalOneHanded(deviceA),
        deviceB: evalOneHanded(deviceB),
        description: `Ease of reaching corners with your thumb`
      },
      {
        icon: '🎬',
        title: 'Video Watching',
        deviceA: evalVideo(deviceA),
        deviceB: evalVideo(deviceB),
        description: 'Movies, streaming, and video content'
      },
      {
        icon: '👖',
        title: 'Pocket Fit',
        deviceA: getPocketFit(deviceA),
        deviceB: getPocketFit(deviceB),
        description: 'Comfort in jeans and jacket pockets'
      },
      {
        icon: '🎮',
        title: 'Mobile Gaming',
        deviceA: evalGaming(deviceA),
        deviceB: evalGaming(deviceB),
        description: 'Gaming performance and experience'
      }
    ];

    // Add battery scenario if both have battery data
    if (deviceA.phone?.battery && deviceB.phone?.battery) {
      scenarios.push({
        icon: '🔋',
        title: 'Battery Life',
        deviceA: evalBattery(deviceA),
        deviceB: evalBattery(deviceB),
        description: 'Expected usage time per charge'
      });
    }

    return scenarios.slice(0, 4);
  } else if (category === 'tv') {
    return [
      {
        icon: '🛋️',
        title: 'Small Room (10x10 ft)',
        deviceA: deviceA.diagonal < 50 ? 'Perfect' : deviceA.diagonal < 65 ? 'Good' : 'Too large',
        deviceB: deviceB.diagonal < 50 ? 'Perfect' : deviceB.diagonal < 65 ? 'Good' : 'Too large',
        description: 'Bedroom or small living space'
      },
      {
        icon: '🏠',
        title: 'Medium Room (12x15 ft)',
        deviceA: deviceA.diagonal >= 50 && deviceA.diagonal <= 65 ? 'Ideal' : 'Consider size',
        deviceB: deviceB.diagonal >= 50 && deviceB.diagonal <= 65 ? 'Ideal' : 'Consider size',
        description: 'Standard living room setup'
      },
      {
        icon: '🎭',
        title: 'Large Room (15x20 ft)',
        deviceA: deviceA.diagonal >= 65 ? 'Perfect' : 'May feel small',
        deviceB: deviceB.diagonal >= 65 ? 'Perfect' : 'May feel small',
        description: 'Open concept or home theater'
      },
      {
        icon: '🎮',
        title: 'Gaming',
        deviceA: deviceA.diagonal >= 55 ? 'Immersive' : 'Good',
        deviceB: deviceB.diagonal >= 55 ? 'Immersive' : 'Good',
        description: 'Console and PC gaming experience'
      }
    ];
  } else if (category === 'monitor') {
    return [
      {
        icon: '💼',
        title: 'Productivity',
        deviceA: deviceA.diagonal >= 27 ? 'Excellent' : 'Good',
        deviceB: deviceB.diagonal >= 27 ? 'Excellent' : 'Good',
        description: 'Multitasking and workspace'
      },
      {
        icon: '🎮',
        title: 'Gaming',
        deviceA: deviceA.diagonal >= 24 && deviceA.diagonal <= 27 ? 'Optimal' : 'Good',
        deviceB: deviceB.diagonal >= 24 && deviceB.diagonal <= 27 ? 'Optimal' : 'Good',
        description: 'Competitive and casual gaming'
      },
      {
        icon: '🎨',
        title: 'Creative Work',
        deviceA: deviceA.diagonal >= 27 ? 'More canvas space' : 'Standard',
        deviceB: deviceB.diagonal >= 27 ? 'More canvas space' : 'Standard',
        description: 'Photo/video editing and design'
      },
      {
        icon: '📏',
        title: 'Desk Space',
        deviceA: deviceA.diagonal <= 24 ? 'Compact' : deviceA.diagonal <= 27 ? 'Standard' : 'Needs space',
        deviceB: deviceB.diagonal <= 24 ? 'Compact' : deviceB.diagonal <= 27 ? 'Standard' : 'Needs space',
        description: 'Physical footprint on your desk'
      }
    ];
  } else if (category === 'tablet') {
    return [
      {
        icon: '📖',
        title: 'Reading',
        deviceA: deviceA.diagonal >= 10 ? 'Magazine-like' : 'Book-like',
        deviceB: deviceB.diagonal >= 10 ? 'Magazine-like' : 'Book-like',
        description: 'E-books and digital magazines'
      },
      {
        icon: '✈️',
        title: 'Portability',
        deviceA: deviceA.diagonal < 10 ? 'Highly portable' : 'Less portable',
        deviceB: deviceB.diagonal < 10 ? 'Highly portable' : 'Less portable',
        description: 'Easy to carry and travel with'
      },
      {
        icon: '🎬',
        title: 'Media Consumption',
        deviceA: deviceA.diagonal >= 11 ? 'Immersive' : 'Good',
        deviceB: deviceB.diagonal >= 11 ? 'Immersive' : 'Good',
        description: 'Streaming and video playback'
      },
      {
        icon: '✍️',
        title: 'Note Taking',
        deviceA: deviceA.diagonal >= 11 ? 'More writing space' : 'Compact',
        deviceB: deviceB.diagonal >= 11 ? 'More writing space' : 'Compact',
        description: 'Digital note-taking and sketching'
      }
    ];
  } else if (category === 'projector') {
    return [
      {
        icon: '🎭',
        title: 'Home Theater',
        deviceA: deviceA.diagonal >= 120 ? 'Cinema-like' : deviceA.diagonal >= 100 ? 'Excellent' : 'Good',
        deviceB: deviceB.diagonal >= 120 ? 'Cinema-like' : deviceB.diagonal >= 100 ? 'Excellent' : 'Good',
        description: 'Dedicated movie room experience'
      },
      {
        icon: '📐',
        title: 'Room Size Needed',
        deviceA: deviceA.diagonal >= 120 ? 'Large (15+ ft)' : deviceA.diagonal >= 100 ? 'Medium (12+ ft)' : 'Standard (10+ ft)',
        deviceB: deviceB.diagonal >= 120 ? 'Large (15+ ft)' : deviceB.diagonal >= 100 ? 'Medium (12+ ft)' : 'Standard (10+ ft)',
        description: 'Minimum viewing distance required'
      },
      {
        icon: '🏠',
        title: 'Multi-Purpose Room',
        deviceA: deviceA.diagonal <= 100 ? 'Flexible' : 'Dedicated space',
        deviceB: deviceB.diagonal <= 100 ? 'Flexible' : 'Dedicated space',
        description: 'Suitability for rooms with other uses'
      },
      {
        icon: '🎬',
        title: 'Immersion Level',
        deviceA: deviceA.diagonal >= 150 ? 'IMAX-like' : deviceA.diagonal >= 120 ? 'Cinema' : 'Large TV feel',
        deviceB: deviceB.diagonal >= 150 ? 'IMAX-like' : deviceB.diagonal >= 120 ? 'Cinema' : 'Large TV feel',
        description: 'How immersive the viewing experience is'
      }
    ];
  }

  return [];
}

/**
 * Generate specific recommendations for each device
 * Uses device-specific specs for more personalized recommendations
 */
export function generateRecommendations(deviceA: Device, deviceB: Device, areaA: number, areaB: number) {
  const larger = areaA > areaB ? deviceA : deviceB;
  const smaller = areaA > areaB ? deviceB : deviceA;
  const largerArea = Math.max(areaA, areaB);
  const smallerArea = Math.min(areaA, areaB);
  const areaDiff = smallerArea > 0 ? ((largerArea - smallerArea) / smallerArea) * 100 : 0;

  const recommendations = {
    larger: [] as string[],
    smaller: [] as string[]
  };

  if (deviceA.category === 'phone' && deviceB.category === 'phone') {
    // Dynamic phone recommendations based on actual specs

    // Larger phone recommendations
    if (larger.diagonal > 6.7) {
      recommendations.larger.push('You prioritize screen size for media and productivity');
      recommendations.larger.push('You typically use your phone with two hands');
    } else if (larger.diagonal > 6.3) {
      recommendations.larger.push('You want a balance of screen size and usability');
      recommendations.larger.push('You enjoy watching videos and browsing on your phone');
    } else {
      recommendations.larger.push('You want a slightly larger screen for better visibility');
      recommendations.larger.push('You value the extra screen space for daily tasks');
    }

    // Add spec-based recommendations for larger phone
    if (larger.phone?.battery && smaller.phone?.battery && larger.phone.battery > smaller.phone.battery + 500) {
      recommendations.larger.push(`You want longer battery life (${larger.phone.battery}mAh vs ${smaller.phone.battery}mAh)`);
    }
    if (larger.phone?.refreshRate && smaller.phone?.refreshRate && larger.phone.refreshRate > smaller.phone.refreshRate + 30) {
      recommendations.larger.push(`You want a smoother ${larger.phone.refreshRate}Hz display`);
    }
    if (larger.phone?.peakBrightness && smaller.phone?.peakBrightness && larger.phone.peakBrightness > smaller.phone.peakBrightness + 500) {
      recommendations.larger.push(`You use your phone outdoors often (${larger.phone.peakBrightness} nits)`);
    }

    // Smaller phone recommendations
    if (smaller.diagonal < 6.1) {
      recommendations.smaller.push('You prefer one-handed operation and portability');
      recommendations.smaller.push('You want a phone that fits comfortably in pockets');
    } else if (smaller.diagonal < 6.5) {
      recommendations.smaller.push('You want a more manageable device size');
      recommendations.smaller.push('You prefer easier one-handed use');
    } else {
      recommendations.smaller.push('You want a slightly more compact option');
      recommendations.smaller.push('You prefer a lighter device for extended use');
    }

    // Add spec-based recommendations for smaller phone
    if (smaller.phone?.weight && larger.phone?.weight && smaller.phone.weight < larger.phone.weight - 20) {
      recommendations.smaller.push(`You prefer a lighter phone (${smaller.phone.weight}g vs ${larger.phone.weight}g)`);
    }
    if (smaller.phone?.battery && larger.phone?.battery && smaller.phone.battery > larger.phone.battery + 500) {
      recommendations.smaller.push(`You want longer battery life (${smaller.phone.battery}mAh vs ${larger.phone.battery}mAh)`);
    }
    if (smaller.phone?.refreshRate && larger.phone?.refreshRate && smaller.phone.refreshRate > larger.phone.refreshRate + 30) {
      recommendations.smaller.push(`You want a smoother ${smaller.phone.refreshRate}Hz display`);
    }
    if (smaller.phone?.dimensions?.width && larger.phone?.dimensions?.width && smaller.phone.dimensions.width < larger.phone.dimensions.width - 4) {
      recommendations.smaller.push(`You have smaller hands (${smaller.phone.dimensions.width}mm vs ${larger.phone.dimensions.width}mm width)`);
    }

  } else if (deviceA.category === 'phone' || deviceB.category === 'phone') {
    // Mixed category with phone - use generic phone recommendations
    if (larger.diagonal > 6.7) {
      recommendations.larger.push('You prioritize screen size for media and productivity');
      recommendations.larger.push('You typically use your phone with two hands');
      recommendations.larger.push('You want the best viewing experience for videos and games');
    } else if (larger.diagonal > 6.3) {
      recommendations.larger.push('You want a balance of screen size and usability');
      recommendations.larger.push('You enjoy watching videos and browsing on your phone');
      recommendations.larger.push('You prefer a larger display for reading and typing');
    } else {
      recommendations.larger.push('You want a slightly larger screen for better visibility');
      recommendations.larger.push('You value the extra screen space for daily tasks');
      recommendations.larger.push('You prefer more content visible at once');
    }
    if (smaller.diagonal < 6.1) {
      recommendations.smaller.push('You prefer one-handed operation and portability');
      recommendations.smaller.push('You want a phone that fits comfortably in pockets');
      recommendations.smaller.push('You value ease of use over maximum screen size');
    } else if (smaller.diagonal < 6.5) {
      recommendations.smaller.push('You want a more manageable device size');
      recommendations.smaller.push('You prefer easier one-handed use');
      recommendations.smaller.push('You value portability without sacrificing too much screen');
    } else {
      recommendations.smaller.push('You want a slightly more compact option');
      recommendations.smaller.push('You prefer a lighter device for extended use');
      recommendations.smaller.push('You prefer the smaller form factor');
    }
  } else if (deviceA.category === 'tv' || deviceB.category === 'tv') {
    // Larger TV recommendations
    if (larger.diagonal >= 75) {
      recommendations.larger.push('You have a large room with 10+ feet viewing distance');
      recommendations.larger.push('You want a cinematic, home theater experience');
      recommendations.larger.push('You primarily watch 4K/8K content');
    } else if (larger.diagonal >= 65) {
      recommendations.larger.push('You have a medium to large living room');
      recommendations.larger.push('You want an immersive viewing experience');
      recommendations.larger.push('You enjoy movies, sports, and gaming');
    } else {
      recommendations.larger.push('You want a bigger screen for better visibility');
      recommendations.larger.push('You have adequate wall or stand space');
      recommendations.larger.push('You prefer more immersive content viewing');
    }
    // Smaller TV recommendations
    if (smaller.diagonal < 50) {
      recommendations.smaller.push('You have a smaller room or bedroom setup');
      recommendations.smaller.push('Your viewing distance is under 7 feet');
      recommendations.smaller.push('You want a more budget-friendly option');
    } else if (smaller.diagonal < 65) {
      recommendations.smaller.push('You have a standard living room setup');
      recommendations.smaller.push('Your viewing distance is 7-10 feet');
      recommendations.smaller.push('You want good value without oversizing');
    } else {
      recommendations.smaller.push('You prefer a more modest screen size');
      recommendations.smaller.push('You want to save on cost and energy');
      recommendations.smaller.push('Your room layout works better with this size');
    }
  } else if (deviceA.category === 'monitor' || deviceB.category === 'monitor') {
    // Larger monitor recommendations
    if (larger.diagonal >= 32) {
      recommendations.larger.push('You need maximum screen real estate for multitasking');
      recommendations.larger.push('You work with video editing or complex spreadsheets');
      recommendations.larger.push('You have a deep desk with adequate viewing distance');
    } else if (larger.diagonal >= 27) {
      recommendations.larger.push('You need more screen space for productivity');
      recommendations.larger.push('You work with multiple windows simultaneously');
      recommendations.larger.push('You have adequate desk space');
    } else {
      recommendations.larger.push('You want more visible content area');
      recommendations.larger.push('You prefer larger text and UI elements');
      recommendations.larger.push('You value the extra workspace');
    }
    // Smaller monitor recommendations
    if (smaller.diagonal <= 24) {
      recommendations.smaller.push('You have limited desk space');
      recommendations.smaller.push('You sit closer to your monitor');
      recommendations.smaller.push('You prefer a more compact setup');
    } else if (smaller.diagonal <= 27) {
      recommendations.smaller.push('You want a balanced size for your desk');
      recommendations.smaller.push('You prefer less eye movement during use');
      recommendations.smaller.push('You value a cleaner, minimal setup');
    } else {
      recommendations.smaller.push('You want a more manageable screen size');
      recommendations.smaller.push('You prefer easier focus on content');
      recommendations.smaller.push('You want to reduce neck strain');
    }
  } else if (deviceA.category === 'tablet' || deviceB.category === 'tablet') {
    // Larger tablet recommendations
    if (larger.diagonal >= 12) {
      recommendations.larger.push('You use your tablet as a laptop replacement');
      recommendations.larger.push('You do professional creative work or note-taking');
      recommendations.larger.push('You want the best experience for split-screen multitasking');
    } else if (larger.diagonal >= 10) {
      recommendations.larger.push('You want a versatile tablet for work and entertainment');
      recommendations.larger.push('You prefer a larger canvas for drawing or writing');
      recommendations.larger.push('You enjoy watching movies and reading magazines');
    } else {
      recommendations.larger.push('You want more screen space for media consumption');
      recommendations.larger.push('You prefer easier reading and browsing');
      recommendations.larger.push('You value the extra display area');
    }
    // Smaller tablet recommendations
    if (smaller.diagonal < 8) {
      recommendations.smaller.push('You prioritize maximum portability');
      recommendations.smaller.push('You want a tablet that fits in a jacket pocket');
      recommendations.smaller.push('You prefer one-handed use for reading');
    } else if (smaller.diagonal < 10) {
      recommendations.smaller.push('You want a balance of portability and usability');
      recommendations.smaller.push('You prefer a lighter device for travel');
      recommendations.smaller.push('You value comfortable handheld use');
    } else {
      recommendations.smaller.push('You want a more portable option');
      recommendations.smaller.push('You prefer a lighter device for extended use');
      recommendations.smaller.push('You value easier handling and storage');
    }
  } else if (deviceA.category === 'projector' || deviceB.category === 'projector') {
    // Larger projector screen recommendations
    recommendations.larger.push('You have a dedicated home theater room');
    recommendations.larger.push('You want the most immersive cinematic experience');
    recommendations.larger.push('You have adequate throw distance for the projector');
    // Smaller projector screen recommendations
    recommendations.smaller.push('You have a multi-purpose room');
    recommendations.smaller.push('You want flexibility in projector placement');
    recommendations.smaller.push('You prefer a more manageable screen setup');
  }

  // Add general recommendations based on size difference if lists are still empty
  if (recommendations.larger.length === 0) {
    if (areaDiff > 30) {
      recommendations.larger.push('You want significantly more viewing area');
      recommendations.larger.push('You prioritize immersive content consumption');
      recommendations.larger.push('You have space to accommodate the larger size');
    } else {
      recommendations.larger.push('You prefer a larger display experience');
      recommendations.larger.push('You want more content visible at once');
      recommendations.larger.push('You value the extra screen real estate');
    }
  }

  if (recommendations.smaller.length === 0) {
    if (areaDiff > 30) {
      recommendations.smaller.push('You prefer a more compact form factor');
      recommendations.smaller.push('You value portability and space efficiency');
      recommendations.smaller.push('You want a more budget-friendly option');
    } else {
      recommendations.smaller.push('You prefer a slightly smaller size');
      recommendations.smaller.push('You want easier handling and placement');
      recommendations.smaller.push('You value the cost savings');
    }
  }

  return recommendations;
}

/**
 * Generate comparison-specific FAQ
 */
export function generateComparisonFAQ(
  deviceA: Device,
  deviceB: Device,
  areaA: number,
  areaB: number,
  dimsA: ComparisonDimensions,
  dimsB: ComparisonDimensions
) {
  const faqs: Array<{ question: string; answer: string }> = [];
  const larger = areaA > areaB ? deviceA : deviceB;
  const smaller = areaA > areaB ? deviceB : deviceA;
  const largerArea = Math.max(areaA, areaB);
  const smallerArea = Math.min(areaA, areaB);
  const largerDims = areaA > areaB ? dimsA : dimsB;
  const smallerDims = areaA > areaB ? dimsB : dimsA;
  const sizeDiff = Math.abs(deviceA.diagonal - deviceB.diagonal);
  const areaDiff = smallerArea > 0 ? ((largerArea - smallerArea) / smallerArea) * 100 : 0;

  // Size difference FAQ - optimized for real search patterns
  if (sizeDiff < 0.2) {
    // Nearly identical sizes - use "same size" question
    faqs.push({
      question: `Are ${deviceA.name} and ${deviceB.name} the same size?`,
      answer: `Yes, ${deviceA.name} and ${deviceB.name} are nearly identical in size. Both have ${deviceA.diagonal}" diagonal screens with the same ${largerArea.toFixed(1)} square inches of viewing area. The dimensional difference is negligible at just ${sizeDiff.toFixed(2)} inches.`
    });
  } else if (sizeDiff < 0.5 && deviceA.category === 'phone') {
    // Small difference for phones - still answer "same size" question but clarify
    faqs.push({
      question: `Are ${deviceA.name} and ${deviceB.name} the same size?`,
      answer: `${deviceA.name} and ${deviceB.name} are very similar in size, with only a ${sizeDiff.toFixed(1)}" difference in diagonal (${larger.diagonal}" vs ${smaller.diagonal}"). The ${larger.name} is ${areaDiff.toFixed(0)}% larger in screen area, but in daily use, the size difference is minimal.`
    });
  } else {
    // Different sizes - use "how much bigger" question (no "the" - matches search patterns)
    faqs.push({
      question: `How much bigger is ${larger.name} than ${smaller.name}?`,
      answer: `${larger.name} is ${sizeDiff.toFixed(1)} inches larger diagonally (${larger.diagonal}" vs ${smaller.diagonal}"), which translates to approximately ${areaDiff.toFixed(0)}% more screen area. In actual measurements, ${larger.name} provides ${largerArea.toFixed(1)} square inches of viewing space compared to ${smallerArea.toFixed(1)} square inches on ${smaller.name}.`
    });
  }

  // Category-specific FAQs
  if (deviceA.category === 'phone') {
    // One-handed use FAQ
    if (Math.abs(deviceA.diagonal - deviceB.diagonal) > 0.3) {
      faqs.push({
        question: `Which is better for one-handed use?`,
        answer: `The ${smaller.name} (${smaller.diagonal}") is easier to use one-handed due to its smaller size. The ${larger.name} (${larger.diagonal}") may require two hands for some tasks, especially reaching the far corners of the screen.`
      });
    }

    // Pocket fit FAQ
    faqs.push({
      question: `Will both phones fit in my pocket?`,
      answer: `Both phones will fit in standard pockets, but the ${smaller.name} will be more comfortable. The ${larger.name} measures ${largerDims.width.toFixed(2)}" wide and ${largerDims.height.toFixed(2)}" tall, which may feel bulky in tight jeans or smaller pockets. The ${smaller.name} at ${smallerDims.width.toFixed(2)}" × ${smallerDims.height.toFixed(2)}" offers better portability.`
    });

    // Media consumption FAQ
    if (areaDiff > 10) {
      faqs.push({
        question: `Which is better for watching videos?`,
        answer: `The ${larger.name} offers a better video watching experience with ${areaDiff.toFixed(0)}% more screen area. This extra space makes movies and streaming content more immersive. The ${smaller.name} is still good for videos but with a smaller viewing area.`
      });
    }

    // Battery comparison FAQ (phone-specific) - use higher threshold to match generatePhoneSpecificContent
    if (deviceA.phone?.battery && deviceB.phone?.battery) {
      const batteryA = deviceA.phone.battery;
      const batteryB = deviceB.phone.battery;
      const largerBattery = batteryA > batteryB ? deviceA : deviceB;
      const smallerBattery = batteryA > batteryB ? deviceB : deviceA;
      const batteryDiff = Math.abs(batteryA - batteryB);
      if (batteryDiff > 400) {
        faqs.push({
          question: `Which phone has better battery life?`,
          answer: `The ${largerBattery.name} has a larger ${Math.max(batteryA, batteryB)}mAh battery compared to ${Math.min(batteryA, batteryB)}mAh on the ${smallerBattery.name}, a difference of ${batteryDiff}mAh. Actual battery life depends on screen size, brightness settings, processor efficiency, and usage patterns, but the larger battery generally provides longer endurance.`
        });
      }
    }

    // Weight comparison FAQ (phone-specific) - use higher threshold to match generatePhoneSpecificContent
    if (deviceA.phone?.weight && deviceB.phone?.weight) {
      const weightA = deviceA.phone.weight;
      const weightB = deviceB.phone.weight;
      const lighterPhone = weightA < weightB ? deviceA : deviceB;
      const heavierPhone = weightA < weightB ? deviceB : deviceA;
      const weightDiff = Math.abs(weightA - weightB);
      if (weightDiff >= 20) {
        faqs.push({
          question: `Which phone is lighter and easier to hold?`,
          answer: `The ${lighterPhone.name} weighs ${Math.min(weightA, weightB)}g, which is ${weightDiff}g lighter than the ${heavierPhone.name} at ${Math.max(weightA, weightB)}g. This difference is noticeable during extended use, reading, or one-handed operation.`
        });
      }
    }

    // Refresh rate comparison FAQ (phone-specific) - use higher threshold to match generatePhoneSpecificContent
    if (deviceA.phone?.refreshRate && deviceB.phone?.refreshRate) {
      const rateA = deviceA.phone.refreshRate;
      const rateB = deviceB.phone.refreshRate;
      const rateDiff = Math.abs(rateA - rateB);
      if (rateDiff >= 30) {
        const higherRate = rateA > rateB ? deviceA : deviceB;
        const lowerRate = rateA > rateB ? deviceB : deviceA;
        faqs.push({
          question: `Which phone has a smoother display?`,
          answer: `The ${higherRate.name} has a ${Math.max(rateA, rateB)}Hz display compared to ${Math.min(rateA, rateB)}Hz on the ${lowerRate.name}. The higher refresh rate provides smoother scrolling and more responsive touch input, which is especially noticeable in gaming and fast-scrolling content.`
        });
      }
    }

    // Display brightness comparison FAQ (phone-specific) - use higher threshold to match generatePhoneSpecificContent
    if (deviceA.phone?.peakBrightness && deviceB.phone?.peakBrightness) {
      const brightnessA = deviceA.phone.peakBrightness;
      const brightnessB = deviceB.phone.peakBrightness;
      const brightnessDiff = Math.abs(brightnessA - brightnessB);
      if (brightnessDiff > 500) {
        const brighterPhone = brightnessA > brightnessB ? deviceA : deviceB;
        const dimmerPhone = brightnessA > brightnessB ? deviceB : deviceA;
        faqs.push({
          question: `Which phone is better for outdoor use?`,
          answer: `The ${brighterPhone.name} has a peak brightness of ${Math.max(brightnessA, brightnessB)} nits compared to ${Math.min(brightnessA, brightnessB)} nits on the ${dimmerPhone.name}. This ${brightnessDiff} nits difference makes the ${brighterPhone.name} easier to read in direct sunlight.`
        });
      }
    }
  }

  // Handle cross-category TV vs Projector FAQ
  const isTvProjectorComparison =
    (deviceA.category === 'tv' && deviceB.category === 'projector') ||
    (deviceA.category === 'projector' && deviceB.category === 'tv');

  if (isTvProjectorComparison) {
    const tvDevice = deviceA.category === 'tv' ? deviceA : deviceB;
    const projectorDevice = deviceA.category === 'projector' ? deviceA : deviceB;
    const projectorLarger = projectorDevice.diagonal > tvDevice.diagonal;
    const sizeDiffPercent = Math.abs((projectorDevice.diagonal / tvDevice.diagonal - 1) * 100).toFixed(0);

    faqs.push({
      question: `Should I get a ${tvDevice.diagonal}" TV or ${projectorDevice.diagonal}" projector screen?`,
      answer: `Choose the ${tvDevice.name} if you watch in rooms with ambient light, want always-on convenience, or prefer consistent picture quality. Choose the ${projectorDevice.name} if you have a dedicated dark room, want a true cinema experience, and don't mind setup time. ${projectorLarger ? `The projector offers ${sizeDiffPercent}% more screen size but requires controlled lighting.` : `The TV is ${sizeDiffPercent}% larger but the projector still offers a more cinematic feel in dark rooms.`}`
    });

    faqs.push({
      question: `Which is better for a home theater setup?`,
      answer: `For a dedicated home theater with controlled lighting, the ${projectorDevice.name} at ${projectorDevice.diagonal}" delivers a more immersive, cinema-like experience. For a multi-purpose living room where you watch TV during the day, the ${tvDevice.name} at ${tvDevice.diagonal}" offers better visibility in ambient light and requires no setup time.`
    });

    faqs.push({
      question: `What room size do I need for each option?`,
      answer: `The ${tvDevice.name} works in rooms as small as ${Math.round(tvDevice.diagonal * 1.2 / 12)}-${Math.round(tvDevice.diagonal * 2.5 / 12)} feet viewing distance. The ${projectorDevice.name} requires ${Math.round(projectorDevice.diagonal * 1.2 / 12)}-${Math.round(projectorDevice.diagonal * 2.5 / 12)} feet for optimal viewing, plus additional throw distance for the projector itself. Ensure your room can accommodate these distances.`
    });
  } else if (deviceA.category === 'tv' || deviceB.category === 'tv') {
    // Viewing distance FAQ
    const largerMinDist = (larger.diagonal * 1.2 / 12).toFixed(1);
    const largerMaxDist = (larger.diagonal * 2.5 / 12).toFixed(1);
    const smallerMinDist = (smaller.diagonal * 1.2 / 12).toFixed(1);
    const smallerMaxDist = (smaller.diagonal * 2.5 / 12).toFixed(1);

    faqs.push({
      question: `What viewing distance is recommended for each TV?`,
      answer: `For the ${larger.name} (${larger.diagonal}"), the optimal viewing distance is ${largerMinDist}-${largerMaxDist} feet based on THX and SMPTE standards. For the ${smaller.name} (${smaller.diagonal}"), sit ${smallerMinDist}-${smallerMaxDist} feet away. If your couch is closer than ${largerMinDist} feet, the ${smaller.name} would be more comfortable. If you sit farther than ${smallerMaxDist} feet, consider the ${larger.name} for better immersion.`
    });

    // Room size FAQ
    faqs.push({
      question: `Which TV size is right for my room?`,
      answer: `The ${smaller.name} (${smaller.diagonal}") is ideal for rooms up to 12×15 feet with viewing distances under ${smallerMaxDist} feet, perfect for bedrooms or smaller living rooms. The ${larger.name} (${larger.diagonal}") works best in rooms 15×20 feet or larger with viewing distances of ${largerMinDist}+ feet, ideal for open-concept spaces or dedicated home theaters.`
    });

    // 4K content FAQ
    if (larger.diagonal >= 55) {
      faqs.push({
        question: `Do I need 4K content for these TV sizes?`,
        answer: `For the ${larger.name} at ${larger.diagonal}", 4K content is highly recommended to maintain image quality at typical viewing distances. The ${smaller.name} at ${smaller.diagonal}" also benefits from 4K, but 1080p content is still acceptable if you sit farther away. Both TVs will upscale lower resolution content, but native 4K provides the best experience, especially for the larger screen.`
      });
    }
  } else if (deviceA.category === 'monitor') {
    // Desk space FAQ
    const largerWidth = Math.max(dimsA.width, dimsB.width);
    const smallerWidth = Math.min(dimsA.width, dimsB.width);

    faqs.push({
      question: `How much desk space do I need for each monitor?`,
      answer: `The ${larger.name} (${larger.diagonal}") requires approximately ${(largerWidth + 4).toFixed(0)}" of desk width including the stand, while the ${smaller.name} (${smaller.diagonal}") needs about ${(smallerWidth + 4).toFixed(0)}". For comfortable use, ensure you have at least ${(largerWidth * 1.5 / 12).toFixed(1)} feet of viewing distance for the ${larger.name} and ${(smallerWidth * 1.5 / 12).toFixed(1)} feet for the ${smaller.name}.`
    });

    // Productivity FAQ
    if (areaDiff > 15) {
      faqs.push({
        question: `Which is better for productivity and multitasking?`,
        answer: `The ${larger.name} (${larger.diagonal}") is better for productivity with ${areaDiff.toFixed(0)}% more screen space. This allows you to view multiple windows side-by-side more comfortably. The ${smaller.name} works well but may require more window switching.`
      });
    }

    // Gaming FAQ
    faqs.push({
      question: `Which monitor is better for gaming?`,
      answer: `For competitive gaming, the ${smaller.name} (${smaller.diagonal}") may be preferable as it requires less eye movement to see the entire screen, giving you faster reaction times. For immersive single-player games, the ${larger.name} (${larger.diagonal}") provides a more cinematic experience. Both are excellent for gaming, but your preference depends on the types of games you play.`
    });
  } else if (deviceA.category === 'tablet') {
    // Portability FAQ
    faqs.push({
      question: `Which tablet is more portable?`,
      answer: `The ${smaller.name} (${smaller.diagonal}") is more portable and easier to hold for extended periods. It's ideal for reading, casual browsing, and travel. The ${larger.name} (${larger.diagonal}") offers ${areaDiff.toFixed(0)}% more screen space, making it better for productivity tasks, but it's heavier and less comfortable for one-handed use.`
    });

    // Reading FAQ
    if (sizeDiff > 2) {
      faqs.push({
        question: `Which is better for reading books and magazines?`,
        answer: `For books, the ${smaller.name} (${smaller.diagonal}") provides a more book-like experience and is easier to hold. For magazines, PDFs, and comics, the ${larger.name} (${larger.diagonal}") is superior as it can display full pages at readable sizes without zooming. Consider your primary reading material when choosing.`
      });
    }
  } else if (deviceA.category === 'projector' && deviceB.category === 'projector') {
    // Projector vs Projector specific FAQs
    const largerMinDist = (larger.diagonal * 1.2 / 12).toFixed(1);
    const largerMaxDist = (larger.diagonal * 2.5 / 12).toFixed(1);
    const smallerMinDist = (smaller.diagonal * 1.2 / 12).toFixed(1);
    const smallerMaxDist = (smaller.diagonal * 2.5 / 12).toFixed(1);

    faqs.push({
      question: `What room size do I need for each projector screen?`,
      answer: `The ${larger.name} (${larger.diagonal}") requires a viewing distance of ${largerMinDist}-${largerMaxDist} feet for optimal viewing, suitable for dedicated home theaters. The ${smaller.name} (${smaller.diagonal}") works at ${smallerMinDist}-${smallerMaxDist} feet, making it more flexible for multi-purpose rooms.`
    });

    faqs.push({
      question: `Which screen size provides a more cinematic experience?`,
      answer: `The ${larger.name} at ${larger.diagonal}" provides ${areaDiff.toFixed(0)}% more viewing area, delivering a more immersive, cinema-like experience. However, the ${smaller.name} at ${smaller.diagonal}" is easier to set up and works in smaller spaces while still offering excellent movie viewing.`
    });

    if (sizeDiff > 20) {
      faqs.push({
        question: `Is the larger screen worth the extra wall space?`,
        answer: `The ${larger.name} requires approximately ${(Math.max(dimsA.width, dimsB.width) / 12).toFixed(1)} feet of wall width, while the ${smaller.name} needs ${(Math.min(dimsA.width, dimsB.width) / 12).toFixed(1)} feet. If you have a dedicated theater room with adequate wall space and seating distance, the larger screen significantly enhances immersion. For multi-purpose rooms, the smaller screen offers more flexibility.`
      });
    }
  }

  // Price consideration FAQ (general) - removed specific price claims as they vary widely
  if (areaDiff > 25) {
    faqs.push({
      question: `Is the larger screen worth it?`,
      answer: `The ${larger.name} offers ${areaDiff.toFixed(0)}% more screen area than the ${smaller.name}. Whether this matters depends on your usage: if you spend several hours daily ${deviceA.category === 'phone' ? 'on your phone for videos and reading' : deviceA.category === 'tv' ? 'watching TV' : deviceA.category === 'monitor' ? 'at your desk' : 'using your tablet'}, the extra space can improve your experience. For lighter use, the ${smaller.name} may be sufficient.`
    });
  }

  return faqs.slice(0, 4); // Return max 4 FAQs to keep page focused
}

