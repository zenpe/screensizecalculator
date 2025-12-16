import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';

// Reference object dimensions in mm
const REFERENCE_OBJECTS = {
  creditCard: {
    id: 'creditCard',
    name: 'Credit Card',
    shortName: 'Card',
    width: 85.6,
    height: 53.98,
    description: 'Standard ISO/IEC 7810 ID-1',
    minScreenWidth: 320,
  },
  usCoin: {
    id: 'usCoin',
    name: 'US Quarter',
    shortName: 'Quarter',
    width: 24.26,
    height: 24.26,
    description: '24.26mm diameter',
    minScreenWidth: 0,
  },
  cnyOneCoin: {
    id: 'cnyOneCoin',
    name: '1 Yuan Coin',
    shortName: '1 Yuan',
    width: 25,
    height: 25,
    description: '25mm diameter',
    minScreenWidth: 0,
  },
  euroCoin: {
    id: 'euroCoin',
    name: '1 Euro Coin',
    shortName: '1 Euro',
    width: 23.25,
    height: 23.25,
    description: '23.25mm diameter',
    minScreenWidth: 0,
  },
} as const;

type ReferenceObjectId = keyof typeof REFERENCE_OBJECTS;
type CalibrationMethod = 'auto' | 'manual' | 'reference';

const DEFAULT_PPI = 96;

interface ScreenCalibrationProps {
  onCalibrate: (ppi: number) => void;
  currentPpi: number;
}

interface CalibrationData {
  ppi: number;
  method: CalibrationMethod;
  timestamp: number;
}

// Estimate PPI using devicePixelRatio and screen dimensions
function estimatePpi(): number {
  if (typeof window === 'undefined') return DEFAULT_PPI;

  const dpr = window.devicePixelRatio || 1;
  const isMobile = window.matchMedia('(max-width: 640px)').matches &&
                   ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  if (isMobile) {
    // Mobile: DPR 2 ≈ 326 PPI (Retina), DPR 3 ≈ 458 PPI
    return Math.round(160 * dpr);
  }

  return Math.round(DEFAULT_PPI * dpr);
}

// Get stored calibration from localStorage
export function getStoredCalibration(): CalibrationData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('screenCalibration');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save calibration to localStorage
export function saveCalibration(data: CalibrationData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('screenCalibration', JSON.stringify(data));
}

// Clear calibration
export function clearCalibration(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('screenCalibration');
}

// Get effective PPI (stored or estimated)
export function getEffectivePpi(): number {
  const stored = getStoredCalibration();
  return stored?.ppi ?? estimatePpi();
}

// Get initial state synchronously to avoid flicker
function getCalibrationInitialState() {
  if (typeof window === 'undefined') {
    return {
      screenInfo: { width: 0, height: 0, isMobile: false },
      calibrationData: null as CalibrationData | null,
      method: 'auto' as CalibrationMethod,
      selectedReference: 'creditCard' as ReferenceObjectId,
    };
  }
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const screenWidth = window.innerWidth;
  const stored = getStoredCalibration();

  // Auto-select appropriate reference based on screen width
  let selectedReference: ReferenceObjectId = 'creditCard';
  if (screenWidth < 320) {
    selectedReference = 'euroCoin';
  } else if (screenWidth < 640) {
    selectedReference = 'usCoin';
  }

  return {
    screenInfo: { width: screenWidth, height: window.innerHeight, isMobile },
    calibrationData: stored,
    method: stored?.method ?? 'auto' as CalibrationMethod,
    selectedReference,
  };
}

