import { useState, useMemo } from 'react';
import type { Device } from '../data/devices';
import ComparisonVisualizer from './ComparisonVisualizer';

interface DeviceDetailVisualizerProps {
  device: Device;
  relatedDevices: Device[];
}

// Calculate physical dimensions from diagonal and aspect ratio
function calculateDimensions(diagonal: number, ratio: number) {
  const height = diagonal / Math.sqrt(ratio * ratio + 1);
  const width = height * ratio;
  return { width, height };
}

// Single device visualization (when no comparison selected)
function SingleDeviceView({ device }: { device: Device }) {
  const dims = calculateDimensions(device.diagonal, device.ratio);
  const isPhone = device.category === 'phone';
  const isTablet = device.category === 'tablet';

  // For phones, swap width/height for portrait mode
  const displayDims = isPhone
    ? { width: dims.height, height: dims.width }
    : dims;

  // Calculate SVG viewBox and style based on device type
  const svgViewBox = isPhone
    ? `0 0 100 ${100 * device.ratio}`
    : `0 0 ${device.ratio * 100} 100`;

  // Adjust sizes based on device type for consistent visualization
  // Adjust sizes based on device type - TV and projector need larger display
  const getSvgStyle = () => {
    if (isPhone) {
      return { height: '350px', maxHeight: '60vh' };
    }
    if (isTablet) {
      return { width: '500px', maxWidth: '90%' };
    }
    if (device.category === 'monitor') {
      return { width: '500px', maxWidth: '90%' };
    }
    // TV and projector - full width display
    return { width: '100%', maxWidth: '800px' };
  };

  const svgStyle = getSvgStyle();

  return (
    <div className="text-center w-full">
      <p className="text-sm text-gray-400 mb-6">Screen Visualization</p>
      {isPhone ? (
        <svg viewBox={svgViewBox} className="mx-auto drop-shadow-2xl" style={svgStyle}>
          <rect x="0" y="0" width="100" height={100 * device.ratio} rx="18" fill="#1F2937" />
          <rect x="2" y="2" width="96" height={100 * device.ratio - 4} rx="16" fill="url(#screenGrad)" />
          <rect x="35" y="5" width="30" height="3" rx="1.5" fill="#000" />
          <rect x="32" y={100 * device.ratio - 6} width="36" height="1.5" rx="0.75" fill="#4B5563" />
          <text x="50" y={50 * device.ratio} textAnchor="middle" className="fill-white" style={{ fontSize: '12px', fontWeight: 'bold' }}>{device.diagonal}"</text>
          <text x="50" y={50 * device.ratio + 8} textAnchor="middle" className="fill-gray-300" style={{ fontSize: '4px' }}>{displayDims.width.toFixed(2)}" × {displayDims.height.toFixed(2)}"</text>
          <defs>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#1F2937" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>
        </svg>
      ) : (
        <svg viewBox={svgViewBox} className="mx-auto drop-shadow-2xl" style={svgStyle}>
          <rect x="0" y="0" width={device.ratio * 100} height="100" rx="3" fill="#4B5563" />
          <rect x="2.5" y="2.5" width={device.ratio * 100 - 5} height="95" rx="1.5" fill="url(#screenGrad)" />
          <text x={device.ratio * 50} y="42" textAnchor="middle" className="fill-white" style={{ fontSize: '18px', fontWeight: 'bold' }}>{device.diagonal}"</text>
          <text x={device.ratio * 50} y="58" textAnchor="middle" className="fill-gray-300" style={{ fontSize: '7px' }}>{displayDims.width.toFixed(2)}" × {displayDims.height.toFixed(2)}"</text>
          <defs>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#1F2937" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <p className="text-xs text-gray-500 mt-4">Proportional screen dimensions</p>
    </div>
  );
}

export default function DeviceDetailVisualizer({ device, relatedDevices }: DeviceDetailVisualizerProps) {
  const [compareDeviceId, setCompareDeviceId] = useState<string>('');

  // Find the selected comparison device
  const compareDevice = useMemo(() => {
    if (!compareDeviceId) return null;
    return relatedDevices.find(d => d.id === compareDeviceId) || null;
  }, [compareDeviceId, relatedDevices]);

  return (
    <div className="w-full" style={{ minWidth: '100%' }}>
      {/* Compare Dropdown - Always visible at top */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <label className="text-sm text-gray-400">Compare with:</label>
        <select
          value={compareDeviceId}
          onChange={(e) => setCompareDeviceId(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
        >
          <option value="">Select a device...</option>
          {relatedDevices.slice(0, 10).map(d => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.diagonal}")
            </option>
          ))}
        </select>
        {compareDeviceId && (
          <button
            onClick={() => setCompareDeviceId('')}
            className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Visualization Area - Full width container */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 rounded-xl p-4 md:p-6 min-h-[500px] w-full">
        {compareDevice ? (
          // Show comparison visualizer when a device is selected - full width
          <ComparisonVisualizer deviceA={device} deviceB={compareDevice} />
        ) : (
          // Show single device view when no comparison - centered with full width
          <div className="w-full min-h-[450px] flex items-center justify-center">
            <div className="w-full">
              <SingleDeviceView device={device} />
            </div>
          </div>
        )}
      </div>

      {/* Quick comparison hint */}
      {!compareDevice && relatedDevices.length > 0 && (
        <p className="text-center text-xs text-gray-500 mt-3">
          Select a device above to see instant visual comparison
        </p>
      )}
    </div>
  );
}
