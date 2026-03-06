import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Device } from '../../../data/devices';
import type { PairDecision } from '../types';

// Mock device factory
function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'test-device',
    name: 'Test Device',
    category: 'phone',
    diagonal: 6.1,
    ratio: 19.5 / 9,
    resolution: '2556 x 1179',
    releasedAt: '2025-09-15',
    expertSummary: 'A great phone with excellent features and premium build quality that makes it stand out from competitors in this price range. It offers exceptional performance for daily tasks and gaming. The camera system is top-notch.',
    phone: {
      weight: 187,
      battery: 4500,
      dimensions: { height: 147, width: 71, depth: 7.8 },
      refreshRate: 120,
      screenType: 'OLED',
      peakBrightness: 2000,
      hdr: true,
      alwaysOnDisplay: true,
    },
    price: 999,
    ...overrides,
  };
}

const iphoneA = makeDevice({
  id: 'iphone-16-pro-max',
  name: 'iPhone 16 Pro Max',
  diagonal: 6.9,
  releasedAt: '2025-09-15',
});

const samsungA = makeDevice({
  id: 'samsung-galaxy-s25-ultra',
  name: 'Samsung Galaxy S25 Ultra',
  diagonal: 6.8,
  releasedAt: '2025-01-22',
});

const tv65 = makeDevice({
  id: '65-inch-tv',
  name: '65" TV',
  category: 'tv',
  diagonal: 65,
  ratio: 16 / 9,
  resolution: '3840 x 2160',
  releasedAt: undefined,
  expertSummary: undefined,
  phone: undefined,
  price: undefined,
});

const tv55 = makeDevice({
  id: '55-inch-tv',
  name: '55" TV',
  category: 'tv',
  diagonal: 55,
  ratio: 16 / 9,
  resolution: '3840 x 2160',
  releasedAt: undefined,
  expertSummary: undefined,
  phone: undefined,
  price: undefined,
});

const projector120 = makeDevice({
  id: '120-inch-projector-screen',
  name: '120" Projector Screen',
  category: 'projector',
  diagonal: 120,
  ratio: 16 / 9,
  resolution: undefined,
  releasedAt: undefined,
  expertSummary: undefined,
  phone: undefined,
  price: undefined,
});

// --- T1: Hard Rules ---
describe('T1: hardRules', () => {
  // We need to import after mocking
  let applyHardRules: typeof import('../index').applyHardRules;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../index');
    applyHardRules = mod.applyHardRules;
  });

  it('rejects when device is null/undefined', () => {
    const result = applyHardRules(null, iphoneA, 'test-slug');
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('device-not-found');

    const result2 = applyHardRules(iphoneA, undefined, 'test-slug');
    expect(result2.pass).toBe(false);
    expect(result2.reason).toBe('device-not-found');
  });

  it('rejects when critical fields are missing', () => {
    const nodiag = makeDevice({ diagonal: 0 });
    const result = applyHardRules(iphoneA, nodiag, 'test-slug');
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('missing-critical-fields');
  });

  it('rejects self-comparison', () => {
    const slug = `${iphoneA.id}-vs-${iphoneA.id}`;
    const result = applyHardRules(iphoneA, iphoneA, slug);
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('self-comparison');
  });

  it('rejects non-canonical slug', () => {
    // Canonical would be alphabetically sorted
    const wrongSlug = `${samsungA.id}-vs-${iphoneA.id}`;
    const result = applyHardRules(samsungA, iphoneA, wrongSlug);
    expect(result.pass).toBe(false);
    expect(result.reason).toBe('non-canonical-slug');
  });

  it('accepts valid pair with canonical slug', () => {
    const [first, second] = [iphoneA.id, samsungA.id].sort();
    const slug = `${first}-vs-${second}`;
    const a = first === iphoneA.id ? iphoneA : samsungA;
    const b = first === iphoneA.id ? samsungA : iphoneA;
    const result = applyHardRules(a, b, slug);
    expect(result.pass).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

// --- T2: Scorer Track Behavior ---
describe('T2: scorer track behavior', () => {
  let getPairTrack: typeof import('../index').getPairTrack;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../index');
    getPairTrack = mod.getPairTrack;
  });

  it('routes model + model to model track', () => {
    expect(getPairTrack(iphoneA, samsungA)).toBe('model');
  });

  it('routes sizeProfile + sizeProfile to sizeProfile track', () => {
    expect(getPairTrack(tv65, tv55)).toBe('sizeProfile');
  });

  it('routes mixed pairs to mixed track', () => {
    // tv (sizeProfile) + projector (sizeProfile) are both sizeProfile, but
    // let's test with a model + sizeProfile pair
    expect(getPairTrack(iphoneA, tv65)).toBe('mixed');
  });
});

