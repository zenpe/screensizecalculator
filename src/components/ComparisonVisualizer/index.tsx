import { useState, useMemo, useEffect } from 'react';
import type { ComparisonVisualizerProps, DisplayMode, Dimensions } from './types';
import { useBreakpoint, useContainerSize, useSwipeGesture, useIsMobile } from './hooks';
import {
  processComparisonData,
  calculateScaleFactor,
  getFixedContainerHeight,
} from './utils';
import { RoomView, OverlayView, SideBySideView } from './views';

export default function ComparisonVisualizer({ deviceA, deviceB }: ComparisonVisualizerProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('overlay');
  const [isHydrated, setIsHydrated] = useState(false);
  const breakpoint = useBreakpoint();
  const containerSize = useContainerSize();
  const isMobile = useIsMobile();

  // Track hydration for smooth transition
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Process comparison data
  const comparisonData = useMemo(
    () => processComparisonData(deviceA, deviceB),
    [deviceA, deviceB]
  );

  const { larger, smaller, isPhoneComparison, isLargeScreenComparison, areSameSize, sizeDiffPercent } = comparisonData;

  const isStacked = isMobile && displayMode === 'side-by-side';

  // Fixed container height based on breakpoint
  const fixedContainerHeight = useMemo(
    () => getFixedContainerHeight(breakpoint),
    [breakpoint]
  );

  // Calculate scale factor
  const scaleFactor = useMemo(
    () => calculateScaleFactor(
      displayMode,
      larger,
      smaller,
      containerSize.width,
      fixedContainerHeight,
      breakpoint
    ),
    [displayMode, larger, smaller, containerSize.width, fixedContainerHeight, breakpoint]
  );

  const largerScaled: Dimensions = {
    width: larger.dims.width * scaleFactor,
    height: larger.dims.height * scaleFactor,
  };

  const smallerScaled: Dimensions = {
    width: smaller.dims.width * scaleFactor,
    height: smaller.dims.height * scaleFactor,
  };

  const containerHeight = fixedContainerHeight;

  // Mode switching functions for swipe gestures
  const modes: DisplayMode[] = isLargeScreenComparison
    ? ['overlay', 'side-by-side', 'room-view']
    : ['overlay', 'side-by-side'];

  const nextMode = () => {
    const currentIndex = modes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setDisplayMode(modes[nextIndex]);
  };

  const prevMode = () => {
    const currentIndex = modes.indexOf(displayMode);
    const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
    setDisplayMode(modes[prevIndex]);
  };

  // Swipe gesture handlers
  const swipeHandlers = useSwipeGesture(nextMode, prevMode);

  // Transition class for smooth hydration
  const transitionClass = isHydrated ? 'transition-all duration-300 ease-out' : '';

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      {/* Mode Toggle - fixed height header */}
      <div className="h-[60px] flex justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-4 bg-slate-800/50 border-b border-slate-700">
        <button
          onClick={() => setDisplayMode('overlay')}
          className={`h-[36px] px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            displayMode === 'overlay'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Overlay
        </button>
        <button
          onClick={() => setDisplayMode('side-by-side')}
          className={`h-[36px] px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            displayMode === 'side-by-side'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {isMobile ? 'Stack' : 'Side by Side'}
        </button>
        {isLargeScreenComparison && (
          <button
            onClick={() => setDisplayMode('room-view')}
            className={`h-[36px] px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              displayMode === 'room-view'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Room
          </button>
        )}
      </div>

      {/* Swipe hint - fixed height, always rendered */}
      <div className={`h-[20px] text-center text-[10px] text-slate-500 bg-slate-800/30 ${isMobile ? '' : 'invisible'}`}>
        {isMobile && 'Swipe left/right to switch modes'}
      </div>

      {/* Visualization Container - fixed height with smooth transitions */}
      <div
        className={`relative select-none overflow-hidden ${transitionClass}`}
        style={{ height: `${containerHeight}px` }}
        role="img"
        aria-label={`Visual comparison of ${larger.device.name} and ${smaller.device.name}`}
        {...swipeHandlers}
      >
        {/* Content wrapper with smooth size transitions */}
        <div className={`absolute inset-0 flex justify-center items-center p-3 sm:p-6 ${transitionClass}`}>
          {displayMode === 'room-view' ? (
            <RoomView
              larger={larger}
              smaller={smaller}
              isMobile={isMobile}
              availableHeight={containerHeight}
            />
          ) : displayMode === 'side-by-side' ? (
            <SideBySideView
              larger={larger}
              smaller={smaller}
              largerScaled={largerScaled}
              smallerScaled={smallerScaled}
              isStacked={isStacked}
            />
          ) : (
            <OverlayView
              larger={larger}
              smaller={smaller}
              largerScaled={largerScaled}
              smallerScaled={smallerScaled}
              areSameSize={areSameSize}
              sizeDiffPercent={sizeDiffPercent}
              isPhoneComparison={isPhoneComparison}
              isLargeScreenComparison={isLargeScreenComparison}
            />
          )}
        </div>

        {/* Scale Reference - absolutely positioned */}
        {displayMode !== 'room-view' && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-xs text-slate-500">
            {(scaleFactor * 10).toFixed(1)}px/inch
          </div>
        )}
      </div>

      {/* Footer - Fixed height, no wrap to prevent reflow */}
      <div className="h-[48px] flex justify-center items-center gap-2 sm:gap-8 px-2 sm:px-4 bg-slate-800/50 border-t border-slate-700 overflow-hidden">
        {displayMode === 'side-by-side' ? (
          <>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="w-3 h-2 sm:w-4 sm:h-3 border-2 border-solid border-slate-400 bg-slate-800/50 rounded flex-shrink-0"></div>
              <span className="text-[9px] sm:text-sm text-slate-400 truncate">{larger.device.name}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="w-3 h-2 sm:w-4 sm:h-3 border-2 border-solid border-cyan-400 bg-slate-700/70 rounded flex-shrink-0"></div>
              <span className="text-[9px] sm:text-sm text-cyan-300 truncate">{smaller.device.name}</span>
            </div>
          </>
        ) : (
          <div className="text-[10px] sm:text-xs text-slate-500">
            {displayMode === 'overlay' ? 'Overlay comparison view' : 'Room scale view'}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export types for external use
export type { ComparisonVisualizerProps, DisplayMode } from './types';
