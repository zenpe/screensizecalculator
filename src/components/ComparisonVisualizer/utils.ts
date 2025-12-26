import type { Dimensions, ViewingDistance, ScaleConfig, Breakpoint, ComparisonData } from './types';
import type { Device } from '../../data/devices';

/**
 * Calculate physical dimensions from diagonal and aspect ratio
 */
export function calculateDimensions(diagonal: number, ratio: number): Dimensions {
  const height = diagonal / Math.sqrt(ratio * ratio + 1);
  const width = height * ratio;
  return { width, height };
}

/**
 * Calculate recommended viewing distance (in feet)
 * Rule of thumb: 1.5x to 2.5x the diagonal for 4K, optimal around 1.5-2x
 */
export function getViewingDistance(diagonal: number): ViewingDistance {
  const minFt = (diagonal * 1.2) / 12;
  const maxFt = (diagonal * 2.5) / 12;
  const optimalFt = (diagonal * 1.6) / 12;
  return { min: minFt, max: maxFt, optimal: optimalFt };
}

/**
 * Get scale multipliers based on breakpoint
 */
export function getScaleConfig(bp: Breakpoint): ScaleConfig {
  switch (bp) {
    case 'xs': return { widthRatio: 0.88, heightRatio: 0.48, sideBySideWidth: 0.82, sideBySideHeight: 0.28 };
    case 'sm': return { widthRatio: 0.88, heightRatio: 0.5, sideBySideWidth: 0.82, sideBySideHeight: 0.30 };
    case 'md': return { widthRatio: 0.85, heightRatio: 0.52, sideBySideWidth: 0.80, sideBySideHeight: 0.32 };
    case 'lg': return { widthRatio: 0.7, heightRatio: 0.6, sideBySideWidth: 0.42, sideBySideHeight: 0.6 };
    case 'xl': return { widthRatio: 0.6, heightRatio: 0.65, sideBySideWidth: 0.4, sideBySideHeight: 0.65 };
  }
}

/**
 * Get fixed container height based on breakpoint
 */
export function getFixedContainerHeight(bp: Breakpoint): number {
  switch (bp) {
    case 'xs': return 480;
    case 'sm': return 500;
    case 'md': return 520;
    case 'lg': return 500;
    case 'xl': return 520;
  }
}

/**
 * Adjust dimensions for portrait mode (phones and tablets)
 */
export function adjustDimsForCategory(dims: Dimensions, category: string): Dimensions {
  if (category === 'phone' || category === 'tablet') {
    return { width: dims.height, height: dims.width };
  }
  return dims;
}

/**
 * Process device comparison data
 */
export function processComparisonData(deviceA: Device, deviceB: Device): ComparisonData {
  const dimsA = calculateDimensions(deviceA.diagonal, deviceA.ratio);
  const dimsB = calculateDimensions(deviceB.diagonal, deviceB.ratio);

  const areaA = dimsA.width * dimsA.height;
  const areaB = dimsB.width * dimsB.height;

  const isPhoneComparison = deviceA.category === 'phone' && deviceB.category === 'phone';
  const isLargeScreenComparison = ['tv', 'projector', 'monitor'].includes(deviceA.category) &&
                                  ['tv', 'projector', 'monitor'].includes(deviceB.category);

  const adjustedDimsA = adjustDimsForCategory(dimsA, deviceA.category);
  const adjustedDimsB = adjustDimsForCategory(dimsB, deviceB.category);

  const larger = areaA >= areaB
    ? { device: deviceA, dims: adjustedDimsA, area: areaA }
    : { device: deviceB, dims: adjustedDimsB, area: areaB };

  const smaller = areaA < areaB
    ? { device: deviceA, dims: adjustedDimsA, area: areaA }
    : { device: deviceB, dims: adjustedDimsB, area: areaB };

  const sizeDiff = Math.abs(areaA - areaB) / Math.max(areaA, areaB);

  return {
    larger,
    smaller,
    isPhoneComparison,
    isLargeScreenComparison,
    areSameSize: sizeDiff < 0.05,
    sizeDiffPercent: sizeDiff * 100,
  };
}

/**
 * Calculate scale factor based on display mode and container size
 */
export function calculateScaleFactor(
  displayMode: string,
  larger: { dims: Dimensions },
  smaller: { dims: Dimensions },
  containerWidth: number,
  containerHeight: number,
  breakpoint: Breakpoint
): number {
  const config = getScaleConfig(breakpoint);

  if (displayMode === 'room-view') {
    const totalWidth = larger.dims.width + smaller.dims.width + 50;
    const maxHeight = Math.max(larger.dims.height, smaller.dims.height);
    const scaleByWidth = (containerWidth * 0.85) / totalWidth;
    const scaleByHeight = (containerHeight * 0.5) / maxHeight;
    return Math.min(scaleByWidth, scaleByHeight, 4);
  }

  if (displayMode === 'side-by-side') {
    const maxDeviceWidth = Math.max(larger.dims.width, smaller.dims.width);
    const maxDeviceHeight = Math.max(larger.dims.height, smaller.dims.height);
    const scaleByWidth = (containerWidth * config.sideBySideWidth) / maxDeviceWidth;
    const scaleByHeight = (containerHeight * config.sideBySideHeight) / maxDeviceHeight;
    return Math.min(scaleByWidth, scaleByHeight);
  }

  // Overlay mode
  const scaleByHeight = (containerHeight * config.heightRatio) / larger.dims.height;
  const scaleByWidth = (containerWidth * config.widthRatio) / larger.dims.width;
  return Math.min(scaleByHeight, scaleByWidth);
}
