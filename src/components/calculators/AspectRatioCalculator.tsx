import { useState, useMemo } from 'react';

type CalculatorMode = 'findRatio' | 'newDimension';

// Preset aspect ratios
const PRESET_RATIOS = [
  { label: '16:9', w: 16, h: 9, desc: 'Widescreen' },
  { label: '21:9', w: 21, h: 9, desc: 'Ultrawide' },
  { label: '4:3', w: 4, h: 3, desc: 'Standard' },
  { label: '1:1', w: 1, h: 1, desc: 'Square' },
  { label: '9:16', w: 9, h: 16, desc: 'TikTok/Reels' },
  { label: '3:2', w: 3, h: 2, desc: 'Photo' },
];

// Calculate GCD (Greatest Common Divisor)
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Simplify ratio to smallest integers
function simplifyRatio(w: number, h: number): { w: number; h: number } {
  const divisor = gcd(w, h);
  if (divisor === 0) return { w: 0, h: 0 };
  return {
    w: Math.round(w / divisor),
    h: Math.round(h / divisor),
  };
}

// Format number with specified decimals
function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function AspectRatioCalculator() {
  const [mode, setMode] = useState<CalculatorMode>('findRatio');

  // Find Ratio mode inputs
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1080');

  // New Dimension mode inputs
  const [knownValue, setKnownValue] = useState('1920');
  const [knownType, setKnownType] = useState<'width' | 'height'>('width');
  const [ratioW, setRatioW] = useState('16');
  const [ratioH, setRatioH] = useState('9');

  // Optional diagonal for physical size calculation
  const [diagonal, setDiagonal] = useState('');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  // Results for Find Ratio mode
  const findRatioResults = useMemo(() => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (!w || !h || w <= 0 || h <= 0) return null;

    const simplified = simplifyRatio(w, h);
    const decimal = w / h;
    const gcdValue = gcd(w, h);

    return {
      simplified,
      decimal,
      gcd: gcdValue,
      width: w,
      height: h,
    };
  }, [width, height]);

  // Results for New Dimension mode
  const newDimensionResults = useMemo(() => {
    const known = parseFloat(knownValue);
    const rW = parseFloat(ratioW);
    const rH = parseFloat(ratioH);

    if (!known || !rW || !rH || known <= 0 || rW <= 0 || rH <= 0) return null;

    let calcWidth: number;
    let calcHeight: number;

    if (knownType === 'width') {
      calcWidth = known;
      calcHeight = (known * rH) / rW;
    } else {
      calcHeight = known;
      calcWidth = (known * rW) / rH;
    }

    return {
      width: calcWidth,
      height: calcHeight,
      ratio: { w: rW, h: rH },
      decimal: rW / rH,
    };
  }, [knownValue, knownType, ratioW, ratioH]);

  // Physical dimensions if diagonal is provided
  const physicalDimensions = useMemo(() => {
    const d = parseFloat(diagonal);
    if (!d || d <= 0) return null;

    let ratio: number;
    if (mode === 'findRatio' && findRatioResults) {
      ratio = findRatioResults.decimal;
    } else if (mode === 'newDimension' && newDimensionResults) {
      ratio = newDimensionResults.decimal;
    } else {
      return null;
    }

    // Calculate from diagonal: d² = w² + h², w = h * ratio
    // d² = h² * ratio² + h² = h² * (ratio² + 1)
    // h = d / sqrt(ratio² + 1)
    const physHeight = d / Math.sqrt(ratio * ratio + 1);
    const physWidth = physHeight * ratio;

    return {
      width: unit === 'cm' ? physWidth * 2.54 : physWidth,
      height: unit === 'cm' ? physHeight * 2.54 : physHeight,
    };
  }, [diagonal, unit, mode, findRatioResults, newDimensionResults]);

  // Get current ratio for visualization
  const currentRatio = useMemo(() => {
    if (mode === 'findRatio' && findRatioResults) {
      return {
        w: findRatioResults.simplified.w,
        h: findRatioResults.simplified.h,
        decimal: findRatioResults.decimal,
        pixelW: findRatioResults.width,
        pixelH: findRatioResults.height,
      };
    } else if (mode === 'newDimension' && newDimensionResults) {
      return {
        w: parseFloat(ratioW),
        h: parseFloat(ratioH),
        decimal: newDimensionResults.decimal,
        pixelW: newDimensionResults.width,
        pixelH: newDimensionResults.height,
      };
    }
    return null;
  }, [mode, findRatioResults, newDimensionResults, ratioW, ratioH]);

  // Handle preset click
  const handlePresetClick = (preset: typeof PRESET_RATIOS[0]) => {
    if (mode === 'findRatio') {
      // Set a common resolution for this ratio
      const baseHeight = 1080;
      const baseWidth = Math.round(baseHeight * (preset.w / preset.h));
      setWidth(String(baseWidth));
      setHeight(String(baseHeight));
    } else {
      setRatioW(String(preset.w));
      setRatioH(String(preset.h));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Aspect Ratio Calculator</h2>
        <p className="text-primary-200 text-sm mt-1">
          Calculate ratios and convert dimensions instantly
        </p>
      </div>

      {/* Main Layout */}
      <div className="lg:flex lg:flex-row">
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-[380px] lg:min-w-[380px] p-5 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">

          {/* Mode Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-5">
            <button
              onClick={() => setMode('findRatio')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'findRatio'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Find Ratio
            </button>
            <button
              onClick={() => setMode('newDimension')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'newDimension'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              New Dimension
            </button>
          </div>

          {/* Preset Ratios */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_RATIOS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full text-sm font-medium transition-colors border border-transparent hover:border-primary-300 dark:hover:border-primary-700"
                  title={preset.desc}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Section - Find Ratio Mode */}
          {mode === 'findRatio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Width (pixels)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg font-semibold"
                  placeholder="1920"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height (pixels)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg font-semibold"
                  placeholder="1080"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Input Section - New Dimension Mode */}
          {mode === 'newDimension' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aspect Ratio
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={ratioW}
                    onChange={(e) => setRatioW(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="16"
                    min="1"
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-xl flex-shrink-0">:</span>
                  <input
                    type="number"
                    value={ratioH}
                    onChange={(e) => setRatioH(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="9"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Known Dimension
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={knownValue}
                    onChange={(e) => setKnownValue(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg font-semibold"
                    placeholder="1920"
                    min="1"
                  />
                  <select
                    value={knownType}
                    onChange={(e) => setKnownType(e.target.value as 'width' | 'height')}
                    className="w-24 flex-shrink-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium"
                  >
                    <option value="width">Width</option>
                    <option value="height">Height</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Optional: Diagonal for physical size */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Screen Diagonal <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={diagonal}
                onChange={(e) => setDiagonal(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="27"
                min="0.1"
                step="0.1"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'inches' | 'cm')}
                className="w-24 flex-shrink-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium"
              >
                <option value="inches">inches</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* Results Section */}
          <div className="mt-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            {mode === 'findRatio' && findRatioResults ? (
              <div className="space-y-3">
                {/* Main Ratio Display */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-center">
                  <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">Aspect Ratio</p>
                  <p className="text-3xl font-bold text-white">
                    {findRatioResults.simplified.w}:{findRatioResults.simplified.h}
                  </p>
                  <p className="text-sm text-primary-200 mt-1">
                    {formatNumber(findRatioResults.decimal, 4)}:1
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Width</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{findRatioResults.width}<span className="text-xs font-normal text-gray-400 ml-1">px</span></p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Height</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{findRatioResults.height}<span className="text-xs font-normal text-gray-400 ml-1">px</span></p>
                  </div>
                </div>

                {/* Physical Dimensions */}
                {physicalDimensions && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3">
                    <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">Physical Size ({diagonal}")</p>
                    <p className="text-sm font-semibold text-white">
                      {formatNumber(physicalDimensions.width)} × {formatNumber(physicalDimensions.height)} {unit}
                    </p>
                  </div>
                )}
              </div>
            ) : mode === 'newDimension' && newDimensionResults ? (
              <div className="space-y-3">
                {/* Calculated Dimensions */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-center">
                  <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">Calculated Dimensions</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(newDimensionResults.width)} × {Math.round(newDimensionResults.height)}
                  </p>
                  <p className="text-sm text-primary-200 mt-1">pixels</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ratio</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{ratioW}:{ratioH}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Decimal</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(newDimensionResults.decimal, 3)}</p>
                  </div>
                </div>

                {/* Physical Dimensions */}
                {physicalDimensions && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3">
                    <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">Physical Size ({diagonal}")</p>
                    <p className="text-sm font-semibold text-white">
                      {formatNumber(physicalDimensions.width)} × {formatNumber(physicalDimensions.height)} {unit}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p>Enter dimensions to calculate</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Visualizer */}
        <div className="w-full lg:flex-1 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-6 min-h-[400px] lg:min-h-[500px] flex flex-col">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Ratio Visualizer</h3>

          <div className="flex-1 flex items-center justify-center relative">
            {currentRatio ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Reference 16:9 Ghost Box */}
                <div
                  className="absolute border-2 border-dashed border-gray-600 opacity-30"
                  style={{
                    aspectRatio: '16 / 9',
                    width: '70%',
                    maxHeight: '80%',
                  }}
                />

                {/* Dynamic Ratio Box */}
                <div
                  className="relative border-4 border-primary-400 bg-primary-900/20 rounded-lg transition-all duration-300 flex items-center justify-center"
                  style={{
                    aspectRatio: `${currentRatio.w} / ${currentRatio.h}`,
                    width: currentRatio.decimal >= 1 ? '70%' : 'auto',
                    height: currentRatio.decimal < 1 ? '70%' : 'auto',
                    maxWidth: '85%',
                    maxHeight: '85%',
                  }}
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-2 grid grid-cols-4 grid-rows-4 opacity-20">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="border border-primary-400/30" />
                    ))}
                  </div>

                  {/* Center Content */}
                  <div className="text-center z-10 p-4">
                    <p className="text-3xl font-bold text-white mb-1">
                      {currentRatio.w}:{currentRatio.h}
                    </p>
                    <p className="text-sm text-gray-300">
                      {Math.round(currentRatio.pixelW)} × {Math.round(currentRatio.pixelH)} px
                    </p>
                    <div className="mt-2 inline-block px-3 py-1 bg-primary-500/30 rounded-full">
                      <p className="text-xs text-primary-300">
                        {formatNumber(currentRatio.decimal, 3)}:1
                      </p>
                    </div>
                  </div>

                  {/* Width Label */}
                  <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="h-px w-8 bg-gray-500" />
                      <span className="text-xs text-gray-400">Width</span>
                      <div className="h-px w-8 bg-gray-500" />
                    </div>
                  </div>

                  {/* Height Label */}
                  <div className="absolute -right-12 top-0 bottom-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 -rotate-90">
                      <div className="h-px w-6 bg-gray-500" />
                      <span className="text-xs text-gray-400">Height</span>
                      <div className="h-px w-6 bg-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-600" />
                    <span>16:9 Reference</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-primary-400" />
                    <span>Current Ratio</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M3 9h18M9 3v18" strokeWidth="2"/>
                </svg>
                <p>Enter dimensions to visualize</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
