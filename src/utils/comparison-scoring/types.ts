import type { Device } from '../../data/devices';

export type DeviceTrack = 'model' | 'sizeProfile' | 'mixed';

export type Scorer = (a: Device, b: Device, ctx: ScoringContext) => number;

export interface ScorerEntry {
  scorer: string;
  weight: number;
}

export interface ScoringContext {
  trackA: DeviceTrack;
  trackB: DeviceTrack;
  pairTrack: DeviceTrack;
  signals: Record<string, SignalData>;
  maxLogImpressions: number;
}

export interface SignalData {
  impressions?: number;
  clicks?: number;
}

export interface PairDecision {
  slug: string;
  score: number;
  shouldIndex: boolean;
  track: DeviceTrack;
  hardRuleResult: 'pass' | string;
  breakdown: Record<string, number>;
}
