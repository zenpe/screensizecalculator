import { useState, useEffect, useMemo } from 'react';
import { devices, getDeviceById, isValidComparison, calculateDimensions, calculateArea, getDisplayDimensions, type Device } from '../data/devices';
import ComparisonVisualizer from './ComparisonVisualizer';

// Group devices by category
const devicesByCategory: Record<string, Device[]> = {
  phone: devices.filter(d => d.category === 'phone'),
  tablet: devices.filter(d => d.category === 'tablet'),
  monitor: devices.filter(d => d.category === 'monitor'),
  tv: devices.filter(d => d.category === 'tv'),
  projector: devices.filter(d => d.category === 'projector'),
};

const categoryLabels: Record<string, string> = {
  phone: 'Phones',
  tablet: 'Tablets',
  monitor: 'Monitors',
  tv: 'TVs',
  projector: 'Projectors',
};

const categories = ['phone', 'tablet', 'monitor', 'tv', 'projector'] as const;
type Category = typeof categories[number];

interface CompareClientProps {
  initialA?: string;
  initialB?: string;
}

// Parse URL params synchronously for initial state
function getInitialState() {
  if (typeof window === 'undefined') {
    return {
      a: '',
      b: '',
      device: '',
      catA: '' as Category | '',
      catB: '' as Category | '',
      hasParams: false,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const a = params.get('a') || '';
  const b = params.get('b') || '';
  const device = params.get('device') || '';
  const hasPairParams = !!(a || b);
  const prefilledDevice = hasPairParams ? '' : device;
  const hasParams = !!(a || b || device);

  // Derive categories from device IDs
  const deviceA = a ? getDeviceById(a) : prefilledDevice ? getDeviceById(prefilledDevice) : null;
  const deviceB = b ? getDeviceById(b) : null;
  const categoryA = (deviceA?.category || '') as Category | '';
  const categoryB = (deviceB?.category || categoryA) as Category | '';

  return {
    a,
    b,
    device: prefilledDevice,
    catA: categoryA,
    catB: categoryB,
    hasParams,
  };
}

// Get valid categories for device B based on device A's category
function getValidCategoriesForB(categoryA: Category | ''): Category[] {
  if (!categoryA) return [...categories];
  return categories.filter(cat => isValidComparison(categoryA, cat));
}

export default function CompareClient({ initialA, initialB }: CompareClientProps) {
  const initial = getInitialState();

  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  // Category states
  const [categoryA, setCategoryA] = useState<Category | ''>(initial.catA);
  const [categoryB, setCategoryB] = useState<Category | ''>(initial.catB);

  // Device states
  const [deviceAId, setDeviceAId] = useState<string>(initialA || initial.a || initial.device);
  const [deviceBId, setDeviceBId] = useState<string>(initialB || initial.b);

  const [error, setError] = useState<string | null>(null);

  // Mark as hydrated after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get device objects
  const deviceA = useMemo(() => deviceAId ? getDeviceById(deviceAId) : null, [deviceAId]);
  const deviceB = useMemo(() => deviceBId ? getDeviceById(deviceBId) : null, [deviceBId]);

  // Valid categories for B
  const validCategoriesForB = useMemo(() => getValidCategoriesForB(categoryA), [categoryA]);

  // Devices filtered by selected category
  const devicesForA = useMemo(() =>
    categoryA ? devicesByCategory[categoryA] : [],
    [categoryA]
  );

  const devicesForB = useMemo(() => {
    if (!categoryB) return [];
    const categoryDevices = devicesByCategory[categoryB];
    // Exclude device A if same category
    if (categoryA === categoryB && deviceAId) {
      return categoryDevices.filter(d => d.id !== deviceAId);
    }
    return categoryDevices;
  }, [categoryB, categoryA, deviceAId]);

  // Handle category A change
  const handleCategoryAChange = (cat: Category | '') => {
    setCategoryA(cat);
    setDeviceAId(''); // Reset device selection

    // Auto-set category B to same type, or reset if not compatible
    if (cat) {
      if (!categoryB || !isValidComparison(cat, categoryB)) {
        setCategoryB(cat);
        setDeviceBId('');
      }
    }
  };

  // Handle category B change
  const handleCategoryBChange = (cat: Category | '') => {
    setCategoryB(cat);
    setDeviceBId(''); // Reset device selection
  };

  // Update URL when devices change
  useEffect(() => {
    if (deviceAId && deviceBId) {
      const [sortedA, sortedB] = [deviceAId, deviceBId].sort();
      const params = new URLSearchParams({ a: sortedA, b: sortedB });
      const newUrl = `/compare?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
      return;
    }

    if (deviceAId) {
      const newUrl = `/compare?device=${encodeURIComponent(deviceAId)}`;
      window.history.replaceState({}, '', newUrl);
      return;
    }

    window.history.replaceState({}, '', '/compare');
  }, [deviceAId, deviceBId]);

  // Validate comparison
  useEffect(() => {
    if (deviceA && deviceB) {
      if (!isValidComparison(deviceA.category, deviceB.category)) {
        setError(`Cannot compare ${deviceA.category} with ${deviceB.category}`);
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [deviceA, deviceB]);

  // Calculate comparison stats
  const stats = useMemo(() => {
    if (!deviceA || !deviceB) return null;

    const areaA = calculateArea(deviceA.diagonal, deviceA.ratio);
    const areaB = calculateArea(deviceB.diagonal, deviceB.ratio);
    const dimsA = getDisplayDimensions(deviceA);
    const dimsB = getDisplayDimensions(deviceB);

    const larger = areaA >= areaB ? deviceA : deviceB;
    const smaller = areaA < areaB ? deviceA : deviceB;
    const largerArea = Math.max(areaA, areaB);
    const smallerArea = Math.min(areaA, areaB);
    const percentLarger = smallerArea > 0 ? ((largerArea - smallerArea) / smallerArea) * 100 : 0;

    // Calculate PPI if resolution available
    const getPPI = (device: Device) => {
      if (!device.resolution) return null;
      const [w, h] = device.resolution.split(' x ').map(Number);
      if (!w || !h) return null;
      const pixelDiagonal = Math.sqrt(w * w + h * h);
      return Math.round(pixelDiagonal / device.diagonal);
    };

    const ppiA = getPPI(deviceA);
    const ppiB = getPPI(deviceB);

    // How many smaller screens fit in larger
    const fitCount = smallerArea > 0 ? largerArea / smallerArea : 0;

    return {
      areaA, areaB,
      dimsA, dimsB,
      larger, smaller,
      percentLarger,
      ppiA, ppiB,
      fitCount
    };
  }, [deviceA, deviceB]);

  // Swap devices
  const handleSwap = () => {
    const tempCat = categoryA;
    const tempDevice = deviceAId;
    setCategoryA(categoryB);
    setDeviceAId(deviceBId);
    setCategoryB(tempCat);
    setDeviceBId(tempDevice);
  };

  // Loading state - only show when URL has params (loading specific comparison)
  if (!isHydrated && initial.hasParams) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <svg className="w-6 h-6 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm">Loading comparison tool...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Compact Device Selectors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">

        {/* Mobile: Stacked layout */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* Device A */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">A</span>
            </span>
            <div className="flex-1 flex gap-2 min-w-0">
              <select
                value={categoryA}
                onChange={(e) => handleCategoryAChange(e.target.value as Category | '')}
                className="w-[80px] flex-shrink-0 px-1.5 py-2 bg-primary-100 dark:bg-primary-900/60 border border-primary-300 dark:border-primary-700 rounded-lg text-xs font-medium text-primary-800 dark:text-primary-200"
              >
                <option value="">Type</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                ))}
              </select>
              <select
                value={deviceAId}
                onChange={(e) => setDeviceAId(e.target.value)}
                disabled={!categoryA}
                className="w-0 flex-1 px-1.5 py-2 bg-primary-50 dark:bg-primary-950/40 border border-primary-300 dark:border-primary-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                <option value="">{categoryA ? 'Select device...' : 'Select type first'}</option>
                {devicesForA.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.diagonal}")</option>
                ))}
              </select>
            </div>
          </div>

          {/* Device B */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">B</span>
            </span>
            <div className="flex-1 flex gap-2 min-w-0">
              <select
                value={categoryB}
                onChange={(e) => handleCategoryBChange(e.target.value as Category | '')}
                className="w-[80px] flex-shrink-0 px-1.5 py-2 bg-cyan-100 dark:bg-cyan-900/60 border border-cyan-300 dark:border-cyan-700 rounded-lg text-xs font-medium text-cyan-800 dark:text-cyan-200"
              >
                <option value="">Type</option>
                {validCategoriesForB.map(cat => (
                  <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                ))}
              </select>
              <select
                value={deviceBId}
                onChange={(e) => setDeviceBId(e.target.value)}
                disabled={!categoryB}
                className="w-0 flex-1 px-1.5 py-2 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                <option value="">{categoryB ? 'Select device...' : 'Select type first'}</option>
                {devicesForB.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.diagonal}")</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Desktop: Single row */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Device A */}
          <div className="flex-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">A</span>
            </span>
            <select
              value={categoryA}
              onChange={(e) => handleCategoryAChange(e.target.value as Category | '')}
              className="w-24 px-2 py-1.5 bg-primary-100 dark:bg-primary-900/60 border border-primary-300 dark:border-primary-700 rounded-lg text-xs font-medium text-primary-800 dark:text-primary-200 focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Type</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>
            <select
              value={deviceAId}
              onChange={(e) => setDeviceAId(e.target.value)}
              disabled={!categoryA}
              className="flex-1 min-w-0 px-2 py-1.5 bg-primary-50 dark:bg-primary-950/40 border border-primary-300 dark:border-primary-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">{categoryA ? 'Select device...' : 'Select type first'}</option>
              {devicesForA.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.diagonal}")</option>
              ))}
            </select>
          </div>

          {/* Swap */}
          <button
            onClick={handleSwap}
            disabled={!deviceAId || !deviceBId}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            title="Swap"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          {/* Device B */}
          <div className="flex-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">B</span>
            </span>
            <select
              value={categoryB}
              onChange={(e) => handleCategoryBChange(e.target.value as Category | '')}
              className="w-24 px-2 py-1.5 bg-cyan-100 dark:bg-cyan-900/60 border border-cyan-300 dark:border-cyan-700 rounded-lg text-xs font-medium text-cyan-800 dark:text-cyan-200 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">Type</option>
              {validCategoriesForB.map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>
            <select
              value={deviceBId}
              onChange={(e) => setDeviceBId(e.target.value)}
              disabled={!categoryB}
              className="flex-1 min-w-0 px-2 py-1.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">{categoryB ? 'Select device...' : 'Select type first'}</option>
              {devicesForB.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.diagonal}")</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Comparison Content */}
      {deviceA && deviceB && !error && stats && (
        <>
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {deviceA.name} vs {deviceB.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Screen size comparison: {deviceA.diagonal}" vs {deviceB.diagonal}"
            </p>
          </div>

          {/* Visualizer */}
          <div className="mb-6">
            <ComparisonVisualizer deviceA={deviceA} deviceB={deviceB} />
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Size Difference</p>
              <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                {stats.percentLarger > 0 ? `+${stats.percentLarger.toFixed(0)}%` : '0%'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Diagonal Diff</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.abs(deviceA.diagonal - deviceB.diagonal).toFixed(1)}"
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Area Diff</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.abs(stats.areaA - stats.areaB).toFixed(1)} in²
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fit Ratio</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.fitCount.toFixed(1)}x
              </p>
            </div>
          </div>

          {/* The Verdict */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 sm:p-6 mb-6 text-white">
            <h2 className="text-lg sm:text-xl font-bold mb-3">The Verdict</h2>
            <p className="text-sm sm:text-base leading-relaxed">
              {stats.percentLarger > 0 ? (
                <>
                  The <strong>{stats.larger.name}</strong> has a{' '}
                  <strong className="text-accent-300">{stats.percentLarger.toFixed(1)}% larger</strong>{' '}
                  screen area than the <strong>{stats.smaller.name}</strong>.
                  {stats.fitCount >= 1.5 && (
                    <> You could fit approximately <strong className="text-accent-300">{stats.fitCount.toFixed(1)}</strong> {stats.smaller.name} screens inside the {stats.larger.name}.</>
                  )}
                </>
              ) : (
                <>Both devices have <strong>identical screen areas</strong>, though their aspect ratios may differ.</>
              )}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">{deviceA.name}</p>
                <p className="font-bold text-lg">{stats.areaA.toFixed(1)} in²</p>
                <p className="text-white/60 text-xs">{stats.dimsA.width.toFixed(1)}" × {stats.dimsA.height.toFixed(1)}"</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">{deviceB.name}</p>
                <p className="font-bold text-lg">{stats.areaB.toFixed(1)} in²</p>
                <p className="text-white/60 text-xs">{stats.dimsB.width.toFixed(1)}" × {stats.dimsB.height.toFixed(1)}"</p>
              </div>
            </div>
          </div>

          {/* Detailed Specs Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Detailed Specifications
            </h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">Specification</th>
                    <th className="py-3 px-4 text-left font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                        {deviceA.name}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-left font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        {deviceB.name}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Screen Diagonal</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">{deviceA.diagonal}"</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">{deviceB.diagonal}"</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Screen Area</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{stats.areaA.toFixed(2)} in²</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{stats.areaB.toFixed(2)} in²</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Dimensions (W × H)</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{stats.dimsA.width.toFixed(2)}" × {stats.dimsA.height.toFixed(2)}"</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{stats.dimsB.width.toFixed(2)}" × {stats.dimsB.height.toFixed(2)}"</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Aspect Ratio</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{deviceA.ratio.toFixed(2)}:1</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{deviceB.ratio.toFixed(2)}:1</td>
                  </tr>
                  {(deviceA.resolution || deviceB.resolution) && (
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Resolution</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{deviceA.resolution || '—'}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{deviceB.resolution || '—'}</td>
                    </tr>
                  )}
                  {(stats.ppiA || stats.ppiB) && (
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Pixel Density (PPI)</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{stats.ppiA ? `${stats.ppiA} ppi` : '—'}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{stats.ppiB ? `${stats.ppiB} ppi` : '—'}</td>
                    </tr>
                  )}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Category</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100 capitalize">{deviceA.category}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100 capitalize">{deviceB.category}</td>
                  </tr>
                  {(deviceA.price || deviceB.price) && (
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">Launch Price</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{deviceA.price ? `$${deviceA.price}` : '—'}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{deviceB.price ? `$${deviceB.price}` : '—'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Use Case Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Which One Should You Choose?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  {deviceA.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.areaA > stats.areaB ? (
                    <>Better for immersive viewing, gaming, and multitasking with its larger {stats.areaA.toFixed(1)} in² display.</>
                  ) : stats.areaA < stats.areaB ? (
                    <>More portable and easier to handle with its compact {deviceA.diagonal}" screen.</>
                  ) : (
                    <>Similar screen real estate to {deviceB.name}, choose based on other features.</>
                  )}
                </p>
              </div>
              <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <h3 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  {deviceB.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.areaB > stats.areaA ? (
                    <>Better for immersive viewing, gaming, and multitasking with its larger {stats.areaB.toFixed(1)} in² display.</>
                  ) : stats.areaB < stats.areaA ? (
                    <>More portable and easier to handle with its compact {deviceB.diagonal}" screen.</>
                  ) : (
                    <>Similar screen real estate to {deviceA.name}, choose based on other features.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Key Insights
            </h2>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-0.5">•</span>
                <span>
                  The diagonal measurement ({deviceA.diagonal}" vs {deviceB.diagonal}") only tells part of the story.
                  Screen area ({stats.areaA.toFixed(1)} vs {stats.areaB.toFixed(1)} in²) gives a more accurate picture of usable space.
                </span>
              </li>
              {Math.abs(deviceA.ratio - deviceB.ratio) > 0.1 && (
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 mt-0.5">•</span>
                  <span>
                    Different aspect ratios ({deviceA.ratio.toFixed(2)}:1 vs {deviceB.ratio.toFixed(2)}:1) mean content may display differently.
                    {deviceA.ratio > deviceB.ratio
                      ? ` ${deviceA.name} is wider, better for movies.`
                      : ` ${deviceB.name} is wider, better for movies.`}
                  </span>
                </li>
              )}
              {stats.ppiA && stats.ppiB && Math.abs(stats.ppiA - stats.ppiB) > 50 && (
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 mt-0.5">•</span>
                  <span>
                    {stats.ppiA > stats.ppiB
                      ? `${deviceA.name} has higher pixel density (${stats.ppiA} vs ${stats.ppiB} PPI), meaning sharper text and images.`
                      : `${deviceB.name} has higher pixel density (${stats.ppiB} vs ${stats.ppiA} PPI), meaning sharper text and images.`}
                  </span>
                </li>
              )}
              <li className="flex items-start gap-3">
                <span className="text-primary-500 mt-0.5">•</span>
                <span>
                  {stats.percentLarger > 50
                    ? `With ${stats.percentLarger.toFixed(0)}% more screen area, the ${stats.larger.name} offers significantly more viewing space.`
                    : stats.percentLarger > 20
                    ? `The ${stats.percentLarger.toFixed(0)}% size difference is noticeable but both screens are comparable.`
                    : `Both screens are very similar in size, with only ${stats.percentLarger.toFixed(0)}% difference.`}
                </span>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* Empty State */}
      {(!deviceA || !deviceB) && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Select Two Devices to Compare
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose device types and models above to see a visual size comparison.
          </p>
        </div>
      )}
    </div>
  );
}
