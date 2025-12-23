// Device type definitions and database for programmatic SEO comparison pages

// Device data validation constraints
const DEVICE_CONSTRAINTS = {
  MIN_DIAGONAL: 0.5,    // Minimum 0.5 inches (smartwatch)
  MAX_DIAGONAL: 300,    // Maximum 300 inches (large projector screen)
  MIN_RATIO: 0.5,       // Minimum aspect ratio (2:1 portrait)
  MAX_RATIO: 5,         // Maximum aspect ratio (5:1 ultrawide)
} as const;

// Phone-specific attributes for detailed comparisons
export interface PhoneSpecs {
  // Physical attributes
  weight?: number;           // Weight in grams
  battery?: number;          // Battery capacity in mAh
  dimensions?: {             // Body dimensions in mm
    height: number;
    width: number;
    depth: number;
  };

  // Display attributes
  refreshRate?: number;      // Refresh rate in Hz (60, 90, 120, 144)
  screenType?: 'OLED' | 'AMOLED' | 'Super Retina XDR' | 'Dynamic AMOLED' | 'LTPO OLED' | 'LCD';
  peakBrightness?: number;   // Peak brightness in nits
  hdr?: boolean;             // HDR support
  alwaysOnDisplay?: boolean; // Always-on display support
}

export interface Device {
  id: string;           // Slug-friendly identifier (e.g., "iphone-15")
  name: string;         // Display name (e.g., "iPhone 15")
  category: 'phone' | 'monitor' | 'tv' | 'projector' | 'tablet';
  diagonal: number;     // Screen diagonal in inches
  ratio: number;        // Aspect ratio as decimal (e.g., 16/9 = 1.777...)
  resolution?: string;  // Optional resolution string (e.g., "2556 x 1179")
  releasedAt?: string;  // Optional release date (YYYY-MM-DD) for freshness calculation
  updatedAt?: string;   // Optional date when device data was last updated (YYYY-MM-DD)
  expertSummary?: string; // Optional field for a unique, human-written summary
  phone?: PhoneSpecs;   // Phone-specific attributes (only for phones)
  price?: number;       // Launch/Reference price in USD
}

// Validate device data to prevent calculation errors
export function validateDevice(device: Device): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!device.id || device.id.trim() === '') {
    errors.push('Device ID is required');
  }

  if (!device.name || device.name.trim() === '') {
    errors.push('Device name is required');
  }

  if (device.diagonal <= 0) {
    errors.push(`Invalid diagonal: ${device.diagonal}. Must be positive.`);
  } else if (device.diagonal < DEVICE_CONSTRAINTS.MIN_DIAGONAL) {
    errors.push(`Diagonal ${device.diagonal}" is below minimum ${DEVICE_CONSTRAINTS.MIN_DIAGONAL}"`);
  } else if (device.diagonal > DEVICE_CONSTRAINTS.MAX_DIAGONAL) {
    errors.push(`Diagonal ${device.diagonal}" exceeds maximum ${DEVICE_CONSTRAINTS.MAX_DIAGONAL}"`);
  }

  if (device.ratio <= 0) {
    errors.push(`Invalid aspect ratio: ${device.ratio}. Must be positive.`);
  } else if (device.ratio < DEVICE_CONSTRAINTS.MIN_RATIO) {
    errors.push(`Aspect ratio ${device.ratio} is below minimum ${DEVICE_CONSTRAINTS.MIN_RATIO}`);
  } else if (device.ratio > DEVICE_CONSTRAINTS.MAX_RATIO) {
    errors.push(`Aspect ratio ${device.ratio} exceeds maximum ${DEVICE_CONSTRAINTS.MAX_RATIO}`);
  }

  if (device.price !== undefined && device.price < 0) {
    errors.push(`Invalid price: ${device.price}. Must be non-negative.`);
  }

  return { valid: errors.length === 0, errors };
}

// Safe calculation wrapper with validation
function safeCalculation<T>(
  diagonal: number,
  ratio: number,
  calculation: (d: number, r: number) => T,
  fallback: T
): T {
  if (
    diagonal <= 0 ||
    diagonal > DEVICE_CONSTRAINTS.MAX_DIAGONAL ||
    ratio <= 0 ||
    ratio > DEVICE_CONSTRAINTS.MAX_RATIO ||
    !Number.isFinite(diagonal) ||
    !Number.isFinite(ratio)
  ) {
    return fallback;
  }
  try {
    const result = calculation(diagonal, ratio);
    // Check for NaN or Infinity in result
    if (typeof result === 'number' && (!Number.isFinite(result) || Number.isNaN(result))) {
      return fallback;
    }
    return result;
  } catch {
    return fallback;
  }
}

