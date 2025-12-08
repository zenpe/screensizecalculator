import { useState, useMemo } from 'react';
import { devices, parseResolution, getLatestIphone, getLatestSamsung, getLatestIphoneWithPPI, getLatestSamsungWithPPI } from '../../data/devices';

type CalculatorMode = 'calculatePPI' | 'findResolution';

// Get latest iPhone and Samsung from devices.ts
const latestIphone = getLatestIphone();
const latestSamsung = getLatestSamsung();

// Build phone presets
const phonePresets = [latestIphone, latestSamsung]
  .filter((d): d is NonNullable<typeof d> => d !== null && d !== undefined)
  .map(d => {
    const res = parseResolution(d.resolution);
    return res ? { label: d.name, w: res.w, h: res.h, diagonal: d.diagonal, category: 'phone' as const } : null;
  })
  .filter((d): d is NonNullable<typeof d> => d !== null);

// Typical monitor presets
const monitorPresets = [
  { label: '24" FHD', w: 1920, h: 1080, diagonal: 24, category: 'monitor' as const },
  { label: '27" QHD', w: 2560, h: 1440, diagonal: 27, category: 'monitor' as const },
  { label: '27" 4K', w: 3840, h: 2160, diagonal: 27, category: 'monitor' as const },
  { label: '32" 4K', w: 3840, h: 2160, diagonal: 32, category: 'monitor' as const },
];

const DEVICE_PRESETS = [...phonePresets, ...monitorPresets];

// Get latest phone PPI for reference
const latestIphonePPI = getLatestIphoneWithPPI();
const latestSamsungPPI = getLatestSamsungWithPPI();

// Reference devices for comparison (in visualizer)
const REFERENCE_DEVICES = [
  latestIphonePPI ? { label: latestIphonePPI.device.name, ppi: latestIphonePPI.ppi } : { label: 'iPhone', ppi: 460 },
  { label: 'MacBook Pro 14"', ppi: 254 },
  { label: '27" 4K Monitor', ppi: 163 },
  { label: '27" QHD Monitor', ppi: 109 },
  { label: '55" 4K TV', ppi: 80 },
];

// PPI Rating thresholds
function getPPIRating(ppi: number): { label: string; color: string; description: string } {
  if (ppi >= 300) {
    return { label: 'Retina', color: 'text-emerald-500', description: 'Pixel-perfect, no visible pixels' };
  } else if (ppi >= 200) {
    return { label: 'Excellent', color: 'text-green-500', description: 'Very sharp, minimal visible pixels' };
  } else if (ppi >= 150) {
    return { label: 'Good', color: 'text-blue-500', description: 'Sharp for desktop viewing distance' };
  } else if (ppi >= 100) {
    return { label: 'Average', color: 'text-yellow-500', description: 'Acceptable for larger screens' };
  } else {
    return { label: 'Low', color: 'text-red-500', description: 'Visible pixels at normal distance' };
  }
}

// Calculate optimal viewing distance (inches) where pixels become invisible
// Based on human visual acuity of ~1 arcminute
function getOptimalViewingDistance(ppi: number): number {
  // Distance = 3438 / PPI (in inches) for 20/20 vision
  return 3438 / ppi;
}

