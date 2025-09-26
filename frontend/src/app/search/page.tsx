'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/Navigation';
import { Button } from '@/components/ui/Button';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: string;
  type: 'project' | 'report' | 'collection' | 'article';
  title: string;
  description: string;
  metadata: {
    author?: string;
    date?: string;
    tags?: string[];
    projectName?: string;
  };
}

function SearchPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    project: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // TODO: Implement actual search API call
      // For now, return mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'project',
          title: 'Machine Learning in Healthcare',
          description: 'Comprehensive analysis of ML applications in medical diagnosis',
          metadata: {
            author: 'Research Team',
            date: '2024-01-15',
            tags: ['machine-learning', 'healthcare', 'diagnosis']
          }
        },
        {
          id: '2',
          type: 'report',
          title: 'COVID-19 Treatment Efficacy Study',
          description: 'Meta-analysis of treatment protocols and outcomes',
          metadata: {
            author: 'Dr. Smith',
            date: '2024-01-10',
            projectName: 'Pandemic Response Research'
          }
        },
        {
          id: '3',
          type: 'collection',
          title: 'Neural Networks Papers',
          description: 'Curated collection of seminal neural network research',
          metadata: {
            date: '2024-01-08',
            tags: ['neural-networks', 'deep-learning']
          }
        }
      ];
      
      // Filter results based on query
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [query]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project': return '📁';
      case 'report': return '📄';
      case 'collection': return '📚';
      case 'article': return '📰';
      default: return '📄';
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-[var(--spotify-blue)]/10 text-[var(--spotify-blue)]';
      case 'report': return 'bg-[var(--spotify-green)]/10 text-[var(--spotify-green)]';
      case 'collection': return 'bg-[var(--spotify-purple)]/10 text-[var(--spotify-purple)]';
      case 'article': return 'bg-[var(--spotify-light-gray)]/10 text-[var(--spotify-white)]';
      default: return 'bg-[var(--spotify-medium-gray)]/10 text-[var(--spotify-light-text)]';
    }
  };

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none py-6 sm:py-8">
        {/* Mobile-friendly header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--spotify-white)] mb-2">Search</h1>
          <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
            Find projects, reports, collections, and research across your workspace
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6 sm:mb-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[var(--spotify-muted-text)]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search projects, reports, collections..."
              className="block w-full pl-10 pr-3 py-3 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] placeholder-[var(--spotify-muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)] focus:border-transparent text-sm sm:text-base"
            />
          </div>
          
          {/* Search Actions */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            
            <Button
              onClick={() => handleSearch(query)}
              variant="spotifyPrimary"
              size="spotifySm"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 p-4 bg-[var(--spotify-dark-gray)] rounded-lg border border-[var(--spotify-border-gray)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
                  Content Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-border-gray)] rounded text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
                >
                  <option value="all">All Types</option>
                  <option value="project">Projects</option>
                  <option value="report">Reports</option>
                  <option value="collection">Collections</option>
                  <option value="article">Articles</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-border-gray)] rounded text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
                >
                  <option value="all">All Time</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
                  Project
                </label>
                <select
                  value={filters.project}
                  onChange={(e) => setFilters({...filters, project: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-border-gray)] rounded text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
                >
                  <option value="all">All Projects</option>
                  <option value="current">Current Project</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)] mx-auto"></div>
              <p className="text-[var(--spotify-light-text)] mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[var(--spotify-light-text)]">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </p>
              </div>
              
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)] hover:bg-[var(--spotify-medium-gray)] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">{getResultIcon(result.type)}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getResultTypeColor(result.type)}`}>
                          {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-2">
                        {result.title}
                      </h3>
                      
                      <p className="text-[var(--spotify-light-text)] mb-3">
                        {result.description}
                      </p>
                      
                      <div className="flex items-center text-sm text-[var(--spotify-muted-text)] space-x-4">
                        {result.metadata.author && (
                          <span>By {result.metadata.author}</span>
                        )}
                        {result.metadata.date && (
                          <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
                        )}
                        {result.metadata.projectName && (
                          <span>in {result.metadata.projectName}</span>
                        )}
                      </div>
                      
                      {result.metadata.tags && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {result.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : query ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-16 w-16 text-[var(--spotify-muted-text)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--spotify-white)] mb-2">No results found</h3>
              <p className="text-[var(--spotify-light-text)]">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-16 w-16 text-[var(--spotify-muted-text)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--spotify-white)] mb-2">Start searching</h3>
              <p className="text-[var(--spotify-light-text)]">
                Enter a search term to find projects, reports, and collections
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--spotify-black)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)]"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
