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

// Room View component
function RoomView({
  larger,
  smaller,
  isMobile,
}: {
  larger: DeviceWithDimensions;
  smaller: DeviceWithDimensions;
  isMobile: boolean;
}) {
  // Human height reference: ~170cm = 67 inches
  const humanHeightInches = 67;

  // Container dimensions
  const containerWidth = isMobile ? 320 : 700;
  const containerHeight = isMobile ? 420 : 400;

  // TV cabinet height from floor (typical: ~20-24 inches / 50-60cm)
  const cabinetHeightInches = 22;

  // Wall space above cabinet (where screens are mounted/placed)
  // Calculate based on largest screen + some padding
  const maxScreenHeightInches = Math.max(larger.dims.height, smaller.dims.height);
  const wallSpaceInches = maxScreenHeightInches + 15; // 15" padding above screens

  // Total height needed: floor to human head top
  const totalHeightInches = Math.max(humanHeightInches, cabinetHeightInches + wallSpaceInches);

  // Human width
  const humanWidthInches = 15;
  const gapInches = 8;

  // Total width: human + gap + screens side by side
  const totalWidthInches = humanWidthInches + gapInches + larger.dims.width + gapInches + smaller.dims.width;

  // Calculate scale to fit everything
  const scaleByWidth = (containerWidth * 0.92) / totalWidthInches;
  const scaleByHeight = (containerHeight * 0.88) / totalHeightInches;
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

  // Floor position from bottom of container
  const floorFromBottom = 40;

  // Cabinet line position (distance from floor)
  const cabinetLineFromFloor = cabinetHeightPx;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Room simulation */}
      <div
        className="relative w-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden"
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
          <SofaHint width={isMobile ? 300 : 550} />
        </div>

        {/* Scale indicator */}
        <div className="absolute top-2 right-2 text-xs text-slate-600">
          Scale: {(roomScaleFactor).toFixed(2)}px/inch
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 mt-4 w-full">
        {/* Larger device info */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-2 border-2 border-dashed border-slate-400 rounded"></div>
            <span className="text-sm font-medium text-slate-300 truncate">{larger.device.name}</span>
          </div>
          <div className="space-y-1 text-xs text-slate-400">
            <div>Screen: <span className="text-slate-300">{larger.device.diagonal}" ({(larger.dims.width * 2.54).toFixed(0)} × {(larger.dims.height * 2.54).toFixed(0)} cm)</span></div>
            <div>Viewing: <span className="text-slate-300">{(largerDistance.min * 0.3048).toFixed(1)}-{(largerDistance.max * 0.3048).toFixed(1)} m</span></div>
            <div className="text-slate-500">{getRoomSize(larger.device.diagonal)}</div>
          </div>
        </div>

        {/* Smaller device info */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-900/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-2 border-2 border-solid border-cyan-400 rounded"></div>
            <span className="text-sm font-medium text-cyan-300 truncate">{smaller.device.name}</span>
          </div>
          <div className="space-y-1 text-xs text-cyan-400/70">
            <div>Screen: <span className="text-cyan-300">{smaller.device.diagonal}" ({(smaller.dims.width * 2.54).toFixed(0)} × {(smaller.dims.height * 2.54).toFixed(0)} cm)</span></div>
            <div>Viewing: <span className="text-cyan-300">{(smallerDistance.min * 0.3048).toFixed(1)}-{(smallerDistance.max * 0.3048).toFixed(1)} m</span></div>
            <div className="text-slate-500">{getRoomSize(smaller.device.diagonal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonVisualizer({ deviceA, deviceB }: ComparisonVisualizerProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('overlay');
  const isMobile = useIsMobile();

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

  // Calculate scale factor based on viewport and mode
  const scaleFactor = useMemo(() => {
    const containerHeight = isMobile ? 500 : 450;
    const containerWidth = isMobile ? 320 : 750;

    if (displayMode === 'room-view') {
      // For room view, scale based on showing both screens + human reference
      const totalWidth = larger.dims.width + smaller.dims.width + 50; // 50px gap
      const maxHeight = Math.max(larger.dims.height, smaller.dims.height);
      const scaleByWidth = (containerWidth * 0.85) / totalWidth;
      const scaleByHeight = (containerHeight * 0.5) / maxHeight;
      return Math.min(scaleByWidth, scaleByHeight, 4); // Max 4px per inch for room view
    }

    if (displayMode === 'side-by-side') {
      if (isMobile) {
        const maxDeviceWidth = Math.max(larger.dims.width, smaller.dims.width);
        const maxDeviceHeight = Math.max(larger.dims.height, smaller.dims.height);
        const scaleByWidth = (containerWidth * 0.85) / maxDeviceWidth;
        const scaleByHeight = (containerHeight * 0.35) / maxDeviceHeight;
        return Math.min(scaleByWidth, scaleByHeight);
      } else {
        const maxDeviceWidth = Math.max(larger.dims.width, smaller.dims.width);
        const maxDeviceHeight = Math.max(larger.dims.height, smaller.dims.height);
        const scaleByWidth = (containerWidth * 0.38) / maxDeviceWidth;
        const scaleByHeight = (containerHeight * 0.65) / maxDeviceHeight;
        return Math.min(scaleByWidth, scaleByHeight);
      }
    } else {
      // Overlay mode
      const scaleByHeight = (containerHeight * 0.55) / larger.dims.height;
      const scaleByWidth = (containerWidth * (isMobile ? 0.8 : 0.55)) / larger.dims.width;
      return Math.min(scaleByHeight, scaleByWidth);
    }
  }, [displayMode, larger, smaller, isMobile]);

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

  const containerHeight = displayMode === 'room-view'
    ? (isMobile ? 520 : 480)
    : isMobile
      ? (isStacked ? 620 : 480)
      : 520;

  // Viewing distance info for large screens
  const largerDistance = getViewingDistance(larger.device.diagonal);
  const smallerDistance = getViewingDistance(smaller.device.diagonal);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 p-3 sm:p-4 bg-slate-800/50 border-b border-slate-700">
        <button
          onClick={() => setDisplayMode('overlay')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            displayMode === 'overlay' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Overlay
        </button>
        <button
          onClick={() => setDisplayMode('side-by-side')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            displayMode === 'side-by-side' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {isMobile ? 'Stacked' : 'Side by Side'}
        </button>
        {isLargeScreenComparison && (
          <button
            onClick={() => setDisplayMode('room-view')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              displayMode === 'room-view' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Room View
          </button>
        )}
      </div>

      {/* Visualization Container */}
      <div
        className="relative flex justify-center items-center p-4 sm:p-6"
        style={{ minHeight: `${containerHeight}px` }}
        role="img"
        aria-label={`Visual comparison of ${larger.device.name} and ${smaller.device.name}`}
      >
        {displayMode === 'room-view' ? (
          <RoomView
            larger={larger}
            smaller={smaller}
            isMobile={isMobile}
          />
        ) : displayMode === 'side-by-side' ? (
          /* Side by Side / Stacked Mode */
          <div className={`flex justify-center ${isStacked ? 'flex-col items-center gap-4' : 'flex-row items-end gap-6 md:gap-12'}`}>
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
            <div
              className="relative flex items-end justify-center"
              style={{
                minHeight: `${Math.max(largerScaled.height + largerExtraHeight, smallerScaled.height + smallerExtraHeight) + 20}px`,
                minWidth: `${Math.max(largerScaled.width, smallerScaled.width) + (areSameSize ? 60 : 0)}px`
              }}
            >
              {/* Larger device (background) */}
              <div
                className="absolute bottom-0 transition-transform duration-300"
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
                className="relative z-10 transition-transform duration-300"
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
            <div className="flex justify-center gap-4 sm:gap-10 mt-4 w-full">
              <div className="text-center text-slate-400 flex-1 max-w-[160px] sm:max-w-[200px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-4 h-3 border-2 border-dashed border-slate-400 bg-slate-800/50 rounded"></div>
                  <span className="font-medium text-sm truncate">{larger.device.name}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {larger.device.diagonal}" · {isPhoneComparison
                    ? `${(larger.dims.height * 25.4).toFixed(0)} × ${(larger.dims.width * 25.4).toFixed(0)}mm`
                    : `${larger.dims.width.toFixed(1)}" × ${larger.dims.height.toFixed(1)}"`
                  }
                </div>
                {isLargeScreenComparison && (
                  <div className="text-xs text-slate-600 mt-1">
                    View: {largerDistance.min.toFixed(1)}-{largerDistance.max.toFixed(1)} ft
                  </div>
                )}
              </div>
              <div className="text-center text-cyan-300 flex-1 max-w-[160px] sm:max-w-[200px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-4 h-3 border-2 border-solid border-cyan-400 bg-slate-700/70 rounded"></div>
                  <span className="font-medium text-sm truncate">{smaller.device.name}</span>
                </div>
                <div className="text-xs text-cyan-400/70">
                  {smaller.device.diagonal}" · {isPhoneComparison
                    ? `${(smaller.dims.height * 25.4).toFixed(0)} × ${(smaller.dims.width * 25.4).toFixed(0)}mm`
                    : `${smaller.dims.width.toFixed(1)}" × ${smaller.dims.height.toFixed(1)}"`
                  }
                </div>
                {isLargeScreenComparison && (
                  <div className="text-xs text-cyan-600 mt-1">
                    View: {smallerDistance.min.toFixed(1)}-{smallerDistance.max.toFixed(1)} ft
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scale Reference */}
        {displayMode !== 'room-view' && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-xs text-slate-500">
            {(scaleFactor * 10).toFixed(1)}px/inch
          </div>
        )}
      </div>

      {/* Legend - only for side-by-side mode */}
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
