'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  type: 'paper' | 'collection' | 'note' | 'report' | 'analysis';
  id: string;
  title: string;
  subtitle: string;
  highlight?: string;
  [key: string]: any;
}

interface SearchResults {
  papers: SearchResult[];
  collections: SearchResult[];
  notes: SearchResult[];
  reports: SearchResult[];
  analyses: SearchResult[];
}

interface GlobalSearchProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
}

/**
 * Global Search Modal Component
 * 
 * Features:
 * - Real-time search across all content types
 * - Keyboard navigation (Cmd+K to open, Esc to close)
 * - Categorized results
 * - Debounced API calls
 * - Recent searches (future)
 * 
 * @example
 * <GlobalSearch
 *   projectId={projectId}
 *   isOpen={isSearchOpen}
 *   onClose={() => setIsSearchOpen(false)}
 *   onResultClick={(result) => navigateToResult(result)}
 * />
 */
export default function GlobalSearch({
  projectId,
  isOpen,
  onClose,
  onResultClick
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    papers: [],
    collections: [],
    notes: [],
    reports: [],
    analyses: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults({
        papers: [],
        collections: [],
        notes: [],
        reports: [],
        analyses: []
      });
      setTotalFound(0);
    }
  }, [debouncedQuery, projectId]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://r-dagent-production.up.railway.app/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}&content_types=papers,collections,notes,reports,analyses&limit=10`,
        {
          headers: {
            'User-ID': 'fredericle75019@gmail.com', // TODO: Get from auth context
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setTotalFound(data.total_found);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults({
        papers: [],
        collections: [],
        notes: [],
        reports: [],
        analyses: []
      });
      setTotalFound(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Flatten results for keyboard navigation
  const flatResults = [
    ...results.papers,
    ...results.collections,
    ...results.notes,
    ...results.reports,
    ...results.analyses
  ];

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      handleResultClick(flatResults[selectedIndex]);
    }
  }, [flatResults, selectedIndex, onClose]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--spotify-elevated-base)] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--spotify-elevated-highlight)]">
          <MagnifyingGlassIcon className="w-5 h-5 text-[var(--spotify-subdued)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search papers, collections, notes, reports..."
            className="flex-1 bg-transparent text-[var(--spotify-white)] placeholder-[var(--spotify-subdued)] outline-none"
            data-testid="global-search-input"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--spotify-subdued)] hover:text-[var(--spotify-white)]"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
          <kbd className="px-2 py-1 text-xs bg-[var(--spotify-base)] rounded border border-[var(--spotify-elevated-highlight)] text-[var(--spotify-subdued)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto" data-testid="global-search-results">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)]"></div>
            </div>
          )}

          {!isLoading && query.length >= 2 && totalFound === 0 && (
            <div className="py-12 text-center text-[var(--spotify-subdued)]">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-12 text-center text-[var(--spotify-subdued)]">
              Type at least 2 characters to search
            </div>
          )}

          {!isLoading && totalFound > 0 && (
            <div className="py-2">
              {/* Papers */}
              {results.papers.length > 0 && (
                <SearchCategory
                  title="Papers"
                  icon="📄"
                  results={results.papers}
                  onResultClick={handleResultClick}
                  selectedIndex={selectedIndex}
                  startIndex={0}
                />
              )}

              {/* Collections */}
              {results.collections.length > 0 && (
                <SearchCategory
                  title="Collections"
                  icon="📚"
                  results={results.collections}
                  onResultClick={handleResultClick}
                  selectedIndex={selectedIndex}
                  startIndex={results.papers.length}
                />
              )}

              {/* Notes */}
              {results.notes.length > 0 && (
                <SearchCategory
                  title="Notes"
                  icon="📝"
                  results={results.notes}
                  onResultClick={handleResultClick}
                  selectedIndex={selectedIndex}
                  startIndex={results.papers.length + results.collections.length}
                />
              )}

              {/* Reports */}
              {results.reports.length > 0 && (
                <SearchCategory
                  title="Reports"
                  icon="📊"
                  results={results.reports}
                  onResultClick={handleResultClick}
                  selectedIndex={selectedIndex}
                  startIndex={results.papers.length + results.collections.length + results.notes.length}
                />
              )}

              {/* Analyses */}
              {results.analyses.length > 0 && (
                <SearchCategory
                  title="Analyses"
                  icon="🔬"
                  results={results.analyses}
                  onResultClick={handleResultClick}
                  selectedIndex={selectedIndex}
                  startIndex={results.papers.length + results.collections.length + results.notes.length + results.reports.length}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalFound > 0 && (
          <div className="px-4 py-2 border-t border-[var(--spotify-elevated-highlight)] text-xs text-[var(--spotify-subdued)] flex items-center justify-between">
            <span>{totalFound} results found</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--spotify-base)] rounded border border-[var(--spotify-elevated-highlight)]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-[var(--spotify-base)] rounded border border-[var(--spotify-elevated-highlight)]">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--spotify-base)] rounded border border-[var(--spotify-elevated-highlight)]">↵</kbd>
                to select
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchCategoryProps {
  title: string;
  icon: string;
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  selectedIndex: number;
  startIndex: number;
}

function SearchCategory({
  title,
  icon,
  results,
  onResultClick,
  selectedIndex,
  startIndex
}: SearchCategoryProps) {
  return (
    <div className="mb-4">
      <div className="px-4 py-2 text-xs font-semibold text-[var(--spotify-subdued)] uppercase tracking-wider">
        {icon} {title} ({results.length})
      </div>
      <div>
        {results.map((result, index) => {
          const globalIndex = startIndex + index;
          const isSelected = globalIndex === selectedIndex;
          
          return (
            <button
              key={result.id}
              onClick={() => onResultClick(result)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'bg-[var(--spotify-elevated-highlight)]'
                  : 'hover:bg-[var(--spotify-elevated-highlight)]'
              }`}
              data-testid={`search-result-${result.type}-${result.id}`}
            >
              <div className="text-sm font-medium text-[var(--spotify-white)] truncate">
                {result.title}
              </div>
              <div className="text-xs text-[var(--spotify-subdued)] truncate mt-1">
                {result.subtitle}
              </div>
              {result.highlight && (
                <div className="text-xs text-[var(--spotify-light-text)] mt-1 line-clamp-2">
                  {result.highlight}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

