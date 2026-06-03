import {
  getComparisonBrowseUrl,
  isCompareToolGlobalNavEnabled,
  isComparisonSeoEnabled,
} from '../site.config';

// Unified navigation configuration for Header and Footer
// Single source of truth for all navigation links

export type DeviceCategory = 'phone' | 'tablet' | 'tv' | 'monitor' | 'projector';
export type ToolType = 'ppi' | 'aspect-ratio' | 'resolution' | 'all' | 'search' | 'blog';
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
  { href: '/tv-screen-size-calculator', label: 'TV Screen Size', shortLabel: 'TV Size', icon: 'tv' },
  { href: '/monitor-screen-size-calculator', label: 'Monitor Screen Size', shortLabel: 'Monitor Size', icon: 'monitor' },
  { href: '/phone-screen-size-calculator', label: 'Phone Screen Size', shortLabel: 'Phone Size', icon: 'phone' },
  { href: '/tablet-screen-size-calculator', label: 'Tablet Screen Size', shortLabel: 'Tablet Size', icon: 'tablet' },
  { href: '/projector-screen-size-calculator', label: 'Projector Screen Size', shortLabel: 'Projector Size', icon: 'projector' },
  { href: '/ppi-calculator', label: 'PPI & DPI Calculator', shortLabel: 'PPI & DPI', icon: 'ppi' },
  { href: '/aspect-ratio-calculator', label: 'Aspect Ratio Calculator', shortLabel: 'Aspect Ratio', icon: 'aspect-ratio' },
  { href: '/resolution-calculator', label: 'Resolution Calculator', shortLabel: 'Resolution', icon: 'resolution' },
];

// Comparison pages navigation
export const comparisonLinks: NavLink[] = isComparisonSeoEnabled()
  ? [
      { href: getComparisonBrowseUrl(), label: 'All Comparisons', shortLabel: 'All', icon: 'all' },
      { href: getComparisonBrowseUrl('phone'), label: 'Phone Comparisons', shortLabel: 'Phones', icon: 'phone' },
      { href: getComparisonBrowseUrl('tablet'), label: 'Tablet Comparisons', shortLabel: 'Tablets', icon: 'tablet' },
      { href: getComparisonBrowseUrl('tv'), label: 'TV Comparisons', shortLabel: 'TVs', icon: 'tv' },
      { href: getComparisonBrowseUrl('monitor'), label: 'Monitor Comparisons', shortLabel: 'Monitors', icon: 'monitor' },
      { href: getComparisonBrowseUrl('projector'), label: 'Projector Comparisons', shortLabel: 'Projectors', icon: 'projector' },
    ]
  : [];

// Device database pages
export const deviceLinks: NavLink[] = [
  { href: '/devices', label: 'All Devices', shortLabel: 'All', icon: 'all' },
  { href: '/phones', label: 'Phones', icon: 'phone' },
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

// Quick links for mobile navigation
export const quickLinks: NavLink[] = [
  ...(isCompareToolGlobalNavEnabled()
    ? [{ href: '/compare', label: 'Compare Tool', shortLabel: 'Compare', icon: 'search', color: 'primary' } satisfies NavLink]
    : []),
  { href: '/devices', label: 'Device Database', shortLabel: 'Devices', icon: 'all', color: 'violet' },
  { href: '/calculators', label: 'All Calculators', shortLabel: 'Calculators', icon: 'ppi', color: 'amber' },
  { href: '/blog', label: 'Blog', icon: 'blog', color: 'rose' },
];

// Quick link icon types for QuickLinkIcon component
export const quickLinkIconMap: Record<string, string> = {
  '/compare': 'compare',
  '/devices': 'devices',
  '/calculators': 'calculator',
  '/blog': 'blog',
};

// Footer sections configuration
export const footerSections: NavSection[] = [
  { title: 'Calculators', links: calculatorLinks },
  { title: 'Comparisons', links: comparisonLinks },
  { title: 'Resources', links: resourceLinks },
];

// Site metadata
export const siteInfo = {
  name: 'ScreenSizeCalculator',
  domain: 'screensizecalculators.com',
  description: 'Free online tools to calculate screen dimensions, viewing distances, PPI, and compare display sizes for TVs, monitors, phones, and projectors.',
  tagline: 'Made with precision for screen enthusiasts worldwide.',
};
