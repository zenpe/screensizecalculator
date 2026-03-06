import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

const PHONE_SPEC_FIELDS = [
  'weight', 'battery', 'dimensions', 'refreshRate',
  'screenType', 'peakBrightness', 'hdr', 'alwaysOnDisplay',
] as const;

function expertSummaryScore(device: Device): number {
  if (!device.expertSummary) return 0;
  if (device.expertSummary.length >= 200) return 0.5;
  if (device.expertSummary.length >= 100) return 0.3;
  return 0;
}

function phoneSpecsCompleteness(device: Device): number {
  if (!device.phone) return 0;
  let count = 0;
  for (const field of PHONE_SPEC_FIELDS) {
    if (device.phone[field] != null) count++;
  }
  return Math.min(count * 0.05, 0.5);
}

function scoreModelTrack(a: Device, b: Device): number {
  const expertAvg = (expertSummaryScore(a) + expertSummaryScore(b)) / 2;
  const specsAvg = (phoneSpecsCompleteness(a) + phoneSpecsCompleteness(b)) / 2;
  return Math.min(expertAvg + specsAvg, 1.0);
}

function scoreSizeProfileTrack(a: Device, b: Device): number {
  let score = 0;

  // expertSummary
  const expertAvg = (expertSummaryScore(a) + expertSummaryScore(b)) / 2;
  score += expertAvg;

  // resolution/PPI computable
  if (a.resolution && b.resolution) score += 0.25;

  // category content diversity
  if (a.category === b.category) score += 0.25;

  return Math.min(score, 1.0);
}

export const qualityScorer: Scorer = (a: Device, b: Device, ctx: ScoringContext): number => {
  if (ctx.pairTrack === 'model') return scoreModelTrack(a, b);
  if (ctx.pairTrack === 'sizeProfile') return scoreSizeProfileTrack(a, b);
  // mixed: average
  return (scoreModelTrack(a, b) + scoreSizeProfileTrack(a, b)) / 2;
};
