import { devices, isValidComparison } from '../../data/devices';
import type { Device } from '../../data/devices';
import { getComparisonSlug } from '../url';
import { comparisonIndexConfig } from '../../site.config';
import type { DeviceTrack, PairDecision, Scorer, ScoringContext, SignalData } from './types';
import { completenessScorer } from './scorers/completeness';
import { demandScorer } from './scorers/demand';
import { generationScorer } from './scorers/generation';
import { intentScorer } from './scorers/intent';
import { qualityScorer } from './scorers/quality';
import { recencyScorer } from './scorers/recency';
import { sceneScorer } from './scorers/scene';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type QuotaKey = keyof typeof comparisonIndexConfig.categoryQuotas;

interface CandidateEval {
  decision: PairDecision;
  ids: [string, string];
  effectiveScore: number;
  penalty: number;
  intentScore: number;
  demandScore: number;
  generationScore: number;
}

const scorerRegistry = new Map<string, Scorer>([
  ['completeness', completenessScorer],
  ['recency', recencyScorer],
  ['intent', intentScorer],
  ['quality', qualityScorer],
  ['generation', generationScorer],
  ['scene', sceneScorer],
  ['demand', demandScorer],
]);

export function validateConfig(config: typeof comparisonIndexConfig): void {
  for (const [track, entries] of Object.entries(config.profiles)) {
    for (const entry of entries) {
      if (!scorerRegistry.has(entry.scorer))
        throw new Error(`[comparison-scoring] Unknown scorer "${entry.scorer}" in profile "${track}"`);
      if (entry.weight <= 0)
        throw new Error(`[comparison-scoring] weight must be > 0: "${entry.scorer}" in "${track}"`);
    }

    const sum = entries.reduce((s: number, e: { weight: number }) => s + e.weight, 0);
    if (Math.abs(sum - 100) > 0.01)
      throw new Error(`[comparison-scoring] profile "${track}" weights sum to ${sum}, expected 100`);
  }

  for (const [track, val] of Object.entries(config.thresholds)) {
    if (val < 0 || val > 100)
      throw new Error(`[comparison-scoring] threshold for "${track}" must be 0-100, got ${val}`);
  }

  for (const [cat, val] of Object.entries(config.categoryQuotas)) {
    if (val < 0)
      throw new Error(`[comparison-scoring] quota for "${cat}" must be >= 0, got ${val}`);
  }

  const profileKeys = new Set(Object.keys(config.profiles));
  const thresholdKeys = new Set(Object.keys(config.thresholds));
  for (const k of profileKeys) {
    if (!thresholdKeys.has(k))
      throw new Error(`[comparison-scoring] profile "${k}" has no matching threshold`);
  }

  const { duplicatePenalty, maxIndexedPerDevice } = config.selectionPolicy;
  if (duplicatePenalty.startsAfter < 0 || duplicatePenalty.perExtra < 0 || duplicatePenalty.max < 0) {
    throw new Error('[comparison-scoring] duplicatePenalty values must be >= 0');
  }
  for (const [track, val] of Object.entries(maxIndexedPerDevice)) {
    if (val < 0)
      throw new Error(`[comparison-scoring] maxIndexedPerDevice for "${track}" must be >= 0, got ${val}`);
  }
}

export function applyHardRules(
  a: Device | undefined | null,
  b: Device | undefined | null,
  slug: string,
): { pass: boolean; reason?: string } {
  if (!a || !b) return { pass: false, reason: 'device-not-found' };
  if (!a.id || !b.id || !a.diagonal || !b.diagonal)
    return { pass: false, reason: 'missing-critical-fields' };
  if (!isValidComparison(a.category, b.category))
    return { pass: false, reason: 'invalid-category-pair' };
  if (a.id === b.id) return { pass: false, reason: 'self-comparison' };
  const canonicalSlug = getComparisonSlug(a.id, b.id);
  if (slug !== canonicalSlug) return { pass: false, reason: 'non-canonical-slug' };
  return { pass: true };
}

export function isModelDevice(device: Device): boolean {
  return comparisonIndexConfig.modelPrefixes.some((prefix) => device.id.startsWith(prefix));
}

