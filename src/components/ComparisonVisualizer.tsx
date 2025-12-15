import { useState, useMemo, useEffect } from 'react';
import type { Device } from '../data/devices';

/**
 * ComparisonVisualizer - Visual comparison of screen sizes
 *
 * Features:
 * - Overlay, Side by Side, and Room View display modes
 * - Device-specific appearances (Phone, TV, Projector, Monitor)
 * - Human silhouette for scale reference
 * - Viewing distance recommendations
 * - Responsive design
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

type DisplayMode = 'overlay' | 'side-by-side' | 'room-view';

// Calculate physical dimensions from diagonal and aspect ratio
function calculateDimensions(diagonal: number, ratio: number): Dimensions {
  const height = diagonal / Math.sqrt(ratio * ratio + 1);
  const width = height * ratio;
  return { width, height };
}

// Calculate recommended viewing distance (in feet)
function getViewingDistance(diagonal: number): { min: number; max: number; optimal: number } {
  // Rule of thumb: 1.5x to 2.5x the diagonal for 4K, optimal around 1.5-2x
  const minFt = (diagonal * 1.2) / 12;
  const maxFt = (diagonal * 2.5) / 12;
  const optimalFt = (diagonal * 1.6) / 12;
  return { min: minFt, max: maxFt, optimal: optimalFt };
}

// Get room size recommendation
function getRoomSize(diagonal: number): string {
  if (diagonal <= 43) return 'Small room / Bedroom';
  if (diagonal <= 55) return 'Medium room / Living room';
  if (diagonal <= 75) return 'Large room / Living room';
  if (diagonal <= 100) return 'Large room / Home theater';
  return 'Dedicated theater room';
}

// Human silhouette SVG component (standing, ~170cm / 5'7")
function HumanSilhouette({ height, className = '' }: { height: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 170"
      style={{ height: `${height}px` }}
      className={className}
      fill="currentColor"
    >
      {/* Head */}
      <circle cx="20" cy="12" r="10" />
      {/* Neck */}
      <rect x="17" y="22" width="6" height="8" />
      {/* Body */}
      <path d="M8 30 L32 30 L30 90 L10 90 Z" />
      {/* Left arm */}
      <path d="M8 32 L2 70 L6 72 L12 40 Z" />
      {/* Right arm */}
      <path d="M32 32 L38 70 L34 72 L28 40 Z" />
      {/* Left leg */}
      <path d="M10 90 L8 168 L14 168 L18 90 Z" />
      {/* Right leg */}
      <path d="M22 90 L26 168 L32 168 L30 90 Z" />
    </svg>
  );
}

// Sofa hint - minimal visual cue for first person perspective
// Just subtle armrest edges to suggest "you're sitting here"
function SofaHint({ width }: { width: number }) {
  const armWidth = width * 0.06;
  const armHeight = width * 0.12;

  return (
    <div className="relative" style={{ width: `${width}px`, height: `${armHeight}px` }}>
      {/* Left armrest edge */}
      <div
        className="absolute left-0 bottom-0 rounded-t-lg"
        style={{
          width: `${armWidth}px`,
          height: `${armHeight}px`,
          background: 'linear-gradient(to right, rgba(63, 63, 70, 0.6) 0%, rgba(63, 63, 70, 0.2) 100%)',
          boxShadow: 'inset 1px 1px 4px rgba(255,255,255,0.08)',
        }}
      />

      {/* Right armrest edge */}
      <div
        className="absolute right-0 bottom-0 rounded-t-lg"
        style={{
          width: `${armWidth}px`,
          height: `${armHeight}px`,
          background: 'linear-gradient(to left, rgba(63, 63, 70, 0.6) 0%, rgba(63, 63, 70, 0.2) 100%)',
          boxShadow: 'inset -1px 1px 4px rgba(255,255,255,0.08)',
        }}
      />

      {/* Subtle center arc hint - very faint sofa back top edge */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: `${width * 0.7}px`,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(82, 82, 91, 0.3) 30%, rgba(82, 82, 91, 0.4) 50%, rgba(82, 82, 91, 0.3) 70%, transparent 100%)',
          borderRadius: '50% 50% 0 0',
        }}
      />
    </div>
  );
}