// Format number
function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function PPICalculator() {
  const [mode, setMode] = useState<CalculatorMode>('calculatePPI');

  // Calculate PPI mode state
  const [resWidth, setResWidth] = useState('2560');
  const [resHeight, setResHeight] = useState('1440');
  const [diagonal, setDiagonal] = useState('27');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  // Find Resolution mode state
  const [targetPPI, setTargetPPI] = useState('110');
  const [targetDiagonal, setTargetDiagonal] = useState('27');
  const [targetUnit, setTargetUnit] = useState<'inches' | 'cm'>('inches');
  const [aspectW, setAspectW] = useState('16');
  const [aspectH, setAspectH] = useState('9');

  // Convert diagonal to inches
  const diagonalInches = useMemo(() => {
    const d = parseFloat(diagonal);
    return unit === 'cm' ? d / 2.54 : d;
  }, [diagonal, unit]);

  const targetDiagonalInches = useMemo(() => {
    const d = parseFloat(targetDiagonal);
    return targetUnit === 'cm' ? d / 2.54 : d;
  }, [targetDiagonal, targetUnit]);

  // Calculate PPI results
  const ppiResults = useMemo(() => {
    const w = parseFloat(resWidth);
    const h = parseFloat(resHeight);
    const d = diagonalInches;

    if (!w || !h || !d || w <= 0 || h <= 0 || d <= 0) return null;

    // PPI = sqrt(w² + h²) / diagonal
    const diagonalPixels = Math.sqrt(w * w + h * h);
    const ppi = diagonalPixels / d;

    // Pixel pitch (mm)
    const pixelPitch = 25.4 / ppi;

    // Optimal viewing distance
    const optimalDistance = getOptimalViewingDistance(ppi);

    // Rating
    const rating = getPPIRating(ppi);

    return {
      ppi,
      pixelPitch,
      optimalDistance,
      rating,
      resolution: { w, h },
      diagonal: d,
    };
  }, [resWidth, resHeight, diagonalInches]);

  // Find Resolution results
  const resolutionResults = useMemo(() => {
    const ppi = parseFloat(targetPPI);
    const d = targetDiagonalInches;
    const aw = parseFloat(aspectW);
    const ah = parseFloat(aspectH);

    if (!ppi || !d || !aw || !ah || ppi <= 0 || d <= 0 || aw <= 0 || ah <= 0) return null;

    // Diagonal pixels = PPI × diagonal
    const diagonalPixels = ppi * d;

    // From diagonal² = w² + h² and w/h = aw/ah
    // h = diagonal / sqrt((aw/ah)² + 1)
    const aspectRatio = aw / ah;
    const height = diagonalPixels / Math.sqrt(aspectRatio * aspectRatio + 1);
    const width = height * aspectRatio;

    const rating = getPPIRating(ppi);

    return {
      width: Math.round(width),
      height: Math.round(height),
      ppi,
      diagonal: d,
      rating,
    };
  }, [targetPPI, targetDiagonalInches, aspectW, aspectH]);

  // Handle preset click
  const handlePresetClick = (preset: typeof DEVICE_PRESETS[0]) => {
    if (mode === 'calculatePPI') {
      setResWidth(String(preset.w));
      setResHeight(String(preset.h));
      setDiagonal(String(preset.diagonal));
      setUnit('inches');
    }
  };

  // Handle PPI preset click for Find Resolution mode
  const handlePPIPresetClick = (ppi: number) => {
    setTargetPPI(String(ppi));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">PPI Calculator</h2>
        <p className="text-primary-200 text-sm mt-1">
          Calculate pixel density and screen sharpness
        </p>
      </div>

      {/* Main Layout */}
      <div className="lg:flex lg:flex-row">
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-[400px] lg:min-w-[400px] p-5 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">

          {/* Mode Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-5">
            <button
              onClick={() => setMode('calculatePPI')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'calculatePPI'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Calculate PPI
            </button>
            <button
              onClick={() => setMode('findResolution')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'findResolution'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Find Resolution
            </button>
          </div>

          {/* Calculate PPI Mode */}
          {mode === 'calculatePPI' && (
            <>
              {/* Device Presets */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Device Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEVICE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full text-xs font-medium transition-colors border border-transparent hover:border-primary-300 dark:hover:border-primary-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution (pixels)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={resWidth}
                    onChange={(e) => setResWidth(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="2560"
                    min="1"
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-xl flex-shrink-0">×</span>
                  <input
                    type="number"
                    value={resHeight}
                    onChange={(e) => setResHeight(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="1440"
                    min="1"
                  />
                </div>
              </div>

              {/* Screen Size Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Screen Diagonal
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={diagonal}
                    onChange={(e) => setDiagonal(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg font-semibold"
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

              {/* Results */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                {ppiResults ? (
                  <div className="space-y-3">
                    {/* Main PPI Display */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">Pixel Density</p>
                      <p className="text-4xl font-bold text-white">
                        {Math.round(ppiResults.ppi)}
                        <span className="text-lg ml-1">PPI</span>
                      </p>
                      <p className={`text-sm mt-2 font-semibold ${ppiResults.rating.color.replace('text-', 'text-')}`}>
                        <span className="bg-white/20 px-2 py-0.5 rounded">{ppiResults.rating.label}</span>
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Pixel Pitch</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(ppiResults.pixelPitch, 3)} mm</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Min Distance</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {ppiResults.optimalDistance < 24
                            ? `${formatNumber(ppiResults.optimalDistance, 1)}"`
                            : `${formatNumber(ppiResults.optimalDistance / 12, 1)} ft`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Rating Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Quality Assessment</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{ppiResults.rating.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p>Enter resolution and screen size</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Find Resolution Mode */}
          {mode === 'findResolution' && (
            <>
              {/* PPI Presets */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Target PPI Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {[110, 140, 163, 220, 300, 460].map((ppi) => (
                    <button
                      key={ppi}
                      onClick={() => handlePPIPresetClick(ppi)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full text-xs font-medium transition-colors border border-transparent hover:border-primary-300 dark:hover:border-primary-700"
                    >
                      {ppi} PPI
                    </button>
                  ))}
                </div>
              </div>

              {/* Target PPI Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target PPI
                </label>
                <input
                  type="number"
                  value={targetPPI}
                  onChange={(e) => setTargetPPI(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg font-semibold"
                  placeholder="110"
                  min="1"
                />
              </div>

              {/* Screen Size Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Screen Diagonal
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={targetDiagonal}
                    onChange={(e) => setTargetDiagonal(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg font-semibold"
                    placeholder="27"
                    min="0.1"
                    step="0.1"
                  />
                  <select
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value as 'inches' | 'cm')}
                    className="w-24 flex-shrink-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium"
                  >
                    <option value="inches">inches</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>

              {/* Aspect Ratio Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspect Ratio
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={aspectW}
                    onChange={(e) => setAspectW(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="16"
                    min="1"
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-xl flex-shrink-0">:</span>
                  <input
                    type="number"
                    value={aspectH}
                    onChange={(e) => setAspectH(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="9"
                    min="1"
                  />
                  <div className="flex gap-1 ml-auto">
                    {[{ w: 16, h: 9 }, { w: 16, h: 10 }, { w: 21, h: 9 }].map(({ w, h }) => (
                      <button
                        key={`${w}:${h}`}
                        onClick={() => { setAspectW(String(w)); setAspectH(String(h)); }}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-600 dark:text-gray-400 rounded transition-colors"
                      >
                        {w}:{h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                {resolutionResults ? (
                  <div className="space-y-3">
                    {/* Required Resolution */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">Required Resolution</p>
                      <p className="text-2xl font-bold text-white">
                        {resolutionResults.width} × {resolutionResults.height}
                      </p>
                      <p className="text-sm text-primary-200 mt-1">
                        for {resolutionResults.ppi} PPI at {formatNumber(resolutionResults.diagonal, 1)}"
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Quality Level</p>
                      <p className={`text-lg font-bold ${resolutionResults.rating.color}`}>
                        {resolutionResults.rating.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {resolutionResults.rating.description}
                      </p>
                    </div>

                    {/* Common Resolutions Comparison */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p className="mb-1">Standard resolutions:</p>
                      <div className="space-y-0.5">
                        <p>• 1080p: 1920×1080</p>
                        <p>• 1440p: 2560×1440</p>
                        <p>• 4K: 3840×2160</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p>Enter target PPI and screen size</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel: Visualizer */}
        <div className="w-full lg:flex-1 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-6 min-h-[400px] lg:min-h-[500px] flex flex-col">
          <h3 className="text-sm font-medium text-gray-400 mb-4">PPI Visualizer</h3>

          <div className="flex-1 flex flex-col justify-center">
            {/* Calculate PPI Mode Visualization */}
            {mode === 'calculatePPI' && ppiResults && (
              <div className="space-y-6">
                {/* PPI Gauge */}
                <div className="relative">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>0</span>
                    <span>150</span>
                    <span>300</span>
                    <span>450+</span>
                  </div>
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-emerald-500"
                      style={{ width: `${Math.min(100, (ppiResults.ppi / 450) * 100)}%` }}
                    />
                  </div>
                  <div
                    className="absolute -top-1 w-1 h-6 bg-white rounded shadow-lg transition-all duration-500"
                    style={{ left: `calc(${Math.min(100, (ppiResults.ppi / 450) * 100)}% - 2px)` }}
                  />
                </div>

                {/* Text Clarity Simulator */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-3 text-center">Text Clarity Simulation</p>
                  <div className="flex justify-around items-center">
                    {/* Low PPI (80) - Very blurry */}
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold text-gray-300 mb-1"
                        style={{ filter: 'blur(2px)' }}
                      >
                        Aa
                      </div>
                      <p className="text-xs text-gray-500">80 PPI</p>
                      <p className="text-[10px] text-gray-600">55" TV</p>
                    </div>

                    {/* Current PPI - Dynamic blur */}
                    <div className="text-center">
                      <div
                        className="text-3xl font-bold text-primary-400 mb-1 transition-all duration-300"
                        style={{
                          filter: `blur(${Math.max(0, (1 - ppiResults.ppi / 300) * 2)}px)`
                        }}
                      >
                        Aa
                      </div>
                      <p className="text-xs text-primary-400 font-semibold">{Math.round(ppiResults.ppi)} PPI</p>
                      <p className="text-[10px] text-gray-500">Your Display</p>
                    </div>

                    {/* High PPI (460) - Crystal clear */}
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold text-emerald-400 mb-1"
                        style={{ filter: 'blur(0px)' }}
                      >
                        Aa
                      </div>
                      <p className="text-xs text-emerald-400">460 PPI</p>
                      <p className="text-[10px] text-gray-600">iPhone</p>
                    </div>
                  </div>
                </div>

                {/* Pixel Size Comparison - Dynamic sizes based on real PPI ratio */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-3 text-center">Relative Pixel Size (to scale)</p>
                  <div className="flex justify-around items-end h-20">
                    {/* Low PPI (80) - Largest pixels */}
                    <div className="text-center flex flex-col items-center">
                      <div
                        className="bg-gray-500 rounded-sm mb-2 transition-all duration-300"
                        style={{
                          width: `${Math.round(460 / 80 * 8)}px`,
                          height: `${Math.round(460 / 80 * 8)}px`
                        }}
                      />
                      <p className="text-xs text-gray-500">80 PPI</p>
                    </div>

                    {/* Current PPI - Dynamic size */}
                    <div className="text-center flex flex-col items-center">
                      <div
                        className="bg-primary-400 rounded-sm mb-2 border-2 border-primary-300 transition-all duration-300"
                        style={{
                          width: `${Math.max(4, Math.round(460 / ppiResults.ppi * 8))}px`,
                          height: `${Math.max(4, Math.round(460 / ppiResults.ppi * 8))}px`
                        }}
                      />
                      <p className="text-xs text-primary-400 font-semibold">{Math.round(ppiResults.ppi)} PPI</p>
                    </div>

                    {/* High PPI (460) - Smallest pixels */}
                    <div className="text-center flex flex-col items-center">
                      <div
                        className="bg-emerald-400 rounded-sm mb-2 transition-all duration-300"
                        style={{ width: '8px', height: '8px' }}
                      />
                      <p className="text-xs text-emerald-400">460 PPI</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-600 text-center mt-2">
                    Each square represents one pixel at that density
                  </p>
                </div>

                {/* Reference Comparison */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-3">Compared to Common Devices</p>
                  <div className="space-y-2">
                    {REFERENCE_DEVICES.map((device) => (
                      <div key={device.label} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-28 truncate">{device.label}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              device.ppi <= ppiResults.ppi ? 'bg-gray-500' : 'bg-gray-600'
                            }`}
                            style={{ width: `${Math.min(100, (device.ppi / 500) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">{device.ppi}</span>
                      </div>
                    ))}
                    {/* Current device indicator */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-700">
                      <span className="text-xs text-primary-400 w-28 truncate font-medium">Your Display</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (ppiResults.ppi / 500) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-primary-400 w-12 text-right font-medium">{Math.round(ppiResults.ppi)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Find Resolution Mode Visualization */}
            {mode === 'findResolution' && resolutionResults && (
              <div className="space-y-6">
                {/* Resolution Visual */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-3 text-center">Required Resolution</p>
                  <div className="flex items-center justify-center">
                    <div
                      className="border-2 border-primary-400 bg-primary-900/20 rounded-lg flex items-center justify-center"
                      style={{
                        aspectRatio: `${resolutionResults.width} / ${resolutionResults.height}`,
                        width: '200px',
                        maxHeight: '150px',
                      }}
                    >
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">
                          {resolutionResults.width} × {resolutionResults.height}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNumber(resolutionResults.width * resolutionResults.height / 1000000, 2)} MP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard Resolutions Comparison */}
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-3">Nearest Standard Resolutions</p>
                  <div className="space-y-2">
                    {[
                      { label: '720p HD', w: 1280, h: 720 },
                      { label: '1080p FHD', w: 1920, h: 1080 },
                      { label: '1440p QHD', w: 2560, h: 1440 },
                      { label: '4K UHD', w: 3840, h: 2160 },
                      { label: '5K', w: 5120, h: 2880 },
                    ].map((res) => {
                      const totalPixels = res.w * res.h;
                      const targetPixels = resolutionResults.width * resolutionResults.height;
                      const isClosest = Math.abs(totalPixels - targetPixels) === Math.min(
                        ...([1280*720, 1920*1080, 2560*1440, 3840*2160, 5120*2880].map(p => Math.abs(p - targetPixels)))
                      );
                      return (
                        <div
                          key={res.label}
                          className={`flex items-center gap-2 p-2 rounded ${isClosest ? 'bg-primary-900/30 border border-primary-500/50' : ''}`}
                        >
                          <span className={`text-xs w-20 ${isClosest ? 'text-primary-400 font-medium' : 'text-gray-500'}`}>
                            {res.label}
                          </span>
                          <span className={`text-xs flex-1 ${isClosest ? 'text-primary-300' : 'text-gray-400'}`}>
                            {res.w} × {res.h}
                          </span>
                          {isClosest && (
                            <span className="text-[10px] text-primary-400 bg-primary-900/50 px-2 py-0.5 rounded">
                              Closest
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {((mode === 'calculatePPI' && !ppiResults) || (mode === 'findResolution' && !resolutionResults)) && (
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/>
                  <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>
                </svg>
                <p>Enter values to visualize PPI</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
