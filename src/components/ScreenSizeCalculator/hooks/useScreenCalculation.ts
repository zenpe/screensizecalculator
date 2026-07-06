import { useMemo } from 'react';
import type { DeviceMode } from '../config';
import {
  DEVICE_CONFIGS,
  ASPECT_RATIOS_BY_MODE,
  RESOLUTIONS_BY_MODE,
  REFERENCE_SIZES,
} from '../config';

export interface CalculationResults {
  width: number;
  height: number;
  area: number;
  ppi: number;
  totalPixels: number;
  pixelPitch: number;
}

export interface ProjectorCalcs {
  throwDistance: number;
  minWallWidth: number;
  throwRatio: number;
}

export interface TVViewingCalcs {
  minDistance: number;
  optimalDistance: number;
  maxDistance: number;
  is4K: boolean;
}

export interface ReferenceSize {
  width: number;
  height: number;
  ratio: number;
}

interface UseScreenCalculationParams {
  deviceMode: DeviceMode;
  diagonal: string;
  unit: 'inches' | 'cm';
  aspectRatioSelect: string;
  customRatioW: string;
  customRatioH: string;
  resolutionSelect: string;
  customResW: string;
  customResH: string;
  throwRatio: string;
}

export function useScreenCalculation({
  deviceMode,
  diagonal,
  unit,
  aspectRatioSelect,
  customRatioW,
  customRatioH,
  resolutionSelect,
  customResW,
  customResH,
  throwRatio,
}: UseScreenCalculationParams) {
  const deviceConfig = DEVICE_CONFIGS[deviceMode];
  const currentResolutions = RESOLUTIONS_BY_MODE[deviceMode];
  const currentAspectRatios = ASPECT_RATIOS_BY_MODE[deviceMode];

  // Convert input diagonal to inches for internal calculations
  const diagonalInInches = useMemo(() => {
    const diag = parseFloat(diagonal);
    if (!diag || diag <= 0) return 0;
    return unit === 'cm' ? diag / 2.54 : diag;
  }, [diagonal, unit]);

  // Get current aspect ratio
  const aspectRatio = useMemo(() => {
    if (aspectRatioSelect === 'custom') {
      const w = parseFloat(customRatioW) || 16;
      const h = parseFloat(customRatioH) || 9;
      return w / h;
    }
    return currentAspectRatios.find(ar => ar.value === aspectRatioSelect)?.ratio || 16 / 9;
  }, [aspectRatioSelect, customRatioW, customRatioH, currentAspectRatios]);

  // Get current resolution
  const resolution = useMemo(() => {
    if (resolutionSelect === 'Custom') {
      return {
        width: parseInt(customResW) || 1920,
        height: parseInt(customResH) || 1080,
      };
    }
    const res = currentResolutions.find(r => r.label === resolutionSelect);
    return res || { width: 1920, height: 1080 };
  }, [resolutionSelect, customResW, customResH, currentResolutions]);

  // Calculate results (always in inches internally)
  const results = useMemo<CalculationResults | null>(() => {
    if (!diagonalInInches || diagonalInInches <= 0) return null;

    const height = diagonalInInches / Math.sqrt(aspectRatio * aspectRatio + 1);
    const width = height * aspectRatio;
    const area = width * height;

    const diagonalPixels = Math.sqrt(
      resolution.width * resolution.width + resolution.height * resolution.height
    );
    const ppi = diagonalPixels / diagonalInInches;
    const totalPixels = resolution.width * resolution.height;
    const pixelPitch = 25.4 / ppi;

    return { width, height, area, ppi, totalPixels, pixelPitch };
  }, [diagonalInInches, aspectRatio, resolution]);

  // Screen to reference ratios
  const screenToCreditCardRatio = diagonalInInches / REFERENCE_SIZES.creditCardDiagonal;
  const screenToPhoneRatio = diagonalInInches / REFERENCE_SIZES.phoneDiagonal;
  const screenToHumanRatio = diagonalInInches / REFERENCE_SIZES.humanHeight;

  // Reference visual sizes based on device mode
  const referenceSize = useMemo<ReferenceSize>(() => {
    if (!diagonalInInches) return { width: 50, height: 80, ratio: 1 };

    const refType = deviceConfig.referenceType;

    switch (refType) {
      case 'creditCard': {
        const baseSize = 50;
        const baseScreenSize = 27;
        const scaledWidth = baseSize * (baseScreenSize / diagonalInInches);
        return {
          width: Math.max(12, Math.min(68, scaledWidth)),
          height: Math.max(12, Math.min(68, scaledWidth)) * 0.63,
          ratio: screenToCreditCardRatio
        };
      }
      case 'hand': {
        const baseSize = 45;
        const baseScreenSize = 6.1;
        const scaledWidth = baseSize * (baseScreenSize / diagonalInInches);
        return {
          width: Math.max(20, Math.min(60, scaledWidth)),
          height: Math.max(20, Math.min(60, scaledWidth)) * 1.8,
          ratio: screenToPhoneRatio
        };
      }
      case 'human': {
        const baseHeight = 120;
        const baseScreenSize = 55;
        const scaledHeight = baseHeight * (baseScreenSize / diagonalInInches);
        return {
          width: Math.max(25, Math.min(150, scaledHeight)) * 0.35,
          height: Math.max(25, Math.min(150, scaledHeight)),
          ratio: screenToHumanRatio
        };
      }
      default:
        return { width: 50, height: 80, ratio: 1 };
    }
  }, [diagonalInInches, deviceConfig.referenceType, screenToCreditCardRatio, screenToPhoneRatio, screenToHumanRatio]);

  // Projector calculations
  const projectorCalcs = useMemo<ProjectorCalcs | null>(() => {
    if (!results || deviceMode !== 'projector') return null;

    const ratio = parseFloat(throwRatio) || 1.5;
    const throwDistance = results.width * ratio;
    const minWallWidth = results.width * 1.2;

    return { throwDistance, minWallWidth, throwRatio: ratio };
  }, [results, deviceMode, throwRatio]);

  // TV viewing distance calculations
  const tvViewingCalcs = useMemo<TVViewingCalcs | null>(() => {
    if (!results || deviceMode !== 'tv') return null;

    const minDistance = diagonalInInches * 1.2;
    const maxDistance = diagonalInInches * 2.5;
    const optimalDistance = diagonalInInches * 1.6;

    const is4K = resolution.width >= 3840;
    const adjustedMin = is4K ? diagonalInInches * 1.0 : minDistance;

    return { minDistance: adjustedMin, optimalDistance, maxDistance, is4K };
  }, [results, deviceMode, diagonalInInches, resolution.width]);

  return {
    deviceConfig,
    currentResolutions,
    currentAspectRatios,
    diagonalInInches,
    aspectRatio,
    resolution,
    results,
    referenceSize,
    projectorCalcs,
    tvViewingCalcs,
  };
}
