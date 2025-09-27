"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MeSHSuggestion {
  term: string;
  mesh_id?: string;
  category: string;
  type: 'mesh_term' | 'mesh_synonym' | 'trending_keyword';
  main_term?: string;
  relevance_score: number;
}

interface OptimizedQuery {
  query: string;
  description: string;
  type: string;
  mesh_id?: string;
}

interface MeSHAutocompleteResponse {
  status: string;
  mesh_terms: MeSHSuggestion[];
  trending_keywords: MeSHSuggestion[];
  suggested_queries: OptimizedQuery[];
  query: string;
  total_suggestions: number;
}

interface MeSHAutocompleteSearchProps {
  onSearch?: (query: string, suggestions: MeSHAutocompleteResponse) => void;
  onGenerateReview?: (query: string, optimizedQuery?: OptimizedQuery) => void;
  placeholder?: string;
  className?: string;
}

export default function MeSHAutocompleteSearch({
  onSearch,
  onGenerateReview,
  placeholder = "Search MeSH terms, topics, or enter PMIDs...",
  className = ""
}: MeSHAutocompleteSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MeSHAutocompleteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        await fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions(null);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return;

    console.log(`🔍 [MeSH Autocomplete] Fetching suggestions for: "${searchQuery}"`);
    setIsLoading(true);
    try {
      const apiUrl = `/api/proxy/mesh/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=8`;
      console.log(`📡 [MeSH Autocomplete] API call: ${apiUrl}`);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MeSHAutocompleteResponse = await response.json();
      console.log(`✅ [MeSH Autocomplete] Received ${data.total_suggestions} suggestions:`, {
        mesh_terms: data.mesh_terms.length,
        trending_keywords: data.trending_keywords.length,
        suggested_queries: data.suggested_queries.length
      });

      setSuggestions(data);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('❌ [MeSH Autocomplete] Error:', error);
      setSuggestions(null);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || !showSuggestions) return;

    const allSuggestions = [...suggestions.mesh_terms, ...suggestions.trending_keywords];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          handleSuggestionSelect(allSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: MeSHSuggestion) => {
    console.log(`🎯 [MeSH Autocomplete] Selected suggestion:`, suggestion);
    setQuery(suggestion.term);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Trigger search with the selected term
    if (onSearch && suggestions) {
      console.log(`🔍 [MeSH Autocomplete] Triggering search for: "${suggestion.term}"`);
      onSearch(suggestion.term, suggestions);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    
    setShowSuggestions(false);
    
    if (onSearch && suggestions) {
      onSearch(query, suggestions);
    }
  };

  const handleGenerateReview = (optimizedQuery?: OptimizedQuery) => {
    if (!query.trim()) return;

    console.log(`📝 [MeSH Autocomplete] Generate Review triggered:`, {
      query: query,
      optimizedQuery: optimizedQuery
    });

    setShowSuggestions(false);

    if (onGenerateReview) {
      onGenerateReview(query, optimizedQuery);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'oncology': 'text-red-400',
      'genetics': 'text-blue-400',
      'endocrinology': 'text-green-400',
      'cardiology': 'text-purple-400',
      'neurology': 'text-yellow-400',
      'infectious_diseases': 'text-pink-400',
      'trending': 'text-[var(--spotify-green)]'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full bg-[var(--spotify-black)] border border-[var(--spotify-border-gray)] rounded-lg px-4 py-3 pr-12 text-white placeholder-[var(--spotify-muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)] focus:border-transparent"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--spotify-green)]"></div>
          )}
          <ChartBarIcon className="w-5 h-5 text-[var(--spotify-muted-text)]" />
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions && (suggestions.mesh_terms.length > 0 || suggestions.trending_keywords.length > 0) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* MeSH Terms Section */}
          {suggestions.mesh_terms.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-[var(--spotify-light-text)] mb-2 px-2">
                📚 MeSH Terms
              </div>
              {suggestions.mesh_terms.map((suggestion, index) => (
                <div
                  key={`mesh-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                    selectedIndex === index
                      ? 'bg-[var(--spotify-green)] text-black'
                      : 'hover:bg-[var(--spotify-medium-gray)] text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{suggestion.term}</div>
                      {suggestion.main_term && suggestion.main_term !== suggestion.term && (
                        <div className="text-xs text-[var(--spotify-light-text)]">
                          Synonym of: {suggestion.main_term}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs ${getCategoryColor(suggestion.category)}`}>
                      {suggestion.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trending Keywords Section */}
          {suggestions.trending_keywords.length > 0 && (
            <div className="p-2 border-t border-[var(--spotify-border-gray)]">
              <div className="text-xs font-medium text-[var(--spotify-light-text)] mb-2 px-2">
                🔥 Trending
              </div>
              {suggestions.trending_keywords.map((suggestion, index) => {
                const adjustedIndex = suggestions.mesh_terms.length + index;
                return (
                  <div
                    key={`trending-${index}`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                      selectedIndex === adjustedIndex
                        ? 'bg-[var(--spotify-green)] text-black'
                        : 'hover:bg-[var(--spotify-medium-gray)] text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{suggestion.term}</div>
                      <div className="text-xs text-[var(--spotify-green)]">trending</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generate Review Options */}
          {suggestions.suggested_queries.length > 0 && (
            <div className="p-2 border-t border-[var(--spotify-border-gray)]">
              <div className="text-xs font-medium text-[var(--spotify-light-text)] mb-2 px-2">
                🚀 Generate Review Options
              </div>
              {suggestions.suggested_queries.slice(0, 2).map((optimizedQuery, index) => (
                <button
                  key={`query-${index}`}
                  onClick={() => handleGenerateReview(optimizedQuery)}
                  className="w-full px-3 py-2 text-left rounded hover:bg-[var(--spotify-medium-gray)] text-white transition-colors"
                >
                  <div className="font-medium text-sm">{optimizedQuery.description}</div>
                  <div className="text-xs text-[var(--spotify-light-text)] truncate">
                    {optimizedQuery.query}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
