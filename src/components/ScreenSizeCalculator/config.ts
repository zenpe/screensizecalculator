// Device modes
export type DeviceMode = 'phone' | 'monitor' | 'tv' | 'projector' | 'tablet';

export interface DeviceModeConfig {
  label: string;
  icon: string;
  defaultDiagonal: string;
  defaultResolution: string;
  referenceType: 'creditCard' | 'hand' | 'human';
  highlightPPI: boolean;
  showWallWidth: boolean;
  shopLabel: string;
  shopKeyword: string;
  // Theme colors for each device mode
  colors: {
    headerGradient: string;
    headerText: string;
    activeTab: string;
    overlayText: string;
    svgFill: string;        // For SVG fill class
    svgBadgeBg: string;     // For SVG badge background (rgba)
  };
  // Header text for each device mode
  headerTitle: string;
  headerSubtitle: string;
}

export const DEVICE_CONFIGS: Record<DeviceMode, DeviceModeConfig> = {
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
    colors: {
      headerGradient: 'from-amber-600 to-amber-700',
      headerText: 'text-amber-200',
      activeTab: 'text-amber-700 dark:text-amber-400',
      overlayText: 'text-amber-400',
      svgFill: 'fill-amber-400',
      svgBadgeBg: 'rgba(245, 158, 11, 0.25)',
    },
    headerTitle: 'Phone Screen Calculator',
    headerSubtitle: 'Calculate PPI, dimensions & pixel density',
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
    colors: {
      headerGradient: 'from-blue-600 to-blue-700',
      headerText: 'text-blue-200',
      activeTab: 'text-blue-700 dark:text-blue-400',
      overlayText: 'text-blue-400',
      svgFill: 'fill-blue-400',
      svgBadgeBg: 'rgba(59, 130, 246, 0.25)',
    },
    headerTitle: 'Monitor Size Calculator',
    headerSubtitle: 'Calculate dimensions, resolution & PPI',
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
    colors: {
      headerGradient: 'from-emerald-600 to-emerald-700',
      headerText: 'text-emerald-200',
      activeTab: 'text-emerald-700 dark:text-emerald-400',
      overlayText: 'text-emerald-400',
      svgFill: 'fill-emerald-400',
      svgBadgeBg: 'rgba(52, 211, 153, 0.25)',
    },
    headerTitle: 'TV Size Calculator',
    headerSubtitle: 'Calculate viewing distance & screen size',
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
    colors: {
      headerGradient: 'from-indigo-600 to-indigo-700',
      headerText: 'text-indigo-200',
      activeTab: 'text-indigo-700 dark:text-indigo-400',
      overlayText: 'text-violet-400',
      svgFill: 'fill-violet-400',
      svgBadgeBg: 'rgba(139, 92, 246, 0.25)',
    },
    headerTitle: 'Projector Calculator',
    headerSubtitle: 'Calculate throw distance & screen size',
  },
  tablet: {
    label: 'Tablet',
    icon: '📱',
    defaultDiagonal: '11',
    defaultResolution: '2360 x 1640 (iPad Air)',
    referenceType: 'creditCard',
    highlightPPI: true,
    showWallWidth: false,
    shopLabel: 'Shop Tablets',
    shopKeyword: 'tablet',
    colors: {
      headerGradient: 'from-purple-600 to-purple-700',
      headerText: 'text-purple-200',
      activeTab: 'text-purple-700 dark:text-purple-400',
      overlayText: 'text-purple-400',
      svgFill: 'fill-purple-400',
      svgBadgeBg: 'rgba(168, 85, 247, 0.25)',
    },
    headerTitle: 'Tablet Size Calculator',
    headerSubtitle: 'Calculate PPI, dimensions & display specs',
  },
};

// Aspect ratio types
export interface AspectRatioOption {
  label: string;
  value: string;
  ratio: number | null;
}