export function getPairTrack(a: Device, b: Device): DeviceTrack {
  const trackA = isModelDevice(a) ? 'model' : 'sizeProfile';
  const trackB = isModelDevice(b) ? 'model' : 'sizeProfile';
  if (trackA === trackB) return trackA;
  return 'mixed';
}

export function getQuotaKey(a: Device, b: Device): QuotaKey {
  if (a.category === b.category) return a.category as QuotaKey;
  const sorted = [a.category, b.category].sort();
  const key = sorted.join('-') as QuotaKey;
  if (!(key in comparisonIndexConfig.categoryQuotas))
    throw new Error(`[comparison-scoring] No quota defined for cross-category pair: ${key}`);
  return key;
}

function canonicalizeSlug(slug: string): string {
  const ids = slug.split('-vs-');
  if (ids.length !== 2) return slug;
  return getComparisonSlug(ids[0], ids[1]);
}

function loadSignals(): { signals: Record<string, SignalData>; maxLogImpressions: number } {
  let raw: Record<string, SignalData> = {};
  try {
    raw = JSON.parse(
      JSON.stringify(
        (() => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            return require('../../data/comparison-signals.json');
          } catch {
            return {};
          }
        })(),
      ),
    );
  } catch {
    raw = {};
  }

  let maxLog = 1;
  for (const val of Object.values(raw)) {
    if (val.impressions != null && val.impressions > 0) {
      const lv = Math.log1p(val.impressions);
      if (lv > maxLog) maxLog = lv;
    }
  }

  return { signals: raw, maxLogImpressions: maxLog };
}

function scorePair(
  a: Device,
  b: Device,
  track: DeviceTrack,
  ctx: ScoringContext,
): { score: number; breakdown: Record<string, number> } {
  const profile = comparisonIndexConfig.profiles[track];
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const entry of profile) {
    const scorerFn = scorerRegistry.get(entry.scorer);
    if (!scorerFn) continue;
    const raw = Math.max(0, Math.min(1, scorerFn(a, b, ctx)));
    const weighted = raw * entry.weight;
    breakdown[entry.scorer] = Math.round(weighted * 100) / 100;
    total += weighted;
  }

  return { score: Math.round(total * 100) / 100, breakdown };
}

function getBreakdownValue(decision: PairDecision, key: string): number {
  return decision.breakdown[key] ?? 0;
}

function compareCandidates(a: CandidateEval, b: CandidateEval): number {
  if (b.effectiveScore !== a.effectiveScore) return b.effectiveScore - a.effectiveScore;
  if (b.intentScore !== a.intentScore) return b.intentScore - a.intentScore;
  if (b.demandScore !== a.demandScore) return b.demandScore - a.demandScore;
  if (b.generationScore !== a.generationScore) return b.generationScore - a.generationScore;
  return a.decision.slug.localeCompare(b.decision.slug);
}

function evaluateCandidate(
  decision: PairDecision,
  pairIdsMap: Map<string, [string, string]>,
  indexedCounts: Map<string, number>,
): CandidateEval | null {
  const ids = pairIdsMap.get(decision.slug);
  if (!ids) return null;

  const [idA, idB] = ids;
  const countA = indexedCounts.get(idA) ?? 0;
  const countB = indexedCounts.get(idB) ?? 0;
  const cap = comparisonIndexConfig.selectionPolicy.maxIndexedPerDevice[decision.track];
  if (cap > 0 && (countA >= cap || countB >= cap)) return null;

  const policy = comparisonIndexConfig.selectionPolicy.duplicatePenalty;
  const penaltyForCount = (currentCount: number): number => {
    const extra = Math.max(0, currentCount + 1 - policy.startsAfter);
    return Math.min(policy.max, extra * policy.perExtra);
  };
  const penalty = Math.min(policy.max, penaltyForCount(countA) + penaltyForCount(countB));
  const effectiveScore = Math.max(0, decision.score - penalty);

  return {
    decision,
    ids,
    effectiveScore,
    penalty,
    intentScore: getBreakdownValue(decision, 'intent'),
    demandScore: getBreakdownValue(decision, 'demand'),
    generationScore: getBreakdownValue(decision, 'generation'),
  };
}

