import { useState, useMemo } from 'react';
import type { Device } from '../data/devices';
import { calculateDimensions, getDisplayDimensions, calculateDevicePPI } from '../data/devices';
import { getDevicePageUrl } from '../utils/url';

interface CategoryDeviceListProps {
  devices: Device[];
  category: string;
  categoryName: string;
  colorText: string;
  colorBg: string;
  defaultSort?: SortOption;
}

type SortOption = 'brand' | 'size-desc' | 'size-asc' | 'ppi-desc' | 'ppi-asc' | 'name-asc';

// Brand priority for sorting (lower = higher priority)
const brandPriority: Record<string, number> = {
  Apple: 1,
  Samsung: 2,
  Google: 3,
  OnePlus: 4,
  Xiaomi: 5,
  Microsoft: 6,
  Sony: 7,
  Generic: 100,
  Other: 99,
};

// Extract model number/generation from device name for sorting within brand
function getModelSortKey(device: Device): number {
  const name = device.name.toLowerCase();
  const id = device.id.toLowerCase();

  // iPhone: extract number (17 > 16 > 15...)
  const iphoneMatch = name.match(/iphone\s*(\d+)/i);
  if (iphoneMatch) {
    const num = parseInt(iphoneMatch[1], 10);
    // Pro Max > Pro > Plus > base (add decimal for variant)
    let variant = 0;
    if (name.includes('pro max')) variant = 0.3;
    else if (name.includes('pro')) variant = 0.2;
    else if (name.includes('plus')) variant = 0.1;
    return -(num + variant); // Negative for descending (newer first)
  }

  // iPad: Pro > Air > Mini > base
  if (id.includes('ipad')) {
    let base = 0;
    if (name.includes('pro')) base = -100;
    else if (name.includes('air')) base = -90;
    else if (name.includes('mini')) base = -80;
    else base = -70;
    // Extract size for Pro/Air
    const sizeMatch = name.match(/(\d+(?:\.\d+)?)["\s]*inch|(\d+(?:\.\d+)?)"?$/i);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1] || sizeMatch[2]);
      base -= size; // Larger size first within same model
    }
    return base;
  }

  // Samsung Galaxy S series: S25 > S24 > S23...
  const galaxyMatch = name.match(/galaxy\s*s(\d+)/i);
  if (galaxyMatch) {
    const num = parseInt(galaxyMatch[1], 10);
    let variant = 0;
    if (name.includes('ultra')) variant = 0.3;
    else if (name.includes('+') || name.includes('plus')) variant = 0.2;
    else if (name.includes('fe')) variant = -0.1;
    return -(num + variant);
  }

  // Samsung Galaxy Z Fold/Flip
  const zMatch = name.match(/galaxy\s*z\s*(fold|flip)\s*(\d+)/i);
  if (zMatch) {
    const type = zMatch[1].toLowerCase() === 'fold' ? 50 : 40;
    const num = parseInt(zMatch[2], 10);
    return -(type + num);
  }

  // Google Pixel
  const pixelMatch = name.match(/pixel\s*(\d+)/i);
  if (pixelMatch) {
    const num = parseInt(pixelMatch[1], 10);
    let variant = 0;
    if (name.includes('pro xl')) variant = 0.3;
    else if (name.includes('pro')) variant = 0.2;
    else if (name.includes('xl')) variant = 0.15;
    else if (name.includes('a')) variant = -0.1;
    return -(num + variant);
  }

  // OnePlus
  const oneplusMatch = name.match(/oneplus\s*(\d+)/i);
  if (oneplusMatch) {
    const num = parseInt(oneplusMatch[1], 10);
    let variant = 0;
    if (name.includes('ultra')) variant = 0.3;
    else if (name.includes('pro')) variant = 0.2;
    return -(num + variant);
  }

  // Fallback: use diagonal size (larger first)
  return -device.diagonal;
}

