// Calculator metadata for navigation and cross-linking

export interface Calculator {
  id: string;
  name: string;
  href: string;
  icon: string;
  category: 'device' | 'utility';
  description: string;
}

export const calculators: Calculator[] = [
  // Device calculators
  {
    id: 'tv',
    name: 'TV Calculator',
    href: '/tv-screen-size-calculator',
    icon: '📺',
    category: 'device',
    description: 'Calculate TV size and viewing distance'
  },
  {
    id: 'monitor',
    name: 'Monitor Calculator',
    href: '/monitor-screen-size-calculator',
    icon: '🖥️',
    category: 'device',
    description: 'Calculate monitor dimensions and PPI'
  },
  {
    id: 'phone',
    name: 'Phone Calculator',
    href: '/phone-screen-size-calculator',
    icon: '📱',
    category: 'device',
    description: 'Calculate phone screen size'
  },
  {
    id: 'projector',
    name: 'Projector Calculator',
    href: '/projector-screen-size-calculator',
    icon: '📽️',
    category: 'device',
    description: 'Calculate throw distance and screen size'
  },
  // Utility calculators
  {
    id: 'aspect-ratio',
    name: 'Aspect Ratio',
    href: '/aspect-ratio-calculator',
    icon: '📐',
    category: 'utility',
    description: 'Calculate and convert aspect ratios'
  },
  {
    id: 'resolution',
    name: 'Resolution',
    href: '/resolution-calculator',
    icon: '🔍',
    category: 'utility',
    description: 'Calculate PPI and resolution'
  },
  {
    id: 'viewing-distance',
    name: 'Viewing Distance',
    href: '/viewing-distance-calculator',
    icon: '👁️',
    category: 'utility',
    description: 'Calculate optimal viewing distance'
  },
];

// Related calculators for cross-linking
export const relatedCalculators: Record<string, string[]> = {
  'tv': ['viewing-distance', 'resolution', 'aspect-ratio'],
  'monitor': ['resolution', 'aspect-ratio', 'viewing-distance'],
  'phone': ['resolution', 'aspect-ratio'],
  'projector': ['viewing-distance', 'aspect-ratio'],
  'aspect-ratio': ['tv', 'monitor', 'resolution'],
  'resolution': ['tv', 'monitor', 'aspect-ratio'],
  'viewing-distance': ['tv', 'monitor', 'projector'],
};

export function getCalculatorById(id: string): Calculator | undefined {
  return calculators.find(c => c.id === id);
}

export function getRelatedCalculators(id: string): Calculator[] {
  const relatedIds = relatedCalculators[id] || [];
  return relatedIds.map(id => getCalculatorById(id)).filter(Boolean) as Calculator[];
}
