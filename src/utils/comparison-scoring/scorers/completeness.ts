import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

function scoreModelTrack(a: Device, b: Device): number {
  let score = 0;

  // resolution
  if (a.resolution && b.resolution) score += 0.2;
  else if (a.resolution || b.resolution) score += 0.1;

  // phone specs
  if (a.phone && b.phone) score += 0.3;
  else if (a.phone || b.phone) score += 0.15;

  // price
  if (a.price != null && b.price != null) score += 0.2;
  else if (a.price != null || b.price != null) score += 0.1;

  // expertSummary
  if (a.expertSummary && b.expertSummary) score += 0.3;
  else if (a.expertSummary || b.expertSummary) score += 0.15;

  return score;
}

function scoreSizeProfileTrack(a: Device, b: Device): number {
  let score = 0;

  // resolution
  if (a.resolution && b.resolution) score += 0.3;
  else if (a.resolution || b.resolution) score += 0.15;

  // expertSummary
  if (a.expertSummary && b.expertSummary) score += 0.4;
  else if (a.expertSummary || b.expertSummary) score += 0.2;

  // diagonal difference in reasonable range (5%-100%)
  const smaller = Math.min(a.diagonal, b.diagonal);
  const larger = Math.max(a.diagonal, b.diagonal);
  if (smaller > 0) {
    const diffRatio = (larger - smaller) / smaller;
    if (diffRatio >= 0.05 && diffRatio <= 1.0) score += 0.3;
  }

  return score;
}

export const completenessScorer: Scorer = (a: Device, b: Device, ctx: ScoringContext): number => {
  if (ctx.pairTrack === 'model') return scoreModelTrack(a, b);
  if (ctx.pairTrack === 'sizeProfile') return scoreSizeProfileTrack(a, b);
  // mixed: average of both
  return (scoreModelTrack(a, b) + scoreSizeProfileTrack(a, b)) / 2;
};