// Phone frame component
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
  physicalDims?: Dimensions;
}) {
  const useDashed = isOverlayMode && isLarger;
  const borderColor = isLarger ? 'border-slate-400' : 'border-cyan-400';
  const bgColor = isLarger ? 'bg-slate-800/60' : 'bg-slate-700/80';
  const textColor = isLarger ? 'text-slate-300' : 'text-cyan-300';
  const subTextColor = isLarger ? 'text-slate-500' : 'text-cyan-400/70';

  const notchWidth = Math.max(width * 0.3, 24);
  const notchHeight = Math.max(height * 0.015, 5);
  const homeWidth = Math.max(width * 0.4, 32);
  const homeHeight = Math.max(height * 0.006, 3);
  const fontSize = Math.max(Math.min(width * 0.15, 20), 12);
  const borderRadius = Math.min(width, height) * 0.1;

  const heightMm = physicalDims ? (physicalDims.height * 25.4).toFixed(0) : '';
  const widthMm = physicalDims ? (physicalDims.width * 25.4).toFixed(0) : '';

  return (
    <div className="flex flex-col items-center">
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
        <div className="flex justify-center" style={{ paddingTop: `${Math.max(height * 0.02, 4)}px` }}>
          <div className="bg-slate-900 rounded-full" style={{ width: `${notchWidth}px`, height: `${notchHeight}px` }} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          {showDiagonal && (
            <div className={`${isLarger ? 'text-slate-500' : 'text-cyan-400'} font-bold`} style={{ fontSize: `${fontSize}px` }}>
              {diagonal}"
            </div>
          )}
        </div>
        <div className="flex justify-center" style={{ paddingBottom: `${Math.max(height * 0.015, 3)}px` }}>
          <div className={`${isLarger ? 'bg-slate-600' : 'bg-slate-500'} rounded-full`} style={{ width: `${homeWidth}px`, height: `${homeHeight}px` }} />
        </div>
      </div>
      {showLabel && physicalDims && (
        <div className={`mt-3 text-center ${textColor}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          <div className={`text-xs ${subTextColor}`}>{heightMm} × {widthMm}mm</div>
        </div>
      )}
    </div>
  );
}

// TV frame component with bezel and stand
function TVFrame({
  width,
  height,
  label,
  diagonal,
  isLarger,
  isOverlayMode,
  showLabel = true,
  showDiagonal = true,
  showStand = true,
  dims,
}: {
  width: number;
  height: number;
  label: string;
  diagonal: number;
  isLarger: boolean;
  isOverlayMode: boolean;
  showLabel?: boolean;
  showDiagonal?: boolean;
  showStand?: boolean;
  dims: Dimensions;
}) {
  const useDashed = isOverlayMode && isLarger;
  const borderColor = isLarger ? 'border-slate-500' : 'border-cyan-400';
  const bgColor = isLarger ? 'bg-slate-800/60' : 'bg-slate-700/80';
  const bezelColor = isLarger ? 'bg-slate-700' : 'bg-slate-600';
  const textColor = isLarger ? 'text-slate-400' : 'text-cyan-300';
  const fontSize = Math.max(Math.min(width * 0.06, 18), 10);

  // Bezel and stand dimensions
  const bezelWidth = Math.max(width * 0.015, 3);
  const standWidth = Math.max(width * 0.35, 40);
  const standHeight = Math.max(height * 0.06, 8);
  const standNeckWidth = Math.max(width * 0.08, 15);
  const standNeckHeight = Math.max(height * 0.08, 10);

  // In overlay mode, hide stand to focus on screen comparison
  const displayStand = showStand && !isOverlayMode;

  return (
    <div className="flex flex-col items-center">
      {/* TV body with bezel */}
      <div
        className={`relative ${bezelColor} rounded-sm`}
        style={{
          padding: `${bezelWidth}px`,
          boxShadow: isLarger && isOverlayMode ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Screen */}
        <div
          className={`relative ${bgColor} ${borderColor} flex items-center justify-center`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            borderWidth: useDashed ? '2px' : '0',
            borderStyle: useDashed ? 'dashed' : 'solid',
          }}
        >
          {showDiagonal && (
            <div className={`${isLarger ? 'text-slate-500' : 'text-cyan-400'} font-bold`} style={{ fontSize: `${fontSize}px` }}>
              {diagonal}"
            </div>
          )}
          {/* Brand logo area */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <div className={`w-4 h-1 ${isLarger ? 'bg-slate-600' : 'bg-slate-500'} rounded-full opacity-50`}></div>
          </div>
        </div>
      </div>

      {/* Stand neck - only show if displayStand is true */}
      {displayStand && (
        <div className={`${bezelColor}`} style={{ width: `${standNeckWidth}px`, height: `${standNeckHeight}px` }}></div>
      )}

      {/* Stand base - only show if displayStand is true */}
      {displayStand && (
        <div
          className={`${bezelColor} rounded-sm`}
          style={{
            width: `${standWidth}px`,
            height: `${standHeight}px`,
            borderRadius: '2px 2px 4px 4px',
          }}
        ></div>
      )}

      {/* Label */}
      {showLabel && (
        <div className={`mt-3 text-center ${textColor}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          <div className={`text-xs ${isLarger ? 'text-slate-500' : 'text-cyan-400/70'}`}>
            {dims.width.toFixed(1)}" × {dims.height.toFixed(1)}"
          </div>
        </div>
      )}
    </div>
  );
}

// Projector screen frame with mounting bar and soft glow effect
function ProjectorFrame({
  width,
  height,
  label,
  diagonal,
  isLarger,
  isOverlayMode,
  showLabel = true,
  showDiagonal = true,
  dims,
}: {
  width: number;
  height: number;
  label: string;
  diagonal: number;
  isLarger: boolean;
  isOverlayMode: boolean;
  showLabel?: boolean;
  showDiagonal?: boolean;
  dims: Dimensions;
}) {
  const useDashed = isOverlayMode && isLarger;
  const textColor = isLarger ? 'text-slate-400' : 'text-cyan-300';
  const fontSize = Math.max(Math.min(width * 0.05, 16), 10);

  // Mount dimensions
  const mountHeight = Math.max(height * 0.03, 6);
  const mountWidth = width * 1.02;
  const borderWidth = Math.max(width * 0.008, 2);

  // Glow intensity based on size (larger screens = more glow spread)
  const glowSpread = Math.min(width * 0.15, 40);
  const glowOpacity = isLarger ? 0.4 : 0.6;

  return (
    <div className="flex flex-col items-center">
      {/* Mounting bar / roller case */}
      <div
        className="rounded-t-sm"
        style={{
          width: `${mountWidth}px`,
          height: `${mountHeight}px`,
          background: 'linear-gradient(180deg, #52525b 0%, #3f3f46 50%, #27272a 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
        }}
      ></div>

      {/* Screen with black border and projection glow */}
      <div
        className="relative"
        style={{
          padding: `${borderWidth}px`,
          background: '#0f0f0f',
          // Soft ambient glow around the screen (light spill effect)
          boxShadow: isLarger && isOverlayMode
            ? 'none'
            : `0 0 ${glowSpread * 2}px ${glowSpread}px rgba(200, 200, 180, ${glowOpacity * 0.3}),
               0 8px 30px rgba(0, 0, 0, 0.4)`,
        }}
      >
        {/* The projection surface with diffuse reflection effect */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            border: useDashed ? `2px dashed ${isLarger ? '#64748b' : '#22d3ee'}` : 'none',
            // Base matte white with subtle texture feel
            background: isLarger
              ? 'linear-gradient(135deg, #d4d4d8 0%, #e4e4e7 25%, #d4d4d8 50%, #e4e4e7 75%, #d4d4d8 100%)'
              : 'linear-gradient(135deg, #e5e5e5 0%, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%, #e5e5e5 100%)',
          }}
        >
          {/* Projection light effect - soft center hotspot */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 70% at 50% 45%,
                rgba(255, 253, 245, ${isLarger ? 0.5 : 0.7}) 0%,
                rgba(255, 250, 235, ${isLarger ? 0.3 : 0.45}) 30%,
                rgba(245, 240, 225, ${isLarger ? 0.15 : 0.2}) 60%,
                transparent 100%)`,
            }}
          />

          {/* Subtle vignette - projectors have slightly darker edges */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 100% 100% at 50% 50%,
                transparent 40%,
                rgba(0, 0, 0, 0.08) 80%,
                rgba(0, 0, 0, 0.15) 100%)`,
            }}
          />

          {/* Screen texture - very subtle grain for matte screen feel */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Diagonal size text */}
          {showDiagonal && (
            <div
              className={`relative z-10 font-bold ${isLarger ? 'text-slate-500' : 'text-slate-600'}`}
              style={{
                fontSize: `${fontSize}px`,
                textShadow: '0 1px 2px rgba(255,255,255,0.5)',
              }}
            >
              {diagonal}"
            </div>
          )}
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className={`mt-3 text-center ${textColor}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          <div className={`text-xs ${isLarger ? 'text-slate-500' : 'text-cyan-400/70'}`}>
            {dims.width.toFixed(1)}" × {dims.height.toFixed(1)}"
          </div>
        </div>
      )}
    </div>
  );
}

// Monitor frame with thin bezel and small stand
function MonitorFrame({
  width,
  height,
  label,
  diagonal,
  isLarger,
  isOverlayMode,
  showLabel = true,
  showDiagonal = true,
  showStand = true,
  dims,
}: {
  width: number;
  height: number;
  label: string;
  diagonal: number;
  isLarger: boolean;
  isOverlayMode: boolean;
  showLabel?: boolean;
  showDiagonal?: boolean;
  showStand?: boolean;
  dims: Dimensions;
}) {
  const useDashed = isOverlayMode && isLarger;
  const borderColor = isLarger ? 'border-slate-500' : 'border-cyan-400';
  const bgColor = isLarger ? 'bg-slate-800/60' : 'bg-slate-700/80';
  const bezelColor = isLarger ? 'bg-slate-800' : 'bg-slate-700';
  const textColor = isLarger ? 'text-slate-400' : 'text-cyan-300';
  const fontSize = Math.max(Math.min(width * 0.07, 16), 10);

  // Thin bezel for modern monitors
  const bezelWidth = Math.max(width * 0.008, 2);
  const standWidth = Math.max(width * 0.25, 30);
  const standHeight = Math.max(height * 0.04, 6);
  const standNeckWidth = Math.max(width * 0.06, 10);
  const standNeckHeight = Math.max(height * 0.12, 15);

  // In overlay mode, hide stand to focus on screen comparison
  const displayStand = showStand && !isOverlayMode;

  return (
    <div className="flex flex-col items-center">
      {/* Monitor body with thin bezel */}
      <div
        className={`relative ${bezelColor} rounded-sm`}
        style={{
          padding: `${bezelWidth}px`,
          boxShadow: isLarger && isOverlayMode ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          className={`relative ${bgColor} ${borderColor} flex items-center justify-center`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            borderWidth: useDashed ? '2px' : '0',
            borderStyle: useDashed ? 'dashed' : 'solid',
          }}
        >
          {showDiagonal && (
            <div className={`${isLarger ? 'text-slate-500' : 'text-cyan-400'} font-bold`} style={{ fontSize: `${fontSize}px` }}>
              {diagonal}"
            </div>
          )}
        </div>
      </div>

      {/* Stand neck - only show if displayStand is true */}
      {displayStand && (
        <div className={`${bezelColor}`} style={{ width: `${standNeckWidth}px`, height: `${standNeckHeight}px` }}></div>
      )}

      {/* Stand base - oval shaped - only show if displayStand is true */}
      {displayStand && (
        <div
          className={`${bezelColor}`}
          style={{
            width: `${standWidth}px`,
            height: `${standHeight}px`,
            borderRadius: '50%',
          }}
        ></div>
      )}

      {/* Label */}
      {showLabel && (
        <div className={`mt-3 text-center ${textColor}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          <div className={`text-xs ${isLarger ? 'text-slate-500' : 'text-cyan-400/70'}`}>
            {dims.width.toFixed(1)}" × {dims.height.toFixed(1)}"
          </div>
        </div>
      )}
    </div>
  );
}

