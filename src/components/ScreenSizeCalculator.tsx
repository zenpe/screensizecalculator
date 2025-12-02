import { useState, useMemo } from 'react';

// Common aspect ratios
const ASPECT_RATIOS = [
  { label: '16:9 (Widescreen)', value: '16:9', ratio: 16 / 9 },
  { label: '16:10 (Desktop)', value: '16:10', ratio: 16 / 10 },
  { label: '4:3 (Standard)', value: '4:3', ratio: 4 / 3 },
  { label: '21:9 (Ultrawide)', value: '21:9', ratio: 21 / 9 },
  { label: '32:9 (Super Ultrawide)', value: '32:9', ratio: 32 / 9 },
  { label: '3:2 (Surface)', value: '3:2', ratio: 3 / 2 },
  { label: '1:1 (Square)', value: '1:1', ratio: 1 },
  { label: 'Custom', value: 'custom', ratio: null },
];

// Common resolutions
const RESOLUTIONS = [
  { label: '1920 x 1080 (Full HD)', width: 1920, height: 1080 },
  { label: '2560 x 1440 (QHD)', width: 2560, height: 1440 },
  { label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160 },
  { label: '1366 x 768 (HD)', width: 1366, height: 768 },
  { label: '1280 x 720 (720p)', width: 1280, height: 720 },
  { label: '2560 x 1600 (MacBook)', width: 2560, height: 1600 },
  { label: '3440 x 1440 (Ultrawide)', width: 3440, height: 1440 },
  { label: '5120 x 2880 (5K)', width: 5120, height: 2880 },
  { label: 'Custom', width: 0, height: 0 },
];

interface CalculationResults {
  width: number;
  height: number;
  area: number;
  ppi: number;
  totalPixels: number;
  pixelPitch: number;
}

