import { useState, useMemo, useEffect, useLayoutEffect, useRef, lazy, Suspense, memo, useId, useCallback } from 'react';
import type { Device } from '../data/devices';
import { calculateDimensions } from '../data/devices';
import { getComparisonLink } from '../utils/url';
import ScreenCalibration, { getStoredCalibration, getEffectivePpi } from './ScreenCalibration';

// Lazy load ComparisonVisualizer only when needed
const ComparisonVisualizer = lazy(() => import('./ComparisonVisualizer'));

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Skeleton component for loading state
function DeviceVisualizerSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="w-full">
      {/* Controls Bar skeleton */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 rounded-xl border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-4">
          {/* Compare Section skeleton */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-700 animate-pulse"></div>
            <div className="flex flex-col gap-1">
              <div className="h-3 w-16 bg-slate-700 rounded animate-pulse"></div>
              <div className="h-8 w-[130px] sm:w-[180px] bg-slate-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-slate-600/50" />
          <div className="sm:hidden h-px w-full bg-slate-600/50" />
          {/* Tools Section skeleton */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div className="h-9 w-24 bg-slate-700 rounded-lg animate-pulse"></div>
            <div className="h-9 w-24 bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Visualization Area skeleton */}
      <div className={`bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 rounded-xl w-full p-3 sm:p-4 md:p-6 ${
        isMobile ? 'min-h-[350px]' : 'min-h-[500px]'
      }`}>
        <div className={`w-full ${isMobile ? 'h-[300px]' : 'h-[450px]'} flex flex-col`}>
          {/* Status bar skeleton */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-7 w-20 bg-slate-700/50 rounded-lg animate-pulse"></div>
          </div>
          {/* Device visualization skeleton */}
          <div className="flex-1 relative overflow-hidden rounded-xl bg-gray-900/30 flex items-center justify-center">
            <div
              className="bg-slate-800/60 rounded border-2 border-slate-600 animate-pulse"
              style={{
                width: isMobile ? '70%' : '60%',
                aspectRatio: '16/9',
                maxWidth: '500px',
              }}
            ></div>
          </div>
          {/* Info text skeleton */}
          <div className="flex justify-center mt-4">
            <div className="h-3 w-40 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Constants for layout calculations
const PADDING_MOBILE = 40;
const PADDING_DESKTOP = 60;
const ACTUAL_SIZE_THRESHOLD = 0.95; // Can show actual size if scale >= 95%

// SSR default values
const SSR_DEFAULTS = {
  containerWidth: 600,
  containerHeight: 400,
  isMobile: false,
  ppi: 96,
};

interface DeviceDetailVisualizerProps {
  device: Device;
  relatedDevices: Device[];
}

// Single device visualization with actual size support and pan mode
const SingleDeviceView = memo(function SingleDeviceView({
  device,
  ppi,
  showActualSize,
  isMobile,
}: {
  device: Device;
  ppi: number;
  showActualSize: boolean;
  isMobile: boolean;
}) {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: SSR_DEFAULTS.containerWidth,
    height: SSR_DEFAULTS.containerHeight
  });
  const [isReady, setIsReady] = useState(false); // Track when measurements are ready
  const [isPanMode, setIsPanMode] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const dims = calculateDimensions(device.diagonal, device.ratio);
  const isPortraitDevice = device.category === 'phone' || device.category === 'tablet';

  // For phones and tablets, swap width/height for portrait mode
  const displayDims = isPortraitDevice ? { width: dims.height, height: dims.width } : dims;

  // Calculate actual size in pixels based on PPI
  const actualWidthPx = displayDims.width * ppi;
  const actualHeightPx = displayDims.height * ppi;

  // Measure container synchronously before paint using useLayoutEffect
  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;

    // Immediate synchronous measurement before browser paint
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerSize({ width: rect.width, height: rect.height });
      setIsReady(true); // Mark as ready after initial measurement
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
        if (!isReady) setIsReady(true);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate scale to fit container
  const { scale, canShowActualSize } = useMemo(() => {
    // Guard against invalid dimensions
    if (actualWidthPx <= 0 || actualHeightPx <= 0) {
      return { scale: 0.5, canShowActualSize: false };
    }

    const padding = isMobile ? PADDING_MOBILE : PADDING_DESKTOP;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    const scaleX = availableWidth / actualWidthPx;
    const scaleY = availableHeight / actualHeightPx;
    const autoScale = Math.min(scaleX, scaleY, 1);

    const canShow = autoScale >= ACTUAL_SIZE_THRESHOLD;

    return { scale: autoScale, canShowActualSize: canShow };
  }, [containerSize, actualWidthPx, actualHeightPx, isMobile]);

  const isScaled = scale < 0.99;
  const scalePercent = Math.round(scale * 100);

  // Use actual size when enabled and possible, or when in pan mode
  const useActualSize = showActualSize && (canShowActualSize || isPanMode);
  const displayScale = isPanMode ? 1 : (useActualSize ? 1 : scale);

  // Display dimensions
  const displayWidthPx = actualWidthPx * displayScale;
  const displayHeightPx = actualHeightPx * displayScale;

  // Pan mode handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPanMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isPanMode) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isPanMode || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isPanMode || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent page scroll while panning
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const togglePanMode = () => {
    setIsPanMode((prev) => {
      if (prev) {
        setPanOffset({ x: 0, y: 0 });
      }
      return !prev;
    });
  };

  // Reset pan state when device changes
  useEffect(() => {
    setIsPanMode(false);
    setPanOffset({ x: 0, y: 0 });
  }, [device.id]);

  // SVG viewBox - portrait devices have width 100, landscape have height 100
  const svgViewBox = isPortraitDevice
    ? `0 0 100 ${100 * device.ratio}`
    : `0 0 ${device.ratio * 100} 100`;

  return (
    <div className="text-center w-full h-full flex flex-col">
      {/* Status bar - Compact on mobile */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-2 sm:mb-4 flex-wrap px-1 sm:px-2">
        {/* Scale indicator */}
        {showActualSize && (
          <div
            className={`px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-medium ${
              isPanMode || (useActualSize && !isScaled)
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : isScaled
                ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
            }`}
          >
            {isPanMode ? (
              '1:1 Size'
            ) : useActualSize ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Actual Size</span>
                <span className="sm:hidden">1:1</span>
              </span>
            ) : (
              `${scalePercent}%`
            )}
          </div>
        )}

        {/* Pan mode toggle - show when scaled and actual size is enabled */}
        {showActualSize && isScaled && !canShowActualSize && (
          <button
            onClick={togglePanMode}
            className={`px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
              isPanMode
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 active:bg-gray-500 border border-gray-600'
            }`}
          >
            {isPanMode ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Exit</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="hidden sm:inline">View 1:1</span>
                <span className="sm:hidden">1:1</span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Visualization container */}
      <div
        ref={containerRef}
        className={`flex-1 relative overflow-hidden rounded-xl bg-gray-900/30 ${
          isPanMode ? 'cursor-grab active:cursor-grabbing touch-none' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Device SVG */}
        <div
          className="absolute left-1/2 top-1/2 transition-all duration-300 ease-out"
          style={{
            transform: isPanMode
              ? `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px))`
              : 'translate(-50%, -50%)',
          }}
        >
          {isPortraitDevice ? (
            // Portrait devices (phone, tablet)
            <svg
              viewBox={svgViewBox}
              className="drop-shadow-2xl"
              style={{ height: `${displayHeightPx}px` }}
            >
              <defs>
                <linearGradient id={`screenGrad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="50%" stopColor="#1F2937" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>
              {/* Device frame - phones have more rounded corners */}
              <rect
                x="0" y="0"
                width="100" height={100 * device.ratio}
                rx={device.category === 'phone' ? 18 : 8}
                fill="#1F2937"
              />
              <rect
                x="2" y="2"
                width="96" height={100 * device.ratio - 4}
                rx={device.category === 'phone' ? 16 : 6}
                fill={`url(#screenGrad-${gradientId})`}
              />
              {/* Phone-specific elements: notch and home indicator */}
              {device.category === 'phone' && (
                <>
                  <rect x="35" y="5" width="30" height="3" rx="1.5" fill="#000" />
                  <rect x="32" y={100 * device.ratio - 6} width="36" height="1.5" rx="0.75" fill="#4B5563" />
                </>
              )}
              {/* Tablet-specific elements: camera dot */}
              {device.category === 'tablet' && (
                <circle cx="50" cy="8" r="2" fill="#000" />
              )}
              <text x="50" y={50 * device.ratio} textAnchor="middle" className="fill-white" style={{ fontSize: '12px', fontWeight: 'bold' }}>{device.diagonal}"</text>
              <text x="50" y={50 * device.ratio + 8} textAnchor="middle" className="fill-gray-300" style={{ fontSize: '4px' }}>{displayDims.width.toFixed(2)}" × {displayDims.height.toFixed(2)}"</text>
            </svg>
          ) : (
            // Landscape devices (monitor, tv, projector)
            <svg
              viewBox={svgViewBox}
              className="drop-shadow-2xl"
              style={{ width: `${displayWidthPx}px` }}
            >
              <defs>
                <linearGradient id={`screenGrad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="50%" stopColor="#1F2937" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width={device.ratio * 100} height="100" rx="3" fill="#4B5563" />
              <rect x="2.5" y="2.5" width={device.ratio * 100 - 5} height="95" rx="1.5" fill={`url(#screenGrad-${gradientId})`} />
              <text x={device.ratio * 50} y="42" textAnchor="middle" className="fill-white" style={{ fontSize: '18px', fontWeight: 'bold' }}>{device.diagonal}"</text>
              <text x={device.ratio * 50} y="58" textAnchor="middle" className="fill-gray-300" style={{ fontSize: '7px' }}>{displayDims.width.toFixed(2)}" × {displayDims.height.toFixed(2)}"</text>
            </svg>
          )}
        </div>

        {/* Pan mode instructions - More compact on mobile */}
        {isPanMode && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gray-900/90 text-xs sm:text-sm text-gray-300 backdrop-blur-sm whitespace-nowrap">
            {isMobile ? 'Drag to pan' : 'Drag to pan • Viewing at actual size'}
          </div>
        )}

        {/* Grid overlay for pan mode */}
        {isPanMode && (
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
              `,
              backgroundSize: `${ppi}px ${ppi}px`,
              transform: `translate(${panOffset.x % ppi}px, ${panOffset.y % ppi}px)`,
            }}
          />
        )}
      </div>

      {/* Info text - Shorter on mobile */}
      <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4 px-2">
        {isPanMode ? (
          isMobile ? `${ppi.toFixed(0)} PPI` : `Displayed at ${ppi.toFixed(0)} PPI • 1 inch grid overlay`
        ) : useActualSize ? (
          isMobile ? `${ppi.toFixed(0)} PPI calibrated` : `Displayed at ${ppi.toFixed(0)} PPI - matches your calibrated screen`
        ) : showActualSize && isScaled ? (
          isMobile ? `${scalePercent}% of ${device.diagonal}"` : `Device too large for actual size (${device.diagonal}") • Showing at ${scalePercent}% scale`
        ) : (
          'Proportional view'
        )}
      </p>
    </div>
  );
});

// Initialize state from browser APIs (runs once on module load for SSR safety)
function getInitialState() {
  if (typeof window === 'undefined') {
    return { isMobile: false, ppi: 96, isCalibrated: false, showActualSize: false };
  }
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const ppi = getEffectivePpi();
  const stored = getStoredCalibration();
  return {
    isMobile,
    ppi,
    isCalibrated: !!stored,
    showActualSize: !!stored,
  };
}

export default function DeviceDetailVisualizer({
  device,
  relatedDevices,
}: DeviceDetailVisualizerProps) {
  // Hydration state for SSR
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize all state synchronously to avoid layout shifts
  const [initialState] = useState(getInitialState);
  const [calibratedPpi, setCalibratedPpi] = useState<number>(initialState.ppi);
  const [showActualSize, setShowActualSize] = useState<boolean>(initialState.showActualSize);
  const [isMobile, setIsMobile] = useState(initialState.isMobile);
  const [isCalibrated, setIsCalibrated] = useState(initialState.isCalibrated);
  const [compareDevice, setCompareDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Listen for resize changes only
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle calibration update
  const handleCalibrate = (ppi: number) => {
    setCalibratedPpi(ppi);
    setShowActualSize(true);
    setIsCalibrated(true);
  };

  // Handle compare device selection - open modal
  const handleCompareChange = useCallback((deviceId: string) => {
    if (deviceId) {
      const selected = relatedDevices.find(d => d.id === deviceId) || null;
      setCompareDevice(selected);
      setIsModalOpen(true);
    }
  }, [relatedDevices]);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCompareDevice(null);
  }, []);

  // Handle body overflow and escape key when modal is open
  useEffect(() => {
    if (!isModalOpen) return;

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEscape);

    // Cleanup: restore overflow and remove listener
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen, closeModal]);

  // Transition class for smooth hydration
  const transitionClass = isHydrated ? 'transition-all duration-300 ease-out' : '';

  return (
    <div className="w-full">
      {/* Controls Bar */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-4">
          {/* Compare Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary-500/20 text-primary-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <label htmlFor="compare-device-select" className="text-[10px] sm:text-xs text-slate-400 mb-0.5">Compare with</label>
              <select
                id="compare-device-select"
                value=""
                onChange={(e) => handleCompareChange(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700/80 border border-slate-600/50 rounded-lg text-xs sm:text-sm text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[130px] sm:min-w-[180px] cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <option value="">Select device...</option>
                {relatedDevices.slice(0, 10).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.diagonal}")
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-slate-600/50" />
          <div className="sm:hidden h-px w-full bg-slate-600/50" />

          {/* Tools Section */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {/* Calibration Button */}
            <ScreenCalibration onCalibrate={handleCalibrate} currentPpi={calibratedPpi} />

            {/* Actual Size Toggle */}
            <button
              onClick={() => setShowActualSize(!showActualSize)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                showActualSize
                  ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-700/80 text-slate-300 border border-slate-600/50 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>{showActualSize ? '1:1 Size' : 'Fit View'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visualization Area - Single device view only */}
      <div className={`bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 rounded-xl w-full p-3 sm:p-4 md:p-6 ${transitionClass} ${
        isMobile ? 'min-h-[350px]' : 'min-h-[500px]'
      }`}>
        <div className={`w-full ${transitionClass} ${isMobile ? 'h-[300px]' : 'h-[450px]'}`}>
          <SingleDeviceView
            device={device}
            ppi={calibratedPpi}
            showActualSize={showActualSize}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Hints - Shorter on mobile */}
      {!isCalibrated && relatedDevices.length > 0 && (
        <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 px-4">
          {isMobile
            ? 'Calibrate for actual size display'
            : 'Calibrate your screen to see actual device size, or select a device to compare'
          }
        </p>
      )}

      {/* Full Screen Comparison Modal */}
      {isModalOpen && compareDevice && (() => {
        const comparisonLinkData = getComparisonLink(device.id, compareDevice.id);
        return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full h-full max-w-7xl max-h-[95vh] m-2 sm:m-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-slate-700/50 animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Size Comparison
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {device.name} vs {compareDevice.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={comparisonLinkData.href}
                  rel={comparisonLinkData.rel}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Full Page
                </a>
                <button
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                  aria-label="Close comparison"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - ComparisonVisualizer */}
            <div className="flex-1 overflow-auto">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-slate-400 text-sm">Loading comparison...</div>
                  </div>
                </div>
              }>
                <ComparisonVisualizer deviceA={device} deviceB={compareDevice} />
              </Suspense>
            </div>

            {/* Modal Footer - Mobile link */}
            <div className="sm:hidden flex justify-center py-3 bg-slate-800/50 border-t border-slate-700/50">
              <a
                href={comparisonLinkData.href}
                rel={comparisonLinkData.rel}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Full Page
              </a>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
