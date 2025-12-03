import { useState, useMemo } from 'react';
import { getAmazonSearchUrl, getAmazonUrl } from '../site.config';

// Device modes
type DeviceMode = 'phone' | 'monitor' | 'tv' | 'projector';

interface DeviceModeConfig {
  label: string;
  icon: string;
  defaultDiagonal: string;
  defaultResolution: string;
  referenceType: 'creditCard' | 'hand' | 'human';
  highlightPPI: boolean;
  showWallWidth: boolean;
  shopLabel: string;
  shopKeyword: string;
}

const DEVICE_CONFIGS: Record<DeviceMode, DeviceModeConfig> = {
  phone: {
    label: 'Phone',
    icon: '📱',
    defaultDiagonal: '6.1',
    defaultResolution: '1170 x 2532 (iPhone 14)',
    referenceType: 'hand',
    highlightPPI: true,
    showWallWidth: false,
    shopLabel: 'Shop Phones',
    shopKeyword: 'smartphone',
  },
  monitor: {
    label: 'Monitor',
    icon: '🖥️',
    defaultDiagonal: '27',
    defaultResolution: '2560 x 1440 (QHD)',
    referenceType: 'creditCard',
    highlightPPI: false,
    showWallWidth: false,
    shopLabel: 'Shop Monitors',
    shopKeyword: 'monitor',
  },
  tv: {
    label: 'TV',
    icon: '📺',
    defaultDiagonal: '55',
    defaultResolution: '3840 x 2160 (4K UHD)',
    referenceType: 'human',
    highlightPPI: false,
    showWallWidth: false,
    shopLabel: 'Shop TVs',
    shopKeyword: 'tv 4k',
  },
  projector: {
    label: 'Projector',
    icon: '📽️',
    defaultDiagonal: '100',
    defaultResolution: '3840 x 2160 (4K UHD)',
    referenceType: 'human',
    highlightPPI: false,
    showWallWidth: true,
    shopLabel: 'Shop Projectors & Screens',
    shopKeyword: 'projector 4k',
  },
};

// Common aspect ratios for monitors/TVs
const ASPECT_RATIOS_DISPLAY = [
  { label: '16:9 (Widescreen)', value: '16:9', ratio: 16 / 9 },
  { label: '16:10 (Desktop)', value: '16:10', ratio: 16 / 10 },
  { label: '4:3 (Standard)', value: '4:3', ratio: 4 / 3 },
  { label: '21:9 (Ultrawide)', value: '21:9', ratio: 21 / 9 },
  { label: '32:9 (Super Ultrawide)', value: '32:9', ratio: 32 / 9 },
  { label: '3:2 (Surface)', value: '3:2', ratio: 3 / 2 },
  { label: '1:1 (Square)', value: '1:1', ratio: 1 },
  { label: 'Custom', value: 'custom', ratio: null },
];

// Common aspect ratios for phones (tall/portrait orientation)
const ASPECT_RATIOS_PHONE = [
  { label: '19.5:9 (iPhone 14/15)', value: '19.5:9', ratio: 9 / 19.5 },
  { label: '20:9 (Android Standard)', value: '20:9', ratio: 9 / 20 },
  { label: '21:9 (Sony Xperia)', value: '21:9-phone', ratio: 9 / 21 },
  { label: '19:9 (Older iPhones)', value: '19:9', ratio: 9 / 19 },
  { label: '18.5:9 (Samsung Galaxy)', value: '18.5:9', ratio: 9 / 18.5 },
  { label: '16:9 (Older Phones)', value: '16:9-phone', ratio: 9 / 16 },
  { label: 'Custom', value: 'custom', ratio: null },
];

const ASPECT_RATIOS_BY_MODE: Record<DeviceMode, typeof ASPECT_RATIOS_DISPLAY> = {
  phone: ASPECT_RATIOS_PHONE,
  monitor: ASPECT_RATIOS_DISPLAY,
  tv: ASPECT_RATIOS_DISPLAY,
  projector: ASPECT_RATIOS_DISPLAY,
};

