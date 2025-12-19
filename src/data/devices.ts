// Device type definitions and database for programmatic SEO comparison pages

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
  updatedAt?: string;   // Optional date when device data was last updated (YYYY-MM-DD)
  phone?: PhoneSpecs;   // Phone-specific attributes (only for phones)
  price?: number;       // Launch/Reference price in USD
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
  return Math.sqrt(res.w * res.w + res.h * res.h) / device.diagonal;
}

// Helper to calculate physical dimensions from diagonal and aspect ratio
// Using Pythagorean theorem: diagonal² = width² + height²
// With width = height × ratio, we get:
// height = diagonal / sqrt(ratio² + 1)
// width = height × ratio
export function calculateDimensions(diagonal: number, ratio: number): { width: number; height: number } {
  const height = diagonal / Math.sqrt(ratio * ratio + 1);
  const width = height * ratio;
  return { width, height };
}

// Calculate screen area in square inches
export function calculateArea(diagonal: number, ratio: number): number {
  const { width, height } = calculateDimensions(diagonal, ratio);
  return width * height;
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
    updatedAt: '2025-09-10',
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
    updatedAt: '2024-09-20',
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
    updatedAt: '2024-09-20',
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
    updatedAt: '2024-09-20',
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
    updatedAt: '2024-09-20',
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
    updatedAt: '2023-09-22',
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
    updatedAt: '2023-09-22',
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
    updatedAt: '2023-09-22',
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
    updatedAt: '2023-09-22',
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
    updatedAt: '2022-09-16',
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
    updatedAt: '2022-09-16',
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
    updatedAt: '2022-09-16',
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
    updatedAt: '2022-09-16',
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
    updatedAt: '2021-09-24',
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
    updatedAt: '2021-09-24',
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
    updatedAt: '2025-02-07',
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
    updatedAt: '2025-02-07',
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
    updatedAt: '2025-02-07',
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
    updatedAt: '2024-01-31',
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
    updatedAt: '2024-01-31',
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
    updatedAt: '2024-01-31',
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
    updatedAt: '2024-06-18',
    price: 999,
  },
];

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
