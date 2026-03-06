import type { Device } from '../../../data/devices';
import type { Scorer, ScoringContext } from '../types';

function sizeSimilarity(a: Device, b: Device): number {
  const smaller = Math.min(a.diagonal, b.diagonal);
  const larger = Math.max(a.diagonal, b.diagonal);
  if (smaller <= 0) return 0;
  const ratio = larger / smaller;
  if (ratio <= 1.25) return 0.35;
  if (ratio <= 1.5) return 0.25;
  if (ratio <= 2.0) return 0.15;
  return 0.05;
}

function categorySceneScore(a: Device, b: Device): number {
  if (a.category === b.category) return 0.45;

  const cats = [a.category, b.category].sort().join('-');
  if (cats === 'projector-tv') return 0.4;
  if (cats === 'monitor-tv') return 0.2;
  if (cats === 'monitor-projector') return 0.15;

  return 0.1;
}

export const sceneScorer: Scorer = (a: Device, b: Device, ctx: ScoringContext): number => {
  if (ctx.pairTrack === 'model') return 0.5;

  const score = categorySceneScore(a, b) + sizeSimilarity(a, b) + (a.resolution && b.resolution ? 0.2 : 0.05);
  return Math.min(score, 1.0);
};