// Common aspect ratios for monitors/TVs
export const ASPECT_RATIOS_DISPLAY: AspectRatioOption[] = [
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
export const ASPECT_RATIOS_PHONE: AspectRatioOption[] = [
  { label: '19.5:9 (iPhone 14/15)', value: '19.5:9', ratio: 9 / 19.5 },
  { label: '20:9 (Android Standard)', value: '20:9', ratio: 9 / 20 },
  { label: '21:9 (Sony Xperia)', value: '21:9-phone', ratio: 9 / 21 },
  { label: '19:9 (Older iPhones)', value: '19:9', ratio: 9 / 19 },
  { label: '18.5:9 (Samsung Galaxy)', value: '18.5:9', ratio: 9 / 18.5 },
  { label: '16:9 (Older Phones)', value: '16:9-phone', ratio: 9 / 16 },
  { label: 'Custom', value: 'custom', ratio: null },
];

// Common aspect ratios for tablets
export const ASPECT_RATIOS_TABLET: AspectRatioOption[] = [
  { label: '4:3 (iPad)', value: '4:3', ratio: 4 / 3 },
  { label: '16:10 (Samsung/Android)', value: '16:10', ratio: 16 / 10 },
  { label: '3:2 (Surface Pro)', value: '3:2', ratio: 3 / 2 },
  { label: '16:9 (Widescreen)', value: '16:9', ratio: 16 / 9 },
  { label: 'Custom', value: 'custom', ratio: null },
];

export const ASPECT_RATIOS_BY_MODE: Record<DeviceMode, AspectRatioOption[]> = {
  phone: ASPECT_RATIOS_PHONE,
  monitor: ASPECT_RATIOS_DISPLAY,
  tv: ASPECT_RATIOS_DISPLAY,
  projector: ASPECT_RATIOS_DISPLAY,
  tablet: ASPECT_RATIOS_TABLET,
};

// Resolution types
export interface ResolutionOption {
  label: string;
  width: number;
  height: number;
}

export const RESOLUTIONS_MONITOR: ResolutionOption[] = [
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

export const RESOLUTIONS_PHONE: ResolutionOption[] = [
  { label: '1170 x 2532 (iPhone 14)', width: 1170, height: 2532 },
  { label: '1179 x 2556 (iPhone 15 Pro)', width: 1179, height: 2556 },
  { label: '1290 x 2796 (iPhone 15 Pro Max)', width: 1290, height: 2796 },
  { label: '1080 x 2400 (Android FHD+)', width: 1080, height: 2400 },
  { label: '1440 x 3200 (Android QHD+)', width: 1440, height: 3200 },
  { label: '1080 x 2340 (Pixel 7)', width: 1080, height: 2340 },
  { label: '1440 x 3120 (Pixel 7 Pro)', width: 1440, height: 3120 },
  { label: 'Custom', width: 0, height: 0 },
];

export const RESOLUTIONS_TV: ResolutionOption[] = [
  { label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160 },
  { label: '1920 x 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '7680 x 4320 (8K)', width: 7680, height: 4320 },
  { label: '1280 x 720 (720p)', width: 1280, height: 720 },
  { label: 'Custom', width: 0, height: 0 },
];

export const RESOLUTIONS_PROJECTOR: ResolutionOption[] = [
  { label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160 },
  { label: '1920 x 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '1280 x 720 (720p)', width: 1280, height: 720 },
  { label: '1920 x 1200 (WUXGA)', width: 1920, height: 1200 },
  { label: 'Custom', width: 0, height: 0 },
];

export const RESOLUTIONS_TABLET: ResolutionOption[] = [
  { label: '2752 x 2064 (iPad Pro 13")', width: 2752, height: 2064 },
  { label: '2360 x 1640 (iPad Air)', width: 2360, height: 1640 },
  { label: '2266 x 1488 (iPad mini)', width: 2266, height: 1488 },
  { label: '2160 x 1620 (iPad 10.2")', width: 2160, height: 1620 },
  { label: '2560 x 1600 (Galaxy Tab)', width: 2560, height: 1600 },
  { label: '2880 x 1920 (Surface Pro)', width: 2880, height: 1920 },
  { label: 'Custom', width: 0, height: 0 },
];

export const RESOLUTIONS_BY_MODE: Record<DeviceMode, ResolutionOption[]> = {
  phone: RESOLUTIONS_PHONE,
  monitor: RESOLUTIONS_MONITOR,
  tv: RESOLUTIONS_TV,
  projector: RESOLUTIONS_PROJECTOR,
  tablet: RESOLUTIONS_TABLET,
};

// Reference sizes (in inches)
export const REFERENCE_SIZES = {
  creditCardDiagonal: 3.98,
  phoneDiagonal: 6.1,
  humanHeight: 67, // 5'7"
};
