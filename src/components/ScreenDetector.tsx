import { useState, useEffect, useRef } from 'react';

interface ScreenInfo {
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  dpr: number;
  deviceType: string;
}

export default function ScreenDetector() {
  const [info, setInfo] = useState<ScreenInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const detectScreen = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && Math.min(window.screen.width, window.screen.height) > 600;

    let deviceType = 'Desktop';
    if (isMobile && !isTablet) deviceType = 'Mobile';
    else if (isTablet) deviceType = 'Tablet';

    setInfo({
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      dpr: Math.round(window.devicePixelRatio * 100) / 100,
      deviceType,
    });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const handleResize = () => {
      if (isOpen) {
        setInfo(prev => prev ? { ...prev, windowWidth: window.innerWidth, windowHeight: window.innerHeight } : null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={detectScreen}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-200 dark:border-primary-800"
        title="Detect My Screen"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        My Screen
      </button>
      <button
        onClick={detectScreen}
        className="sm:hidden p-2 rounded-lg text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
        title="Detect My Screen"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && info && (
        <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-72 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Your Screen</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
              <span className="text-gray-500 dark:text-gray-400">Screen Resolution</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{info.screenWidth} × {info.screenHeight}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
              <span className="text-gray-500 dark:text-gray-400">Browser Window</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{info.windowWidth} × {info.windowHeight}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
              <span className="text-gray-500 dark:text-gray-400">Pixel Ratio (DPR)</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{info.dpr}x</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
              <span className="text-gray-500 dark:text-gray-400">Device Type</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{info.deviceType}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <a href="/#calculator" className="block text-center text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Calculate PPI & dimensions →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