// --- T3: Quota trimming + stable sort ---
describe('T3: quota trimming + stable sort', () => {
  it('respects quota limits', () => {
    const pairs: PairDecision[] = [
      { slug: 'a-vs-c', score: 90, shouldIndex: false, track: 'model', hardRuleResult: 'pass', breakdown: {} },
      { slug: 'a-vs-b', score: 80, shouldIndex: false, track: 'model', hardRuleResult: 'pass', breakdown: {} },
      { slug: 'b-vs-c', score: 70, shouldIndex: false, track: 'model', hardRuleResult: 'pass', breakdown: {} },
    ];

    // Sort stably
    pairs.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.slug.localeCompare(b.slug);
    });

    const quota = 2;
    const threshold = 50;
    let indexed = 0;
    for (const p of pairs) {
      if (p.score >= threshold && indexed < quota) {
        p.shouldIndex = true;
        indexed++;
      }
    }

    expect(pairs[0].slug).toBe('a-vs-c');
    expect(pairs[0].shouldIndex).toBe(true);
    expect(pairs[1].slug).toBe('a-vs-b');
    expect(pairs[1].shouldIndex).toBe(true);
    expect(pairs[2].slug).toBe('b-vs-c');
    expect(pairs[2].shouldIndex).toBe(false);
  });

  it('stable sort breaks ties by slug', () => {
    const pairs: PairDecision[] = [
      { slug: 'b-vs-c', score: 80, shouldIndex: false, track: 'model', hardRuleResult: 'pass', breakdown: {} },
      { slug: 'a-vs-c', score: 80, shouldIndex: false, track: 'model', hardRuleResult: 'pass', breakdown: {} },
    ];

    pairs.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.slug.localeCompare(b.slug);
    });

    expect(pairs[0].slug).toBe('a-vs-c');
    expect(pairs[1].slug).toBe('b-vs-c');
  });

  it('noindexes pairs below threshold even when quota is available', () => {
    const pairs: PairDecision[] = [
      { slug: 'a-vs-b', score: 30, shouldIndex: false, track: 'model', hardRuleResult: 'pass', breakdown: {} },
    ];

    const quota = 10;
    const threshold = 55;
    let indexed = 0;
    for (const p of pairs) {
      if (p.score >= threshold && indexed < quota) {
        p.shouldIndex = true;
        indexed++;
      }
    }

    expect(pairs[0].shouldIndex).toBe(false);
  });
});

// --- T4: Shadow mode ---
describe('T4: shadow mode', () => {
  it('returns true for all slugs when enabled=false', async () => {
    vi.resetModules();

    // Mock the config to have enabled: false
    vi.doMock('../../../site.config', () => ({
      comparisonIndexConfig: {
        version: '1.0',
        enabled: false,
        thresholds: { model: 55, sizeProfile: 50, mixed: 70 },
        categoryQuotas: { phone: 200, tablet: 60, monitor: 15, tv: 36, projector: 3, 'projector-tv': 27 },
        pinnedSlugs: [],
        selectionPolicy: {
          maxIndexedPerDevice: { model: 8, sizeProfile: 12, mixed: 4 },
          duplicatePenalty: { startsAfter: 6, perExtra: 2, max: 12 },
        },
        modelPrefixes: ['iphone', 'ipad', 'samsung', 'google-pixel', 'surface'],
        profiles: {
          model: [
            { scorer: 'intent', weight: 30 },
            { scorer: 'generation', weight: 20 },
            { scorer: 'demand', weight: 20 },
            { scorer: 'completeness', weight: 15 },
            { scorer: 'recency', weight: 10 },
            { scorer: 'quality', weight: 5 },
          ],
          sizeProfile: [
            { scorer: 'intent', weight: 35 },
            { scorer: 'scene', weight: 25 },
            { scorer: 'completeness', weight: 20 },
            { scorer: 'demand', weight: 10 },
            { scorer: 'quality', weight: 10 },
          ],
          mixed: [
            { scorer: 'intent', weight: 30 },
            { scorer: 'scene', weight: 25 },
            { scorer: 'completeness', weight: 20 },
            { scorer: 'demand', weight: 10 },
            { scorer: 'quality', weight: 15 },
          ],
        },
      },
    }));

    const mod = await import('../index');
    mod._resetCache();
    expect(mod.shouldIndexComparison('any-slug-here')).toBe(true);
    expect(mod.shouldIndexComparison('another-random-slug')).toBe(true);
  });
});

