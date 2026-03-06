import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

function modelGenerationScore(a: Device, b: Device): number {
  if (!a.releasedAt || !b.releasedAt) return 0.55;

  const yearA = new Date(a.releasedAt).getFullYear();
  const yearB = new Date(b.releasedAt).getFullYear();
  const yearGap = Math.abs(yearA - yearB);

  if (yearGap === 0) return 1.0;
  if (yearGap === 1) return 0.85;
  if (yearGap === 2) return 0.6;
  return 0.3;
}

export const generationScorer: Scorer = (a: Device, b: Device, ctx: ScoringContext): number => {
  if (ctx.pairTrack === 'model') return modelGenerationScore(a, b);
  return 0.5;
};

