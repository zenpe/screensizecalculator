import { useMemo } from 'react';
import type { Device } from '../data/devices';

/**
 * CompareVisualizer - Visual overlay comparison of two screen sizes
 *
 * Shows the smaller device overlaid on top of the larger device
 * to visualize the size difference between two screens.
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

interface CompareVisualizerProps {
  deviceA: Device;
  deviceB: Device;
}

// Calculate physical dimensions from diagonal and aspect ratio
// Using Pythagorean theorem: diagonal² = width² + height²
// With width = height × ratio: height = diagonal / sqrt(ratio² + 1)
function calculateDimensions(diagonal: number, ratio: number): Dimensions {
  const height = diagonal / Math.sqrt(ratio * ratio + 1);
  const width = height * ratio;
  return { width, height };
}

export default function CompareVisualizer({ deviceA, deviceB }: CompareVisualizerProps) {
  // Calculate physical dimensions for both devices
  const dimensions = useMemo(() => {
    const dimsA = calculateDimensions(deviceA.diagonal, deviceA.ratio);
    const dimsB = calculateDimensions(deviceB.diagonal, deviceB.ratio);

    // Determine which device is larger (by area)
    const areaA = dimsA.width * dimsA.height;
    const areaB = dimsB.width * dimsB.height;

    const larger: DeviceWithDimensions = areaA >= areaB
      ? { device: deviceA, dims: dimsA, area: areaA }
      : { device: deviceB, dims: dimsB, area: areaB };

    const smaller: DeviceWithDimensions = areaA < areaB
      ? { device: deviceA, dims: dimsA, area: areaA }
      : { device: deviceB, dims: dimsB, area: areaB };

    return { larger, smaller };
  }, [deviceA, deviceB]);

  // Calculate scale factor so larger device fits 80% of container
  // Container height is 500px, so we want the larger device to fit in ~400px
  const containerHeight = 500;
  const containerWidth = 800; // Approximate width
  const targetFillPercent = 0.8;

  const scaleFactor = useMemo(() => {
    const { larger } = dimensions;

    // Calculate scale based on both width and height constraints
    const scaleByHeight = (containerHeight * targetFillPercent) / larger.dims.height;
    const scaleByWidth = (containerWidth * targetFillPercent) / larger.dims.width;

    // Use the smaller scale to ensure it fits both dimensions
    return Math.min(scaleByHeight, scaleByWidth);
  }, [dimensions]);

  // Determine alignment based on category
  // Phones: Center align
  // TV/Monitor/Projector: Bottom align (simulate sitting on desk/floor)
  const isPhoneComparison =
    dimensions.larger.device.category === 'phone' ||
    dimensions.smaller.device.category === 'phone';

  const alignmentClass = isPhoneComparison ? 'items-center' : 'items-end';

  // Scaled dimensions for rendering
  const largerScaled: Dimensions = {
    width: dimensions.larger.dims.width * scaleFactor,
    height: dimensions.larger.dims.height * scaleFactor,
  };

  const smallerScaled: Dimensions = {
    width: dimensions.smaller.dims.width * scaleFactor,
    height: dimensions.smaller.dims.height * scaleFactor,
  };

  // Format numbers for display
  const formatNum = (num: number): string => num.toFixed(1);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      {/* Visualization Container */}
      <div
        className={`relative h-[500px] flex justify-center ${alignmentClass} p-8`}
        role="img"
        aria-label={`Visual comparison of ${dimensions.larger.device.name} and ${dimensions.smaller.device.name}`}
      >
        {/* Larger Device (Background) - Dashed border, semi-transparent */}
        <div
          className="absolute border-2 border-dashed border-slate-500 bg-slate-800/50 rounded-lg flex items-center justify-center"
          style={{
            width: `${largerScaled.width}px`,
            height: `${largerScaled.height}px`,
            ...(isPhoneComparison
              ? {} // Center alignment handled by parent
              : { bottom: '2rem' } // Bottom alignment for TVs/monitors
            ),
          }}
        >
          {/* Label for larger device */}
          <div className="absolute -top-8 left-0 text-sm text-slate-400">
            <span className="font-medium text-slate-300">{dimensions.larger.device.name}</span>
            <span className="ml-2 text-xs">
              ({formatNum(dimensions.larger.dims.width)}" x {formatNum(dimensions.larger.dims.height)}")
            </span>
          </div>

          {/* Diagonal indicator */}
          <div className="text-slate-500 text-lg font-bold">
            {dimensions.larger.device.diagonal}"
          </div>
        </div>

        {/* Smaller Device (Foreground) - Solid border, different color */}
        <div
          className="absolute border-3 border-solid border-cyan-400 bg-slate-700/70 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20"
          style={{
            width: `${smallerScaled.width}px`,
            height: `${smallerScaled.height}px`,
            borderWidth: '3px',
            ...(isPhoneComparison
              ? {} // Center alignment handled by parent
              : { bottom: '2rem' } // Bottom alignment for TVs/monitors
            ),
          }}
        >
          {/* Label for smaller device */}
          <div className="absolute -bottom-8 left-0 text-sm text-cyan-300">
            <span className="font-medium">{dimensions.smaller.device.name}</span>
            <span className="ml-2 text-xs text-cyan-400/70">
              ({formatNum(dimensions.smaller.dims.width)}" x {formatNum(dimensions.smaller.dims.height)}")
            </span>
          </div>

          {/* Diagonal indicator */}
          <div className="text-cyan-400 text-lg font-bold">
            {dimensions.smaller.device.diagonal}"
          </div>
        </div>

        {/* Scale Reference */}
        <div className="absolute bottom-3 right-3 text-xs text-slate-500">
          Scale: {(scaleFactor * 10).toFixed(1)}px per inch
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-8 py-4 bg-slate-800/50 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 border-2 border-dashed border-slate-500 bg-slate-800/50 rounded"></div>
          <span className="text-sm text-slate-400">{dimensions.larger.device.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 border-2 border-solid border-cyan-400 bg-slate-700/70 rounded"></div>
          <span className="text-sm text-cyan-300">{dimensions.smaller.device.name}</span>
        </div>
      </div>
    </div>
  );
}
