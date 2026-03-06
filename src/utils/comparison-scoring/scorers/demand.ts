import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

// Demand signal from historical impressions (log normalized).
export const demandScorer: Scorer = (a: Device, b: Device, ctx: ScoringContext): number => {
  const slug = `${[a.id, b.id].sort().join('-vs-')}`;
  const signal = ctx.signals[slug];

  if (signal && signal.impressions != null && signal.impressions > 0) {
    return Math.log1p(signal.impressions) / ctx.maxLogImpressions;
  }

  // Neutral defaults when no GSC data is present.
  if (ctx.pairTrack === 'model') return 0.5;
  if (ctx.pairTrack === 'sizeProfile') return 0.55;
  return 0.35;
};

