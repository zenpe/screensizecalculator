// Device type definitions and database for programmatic SEO comparison pages

export interface Device {
  id: string;           // Slug-friendly identifier (e.g., "iphone-15")
  name: string;         // Display name (e.g., "iPhone 15")
  category: 'phone' | 'monitor' | 'tv' | 'projector';
  diagonal: number;     // Screen diagonal in inches
  ratio: number;        // Aspect ratio as decimal (e.g., 16/9 = 1.777...)
  resolution?: string;  // Optional resolution string (e.g., "2556 x 1179")
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
