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
    expertSummary: 'Apple finally brings 90Hz to the base iPhone after years of user complaints about 60Hz. The 0.2-inch screen increase over iPhone 16 is subtle, but the smoother scrolling is immediately noticeable. Worth upgrading from iPhone 13 or older; iPhone 15/16 users should weigh whether 90Hz alone justifies the cost.',
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
    expertSummary: 'At just 5.5mm thick, the iPhone 17 Air is Apple\'s thinnest phone ever—but that comes with trade-offs. The 3200mAh battery is smaller than the standard iPhone 17, so heavy users may need to charge by evening. Best suited for those who prioritize aesthetics and pocket comfort over all-day battery life.',
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
    expertSummary: 'The iPhone 17 Pro maintains the 6.3-inch sweet spot that debuted with iPhone 16 Pro. If you\'re choosing between this and the Pro Max, consider: the Pro fits in more pockets and is easier to use one-handed, while the Pro Max offers better battery life and a larger canvas for video editing.',
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
    expertSummary: 'The 6.9-inch display is genuinely massive—great for split-screen multitasking and watching movies, but challenging for one-handed use. The 227g weight is noticeable in a shirt pocket. Ideal for users who treat their phone as a primary content consumption device; less practical for those who text while walking.',
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
    expertSummary: 'The iPhone 16 maintains the 6.1-inch size that Apple has used since iPhone 12. At this diagonal, the phone fits most hands comfortably while still offering enough screen for reading and video. The 60Hz display is the main limitation—noticeable if you\'ve used 120Hz phones, less so if you haven\'t.',
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
    expertSummary: 'The 6.7-inch Plus model exists for users who want a big screen without paying Pro prices. The 4674mAh battery is larger than the Pro Max, which partially compensates for the less efficient 60Hz display. Two-handed use is required for most tasks; consider the Pro if you also want 120Hz.',
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
    expertSummary: 'The iPhone 16 Pro grew from 6.1 to 6.3 inches compared to the 15 Pro—a subtle but noticeable increase. The 120Hz ProMotion display makes a real difference in daily use, especially when scrolling. At 199g, it\'s heavier than the base model but lighter than the Pro Max.',
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
    expertSummary: 'At 6.9 inches, the 16 Pro Max is Apple\'s largest phone to date. The screen grew 0.2 inches from the 15 Pro Max, pushing the body dimensions to 163mm tall. The 227g weight is noticeable—this is not a phone for small hands or tight pockets. Battery life is the best in the iPhone lineup.',
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
    expertSummary: 'The iPhone 15 brought Dynamic Island to the non-Pro lineup and switched to USB-C. The 6.1-inch screen is identical in size to the 14, but the new contoured edges make it feel slightly thinner in hand. Still stuck at 60Hz, which is increasingly noticeable as competitors move to higher refresh rates.',
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
    expertSummary: 'The 15 Plus offers the largest battery in the iPhone 15 lineup at 4383mAh. The 6.7-inch screen matches the Pro Max in size but not in refresh rate—still 60Hz. A reasonable choice if screen size and battery matter more than ProMotion, but the price gap to the 16 Plus is often small.',
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
    expertSummary: 'The 15 Pro introduced titanium to the iPhone lineup, dropping weight to 187g from the 14 Pro\'s 206g. The 6.1-inch size remained unchanged, but the lighter build makes a noticeable difference during extended use. The Action Button replaced the mute switch for the first time.',
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
    expertSummary: 'The 15 Pro Max was the only iPhone 15 with the 5x telephoto lens—Apple reserved it as a Max exclusive. The 6.7-inch display and titanium frame weigh 221g, lighter than the 14 Pro Max. If you need the longest zoom and largest screen, this was the only option until the 16 Pro Max.',
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
    expertSummary: 'The iPhone 14 was essentially an iPhone 13 with satellite SOS and crash detection. The 6.1-inch display and A15 chip were unchanged. At this point, it\'s hard to recommend over newer models unless heavily discounted. The notch design looks dated compared to Dynamic Island on newer iPhones.',
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
    expertSummary: 'The 14 Plus was Apple\'s first attempt at a large non-Pro iPhone since the iPhone 8 Plus. The 6.7-inch screen and 4325mAh battery delivered strong battery life, but sales were disappointing—many buyers preferred the Pro Max at a similar price. The Plus line continued, but this model is now dated.',
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
    expertSummary: 'The 14 Pro introduced Dynamic Island and Always-On Display to iPhone. The 6.1-inch screen kept the same size as the 13 Pro, but the new pill-shaped cutout changed how notifications work. At 206g, it was heavier than the titanium 15 Pro that followed.',
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
    expertSummary: 'The 14 Pro Max was the heaviest iPhone ever at 240g—a weight Apple reduced significantly with titanium in the 15 Pro Max. The 6.7-inch display with Dynamic Island and Always-On was impressive at launch, but the stainless steel frame feels dated compared to newer titanium models.',
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
    expertSummary: 'Still a capable device in 2024, the iPhone 13 offers the same 6.1-inch screen size as newer models at a significantly lower price. The 60Hz display feels dated compared to ProMotion models, but for casual users who primarily browse and message, the difference is less noticeable than spec sheets suggest.',
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
    expertSummary: 'The last of its kind—Apple discontinued the Mini line after this model. At 5.4 inches, it\'s the only modern iPhone that truly fits small hands and tight pockets. Battery life is the main compromise; expect to charge by late afternoon with heavy use. A collector\'s item for compact phone enthusiasts.',
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
    expertSummary: 'The 13 Pro was the first iPhone with 120Hz ProMotion. The 6.1-inch display size matched the 12 Pro, but the adaptive refresh rate was a significant upgrade. No longer sold by Apple, but refurbished units offer good value if you can accept the notch instead of Dynamic Island.',
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
    expertSummary: 'The 13 Pro Max combined the first 120Hz iPhone display with a 4352mAh battery—the largest in any iPhone at the time. The 6.7-inch screen and 238g weight made it substantial in hand. Battery life was genuinely impressive, often lasting into a second day with moderate use.',
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
    expertSummary: 'The S25 Ultra finally addresses the sharp corners that made previous Ultras uncomfortable to hold. At 218g, it\'s lighter than the S24 Ultra despite the same 6.8-inch screen. The S Pen remains a key differentiator from iPhone—if you take handwritten notes or sign documents frequently, no other flagship matches this functionality.',
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
    expertSummary: 'The S25+ is the overlooked middle child—same QHD+ resolution as the Ultra but without the S Pen or telephoto camera. At $300 less than the Ultra, it\'s worth considering if you\'ve never used the S Pen on previous Samsung phones. The 190g weight makes a noticeable difference during extended use.',
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
    expertSummary: 'At 6.2 inches, the base S25 is one of the few compact Android flagships still available. The 1080p resolution is a step down from the Plus and Ultra, but at this screen size, the difference is barely perceptible. Best choice for users switching from older iPhones who want a similar hand feel.',
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
    expertSummary: 'The S24 Ultra introduced titanium to Samsung\'s lineup, but at 232g it\'s noticeably heavier than the S25 Ultra. The sharp corners dig into palms during extended use—a design flaw Samsung corrected in the S25. Still excellent value if bought discounted; the 6.8-inch QHD+ display and S Pen haven\'t changed.',
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
    expertSummary: 'The S24+ was Samsung\'s first phone with Galaxy AI features like Circle to Search and Live Translate. The 6.7-inch QHD+ display is identical in specs to the S25+, making this a smart buy at current discounted prices. Skip if you need the latest Snapdragon chip; consider if AI features matter more than raw performance.',
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
    expertSummary: 'The compact S24 proved there\'s still demand for smaller flagships. At 6.2 inches with 1080p, it\'s the right choice for users who find modern phones too large. Seven years of updates promised. The Exynos chip in some regions runs warmer than Snapdragon—check your market before buying.',
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
    expertSummary: 'Google\'s base Pixel now matches the Pro in screen size at 6.3 inches, eliminating the old compromise of choosing a smaller display for a lower price. The real differentiator is now camera hardware and RAM, not screen real estate. Best value for users who prioritize Google\'s AI features over telephoto lenses.',
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
    expertSummary: 'The Pixel 10 Pro keeps the compact 6.3-inch form factor while packing a higher resolution display than the standard model. Unlike Samsung and Apple, Google offers the same screen size across Pro tiers—choose based on camera needs, not hand size. The 20:9 aspect ratio makes it narrower than iPhones despite similar diagonal measurements.',
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
    expertSummary: 'The XL variant is for users who want the largest Pixel screen available. At 6.8 inches with a 20:9 ratio, it\'s tall and narrow—great for scrolling social media, less ideal for watching widescreen video. The 5200mAh battery is the largest in the Pixel lineup, easily lasting a full day of heavy use.',
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
    expertSummary: 'The Pixel 9 marked Google\'s shift to a more premium design language with flat edges and a redesigned camera bar. The 6.3-inch display is a sweet spot for one-handed use while still being comfortable for reading. Seven years of OS updates make it a long-term investment despite the mid-range resolution.',
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
    expertSummary: 'For the first time, Google offered a compact Pro option. The 6.3-inch Pixel 9 Pro shares its screen size with the base model but adds a telephoto lens and higher resolution display. If you want Pro camera features without a large phone, this is your only Pixel option—and one of few in the entire market.',
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
    expertSummary: 'The Pixel 9 Pro XL competes with iPhone Pro Max and Galaxy Ultra at 6.8 inches. The tall 20:9 aspect ratio means letterboxing on most video content, but works well for scrolling feeds and reading. The 5060mAh battery comfortably lasts a full day; light users may stretch to evening the next day.',
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
    expertSummary: 'The 24-inch 1080p monitor remains the workhorse of office environments. At typical desk distances (60-70cm), pixel density is acceptable for document work, though text appears noticeably sharper on higher-resolution alternatives. Best for budget setups, secondary displays, or users who prioritize high refresh rates for gaming over resolution.',
  },
  {
    id: '27-inch-monitor',
    name: '27" Monitor',
    category: 'monitor',
    diagonal: 27,
    ratio: 16 / 9,
    resolution: '2560 x 1440',
    expertSummary: 'The 27-inch 1440p combination has become the gold standard for productivity. At this size, 1440p delivers roughly 109 PPI—sharp enough that individual pixels are invisible at arm\'s length, yet UI elements remain comfortably sized without scaling. Requires a desk depth of at least 60cm for comfortable viewing.',
  },
  {
    id: '32-inch-monitor',
    name: '32" Monitor',
    category: 'monitor',
    diagonal: 32,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'At 32 inches, 4K resolution becomes practical—you get the pixel density benefits without needing aggressive UI scaling. However, this size demands a deeper desk (70cm+) and may cause neck strain if positioned too close. Ideal for video editors, photographers, and developers who need to see more code without scrolling.',
  },
  {
    id: '34-inch-ultrawide-monitor',
    name: '34" Ultrawide Monitor',
    category: 'monitor',
    diagonal: 34,
    ratio: 21 / 9,
    resolution: '3440 x 1440',
    expertSummary: 'The 34-inch ultrawide replaces a dual-monitor setup without the bezel gap. The 21:9 aspect ratio is perfect for side-by-side document comparison and timeline-based editing software. Gaming support varies—some titles stretch or add black bars. Curved panels are common at this size and reduce edge distortion.',
  },
  {
    id: '38-inch-ultrawide-monitor',
    name: '38" Ultrawide Monitor',
    category: 'monitor',
    diagonal: 38,
    ratio: 21 / 9,
    resolution: '3840 x 1600',
    expertSummary: 'The 38-inch ultrawide offers more vertical space than 34-inch models, making it better for spreadsheets and coding where vertical real estate matters. The higher 1600p resolution means sharper text than 1440p ultrawides. Expect to pay a premium—this size sits in the professional/prosumer tier.',
  },
  {
    id: '49-inch-super-ultrawide-monitor',
    name: '49" Super Ultrawide Monitor',
    category: 'monitor',
    diagonal: 49,
    ratio: 32 / 9,
    resolution: '5120 x 1440',
    expertSummary: 'Equivalent to two 27-inch 1440p monitors side by side, but without the center bezel. The 32:9 aspect ratio is extreme—most content won\'t fill the screen, and you\'ll rely heavily on window management software. Excellent for financial traders, video editors with long timelines, or simulation gaming with triple-monitor-style immersion.',
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
    expertSummary: 'The 43-inch TV is ideal for bedrooms, small apartments, or as a secondary screen. At 4K resolution, you can sit as close as 1.5 meters without seeing pixels. Often overlooked in favor of larger sizes, but the right choice when wall space or viewing distance is limited. OLED options are rare at this size.',
  },
  {
    id: '50-inch-tv',
    name: '50" TV',
    category: 'tv',
    diagonal: 50,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'The 50-inch size hits a practical sweet spot for medium-sized living rooms with 2-2.5 meter viewing distances. It\'s large enough to be immersive for movies but won\'t dominate a room. This size often offers the best value—manufacturers compete heavily here, driving prices down.',
  },
  {
    id: '55-inch-tv',
    name: '55" TV',
    category: 'tv',
    diagonal: 55,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'The most popular TV size globally, 55 inches works well in most living rooms at 2-3 meter viewing distances. This is where you\'ll find the widest selection of panel technologies (OLED, QLED, Mini LED) and price points. If unsure, 55 inches is rarely a wrong choice for typical homes.',
  },
  {
    id: '65-inch-tv',
    name: '65" TV',
    category: 'tv',
    diagonal: 65,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'The 65-inch TV has become the new standard for dedicated home theater setups. Optimal viewing distance is 2.5-3.5 meters. At this size, the difference between budget and premium panels becomes more apparent—consider investing in better HDR performance and local dimming if your room allows light control.',
  },
  {
    id: '70-inch-tv',
    name: '70" TV',
    category: 'tv',
    diagonal: 70,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'The 70-inch size is relatively uncommon—most manufacturers jump from 65 to 75 inches. If you find a 70-inch model, it\'s often a budget-friendly option for those who want something larger than 65 inches but can\'t justify the price jump to 75. Selection is limited compared to standard sizes.',
  },
  {
    id: '75-inch-tv',
    name: '75" TV',
    category: 'tv',
    diagonal: 75,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'At 75 inches, you\'re entering true home cinema territory. Requires 3-4 meters of viewing distance for comfortable watching. Wall mounting is strongly recommended—stands for TVs this size are often unstable and take up significant floor space. Delivery and installation logistics become a real consideration.',
  },
  {
    id: '77-inch-tv',
    name: '77" TV',
    category: 'tv',
    diagonal: 77,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'The 77-inch size exists primarily in the OLED segment, where manufacturing constraints make 75-inch panels impractical. If you\'re shopping for a large OLED, 77 inches is your main option between 65 and 83 inches. The 2-inch difference from 75-inch LCD models is negligible in practice.',
  },
  {
    id: '85-inch-tv',
    name: '85" TV',
    category: 'tv',
    diagonal: 85,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'An 85-inch TV transforms a living room into a cinema. Requires 4+ meters of viewing distance and careful consideration of room lighting—reflections become more problematic at this size. Professional delivery is essential; these TVs rarely fit through standard doorways without careful maneuvering.',
  },
  {
    id: '98-inch-tv',
    name: '98" TV',
    category: 'tv',
    diagonal: 98,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'The 98-inch TV is a statement piece that rivals entry-level projector setups in size. At this scale, 4K resolution is essential—anything less would show visible pixels at reasonable viewing distances. Consider whether a projector might offer better value; 98-inch TVs command premium prices and require dedicated wall space.',
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
    expertSummary: 'The 100-inch screen is the entry point for serious home theater projection. At this size, even 1080p projectors deliver acceptable image quality from typical seating distances (3-4 meters). Room light control becomes critical—even modest ambient light washes out the image. A good starting point before committing to larger screens.',
  },
  {
    id: '120-inch-projector-screen',
    name: '120" Projector Screen',
    category: 'projector',
    diagonal: 120,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'The 120-inch screen is the most popular size for dedicated home theaters. It delivers genuine cinema-scale immersion while remaining achievable in rooms with 4-5 meter throw distances. At this size, 4K resolution becomes noticeably sharper than 1080p. Requires a completely dark room for optimal HDR performance.',
  },
  {
    id: '150-inch-projector-screen',
    name: '150" Projector Screen',
    category: 'projector',
    diagonal: 150,
    ratio: 16 / 9,
    resolution: '3840 x 2160',
    expertSummary: 'A 150-inch screen approaches commercial cinema scale and requires a dedicated room with 5+ meter throw distance and complete light control. At this size, projector brightness (measured in lumens) becomes the limiting factor—budget at least 3000 lumens for acceptable HDR. Screen material quality significantly impacts the final image.',
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
    expertSummary: 'The 13-inch iPad Pro with M4 chip and tandem OLED display is Apple\'s most capable tablet ever. The 4:3 aspect ratio provides more usable space for creative apps than widescreen alternatives. At this size, it genuinely competes with laptops for productivity—but the $1299+ price demands serious consideration of whether iPadOS meets your workflow needs.',
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
    expertSummary: 'The 11-inch iPad Pro offers the same M4 power as its larger sibling in a more portable package. The tandem OLED display is stunning, but the smaller canvas makes detailed illustration work more challenging. Best for users who prioritize portability and plan to use the iPad primarily handheld rather than with a keyboard.',
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
    expertSummary: 'The 13-inch iPad Air brings the large-screen experience to a more accessible price point. You lose the Pro\'s OLED display and ProMotion, but gain a capable M2 chip and the same screen real estate. The smart choice for students and professionals who need the size but can\'t justify Pro pricing.',
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
    expertSummary: 'The 11-inch iPad Air hits the sweet spot for most users—powerful enough for demanding apps, portable enough for daily carry, and priced reasonably. The M2 chip handles everything from note-taking to video editing. Consider this before the Pro unless you specifically need ProMotion or the OLED display.',
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
    expertSummary: 'The base iPad finally adopted the modern design language with USB-C and a larger 10.9-inch display. It\'s the entry point to the iPad ecosystem, capable of handling everyday tasks, streaming, and light creative work. The A14 chip shows its age in demanding apps, but for web browsing and media consumption, it remains excellent value.',
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
    expertSummary: 'The last iPad with the classic home button design and Lightning port. While dated, the 10.2-inch display remains perfectly adequate for reading, video calls, and basic productivity. Often available at steep discounts, making it the budget king for families and education. Don\'t expect software updates much longer.',
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
    expertSummary: 'The iPad mini occupies a unique niche—too large for a pocket, too small for serious productivity, but perfect for specific use cases. Pilots, medical professionals, and field workers love its portability. The 8.3-inch screen is ideal for reading and note-taking in tight spaces. The A17 Pro chip is overkill for most mini users.',
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
    expertSummary: 'At 14.6 inches, the Tab S11 Ultra is Samsung\'s laptop replacement. The 16:10 aspect ratio favors video content and split-screen multitasking over the iPad\'s document-friendly 4:3. DeX mode transforms it into a desktop experience. The notch housing dual cameras is polarizing—great for video calls, distracting for content consumption.',
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
    expertSummary: 'The Tab S11+ offers a more manageable 12.4-inch screen without the Ultra\'s notch. It\'s the Goldilocks option in Samsung\'s lineup—large enough for productivity, portable enough for couch use. The AMOLED display rivals iPad Pro for color accuracy. S Pen included, unlike Apple\'s separate Pencil purchase.',
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
    expertSummary: 'The base Tab S11 competes directly with iPad Air at 11 inches. Samsung\'s 16:10 ratio means slightly more width for video but less height for documents compared to iPad\'s 4:3. Android\'s flexibility is both a strength and weakness—more customization options, but tablet-optimized apps remain less polished than iPadOS.',
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
    expertSummary: 'The Tab S10 Ultra introduced Galaxy AI features to Samsung\'s tablet lineup. The massive 14.6-inch Dynamic AMOLED display excels at multitasking with up to three apps visible simultaneously. Weight (718g) makes extended handheld use tiring—this tablet lives on desks and stands.',
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
    expertSummary: 'The Tab S10+ balances screen size with portability better than the Ultra. At 12.4 inches, it\'s still large enough for serious work but light enough (571g) for reading in bed. The 120Hz AMOLED display is excellent for both productivity and entertainment. A strong iPad Pro 12.9 alternative for Android users.',
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
    expertSummary: 'The FE+ brings a large 13.1-inch screen to a mid-range price point. It lacks the flagship\'s 120Hz refresh rate (90Hz instead) and premium build, but delivers 90% of the experience at 50% of the Ultra\'s price. Best for users who prioritize screen size over cutting-edge specs.',
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
    expertSummary: 'Samsung\'s budget-friendly 10.9-inch tablet offers surprising value with its high-resolution display and S Pen support. The smaller size makes it more portable than its siblings. Ideal for students and casual users who want Samsung\'s ecosystem without flagship pricing.',
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
    expertSummary: 'The Surface Pro 11 runs full Windows 11, making it the only tablet here that\'s truly a laptop replacement. The 3:2 aspect ratio is ideal for productivity—more vertical space than 16:9 or 16:10 alternatives. The Snapdragon X Elite chip offers excellent battery life but may have compatibility issues with legacy x86 software.',
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
