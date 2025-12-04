import { useState, useMemo, useEffect } from 'react';
import type { Device } from '../data/devices';

/**
 * ComparisonVisualizer - Visual overlay comparison of two screen sizes
 *
 * Features:
 * - Side by Side and Overlay display modes
 * - Portrait orientation for phones
 * - Phone-like appearance with rounded corners and home indicator
 * - Offset for same-size devices in overlay mode
 * - Responsive: stacked layout on mobile
 * - Bottom-aligned for phone comparisons
 */

interface Dimensions {
  width: number;
  height: number;
}

interface DeviceWithDimensions {
  device: Device;
  dims: Dimensions;
  area: number;
}

interface ComparisonVisualizerProps {
  deviceA: Device;
  deviceB: Device;
}

type DisplayMode = 'side-by-side' | 'overlay';

// Calculate physical dimensions from diagonal and aspect ratio
function calculateDimensions(diagonal: number, ratio: number): Dimensions {
  const height = diagonal / Math.sqrt(ratio * ratio + 1);
  const width = height * ratio;
  return { width, height };
}

// Phone frame component with realistic appearance
function PhoneFrame({
  width,
  height,
  label,
  diagonal,
  isLarger,
  isOverlayMode,
  showLabel = true,
  showDiagonal = true,
  physicalDims,
}: {
  width: number;
  height: number;
  label: string;
  diagonal: number;
  isLarger: boolean;
  isOverlayMode: boolean;
  showLabel?: boolean;
  showDiagonal?: boolean;
  physicalDims?: Dimensions; // Original physical dimensions in inches
}) {
  // In side-by-side mode, both phones use solid border
  // In overlay mode, larger (background) uses dashed, smaller (foreground) uses solid
  const useDashed = isOverlayMode && isLarger;

  const borderColor = isLarger ? 'border-slate-400' : 'border-cyan-400';
  const bgColor = isLarger ? 'bg-slate-800/60' : 'bg-slate-700/80';
  const textColor = isLarger ? 'text-slate-300' : 'text-cyan-300';
  const subTextColor = isLarger ? 'text-slate-500' : 'text-cyan-400/70';

  // Dynamic sizing for internal elements
  const notchWidth = Math.max(width * 0.3, 24);
  const notchHeight = Math.max(height * 0.015, 5);
  const homeWidth = Math.max(width * 0.4, 32);
  const homeHeight = Math.max(height * 0.006, 3);
  const fontSize = Math.max(Math.min(width * 0.15, 20), 12);
  const borderRadius = Math.min(width, height) * 0.1;

  // Calculate physical dimensions in mm (height x width for portrait phone)
  const heightMm = physicalDims ? (physicalDims.height * 25.4).toFixed(0) : '';
  const widthMm = physicalDims ? (physicalDims.width * 25.4).toFixed(0) : '';

  return (
    <div className="flex flex-col items-center">
      {/* Phone body */}
      <div
        className={`relative ${bgColor} ${borderColor} flex flex-col overflow-hidden`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderWidth: useDashed ? '2px' : '3px',
          borderStyle: useDashed ? 'dashed' : 'solid',
          borderRadius: `${borderRadius}px`,
          boxShadow: isLarger && isOverlayMode ? 'none' : '0 4px 20px rgba(34, 211, 238, 0.2)',
        }}
      >
        {/* Notch / Dynamic Island */}
        <div className="flex justify-center" style={{ paddingTop: `${Math.max(height * 0.02, 4)}px` }}>
          <div
            className="bg-slate-900 rounded-full"
            style={{
              width: `${notchWidth}px`,
              height: `${notchHeight}px`,
            }}
          />
        </div>

        {/* Screen content area */}
        <div className="flex-1 flex items-center justify-center">
          {showDiagonal && (
            <div
              className={`${isLarger ? 'text-slate-500' : 'text-cyan-400'} font-bold`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {diagonal}"
            </div>
          )}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center" style={{ paddingBottom: `${Math.max(height * 0.015, 3)}px` }}>
          <div
            className={`${isLarger ? 'bg-slate-600' : 'bg-slate-500'} rounded-full`}
            style={{
              width: `${homeWidth}px`,
              height: `${homeHeight}px`,
            }}
          />
        </div>
      </div>

      {/* Label below phone */}
      {showLabel && physicalDims && (
        <div className={`mt-3 text-center ${textColor}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          <div className={`text-xs ${subTextColor}`}>
            {heightMm} × {widthMm}mm
          </div>
        </div>
      )}
    </div>
  );
}

// Generic screen frame for TVs, monitors, projectors
function ScreenFrame({
  width,
  height,
  isLarger,
  isOverlayMode,
  label,
  diagonal,
  dims,
  showLabel = true,
  showDiagonal = true,
}: {
  width: number;
  height: number;
  isLarger: boolean;
  isOverlayMode: boolean;
  label: string;
  diagonal: number;
  dims: Dimensions;
  showLabel?: boolean;
  showDiagonal?: boolean;
}) {
  // In side-by-side mode, both screens use solid border
  // In overlay mode, larger (background) uses dashed, smaller (foreground) uses solid
  const useDashed = isOverlayMode && isLarger;

  const borderColor = isLarger ? 'border-slate-500' : 'border-cyan-400';
  const bgColor = isLarger ? 'bg-slate-800/50' : 'bg-slate-700/70';
  const fontSize = Math.max(Math.min(width * 0.08, 20), 12);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${bgColor} ${borderColor} rounded-lg flex items-center justify-center`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderWidth: useDashed ? '2px' : '3px',
          borderStyle: useDashed ? 'dashed' : 'solid',
          boxShadow: isLarger && isOverlayMode ? 'none' : '0 4px 20px rgba(34, 211, 238, 0.2)',
        }}
      >
        {/* Diagonal */}
        {showDiagonal && (
          <div
            className={`${isLarger ? 'text-slate-500' : 'text-cyan-400'} font-bold`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {diagonal}"
          </div>
        )}
      </div>

      {/* Label below screen */}
      {showLabel && (
        <div className={`mt-3 text-center ${isLarger ? 'text-slate-400' : 'text-cyan-300'}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          <div className={`text-xs ${isLarger ? 'text-slate-500' : 'text-cyan-400/70'}`}>
            {dims.width.toFixed(1)}" × {dims.height.toFixed(1)}"
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export default function ComparisonVisualizer({ deviceA, deviceB }: ComparisonVisualizerProps) {
  // Default to overlay mode
  const [displayMode, setDisplayMode] = useState<DisplayMode>('overlay');
  const isMobile = useIsMobile();

  // Calculate physical dimensions for both devices
  const { larger, smaller, isPhoneComparison, areSameSize, sizeDiffPercent } = useMemo(() => {
    const dimsA = calculateDimensions(deviceA.diagonal, deviceA.ratio);
    const dimsB = calculateDimensions(deviceB.diagonal, deviceB.ratio);

    const areaA = dimsA.width * dimsA.height;
    const areaB = dimsB.width * dimsB.height;

    // Check if both are phones
    const isPhone = deviceA.category === 'phone' && deviceB.category === 'phone';

    // For phones, swap width/height to display in portrait mode
    const adjustDims = (dims: Dimensions, category: string): Dimensions => {
      if (category === 'phone') {
        return { width: dims.height, height: dims.width };
      }
      return dims;
    };

    const adjustedDimsA = adjustDims(dimsA, deviceA.category);
    const adjustedDimsB = adjustDims(dimsB, deviceB.category);

    const largerDevice: DeviceWithDimensions = areaA >= areaB
      ? { device: deviceA, dims: adjustedDimsA, area: areaA }
      : { device: deviceB, dims: adjustedDimsB, area: areaB };

    const smallerDevice: DeviceWithDimensions = areaA < areaB
      ? { device: deviceA, dims: adjustedDimsA, area: areaA }
      : { device: deviceB, dims: adjustedDimsB, area: areaB };

    // Check if sizes are very similar (within 5%)
    const sizeDiff = Math.abs(areaA - areaB) / Math.max(areaA, areaB);
    const sameSize = sizeDiff < 0.05;

    return {
      larger: largerDevice,
      smaller: smallerDevice,
      isPhoneComparison: isPhone,
      areSameSize: sameSize,
      sizeDiffPercent: sizeDiff * 100,
    };
  }, [deviceA, deviceB]);

  // Effective display mode: on mobile, side-by-side becomes stacked
  const effectiveMode = displayMode;
  const isStacked = isMobile && displayMode === 'side-by-side';

  // Calculate scale factor based on viewport and mode
  const scaleFactor = useMemo(() => {
    // Container dimensions - responsive
    const containerHeight = isMobile ? 500 : 450;
    const containerWidth = isMobile ? 320 : 750;

    if (displayMode === 'side-by-side') {
      if (isMobile) {
        // Stacked: each device should fit in ~45% of height
        const maxDeviceWidth = Math.max(larger.dims.width, smaller.dims.width);
        const maxDeviceHeight = Math.max(larger.dims.height, smaller.dims.height);

        const scaleByWidth = (containerWidth * 0.85) / maxDeviceWidth;
        const scaleByHeight = (containerHeight * 0.4) / maxDeviceHeight;

        return Math.min(scaleByWidth, scaleByHeight);
      } else {
        // Side by side: each device takes ~40% of width
        const maxDeviceWidth = Math.max(larger.dims.width, smaller.dims.width);
        const maxDeviceHeight = Math.max(larger.dims.height, smaller.dims.height);

        const scaleByWidth = (containerWidth * 0.4) / maxDeviceWidth;
        const scaleByHeight = (containerHeight * 0.7) / maxDeviceHeight;

        return Math.min(scaleByWidth, scaleByHeight);
      }
    } else {
      // Overlay mode
      const scaleByHeight = (containerHeight * 0.6) / larger.dims.height;
      const scaleByWidth = (containerWidth * (isMobile ? 0.8 : 0.6)) / larger.dims.width;

      return Math.min(scaleByHeight, scaleByWidth);
    }
  }, [displayMode, larger, smaller, isMobile]);

  // Scaled dimensions
  const largerScaled: Dimensions = {
    width: larger.dims.width * scaleFactor,
    height: larger.dims.height * scaleFactor,
  };

  const smallerScaled: Dimensions = {
    width: smaller.dims.width * scaleFactor,
    height: smaller.dims.height * scaleFactor,
  };

  // Container height based on mode
  const containerHeight = isMobile
    ? (isStacked ? 580 : 450)
    : 480;

  // Calculate the height difference for bottom alignment in overlay mode
  const heightDiff = largerScaled.height - smallerScaled.height;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 p-3 sm:p-4 bg-slate-800/50 border-b border-slate-700">
        <button
          onClick={() => setDisplayMode('overlay')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            displayMode === 'overlay'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Overlay
        </button>
        <button
          onClick={() => setDisplayMode('side-by-side')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            displayMode === 'side-by-side'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {isMobile ? 'Stacked' : 'Side by Side'}
        </button>
      </div>

      {/* Visualization Container */}
      <div
        className="relative flex justify-center items-center p-4 sm:p-8"
        style={{ minHeight: `${containerHeight}px` }}
        role="img"
        aria-label={`Visual comparison of ${larger.device.name} and ${smaller.device.name}`}
      >
        {effectiveMode === 'side-by-side' ? (
          /* Side by Side / Stacked Mode */
          <div className={`flex justify-center ${isStacked ? 'flex-col items-center gap-6' : 'flex-row items-end gap-8 md:gap-16'}`}>
            {isPhoneComparison ? (
              <>
                <PhoneFrame
                  width={largerScaled.width}
                  height={largerScaled.height}
                  label={larger.device.name}
                  diagonal={larger.device.diagonal}
                  isLarger={true}
                  isOverlayMode={false}
                  physicalDims={larger.dims}
                />
                <PhoneFrame
                  width={smallerScaled.width}
                  height={smallerScaled.height}
                  label={smaller.device.name}
                  diagonal={smaller.device.diagonal}
                  isLarger={false}
                  isOverlayMode={false}
                  physicalDims={smaller.dims}
                />
              </>
            ) : (
              <>
                <ScreenFrame
                  width={largerScaled.width}
                  height={largerScaled.height}
                  isLarger={true}
                  isOverlayMode={false}
                  label={larger.device.name}
                  diagonal={larger.device.diagonal}
                  dims={larger.dims}
                />
                <ScreenFrame
                  width={smallerScaled.width}
                  height={smallerScaled.height}
                  isLarger={false}
                  isOverlayMode={false}
                  label={smaller.device.name}
                  diagonal={smaller.device.diagonal}
                  dims={smaller.dims}
                />
              </>
            )}
          </div>
        ) : (
          /* Overlay Mode */
          <div className="relative flex flex-col items-center">
            {/* Similar size indicator */}
            {areSameSize && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 text-slate-900 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                Similar sizes ({sizeDiffPercent.toFixed(1)}% diff)
              </div>
            )}

            {/* Devices container with bottom alignment */}
            <div
              className="relative flex items-end justify-center"
              style={{
                minHeight: `${largerScaled.height + 60}px`,
                minWidth: `${Math.max(largerScaled.width, smallerScaled.width) + (areSameSize ? 60 : 0)}px`
              }}
            >
              {isPhoneComparison ? (
                <>
                  {/* Larger phone (background) - bottom aligned */}
                  <div
                    className="absolute bottom-0 transition-transform duration-300"
                    style={{
                      transform: areSameSize ? 'translateX(-25px)' : 'none',
                    }}
                  >
                    <PhoneFrame
                      width={largerScaled.width}
                      height={largerScaled.height}
                      label={larger.device.name}
                      diagonal={larger.device.diagonal}
                      isLarger={true}
                      isOverlayMode={true}
                      showLabel={false}
                      showDiagonal={false}
                    />
                  </div>
                  {/* Smaller phone (foreground) - bottom aligned */}
                  <div
                    className="relative z-10 transition-transform duration-300"
                    style={{
                      transform: areSameSize ? 'translateX(25px)' : 'none',
                    }}
                  >
                    <PhoneFrame
                      width={smallerScaled.width}
                      height={smallerScaled.height}
                      label={smaller.device.name}
                      diagonal={smaller.device.diagonal}
                      isLarger={false}
                      isOverlayMode={true}
                      showLabel={false}
                      showDiagonal={false}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Larger screen (background) - bottom aligned */}
                  <div
                    className="absolute bottom-0 transition-transform duration-300"
                    style={{
                      transform: areSameSize ? 'translateX(-30px)' : 'none',
                    }}
                  >
                    <ScreenFrame
                      width={largerScaled.width}
                      height={largerScaled.height}
                      isLarger={true}
                      isOverlayMode={true}
                      label={larger.device.name}
                      diagonal={larger.device.diagonal}
                      dims={larger.dims}
                      showLabel={false}
                      showDiagonal={false}
                    />
                  </div>
                  {/* Smaller screen (foreground) - bottom aligned */}
                  <div
                    className="relative z-10 transition-transform duration-300"
                    style={{
                      transform: areSameSize ? 'translateX(30px)' : 'none',
                    }}
                  >
                    <ScreenFrame
                      width={smallerScaled.width}
                      height={smallerScaled.height}
                      isLarger={false}
                      isOverlayMode={true}
                      label={smaller.device.name}
                      diagonal={smaller.device.diagonal}
                      dims={smaller.dims}
                      showLabel={false}
                      showDiagonal={false}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Labels below - always visible in overlay mode, positioned separately */}
            <div className="flex justify-center gap-6 sm:gap-12 mt-6 w-full">
              <div className="text-center text-slate-400 flex-1 max-w-[140px] sm:max-w-[180px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-4 h-3 border-2 border-dashed border-slate-400 bg-slate-800/50 rounded"></div>
                  <span className="font-medium text-sm truncate">{larger.device.name}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {larger.device.diagonal}" &middot; {isPhoneComparison
                    ? `${(larger.dims.height * 25.4).toFixed(0)} × ${(larger.dims.width * 25.4).toFixed(0)}mm`
                    : `${larger.dims.width.toFixed(1)}" × ${larger.dims.height.toFixed(1)}"`
                  }
                </div>
              </div>
              <div className="text-center text-cyan-300 flex-1 max-w-[140px] sm:max-w-[180px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-4 h-3 border-2 border-solid border-cyan-400 bg-slate-700/70 rounded"></div>
                  <span className="font-medium text-sm truncate">{smaller.device.name}</span>
                </div>
                <div className="text-xs text-cyan-400/70">
                  {smaller.device.diagonal}" &middot; {isPhoneComparison
                    ? `${(smaller.dims.height * 25.4).toFixed(0)} × ${(smaller.dims.width * 25.4).toFixed(0)}mm`
                    : `${smaller.dims.width.toFixed(1)}" × ${smaller.dims.height.toFixed(1)}"`
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scale Reference */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-xs text-slate-500">
          {(scaleFactor * 10).toFixed(1)}px/inch
        </div>
      </div>

      {/* Legend - only show in side-by-side mode */}
      {displayMode === 'side-by-side' && (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 py-3 sm:py-4 px-4 bg-slate-800/50 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 sm:w-6 sm:h-4 border-2 border-solid border-slate-400 bg-slate-800/50 rounded"></div>
            <span className="text-xs sm:text-sm text-slate-400 truncate max-w-[100px] sm:max-w-none">{larger.device.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 sm:w-6 sm:h-4 border-2 border-solid border-cyan-400 bg-slate-700/70 rounded"></div>
            <span className="text-xs sm:text-sm text-cyan-300 truncate max-w-[100px] sm:max-w-none">{smaller.device.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
