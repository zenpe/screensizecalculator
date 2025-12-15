import { useState, useMemo, useEffect, useRef } from 'react';
import type { Device } from '../data/devices';
import ComparisonVisualizer from './ComparisonVisualizer';
import ScreenCalibration, { getStoredCalibration, getEffectivePpi } from './ScreenCalibration';

interface DeviceDetailVisualizerProps {
  device: Device;
  relatedDevices: Device[];
}

// Calculate physical dimensions from diagonal and aspect ratio
function calculateDimensions(diagonal: number, ratio: number) {
  // Guard against invalid inputs
  if (diagonal <= 0 || ratio <= 0 || !isFinite(diagonal) || !isFinite(ratio)) {
    return { width: 0, height: 0 };
  }
  const height = diagonal / Math.sqrt(ratio * ratio + 1);
  const width = height * ratio;
  return { width, height };
}

// Single device visualization with actual size support and pan mode
function SingleDeviceView({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
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

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate scale to fit container
  const { scale, canShowActualSize } = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { scale: 1, canShowActualSize: false };
    }

    // Guard against invalid dimensions
    if (actualWidthPx <= 0 || actualHeightPx <= 0) {
      return { scale: 1, canShowActualSize: false };
    }

    const padding = isMobile ? 40 : 60;
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    const scaleX = availableWidth / actualWidthPx;
    const scaleY = availableHeight / actualHeightPx;
    const autoScale = Math.min(scaleX, scaleY, 1);

    // Can show actual size if scale is >= 0.95 (fits within 5% of container)
    const canShow = autoScale >= 0.95;

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
          className="absolute left-1/2 top-1/2 transition-transform duration-200"
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
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                fill="url(#screenGrad)"
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
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="50%" stopColor="#1F2937" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width={device.ratio * 100} height="100" rx="3" fill="#4B5563" />
              <rect x="2.5" y="2.5" width={device.ratio * 100 - 5} height="95" rx="1.5" fill="url(#screenGrad)" />
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
}

export default function DeviceDetailVisualizer({ device, relatedDevices }: DeviceDetailVisualizerProps) {
  const [compareDeviceId, setCompareDeviceId] = useState<string>('');
  const [calibratedPpi, setCalibratedPpi] = useState<number>(96);
  const [showActualSize, setShowActualSize] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load calibration on mount
  useEffect(() => {
    const ppi = getEffectivePpi();
    setCalibratedPpi(ppi);

    const stored = getStoredCalibration();
    if (stored) {
      setShowActualSize(true);
      setIsCalibrated(true);
    }
  }, []);

  // Handle calibration update
  const handleCalibrate = (ppi: number) => {
    setCalibratedPpi(ppi);
    setShowActualSize(true);
    setIsCalibrated(true);
  };

  // Find the selected comparison device
  const compareDevice = useMemo(() => {
    if (!compareDeviceId) return null;
    return relatedDevices.find(d => d.id === compareDeviceId) || null;
  }, [compareDeviceId, relatedDevices]);

  return (
    <div className="w-full">
      {/* Controls Bar - Stack vertically on very narrow screens */}
      <div className="mb-2 sm:mb-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
        {/* Compare Dropdown Row */}
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <label className="text-[10px] sm:text-sm text-gray-400 whitespace-nowrap">Compare:</label>
          <select
            value={compareDeviceId}
            onChange={(e) => setCompareDeviceId(e.target.value)}
            className="px-1 sm:px-3 py-1 sm:py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-[10px] sm:text-sm text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-0 flex-1 max-w-[140px] sm:max-w-[200px]"
          >
            <option value="">Select...</option>
            {relatedDevices.slice(0, 10).map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.diagonal}")
              </option>
            ))}
          </select>
          {compareDeviceId && (
            <button
              onClick={() => setCompareDeviceId('')}
              className="p-1 sm:p-1.5 bg-slate-600 hover:bg-slate-500 active:bg-slate-400 text-gray-300 rounded-lg transition-colors flex-shrink-0"
              aria-label="Clear comparison"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Divider - Hidden on mobile */}
        <div className="hidden sm:block w-px h-6 bg-slate-600" />

        {/* Action Buttons Row */}
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {/* Calibration Button */}
          <ScreenCalibration onCalibrate={handleCalibrate} currentPpi={calibratedPpi} />

          {/* Actual Size Toggle (only show when not comparing) */}
          {!compareDevice && (
            <>
              <div className="hidden sm:block w-px h-6 bg-slate-600" />
              <button
                onClick={() => setShowActualSize(!showActualSize)}
                className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-sm transition-colors ${
                  showActualSize
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30'
                    : 'bg-slate-700 text-gray-400 border border-slate-600 hover:bg-slate-600 active:bg-slate-500'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span className="hidden sm:inline">{showActualSize ? 'Actual Size' : 'Proportional'}</span>
                <span className="sm:hidden whitespace-nowrap">{showActualSize ? '1:1' : 'Fit'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Visualization Area - Responsive height */}
      <div className={`bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 rounded-xl p-3 sm:p-4 md:p-6 w-full ${
        isMobile ? 'min-h-[350px]' : 'min-h-[500px]'
      }`}>
        {compareDevice ? (
          // Show comparison visualizer when a device is selected
          <ComparisonVisualizer deviceA={device} deviceB={compareDevice} />
        ) : (
          // Show single device view when no comparison
          <div className={`w-full ${isMobile ? 'h-[300px]' : 'h-[450px]'}`}>
            <SingleDeviceView
              device={device}
              ppi={calibratedPpi}
              showActualSize={showActualSize}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>

      {/* Hints - Shorter on mobile */}
      {!compareDevice && !isCalibrated && relatedDevices.length > 0 && (
        <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 px-4">
          {isMobile
            ? 'Calibrate for actual size display'
            : 'Calibrate your screen to see actual device size, or select a device to compare'
          }
        </p>
      )}
    </div>
  );
}
