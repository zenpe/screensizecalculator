// Unified navigation configuration for Header and Footer
// Single source of truth for all navigation links

export type DeviceCategory = 'phone' | 'tablet' | 'tv' | 'monitor' | 'projector';
export type ToolType = 'ppi' | 'aspect-ratio' | 'all' | 'search' | 'blog';
export type IconType = DeviceCategory | ToolType;

export interface NavLink {
  href: string;
  label: string;
  shortLabel?: string; // For mobile/compact display
  icon?: IconType; // For icon display
  color?: string; // Tailwind color class for accent (fallback if no icon)
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

// Calculator tools navigation
export const calculatorLinks: NavLink[] = [
  { href: '/tv-screen-size-calculator', label: 'TV Screen Size', shortLabel: 'TV', icon: 'tv' },
  { href: '/monitor-screen-size-calculator', label: 'Monitor Size', shortLabel: 'Monitor', icon: 'monitor' },
  { href: '/phone-screen-size-calculator', label: 'Phone Screen Size', shortLabel: 'Phone', icon: 'phone' },
  { href: '/tablet-screen-size-calculator', label: 'Tablet Screen Size', shortLabel: 'Tablet', icon: 'tablet' },
  { href: '/projector-screen-size-calculator', label: 'Projector Size', shortLabel: 'Projector', icon: 'projector' },
  { href: '/ppi-calculator', label: 'PPI Calculator', shortLabel: 'PPI', icon: 'ppi' },
  { href: '/aspect-ratio-calculator', label: 'Aspect Ratio', shortLabel: 'Ratio', icon: 'aspect-ratio' },
];

// Comparison pages navigation
export const comparisonLinks: NavLink[] = [
  { href: '/comparison', label: 'All Comparisons', shortLabel: 'All', icon: 'all' },
  { href: '/comparison/phones', label: 'Phone Comparisons', shortLabel: 'Phones', icon: 'phone' },
  { href: '/comparison/tablets', label: 'Tablet Comparisons', shortLabel: 'Tablets', icon: 'tablet' },
  { href: '/comparison/tvs', label: 'TV Comparisons', shortLabel: 'TVs', icon: 'tv' },
  { href: '/comparison/monitors', label: 'Monitor Comparisons', shortLabel: 'Monitors', icon: 'monitor' },
  { href: '/comparison/projectors', label: 'Projector Comparisons', shortLabel: 'Projectors', icon: 'projector' },
];

// Device database pages
export const deviceLinks: NavLink[] = [
  { href: '/devices', label: 'All Devices', shortLabel: 'All', icon: 'all' },
  { href: '/devices/phones', label: 'Phones', icon: 'phone' },
  { href: '/devices/tablets', label: 'Tablets', icon: 'tablet' },
  { href: '/devices/tvs', label: 'TVs', icon: 'tv' },
  { href: '/devices/monitors', label: 'Monitors', icon: 'monitor' },
  { href: '/devices/projectors', label: 'Projectors', icon: 'projector' },
];

// Resource/guide pages
export const resourceLinks: NavLink[] = [
  { href: '/resources/common-screen-sizes', label: 'Common Screen Sizes' },
  { href: '/resources/aspect-ratio-guide', label: 'Aspect Ratio Guide' },
  { href: '/resources/ppi-explained', label: 'PPI Explained' },
  { href: '/blog', label: 'Blog' },
];

// Legal pages
export const legalLinks: NavLink[] = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
];

// Footer sections configuration
export const footerSections: NavSection[] = [
  { title: 'Calculators', links: calculatorLinks },
  { title: 'Compare Sizes', links: comparisonLinks },
  { title: 'Resources', links: resourceLinks },
];

// Site metadata
export const siteInfo = {
  name: 'ScreenSizeCalculator',
  domain: 'screensizecalculators.com',
  description: 'Free online tools to calculate screen dimensions, viewing distances, PPI, and compare display sizes for TVs, monitors, phones, and projectors.',
  tagline: 'Made with precision for screen enthusiasts worldwide.',
};
