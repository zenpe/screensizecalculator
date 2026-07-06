import { useEffect, useState } from 'react';
import {
  BREAKPOINT_SYSTEMS,
  getBreakpointProgress,
  getResponsiveImageAdvice,
  getSlotWidthFromPreset,
  type BreakpointSystemId,
  type ViewportSnapshot,
} from '../utils/viewport';

type SlotPreset = '100vw' | '50vw' | 'card' | 'custom';

interface ViewportInspectorProps {
  mode?: 'full' | 'embed';
  initialFramework?: BreakpointSystemId;
  compact?: boolean;
}

const DEFAULT_SNAPSHOT: ViewportSnapshot = {
  viewportWidth: 0,
  viewportHeight: 0,
  visualViewportWidth: 0,
  visualViewportHeight: 0,
  screenWidth: 0,
  screenHeight: 0,
  dpr: 1,
  orientation: 'landscape',
  isTouch: false,
};

const scenarios = [
  {
    title: 'Navigation & Header',
    widths: '320, 375, 768, 1024',
    checks: ['Menu collapse', 'logo spacing', 'sticky header height'],
  },
  {
    title: 'Card Grid',
    widths: '375, 640, 768, 1280',
    checks: ['column count', 'card min-width', 'gap consistency'],
  },
  {
    title: 'Dashboard / Table',
    widths: '390, 768, 1024, 1440',
    checks: ['overflow handling', 'filter wrapping', 'numeric alignment'],
  },
  {
    title: 'Form Layout',
    widths: '320, 414, 768, 1024',
    checks: ['input tap targets', 'label wrapping', 'error messages'],
  },
  {
    title: 'Media Gallery',
    widths: '375, 640, 1024, 1536',
    checks: ['image crop', 'srcset choice', 'aspect ratio lock'],
  },
];

function readSnapshot(): ViewportSnapshot {
  if (typeof window === 'undefined') return DEFAULT_SNAPSHOT;
  const visual = window.visualViewport;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  return {
    viewportWidth,
    viewportHeight,
    visualViewportWidth: Math.round(visual?.width ?? viewportWidth),
    visualViewportHeight: Math.round(visual?.height ?? viewportHeight),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    orientation: viewportHeight >= viewportWidth ? 'portrait' : 'landscape',
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}

function getInitialFramework(initialFramework: BreakpointSystemId, useStoredPreference: boolean): BreakpointSystemId {
  if (typeof window === 'undefined') return initialFramework;
  if (!useStoredPreference) return initialFramework;
  try {
    const stored = localStorage.getItem('viewport-framework');
    return stored === 'bootstrap' || stored === 'tailwind' ? stored : initialFramework;
  } catch {
    return initialFramework;
  }
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>}
    </div>
  );
}