// Parse resolution string "2556 x 1179" to { w, h }
export function parseResolution(resolution?: string): { w: number; h: number } | null {
  if (!resolution) return null;
  const match = resolution.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return null;
  return { w: parseInt(match[1], 10), h: parseInt(match[2], 10) };
}

// Calculate PPI from resolution and diagonal
export function calculateDevicePPI(device: Device): number | null {
  const res = parseResolution(device.resolution);
  if (!res) return null;
  if (device.diagonal <= 0 || !Number.isFinite(device.diagonal)) return null;
  const ppi = Math.sqrt(res.w * res.w + res.h * res.h) / device.diagonal;
  return Number.isFinite(ppi) ? ppi : null;
}

// Helper to calculate physical dimensions from diagonal and aspect ratio
// Using Pythagorean theorem: diagonal² = width² + height²
// With width = height × ratio, we get:
// height = diagonal / sqrt(ratio² + 1)
// width = height × ratio
// Note: This returns the raw calculated dimensions where width is the longer side
// For display purposes on portrait devices (phones), use getDisplayDimensions()
export function calculateDimensions(diagonal: number, ratio: number): { width: number; height: number } {
  return safeCalculation(
    diagonal,
    ratio,
    (d, r) => {
      const height = d / Math.sqrt(r * r + 1);
      const width = height * r;
      return { width, height };
    },
    { width: 0, height: 0 }
  );
}

// Get semantically correct display dimensions based on device orientation
// For phones/tablets (portrait): height > width (long edge is height)
// For TVs/monitors/projectors (landscape): width > height (long edge is width)
export function getDisplayDimensions(device: Device): { width: number; height: number } {
  const dims = calculateDimensions(device.diagonal, device.ratio);

  // Portrait devices: swap so height is the longer dimension
  if (device.category === 'phone' || device.category === 'tablet') {
    return {
      width: dims.height,  // short edge becomes width
      height: dims.width,  // long edge becomes height
    };
  }

  // Landscape devices: keep as-is (width is longer)
  return dims;
}

// Calculate screen area in square inches
export function calculateArea(diagonal: number, ratio: number): number {
  return safeCalculation(
    diagonal,
    ratio,
    (d, r) => {
      const { width, height } = calculateDimensions(d, r);
      return width * height;
    },
    0
  );
}

// Calculate percentage difference between two screen areas
export function calculatePercentageDifference(deviceA: Device, deviceB: Device): number {
  const areaA = calculateArea(deviceA.diagonal, deviceA.ratio);
  const areaB = calculateArea(deviceB.diagonal, deviceB.ratio);

  if (areaB === 0) return 0;
  return ((areaA - areaB) / areaB) * 100;
}