// Brand configuration with colors
const brandConfig: Record<string, { color: string; bgLight: string; bgDark: string; border: string }> = {
  Apple: { color: 'text-gray-700 dark:text-gray-300', bgLight: 'bg-gray-100', bgDark: 'dark:bg-gray-700', border: 'border-gray-300 dark:border-gray-600' },
  Samsung: { color: 'text-blue-700 dark:text-blue-300', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
  Google: { color: 'text-green-700 dark:text-green-300', bgLight: 'bg-green-50', bgDark: 'dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800' },
  Microsoft: { color: 'text-cyan-700 dark:text-cyan-300', bgLight: 'bg-cyan-50', bgDark: 'dark:bg-cyan-900/30', border: 'border-cyan-200 dark:border-cyan-800' },
  OnePlus: { color: 'text-red-700 dark:text-red-300', bgLight: 'bg-red-50', bgDark: 'dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800' },
  Xiaomi: { color: 'text-orange-700 dark:text-orange-300', bgLight: 'bg-orange-50', bgDark: 'dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800' },
  Sony: { color: 'text-indigo-700 dark:text-indigo-300', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800' },
  Generic: { color: 'text-slate-700 dark:text-slate-300', bgLight: 'bg-slate-50', bgDark: 'dark:bg-slate-900/30', border: 'border-slate-200 dark:border-slate-700' },
  Other: { color: 'text-purple-700 dark:text-purple-300', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' },
};

// Extract brand from device
function getBrand(device: Device): string {
  const id = device.id.toLowerCase();
  const name = device.name.toLowerCase();

  if (id.includes('iphone') || id.includes('ipad')) return 'Apple';
  if (id.includes('samsung') || name.includes('samsung')) return 'Samsung';
  if (id.includes('google-pixel') || name.includes('pixel')) return 'Google';
  if (id.includes('surface')) return 'Microsoft';
  if (id.includes('oneplus')) return 'OnePlus';
  if (id.includes('xiaomi')) return 'Xiaomi';
  if (id.includes('sony')) return 'Sony';
  if (id.includes('inch-tv') || id.includes('inch-monitor') || id.includes('projector')) return 'Generic';
  return 'Other';
}

// Check if device is popular/latest
function isPopular(device: Device): boolean {
  const id = device.id.toLowerCase();
  if (id.includes('iphone-17') || id.includes('iphone-16')) return true;
  if (id.includes('samsung-galaxy-s25') || id.includes('samsung-galaxy-s24')) return true;
  if (id.includes('pixel-9') || id.includes('pixel-8')) return true;
  if (id.includes('ipad-pro-13') || id.includes('ipad-pro-11') || id.includes('ipad-air')) return true;
  if (id === '65-inch-tv' || id === '55-inch-tv' || id === '75-inch-tv') return true;
  if (id === '27-inch-monitor' || id === '32-inch-monitor' || id === '34-inch-ultrawide') return true;
  return false;
}

// Get resolution string
function getResolutionString(device: Device): string {
  if (typeof device.resolution === 'string') {
    return device.resolution;
  }
  if (device.resolution && typeof device.resolution === 'object') {
    return `${(device.resolution as any).width} × ${(device.resolution as any).height}`;
  }
  return '';
}

// Screen size visualization component
function ScreenSizePreview({ device, maxDiagonal }: { device: Device; maxDiagonal: number }) {
  const dims = calculateDimensions(device.diagonal, device.ratio);
  // Scale to fit in preview area (max 64px width)
  const scale = 56 / maxDiagonal;
  const width = Math.max(dims.width * scale, 16);
  const height = Math.max(dims.height * scale, 12);

  // Determine if portrait or landscape based on ratio
  const isPortrait = device.ratio < 1;
  const displayWidth = isPortrait ? height : width;
  const displayHeight = isPortrait ? width : height;

  return (
    <div className="relative flex items-center justify-center w-16 h-14">
      <div
        className="bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 rounded-sm shadow-inner"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          minWidth: '16px',
          minHeight: '12px',
        }}
      >
        {/* Screen glare effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-sm" />
      </div>
    </div>
  );
}

// Aspect ratio badge
function AspectRatioBadge({ ratio }: { ratio: number }) {
  // Common aspect ratios
  let label = '';
  if (Math.abs(ratio - 16/9) < 0.1) label = '16:9';
  else if (Math.abs(ratio - 19.5/9) < 0.1) label = '19.5:9';
  else if (Math.abs(ratio - 20/9) < 0.1) label = '20:9';
  else if (Math.abs(ratio - 4/3) < 0.1) label = '4:3';
  else if (Math.abs(ratio - 3/2) < 0.1) label = '3:2';
  else if (Math.abs(ratio - 21/9) < 0.1) label = '21:9';
  else if (Math.abs(ratio - 32/9) < 0.1) label = '32:9';
  else {
    // Calculate approximate ratio
    const common = [
      { r: 16/9, l: '16:9' },
      { r: 16/10, l: '16:10' },
      { r: 4/3, l: '4:3' },
      { r: 21/9, l: '21:9' },
      { r: 19.5/9, l: '19.5:9' },
    ];
    const closest = common.reduce((prev, curr) =>
      Math.abs(curr.r - ratio) < Math.abs(prev.r - ratio) ? curr : prev
    );
    label = closest.l;
  }

  return (
    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
      {label}
    </span>
  );
}

export default function CategoryDeviceList({
  devices,
  categoryName,
  defaultSort = 'size-desc',
}: CategoryDeviceListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  const ITEMS_PER_PAGE = 24;

  // Get unique brands
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    devices.forEach(d => brandSet.add(getBrand(d)));
    return Array.from(brandSet).sort();
  }, [devices]);

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    let result = [...devices];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query) ||
        d.diagonal.toString().includes(query)
      );
    }

    if (selectedBrand !== 'all') {
      result = result.filter(d => getBrand(d) === selectedBrand);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'brand': {
          // Sort by brand priority, then by model (newest first)
          const brandA = getBrand(a);
          const brandB = getBrand(b);
          const priorityA = brandPriority[brandA] ?? 50;
          const priorityB = brandPriority[brandB] ?? 50;
          if (priorityA !== priorityB) return priorityA - priorityB;
          // Same brand: sort by model (newer/higher tier first)
          return getModelSortKey(a) - getModelSortKey(b);
        }
        case 'size-desc':
          return b.diagonal - a.diagonal;
        case 'size-asc':
          return a.diagonal - b.diagonal;
        case 'ppi-desc':
          return (calculateDevicePPI(b) || 0) - (calculateDevicePPI(a) || 0);
        case 'ppi-asc':
          return (calculateDevicePPI(a) || 0) - (calculateDevicePPI(b) || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [devices, searchQuery, sortBy, selectedBrand]);

  // Max diagonal for scaling
  const maxDiagonal = useMemo(() => {
    return Math.max(...filteredDevices.map(d => d.diagonal), 1);
  }, [filteredDevices]);

  // Paginated devices
  const displayedDevices = showAll
    ? filteredDevices
    : filteredDevices.slice(0, ITEMS_PER_PAGE);

  const hasMore = filteredDevices.length > ITEMS_PER_PAGE && !showAll;

  // Group devices by brand for quick navigation
  const devicesByBrand = useMemo(() => {
    const groups: Record<string, Device[]> = {};
    filteredDevices.forEach(d => {
      const brand = getBrand(d);
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(d);
    });
    return groups;
  }, [filteredDevices]);

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${categoryName.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Brand Filter */}
          {brands.length > 1 && (
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            >
              <option value="all">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          )}

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          >
            <option value="brand">Brand + Model</option>
            <option value="size-desc">Size: Large → Small</option>
            <option value="size-asc">Size: Small → Large</option>
            <option value="ppi-desc">PPI: High → Low</option>
            <option value="ppi-asc">PPI: Low → High</option>
            <option value="name-asc">Name: A → Z</option>
          </select>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {filteredDevices.length === devices.length
            ? `${devices.length} ${categoryName.toLowerCase()}`
            : `${filteredDevices.length} of ${devices.length} ${categoryName.toLowerCase()}`
          }
        </div>
      </div>

      {/* Quick Navigation (Brand Groups) */}
      {brands.length > 2 && selectedBrand === 'all' && !searchQuery && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(devicesByBrand).map(([brand, brandDevices]) => {
            const config = brandConfig[brand] || brandConfig.Other;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all hover:scale-105 ${config.bgLight} ${config.bgDark} ${config.color} ${config.border}`}
              >
                {brand} ({brandDevices.length})
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Brand Clear Button */}
      {selectedBrand !== 'all' && (
        <div className="mb-4">
          <button
            onClick={() => setSelectedBrand('all')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
          >
            <span>Brand: {selectedBrand}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedDevices.map(device => {
          const dims = getDisplayDimensions(device);
          const ppi = calculateDevicePPI(device);
          const resolutionStr = getResolutionString(device);
          const popular = isPopular(device);
          const brand = getBrand(device);
          const config = brandConfig[brand] || brandConfig.Other;

          return (
            <a
              key={device.id}
              href={getDevicePageUrl(device.id)}
              className={`group relative bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${config.border}`}
            >
              {/* Popular Badge */}
              {popular && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-900 shadow-sm">
                    ★ HOT
                  </span>
                </div>
              )}

              {/* Card Content */}
              <div className="p-4">
                {/* Top Row: Screen Preview + Size */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Screen Size Visualization */}
                  <div className={`flex-shrink-0 rounded-lg p-2 ${config.bgLight} ${config.bgDark}`}>
                    <ScreenSizePreview device={device} maxDiagonal={maxDiagonal} />
                  </div>

                  {/* Size Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-2xl font-bold ${config.color}`}>
                        {device.diagonal}"
                      </span>
                      <AspectRatioBadge ratio={device.ratio} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dims.width.toFixed(1)}" × {dims.height.toFixed(1)}"
                    </div>
                  </div>
                </div>

                {/* Device Name */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2 truncate">
                  {device.name}
                </h3>

                {/* Specs Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Brand Tag */}
                  <span className={`px-2 py-0.5 rounded-full ${config.bgLight} ${config.bgDark} ${config.color} font-medium`}>
                    {brand}
                  </span>

                  {/* Resolution */}
                  {resolutionStr && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {resolutionStr}
                    </span>
                  )}

                  {/* PPI */}
                  {ppi && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {Math.round(ppi)} PPI
                    </span>
                  )}
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* No Results */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No {categoryName.toLowerCase()} found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand('all');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        </div>
      )}

      {/* Show More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            Show All {filteredDevices.length} {categoryName}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Showing {displayedDevices.length} of {filteredDevices.length}
          </p>
        </div>
      )}
    </div>
  );
}
