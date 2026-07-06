import { describe, expect, it } from 'vitest';
import {
  getActiveBreakpoint,
  getBreakpointProgress,
  getResponsiveImageAdvice,
  getSlotWidthFromPreset,
} from '../viewport';

describe('viewport utilities', () => {
  it('detects Tailwind breakpoints at boundaries', () => {
    expect(getActiveBreakpoint(639, 'tailwind').id).toBe('base');
    expect(getActiveBreakpoint(640, 'tailwind').id).toBe('sm');
    expect(getActiveBreakpoint(768, 'tailwind').id).toBe('md');
    expect(getActiveBreakpoint(1536, 'tailwind').id).toBe('2xl');
  });

  it('detects Bootstrap breakpoints at boundaries', () => {
    expect(getActiveBreakpoint(575, 'bootstrap').id).toBe('xs');
    expect(getActiveBreakpoint(576, 'bootstrap').id).toBe('sm');
    expect(getActiveBreakpoint(992, 'bootstrap').id).toBe('lg');
    expect(getActiveBreakpoint(1400, 'bootstrap').id).toBe('xxl');
  });

  it('calculates next breakpoint distance and progress', () => {
    const progress = getBreakpointProgress(900, 'tailwind');
    expect(progress.active.id).toBe('md');
    expect(progress.next?.id).toBe('lg');
    expect(progress.pxToNext).toBe(124);
    expect(progress.progressPercent).toBeGreaterThan(50);
  });

  it('calculates responsive image candidates', () => {
    const advice = getResponsiveImageAdvice(375, 2.5);
    expect(advice.requiredPhysicalWidth).toBe(938);
    expect(advice.candidates.map((candidate) => candidate.width)).toEqual([375, 750, 1125]);
    expect(advice.srcset).toContain('image-1125.jpg 3x');
  });

  it('converts slot presets to CSS pixel width', () => {
    expect(getSlotWidthFromPreset('100vw', 1200, 640)).toBe(1200);
    expect(getSlotWidthFromPreset('50vw', 1200, 640)).toBe(600);
    expect(getSlotWidthFromPreset('card', 1200, 640)).toBe(320);
    expect(getSlotWidthFromPreset('custom', 1200, 640)).toBe(640);
  });
});
