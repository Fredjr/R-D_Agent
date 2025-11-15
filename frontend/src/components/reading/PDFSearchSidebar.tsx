'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  pageNumber: number;
  text: string;
  index: number;
}

interface PDFSearchSidebarProps {
  pdfUrl: string;
  numPages: number;
  currentPage: number;
  onResultClick: (pageNumber: number, index: number) => void;
  onClose: () => void;
  onSearchQueryChange: (query: string) => void;
  searchResults: SearchResult[];
  currentResultIndex: number;
}

export default function PDFSearchSidebar({
  pdfUrl,
  numPages,
  currentPage,
  onResultClick,
  onClose,
  onSearchQueryChange,
  searchResults,
  currentResultIndex,
}: PDFSearchSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      onSearchQueryChange(query);
      // Simulate search delay
      setTimeout(() => setIsSearching(false), 500);
    } else {
      onSearchQueryChange('');
      setIsSearching(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        // Focus search input
        const input = document.querySelector<HTMLInputElement>('#pdf-search-input');
        if (input) {
          input.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group results by page
  const resultsByPage = searchResults.reduce((acc, result) => {
    if (!acc[result.pageNumber]) {
      acc[result.pageNumber] = [];
    }
    acc[result.pageNumber].push(result);
    return acc;
  }, {} as Record<number, SearchResult[]>);

  const sortedPages = Object.keys(resultsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="w-80 h-full bg-gray-900 text-white flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold">Search within PDF</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Close search"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="pdf-search-input"
            type="text"
            placeholder="Search within PDF..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-purple-500"
            autoFocus
          />
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {isSearching ? (
                'Searching...'
              ) : (
                <>
                  {searchResults.length > 0 ? (
                    <>
                      {currentResultIndex + 1} / {searchResults.length}
                    </>
                  ) : (
                    '0 / 0'
                  )}
                </>
              )}
            </span>

            {/* Navigation Buttons */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const prevIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1;
                    const result = searchResults[prevIndex];
                    onResultClick(result.pageNumber, prevIndex);
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Previous result"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const nextIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0;
                    const result = searchResults[nextIndex];
                    onResultClick(result.pageNumber, nextIndex);
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Next result"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <MagnifyingGlassIcon className="w-12 h-12 mb-2" />
            <p className="text-sm">Enter a search term to find text in the PDF</p>
            <p className="text-xs mt-2">Use Ctrl+F (Cmd+F on Mac) to search</p>
          </div>
        ) : isSearching ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Searching...</p>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <p className="text-sm">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {sortedPages.map((pageNum) => {
              const pageResults = resultsByPage[pageNum];
              
              return (
                <div key={pageNum} className="p-3">
                  {/* Page Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-purple-400">
                      Page {pageNum}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {pageResults.length} {pageResults.length === 1 ? 'result' : 'results'}
                    </span>
                  </div>

                  {/* Results for this page */}
                  <div className="space-y-2">
                    {pageResults.map((result, idx) => {
                      const isCurrentResult = result.index === currentResultIndex;
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => onResultClick(result.pageNumber, result.index)}
                          className={`
                            p-2 rounded cursor-pointer text-xs transition-colors
                            ${isCurrentResult
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }
                          `}
                        >
                          <p className="line-clamp-3">
                            {highlightSearchTerm(result.text, searchQuery)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to highlight search term in text
function highlightSearchTerm(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.toLowerCase() === searchTerm.toLowerCase()) {
          return (
            <mark key={i} className="bg-yellow-400 text-black font-semibold px-0.5">
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

