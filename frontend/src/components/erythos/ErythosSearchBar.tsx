'use client';

import React, { useState, useCallback, KeyboardEvent } from 'react';

/**
 * ErythosSearchBar - Centered search bar with tags
 * Used on Home page and Discover page for PubMed search
 */

interface Tag {
  id: string;
  label: string;
  color?: 'red' | 'purple' | 'orange' | 'blue' | 'green';
}

interface ErythosSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  tags?: Tag[];
  onTagClick?: (tag: Tag) => void;
  suggestedTags?: Tag[];
  loading?: boolean;
  autoFocus?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'pl-10 pr-20 py-2 text-sm',
  md: 'pl-12 pr-24 py-3 text-base',
  lg: 'pl-14 pr-28 py-4 text-lg',
};

const buttonSizeStyles = {
  sm: 'px-4 text-sm',
  md: 'px-6 text-base',
  lg: 'px-8 text-base',
};

const iconSizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const tagColorStyles = {
  red: 'bg-red-900/30 text-red-400 border-red-700/30 hover:bg-red-900/50',
  purple: 'bg-purple-900/30 text-purple-400 border-purple-700/30 hover:bg-purple-900/50',
  orange: 'bg-orange-900/30 text-orange-400 border-orange-700/30 hover:bg-orange-900/50',
  blue: 'bg-blue-900/30 text-blue-400 border-blue-700/30 hover:bg-blue-900/50',
  green: 'bg-green-900/30 text-green-400 border-green-700/30 hover:bg-green-900/50',
};

export function ErythosSearchBar({
  placeholder = 'Search PubMed...',
  value = '',
  onChange,
  onSearch,
  tags = [],
  onTagClick,
  suggestedTags = [],
  loading = false,
  autoFocus = false,
  className = '',
  size = 'md',
}: ErythosSearchBarProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSearch?.(inputValue.trim());
    }
  }, [inputValue, onSearch]);

  const handleSearch = useCallback(() => {
    if (inputValue.trim()) {
      onSearch?.(inputValue.trim());
    }
  }, [inputValue, onSearch]);

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <svg className={`animate-spin ${iconSizeStyles[size]} text-gray-400`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className={`${iconSizeStyles[size]} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-gray-900/70 border border-gray-700/50 rounded-xl ${sizeStyles[size]} text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200`}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !inputValue.trim()}
          className={`absolute inset-y-2 right-2 ${buttonSizeStyles[size]} bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200`}
        >
          Search
        </button>
      </div>

      {/* Selected Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagClick?.(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-200 flex items-center gap-1 ${
                tagColorStyles[tag.color || 'blue']
              }`}
            >
              {tag.label}
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && tags.length === 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Suggested searches:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagClick?.(tag)}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50 transition-colors duration-200"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ErythosSearchBar;