export default function ViewportInspector({
  mode = 'full',
  initialFramework = 'tailwind',
  compact = false,
}: ViewportInspectorProps) {
  const isEmbed = mode === 'embed';
  const [snapshot, setSnapshot] = useState<ViewportSnapshot>(DEFAULT_SNAPSHOT);
  const [framework, setFramework] = useState<BreakpointSystemId>(() => getInitialFramework(initialFramework, !isEmbed));
  const [isCompact, setIsCompact] = useState(compact);
  const [slotPreset, setSlotPreset] = useState<SlotPreset>('100vw');
  const [customSlotWidth, setCustomSlotWidth] = useState('640');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSnapshot(readSnapshot()));
    };

    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    window.visualViewport?.addEventListener('resize', update, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (isEmbed) return;
    try {
      localStorage.setItem('viewport-framework', framework);
    } catch {
      // Some embedded contexts block storage; the tool still works without persistence.
    }
  }, [framework, isEmbed]);

  useEffect(() => {
    if (!isEmbed || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const frameworkParam = params.get('framework');
    if (frameworkParam === 'bootstrap' || frameworkParam === 'tailwind') {
      setFramework(frameworkParam);
    }

    const compactParam = params.get('compact');
    if (compactParam !== null) {
      setIsCompact(compactParam !== '0' && compactParam !== 'false');
    }
  }, [isEmbed]);

  const progress = getBreakpointProgress(snapshot.viewportWidth, framework);

  const cssSlotWidth = getSlotWidthFromPreset(
    slotPreset,
    snapshot.viewportWidth || 1,
    Number.parseInt(customSlotWidth, 10) || 640,
  );
  const imageAdvice = getResponsiveImageAdvice(cssSlotWidth, snapshot.dpr);
  const mediaQuery = progress.next
    ? `@media (min-width: ${progress.next.minWidth}px) { /* ${progress.next.label}+ styles */ }`
    : `@media (min-width: ${progress.active.minWidth}px) { /* ${progress.active.label} styles */ }`;
  const embedCode = `<iframe src="https://screensizecalculators.com/embed/viewport-checker?framework=${framework}&theme=auto&compact=1" width="360" height="260" loading="lazy" title="Viewport Checker"></iframe>`;

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const activeWidthPercent = Math.min(100, Math.max(4, progress.progressPercent));

  if (isEmbed && isCompact) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-700 dark:text-primary-300">
              Viewport
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950 dark:text-white" aria-live="polite">
              {snapshot.viewportWidth || '...'} × {snapshot.viewportHeight || '...'}
            </h2>
          </div>
          <div className="flex rounded-xl bg-gray-950/5 p-1 dark:bg-white/10" aria-label="Breakpoint framework">
            {(['tailwind', 'bootstrap'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFramework(item)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold capitalize transition-colors ${
                  framework === item
                    ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-950 dark:text-primary-300'
                    : 'text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-gray-50 p-2 dark:bg-gray-800">
            <p className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">DPR</p>
            <p className="text-base font-bold text-gray-950 dark:text-white">{snapshot.dpr}x</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-2 dark:bg-gray-800">
            <p className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">Mode</p>
            <p className="text-base font-bold capitalize text-gray-950 dark:text-white">{snapshot.orientation}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-2 dark:bg-gray-800">
            <p className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">BP</p>
            <p className="text-base font-bold text-gray-950 dark:text-white">{progress.active.label}</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{framework} breakpoint</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {progress.next ? `${progress.pxToNext}px to ${progress.next.label}` : 'Largest range'}
            </p>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-cyan-400" style={{ width: `${activeWidthPercent}%` }} />
          </div>
          <a href="/viewport-checker" target="_blank" rel="noreferrer" className="mt-3 block text-center text-xs font-bold text-primary-700 hover:underline dark:text-primary-300">
            Open full checker
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className={isEmbed ? 'bg-transparent' : 'space-y-8'}>
      <section className={isEmbed ? 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900' : 'rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-primary-50/40 to-cyan-50 p-4 shadow-xl dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 sm:p-6'}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
              Live viewport
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl" aria-live="polite">
              {snapshot.viewportWidth || '...'} × {snapshot.viewportHeight || '...'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Current CSS viewport, device pixel ratio, and responsive breakpoint in one view.
            </p>
          </div>

          <div className="flex rounded-2xl bg-gray-950/5 p-1 dark:bg-white/10" role="tablist" aria-label="Breakpoint framework">
            {(['tailwind', 'bootstrap'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFramework(item)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  framework === item
                    ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-950 dark:text-primary-300'
                    : 'text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white'
                }`}
                role="tab"
                aria-selected={framework === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Viewport" value={`${snapshot.viewportWidth} × ${snapshot.viewportHeight}`} detail="CSS pixels" />
          <StatCard label="Visual viewport" value={`${snapshot.visualViewportWidth} × ${snapshot.visualViewportHeight}`} detail="Accounts for mobile browser UI" />
          <StatCard label="DPR" value={`${snapshot.dpr}x`} detail={`${Math.round(snapshot.viewportWidth * snapshot.dpr)} physical px wide`} />
          <StatCard label="Breakpoint" value={progress.active.label} detail={`${framework} · ${progress.active.description}`} />
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white/85 p-4 dark:border-gray-700 dark:bg-gray-800/80">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-950 dark:text-white">Breakpoint Rail</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {progress.next ? `${progress.pxToNext}px until ${progress.next.label}` : 'At the largest configured breakpoint'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyText('media', mediaQuery)}
              className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              {copied === 'media' ? 'Copied' : 'Copy media query'}
            </button>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[620px]">
              <div className="relative h-4 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-500 to-cyan-400" style={{ width: `${activeWidthPercent}%` }} />
              </div>
              <div className="mt-3 grid" style={{ gridTemplateColumns: `repeat(${BREAKPOINT_SYSTEMS[framework].length}, minmax(88px, 1fr))` }}>
                {BREAKPOINT_SYSTEMS[framework].map((breakpoint) => (
                  <div key={breakpoint.id} className={breakpoint.id === progress.active.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}>
                    <p className="text-sm font-bold">{breakpoint.label}</p>
                    <p className="text-xs">{breakpoint.minWidth}px+</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isEmbed && (
        <>
          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">DPR image optimizer</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">Generate practical srcset sizes</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Use current DPR to choose image asset widths without guessing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('srcset', `${imageAdvice.srcset}\nsizes="${imageAdvice.sizes}"`)}
                  className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950"
                >
                  {copied === 'srcset' ? 'Copied' : 'Copy srcset'}
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Slot size
                  <select
                    value={slotPreset}
                    onChange={(event) => setSlotPreset(event.target.value as SlotPreset)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="100vw">100vw - full width</option>
                    <option value="50vw">50vw - half layout</option>
                    <option value="card">320px card</option>
                    <option value="custom">Custom width</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Custom width
                  <input
                    type="number"
                    min="1"
                    value={customSlotWidth}
                    onChange={(event) => setCustomSlotWidth(event.target.value)}
                    disabled={slotPreset !== 'custom'}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-950 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {imageAdvice.candidates.map((candidate) => (
                  <div key={candidate.scale} className={`rounded-2xl border p-4 ${candidate.applies ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60'}`}>
                    <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{candidate.scale}x asset</p>
                    <p className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{candidate.width}px</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{candidate.applies ? 'Recommended for this DPR' : 'Useful fallback'}</p>
                  </div>
                ))}
              </div>

              <pre className="mt-5 overflow-x-auto rounded-2xl bg-gray-950 p-4 text-xs text-gray-100"><code>{`srcset="${imageAdvice.srcset}"\nsizes="${imageAdvice.sizes}"`}</code></pre>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm dark:border-gray-700">
              <p className="text-xs font-bold uppercase tracking-wide text-primary-300">Embed widget</p>
              <h3 className="mt-1 text-xl font-bold">Add this checker to docs</h3>
              <p className="mt-2 text-sm text-gray-300">The embed reads its own iframe viewport, which is stable and privacy-safe.</p>
              <pre className="mt-5 overflow-x-auto rounded-2xl bg-black/40 p-4 text-xs text-gray-100"><code>{embedCode}</code></pre>
              <button
                type="button"
                onClick={() => copyText('embed', embedCode)}
                className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-gray-100"
              >
                {copied === 'embed' ? 'Copied' : 'Copy embed code'}
              </button>
            </div>
          </section>

          {!isCompact && (
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Responsive scenarios</p>
                <h3 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">Test real layouts, not just breakpoints</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {scenarios.map((scenario) => (
                  <article key={scenario.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
                    <h4 className="font-bold text-gray-950 dark:text-white">{scenario.title}</h4>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Test: {scenario.widths}px</p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {scenario.checks.map((check) => (
                        <li key={check} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary-500" />
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
