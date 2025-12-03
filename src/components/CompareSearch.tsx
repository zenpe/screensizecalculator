import { useState, useMemo, useRef, useEffect } from 'react';
import type { Device } from '../data/devices';

interface ComparisonPair {
  a: Device;
  b: Device;
  slug: string;
  searchText: string; // Pre-computed for faster search
}

interface CompareSearchProps {
  devices: Device[];
  comparisons: ComparisonPair[];
}

export default function CompareSearch({ devices, comparisons }: CompareSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter comparisons based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return comparisons
      .filter(comp => {
        const text = comp.searchText;
        return searchTerms.every(term => text.includes(term));
      })
      .slice(0, 8); // Limit to 8 results for performance
  }, [query, comparisons]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          window.location.href = `/compare/${filteredResults[selectedIndex].slug}`;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get category icon
  const getCategoryIcon = (category: Device['category']) => {
    switch (category) {
      case 'phone': return '📱';
      case 'monitor': return '🖥️';
      case 'tv': return '📺';
      case 'projector': return '📽️';
      default: return '📺';
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a device (e.g. iPhone 16, Samsung S24)..."
          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          aria-label="Search device comparisons"
          aria-expanded={isOpen && filteredResults.length > 0}
          aria-controls="search-results"
          role="combobox"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.trim() && (
        <div
          ref={dropdownRef}
          id="search-results"
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
          role="listbox"
        >
          {filteredResults.length > 0 ? (
            <ul className="py-2 max-h-[400px] overflow-y-auto">
              {filteredResults.map((result, index) => (
                <li key={result.slug}>
                  <a
                    href={`/compare/${result.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="text-xl flex-shrink-0">
                      {getCategoryIcon(result.a.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.a.name} vs {result.b.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {result.a.diagonal}" vs {result.b.diagonal}" • {result.a.category}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No comparisons found for "{query}"
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try searching for "iPhone", "Samsung", "TV", or "Monitor"
              </p>
            </div>
          )}

          {/* Keyboard hints */}
          {filteredResults.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Enter</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Esc</kbd>
                  close
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
