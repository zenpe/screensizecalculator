import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getEffectivePpi } from './ScreenCalibration';

interface ScaledDeviceViewProps {
  // Device dimensions in inches
  widthInches: number;
  heightInches: number;
  // Optional label
  label?: string;
  // Device type for styling
  deviceType?: 'phone' | 'tablet' | 'monitor' | 'tv' | 'projector';
  // Custom content to render inside
  children?: React.ReactNode;
  // Callback when scale changes
  onScaleChange?: (scale: number) => void;
  // Force a specific scale (0-1), overrides auto-scaling
  forceScale?: number;
  // Show scale indicator
  showScaleIndicator?: boolean;
  // Enable pan mode for viewing actual size
  enablePanMode?: boolean;
  // Container class
  className?: string;
}

// Device type colors
const DEVICE_COLORS = {
  phone: { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  tablet: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  monitor: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  tv: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
  projector: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
};

export default function ScaledDeviceView({
  widthInches,
  heightInches,
  label,
  deviceType = 'monitor',
  children,
  onScaleChange,
  forceScale,
  showScaleIndicator = true,
  enablePanMode = true,
  className = '',
}: ScaledDeviceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [ppi, setPpi] = useState(96);
  const [isPanMode, setIsPanMode] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Get PPI on mount
  useEffect(() => {
    setPpi(getEffectivePpi());
  }, []);

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

  // Calculate actual device size in pixels at current PPI
  const actualSizePx = useMemo(() => ({
    width: widthInches * ppi,
    height: heightInches * ppi,
  }), [widthInches, heightInches, ppi]);

  // Calculate scale to fit container
  const autoScale = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;

    const padding = 40; // Padding around device
    const availableWidth = containerSize.width - padding;
    const availableHeight = containerSize.height - padding;

    const scaleX = availableWidth / actualSizePx.width;
    const scaleY = availableHeight / actualSizePx.height;

    return Math.min(scaleX, scaleY, 1); // Never scale up beyond 1:1
  }, [containerSize, actualSizePx]);

  const scale = forceScale ?? autoScale;
  const isScaled = scale < 0.99; // Consider it scaled if less than 99%

  // Notify parent of scale change
  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  // Scaled dimensions
  const displaySize = useMemo(() => ({
    width: actualSizePx.width * (isPanMode ? 1 : scale),
    height: actualSizePx.height * (isPanMode ? 1 : scale),
  }), [actualSizePx, scale, isPanMode]);

  // Pan mode handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPanMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  }, [isPanMode, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !isPanMode) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, isPanMode, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isPanMode || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  }, [isPanMode, panOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isPanMode || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, isPanMode, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Toggle pan mode
  const togglePanMode = useCallback(() => {
    setIsPanMode((prev) => {
      if (prev) {
        // Reset pan offset when exiting pan mode
        setPanOffset({ x: 0, y: 0 });
      }
      return !prev;
    });
  }, []);

  const colors = DEVICE_COLORS[deviceType];
  const scalePercent = Math.round(scale * 100);

  return (
    <div className={`relative ${className}`}>
      {/* Scale indicator and pan mode toggle */}
      {showScaleIndicator && isScaled && (
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${colors.bg} ${colors.text} backdrop-blur-sm`}>
            {scalePercent}% scale
          </div>
          {enablePanMode && (
            <button
              onClick={togglePanMode}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                isPanMode
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-gray-700/80 text-gray-400 hover:bg-gray-600/80'
              }`}
            >
              {isPanMode ? 'Exit 1:1' : 'View 1:1'}
            </button>
          )}
        </div>
      )}

      {/* Pan mode instructions */}
      {isPanMode && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-gray-900/90 text-xs text-gray-300 backdrop-blur-sm">
          Drag to pan • Viewing at actual size
        </div>
      )}

      {/* Container */}
      <div
        ref={containerRef}
        className={`relative w-full h-full min-h-[200px] overflow-hidden rounded-xl bg-gray-900/50 ${
          isPanMode ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Device visualization */}
        <div
          className="absolute left-1/2 top-1/2 transition-transform duration-200"
          style={{
            width: `${displaySize.width}px`,
            height: `${displaySize.height}px`,
            transform: isPanMode
              ? `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px))`
              : 'translate(-50%, -50%)',
          }}
        >
          {/* Device frame */}
          <div
            className={`w-full h-full border-2 ${colors.border} ${colors.bg} rounded-lg flex items-center justify-center`}
          >
            {children || (
              <div className="text-center p-4">
                {label && (
                  <div className={`text-sm font-medium ${colors.text} mb-1`}>
                    {label}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {widthInches.toFixed(1)}" × {heightInches.toFixed(1)}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid overlay for pan mode */}
        {isPanMode && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${ppi}px ${ppi}px`,
              transform: `translate(${panOffset.x % ppi}px, ${panOffset.y % ppi}px)`,
            }}
          />
        )}
      </div>

      {/* Dimension labels */}
      {!isPanMode && (
        <>
          {/* Width label */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-gray-500">
            <div className="w-8 h-px bg-gray-600" />
            <span>{widthInches.toFixed(1)}"</span>
            <div className="w-8 h-px bg-gray-600" />
          </div>
          {/* Height label */}
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-xs text-gray-500">
            <div className="w-px h-6 bg-gray-600" />
            <span className="writing-mode-vertical">{heightInches.toFixed(1)}"</span>
            <div className="w-px h-6 bg-gray-600" />
          </div>
        </>
      )}
    </div>
  );
}

// Hook to get current scale for a device
export function useDeviceScale(
  widthInches: number,
  heightInches: number,
  containerWidth: number,
  containerHeight: number,
  ppi: number = 96
): { scale: number; isScaled: boolean; actualWidth: number; actualHeight: number } {
  const actualWidth = widthInches * ppi;
  const actualHeight = heightInches * ppi;

  const padding = 40;
  const availableWidth = containerWidth - padding;
  const availableHeight = containerHeight - padding;

  const scaleX = availableWidth / actualWidth;
  const scaleY = availableHeight / actualHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  return {
    scale,
    isScaled: scale < 0.99,
    actualWidth,
    actualHeight,
  };
}
