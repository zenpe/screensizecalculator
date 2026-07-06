export type BreakpointSystemId = 'tailwind' | 'bootstrap';

export interface BreakpointDefinition {
  id: string;
  label: string;
  minWidth: number;
  description: string;
}

export interface ViewportSnapshot {
  viewportWidth: number;
  viewportHeight: number;
  visualViewportWidth: number;
  visualViewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  dpr: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

export interface BreakpointProgress {
  active: BreakpointDefinition;
  previous: BreakpointDefinition | null;
  next: BreakpointDefinition | null;
  pxIntoCurrent: number;
  pxToNext: number | null;
  progressPercent: number;
}

export interface ResponsiveImageAdvice {
  cssWidth: number;
  dpr: number;
  requiredPhysicalWidth: number;
  candidates: Array<{ scale: 1 | 2 | 3; width: number; applies: boolean }>;
  srcset: string;
  sizes: string;
}

export const BREAKPOINT_SYSTEMS: Record<BreakpointSystemId, BreakpointDefinition[]> = {
  tailwind: [
    { id: 'base', label: 'Base', minWidth: 0, description: '< 640px' },
    { id: 'sm', label: 'sm', minWidth: 640, description: 'Small tablets' },
    { id: 'md', label: 'md', minWidth: 768, description: 'Tablets' },
    { id: 'lg', label: 'lg', minWidth: 1024, description: 'Laptops' },
    { id: 'xl', label: 'xl', minWidth: 1280, description: 'Desktops' },
    { id: '2xl', label: '2xl', minWidth: 1536, description: 'Wide screens' },
  ],
  bootstrap: [
    { id: 'xs', label: 'xs', minWidth: 0, description: '< 576px' },
    { id: 'sm', label: 'sm', minWidth: 576, description: 'Small devices' },
    { id: 'md', label: 'md', minWidth: 768, description: 'Tablets' },
    { id: 'lg', label: 'lg', minWidth: 992, description: 'Desktops' },
    { id: 'xl', label: 'xl', minWidth: 1200, description: 'Large desktops' },
    { id: 'xxl', label: 'xxl', minWidth: 1400, description: 'Wide desktops' },
  ],
};

export function getActiveBreakpoint(
  width: number,
  system: BreakpointSystemId,
): BreakpointDefinition {
  const breakpoints = BREAKPOINT_SYSTEMS[system];
  return breakpoints.reduce((active, breakpoint) =>
    width >= breakpoint.minWidth ? breakpoint : active,
  breakpoints[0]);
}

export function getBreakpointProgress(
  width: number,
  system: BreakpointSystemId,
): BreakpointProgress {
  const breakpoints = BREAKPOINT_SYSTEMS[system];
  let activeIndex = 0;
  for (let index = 0; index < breakpoints.length; index += 1) {
    if (width >= breakpoints[index].minWidth) {
      activeIndex = index;
    }
  }
  const safeIndex = Math.max(activeIndex, 0);
  const active = breakpoints[safeIndex];
  const previous = breakpoints[safeIndex - 1] ?? null;
  const next = breakpoints[safeIndex + 1] ?? null;
  const pxIntoCurrent = Math.max(0, width - active.minWidth);
  const pxToNext = next ? Math.max(0, next.minWidth - width) : null;
  const span = next ? next.minWidth - active.minWidth : Math.max(width - active.minWidth, 1);
  const progressPercent = next
    ? Math.min(100, Math.max(0, (pxIntoCurrent / span) * 100))
    : 100;

  return {
    active,
    previous,
    next,
    pxIntoCurrent,
    pxToNext,
    progressPercent,
  };
}

export function getResponsiveImageAdvice(
  cssWidth: number,
  dpr: number,
): ResponsiveImageAdvice {
  const safeCssWidth = Math.max(1, Math.round(cssWidth));
  const safeDpr = Math.max(1, Math.min(4, dpr || 1));
  const requiredPhysicalWidth = Math.ceil(safeCssWidth * safeDpr);
  const candidates = ([1, 2, 3] as const).map((scale) => ({
    scale,
    width: safeCssWidth * scale,
    applies: scale >= Math.ceil(Math.min(safeDpr, 3)),
  }));

  return {
    cssWidth: safeCssWidth,
    dpr: Math.round(safeDpr * 100) / 100,
    requiredPhysicalWidth,
    candidates,
    srcset: candidates.map(({ scale, width }) => `image-${width}.jpg ${scale}x`).join(', '),
    sizes: `(max-width: ${safeCssWidth}px) 100vw, ${safeCssWidth}px`,
  };
}

export function getSlotWidthFromPreset(
  preset: string,
  viewportWidth: number,
  customWidth: number,
): number {
  if (preset === '50vw') return viewportWidth * 0.5;
  if (preset === 'card') return 320;
  if (preset === 'custom') return customWidth;
  return viewportWidth;
}