const ScreenCalibration = memo(function ScreenCalibration({ onCalibrate, currentPpi }: ScreenCalibrationProps) {
  // Initialize state synchronously
  const [initialState] = useState(getCalibrationInitialState);
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<CalibrationMethod>(initialState.method);
  const [sliderValue, setSliderValue] = useState(100);
  const [manualDiagonal, setManualDiagonal] = useState('');
  const [selectedReference, setSelectedReference] = useState<ReferenceObjectId>(initialState.selectedReference);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(initialState.calibrationData);
  const [screenInfo, setScreenInfo] = useState(initialState.screenInfo);

  // Listen for resize changes only
  useEffect(() => {
    const updateScreenInfo = () => {
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile,
      });
    };
    window.addEventListener('resize', updateScreenInfo);
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, []);

  // Get available reference objects based on screen size
  const availableReferences = useMemo(() => {
    return Object.values(REFERENCE_OBJECTS).filter(
      ref => screenInfo.width >= ref.minScreenWidth || screenInfo.width === 0
    );
  }, [screenInfo.width]);

  // Calculate reference object dimensions based on slider
  const getReferenceDimensions = useCallback(() => {
    const ref = REFERENCE_OBJECTS[selectedReference];
    const baseWidthPx = (ref.width / 25.4) * DEFAULT_PPI;
    const baseHeightPx = (ref.height / 25.4) * DEFAULT_PPI;
    const scale = sliderValue / 100;

    return {
      width: baseWidthPx * scale,
      height: baseHeightPx * scale,
      isCircle: ref.width === ref.height,
    };
  }, [sliderValue, selectedReference]);

  // Calculate PPI based on method
  const calculatePpi = useCallback((): number => {
    switch (method) {
      case 'auto':
        return estimatePpi();

      case 'manual': {
        if (!manualDiagonal || parseFloat(manualDiagonal) <= 0) return estimatePpi();
        const diagonal = parseFloat(manualDiagonal);
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const dpr = window.devicePixelRatio || 1;
        const physicalPixels = Math.sqrt(
          Math.pow(screenWidth * dpr, 2) + Math.pow(screenHeight * dpr, 2)
        );
        return physicalPixels / diagonal;
      }

      case 'reference':
        // When slider is at 100%, display matches 96 PPI
        // If user needs to scale up (e.g., 200%), their screen has higher PPI (192)
        // If user needs to scale down (e.g., 50%), their screen has lower PPI (48)
        return DEFAULT_PPI * (sliderValue / 100);

      default:
        return estimatePpi();
    }
  }, [method, manualDiagonal, sliderValue]);

  const handleConfirm = () => {
    const ppi = calculatePpi();
    const data: CalibrationData = {
      ppi,
      method,
      timestamp: Date.now(),
    };
    saveCalibration(data);
    setCalibrationData(data);
    onCalibrate(ppi);
    setIsOpen(false);
  };

  const handleReset = () => {
    clearCalibration();
    setCalibrationData(null);
    setSliderValue(100);
    setManualDiagonal('');
    setMethod('auto');
    onCalibrate(estimatePpi());
  };

  const refDims = getReferenceDimensions();
  const estimatedPpi = estimatePpi();

  const getStatusText = () => {
    if (!calibrationData) return 'Not calibrated';
    switch (calibrationData.method) {
      case 'auto': return 'Auto';
      case 'manual': return 'Manual';
      case 'reference': return 'Calibrated';
      default: return 'Calibrated';
    }
  };

  const { isMobile } = screenInfo;

  return (
    <>
      {/* Calibration Button - Compact on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-sm transition-colors ${
          calibrationData
            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
            : 'bg-slate-700 text-gray-400 hover:bg-slate-600 border border-slate-600'
        }`}
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="whitespace-nowrap">{getStatusText()}</span>
      </button>

      {/* Modal - Full screen on mobile, rendered via Portal to escape stacking context */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-4"
          onClick={(e) => {
            // Close when clicking backdrop (not modal content)
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className={`bg-gray-800 shadow-2xl w-full border-gray-700 rounded-2xl max-h-[85vh] sm:max-h-[90vh] border overflow-hidden flex flex-col ${
              isMobile ? 'max-w-full' : 'max-w-lg'
            }`}
          >
            {/* Header - Sticky */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
              <h3 className="text-lg sm:text-xl font-bold text-white">Screen Calibration</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors -mr-1"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Current Status */}
              <div className="p-3 bg-gray-900/50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-400">Current PPI:</span>
                <span className="text-lg font-semibold text-cyan-400">{currentPpi.toFixed(0)}</span>
              </div>

              {/* Method Selection - Responsive grid */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Calibration Method
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    { id: 'auto', label: 'Auto', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
                    { id: 'manual', label: 'Manual', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                    { id: 'reference', label: 'Object', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setMethod(item.id as CalibrationMethod)}
                      className={`p-1.5 sm:p-3 rounded-lg border text-center transition-colors ${
                        method === item.id
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                          : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500 active:bg-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-0.5 sm:mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="text-[10px] sm:text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Method-specific content */}
              {method === 'auto' && (
                <div className="p-3 sm:p-4 bg-green-900/20 rounded-lg border border-green-700/50">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-green-200 font-medium">Recommended</p>
                      <p className="text-xs text-green-300/70 mt-1">
                        Uses your device's pixel ratio to estimate PPI.
                      </p>
                      <div className="mt-2 p-2 bg-gray-900/50 rounded space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Pixel ratio:</span>
                          <span className="text-white">{typeof window !== 'undefined' ? (window.devicePixelRatio || 1).toFixed(2) : '1.00'}x</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Estimated PPI:</span>
                          <span className="text-cyan-400 font-medium">{estimatedPpi}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {method === 'manual' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                    <p className="text-xs sm:text-sm text-blue-200">
                      Enter your screen's diagonal size (found in device specs).
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={manualDiagonal}
                      onChange={(e) => setManualDiagonal(e.target.value)}
                      placeholder="e.g., 6.1"
                      step="0.1"
                      min="1"
                      max="100"
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900 border border-gray-600 rounded-lg text-white text-base placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-gray-400 text-sm">inches</span>
                  </div>
                  {manualDiagonal && (
                    parseFloat(manualDiagonal) > 0 ? (
                      <div className="p-2 bg-gray-900/50 rounded flex justify-between text-sm">
                        <span className="text-gray-400">Calculated PPI:</span>
                        <span className="text-cyan-400 font-medium">{calculatePpi().toFixed(0)}</span>
                      </div>
                    ) : (
                      <div className="p-2 bg-red-900/30 rounded text-xs text-red-300">
                        Please enter a valid screen size greater than 0
                      </div>
                    )
                  )}
                </div>
              )}

              {method === 'reference' && (
                <div className="space-y-3">
                  {/* Reference object selection */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Reference object:</label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {availableReferences.map((ref) => (
                        <button
                          key={ref.id}
                          onClick={() => setSelectedReference(ref.id as ReferenceObjectId)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            selectedReference === ref.id
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                              : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500 active:bg-gray-600'
                          }`}
                        >
                          {isMobile ? ref.shortName : ref.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-2.5 sm:p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                    <p className="text-xs text-blue-200">
                      Place a <strong>{REFERENCE_OBJECTS[selectedReference].name}</strong> on screen. Adjust slider until the outline matches the real object size.
                    </p>
                  </div>

                  {/* Reference Visualization */}
                  <div
                    className="flex justify-center items-center bg-gray-900 rounded-xl p-3 sm:p-4"
                    style={{ minHeight: isMobile ? '100px' : '120px' }}
                  >
                    <div
                      className={`relative border-2 border-dashed border-cyan-400 bg-cyan-400/10 flex items-center justify-center transition-all duration-150 ${
                        refDims.isCircle ? 'rounded-full' : 'rounded-lg'
                      }`}
                      style={{
                        width: `${refDims.width}px`,
                        height: `${refDims.height}px`,
                      }}
                    >
                      {selectedReference === 'creditCard' && (
                        <>
                          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 w-5 sm:w-6 h-3 sm:h-4 bg-amber-400/60 rounded-sm" />
                          <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2">
                            <div className="h-1 sm:h-1.5 bg-gray-600/50 rounded mb-0.5 sm:mb-1" />
                            <div className="h-1 sm:h-1.5 bg-gray-600/30 rounded w-2/3" />
                          </div>
                        </>
                      )}
                      {refDims.isCircle && (
                        <div className="absolute inset-1.5 sm:inset-2 border border-cyan-400/30 rounded-full" />
                      )}
                      {/* Hide text when reference object is too small */}
                      {refDims.width > 50 && (
                        <span className="text-cyan-300 text-[9px] sm:text-[10px] font-medium text-center px-1 truncate max-w-full">
                          {isMobile ? REFERENCE_OBJECTS[selectedReference].shortName : REFERENCE_OBJECTS[selectedReference].name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slider - Larger touch target on mobile */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Smaller</span>
                      <span className="text-cyan-400 font-medium">{sliderValue}%</span>
                      <span>Larger</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="500"
                      value={sliderValue}
                      onChange={(e) => setSliderValue(parseInt(e.target.value))}
                      className="w-full h-2 sm:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 touch-pan-x"
                      style={{
                        // Larger touch target on mobile
                        padding: isMobile ? '8px 0' : '4px 0',
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1.5 text-center">
                      PPI: {calculatePpi().toFixed(0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Small screen notice */}
              {isMobile && (
                <div className="p-2.5 bg-amber-900/20 rounded-lg border border-amber-700/50">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-200">
                      Large devices will show at reduced scale with ratio indicated.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions - Sticky footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-800 space-y-3">
              <div className="flex gap-3">
                {calibrationData && (
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-300 rounded-xl font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 text-white rounded-xl font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 text-center">
                Saved locally and applied to all visualizations.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

export default ScreenCalibration;