export default function ScreenSizeCalculator() {
  const [diagonal, setDiagonal] = useState<string>('27');
  const [aspectRatioSelect, setAspectRatioSelect] = useState<string>('16:9');
  const [customRatioW, setCustomRatioW] = useState<string>('16');
  const [customRatioH, setCustomRatioH] = useState<string>('9');
  const [resolutionSelect, setResolutionSelect] = useState<string>('1920 x 1080 (Full HD)');
  const [customResW, setCustomResW] = useState<string>('1920');
  const [customResH, setCustomResH] = useState<string>('1080');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  // Get current aspect ratio
  const aspectRatio = useMemo(() => {
    if (aspectRatioSelect === 'custom') {
      const w = parseFloat(customRatioW) || 16;
      const h = parseFloat(customRatioH) || 9;
      return w / h;
    }
    return ASPECT_RATIOS.find(ar => ar.value === aspectRatioSelect)?.ratio || 16 / 9;
  }, [aspectRatioSelect, customRatioW, customRatioH]);

  // Get current resolution
  const resolution = useMemo(() => {
    if (resolutionSelect === 'Custom') {
      return {
        width: parseInt(customResW) || 1920,
        height: parseInt(customResH) || 1080,
      };
    }
    const res = RESOLUTIONS.find(r => r.label === resolutionSelect);
    return res || { width: 1920, height: 1080 };
  }, [resolutionSelect, customResW, customResH]);

  // Convert input diagonal to inches for internal calculations
  const diagonalInInches = useMemo(() => {
    const diag = parseFloat(diagonal);
    if (!diag || diag <= 0) return 0;
    // If input is in cm, convert to inches for calculations
    return unit === 'cm' ? diag / 2.54 : diag;
  }, [diagonal, unit]);

  // Calculate results (always in inches internally)
  const results = useMemo<CalculationResults | null>(() => {
    if (!diagonalInInches || diagonalInInches <= 0) return null;

    // Calculate physical dimensions from diagonal and aspect ratio
    // diagonal² = width² + height²
    // width = height * aspectRatio
    // diagonal² = (height * aspectRatio)² + height²
    // diagonal² = height² * (aspectRatio² + 1)
    // height = diagonal / sqrt(aspectRatio² + 1)
    const height = diagonalInInches / Math.sqrt(aspectRatio * aspectRatio + 1);
    const width = height * aspectRatio;

    // Area in square inches
    const area = width * height;

    // PPI calculation (always uses inches)
    const diagonalPixels = Math.sqrt(
      resolution.width * resolution.width + resolution.height * resolution.height
    );
    const ppi = diagonalPixels / diagonalInInches;

    // Total pixels
    const totalPixels = resolution.width * resolution.height;

    // Pixel pitch (distance between pixels in mm)
    const pixelPitch = 25.4 / ppi;

    return {
      width,
      height,
      area,
      ppi,
      totalPixels,
      pixelPitch,
    };
  }, [diagonalInInches, aspectRatio, resolution]);

  // Screen always fills ~70% of container, credit card scales relative to screen
  // Credit card is 3.375" x 2.125" (standard ISO/IEC 7810 ID-1), diagonal ≈ 3.98"
  const creditCardDiagonal = 3.98; // inches
  const screenToCreditCardRatio = diagonalInInches / creditCardDiagonal;

  // Credit card visual size: scales inversely with screen size
  // At 27" screen, card is ~50px wide; at 85" screen, card is ~16px wide
  const creditCardWidth = useMemo(() => {
    if (!diagonalInInches) return 50;
    // Base size at 27" = 50px, scale down as screen gets larger
    const baseSize = 50;
    const baseScreenSize = 27;
    const scaledSize = baseSize * (baseScreenSize / diagonalInInches);
    // Clamp between 12px and 68px
    return Math.max(12, Math.min(68, scaledSize));
  }, [diagonalInInches]);

  // Format number
  const formatNum = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Convert inches to cm if needed
  const displayValue = (inches: number) => {
    if (unit === 'cm') {
      return formatNum(inches * 2.54);
    }
    return formatNum(inches);
  };

  const unitLabel = unit === 'inches' ? 'in' : 'cm';

  // Generate Amazon search URL and label based on screen size
  const getAmazonInfo = () => {
    if (!diagonalInInches) return { url: 'https://www.amazon.com/s?k=monitor', label: 'Shop Monitors' };

    if (diagonalInInches < 32) {
      // Small screens -> Monitors
      const sizes = [24, 27, 32];
      const nearest = sizes.reduce((prev, curr) =>
        Math.abs(curr - diagonalInInches) < Math.abs(prev - diagonalInInches) ? curr : prev
      );
      return {
        url: `https://www.amazon.com/s?k=${nearest}+inch+monitor+4k`,
        label: `Shop ${nearest}" Monitors`
      };
    } else if (diagonalInInches <= 85) {
      // Medium to large -> TVs
      const sizes = [32, 40, 43, 50, 55, 65, 75, 85];
      const nearest = sizes.reduce((prev, curr) =>
        Math.abs(curr - diagonalInInches) < Math.abs(prev - diagonalInInches) ? curr : prev
      );
      return {
        url: `https://www.amazon.com/s?k=${nearest}+inch+tv+4k`,
        label: `Shop ${nearest}" TVs`
      };
    } else {
      // Very large -> Projectors
      return {
        url: 'https://www.amazon.com/s?k=4k+projector+home+theater',
        label: 'Shop 4K Projectors'
      };
    }
  };

  const amazonInfo = getAmazonInfo();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Screen Size Calculator</h2>
        <p className="text-primary-100 text-sm mt-1">
          Calculate display dimensions, PPI, and more
        </p>
      </div>

      {/* Main Layout */}
      <div className="lg:flex lg:flex-row">
        {/* Left Panel: Fixed width on desktop */}
        <div className="w-full lg:w-[340px] lg:min-w-[340px] lg:max-w-[340px] p-4 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
          {/* Input Section */}
          <div className="space-y-3">
            {/* Screen Size Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Screen Size
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={diagonal}
                  onChange={(e) => setDiagonal(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold"
                  placeholder="55"
                  min="1"
                  step="0.1"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'inches' | 'cm')}
                  className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="inches">inches</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Aspect Ratio
              </label>
              <select
                value={aspectRatioSelect}
                onChange={(e) => setAspectRatioSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
              >
                {ASPECT_RATIOS.map((ar) => (
                  <option key={ar.value} value={ar.value}>
                    {ar.label}
                  </option>
                ))}
              </select>
              {aspectRatioSelect === 'custom' && (
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="number"
                    value={customRatioW}
                    onChange={(e) => setCustomRatioW(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                    placeholder="16"
                    min="1"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="number"
                    value={customRatioH}
                    onChange={(e) => setCustomRatioH(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                    placeholder="9"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Resolution
              </label>
              <select
                value={resolutionSelect}
                onChange={(e) => setResolutionSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
              >
                {RESOLUTIONS.map((res) => (
                  <option key={res.label} value={res.label}>
                    {res.label}
                  </option>
                ))}
              </select>
              {resolutionSelect === 'Custom' && (
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="number"
                    value={customResW}
                    onChange={(e) => setCustomResW(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                    placeholder="1920"
                    min="1"
                  />
                  <span className="text-gray-400">x</span>
                  <input
                    type="number"
                    value={customResH}
                    onChange={(e) => setCustomResH(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                    placeholder="1080"
                    min="1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
            {results ? (
              <div className="space-y-2">
                {/* Stats Grid - 2x3 */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-white rounded p-2 border border-gray-200 text-center">
                    <p className="text-[9px] text-gray-500 uppercase">Width</p>
                    <p className="text-sm font-bold text-primary-600">{displayValue(results.width)}<span className="text-[9px] font-normal text-gray-400 ml-0.5">{unitLabel}</span></p>
                  </div>
                  <div className="bg-white rounded p-2 border border-gray-200 text-center">
                    <p className="text-[9px] text-gray-500 uppercase">Height</p>
                    <p className="text-sm font-bold text-primary-600">{displayValue(results.height)}<span className="text-[9px] font-normal text-gray-400 ml-0.5">{unitLabel}</span></p>
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded p-2 border border-accent-200 text-center">
                    <p className="text-[9px] text-accent-700 uppercase">PPI</p>
                    <p className="text-sm font-bold text-accent-600">{formatNum(results.ppi, 0)}</p>
                  </div>
                  <div className="bg-white rounded p-2 border border-gray-200 text-center">
                    <p className="text-[9px] text-gray-500 uppercase">Area</p>
                    <p className="text-xs font-semibold text-gray-700">{unit === 'cm' ? formatNum(results.area * 6.4516, 0) : formatNum(results.area, 0)}<span className="text-[9px] font-normal text-gray-400 ml-0.5">{unit === 'cm' ? 'cm²' : 'in²'}</span></p>
                  </div>
                  <div className="bg-white rounded p-2 border border-gray-200 text-center">
                    <p className="text-[9px] text-gray-500 uppercase">Pixels</p>
                    <p className="text-xs font-semibold text-gray-700">{(results.totalPixels / 1000000).toFixed(1)}<span className="text-[9px] font-normal text-gray-400 ml-0.5">MP</span></p>
                  </div>
                  <div className="bg-white rounded p-2 border border-gray-200 text-center">
                    <p className="text-[9px] text-gray-500 uppercase">Pitch</p>
                    <p className="text-xs font-semibold text-gray-700">{formatNum(results.pixelPitch, 2)}<span className="text-[9px] font-normal text-gray-400 ml-0.5">mm</span></p>
                  </div>
                </div>

                {/* Amazon CTA */}
                <a
                  href={amazonInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-gray-900 font-semibold py-2 px-3 rounded-lg shadow hover:shadow-md transition-all text-xs"
                >
                  {amazonInfo.label} on Amazon
                </a>
              </div>
            ) : (
              <p className="text-center py-3 text-gray-500 text-sm">Enter screen size to see results</p>
            )}
          </div>
        </div>

        {/* Right Panel: Fills remaining space */}
        <div className="w-full lg:flex-1 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-6 min-h-[400px] lg:min-h-[500px] flex flex-col relative overflow-hidden">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Screen Visualization</h3>

          {results ? (
            <div className="flex-1 flex items-center justify-center relative overflow-hidden pb-12">
              {/* Screen Frame - Always fills ~70% of container width */}
              <svg
                viewBox={`0 0 ${aspectRatio * 100} 100`}
                className="transition-all duration-300 ease-out drop-shadow-2xl"
                style={{
                  width: '75%',
                  maxHeight: '80%',
                }}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Screen Bezel */}
                <rect
                  x="0"
                  y="0"
                  width={aspectRatio * 100}
                  height="100"
                  rx="3"
                  fill="#4B5563"
                />
                {/* Screen Display Area */}
                <rect
                  x="2.5"
                  y="2.5"
                  width={aspectRatio * 100 - 5}
                  height="95"
                  rx="1.5"
                  fill="url(#screenGradient)"
                />
                {/* Corner dots */}
                <circle cx="6" cy="6" r="1" fill="#6B7280" opacity="0.4" />
                <circle cx={aspectRatio * 100 - 6} cy="6" r="1" fill="#6B7280" opacity="0.4" />
                <circle cx="6" cy="94" r="1" fill="#6B7280" opacity="0.4" />
                <circle cx={aspectRatio * 100 - 6} cy="94" r="1" fill="#6B7280" opacity="0.4" />

                {/* Text Content */}
                <text
                  x={aspectRatio * 50}
                  y="40"
                  textAnchor="middle"
                  className="fill-white"
                  style={{ fontSize: '16px', fontWeight: 'bold' }}
                >
                  {formatNum(diagonalInInches, 1)}"
                </text>
                <text
                  x={aspectRatio * 50}
                  y="54"
                  textAnchor="middle"
                  className="fill-gray-300"
                  style={{ fontSize: '7px' }}
                >
                  {resolution.width} x {resolution.height}
                </text>
                <text
                  x={aspectRatio * 50}
                  y="64"
                  textAnchor="middle"
                  className="fill-gray-400"
                  style={{ fontSize: '5px' }}
                >
                  {displayValue(results.width)} x {displayValue(results.height)} {unitLabel}
                </text>

                {/* PPI Badge */}
                <rect
                  x={aspectRatio * 50 - 14}
                  y="70"
                  width="28"
                  height="9"
                  rx="4.5"
                  fill="rgba(245, 158, 11, 0.25)"
                />
                <text
                  x={aspectRatio * 50}
                  y="77"
                  textAnchor="middle"
                  className="fill-amber-400"
                  style={{ fontSize: '5px', fontWeight: '600' }}
                >
                  {formatNum(results.ppi, 0)} PPI
                </text>

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="50%" stopColor="#1F2937" />
                    <stop offset="100%" stopColor="#111827" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Credit Card Reference - Scales with screen size */}
              <div className="absolute bottom-3 right-3 flex flex-col items-end">
                <div className="relative group">
                  <svg
                    width={creditCardWidth}
                    height={creditCardWidth * 0.63}
                    viewBox="0 0 68 43"
                    className="drop-shadow transition-all duration-300"
                  >
                    <rect x="0" y="0" width="68" height="43" rx="4" fill="url(#cardGradient)" stroke="#4B5563" strokeWidth="1" />
                    <rect x="8" y="12" width="12" height="10" rx="2" fill="#D4AF37" opacity="0.9" />
                    <line x1="10" y1="15" x2="18" y2="15" stroke="#B8860B" strokeWidth="0.5" />
                    <line x1="10" y1="17" x2="18" y2="17" stroke="#B8860B" strokeWidth="0.5" />
                    <line x1="10" y1="19" x2="18" y2="19" stroke="#B8860B" strokeWidth="0.5" />
                    <rect x="0" y="28" width="68" height="6" fill="#1F2937" opacity="0.8" />
                    <circle cx="56" cy="14" r="6" fill="#EB001B" opacity="0.9" />
                    <circle cx="62" cy="14" r="6" fill="#F79E1B" opacity="0.7" />
                    <defs>
                      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#374151" />
                        <stop offset="50%" stopColor="#4B5563" />
                        <stop offset="100%" stopColor="#374151" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-700 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Credit Card (3.4" x 2.1")
                  </div>
                </div>
                {/* Scale Label */}
                <p className="mt-1 text-[10px] text-gray-500">
                  Screen = <span className="text-accent-400 font-medium">{formatNum(screenToCreditCardRatio, 0)}x</span> card
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center relative">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2"/>
                  <path d="M8 21h8M12 17v4" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p>Enter screen details to visualize</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
