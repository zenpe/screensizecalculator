// Device type definitions and database for programmatic SEO comparison pages

export interface Device {
  id: string;           // Slug-friendly identifier (e.g., "iphone-15")
  name: string;         // Display name (e.g., "iPhone 15")
  category: 'phone' | 'monitor' | 'tv' | 'projector' | 'tablet';
  diagonal: number;     // Screen diagonal in inches
  ratio: number;        // Aspect ratio as decimal (e.g., 16/9 = 1.777...)
  resolution?: string;  // Optional resolution string (e.g., "2556 x 1179")
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

  // iPhone 17 Series
  {
    id: 'iphone-17',
    name: 'iPhone 17',
    category: 'phone',
    diagonal: 6.3,
    ratio: 19.5 / 9,
    resolution: '2622 x 1206',
  },
  {
    id: 'iphone-17-air',
    name: 'iPhone 17 Air',
    category: 'phone',
    diagonal: 6.5,
    ratio: 19.6 / 9,
    resolution: '2736 x 1260',
  },
  {
    id: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 19.5 / 9,
    resolution: '2622 x 1206',
  },
  {
    id: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    category: 'phone',
    diagonal: 6.9,
    ratio: 19.5 / 9,
    resolution: '2868 x 1320',
  },

  // iPhone 16 Series
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
  },
  {
    id: 'iphone-16-plus',
    name: 'iPhone 16 Plus',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 19.5 / 9,
    resolution: '2622 x 1206',
  },
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    category: 'phone',
    diagonal: 6.9,
    ratio: 19.5 / 9,
    resolution: '2868 x 1320',
  },

  // iPhone 15 Series
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
  },
  {
    id: 'iphone-15-plus',
    name: 'iPhone 15 Plus',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
  },

  // iPhone 14 Series
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2532 x 1170',
  },
  {
    id: 'iphone-14-plus',
    name: 'iPhone 14 Plus',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2778 x 1284',
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2796 x 1290',
  },

  // iPhone 13 Series
  {
    id: 'iphone-13',
    name: 'iPhone 13',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2532 x 1170',
  },
  {
    id: 'iphone-13-mini',
    name: 'iPhone 13 Mini',
    category: 'phone',
    diagonal: 5.4,
    ratio: 19.5 / 9,
    resolution: '2340 x 1080',
  },
  {
    id: 'iphone-13-pro',
    name: 'iPhone 13 Pro',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2532 x 1170',
  },
  {
    id: 'iphone-13-pro-max',
    name: 'iPhone 13 Pro Max',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '2778 x 1284',
  },

  // Samsung Galaxy S25 Series
  {
    id: 'samsung-galaxy-s25-ultra',
    name: 'Samsung Galaxy S25 Ultra',
    category: 'phone',
    diagonal: 6.8,
    ratio: 19.5 / 9,
    resolution: '3120 x 1440',
  },
  {
    id: 'samsung-galaxy-s25-plus',
    name: 'Samsung Galaxy S25+',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '3120 x 1440',
  },
  {
    id: 'samsung-galaxy-s25',
    name: 'Samsung Galaxy S25',
    category: 'phone',
    diagonal: 6.2,
    ratio: 19.5 / 9,
    resolution: '2340 x 1080',
  },

  // Samsung Galaxy S24 Series
  {
    id: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'phone',
    diagonal: 6.8,
    ratio: 19.3 / 9,
    resolution: '3120 x 1440',
  },
  {
    id: 'samsung-galaxy-s24-plus',
    name: 'Samsung Galaxy S24+',
    category: 'phone',
    diagonal: 6.7,
    ratio: 19.5 / 9,
    resolution: '3120 x 1440',
  },
  {
    id: 'samsung-galaxy-s24',
    name: 'Samsung Galaxy S24',
    category: 'phone',
    diagonal: 6.2,
    ratio: 19.5 / 9,
    resolution: '2340 x 1080',
  },

  // Google Pixel 10 Series
  {
    id: 'google-pixel-10',
    name: 'Google Pixel 10',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '1080 x 2424',
  },
  {
    id: 'google-pixel-10-pro',
    name: 'Google Pixel 10 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '1280 x 2856',
  },
  {
    id: 'google-pixel-10-pro-xl',
    name: 'Google Pixel 10 Pro XL',
    category: 'phone',
    diagonal: 6.8,
    ratio: 20 / 9,
    resolution: '1344 x 2992',
  },

  // Google Pixel 9 Series
  {
    id: 'google-pixel-9',
    name: 'Google Pixel 9',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '2400 x 1080',
  },
  {
    id: 'google-pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    category: 'phone',
    diagonal: 6.3,
    ratio: 20 / 9,
    resolution: '1280 x 2856',
  },
  {
    id: 'google-pixel-9-pro-xl',
    name: 'Google Pixel 9 Pro XL',
    category: 'phone',
    diagonal: 6.8,
    ratio: 20 / 9,
    resolution: '1344 x 2992',
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
    id: '75-inch-tv',
    name: '75" TV',
    category: 'tv',
    diagonal: 75,
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

  // iPad Pro Series
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13"',
    category: 'tablet',
    diagonal: 13,
    ratio: 4 / 3,
    resolution: '2752 x 2064',
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    category: 'tablet',
    diagonal: 11,
    ratio: 4 / 3,
    resolution: '2420 x 1668',
  },

  // iPad Air
  {
    id: 'ipad-air-13',
    name: 'iPad Air 13"',
    category: 'tablet',
    diagonal: 13,
    ratio: 4 / 3,
    resolution: '2732 x 2048',
  },
  {
    id: 'ipad-air-11',
    name: 'iPad Air 11"',
    category: 'tablet',
    diagonal: 11,
    ratio: 4 / 3,
    resolution: '2360 x 1640',
  },

  // iPad
  {
    id: 'ipad-10',
    name: 'iPad 10.9"',
    category: 'tablet',
    diagonal: 10.9,
    ratio: 4 / 3,
    resolution: '2360 x 1640',
  },
  {
    id: 'ipad-9',
    name: 'iPad 10.2"',
    category: 'tablet',
    diagonal: 10.2,
    ratio: 4 / 3,
    resolution: '2160 x 1620',
  },

  // iPad mini
  {
    id: 'ipad-mini-7',
    name: 'iPad mini 8.3"',
    category: 'tablet',
    diagonal: 8.3,
    ratio: 4 / 3,
    resolution: '2266 x 1488',
  },

  // Samsung Galaxy Tab S11 Series
  {
    id: 'samsung-galaxy-tab-s11-ultra',
    name: 'Samsung Galaxy Tab S11 Ultra',
    category: 'tablet',
    diagonal: 14.6,
    ratio: 16 / 10,
    resolution: '2960 x 1848',
  },
  {
    id: 'samsung-galaxy-tab-s11-plus',
    name: 'Samsung Galaxy Tab S11+',
    category: 'tablet',
    diagonal: 12.4,
    ratio: 16 / 10,
    resolution: '2800 x 1752',
  },
  {
    id: 'samsung-galaxy-tab-s11',
    name: 'Samsung Galaxy Tab S11',
    category: 'tablet',
    diagonal: 11,
    ratio: 16 / 10,
    resolution: '2560 x 1600',
  },

  // Samsung Galaxy Tab S10 Series
  {
    id: 'samsung-galaxy-tab-s10-ultra',
    name: 'Samsung Galaxy Tab S10 Ultra',
    category: 'tablet',
    diagonal: 14.6,
    ratio: 16 / 10,
    resolution: '2960 x 1848',
  },
  {
    id: 'samsung-galaxy-tab-s10-plus',
    name: 'Samsung Galaxy Tab S10+',
    category: 'tablet',
    diagonal: 12.4,
    ratio: 16 / 10,
    resolution: '2800 x 1752',
  },
  {
    id: 'samsung-galaxy-tab-s10-fe-plus',
    name: 'Samsung Galaxy Tab S10 FE+',
    category: 'tablet',
    diagonal: 13.1,
    ratio: 16 / 10,
    resolution: '2880 x 1800',
  },
  {
    id: 'samsung-galaxy-tab-s10-fe',
    name: 'Samsung Galaxy Tab S10 FE',
    category: 'tablet',
    diagonal: 10.9,
    ratio: 16 / 10,
    resolution: '2880 x 1800',
  },

  // Microsoft Surface
  {
    id: 'surface-pro-11',
    name: 'Surface Pro 13"',
    category: 'tablet',
    diagonal: 13,
    ratio: 3 / 2,
    resolution: '2880 x 1920',
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
