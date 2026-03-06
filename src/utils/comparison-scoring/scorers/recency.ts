import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

export const recencyScorer: Scorer = (a: Device, b: Device, _ctx: ScoringContext): number => {
  // Use the newer device's release date
  const dateA = a.releasedAt ? new Date(a.releasedAt).getTime() : 0;
  const dateB = b.releasedAt ? new Date(b.releasedAt).getTime() : 0;

  if (dateA === 0 && dateB === 0) return 0.3;

  const newerDate = Math.max(dateA, dateB);
  const now = Date.now();
  const monthsAgo = (now - newerDate) / (1000 * 60 * 60 * 24 * 30);

  if (monthsAgo <= 6) return 1.0;
  if (monthsAgo <= 12) return 0.8;
  if (monthsAgo <= 18) return 0.6;
  if (monthsAgo <= 24) return 0.4;
  if (monthsAgo <= 36) return 0.2;
  return 0.08;
};