function applyQuotaSelection(
  group: PairDecision[],
  quota: number,
  pairIdsMap: Map<string, [string, string]>,
  pinnedSet: Set<string>,
): void {
  const indexedCounts = new Map<string, number>();
  const remaining = new Set(group.map((d) => d.slug));
  const decisionMap = new Map(group.map((d) => [d.slug, d]));
  let indexed = 0;

  const selectCandidate = (candidate: CandidateEval): void => {
    const { decision, ids, penalty, effectiveScore } = candidate;
    decision.shouldIndex = true;
    decision.breakdown.dupPenalty = -Math.round(penalty * 100) / 100;
    decision.score = Math.round(effectiveScore * 100) / 100;
    indexedCounts.set(ids[0], (indexedCounts.get(ids[0]) ?? 0) + 1);
    indexedCounts.set(ids[1], (indexedCounts.get(ids[1]) ?? 0) + 1);
    remaining.delete(decision.slug);
    indexed++;
  };

  // Pin list is evaluated first, but still obeys threshold and per-device caps.
  const pinnedCandidates = group
    .filter((d) => pinnedSet.has(d.slug))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.slug.localeCompare(b.slug);
    });

  for (const decision of pinnedCandidates) {
    if (indexed >= quota) break;
    const candidate = evaluateCandidate(decision, pairIdsMap, indexedCounts);
    if (!candidate) continue;
    const threshold = comparisonIndexConfig.thresholds[decision.track];
    if (candidate.effectiveScore < threshold) continue;
    selectCandidate(candidate);
  }

  while (indexed < quota) {
    let best: CandidateEval | null = null;

    for (const slug of remaining) {
      const decision = decisionMap.get(slug);
      if (!decision) continue;
      const candidate = evaluateCandidate(decision, pairIdsMap, indexedCounts);
      if (!candidate) continue;

      const threshold = comparisonIndexConfig.thresholds[decision.track];
      if (candidate.effectiveScore < threshold) continue;

      if (!best || compareCandidates(candidate, best) < 0) {
        best = candidate;
      }
    }

    if (!best) break;
    selectCandidate(best);
  }
}

function buildComparisonIndexMap(): Map<string, PairDecision> {
  const { signals, maxLogImpressions } = loadSignals();
  const decisions: PairDecision[] = [];
  const deviceMap = new Map(devices.map((d) => [d.id, d]));
  const pairIdsMap = new Map<string, [string, string]>();

  for (let i = 0; i < devices.length; i++) {
    for (let j = i + 1; j < devices.length; j++) {
      const a = devices[i];
      const b = devices[j];
      const slug = getComparisonSlug(a.id, b.id);
      pairIdsMap.set(slug, [a.id, b.id]);

      const hardResult = applyHardRules(a, b, slug);
      if (!hardResult.pass) {
        decisions.push({
          slug,
          score: 0,
          shouldIndex: false,
          track: 'mixed',
          hardRuleResult: hardResult.reason!,
          breakdown: {},
        });
        continue;
      }

      const track = getPairTrack(a, b);
      const ctx: ScoringContext = {
        trackA: isModelDevice(a) ? 'model' : 'sizeProfile',
        trackB: isModelDevice(b) ? 'model' : 'sizeProfile',
        pairTrack: track,
        signals,
        maxLogImpressions,
      };

      const { score, breakdown } = scorePair(a, b, track, ctx);
      decisions.push({
        slug,
        score,
        shouldIndex: false,
        track,
        hardRuleResult: 'pass',
        breakdown,
      });
    }
  }

  const passed = decisions.filter((d) => d.hardRuleResult === 'pass');
  const quotaGroups = new Map<QuotaKey, PairDecision[]>();
  for (const decision of passed) {
    const ids = pairIdsMap.get(decision.slug);
    if (!ids) continue;
    const a = deviceMap.get(ids[0]);
    const b = deviceMap.get(ids[1]);
    if (!a || !b) continue;
    const qKey = getQuotaKey(a, b);
    if (!quotaGroups.has(qKey)) quotaGroups.set(qKey, []);
    quotaGroups.get(qKey)!.push(decision);
  }

  const pinnedSet = new Set(comparisonIndexConfig.pinnedSlugs.map((slug) => canonicalizeSlug(slug)));
  for (const [qKey, group] of quotaGroups) {
    const quota = comparisonIndexConfig.categoryQuotas[qKey] ?? 0;
    applyQuotaSelection(group, quota, pairIdsMap, pinnedSet);
  }

  const map = new Map<string, PairDecision>();
  for (const decision of decisions) {
    map.set(decision.slug, decision);
  }
  return map;
}

