import { useState, useMemo } from 'react';

type CalculatorMode = 'scale' | 'compare';
type ScaleMethod = 'percentage' | 'targetWidth' | 'targetHeight';

// Resolution presets
const RESOLUTION_PRESETS = [
  // Video/Display standards
  { label: '720p', w: 1280, h: 720, category: 'video' },
  { label: '1080p', w: 1920, h: 1080, category: 'video' },
  { label: '1440p', w: 2560, h: 1440, category: 'video' },
  { label: '4K', w: 3840, h: 2160, category: 'video' },
  { label: '5K', w: 5120, h: 2880, category: 'video' },
  { label: '8K', w: 7680, h: 4320, category: 'video' },
  // Social media
  { label: 'Instagram', w: 1080, h: 1080, category: 'social' },
  { label: 'TikTok', w: 1080, h: 1920, category: 'social' },
  // Mobile
  { label: 'iPhone 15', w: 1179, h: 2556, category: 'mobile' },
];

// Format large numbers
function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format megapixels
function formatMegapixels(pixels: number): string {
  const mp = pixels / 1000000;
  if (mp >= 1) {
    return `${formatNumber(mp, 2)} MP`;
  }
  return `${formatNumber(pixels / 1000, 1)}K px`;
}

export default function ResolutionCalculator() {
  const [mode, setMode] = useState<CalculatorMode>('scale');

  // Scale mode state
  const [originalWidth, setOriginalWidth] = useState('1920');
  const [originalHeight, setOriginalHeight] = useState('1080');
  const [scaleMethod, setScaleMethod] = useState<ScaleMethod>('percentage');
  const [scalePercentage, setScalePercentage] = useState('150');
  const [targetWidth, setTargetWidth] = useState('2560');
  const [targetHeight, setTargetHeight] = useState('1440');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Compare mode state
  const [resA_width, setResA_width] = useState('1920');
  const [resA_height, setResA_height] = useState('1080');
  const [resB_width, setResB_width] = useState('3840');
  const [resB_height, setResB_height] = useState('2160');

  // Scale mode calculations
  const scaleResults = useMemo(() => {
    const origW = parseFloat(originalWidth);
    const origH = parseFloat(originalHeight);

    if (!origW || !origH || origW <= 0 || origH <= 0) return null;

    let newW: number;
    let newH: number;
    let scaleFactor: number;

    switch (scaleMethod) {
      case 'percentage': {
        const pct = parseFloat(scalePercentage);
        if (!pct || pct <= 0) return null;
        scaleFactor = pct / 100;
        newW = origW * scaleFactor;
        newH = origH * scaleFactor;
        break;
      }
      case 'targetWidth': {
        const tW = parseFloat(targetWidth);
        if (!tW || tW <= 0) return null;
        scaleFactor = tW / origW;
        newW = tW;
        newH = lockAspectRatio ? origH * scaleFactor : parseFloat(targetHeight) || origH;
        break;
      }
      case 'targetHeight': {
        const tH = parseFloat(targetHeight);
        if (!tH || tH <= 0) return null;
        scaleFactor = tH / origH;
        newH = tH;
        newW = lockAspectRatio ? origW * scaleFactor : parseFloat(targetWidth) || origW;
        break;
      }
      default:
        return null;
    }

    const origPixels = origW * origH;
    const newPixels = newW * newH;

    return {
      original: { w: origW, h: origH, pixels: origPixels },
      scaled: { w: Math.round(newW), h: Math.round(newH), pixels: newPixels },
      scaleFactor,
      pixelRatio: newPixels / origPixels,
    };
  }, [originalWidth, originalHeight, scaleMethod, scalePercentage, targetWidth, targetHeight, lockAspectRatio]);

  // Compare mode calculations
  const compareResults = useMemo(() => {
    const aW = parseFloat(resA_width);
    const aH = parseFloat(resA_height);
    const bW = parseFloat(resB_width);
    const bH = parseFloat(resB_height);

    if (!aW || !aH || !bW || !bH || aW <= 0 || aH <= 0 || bW <= 0 || bH <= 0) return null;

    const aPixels = aW * aH;
    const bPixels = bW * bH;

    return {
      resA: { w: aW, h: aH, pixels: aPixels, ratio: aW / aH },
      resB: { w: bW, h: bH, pixels: bPixels, ratio: bW / bH },
      widthDiff: bW - aW,
      heightDiff: bH - aH,
      pixelDiff: bPixels - aPixels,
      pixelRatio: bPixels / aPixels,
      widthRatio: bW / aW,
      heightRatio: bH / aH,
    };
  }, [resA_width, resA_height, resB_width, resB_height]);

  // Handle preset click for scale mode
  const handleScalePreset = (preset: typeof RESOLUTION_PRESETS[0]) => {
    setOriginalWidth(String(preset.w));
    setOriginalHeight(String(preset.h));
  };

  // Handle preset click for compare mode
  const handleComparePresetA = (preset: typeof RESOLUTION_PRESETS[0]) => {
    setResA_width(String(preset.w));
    setResA_height(String(preset.h));
  };

  const handleComparePresetB = (preset: typeof RESOLUTION_PRESETS[0]) => {
    setResB_width(String(preset.w));
    setResB_height(String(preset.h));
  };

  // Swap resolutions in compare mode
  const handleSwapResolutions = () => {
    const tempW = resA_width;
    const tempH = resA_height;
    setResA_width(resB_width);
    setResA_height(resB_height);
    setResB_width(tempW);
    setResB_height(tempH);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Resolution Calculator</h2>
        <p className="text-primary-200 text-sm mt-1">
          Scale resolutions and compare pixel counts
        </p>
      </div>

      {/* Main Layout */}
      <div className="lg:flex lg:flex-row">
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-[400px] lg:min-w-[400px] p-5 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">

          {/* Mode Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-5">
            <button
              onClick={() => setMode('scale')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'scale'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Scale Resolution
            </button>
            <button
              onClick={() => setMode('compare')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mode === 'compare'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Compare
            </button>
          </div>

          {/* Scale Mode */}
          {mode === 'scale' && (
            <>
              {/* Presets */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {RESOLUTION_PRESETS.filter(p => p.category === 'video').map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleScalePreset(preset)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-full text-sm font-medium transition-colors border border-transparent hover:border-primary-300 dark:hover:border-primary-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Original Resolution */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original Resolution
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={originalWidth}
                    onChange={(e) => setOriginalWidth(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="1920"
                    min="1"
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-xl flex-shrink-0">×</span>
                  <input
                    type="number"
                    value={originalHeight}
                    onChange={(e) => setOriginalHeight(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="1080"
                    min="1"
                  />
                </div>
              </div>

              {/* Scale Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scale Method
                </label>
                <div className="space-y-2">
                  {/* Percentage */}
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="scaleMethod"
                      value="percentage"
                      checked={scaleMethod === 'percentage'}
                      onChange={() => setScaleMethod('percentage')}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">By Percentage</span>
                    {scaleMethod === 'percentage' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={scalePercentage}
                          onChange={(e) => setScalePercentage(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                          min="1"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    )}
                  </label>

                  {/* Target Width */}
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="scaleMethod"
                      value="targetWidth"
                      checked={scaleMethod === 'targetWidth'}
                      onChange={() => setScaleMethod('targetWidth')}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">Target Width</span>
                    {scaleMethod === 'targetWidth' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={targetWidth}
                          onChange={(e) => setTargetWidth(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                          min="1"
                        />
                        <span className="text-sm text-gray-500">px</span>
                      </div>
                    )}
                  </label>

                  {/* Target Height */}
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="scaleMethod"
                      value="targetHeight"
                      checked={scaleMethod === 'targetHeight'}
                      onChange={() => setScaleMethod('targetHeight')}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">Target Height</span>
                    {scaleMethod === 'targetHeight' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={targetHeight}
                          onChange={(e) => setTargetHeight(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                          min="1"
                        />
                        <span className="text-sm text-gray-500">px</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Lock Aspect Ratio */}
                {(scaleMethod === 'targetWidth' || scaleMethod === 'targetHeight') && (
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Lock aspect ratio</span>
                  </label>
                )}
              </div>

              {/* Scale Results */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                {scaleResults ? (
                  <div className="space-y-3">
                    {/* New Resolution */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">New Resolution</p>
                      <p className="text-2xl font-bold text-white">
                        {scaleResults.scaled.w} × {scaleResults.scaled.h}
                      </p>
                      <p className="text-sm text-primary-200 mt-1">
                        {formatNumber(scaleResults.scaleFactor * 100, 1)}% scale ({formatNumber(scaleResults.scaleFactor, 2)}x)
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Original</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatMegapixels(scaleResults.original.pixels)}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Scaled</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatMegapixels(scaleResults.scaled.pixels)}</p>
                      </div>
                    </div>

                    {/* Pixel Increase */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3">
                      <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">Pixel Change</p>
                      <p className="text-sm font-semibold text-white">
                        {scaleResults.pixelRatio >= 1 ? '+' : ''}{formatNumber((scaleResults.pixelRatio - 1) * 100, 1)}% ({formatNumber(scaleResults.pixelRatio, 2)}x pixels)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p>Enter resolution to calculate</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Compare Mode */}
          {mode === 'compare' && (
            <>
              {/* Resolution A */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Resolution A
                  </label>
                  <div className="flex gap-1">
                    {RESOLUTION_PRESETS.slice(0, 4).map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleComparePresetA(preset)}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-600 dark:text-gray-400 rounded transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={resA_width}
                    onChange={(e) => setResA_width(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="1920"
                    min="1"
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-xl flex-shrink-0">×</span>
                  <input
                    type="number"
                    value={resA_height}
                    onChange={(e) => setResA_height(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="1080"
                    min="1"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-2">
                <button
                  onClick={handleSwapResolutions}
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Swap resolutions"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* Resolution B */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Resolution B
                  </label>
                  <div className="flex gap-1">
                    {RESOLUTION_PRESETS.slice(2, 6).map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleComparePresetB(preset)}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-600 dark:text-gray-400 rounded transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={resB_width}
                    onChange={(e) => setResB_width(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="3840"
                    min="1"
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-xl flex-shrink-0">×</span>
                  <input
                    type="number"
                    value={resB_height}
                    onChange={(e) => setResB_height(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center font-semibold"
                    placeholder="2160"
                    min="1"
                  />
                </div>
              </div>

              {/* Compare Results */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                {compareResults ? (
                  <div className="space-y-3">
                    {/* Pixel Ratio */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-primary-100 uppercase tracking-wide mb-1">Pixel Difference</p>
                      <p className="text-2xl font-bold text-white">
                        {formatNumber(compareResults.pixelRatio, 2)}x
                      </p>
                      <p className="text-sm text-primary-200 mt-1">
                        {compareResults.pixelDiff >= 0 ? '+' : ''}{formatMegapixels(Math.abs(compareResults.pixelDiff))}
                      </p>
                    </div>

                    {/* Dimension Changes */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Width</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {compareResults.widthDiff >= 0 ? '+' : ''}{compareResults.widthDiff}px
                        </p>
                        <p className="text-xs text-gray-400">({formatNumber(compareResults.widthRatio, 2)}x)</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Height</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {compareResults.heightDiff >= 0 ? '+' : ''}{compareResults.heightDiff}px
                        </p>
                        <p className="text-xs text-gray-400">({formatNumber(compareResults.heightRatio, 2)}x)</p>
                      </div>
                    </div>

                    {/* Pixel Counts */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">A: {compareResults.resA.w}×{compareResults.resA.h}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMegapixels(compareResults.resA.pixels)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">B: {compareResults.resB.w}×{compareResults.resB.h}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatMegapixels(compareResults.resB.pixels)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p>Enter resolutions to compare</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel: Visualizer */}
        <div className="w-full lg:flex-1 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-6 min-h-[400px] lg:min-h-[500px] flex flex-col">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Resolution Visualizer</h3>

          <div className="flex-1 flex items-center justify-center relative">
            {/* Scale Mode Visualization */}
            {mode === 'scale' && scaleResults && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Container for nested boxes - aligned to top-left */}
                <div className="relative flex items-start justify-start" style={{ width: '85%', height: '85%' }}>
                  {/* Scaled (outer) box */}
                  <div
                    className="relative border-3 border-primary-400 bg-primary-500/10 rounded-lg transition-all duration-300"
                    style={{
                      aspectRatio: `${scaleResults.scaled.w} / ${scaleResults.scaled.h}`,
                      width: scaleResults.scaleFactor >= 1 ? '100%' : `${scaleResults.scaleFactor * 100}%`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  >
                    {/* Scaled label - top right corner */}
                    <div className="absolute top-2 right-2 text-right">
                      <p className="text-lg font-bold text-white">
                        {scaleResults.scaled.w} × {scaleResults.scaled.h}
                      </p>
                      <p className="text-xs text-primary-300">Scaled ({formatNumber(scaleResults.scaleFactor, 1)}x)</p>
                    </div>

                    {/* Original (inner) box - positioned at top-left */}
                    <div
                      className="absolute top-3 left-3 border-2 border-dashed border-gray-400 bg-gray-500/10 rounded transition-all duration-300"
                      style={{
                        aspectRatio: `${scaleResults.original.w} / ${scaleResults.original.h}`,
                        width: scaleResults.scaleFactor >= 1 ? `${(1 / scaleResults.scaleFactor) * 100 - 5}%` : '95%',
                        maxWidth: 'calc(100% - 24px)',
                        maxHeight: 'calc(100% - 24px)',
                      }}
                    >
                      {/* Original label - bottom left inside */}
                      <div className="absolute bottom-2 left-2">
                        <p className="text-sm font-semibold text-gray-300">
                          {scaleResults.original.w} × {scaleResults.original.h}
                        </p>
                        <p className="text-xs text-gray-500">Original</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-400" />
                    <span>Original</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-primary-400" />
                    <span>Scaled ({formatNumber(scaleResults.scaleFactor, 2)}x)</span>
                  </div>
                </div>

                {/* Pixel Comparison Bar */}
                <div className="absolute bottom-4 right-4 w-40">
                  <div className="text-xs text-gray-500 mb-1">Pixel Count</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gray-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (scaleResults.original.pixels / scaleResults.scaled.pixels) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 w-14 text-right">{formatMegapixels(scaleResults.original.pixels)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (scaleResults.scaled.pixels / scaleResults.original.pixels) * 100 / Math.max(scaleResults.pixelRatio, 1))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-primary-400 w-14 text-right">{formatMegapixels(scaleResults.scaled.pixels)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compare Mode Visualization */}
            {mode === 'compare' && compareResults && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Container for nested boxes */}
                <div className="relative flex items-start justify-start" style={{ width: '85%', height: '85%' }}>
                  {/* Resolution B (outer) box */}
                  <div
                    className="relative border-3 border-primary-400 bg-primary-500/10 rounded-lg transition-all duration-300"
                    style={{
                      aspectRatio: `${compareResults.resB.w} / ${compareResults.resB.h}`,
                      width: compareResults.pixelRatio >= 1 ? '100%' : `${compareResults.widthRatio * 100}%`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  >
                    {/* Resolution B label - top right corner */}
                    <div className="absolute top-2 right-2 text-right">
                      <p className="text-lg font-bold text-white">
                        {compareResults.resB.w} × {compareResults.resB.h}
                      </p>
                      <p className="text-xs text-primary-300">Resolution B</p>
                    </div>

                    {/* Resolution A (inner) box */}
                    <div
                      className="absolute top-3 left-3 border-2 border-dashed border-amber-400 bg-amber-500/10 rounded transition-all duration-300"
                      style={{
                        aspectRatio: `${compareResults.resA.w} / ${compareResults.resA.h}`,
                        width: compareResults.pixelRatio >= 1 ? `${(1 / compareResults.widthRatio) * 100 - 5}%` : '95%',
                        maxWidth: 'calc(100% - 24px)',
                        maxHeight: 'calc(100% - 24px)',
                      }}
                    >
                      {/* Resolution A label - bottom left inside */}
                      <div className="absolute bottom-2 left-2">
                        <p className="text-sm font-semibold text-amber-300">
                          {compareResults.resA.w} × {compareResults.resA.h}
                        </p>
                        <p className="text-xs text-amber-500">Resolution A</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-400" />
                    <span>Resolution A</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-primary-400" />
                    <span>Resolution B</span>
                  </div>
                </div>

                {/* Pixel Comparison Bar */}
                <div className="absolute bottom-4 right-4 w-40">
                  <div className="text-xs text-gray-500 mb-1">Pixel Count</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (compareResults.resA.pixels / Math.max(compareResults.resA.pixels, compareResults.resB.pixels)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-amber-400 w-14 text-right">{formatMegapixels(compareResults.resA.pixels)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (compareResults.resB.pixels / Math.max(compareResults.resA.pixels, compareResults.resB.pixels)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-primary-400 w-14 text-right">{formatMegapixels(compareResults.resB.pixels)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {((mode === 'scale' && !scaleResults) || (mode === 'compare' && !compareResults)) && (
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
                  <path d="M21 3l-9 9M14 3h7v7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Enter resolutions to visualize</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