// --- T5: Config validation ---
describe('T5: config validation', () => {
  let validateConfig: typeof import('../index').validateConfig;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../index');
    validateConfig = mod.validateConfig;
  });

  const baseConfig = () => ({
    version: '1.0' as const,
    enabled: true as const,
    thresholds: { model: 55, sizeProfile: 50, mixed: 70 },
    categoryQuotas: { phone: 200, tablet: 60, monitor: 15, tv: 36, projector: 3, 'projector-tv': 27 },
    pinnedSlugs: [] as string[],
    selectionPolicy: {
      maxIndexedPerDevice: { model: 8, sizeProfile: 12, mixed: 4 },
      duplicatePenalty: { startsAfter: 6, perExtra: 2, max: 12 },
    },
    modelPrefixes: ['iphone'] as readonly string[],
    profiles: {
      model: [
        { scorer: 'intent', weight: 30 },
        { scorer: 'generation', weight: 20 },
        { scorer: 'demand', weight: 20 },
        { scorer: 'completeness', weight: 15 },
        { scorer: 'recency', weight: 10 },
        { scorer: 'quality', weight: 5 },
      ],
      sizeProfile: [
        { scorer: 'intent', weight: 35 },
        { scorer: 'scene', weight: 25 },
        { scorer: 'completeness', weight: 20 },
        { scorer: 'demand', weight: 10 },
        { scorer: 'quality', weight: 10 },
      ],
      mixed: [
        { scorer: 'intent', weight: 30 },
        { scorer: 'scene', weight: 25 },
        { scorer: 'completeness', weight: 20 },
        { scorer: 'demand', weight: 10 },
        { scorer: 'quality', weight: 15 },
      ],
    },
  });

  it('throws on unknown scorer name', () => {
    const cfg = baseConfig();
    (cfg.profiles.model as any)[0].scorer = 'nonexistent';
    expect(() => validateConfig(cfg as any)).toThrow('Unknown scorer "nonexistent"');
  });

  it('throws on weight <= 0', () => {
    const cfg = baseConfig();
    (cfg.profiles.model as any)[0].weight = 0;
    expect(() => validateConfig(cfg as any)).toThrow('weight must be > 0');
  });

  it('throws on weight sum != 100', () => {
    const cfg = baseConfig();
    (cfg.profiles.model as any)[0].weight = 50; // now sums to 125
    expect(() => validateConfig(cfg as any)).toThrow('weights sum to');
  });

  it('throws on threshold > 100', () => {
    const cfg = baseConfig();
    (cfg.thresholds as any).model = 101;
    expect(() => validateConfig(cfg as any)).toThrow('must be 0-100');
  });

  it('throws when profile has no matching threshold', () => {
    const cfg = baseConfig();
    delete (cfg.thresholds as any).mixed;
    expect(() => validateConfig(cfg as any)).toThrow('has no matching threshold');
  });
});

// --- T6: getQuotaKey consistency ---
describe('T6: getQuotaKey consistency', () => {
  let getQuotaKey: typeof import('../index').getQuotaKey;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../index');
    getQuotaKey = mod.getQuotaKey;
  });

  it('returns category for same-category pair', () => {
    expect(getQuotaKey(tv65, tv55)).toBe('tv');
  });

  it('returns sorted cross-category key', () => {
    expect(getQuotaKey(tv65, projector120)).toBe('projector-tv');
  });

  it('throws for undefined cross-category quota', () => {
    const monitor = makeDevice({ id: '27-inch-monitor', category: 'monitor' });
    expect(() => getQuotaKey(iphoneA, monitor)).toThrow('No quota defined');
  });
});
