import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

type Tier = 'ultra' | 'pro-max' | 'pro' | 'plus' | 'standard';

function getBrand(id: string): string {
  if (id.startsWith('iphone')) return 'apple';
  if (id.startsWith('ipad')) return 'apple';
  if (id.startsWith('samsung')) return 'samsung';
  if (id.startsWith('google-pixel')) return 'google';
  if (id.startsWith('surface')) return 'microsoft';
  return id.split('-')[0];
}

function getFamily(id: string): string {
  if (id.startsWith('iphone')) return 'iphone';
  if (id.startsWith('ipad')) return 'ipad';
  if (id.startsWith('samsung-galaxy-s')) return 'galaxy-s';
  if (id.startsWith('google-pixel')) return 'pixel';
  if (id.startsWith('surface')) return 'surface';
  return id.split('-').slice(0, 2).join('-');
}

function getTier(device: Device): Tier {
  const name = device.name.toLowerCase();
  if (name.includes('ultra')) return 'ultra';
  if (name.includes('pro max')) return 'pro-max';
  if (name.includes('pro')) return 'pro';
  if (name.includes('plus')) return 'plus';
  return 'standard';
}

function tierSimilarity(a: Tier, b: Tier): number {
  if (a === b) return 0.2;

  const premium = new Set<Tier>(['ultra', 'pro-max', 'pro']);
  if (premium.has(a) && premium.has(b)) return 0.15;

  const order: Tier[] = ['standard', 'plus', 'pro', 'pro-max', 'ultra'];
  const gap = Math.abs(order.indexOf(a) - order.indexOf(b));
  if (gap <= 1) return 0.1;

  return 0.05;
}

function scoreModelTrack(a: Device, b: Device): number {
  let score = 0.05;

  const brandA = getBrand(a.id);
  const brandB = getBrand(b.id);
  const familyA = getFamily(a.id);
  const familyB = getFamily(b.id);
  const tierA = getTier(a);
  const tierB = getTier(b);

  // Brand/family intent signal: same-brand generation comparisons should not be underweighted.
  if (brandA === brandB && familyA === familyB) score += 0.5;
  else if (brandA === brandB) score += 0.4;
  else score += 0.28;

  // Release generation alignment.
  if (a.releasedAt && b.releasedAt) {
    const yearA = new Date(a.releasedAt).getFullYear();
    const yearB = new Date(b.releasedAt).getFullYear();
    const gap = Math.abs(yearA - yearB);
    if (gap <= 1) score += 0.3;
    else if (gap === 2) score += 0.2;
    else score += 0.08;
  } else {
    score += 0.15;
  }

  // Tier alignment.
  score += tierSimilarity(tierA, tierB);

  // Cross-brand flagship match still receives a small bonus.
  const topTiers = new Set<Tier>(['ultra', 'pro-max']);
  if (brandA !== brandB && topTiers.has(tierA) && topTiers.has(tierB)) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

// Common purchase decision pairs for sizeProfile
const COMMON_SIZE_PAIRS: [number, number][] = [
  [65, 55], [75, 65], [85, 75], [55, 50], [85, 65],
  [27, 24], [32, 27], [34, 27],
  [120, 100], [150, 120],
];

function scoreSizeProfileTrack(a: Device, b: Device): number {
  let score = 0;

  // Adjacent sizes (diagonal diff <= 50% of smaller)
  const smaller = Math.min(a.diagonal, b.diagonal);
  const diff = Math.abs(a.diagonal - b.diagonal);
  if (smaller > 0 && diff <= smaller * 0.5) score += 0.4;

  // Same category
  if (a.category === b.category) score += 0.3;

  // Common purchase decision pair
  const dA = Math.round(a.diagonal);
  const dB = Math.round(b.diagonal);
  const isCommon = COMMON_SIZE_PAIRS.some(
    ([x, y]) => (dA === x && dB === y) || (dA === y && dB === x),
  );
  if (isCommon) score += 0.3;

  return Math.min(score, 1.0);
}

function scoreMixedTrack(a: Device, b: Device): number {
  let score = 0;

  // Semantic relevance (TV vs Projector is meaningful)
  const cats = [a.category, b.category].sort();
  if (cats[0] === 'projector' && cats[1] === 'tv') {
    score += 0.5;
  } else {
    score += 0.1;
  }

  // Same use scenario (living room displays)
  const livingRoom = ['tv', 'projector'];
  if (livingRoom.includes(a.category) && livingRoom.includes(b.category)) {
    score += 0.3;
  }

  // Size comparability
  const smaller = Math.min(a.diagonal, b.diagonal);
  const larger = Math.max(a.diagonal, b.diagonal);
  if (smaller > 0) {
    const ratio = larger / smaller;
    if (ratio <= 3) score += 0.2;
  }

  return Math.min(score, 1.0);
}

export const intentScorer: Scorer = (a: Device, b: Device, ctx: ScoringContext): number => {
  if (ctx.pairTrack === 'model') return scoreModelTrack(a, b);
  if (ctx.pairTrack === 'sizeProfile') return scoreSizeProfileTrack(a, b);
  return scoreMixedTrack(a, b);
};
