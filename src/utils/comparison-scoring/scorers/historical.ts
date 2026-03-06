import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

export const historicalScorer: Scorer = (_a: Device, _b: Device, ctx: ScoringContext): number => {
  const slug = `${[_a.id, _b.id].sort().join('-vs-')}`;
  const signal = ctx.signals[slug];

  if (signal && signal.impressions != null && signal.impressions > 0) {
    return Math.log1p(signal.impressions) / ctx.maxLogImpressions;
  }

  // Default scores by track when no historical data
  if (ctx.pairTrack === 'model') return 0.5;
  if (ctx.pairTrack === 'sizeProfile') return 0.6;
  return 0.3;
};
