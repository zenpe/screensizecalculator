import { useState, useEffect, useLayoutEffect } from 'react';
import type { Breakpoint } from './types';

// SSR-safe useLayoutEffect
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// SSR default values - mobile-first for better SEO (most crawlers use mobile viewport)
export const SSR_DEFAULTS = {
  breakpoint: 'md' as Breakpoint,  // Mobile-first default
  containerWidth: 375,              // iPhone SE width
  containerHeight: 520,
};

/**
 * Hook to detect responsive breakpoint (SSR-safe)
 * Returns mobile breakpoint by default for SSR
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(SSR_DEFAULTS.breakpoint);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      const w = window.innerWidth;
      if (w < 375) setBreakpoint('xs');
      else if (w < 428) setBreakpoint('sm');
      else if (w < 768) setBreakpoint('md');
      else if (w < 1024) setBreakpoint('lg');
      else setBreakpoint('xl');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return breakpoint;
}

/**
 * Hook to get dynamic container size (SSR-safe)
 * Returns mobile-friendly defaults for SSR
 */
export function useContainerSize() {
  const [size, setSize] = useState({
    width: SSR_DEFAULTS.containerWidth,
    height: SSR_DEFAULTS.containerHeight
  });

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setSize({
        width: Math.min(Math.max(vw - 32, 280), 1000),
        height: Math.min(Math.max(vh * 0.6, 400), 700),
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

/**
 * Hook to get container width (for RoomView compatibility)
 */
export function useContainerWidth() {
  const size = useContainerSize();
  return size.width;
}

/**
 * Hook for swipe gesture support
 */
export function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) onSwipeLeft();
    if (isRightSwipe) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

/**
 * Hook to check if current viewport is mobile
 */
export function useIsMobile() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md';
}