function buildFullIndexMap(): Map<string, PairDecision> {
  const map = new Map<string, PairDecision>();
  for (let i = 0; i < devices.length; i++) {
    for (let j = i + 1; j < devices.length; j++) {
      const a = devices[i];
      const b = devices[j];
      if (!isValidComparison(a.category, b.category)) continue;
      const slug = getComparisonSlug(a.id, b.id);
      map.set(slug, {
        slug,
        score: 100,
        shouldIndex: true,
        track: getPairTrack(a, b),
        hardRuleResult: 'pass',
        breakdown: {},
      });
    }
  }
  return map;
}

let _cachedMap: Map<string, PairDecision> | null = null;

function getIndexMap(): Map<string, PairDecision> {
  if (_cachedMap) return _cachedMap;

  try {
    validateConfig(comparisonIndexConfig);
    _cachedMap = buildComparisonIndexMap();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('[comparison-scoring]')) throw e;
    console.error('[comparison-scoring] Runtime error, falling back to full index:', e);
    _cachedMap = buildFullIndexMap();
  }

  try {
    const report = buildScoreReport(_cachedMap);
    const distPath = resolve(process.cwd(), 'dist');
    mkdirSync(distPath, { recursive: true });
    writeFileSync(resolve(distPath, 'score-report.json'), JSON.stringify(report, null, 2));
  } catch {
    console.warn('[comparison-scoring] Failed to write score-report.json');
  }

  return _cachedMap;
}

export function shouldIndexComparison(slug: string): boolean {
  const map = getIndexMap();
  if (!comparisonIndexConfig.enabled) return true;
  const decision = map.get(slug);
  if (!decision) return false;
  return decision.shouldIndex;
}

export function getScoreReport(): object {
  const map = getIndexMap();
  return buildScoreReport(map);
}

function buildScoreReport(map: Map<string, PairDecision>): object {
  const decisions = Array.from(map.values());

  const total = decisions.length;
  const hardRuleFiltered = decisions.filter((d) => d.hardRuleResult !== 'pass').length;
  const indexed = decisions.filter((d) => d.shouldIndex).length;
  const noindexed = total - indexed;

  const byTrack: Record<string, { total: number; indexed: number }> = {};
  const byCategory: Record<string, { total: number; indexed: number; quota: number }> = {};
  const deviceMap = new Map(devices.map((d) => [d.id, d]));

  for (const decision of decisions) {
    if (!byTrack[decision.track]) byTrack[decision.track] = { total: 0, indexed: 0 };
    byTrack[decision.track].total++;
    if (decision.shouldIndex) byTrack[decision.track].indexed++;

    if (decision.hardRuleResult !== 'pass') continue;
    const ids = decision.slug.split('-vs-');
    const a = deviceMap.get(ids[0]);
    const b = deviceMap.get(ids[1]);
    if (!a || !b) continue;

    try {
      const qKey = getQuotaKey(a, b);
      if (!byCategory[qKey]) {
        byCategory[qKey] = {
          total: 0,
          indexed: 0,
          quota: comparisonIndexConfig.categoryQuotas[qKey] ?? 0,
        };
      }
      byCategory[qKey].total++;
      if (decision.shouldIndex) byCategory[qKey].indexed++;
    } catch {
      // Ignore unknown cross-category rows in report.
    }
  }

  return {
    version: comparisonIndexConfig.version,
    buildTime: new Date().toISOString(),
    enabled: comparisonIndexConfig.enabled,
    summary: {
      total,
      indexed,
      noindexed,
      hardRuleFiltered,
      byTrack,
      byCategory,
    },
    decisions: decisions.map((d) => ({
      slug: d.slug,
      score: d.score,
      shouldIndex: d.shouldIndex,
      track: d.track,
      hardRuleResult: d.hardRuleResult,
      breakdown: d.breakdown,
    })),
  };
}

export function _resetCache(): void {
  _cachedMap = null;
}

