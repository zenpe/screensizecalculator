import { useState } from 'react';
import { getAmazonSearchUrl, siteConfig } from '../../site.config';
import type { DeviceMode } from './config';
import { DEVICE_CONFIGS } from './config';
import { useScreenCalculation } from './hooks/useScreenCalculation';
import { CreditCardSVG, HandHoldingPhoneSVG, HumanSilhouetteSVG } from './references';

// Utility functions
const formatNum = (num: number, decimals: number = 2) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

interface ScreenSizeCalculatorProps {
  initialDeviceMode?: DeviceMode;
  showTabs?: boolean;
}

export default function ScreenSizeCalculator({ initialDeviceMode = 'monitor', showTabs = true }: ScreenSizeCalculatorProps) {
  // Form state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(initialDeviceMode);
  const [diagonal, setDiagonal] = useState<string>(DEVICE_CONFIGS[initialDeviceMode].defaultDiagonal);
  const [aspectRatioSelect, setAspectRatioSelect] = useState<string>(initialDeviceMode === 'phone' ? '19.5:9' : '16:9');
  const [customRatioW, setCustomRatioW] = useState<string>('16');
  const [customRatioH, setCustomRatioH] = useState<string>('9');
  const [resolutionSelect, setResolutionSelect] = useState<string>(DEVICE_CONFIGS[initialDeviceMode].defaultResolution);
  const [customResW, setCustomResW] = useState<string>('1920');
  const [customResH, setCustomResH] = useState<string>('1080');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
  const [throwRatio, setThrowRatio] = useState<string>('1.5');

  // Use calculation hook
  const {
    deviceConfig,
    currentResolutions,
    currentAspectRatios,
    diagonalInInches,
    aspectRatio,
    resolution,
    results,
    referenceSize,
    projectorCalcs,
    tvViewingCalcs,
  } = useScreenCalculation({
    deviceMode,
    diagonal,
    unit,
    aspectRatioSelect,
    customRatioW,
    customRatioH,
    resolutionSelect,
    customResW,
    customResH,
    throwRatio,
  });

  // Handle device mode change
  const handleDeviceModeChange = (newMode: DeviceMode) => {
    setDeviceMode(newMode);
    const config = DEVICE_CONFIGS[newMode];
    setDiagonal(config.defaultDiagonal);
    setResolutionSelect(config.defaultResolution);
    if (newMode === 'phone') {
      setAspectRatioSelect('19.5:9');
    } else {
      setAspectRatioSelect('16:9');
    }
    // Dispatch custom event for page-level color sync
    window.dispatchEvent(new CustomEvent('deviceModeChange', { detail: { mode: newMode } }));
  };

  // Unit conversion helpers
  const unitLabel = unit === 'inches' ? 'in' : 'cm';

  const displayValue = (inches: number) => {
    if (unit === 'cm') {
      return formatNum(inches * 2.54);
    }
    return formatNum(inches);
  };

  // Generate Amazon search URL and label based on device mode and screen size
  const getAmazonInfo = () => {
    if (!diagonalInInches) {
      return {
        url: getAmazonSearchUrl(deviceConfig.shopKeyword),
        label: deviceConfig.shopLabel
      };
    }

    switch (deviceMode) {
      case 'phone': {
        return {
          url: getAmazonSearchUrl('smartphone unlocked'),
          label: 'Shop Smartphones'
        };
      }
      case 'monitor': {
        const sizes = [24, 27, 32, 34];
        const nearest = sizes.reduce((prev, curr) =>
          Math.abs(curr - diagonalInInches) < Math.abs(prev - diagonalInInches) ? curr : prev
        );
        return {
          url: getAmazonSearchUrl(`${nearest} inch monitor 4k`),
          label: `Shop ${nearest}" Monitors`
        };
      }
      case 'tv': {
        const sizes = [32, 40, 43, 50, 55, 65, 75, 85];
        const nearest = sizes.reduce((prev, curr) =>
          Math.abs(curr - diagonalInInches) < Math.abs(prev - diagonalInInches) ? curr : prev
        );
        return {
          url: getAmazonSearchUrl(`${nearest} inch tv 4k`),
          label: `Shop ${nearest}" TVs`
        };
      }
      case 'projector': {
        return {
          url: getAmazonSearchUrl('4k projector home theater'),
          label: 'Shop Projectors & Screens'
        };
      }
      default:
        return { url: 'https://www.amazon.com', label: 'Shop on Amazon' };
    }
  };

  const amazonInfo = getAmazonInfo();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden" role="application" aria-label="Screen size calculator with TV viewing distance and projector throw distance">
      {/* Header */}
      <div className={`bg-gradient-to-r ${deviceConfig.colors.headerGradient} px-6 py-4 transition-colors duration-300`}>
        <h2 className="text-xl font-semibold text-white">{deviceConfig.headerTitle}</h2>
        <p className={`${deviceConfig.colors.headerText} text-sm mt-1`}>
          {deviceConfig.headerSubtitle}
        </p>
      </div>

      {/* Device Mode Tabs - Segmented Control */}
      {showTabs && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex bg-gray-200 dark:bg-gray-600 rounded-lg p-1 gap-1" role="tablist" aria-label="Device type selection">
            {(Object.keys(DEVICE_CONFIGS) as DeviceMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleDeviceModeChange(mode)}
                role="tab"
                aria-selected={deviceMode === mode}
                aria-label={`${DEVICE_CONFIGS[mode].label} mode`}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  deviceMode === mode
                    ? `bg-white dark:bg-gray-800 ${DEVICE_CONFIGS[mode].colors.activeTab} shadow-sm`
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-500'
                }`}
              >
                <span className="text-base" aria-hidden="true">{DEVICE_CONFIGS[mode].icon}</span>
                <span className="hidden sm:inline">{DEVICE_CONFIGS[mode].label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="lg:flex lg:flex-row">
        {/* Left Panel: Fixed width on desktop */}
        <div className="w-full lg:w-[340px] lg:min-w-[340px] lg:max-w-[340px] p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Input Section */}
          <div className="space-y-3">
            {/* Screen Size Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Screen Size
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={diagonal}
                  onChange={(e) => setDiagonal(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="55"
                  min="1"
                  step="0.1"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'inches' | 'cm')}
                  aria-label="Unit for screen size"
                  className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-gray-50 dark:bg-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="inches">inches</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aspect Ratio
              </label>
              <select
                value={aspectRatioSelect}
                onChange={(e) => setAspectRatioSelect(e.target.value)}
                aria-label="Aspect ratio of the screen"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              >
                {currentAspectRatios.map((ar) => (
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
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="16"
                    min="1"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="number"
                    value={customRatioH}
                    onChange={(e) => setCustomRatioH(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="9"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resolution
              </label>
              <select
                value={resolutionSelect}
                onChange={(e) => setResolutionSelect(e.target.value)}
                aria-label="Resolution of the screen"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              >
                {currentResolutions.map((res) => (
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
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1920"
                    min="1"
                  />
                  <span className="text-gray-500">x</span>
                  <input
                    type="number"
                    value={customResH}
                    onChange={(e) => setCustomResH(e.target.value)}
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1080"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* Throw Ratio - Projector Mode Only */}
            {deviceMode === 'projector' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Throw Ratio
                  <span className="ml-1 text-gray-500 dark:text-gray-400 font-normal">(distance ÷ width)</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={throwRatio}
                    onChange={(e) => setThrowRatio(e.target.value)}
                    aria-label="Projector throw ratio"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="0.5">0.5 (Ultra Short Throw)</option>
                    <option value="0.8">0.8 (Short Throw)</option>
                    <option value="1.2">1.2 (Short Throw)</option>
                    <option value="1.5">1.5 (Standard)</option>
                    <option value="1.8">1.8 (Standard)</option>
                    <option value="2.0">2.0 (Long Throw)</option>
                    <option value="2.5">2.5 (Long Throw)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {throwRatio === 'custom' && (
                  <input
                    type="number"
                    value={throwRatio}
                    onChange={(e) => setThrowRatio(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="1.5"
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            {results ? (
              <div className="space-y-2">
                {/* PPI Highlight for Phone/Tablet Mode */}
                {deviceConfig.highlightPPI && (
                  <div className={`bg-gradient-to-r ${deviceConfig.colors.headerGradient} rounded-lg p-3 text-center shadow-md mb-2`}>
                    <p className="text-[10px] text-white/90 uppercase font-medium tracking-wide">Pixel Density</p>
                    <p className="text-2xl font-bold text-white">{formatNum(results.ppi, 0)} <span className="text-lg">PPI</span></p>
                    <p className="text-[10px] text-white/80 mt-1">
                      {results.ppi >= 400 ? 'Retina-class display' : results.ppi >= 300 ? 'Sharp display' : 'Standard display'}
                    </p>
                  </div>
                )}
                {/* Stats Grid - 2x3 */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">Width</p>
                    <p className={`text-sm font-bold ${deviceConfig.colors.activeTab}`}>{displayValue(results.width)}<span className="text-[9px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">{unitLabel}</span></p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">Height</p>
                    <p className={`text-sm font-bold ${deviceConfig.colors.activeTab}`}>{displayValue(results.height)}<span className="text-[9px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">{unitLabel}</span></p>
                  </div>
                  {!deviceConfig.highlightPPI && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">PPI</p>
                      <p className={`text-sm font-bold ${deviceConfig.colors.activeTab}`}>{formatNum(results.ppi, 0)}</p>
                    </div>
                  )}
                  {deviceConfig.highlightPPI && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">Pitch</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNum(results.pixelPitch, 2)}<span className="text-[9px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">mm</span></p>
                    </div>
                  )}
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">Area</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{unit === 'cm' ? formatNum(results.area * 6.4516, 0) : formatNum(results.area, 0)}<span className="text-[9px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">{unit === 'cm' ? 'cm²' : 'in²'}</span></p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">Pixels</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{(results.totalPixels / 1000000).toFixed(1)}<span className="text-[9px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">MP</span></p>
                  </div>
                  {!deviceConfig.highlightPPI && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">Pitch</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNum(results.pixelPitch, 2)}<span className="text-[9px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">mm</span></p>
                    </div>
                  )}
                  {deviceConfig.highlightPPI && (
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-600 text-center">
                      <p className="text-[9px] text-gray-600 dark:text-gray-300 uppercase">Diagonal</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNum(diagonalInInches, 1)}<span className="text-[9px] font-normal text-gray-500 dark:text-gray-400 ml-0.5">in</span></p>
                    </div>
                  )}
                </div>

                {/* Projector Mode - Throw Distance Card */}
                {projectorCalcs && (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[10px] text-white/90 uppercase font-medium tracking-wide">Throw Distance</p>
                        <p className="text-xl font-bold text-white">
                          {displayValue(projectorCalcs.throwDistance)} <span className="text-sm">{unitLabel}</span>
                        </p>
                        <p className="text-[10px] text-white/70 mt-0.5">
                          {unit === 'inches'
                            ? `≈ ${formatNum(projectorCalcs.throwDistance / 12, 1)} ft`
                            : `≈ ${formatNum(projectorCalcs.throwDistance / 100, 1)} m`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/90 uppercase font-medium tracking-wide">Min Wall Width</p>
                        <p className="text-lg font-bold text-white">
                          {displayValue(projectorCalcs.minWallWidth)} <span className="text-xs">{unitLabel}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-[9px] text-white/70">
                        Projector should be placed {displayValue(projectorCalcs.throwDistance)} {unitLabel} from the screen
                      </p>
                    </div>
                  </div>
                )}

                {/* TV Mode - Viewing Distance Card */}
                {tvViewingCalcs && (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[10px] text-white/90 uppercase font-medium tracking-wide">
                          Optimal Viewing Distance
                        </p>
                        <p className="text-xl font-bold text-white">
                          {unit === 'inches'
                            ? `${formatNum(tvViewingCalcs.optimalDistance / 12, 1)} ft`
                            : `${formatNum(tvViewingCalcs.optimalDistance * 2.54 / 100, 1)} m`
                          }
                        </p>
                        <p className="text-[10px] text-white/70 mt-0.5">
                          ({displayValue(tvViewingCalcs.optimalDistance)} {unitLabel})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/90 uppercase font-medium tracking-wide">Range</p>
                        <p className="text-sm font-bold text-white">
                          {unit === 'inches'
                            ? `${formatNum(tvViewingCalcs.minDistance / 12, 1)} - ${formatNum(tvViewingCalcs.maxDistance / 12, 1)} ft`
                            : `${formatNum(tvViewingCalcs.minDistance * 2.54 / 100, 1)} - ${formatNum(tvViewingCalcs.maxDistance * 2.54 / 100, 1)} m`
                          }
                        </p>
                        {tvViewingCalcs.is4K && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/20 rounded text-[8px] text-white/90">
                            4K: Sit Closer OK
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-[9px] text-white/70">
                        Based on THX & SMPTE standards for {tvViewingCalcs.is4K ? '4K' : 'HD'} content
                      </p>
                    </div>
                  </div>
                )}

                {/* Amazon CTA */}
                {siteConfig.amazon.enabled && (
                  <a
                    href={amazonInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-gray-900 font-semibold py-2 px-3 rounded-lg shadow hover:shadow-md transition-all text-xs"
                  >
                    {amazonInfo.label} on Amazon
                  </a>
                )}
              </div>
            ) : (
              <p className="text-center py-3 text-gray-600 text-sm">Enter screen size to see results</p>
            )}
          </div>
        </div>

        {/* Right Panel: Fills remaining space */}
        <div className={`w-full lg:flex-1 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-6 flex flex-col relative overflow-hidden ${
          deviceMode === 'phone' ? 'min-h-[300px] lg:min-h-[380px]' : 'min-h-[400px] lg:min-h-[500px]'
        }`}>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Screen Visualization</h3>

          {results ? (
            <div className="flex-1 flex items-center justify-center relative overflow-hidden pb-12" role="img" aria-label={`Visual representation of ${formatNum(diagonalInInches, 1)} inch screen with ${resolution.width}x${resolution.height} resolution`}>
              {/* Screen Frame */}
              <svg
                viewBox={`0 0 ${aspectRatio * 100} 100`}
                className="transition-all duration-300 ease-out drop-shadow-2xl"
                style={{
                  // For portrait devices (phone), use fixed height for compact display
                  // For landscape devices, use width-based sizing
                  ...(deviceMode === 'phone'
                    ? { height: '400px', maxWidth: '50%' }
                    : deviceMode === 'tablet'
                    ? { width: '55%', maxHeight: '75%' }
                    : { width: '75%', maxHeight: '80%' }
                  ),
                }}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {/* Screen Bezel - larger radius for phones */}
                <rect
                  x="0"
                  y="0"
                  width={aspectRatio * 100}
                  height="100"
                  rx={deviceMode === 'phone' ? 12 : 3}
                  fill={deviceMode === 'phone' ? '#1F2937' : '#4B5563'}
                />
                {/* Screen Display Area - larger radius for phones */}
                <rect
                  x={deviceMode === 'phone' ? 1.5 : 2.5}
                  y={deviceMode === 'phone' ? 1.5 : 2.5}
                  width={aspectRatio * 100 - (deviceMode === 'phone' ? 3 : 5)}
                  height={deviceMode === 'phone' ? 97 : 95}
                  rx={deviceMode === 'phone' ? 10 : 1.5}
                  fill="url(#screenGradient)"
                />
                {/* Dynamic Island / Notch for phones */}
                {deviceMode === 'phone' && (
                  <rect
                    x={aspectRatio * 50 - 8}
                    y="4"
                    width="16"
                    height="5"
                    rx="2.5"
                    fill="#000"
                  />
                )}
                {/* Corner dots - only for non-phone */}
                {deviceMode !== 'phone' && (
                  <>
                    <circle cx="6" cy="6" r="1" fill="#6B7280" opacity="0.4" />
                    <circle cx={aspectRatio * 100 - 6} cy="6" r="1" fill="#6B7280" opacity="0.4" />
                    <circle cx="6" cy="94" r="1" fill="#6B7280" opacity="0.4" />
                    <circle cx={aspectRatio * 100 - 6} cy="94" r="1" fill="#6B7280" opacity="0.4" />
                  </>
                )}
                {/* Home indicator for phones */}
                {deviceMode === 'phone' && (
                  <rect
                    x={aspectRatio * 50 - 10}
                    y="94"
                    width="20"
                    height="2.5"
                    rx="1.25"
                    fill="#4B5563"
                  />
                )}

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
                  fill={deviceConfig.colors.svgBadgeBg}
                />
                <text
                  x={aspectRatio * 50}
                  y="77"
                  textAnchor="middle"
                  className={deviceConfig.colors.svgFill}
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

              {/* Dynamic Reference Object - Changes based on device mode */}
              <div className="absolute bottom-3 right-3 flex flex-col items-end">
                <div className="relative group">
                  {deviceConfig.referenceType === 'creditCard' && (
                    <CreditCardSVG width={referenceSize.width} />
                  )}
                  {deviceConfig.referenceType === 'hand' && (
                    <HandHoldingPhoneSVG width={referenceSize.width} />
                  )}
                  {deviceConfig.referenceType === 'human' && (
                    <HumanSilhouetteSVG height={referenceSize.height} />
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-700 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {deviceConfig.referenceType === 'creditCard' && 'Credit Card (3.4" x 2.1")'}
                    {deviceConfig.referenceType === 'hand' && 'Average Phone (6.1")'}
                    {deviceConfig.referenceType === 'human' && 'Average Person (5\'7")'}
                  </div>
                </div>
                {/* Scale Label */}
                <p className="mt-1 text-[10px] text-gray-500">
                  {deviceConfig.referenceType === 'creditCard' && (
                    <>Screen = <span className={`${deviceConfig.colors.overlayText} font-medium`}>{formatNum(referenceSize.ratio, 1)}x</span> card</>
                  )}
                  {deviceConfig.referenceType === 'hand' && (
                    <>Screen = <span className={`${deviceConfig.colors.overlayText} font-medium`}>{formatNum(referenceSize.ratio, 1)}x</span> 6.1" phone</>
                  )}
                  {deviceConfig.referenceType === 'human' && (
                    <>Screen = <span className={`${deviceConfig.colors.overlayText} font-medium`}>{formatNum(referenceSize.ratio, 1)}x</span> person height</>
                  )}
                </p>
              </div>

              {/* Projector Info Overlay */}
              {projectorCalcs && (
                <div className="absolute bottom-3 left-3 bg-gray-800/90 rounded-lg px-3 py-2 border border-gray-600 backdrop-blur-sm">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Throw Distance</p>
                      <p className={`text-sm font-bold ${deviceConfig.colors.overlayText}`}>
                        {displayValue(projectorCalcs.throwDistance)} {unitLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Wall Width</p>
                      <p className={`text-sm font-bold ${deviceConfig.colors.overlayText}`}>
                        {displayValue(projectorCalcs.minWallWidth)} {unitLabel}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TV Viewing Distance Overlay */}
              {tvViewingCalcs && (
                <div className="absolute bottom-3 left-3 bg-gray-800/90 rounded-lg px-3 py-2 border border-gray-600 backdrop-blur-sm">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Best Distance</p>
                      <p className={`text-sm font-bold ${deviceConfig.colors.overlayText}`}>
                        {unit === 'inches'
                          ? `${formatNum(tvViewingCalcs.optimalDistance / 12, 1)} ft`
                          : `${formatNum(tvViewingCalcs.optimalDistance * 2.54 / 100, 1)} m`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase">Range</p>
                      <p className={`text-sm font-bold ${deviceConfig.colors.overlayText}`}>
                        {unit === 'inches'
                          ? `${formatNum(tvViewingCalcs.minDistance / 12, 1)}-${formatNum(tvViewingCalcs.maxDistance / 12, 1)} ft`
                          : `${formatNum(tvViewingCalcs.minDistance * 2.54 / 100, 1)}-${formatNum(tvViewingCalcs.maxDistance * 2.54 / 100, 1)} m`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