// Device database with real-world data
export const devices: Device[] = [
  // ============================================
  // PHONES
  // ============================================

  // iPhone 17 Series (Released: September 10, 2025)
  {
    id: 'iphone-17',
    name: 'iPhone 17',
    category: 'phone',
    diagonal: 6.3,
    ratio: 19.5 / 9,
    resolution: '2622 x 1206',
    releasedAt: '2025-09-10',
    updatedAt: '2025-09-10',
    phone: {
      weight: 194,
      battery: 3850,
      dimensions: { height: 152.8, width: 72.1, depth: 7.8 },
      refreshRate: 90,
      screenType: 'OLED',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 799,
  },
  {
    id: 'iphone-17-air',
    name: 'iPhone 17 Air',
    category: 'phone',
    diagonal: 6.5,
    ratio: 19.6 / 9,
    resolution: '2736 x 1260',
    releasedAt: '2025-09-10',
    updatedAt: '2025-09-10',
    phone: {
      weight: 168,
      battery: 3200,
      dimensions: { height: 155.5, width: 71.5, depth: 5.5 },
      refreshRate: 120,
      screenType: 'OLED',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 899,
  },
  {
    id: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 19.5 / 9,
    resolution: '2622 x 1206',
    releasedAt: '2025-09-10',
    updatedAt: '2025-09-10',
    phone: {
      weight: 199,
      battery: 3900,
      dimensions: { height: 152.8, width: 72.1, depth: 8.1 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2500,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },
  {
    id: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    category: 'phone',
    diagonal: 6.9,
    ratio: 19.5 / 9,
    resolution: '2868 x 1320',
    releasedAt: '2025-09-10',
    updatedAt: '2025-09-10',
    expertSummary: 'The iPhone 17 Pro Max features a stunning 6.9-inch Super Retina XDR display, making it ideal for users seeking the ultimate visual experience and gaming performance. Its expansive screen also significantly enhances multitasking efficiency.',
    phone: {
      weight: 227,
      battery: 4685,
      dimensions: { height: 163.0, width: 77.6, depth: 8.25 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2500,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 1199,
  },

  // iPhone 16 Series (Released: September 20, 2024)
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
    releasedAt: '2024-09-20',
    updatedAt: '2024-09-20',
    expertSummary: 'The iPhone 16 offers a perfectly balanced 6.1-inch display that fits comfortably in one hand while delivering crisp visuals. An excellent choice for users who prioritize portability without sacrificing screen quality.',
    phone: {
      weight: 170,
      battery: 3561,
      dimensions: { height: 147.6, width: 71.6, depth: 7.8 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 799,
  },
  {
    id: 'iphone-16-plus',
    name: 'iPhone 16 Plus',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
    releasedAt: '2024-09-20',
    updatedAt: '2024-09-20',
    expertSummary: 'The iPhone 16 Plus delivers a spacious 6.7-inch display perfect for media consumption and extended reading sessions. Its larger battery complements the bigger screen for all-day entertainment.',
    phone: {
      weight: 199,
      battery: 4674,
      dimensions: { height: 160.9, width: 77.8, depth: 7.8 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 899,
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 19.5 / 9,
    resolution: '2622 x 1206',
    releasedAt: '2024-09-20',
    updatedAt: '2024-09-20',
    expertSummary: 'The iPhone 16 Pro strikes the perfect balance between screen size and handling with its 6.3-inch ProMotion display. The 120Hz refresh rate ensures buttery-smooth scrolling for professionals and enthusiasts alike.',
    phone: {
      weight: 199,
      battery: 3582,
      dimensions: { height: 149.6, width: 71.5, depth: 8.25 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    category: 'phone',
    diagonal: 6.9,
    ratio: 19.5 / 9,
    resolution: '2868 x 1320',
    releasedAt: '2024-09-20',
    updatedAt: '2024-09-20',
    expertSummary: 'The iPhone 16 Pro Max boasts the largest iPhone display ever at 6.9 inches, offering an immersive canvas for creative work and cinematic viewing. Its ProMotion technology and peak brightness make it a powerhouse for HDR content.',
    phone: {
      weight: 227,
      battery: 4685,
      dimensions: { height: 163.0, width: 77.6, depth: 8.25 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 1199,
  },

  // iPhone 15 Series (Released: September 22, 2023)
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
    releasedAt: '2023-09-22',
    updatedAt: '2023-09-22',
    expertSummary: 'The iPhone 15 brings the Dynamic Island to the standard lineup with a vibrant 6.1-inch Super Retina XDR display. A smart upgrade for users seeking flagship features in a compact, pocket-friendly form factor.',
    phone: {
      weight: 171,
      battery: 3349,
      dimensions: { height: 147.6, width: 71.6, depth: 7.8 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 699,
  },
  {
    id: 'iphone-15-plus',
    name: 'iPhone 15 Plus',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
    releasedAt: '2023-09-22',
    updatedAt: '2023-09-22',
    expertSummary: 'The iPhone 15 Plus combines a generous 6.7-inch display with exceptional battery life, making it the go-to choice for users who want big-screen entertainment without the Pro price tag.',
    phone: {
      weight: 201,
      battery: 4383,
      dimensions: { height: 160.9, width: 77.8, depth: 7.8 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 799,
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
    releasedAt: '2023-09-22',
    updatedAt: '2023-09-22',
    expertSummary: 'The iPhone 15 Pro features a lightweight titanium design with a 6.1-inch ProMotion display. Its compact size paired with pro-level features makes it ideal for one-handed power users.',
    phone: {
      weight: 187,
      battery: 3274,
      dimensions: { height: 146.6, width: 70.6, depth: 8.25 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 899,
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
    releasedAt: '2023-09-22',
    updatedAt: '2023-09-22',
    expertSummary: 'The iPhone 15 Pro Max delivers the ultimate big-screen iPhone experience with its 6.7-inch ProMotion display and titanium construction. Perfect for photographers and videographers who demand the best optical zoom and screen real estate.',
    phone: {
      weight: 221,
      battery: 4422,
      dimensions: { height: 159.9, width: 76.7, depth: 8.25 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },

  // iPhone 14 Series (Released: September 16, 2022)
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2532 x 1170',
    releasedAt: '2022-09-16',
    updatedAt: '2022-09-16',
    expertSummary: 'The iPhone 14 offers a reliable 6.1-inch Super Retina XDR display with improved durability and crash detection. A solid choice for users who want a dependable everyday smartphone with excellent screen quality.',
    phone: {
      weight: 172,
      battery: 3279,
      dimensions: { height: 146.7, width: 71.5, depth: 7.8 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 1200,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 699,
  },
  {
    id: 'iphone-14-plus',
    name: 'iPhone 14 Plus',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2778 x 1284',
    releasedAt: '2022-09-16',
    updatedAt: '2022-09-16',
    expertSummary: 'The iPhone 14 Plus introduced the large 6.7-inch display to the non-Pro lineup, offering outstanding battery life and immersive viewing. Ideal for users who want maximum screen size at a more accessible price point.',
    phone: {
      weight: 203,
      battery: 4325,
      dimensions: { height: 160.8, width: 78.1, depth: 7.8 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 1200,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 799,
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
    releasedAt: '2022-09-16',
    updatedAt: '2022-09-16',
    expertSummary: 'The iPhone 14 Pro debuted the innovative Dynamic Island and Always-On Display on a 6.1-inch ProMotion screen. A game-changer for users who want cutting-edge features in a manageable form factor.',
    phone: {
      weight: 206,
      battery: 3200,
      dimensions: { height: 147.5, width: 71.5, depth: 7.85 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 899,
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
    releasedAt: '2022-09-16',
    updatedAt: '2022-09-16',
    expertSummary: 'The iPhone 14 Pro Max combines a stunning 6.7-inch ProMotion display with the Dynamic Island and exceptional battery life. The ultimate choice for power users who demand the largest screen with all pro features.',
    phone: {
      weight: 240,
      battery: 4323,
      dimensions: { height: 160.7, width: 77.6, depth: 7.85 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },

  // iPhone 13 Series (Released: September 24, 2021)
  {
    id: 'iphone-13',
    name: 'iPhone 13',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2532 x 1170',
    releasedAt: '2021-09-24',
    updatedAt: '2021-09-24',
    phone: {
      weight: 174,
      battery: 3227,
      dimensions: { height: 146.7, width: 71.5, depth: 7.65 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 1200,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 599,
  },
  {
    id: 'iphone-13-mini',
    name: 'iPhone 13 Mini',
    category: 'phone',
    diagonal: 5.4,
    ratio: 19.5 / 9,
    resolution: '2340 x 1080',
    releasedAt: '2021-09-24',
    updatedAt: '2021-09-24',
    phone: {
      weight: 140,
      battery: 2406,
      dimensions: { height: 131.5, width: 64.2, depth: 7.65 },
      refreshRate: 60,
      screenType: 'Super Retina XDR',
      peakBrightness: 1200,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 499,
  },
  {
    id: 'iphone-13-pro',
    name: 'iPhone 13 Pro',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2532 x 1170',
    releasedAt: '2021-09-24',
    updatedAt: '2021-09-24',
    expertSummary: 'The iPhone 13 Pro introduced ProMotion 120Hz display technology to the 6.1-inch form factor, revolutionizing scrolling smoothness. A landmark device that brought adaptive refresh rate to iPhone for the first time.',
    phone: {
      weight: 204,
      battery: 3095,
      dimensions: { height: 146.7, width: 71.5, depth: 7.65 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 1200,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 899,
  },
  {
    id: 'iphone-13-pro-max',
    name: 'iPhone 13 Pro Max',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2778 x 1284',
    releasedAt: '2021-09-24',
    updatedAt: '2021-09-24',
    expertSummary: 'The iPhone 13 Pro Max pairs a massive 6.7-inch ProMotion display with record-breaking battery life. Its combination of screen size, 120Hz smoothness, and all-day endurance made it a favorite among content creators.',
    phone: {
      weight: 238,
      battery: 4352,
      dimensions: { height: 160.8, width: 78.1, depth: 7.65 },
      refreshRate: 120,
      screenType: 'Super Retina XDR',
      peakBrightness: 1200,
      hdr: true,
      alwaysOnDisplay: false,
    },
    price: 999,
  },

  // Samsung Galaxy S25 Series (Released: February 7, 2025)
  {
    id: 'samsung-galaxy-s25-ultra',
    name: 'Samsung Galaxy S25 Ultra',
    category: 'phone',
    diagonal: 6.8,
    ratio: 19.5 / 9,
    resolution: '3120 x 1440',
    releasedAt: '2025-02-07',
    updatedAt: '2025-02-07',
    expertSummary: 'The Samsung Galaxy S25 Ultra delivers an unparalleled visual experience for content creators and power users with its premium Dynamic AMOLED display and ultra-high resolution. The integrated S Pen further enhances productivity.',
    phone: {
      weight: 218,
      battery: 5000,
      dimensions: { height: 162.8, width: 77.6, depth: 8.2 },
      refreshRate: 120,
      screenType: 'Dynamic AMOLED',
      peakBrightness: 2600,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 1299,
  },
  {
    id: 'samsung-galaxy-s25-plus',
    name: 'Samsung Galaxy S25+',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '3120 x 1440',
    releasedAt: '2025-02-07',
    updatedAt: '2025-02-07',
    expertSummary: 'The Samsung Galaxy S25+ offers a sweet spot between size and performance with its 6.7-inch QHD+ Dynamic AMOLED display. Perfect for users who want flagship features without the Ultra bulk.',
    phone: {
      weight: 190,
      battery: 4900,
      dimensions: { height: 158.4, width: 75.8, depth: 7.3 },
      refreshRate: 120,
      screenType: 'Dynamic AMOLED',
      peakBrightness: 2600,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },
  {
    id: 'samsung-galaxy-s25',
    name: 'Samsung Galaxy S25',
    category: 'phone',
    diagonal: 6.2,
    ratio: 19.5 / 9,
    resolution: '2340 x 1080',
    releasedAt: '2025-02-07',
    updatedAt: '2025-02-07',
    expertSummary: 'The Samsung Galaxy S25 packs flagship performance into a compact 6.2-inch form factor with a stunning Dynamic AMOLED display. Ideal for one-handed use without compromising on Samsung\'s premium experience.',
    phone: {
      weight: 162,
      battery: 4000,
      dimensions: { height: 146.9, width: 70.5, depth: 7.2 },
      refreshRate: 120,
      screenType: 'Dynamic AMOLED',
      peakBrightness: 2600,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 799,
  },

  // Samsung Galaxy S24 Series (Released: January 31, 2024)
  {
    id: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'phone',
    diagonal: 6.8,
    ratio: 19.3 / 9,
    resolution: '3120 x 1440',
    releasedAt: '2024-01-31',
    updatedAt: '2024-01-31',
    expertSummary: 'The Samsung Galaxy S24 Ultra features a brilliant 6.8-inch QHD+ display with Galaxy AI integration. Its titanium frame and built-in S Pen make it the ultimate productivity powerhouse for demanding users.',
    phone: {
      weight: 232,
      battery: 5000,
      dimensions: { height: 162.3, width: 79.0, depth: 8.6 },
      refreshRate: 120,
      screenType: 'Dynamic AMOLED',
      peakBrightness: 2600,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 1299,
  },
  {
    id: 'samsung-galaxy-s24-plus',
    name: 'Samsung Galaxy S24+',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '3120 x 1440',
    releasedAt: '2024-01-31',
    updatedAt: '2024-01-31',
    expertSummary: 'The Samsung Galaxy S24+ delivers a gorgeous 6.7-inch QHD+ display with excellent outdoor visibility. A balanced choice for users seeking a large screen with flagship performance and AI features.',
    phone: {
      weight: 196,
      battery: 4900,
      dimensions: { height: 158.5, width: 75.9, depth: 7.7 },
      refreshRate: 120,
      screenType: 'Dynamic AMOLED',
      peakBrightness: 2600,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },
  {
    id: 'samsung-galaxy-s24',
    name: 'Samsung Galaxy S24',
    category: 'phone',
    diagonal: 6.2,
    ratio: 19.5 / 9,
    resolution: '2340 x 1080',
    releasedAt: '2024-01-31',
    updatedAt: '2024-01-31',
    expertSummary: 'The Samsung Galaxy S24 brings Galaxy AI to a pocket-friendly 6.2-inch display with vibrant colors and smooth 120Hz refresh. The most accessible way to experience Samsung\'s latest innovations.',
    phone: {
      weight: 167,
      battery: 4000,
      dimensions: { height: 147.0, width: 70.6, depth: 7.6 },
      refreshRate: 120,
      screenType: 'Dynamic AMOLED',
      peakBrightness: 2600,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 799,
  },

  // Google Pixel 10 Series (Released: August 20, 2025)
  {
    id: 'google-pixel-10',
    name: 'Google Pixel 10',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '1080 x 2424',
    releasedAt: '2025-08-20',
    updatedAt: '2025-08-20',
    phone: {
      weight: 185,
      battery: 4500,
      dimensions: { height: 152.8, width: 72.0, depth: 8.5 },
      refreshRate: 120,
      screenType: 'LTPO OLED',
      peakBrightness: 2400,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 799,
  },
  {
    id: 'google-pixel-10-pro',
    name: 'Google Pixel 10 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '1280 x 2856',
    releasedAt: '2025-08-20',
    updatedAt: '2025-08-20',
    phone: {
      weight: 199,
      battery: 4700,
      dimensions: { height: 152.8, width: 72.0, depth: 8.5 },
      refreshRate: 120,
      screenType: 'LTPO OLED',
      peakBrightness: 2800,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },
  {
    id: 'google-pixel-10-pro-xl',
    name: 'Google Pixel 10 Pro XL',
    category: 'phone',
    diagonal: 6.8,
    ratio: 20 / 9,
    resolution: '1344 x 2992',
    releasedAt: '2025-08-20',
    updatedAt: '2025-08-20',
    phone: {
      weight: 221,
      battery: 5200,
      dimensions: { height: 162.8, width: 76.6, depth: 8.8 },
      refreshRate: 120,
      screenType: 'LTPO OLED',
      peakBrightness: 2800,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 1099,
  },

  // Google Pixel 9 Series (Released: August 22, 2024)
  {
    id: 'google-pixel-9',
    name: 'Google Pixel 9',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '2400 x 1080',
    releasedAt: '2024-08-22',
    updatedAt: '2024-08-22',
    phone: {
      weight: 198,
      battery: 4700,
      dimensions: { height: 152.8, width: 72.0, depth: 8.5 },
      refreshRate: 120,
      screenType: 'LTPO OLED',
      peakBrightness: 2700,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 799,
  },
  {
    id: 'google-pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '1280 x 2856',
    releasedAt: '2024-08-22',
    updatedAt: '2024-08-22',
    phone: {
      weight: 199,
      battery: 4700,
      dimensions: { height: 152.8, width: 72.0, depth: 8.5 },
      refreshRate: 120,
      screenType: 'LTPO OLED',
      peakBrightness: 2761,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
  },
  {
    id: 'google-pixel-9-pro-xl',
    name: 'Google Pixel 9 Pro XL',
    category: 'phone',
    diagonal: 6.8,
    ratio: 20 / 9,
    resolution: '1344 x 2992',
    releasedAt: '2024-08-22',
    updatedAt: '2024-08-22',
    phone: {
      weight: 221,
      battery: 5060,
      dimensions: { height: 162.8, width: 76.6, depth: 8.5 },
      refreshRate: 120,
      screenType: 'LTPO OLED',
      peakBrightness: 2761,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 1099,
  },

  // ============================================
  // MONITORS
  // ============================================
  {
    id: '24-inch-monitor',
    name: '24" Monitor',
    category: 'monitor',
    diagonal: 24,
    ratio: 16 / 9,
    resolution: '1920 x 1080',
  },
  {
    id: '27-inch-monitor',
    name: '27" Monitor',
    category: 'monitor',
    diagonal: 27,
    ratio: 16 / 9,
    resolution: '2560 x 1440',
  },
  {
    id: '32-inch-monitor',
    name: '32" Monitor',
    category: 'monitor',
    diagonal: 32,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '34-inch-ultrawide-monitor',
    name: '34" Ultrawide Monitor',
    category: 'monitor',
    diagonal: 34,
    ratio: 21 / 9,
    resolution: '3440 x 1440',
  },
  {
    id: '38-inch-ultrawide-monitor',
    name: '38" Ultrawide Monitor',
    category: 'monitor',
    diagonal: 38,
    ratio: 21 / 9,
    resolution: '3840 x 1600',
  },
  {
    id: '49-inch-super-ultrawide-monitor',
    name: '49" Super Ultrawide Monitor',
    category: 'monitor',
    diagonal: 49,
    ratio: 32 / 9,
    resolution: '5120 x 1440',
  },

  // ============================================
  // TVs
  // ============================================
  {
    id: '43-inch-tv',
    name: '43" TV',
    category: 'tv',
    diagonal: 43,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '50-inch-tv',
    name: '50" TV',
    category: 'tv',
    diagonal: 50,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '55-inch-tv',
    name: '55" TV',
    category: 'tv',
    diagonal: 55,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '65-inch-tv',
    name: '65" TV',
    category: 'tv',
    diagonal: 65,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '70-inch-tv',
    name: '70" TV',
    category: 'tv',
    diagonal: 70,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '75-inch-tv',
    name: '75" TV',
    category: 'tv',
    diagonal: 75,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '77-inch-tv',
    name: '77" TV',
    category: 'tv',
    diagonal: 77,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '85-inch-tv',
    name: '85" TV',
    category: 'tv',
    diagonal: 85,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '98-inch-tv',
    name: '98" TV',
    category: 'tv',
    diagonal: 98,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },

  // ============================================
  // PROJECTORS (Screen sizes)
  // ============================================
  {
    id: '100-inch-projector-screen',
    name: '100" Projector Screen',
    category: 'projector',
    diagonal: 100,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '120-inch-projector-screen',
    name: '120" Projector Screen',
    category: 'projector',
    diagonal: 120,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },
  {
    id: '150-inch-projector-screen',
    name: '150" Projector Screen',
    category: 'projector',
    diagonal: 150,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
  },

  // ============================================
  // TABLETS
  // ============================================

  // iPad Pro Series (Released: May 15, 2024)
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13"',
    category: 'tablet',
    diagonal: 13,
    ratio: 4 / 3,
    resolution: '2752 x 2064',
    releasedAt: '2024-05-15',
    updatedAt: '2024-05-15',
    price: 1299,
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    category: 'tablet',
    diagonal: 11,
    ratio: 4 / 3,
    resolution: '2420 x 1668',
    releasedAt: '2024-05-15',
    updatedAt: '2024-05-15',
    price: 999,
  },

  // iPad Air (Released: May 15, 2024)
  {
    id: 'ipad-air-13',
    name: 'iPad Air 13"',
    category: 'tablet',
    diagonal: 13,
    ratio: 4 / 3,
    resolution: '2732 x 2048',
    releasedAt: '2024-05-15',
    updatedAt: '2024-05-15',
    price: 799,
  },
  {
    id: 'ipad-air-11',
    name: 'iPad Air 11"',
    category: 'tablet',
    diagonal: 11,
    ratio: 4 / 3,
    resolution: '2360 x 1640',
    releasedAt: '2024-05-15',
    updatedAt: '2024-05-15',
    price: 599,
  },

  // iPad (10th gen released: October 26, 2022)
  {
    id: 'ipad-10',
    name: 'iPad 10.9"',
    category: 'tablet',
    diagonal: 10.9,
    ratio: 4 / 3,
    resolution: '2360 x 1640',
    releasedAt: '2022-10-26',
    updatedAt: '2022-10-26',
    price: 349,
  },
  {
    id: 'ipad-9',
    name: 'iPad 10.2"',
    category: 'tablet',
    diagonal: 10.2,
    ratio: 4 / 3,
    resolution: '2160 x 1620',
    releasedAt: '2021-09-24',
    updatedAt: '2021-09-24',
    price: 329,
  },

  // iPad mini (7th gen released: October 23, 2024)
  {
    id: 'ipad-mini-7',
    name: 'iPad mini 8.3"',
    category: 'tablet',
    diagonal: 8.3,
    ratio: 4 / 3,
    resolution: '2266 x 1488',
    releasedAt: '2024-10-23',
    updatedAt: '2024-10-23',
    price: 499,
  },

  // Samsung Galaxy Tab S11 Series (Released: September 4, 2025)
  {
    id: 'samsung-galaxy-tab-s11-ultra',
    name: 'Samsung Galaxy Tab S11 Ultra',
    category: 'tablet',
    diagonal: 14.6,
    ratio: 16 / 10,
    resolution: '2960 x 1848',
    releasedAt: '2025-09-04',
    updatedAt: '2025-09-04',
    price: 1199,
  },
  {
    id: 'samsung-galaxy-tab-s11-plus',
    name: 'Samsung Galaxy Tab S11+',
    category: 'tablet',
    diagonal: 12.4,
    ratio: 16 / 10,
    resolution: '2800 x 1752',
    releasedAt: '2025-09-04',
    updatedAt: '2025-09-04',
    price: 999,
  },
  {
    id: 'samsung-galaxy-tab-s11',
    name: 'Samsung Galaxy Tab S11',
    category: 'tablet',
    diagonal: 11,
    ratio: 16 / 10,
    resolution: '2560 x 1600',
    releasedAt: '2025-09-04',
    updatedAt: '2025-09-04',
    price: 799,
  },

  // Samsung Galaxy Tab S10 Series (Released: September 26, 2024)
  {
    id: 'samsung-galaxy-tab-s10-ultra',
    name: 'Samsung Galaxy Tab S10 Ultra',
    category: 'tablet',
    diagonal: 14.6,
    ratio: 16 / 10,
    resolution: '2960 x 1848',
    releasedAt: '2024-09-26',
    updatedAt: '2024-09-26',
    price: 1199,
  },
  {
    id: 'samsung-galaxy-tab-s10-plus',
    name: 'Samsung Galaxy Tab S10+',
    category: 'tablet',
    diagonal: 12.4,
    ratio: 16 / 10,
    resolution: '2800 x 1752',
    releasedAt: '2024-09-26',
    updatedAt: '2024-09-26',
    price: 999,
  },
  {
    id: 'samsung-galaxy-tab-s10-fe-plus',
    name: 'Samsung Galaxy Tab S10 FE+',
    category: 'tablet',
    diagonal: 13.1,
    ratio: 16 / 10,
    resolution: '2880 x 1800',
    releasedAt: '2024-09-26',
    updatedAt: '2024-09-26',
    price: 599,
  },
  {
    id: 'samsung-galaxy-tab-s10-fe',
    name: 'Samsung Galaxy Tab S10 FE',
    category: 'tablet',
    diagonal: 10.9,
    ratio: 16 / 10,
    resolution: '2880 x 1800',
    releasedAt: '2024-09-26',
    updatedAt: '2024-09-26',
    price: 449,
  },

  // Microsoft Surface (Released: June 18, 2024)
  {
    id: 'surface-pro-11',
    name: 'Surface Pro 13"',
    category: 'tablet',
    diagonal: 13,
    ratio: 3 / 2,
    resolution: '2880 x 1920',
    releasedAt: '2024-06-18',
    updatedAt: '2024-06-18',
    price: 999,
  },
];

// Build-time validation: validate all devices when module loads
// This catches data errors early during development and build
const validationErrors: string[] = [];
for (const device of devices) {
  const result = validateDevice(device);
  if (!result.valid) {
    validationErrors.push(`Device "${device.id}": ${result.errors.join(', ')}`);
  }
}

if (validationErrors.length > 0) {
  console.error('Device validation errors found:');
  validationErrors.forEach(err => console.error(`  - ${err}`));
  // In production build, throw to fail the build
  if (import.meta.env.PROD) {
    throw new Error(`Device validation failed: ${validationErrors.length} error(s) found`);
  }
}

// Helper function to get device by ID
export function getDeviceById(id: string): Device | undefined {
  return devices.find(device => device.id === id);
}

// Helper function to get devices by category
export function getDevicesByCategory(category: Device['category']): Device[] {
  return devices.filter(device => device.category === category);
}

// Check if two categories are allowed to be compared
export function isValidComparison(categoryA: Device['category'], categoryB: Device['category']): boolean {
  // Same category is always allowed
  if (categoryA === categoryB) return true;

  // TV vs Projector is allowed (cross-category exception)
  const tvProjectorPair =
    (categoryA === 'tv' && categoryB === 'projector') ||
    (categoryA === 'projector' && categoryB === 'tv');

  if (tvProjectorPair) return true;

  // All other cross-category comparisons are blocked
  return false;
}

// Get latest iPhone (first iPhone in the list with resolution)
export function getLatestIphone(): Device | undefined {
  return devices.find(d => d.category === 'phone' && d.id.includes('iphone') && d.resolution);
}

// Get latest Samsung (first Samsung in the list with resolution)
export function getLatestSamsung(): Device | undefined {
  return devices.find(d => d.category === 'phone' && d.id.includes('samsung') && d.resolution);
}

// Get latest iPhone with PPI info
export function getLatestIphoneWithPPI(): { device: Device; ppi: number } | null {
  const device = getLatestIphone();
  if (!device) return null;
  const ppi = calculateDevicePPI(device);
  if (!ppi) return null;
  return { device, ppi: Math.round(ppi) };
}

// Get latest Samsung with PPI info
export function getLatestSamsungWithPPI(): { device: Device; ppi: number } | null {
  const device = getLatestSamsung();
  if (!device) return null;
  const ppi = calculateDevicePPI(device);
  if (!ppi) return null;
  return { device, ppi: Math.round(ppi) };
}