// Common resolutions by device type
const RESOLUTIONS_MONITOR = [
  { label: '1920 x 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '2560 x 1440 (QHD)', width: 2560, height: 1440 },
  { label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160 },
  { label: '1366 x 768 (HD)', width: 1366, height: 768 },
  { label: '1280 x 720 (720p)', width: 1280, height: 720 },
  { label: '2560 x 1600 (MacBook)', width: 2560, height: 1600 },
  { label: '3440 x 1440 (Ultrawide)', width: 3440, height: 1440 },
  { label: '5120 x 2880 (5K)', width: 5120, height: 2880 },
  { label: 'Custom', width: 0, height: 0 },
];

const RESOLUTIONS_PHONE = [
  { label: '1170 x 2532 (iPhone 14)', width: 1170, height: 2532 },
  { label: '1179 x 2556 (iPhone 15 Pro)', width: 1179, height: 2556 },
  { label: '1290 x 2796 (iPhone 15 Pro Max)', width: 1290, height: 2796 },
  { label: '1080 x 2400 (Android FHD+)', width: 1080, height: 2400 },
  { label: '1440 x 3200 (Android QHD+)', width: 1440, height: 3200 },
  { label: '1080 x 2340 (Pixel 7)', width: 1080, height: 2340 },
  { label: '1440 x 3120 (Pixel 7 Pro)', width: 1440, height: 3120 },
  { label: 'Custom', width: 0, height: 0 },
];

const RESOLUTIONS_TV = [
  { label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160 },
  { label: '1920 x 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '7680 x 4320 (8K)', width: 7680, height: 4320 },
  { label: '1280 x 720 (720p)', width: 1280, height: 720 },
  { label: 'Custom', width: 0, height: 0 },
];

const RESOLUTIONS_PROJECTOR = [
  { label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160 },
  { label: '1920 x 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '1280 x 720 (720p)', width: 1280, height: 720 },
  { label: '1920 x 1200 (WUXGA)', width: 1920, height: 1200 },
  { label: 'Custom', width: 0, height: 0 },
];

const RESOLUTIONS_BY_MODE: Record<DeviceMode, typeof RESOLUTIONS_MONITOR> = {
  phone: RESOLUTIONS_PHONE,
  monitor: RESOLUTIONS_MONITOR,
  tv: RESOLUTIONS_TV,
  projector: RESOLUTIONS_PROJECTOR,
};

interface CalculationResults {
  width: number;
  height: number;
  area: number;
  ppi: number;
  totalPixels: number;
  pixelPitch: number;
}

// Reference SVG Components
const CreditCardSVG = ({ width }: { width: number }) => (
  <svg
    width={width}
    height={width * 0.63}
    viewBox="0 0 68 43"
    className="drop-shadow transition-all duration-300"
  >
    <rect x="0" y="0" width="68" height="43" rx="4" fill="url(#cardGradient)" stroke="#4B5563" strokeWidth="1" />
    <rect x="8" y="12" width="12" height="10" rx="2" fill="#D4AF37" opacity="0.9" />
    <line x1="10" y1="15" x2="18" y2="15" stroke="#B8860B" strokeWidth="0.5" />
    <line x1="10" y1="17" x2="18" y2="17" stroke="#B8860B" strokeWidth="0.5" />
    <line x1="10" y1="19" x2="18" y2="19" stroke="#B8860B" strokeWidth="0.5" />
    <rect x="0" y="28" width="68" height="6" fill="#1F2937" opacity="0.8" />
    <circle cx="56" cy="14" r="6" fill="#EB001B" opacity="0.9" />
    <circle cx="62" cy="14" r="6" fill="#F79E1B" opacity="0.7" />
    <defs>
      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="50%" stopColor="#4B5563" />
        <stop offset="100%" stopColor="#374151" />
      </linearGradient>
    </defs>
  </svg>
);

const HandHoldingPhoneSVG = ({ width }: { width: number }) => (
  <svg
    width={width}
    height={width * 1.8}
    viewBox="0 0 60 108"
    className="drop-shadow transition-all duration-300"
  >
    {/* Hand */}
    <ellipse cx="30" cy="85" rx="22" ry="18" fill="#E5C4A8" />
    <ellipse cx="30" cy="95" rx="18" ry="10" fill="#D4A574" />
    {/* Thumb */}
    <ellipse cx="8" cy="65" rx="6" ry="14" fill="#E5C4A8" transform="rotate(-15 8 65)" />
    {/* Fingers wrapped around */}
    <rect x="48" y="40" width="8" height="35" rx="4" fill="#E5C4A8" />
    <rect x="50" y="50" width="6" height="30" rx="3" fill="#D4A574" opacity="0.5" />
    {/* Phone body */}
    <rect x="12" y="5" width="36" height="70" rx="6" fill="#1F2937" stroke="#374151" strokeWidth="1.5" />
    {/* Phone screen */}
    <rect x="14" y="10" width="32" height="60" rx="3" fill="url(#phoneScreen)" />
    {/* Notch */}
    <rect x="22" y="12" width="16" height="4" rx="2" fill="#111827" />
    {/* Home indicator */}
    <rect x="22" y="64" width="16" height="3" rx="1.5" fill="#374151" />
    <defs>
      <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
  </svg>
);

const HumanSilhouetteSVG = ({ height }: { height: number }) => (
  <svg
    width={height * 0.35}
    height={height}
    viewBox="0 0 35 100"
    className="drop-shadow transition-all duration-300"
  >
    {/* Head */}
    <circle cx="17.5" cy="10" r="8" fill="#6B7280" />
    {/* Neck */}
    <rect x="14" y="17" width="7" height="5" fill="#6B7280" />
    {/* Body/Torso */}
    <path d="M7 22 L28 22 L25 55 L10 55 Z" fill="#6B7280" />
    {/* Left arm */}
    <path d="M7 22 Q2 35 4 48" stroke="#6B7280" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Right arm */}
    <path d="M28 22 Q33 35 31 48" stroke="#6B7280" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Left leg */}
    <path d="M10 55 L8 100" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" />
    {/* Right leg */}
    <path d="M25 55 L27 100" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export default function ScreenSizeCalculator({ initialDeviceMode = 'monitor' }: { initialDeviceMode?: DeviceMode }) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(initialDeviceMode);
  const [diagonal, setDiagonal] = useState<string>(DEVICE_CONFIGS[initialDeviceMode].defaultDiagonal);
  const [aspectRatioSelect, setAspectRatioSelect] = useState<string>(initialDeviceMode === 'phone' ? '19.5:9' : '16:9');
  const [customRatioW, setCustomRatioW] = useState<string>('16');
  const [customRatioH, setCustomRatioH] = useState<string>('9');
  const [resolutionSelect, setResolutionSelect] = useState<string>(DEVICE_CONFIGS[initialDeviceMode].defaultResolution);
  const [customResW, setCustomResW] = useState<string>('1920');
  const [customResH, setCustomResH] = useState<string>('1080');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
  const [throwRatio, setThrowRatio] = useState<string>('1.5'); // Projector throw ratio

  // Get current device config
  const deviceConfig = DEVICE_CONFIGS[deviceMode];
  const currentResolutions = RESOLUTIONS_BY_MODE[deviceMode];
  const currentAspectRatios = ASPECT_RATIOS_BY_MODE[deviceMode];

  // Handle device mode change
  const handleDeviceModeChange = (newMode: DeviceMode) => {
    setDeviceMode(newMode);
    const config = DEVICE_CONFIGS[newMode];
    setDiagonal(config.defaultDiagonal);
    setResolutionSelect(config.defaultResolution);
    // Reset aspect ratio based on device
    if (newMode === 'phone') {
      setAspectRatioSelect('19.5:9'); // iPhone 14/15 default
    } else {
      setAspectRatioSelect('16:9');
    }
  };

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

  // Convert input diagonal to inches for internal calculations
  const diagonalInInches = useMemo(() => {
    const diag = parseFloat(diagonal);
    if (!diag || diag <= 0) return 0;
    // If input is in cm, convert to inches for calculations
    return unit === 'cm' ? diag / 2.54 : diag;
  }, [diagonal, unit]);

  // Calculate results (always in inches internally)
  const results = useMemo<CalculationResults | null>(() => {
    if (!diagonalInInches || diagonalInInches <= 0) return null;

    // Calculate physical dimensions from diagonal and aspect ratio
    // diagonal² = width² + height²
    // width = height * aspectRatio
    // diagonal² = (height * aspectRatio)² + height²
    // diagonal² = height² * (aspectRatio² + 1)
    // height = diagonal / sqrt(aspectRatio² + 1)
    const height = diagonalInInches / Math.sqrt(aspectRatio * aspectRatio + 1);
    const width = height * aspectRatio;

    // Area in square inches
    const area = width * height;

    // PPI calculation (always uses inches)
    const diagonalPixels = Math.sqrt(
      resolution.width * resolution.width + resolution.height * resolution.height
    );
    const ppi = diagonalPixels / diagonalInInches;

    // Total pixels
    const totalPixels = resolution.width * resolution.height;

    // Pixel pitch (distance between pixels in mm)
    const pixelPitch = 25.4 / ppi;

    return {
      width,
      height,
      area,
      ppi,
      totalPixels,
      pixelPitch,
    };
  }, [diagonalInInches, aspectRatio, resolution]);

  // Reference object sizes based on device mode
  // Credit card: 3.375" x 2.125" (diagonal ≈ 3.98")
  // Average phone: ~6.1" diagonal
  // Average human height: 5'7" (67") - we use this for scale
  const creditCardDiagonal = 3.98; // inches
  const phoneDiagonal = 6.1; // inches
  const humanHeight = 67; // inches (5'7")

  const screenToCreditCardRatio = diagonalInInches / creditCardDiagonal;
  const screenToPhoneRatio = diagonalInInches / phoneDiagonal;
  const screenToHumanRatio = diagonalInInches / humanHeight;

  // Reference visual sizes based on device mode
  const referenceSize = useMemo(() => {
    if (!diagonalInInches) return { width: 50, height: 80, ratio: 1 };

    const refType = deviceConfig.referenceType;

    switch (refType) {
      case 'creditCard': {
        // Credit card: Base size at 27" = 50px wide
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
        // Hand with phone: Base size at 6.1" = 45px wide
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
        // Human silhouette: Base height at 55" TV = 120px
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

  // For projector mode: calculate throw distance and wall width
  const projectorCalcs = useMemo(() => {
    if (!results || deviceMode !== 'projector') return null;

    const ratio = parseFloat(throwRatio) || 1.5;
    // Throw Distance = Screen Width × Throw Ratio
    const throwDistance = results.width * ratio;
    // Minimum wall width (add 10% margin on each side)
    const minWallWidth = results.width * 1.2;

    return {
      throwDistance,
      minWallWidth,
      throwRatio: ratio,
    };
  }, [results, deviceMode, throwRatio]);

  // For TV mode: calculate recommended viewing distance
  // Based on THX and SMPTE standards for optimal viewing
  const tvViewingCalcs = useMemo(() => {
    if (!results || deviceMode !== 'tv') return null;

    // Different standards for viewing distance:
    // THX recommends 40° viewing angle (closer): ~1.2x screen diagonal
    // SMPTE recommends 30° viewing angle: ~1.6x screen diagonal
    // General comfortable range: 1.5x - 2.5x screen diagonal

    const minDistance = diagonalInInches * 1.2; // THX (immersive)
    const maxDistance = diagonalInInches * 2.5; // Comfortable max
    const optimalDistance = diagonalInInches * 1.6; // SMPTE sweet spot

    // For 4K resolution, you can sit closer
    const is4K = resolution.width >= 3840;
    const adjustedMin = is4K ? diagonalInInches * 1.0 : minDistance;

    return {
      minDistance: adjustedMin,
      optimalDistance,
      maxDistance,
      is4K,
    };
  }, [results, deviceMode, diagonalInInches, resolution.width]);

  // Format number
  const formatNum = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Convert inches to cm if needed
  const displayValue = (inches: number) => {
    if (unit === 'cm') {
      return formatNum(inches * 2.54);
    }
    return formatNum(inches);
  };

  const unitLabel = unit === 'inches' ? 'in' : 'cm';

  // Generate Amazon search URL and label based on device mode and screen size
  const getAmazonInfo = () => {
    const config = deviceConfig;

    if (!diagonalInInches) {
      return {
        url: getAmazonSearchUrl(config.shopKeyword),
        label: config.shopLabel
      };
    }

    switch (deviceMode) {
      case 'phone': {
        return {
          url: getAmazonSearchUrl('smartphone unlocked'),
          label: 'Shop Smartphones'
        };
      }
      case 'monitor': {
        const sizes = [24, 27, 32, 34];
        const nearest = sizes.reduce((prev, curr) =>
          Math.abs(curr - diagonalInInches) < Math.abs(prev - diagonalInInches) ? curr : prev
        );
        return {
          url: getAmazonSearchUrl(`${nearest} inch monitor 4k`),
          label: `Shop ${nearest}" Monitors`
        };
      }
      case 'tv': {
        const sizes = [32, 40, 43, 50, 55, 65, 75, 85];
        const nearest = sizes.reduce((prev, curr) =>
          Math.abs(curr - diagonalInInches) < Math.abs(prev - diagonalInInches) ? curr : prev
        );
        return {
          url: getAmazonSearchUrl(`${nearest} inch tv 4k`),
          label: `Shop ${nearest}" TVs`
        };
      }
      case 'projector': {
        return {
          url: getAmazonSearchUrl('4k projector home theater'),
          label: 'Shop Projectors & Screens'
        };
      }
      default:
        return { url: 'https://www.amazon.com', label: 'Shop on Amazon' };
    }
  };

  const amazonInfo = getAmazonInfo();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden" role="application" aria-label="Screen size calculator with TV viewing distance and projector throw distance">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Screen Size Calculator</h2>
        <p className="text-primary-100 text-sm mt-1">
          Calculate display dimensions, PPI, and more
        </p>
      </div>

      {/* Device Mode Tabs - Segmented Control */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg p-1 gap-1" role="tablist" aria-label="Device type selection">
          {(Object.keys(DEVICE_CONFIGS) as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleDeviceModeChange(mode)}
              role="tab"
              aria-selected={deviceMode === mode}
              aria-label={`${DEVICE_CONFIGS[mode].label} mode`}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                deviceMode === mode
                  ? 'bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-500'
              }`}
            >
              <span className="text-base" aria-hidden="true">{DEVICE_CONFIGS[mode].icon}</span>
              <span className="hidden sm:inline">{DEVICE_CONFIGS[mode].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="lg:flex lg:flex-row">
        {/* Left Panel: Fixed width on desktop */}
        <div className="w-full lg:w-[340px] lg:min-w-[340px] lg:max-w-[340px] p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Input Section */}
          <div className="space-y-3">
            {/* Screen Size Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Screen Size
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={diagonal}
                  onChange={(e) => setDiagonal(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="55"
                  min="1"
                  step="0.1"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'inches' | 'cm')}
                  className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-gray-50 dark:bg-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="inches">inches</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Aspect Ratio
              </label>
              <select
                value={aspectRatioSelect}
                onChange={(e) => setAspectRatioSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              >
                {currentAspectRatios.map((ar) => (
                  <option key={ar.value} value={ar.value}>
                    {ar.label}
                  </option>
                ))}
              </select>
              {aspectRatioSelect === 'custom' && (
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="number"
                    value={customRatioW}
                    onChange={(e) => setCustomRatioW(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="16"
                    min="1"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="number"
                    value={customRatioH}
                    onChange={(e) => setCustomRatioH(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="9"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Resolution
              </label>
              <select
                value={resolutionSelect}
                onChange={(e) => setResolutionSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              >
                {currentResolutions.map((res) => (
                  <option key={res.label} value={res.label}>
                    {res.label}
                  </option>
                ))}
              </select>
              {resolutionSelect === 'Custom' && (
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="number"
                    value={customResW}
                    onChange={(e) => setCustomResW(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1920"
                    min="1"
                  />
                  <span className="text-gray-400">x</span>
                  <input
                    type="number"
                    value={customResH}
                    onChange={(e) => setCustomResH(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1080"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* Throw Ratio - Projector Mode Only */}
            {deviceMode === 'projector' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Throw Ratio
                  <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal">(distance ÷ width)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={throwRatio}
                    onChange={(e) => setThrowRatio(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="0.5">0.5 (Ultra Short Throw)</option>
                    <option value="0.8">0.8 (Short Throw)</option>
                    <option value="1.2">1.2 (Short Throw)</option>
                    <option value="1.5">1.5 (Standard)</option>
                    <option value="1.8">1.8 (Standard)</option>
                    <option value="2.0">2.0 (Long Throw)</option>
                    <option value="2.5">2.5 (Long Throw)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {throwRatio === 'custom' && (
                  <input
                    type="number"
                    value={throwRatio}
                    onChange={(e) => setThrowRatio(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1.5"
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            {results ? (
              <div className="space-y-2">
                {/* PPI Highlight for Phone Mode */}
                {deviceConfig.highlightPPI && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-3 text-center shadow-md mb-2">
                    <p className="text-[10px] text-white/80 uppercase font-medium tracking-wide">Pixel Density</p>
                    <p className="text-2xl font-bold text-white">{formatNum(results.ppi, 0)} <span className="text-lg">PPI</span></p>
                    <p className="text-[10px] text-white/70 mt-1">
                      {results.ppi >= 400 ? 'Retina-class display' : results.ppi >= 300 ? 'Sharp display' : 'Standard display'}
                    </p>
                  </div>
                )}
                {/* Stats Grid - 2x3 */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Width</p>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{displayValue(results.width)}<span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">{unitLabel}</span></p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Height</p>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{displayValue(results.height)}<span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">{unitLabel}</span></p>
                  </div>
                  {!deviceConfig.highlightPPI && (
                    <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/30 rounded p-2 border border-accent-200 dark:border-accent-700 text-center">
                      <p className="text-[9px] text-accent-700 dark:text-accent-300 uppercase">PPI</p>
                      <p className="text-sm font-bold text-accent-600 dark:text-accent-400">{formatNum(results.ppi, 0)}</p>
                    </div>
                  )}
                  {deviceConfig.highlightPPI && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Pitch</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNum(results.pixelPitch, 2)}<span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">mm</span></p>
                    </div>
                  )}
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Area</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{unit === 'cm' ? formatNum(results.area * 6.4516, 0) : formatNum(results.area, 0)}<span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">{unit === 'cm' ? 'cm²' : 'in²'}</span></p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Pixels</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{(results.totalPixels / 1000000).toFixed(1)}<span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">MP</span></p>
                  </div>
                  {!deviceConfig.highlightPPI && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Pitch</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNum(results.pixelPitch, 2)}<span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">mm</span></p>
                    </div>
                  )}
                  {deviceConfig.highlightPPI && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">Diagonal</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNum(diagonalInInches, 1)}<span className="text-[9px] font-normal text-gray-400 dark:text-gray-500 ml-0.5">in</span></p>
                    </div>
                  )}
                </div>

                {/* Projector Mode - Throw Distance Card */}
                {projectorCalcs && (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[10px] text-white/80 uppercase font-medium tracking-wide">Throw Distance</p>
                        <p className="text-xl font-bold text-white">
                          {displayValue(projectorCalcs.throwDistance)} <span className="text-sm">{unitLabel}</span>
                        </p>
                        <p className="text-[10px] text-white/60 mt-0.5">
                          {unit === 'inches'
                            ? `≈ ${formatNum(projectorCalcs.throwDistance / 12, 1)} ft`
                            : `≈ ${formatNum(projectorCalcs.throwDistance / 100, 1)} m`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/80 uppercase font-medium tracking-wide">Min Wall Width</p>
                        <p className="text-lg font-bold text-white">
                          {displayValue(projectorCalcs.minWallWidth)} <span className="text-xs">{unitLabel}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-[9px] text-white/60">
                        Projector should be placed {displayValue(projectorCalcs.throwDistance)} {unitLabel} from the screen
                      </p>
                    </div>
                  </div>
                )}

                {/* TV Mode - Viewing Distance Card */}
                {tvViewingCalcs && (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[10px] text-white/80 uppercase font-medium tracking-wide">
                          Optimal Viewing Distance
                        </p>
                        <p className="text-xl font-bold text-white">
                          {unit === 'inches'
                            ? `${formatNum(tvViewingCalcs.optimalDistance / 12, 1)} ft`
                            : `${formatNum(tvViewingCalcs.optimalDistance * 2.54 / 100, 1)} m`
                          }
                        </p>
                        <p className="text-[10px] text-white/60 mt-0.5">
                          ({displayValue(tvViewingCalcs.optimalDistance)} {unitLabel})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/80 uppercase font-medium tracking-wide">Range</p>
                        <p className="text-sm font-bold text-white">
                          {unit === 'inches'
                            ? `${formatNum(tvViewingCalcs.minDistance / 12, 1)} - ${formatNum(tvViewingCalcs.maxDistance / 12, 1)} ft`
                            : `${formatNum(tvViewingCalcs.minDistance * 2.54 / 100, 1)} - ${formatNum(tvViewingCalcs.maxDistance * 2.54 / 100, 1)} m`
                          }
                        </p>
                        {tvViewingCalcs.is4K && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/20 rounded text-[8px] text-white/90">
                            4K: Sit Closer OK
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-[9px] text-white/60">
                        Based on THX & SMPTE standards for {tvViewingCalcs.is4K ? '4K' : 'HD'} content
                      </p>
                    </div>
                  </div>
                )}

                {/* Amazon CTA */}
                <a
                  href={amazonInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-gray-900 font-semibold py-2 px-3 rounded-lg shadow hover:shadow-md transition-all text-xs"
                >
                  {amazonInfo.label} on Amazon
                </a>
              </div>
            ) : (
              <p className="text-center py-3 text-gray-500 text-sm">Enter screen size to see results</p>
            )}
          </div>
        </div>

        {/* Right Panel: Fills remaining space */}
        <div className="w-full lg:flex-1 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-6 min-h-[400px] lg:min-h-[500px] flex flex-col relative overflow-hidden">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Screen Visualization</h3>

          {results ? (
            <div className="flex-1 flex items-center justify-center relative overflow-hidden pb-12" role="img" aria-label={`Visual representation of ${formatNum(diagonalInInches, 1)} inch screen with ${resolution.width}x${resolution.height} resolution`}>
              {/* Screen Frame - Always fills ~70% of container width */}
              <svg
                viewBox={`0 0 ${aspectRatio * 100} 100`}
                className="transition-all duration-300 ease-out drop-shadow-2xl"
                style={{
                  width: '75%',
                  maxHeight: '80%',
                }}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {/* Screen Bezel - larger radius for phones */}
                <rect
                  x="0"
                  y="0"
                  width={aspectRatio * 100}
                  height="100"
                  rx={deviceMode === 'phone' ? 12 : 3}
                  fill={deviceMode === 'phone' ? '#1F2937' : '#4B5563'}
                />
                {/* Screen Display Area - larger radius for phones */}
                <rect
                  x={deviceMode === 'phone' ? 1.5 : 2.5}
                  y={deviceMode === 'phone' ? 1.5 : 2.5}
                  width={aspectRatio * 100 - (deviceMode === 'phone' ? 3 : 5)}
                  height={deviceMode === 'phone' ? 97 : 95}
                  rx={deviceMode === 'phone' ? 10 : 1.5}
                  fill="url(#screenGradient)"
                />
                {/* Dynamic Island / Notch for phones */}
                {deviceMode === 'phone' && (
                  <rect
                    x={aspectRatio * 50 - 8}
                    y="4"
                    width="16"
                    height="5"
                    rx="2.5"
                    fill="#000"
                  />
                )}
                {/* Corner dots - only for non-phone */}
                {deviceMode !== 'phone' && (
                  <>
                    <circle cx="6" cy="6" r="1" fill="#6B7280" opacity="0.4" />
                    <circle cx={aspectRatio * 100 - 6} cy="6" r="1" fill="#6B7280" opacity="0.4" />
                    <circle cx="6" cy="94" r="1" fill="#6B7280" opacity="0.4" />
                    <circle cx={aspectRatio * 100 - 6} cy="94" r="1" fill="#6B7280" opacity="0.4" />
                  </>
                )}
                {/* Home indicator for phones */}
                {deviceMode === 'phone' && (
                  <rect
                    x={aspectRatio * 50 - 10}
                    y="94"
                    width="20"
                    height="2.5"
                    rx="1.25"
                    fill="#4B5563"
                  />
                )}

                {/* Text Content */}
                <text
                  x={aspectRatio * 50}
                  y="40"
                  textAnchor="middle"
                  className="fill-white"
                  style={{ fontSize: '16px', fontWeight: 'bold' }}
                >
                  {formatNum(diagonalInInches, 1)}"
                </text>
                <text
                  x={aspectRatio * 50}
                  y="54"
                  textAnchor="middle"
                  className="fill-gray-300"
                  style={{ fontSize: '7px' }}
                >
                  {resolution.width} x {resolution.height}
                </text>
                <text
                  x={aspectRatio * 50}
                  y="64"
                  textAnchor="middle"
                  className="fill-gray-400"
                  style={{ fontSize: '5px' }}
                >
                  {displayValue(results.width)} x {displayValue(results.height)} {unitLabel}
                </text>

                {/* PPI Badge */}
                <rect
                  x={aspectRatio * 50 - 14}
                  y="70"
                  width="28"
                  height="9"
                  rx="4.5"
                  fill="rgba(245, 158, 11, 0.25)"
                />
                <text
                  x={aspectRatio * 50}
                  y="77"
                  textAnchor="middle"
                  className="fill-amber-400"
                  style={{ fontSize: '5px', fontWeight: '600' }}
                >
                  {formatNum(results.ppi, 0)} PPI
                </text>

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="50%" stopColor="#1F2937" />
                    <stop offset="100%" stopColor="#111827" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Dynamic Reference Object - Changes based on device mode */}
              <div className="absolute bottom-3 right-3 flex flex-col items-end">
                <div className="relative group">
                  {deviceConfig.referenceType === 'creditCard' && (
                    <CreditCardSVG width={referenceSize.width} />
                  )}
                  {deviceConfig.referenceType === 'hand' && (
                    <HandHoldingPhoneSVG width={referenceSize.width} />
                  )}
                  {deviceConfig.referenceType === 'human' && (
                    <HumanSilhouetteSVG height={referenceSize.height} />
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-700 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {deviceConfig.referenceType === 'creditCard' && 'Credit Card (3.4" x 2.1")'}
                    {deviceConfig.referenceType === 'hand' && 'Average Phone (6.1")'}
                    {deviceConfig.referenceType === 'human' && 'Average Person (5\'7")'}
                  </div>
                </div>
                {/* Scale Label */}
                <p className="mt-1 text-[10px] text-gray-500">
                  {deviceConfig.referenceType === 'creditCard' && (
                    <>Screen = <span className="text-accent-400 font-medium">{formatNum(referenceSize.ratio, 1)}x</span> card</>
                  )}
                  {deviceConfig.referenceType === 'hand' && (
                    <>Screen = <span className="text-accent-400 font-medium">{formatNum(referenceSize.ratio, 1)}x</span> phone</>
                  )}
                  {deviceConfig.referenceType === 'human' && (
                    <>Screen = <span className="text-accent-400 font-medium">{formatNum(referenceSize.ratio, 1)}x</span> person height</>
                  )}
                </p>
              </div>

              {/* Projector Info Overlay */}
              {projectorCalcs && (
                <div className="absolute bottom-3 left-3 bg-gray-800/90 rounded-lg px-3 py-2 border border-gray-600 backdrop-blur-sm">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Throw Distance</p>
                      <p className="text-sm font-bold text-indigo-400">
                        {displayValue(projectorCalcs.throwDistance)} {unitLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Wall Width</p>
                      <p className="text-sm font-bold text-amber-400">
                        {displayValue(projectorCalcs.minWallWidth)} {unitLabel}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TV Viewing Distance Overlay */}
              {tvViewingCalcs && (
                <div className="absolute bottom-3 left-3 bg-gray-800/90 rounded-lg px-3 py-2 border border-gray-600 backdrop-blur-sm">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Best Distance</p>
                      <p className="text-sm font-bold text-emerald-400">
                        {unit === 'inches'
                          ? `${formatNum(tvViewingCalcs.optimalDistance / 12, 1)} ft`
                          : `${formatNum(tvViewingCalcs.optimalDistance * 2.54 / 100, 1)} m`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Range</p>
                      <p className="text-sm font-bold text-teal-400">
                        {unit === 'inches'
                          ? `${formatNum(tvViewingCalcs.minDistance / 12, 1)}-${formatNum(tvViewingCalcs.maxDistance / 12, 1)} ft`
                          : `${formatNum(tvViewingCalcs.minDistance * 2.54 / 100, 1)}-${formatNum(tvViewingCalcs.maxDistance * 2.54 / 100, 1)} m`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center relative">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2"/>
                  <path d="M8 21h8M12 17v4" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Enter screen details to visualize</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