// Unified device frame renderer
function DeviceFrame({
  device,
  scaledDims,
  physicalDims,
  isLarger,
  isOverlayMode,
  showLabel,
  showDiagonal,
}: {
  device: Device;
  scaledDims: Dimensions;
  physicalDims: Dimensions;
  isLarger: boolean;
  isOverlayMode: boolean;
  showLabel?: boolean;
  showDiagonal?: boolean;
}) {
  const commonProps = {
    width: scaledDims.width,
    height: scaledDims.height,
    label: device.name,
    diagonal: device.diagonal,
    isLarger,
    isOverlayMode,
    showLabel,
    showDiagonal,
    dims: physicalDims,
  };

  switch (device.category) {
    case 'phone':
      return <PhoneFrame {...commonProps} physicalDims={physicalDims} />;
    case 'tablet':
      // Tablet: similar to monitor but without stand
      return <MonitorFrame {...commonProps} showStand={false} />;
    case 'tv':
      return <TVFrame {...commonProps} />;
    case 'projector':
      return <ProjectorFrame {...commonProps} />;
    case 'monitor':
      return <MonitorFrame {...commonProps} />;
    default:
      return <TVFrame {...commonProps} />;
  }
}

// Breakpoint type for responsive design
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Hook to detect breakpoint
function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
  useEffect(() => {
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

// Hook to get dynamic container size
function useContainerSize() {
  const [size, setSize] = useState({ width: 320, height: 500 });
  useEffect(() => {
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

// Hook for swipe gesture support
function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
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

// Legacy hook for backward compatibility
function useIsMobile() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
}

// Hook to get container width (for RoomView compatibility)
function useContainerWidth() {
  const { width } = useContainerSize();
  return width;
}

// Room View component
function RoomView({
  larger,
  smaller,
  isMobile,
  availableHeight,
}: {
  larger: DeviceWithDimensions;
  smaller: DeviceWithDimensions;
  isMobile: boolean;
  availableHeight: number;
}) {
  // Human height reference: ~170cm = 67 inches
  const humanHeightInches = 67;

  // Container dimensions - responsive based on viewport
  const dynamicWidth = useContainerWidth();
  const containerWidth = isMobile ? Math.min(dynamicWidth, 340) : Math.min(dynamicWidth, 900);

  // Use available height from parent, minus space for info cards (~80px on mobile, ~100px on desktop)
  const infoCardsHeight = isMobile ? 70 : 90;
  const containerHeight = Math.max(availableHeight - infoCardsHeight, 280);

  // TV cabinet height from floor (typical: ~20-24 inches / 50-60cm)
  const cabinetHeightInches = 22;

  // Wall space above cabinet (where screens are mounted/placed)
  // Calculate based on largest screen + some padding
  const maxScreenHeightInches = Math.max(larger.dims.height, smaller.dims.height);
  const wallSpaceInches = maxScreenHeightInches + 10; // 10" padding above screens

  // Total height needed: floor to human head top
  const totalHeightInches = Math.max(humanHeightInches, cabinetHeightInches + wallSpaceInches);

  // Human width
  const humanWidthInches = 15;
  const gapInches = isMobile ? 3 : 5;

  // Total width: human + gap + screens side by side
  const totalWidthInches = humanWidthInches + gapInches + larger.dims.width + gapInches + smaller.dims.width;

  // Calculate scale to fit everything - use higher ratios to maximize space usage
  const scaleByWidth = (containerWidth * 0.95) / totalWidthInches;
  const scaleByHeight = (containerHeight * 0.80) / totalHeightInches;
  const roomScaleFactor = Math.min(scaleByWidth, scaleByHeight);

  // Apply scale
  const humanHeightPx = humanHeightInches * roomScaleFactor;
  const cabinetHeightPx = cabinetHeightInches * roomScaleFactor;
  const gapPx = gapInches * roomScaleFactor;

  const largerScaled = {
    width: larger.dims.width * roomScaleFactor,
    height: larger.dims.height * roomScaleFactor,
  };
  const smallerScaled = {
    width: smaller.dims.width * roomScaleFactor,
    height: smaller.dims.height * roomScaleFactor,
  };

  // Viewing distance calculation
  const largerDistance = getViewingDistance(larger.device.diagonal);
  const smallerDistance = getViewingDistance(smaller.device.diagonal);

  // Room total height
  const roomHeight = containerHeight;

  // Floor position from bottom of container - smaller on mobile
  const floorFromBottom = isMobile ? 25 : 35;

  // Cabinet line position (distance from floor)
  const cabinetLineFromFloor = cabinetHeightPx;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Room simulation */}
      <div
        className="relative w-full max-w-5xl mx-auto bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden"
        style={{ height: `${roomHeight}px` }}
      >
        {/* Wall texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 50px)' }}></div>
        </div>

        {/* Virtual TV cabinet line - dashed line showing where devices bottom aligns */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-slate-600/50"
          style={{ bottom: `${floorFromBottom + cabinetLineFromFloor}px` }}
        >
          <span className="absolute right-2 -top-4 text-xs text-slate-600">TV Cabinet</span>
        </div>

        {/* Floor line */}
        <div
          className="absolute left-0 right-0 h-px bg-slate-500"
          style={{ bottom: `${floorFromBottom}px` }}
        ></div>

        {/* Floor area */}
        <div
          className="absolute left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-900/80"
          style={{ bottom: 0, height: `${floorFromBottom}px` }}
        ></div>

        {/* Content container */}
        <div
          className="absolute inset-x-0 flex items-end justify-center px-4"
          style={{
            bottom: `${floorFromBottom + cabinetLineFromFloor}px`,
            gap: `${gapPx}px`
          }}
        >
          {/* Human silhouette - standing on the floor, not on cabinet */}
          <div
            className="flex flex-col items-center text-slate-500/70"
            style={{
              marginBottom: `-${cabinetLineFromFloor}px` // Push human down to floor level
            }}
          >
            <HumanSilhouette height={humanHeightPx} />
            <div className="text-xs text-center mt-1 text-slate-500">5'7"</div>
          </div>

          {/* Larger screen - bottom aligned to cabinet line */}
          <div className="flex flex-col items-center">
            <DeviceFrame
              device={larger.device}
              scaledDims={largerScaled}
              physicalDims={larger.dims}
              isLarger={true}
              isOverlayMode={false}
              showLabel={false}
              showDiagonal={true}
            />
          </div>

          {/* Smaller screen - bottom aligned to cabinet line */}
          <div className="flex flex-col items-center">
            <DeviceFrame
              device={smaller.device}
              scaledDims={smallerScaled}
              physicalDims={smaller.dims}
              isLarger={false}
              isOverlayMode={false}
              showLabel={false}
              showDiagonal={true}
            />
          </div>
        </div>

        {/* Sofa hint - subtle armrest edges for first person perspective */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 0 }}
        >
          <SofaHint width={isMobile ? Math.min(containerWidth * 0.85, 300) : 550} />
        </div>

        {/* Scale indicator */}
        <div className="absolute top-2 right-2 text-xs text-slate-600">
          Scale: {(roomScaleFactor).toFixed(2)}px/inch
        </div>
      </div>

      {/* Info cards - compact layout */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 w-full max-w-5xl mx-auto px-1">
        {/* Larger device info */}
        <div className="bg-slate-800/50 rounded p-1.5 sm:p-2 border border-slate-700">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-2 h-1.5 sm:w-2.5 sm:h-1.5 border border-dashed border-slate-400 rounded flex-shrink-0"></div>
            <span className="text-[9px] sm:text-xs font-medium text-slate-300 truncate">{larger.device.name}</span>
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
            {larger.device.diagonal}" ({(larger.dims.width * 2.54).toFixed(0)}×{(larger.dims.height * 2.54).toFixed(0)}cm)
          </div>
        </div>

        {/* Smaller device info */}
        <div className="bg-slate-800/50 rounded p-1.5 sm:p-2 border border-cyan-900/50">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-2 h-1.5 sm:w-2.5 sm:h-1.5 border border-solid border-cyan-400 rounded flex-shrink-0"></div>
            <span className="text-[9px] sm:text-xs font-medium text-cyan-300 truncate">{smaller.device.name}</span>
          </div>
          <div className="text-[9px] sm:text-[10px] text-cyan-400/70 truncate">
            {smaller.device.diagonal}" ({(smaller.dims.width * 2.54).toFixed(0)}×{(smaller.dims.height * 2.54).toFixed(0)}cm)
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonVisualizer({ deviceA, deviceB }: ComparisonVisualizerProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('overlay');
  const breakpoint = useBreakpoint();
  const containerSize = useContainerSize();
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md';

  // Calculate physical dimensions for both devices
  const { larger, smaller, isPhoneComparison, isLargeScreenComparison, areSameSize, sizeDiffPercent } = useMemo(() => {
    const dimsA = calculateDimensions(deviceA.diagonal, deviceA.ratio);
    const dimsB = calculateDimensions(deviceB.diagonal, deviceB.ratio);

    const areaA = dimsA.width * dimsA.height;
    const areaB = dimsB.width * dimsB.height;

    const isPhone = deviceA.category === 'phone' && deviceB.category === 'phone';
    const isLargeScreen = ['tv', 'projector', 'monitor'].includes(deviceA.category) &&
                          ['tv', 'projector', 'monitor'].includes(deviceB.category);

    // For phones, swap width/height for portrait mode
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

    const sizeDiff = Math.abs(areaA - areaB) / Math.max(areaA, areaB);

    return {
      larger: largerDevice,
      smaller: smallerDevice,
      isPhoneComparison: isPhone,
      isLargeScreenComparison: isLargeScreen,
      areSameSize: sizeDiff < 0.05,
      sizeDiffPercent: sizeDiff * 100,
    };
  }, [deviceA, deviceB]);

  const isStacked = isMobile && displayMode === 'side-by-side';

  // Fixed container height based on breakpoint only (not display mode)
  // This prevents page reflow when switching between modes
  const fixedContainerHeight = useMemo(() => {
    switch (breakpoint) {
      case 'xs': return 480;
      case 'sm': return 500;
      case 'md': return 520;
      case 'lg': return 500;
      case 'xl': return 520;
    }
  }, [breakpoint]);

  // Get scale multipliers based on breakpoint
  // For stacked mode (mobile), sideBySideHeight is for EACH device (need to fit 2 vertically)
  const getScaleConfig = (bp: Breakpoint) => {
    switch (bp) {
      case 'xs': return { widthRatio: 0.88, heightRatio: 0.48, sideBySideWidth: 0.82, sideBySideHeight: 0.28 };
      case 'sm': return { widthRatio: 0.88, heightRatio: 0.5, sideBySideWidth: 0.82, sideBySideHeight: 0.30 };
      case 'md': return { widthRatio: 0.85, heightRatio: 0.52, sideBySideWidth: 0.80, sideBySideHeight: 0.32 };
      case 'lg': return { widthRatio: 0.7, heightRatio: 0.6, sideBySideWidth: 0.42, sideBySideHeight: 0.6 };
      case 'xl': return { widthRatio: 0.6, heightRatio: 0.65, sideBySideWidth: 0.4, sideBySideHeight: 0.65 };
    }
  };

  // Calculate scale factor using fixed container height to prevent layout shifts
  const scaleFactor = useMemo(() => {
    const cw = containerSize.width;
    const ch = fixedContainerHeight; // Use fixed height instead of dynamic
    const config = getScaleConfig(breakpoint);

    if (displayMode === 'room-view') {
      const totalWidth = larger.dims.width + smaller.dims.width + 50;
      const maxHeight = Math.max(larger.dims.height, smaller.dims.height);
      const scaleByWidth = (cw * 0.85) / totalWidth;
      const scaleByHeight = (ch * 0.5) / maxHeight;
      return Math.min(scaleByWidth, scaleByHeight, 4);
    }

    if (displayMode === 'side-by-side') {
      const maxDeviceWidth = Math.max(larger.dims.width, smaller.dims.width);
      const maxDeviceHeight = Math.max(larger.dims.height, smaller.dims.height);

      if (isStacked) {
        // Stacked mode (mobile): each device takes most of the width, fit 2 devices vertically
        const scaleByWidth = (cw * config.sideBySideWidth) / maxDeviceWidth;
        const scaleByHeight = (ch * config.sideBySideHeight) / maxDeviceHeight;
        return Math.min(scaleByWidth, scaleByHeight);
      } else {
        // True side-by-side: two devices fit horizontally
        const scaleByWidth = (cw * config.sideBySideWidth) / maxDeviceWidth;
        const scaleByHeight = (ch * config.sideBySideHeight) / maxDeviceHeight;
        return Math.min(scaleByWidth, scaleByHeight);
      }
    } else {
      // Overlay mode
      const scaleByHeight = (ch * config.heightRatio) / larger.dims.height;
      const scaleByWidth = (cw * config.widthRatio) / larger.dims.width;
      return Math.min(scaleByHeight, scaleByWidth);
    }
  }, [displayMode, larger, smaller, containerSize.width, fixedContainerHeight, breakpoint, isStacked]);

  const largerScaled: Dimensions = {
    width: larger.dims.width * scaleFactor,
    height: larger.dims.height * scaleFactor,
  };

  const smallerScaled: Dimensions = {
    width: smaller.dims.width * scaleFactor,
    height: smaller.dims.height * scaleFactor,
  };

  // Calculate extra height for TV/projector stands (only in side-by-side mode)
  const getExtraHeight = (category: string, height: number, mode: DisplayMode) => {
    // In overlay mode, TV/Monitor don't show stands, so no extra height
    if (mode === 'overlay') return 0;
    if (category === 'tv' || category === 'monitor') return height * 0.18;
    if (category === 'projector') return height * 0.05;
    return 0;
  };

  const largerExtraHeight = getExtraHeight(larger.device.category, largerScaled.height, displayMode);
  const smallerExtraHeight = getExtraHeight(smaller.device.category, smallerScaled.height, displayMode);

  // Use the fixed container height for rendering
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

  // Viewing distance info for large screens
  const largerDistance = getViewingDistance(larger.device.diagonal);
  const smallerDistance = getViewingDistance(smaller.device.diagonal);

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

      {/* Visualization Container - fixed height with absolute positioned content */}
      <div
        className="relative select-none overflow-hidden"
        style={{ height: `${containerHeight}px` }}
        role="img"
        aria-label={`Visual comparison of ${larger.device.name} and ${smaller.device.name}`}
        {...swipeHandlers}
      >
        {/* Content wrapper - absolutely positioned to prevent affecting container height */}
        <div className="absolute inset-0 flex justify-center items-center p-3 sm:p-6">
          {displayMode === 'room-view' ? (
            <RoomView
              larger={larger}
              smaller={smaller}
              isMobile={isMobile}
              availableHeight={containerHeight}
            />
          ) : displayMode === 'side-by-side' ? (
            /* Side by Side / Stacked Mode */
            <div className={`flex justify-center ${isStacked ? 'flex-col items-center gap-2' : 'flex-row items-end gap-6 md:gap-12'}`}>
              <DeviceFrame
                device={larger.device}
                scaledDims={largerScaled}
                physicalDims={larger.dims}
                isLarger={true}
                isOverlayMode={false}
                showLabel={true}
                showDiagonal={true}
              />
              <DeviceFrame
                device={smaller.device}
                scaledDims={smallerScaled}
                physicalDims={smaller.dims}
                isLarger={false}
                isOverlayMode={false}
                showLabel={true}
                showDiagonal={true}
              />
            </div>
          ) : (
            /* Overlay Mode */
            <div className="relative flex flex-col items-center">
              {areSameSize && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 text-slate-900 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                  Similar sizes ({sizeDiffPercent.toFixed(1)}% diff)
                </div>
              )}

              {/* Devices container with bottom alignment */}
              <div className="relative flex items-end justify-center">
                {/* Larger device (background) */}
                <div
                  className="absolute bottom-0"
                  style={{ transform: areSameSize ? 'translateX(-25px)' : 'none' }}
                >
                  <DeviceFrame
                    device={larger.device}
                    scaledDims={largerScaled}
                    physicalDims={larger.dims}
                    isLarger={true}
                    isOverlayMode={true}
                    showLabel={false}
                    showDiagonal={false}
                  />
                </div>
                {/* Smaller device (foreground) */}
                <div
                  className="relative z-10"
                  style={{ transform: areSameSize ? 'translateX(25px)' : 'none' }}
                >
                  <DeviceFrame
                    device={smaller.device}
                    scaledDims={smallerScaled}
                    physicalDims={smaller.dims}
                    isLarger={false}
                    isOverlayMode={true}
                    showLabel={false}
                    showDiagonal={false}
                  />
                </div>
              </div>

              {/* Labels below */}
              <div className="flex justify-center gap-2 sm:gap-10 mt-3 sm:mt-4 w-full px-1">
                <div className="text-center text-slate-400 flex-1 max-w-[140px] sm:max-w-[200px]">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <div className="w-3 h-2 sm:w-4 sm:h-3 border-2 border-dashed border-slate-400 bg-slate-800/50 rounded flex-shrink-0"></div>
                    <span className="font-medium text-[10px] sm:text-sm truncate">{larger.device.name}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 truncate">
                    {larger.device.diagonal}" · {isPhoneComparison
                      ? `${(larger.dims.height * 25.4).toFixed(0)}×${(larger.dims.width * 25.4).toFixed(0)}mm`
                      : `${larger.dims.width.toFixed(1)}"×${larger.dims.height.toFixed(1)}"`
                    }
                  </div>
                  {isLargeScreenComparison && (
                    <div className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 hidden sm:block">
                      View: {largerDistance.min.toFixed(1)}-{largerDistance.max.toFixed(1)} ft
                    </div>
                  )}
                </div>
                <div className="text-center text-cyan-300 flex-1 max-w-[140px] sm:max-w-[200px]">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <div className="w-3 h-2 sm:w-4 sm:h-3 border-2 border-solid border-cyan-400 bg-slate-700/70 rounded flex-shrink-0"></div>
                    <span className="font-medium text-[10px] sm:text-sm truncate">{smaller.device.name}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-cyan-400/70 truncate">
                    {smaller.device.diagonal}" · {isPhoneComparison
                      ? `${(smaller.dims.height * 25.4).toFixed(0)}×${(smaller.dims.width * 25.4).toFixed(0)}mm`
                      : `${smaller.dims.width.toFixed(1)}"×${smaller.dims.height.toFixed(1)}"`
                    }
                  </div>
                  {isLargeScreenComparison && (
                    <div className="text-[10px] sm:text-xs text-cyan-600 mt-0.5 sm:mt-1 hidden sm:block">
                      View: {smallerDistance.min.toFixed(1)}-{smallerDistance.max.toFixed(1)} ft
                    </div>
                  )}
                </div>
              </div>
            </div>
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
