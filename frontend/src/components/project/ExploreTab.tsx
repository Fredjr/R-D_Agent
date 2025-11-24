'use client';

import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  ListBulletIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';
import { useAuth } from '@/contexts/AuthContext';
import FilterPanel, { type FilterSection } from '@/components/filters/FilterPanel';
import FilterChips, { type FilterChip } from '@/components/filters/FilterChips';
import dynamic from 'next/dynamic';
import MeSHAutocompleteSearch from '@/components/MeSHAutocompleteSearch';
import { useRouter } from 'next/navigation';
import {
  SpotifyTabSection,
  SpotifyTabCard,
  SpotifyTabCardContent,
  SpotifyTabButton,
  SpotifyTabSearchBar,
  SpotifyTabEmptyState,
  SpotifyTabLoading
} from './shared';
import { triagePaper } from '@/lib/api';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/reading/PDFViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading PDF viewer...</div>
});

interface ExploreTabProps {
  project: any;
  onRefresh: () => void;
}

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  citation_count?: number;
  doi?: string;
}

type ViewMode = 'network' | 'search' | 'paper-network';

export function ExploreTab({ project, onRefresh }: ExploreTabProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PubMedArticle[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<PubMedArticle | null>(null);
  const [savingPmids, setSavingPmids] = useState<Set<string>>(new Set());
  const [triagingPmids, setTriagingPmids] = useState<Set<string>>(new Set());

  // Collection selector modal state
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [articleToSave, setArticleToSave] = useState<PubMedArticle | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [createNewCollection, setCreateNewCollection] = useState(false);

  // View mode toggle - now supports paper-specific network view
  // Default to 'search' mode to show search interface first
  const [viewMode, setViewMode] = useState<ViewMode>('search');

  // Selected paper for network view (Phase 1-2.3 features)
  const [selectedPaperPMID, setSelectedPaperPMID] = useState<string | null>(null);

  // 🔍 Week 6: Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({
    sortBy: 'relevance',
    yearRange: [2000, 2024],
    citationFilter: 'all',
    hasAbstract: false
  });

  // PDF Viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPMID, setSelectedPMID] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // Handle MeSH-enhanced search
  const handleMeSHSearch = async (query: string, meshData?: any) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setIsSearching(true);
    setHasSearched(true);
    setViewMode('search'); // Switch to search view

    try {
      console.log('🔍 [ExploreTab] Searching PubMed for:', query, 'with MeSH data:', meshData);

      // Build API URL with parameters
      const params = new URLSearchParams({
        q: query,
        limit: '20'
      });

      // Add MeSH data if available
      if (meshData?.mesh_terms && meshData.mesh_terms.length > 0) {
        params.append('mesh_terms', JSON.stringify(meshData.mesh_terms));
      }
      if (meshData?.suggested_queries && meshData.suggested_queries.length > 0) {
        params.append('suggested_queries', JSON.stringify(meshData.suggested_queries));
      }

      const apiUrl = `/api/proxy/pubmed/search?${params}`;
      console.log('🔍 [ExploreTab] API call:', apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [ExploreTab] Search results:', data);

      setSearchResults(data.articles || []);
    } catch (error) {
      console.error('❌ [ExploreTab] Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Legacy search handler for backward compatibility
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    handleMeSHSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSelectedArticle(null);
  };

  // Fetch collections when modal opens
  const fetchCollections = async () => {
    if (!user?.email) return;

    setLoadingCollections(true);
    try {
      const response = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
        headers: {
          'User-ID': user.email
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const data = await response.json();
      // Backend returns array directly, not wrapped in {collections: [...]}
      const collectionsArray = Array.isArray(data) ? data : (data.collections || []);
      console.log('📚 Fetched collections:', collectionsArray);
      setCollections(collectionsArray);
    } catch (error) {
      console.error('❌ Error fetching collections:', error);
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  // Triage article with AI
  const handleTriageArticle = async (article: PubMedArticle) => {
    if (!user?.user_id) {
      alert('Please sign in to triage articles');
      return;
    }

    setTriagingPmids(prev => new Set(prev).add(article.pmid));

    try {
      const result = await triagePaper(project.project_id, article.pmid, user.user_id);
      console.log('✅ Paper triaged:', result);

      // Week 24: Dispatch custom event to notify hypothesis components to refresh
      // This allows automatic evidence linking to be visible without manual refresh
      window.dispatchEvent(new CustomEvent('hypotheses-refresh', {
        detail: { projectId: project.project_id, triageResult: result }
      }));

      // Show success message with relevance score
      const statusEmoji = result.triage_status === 'must_read' ? '🔴' :
                         result.triage_status === 'nice_to_know' ? '🟡' : '⚪';
      alert(`${statusEmoji} Paper triaged!\n\nRelevance Score: ${result.relevance_score}/100\nStatus: ${result.triage_status.replace('_', ' ').toUpperCase()}\n\nAI-generated evidence has been automatically linked to relevant hypotheses.`);
    } catch (error) {
      console.error('❌ Error triaging article:', error);
      alert('Failed to triage article. Please try again.');
    } finally {
      setTriagingPmids(prev => {
        const next = new Set(prev);
        next.delete(article.pmid);
        return next;
      });
    }
  };

  // Open collection selector modal
  const handleSaveArticle = async (article: PubMedArticle) => {
    if (!user?.email) {
      alert('Please sign in to save articles');
      return;
    }

    setArticleToSave(article);
    setShowCollectionSelector(true);
    setCreateNewCollection(false);
    setNewCollectionName('');
    setSelectedCollectionId('');
    fetchCollections();
  };

  // Save article to selected or new collection
  const handleConfirmSave = async () => {
    if (!articleToSave || !user?.email) return;

    setSavingPmids(prev => new Set(prev).add(articleToSave.pmid));
    setShowCollectionSelector(false);

    try {
      if (createNewCollection) {
        // Create new collection with article
        if (!newCollectionName.trim()) {
          alert('Please enter a collection name');
          return;
        }

        const response = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email
          },
          body: JSON.stringify({
            collection_name: newCollectionName.trim(),
            description: `Created from Explore Papers`,
            tags: ['explore']
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create collection');
        }

        const newCollection = await response.json();
        const collectionId = newCollection.collection_id;

        // Add article to new collection
        await addArticleToCollection(collectionId, articleToSave);
      } else {
        // Add to existing collection
        if (!selectedCollectionId) {
          alert('Please select a collection');
          return;
        }

        await addArticleToCollection(selectedCollectionId, articleToSave);
      }

      console.log('✅ Article saved to collection');
      onRefresh();
    } catch (error) {
      console.error('❌ Error saving article:', error);
      alert('Failed to save article. Please try again.');
    } finally {
      setSavingPmids(prev => {
        const next = new Set(prev);
        next.delete(articleToSave.pmid);
        return next;
      });
      setArticleToSave(null);
    }
  };

  // Helper function to add article to collection
  const addArticleToCollection = async (collectionId: string, article: PubMedArticle) => {
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`/api/proxy/collections/${collectionId}/pubmed-articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': user.email
      },
      body: JSON.stringify({
        article: {
          pmid: article.pmid,
          title: article.title,
          authors: article.authors || [],
          journal: article.journal || '',
          year: article.year || new Date().getFullYear(),
          abstract: article.abstract || '',
          citation_count: article.citation_count || 0,
          discovery_context: 'similar',
          source_article_pmid: '',
          source_article_title: '',
          exploration_session_id: ''
        },
        projectId: project.project_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add article to collection');
    }

    return response.json();
  };

  // 🔍 Week 6: Filter and sort search results
  const filteredResults = useMemo(() => {
    let filtered = [...searchResults];

    // Apply year range filter
    if (filters.yearRange) {
      const [minYear, maxYear] = filters.yearRange;
      filtered = filtered.filter(article =>
        article.year >= minYear && article.year <= maxYear
      );
    }

    // Apply citation count filter
    if (filters.citationFilter === 'low') {
      filtered = filtered.filter(article => (article.citation_count || 0) < 10);
    } else if (filters.citationFilter === 'medium') {
      filtered = filtered.filter(article => (article.citation_count || 0) >= 10 && (article.citation_count || 0) < 100);
    } else if (filters.citationFilter === 'high') {
      filtered = filtered.filter(article => (article.citation_count || 0) >= 100);
    }

    // Apply has abstract filter
    if (filters.hasAbstract) {
      filtered = filtered.filter(article => article.abstract && article.abstract.length > 0);
    }

    // Apply sorting
    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => b.year - a.year);
    } else if (filters.sortBy === 'citations') {
      filtered.sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0));
    }
    // 'relevance' keeps original order from PubMed

    return filtered;
  }, [searchResults, filters]);

  // 🔍 Week 6: Get unique journals for filter
  const availableJournals = useMemo(() => {
    const journals = new Set(searchResults.map(article => article.journal));
    return Array.from(journals).sort();
  }, [searchResults]);

  // 🔍 Week 6: Filter configuration
  const currentYear = new Date().getFullYear();
  const filterSections: FilterSection[] = [
    {
      title: 'Search Results',
      filters: [
        {
          id: 'sortBy',
          label: 'Sort By',
          type: 'select',
          value: filters.sortBy,
          options: [
            { value: 'relevance', label: 'Relevance (PubMed)' },
            { value: 'date', label: 'Publication Date (Newest)' },
            { value: 'citations', label: 'Citations (Most Cited)' }
          ]
        },
        {
          id: 'yearRange',
          label: 'Publication Year',
          type: 'range',
          value: filters.yearRange,
          min: 2000,
          max: currentYear,
          step: 1
        },
        {
          id: 'citationFilter',
          label: 'Citation Count',
          type: 'select',
          value: filters.citationFilter,
          options: [
            { value: 'all', label: 'All Papers' },
            { value: 'low', label: 'Low (< 10 citations)' },
            { value: 'medium', label: 'Medium (10-99 citations)' },
            { value: 'high', label: 'High (100+ citations)' }
          ]
        },
        {
          id: 'hasAbstract',
          label: 'Has Abstract',
          type: 'checkbox',
          value: filters.hasAbstract
        }
      ]
    }
  ];

  // 🔍 Week 6: Active filter chips
  const activeFilterChips: FilterChip[] = [];
  if (filters.sortBy !== 'relevance') {
    const sortOption = filterSections[0].filters[0].options?.find(o => o.value === filters.sortBy);
    activeFilterChips.push({
      id: 'sortBy',
      label: 'Sort',
      value: filters.sortBy,
      displayValue: sortOption?.label
    });
  }
  if (filters.yearRange[0] !== 2000 || filters.yearRange[1] !== currentYear) {
    activeFilterChips.push({
      id: 'yearRange',
      label: 'Year',
      value: filters.yearRange,
      displayValue: `${filters.yearRange[0]} - ${filters.yearRange[1]}`
    });
  }
  if (filters.citationFilter !== 'all') {
    const citationOption = filterSections[0].filters[2].options?.find(o => o.value === filters.citationFilter);
    activeFilterChips.push({
      id: 'citationFilter',
      label: 'Citations',
      value: filters.citationFilter,
      displayValue: citationOption?.label
    });
  }
  if (filters.hasAbstract) {
    activeFilterChips.push({
      id: 'hasAbstract',
      label: 'Has Abstract',
      value: true,
      displayValue: 'Yes'
    });
  }

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      sortBy: 'relevance',
      yearRange: [2000, currentYear],
      citationFilter: 'all',
      hasAbstract: false
    });
  };

  return (
    <SpotifyTabSection>
      {/* Header with Search */}
      <SpotifyTabCard variant="gradient" gradient="from-purple-500/10 to-blue-500/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--spotify-white)]">Explore Papers</h2>
              <p className="text-sm text-[var(--spotify-light-text)]">Search PubMed and visualize research networks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--spotify-dark-gray)] rounded-lg p-1">
              <button
                onClick={() => setViewMode('network')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                  viewMode === 'network'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)]'
                }`}
                title="Network View"
              >
                <Squares2X2Icon className="w-4 h-4" />
                <span className="text-sm font-medium">Network</span>
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                  viewMode === 'search'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)]'
                }`}
                title="Search View"
              >
                <ListBulletIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Search</span>
              </button>
            </div>
            {hasSearched && viewMode === 'search' && (
              <SpotifyTabButton
                variant="ghost"
                onClick={clearSearch}
              >
                <XMarkIcon className="w-4 h-4" />
                Clear
              </SpotifyTabButton>
            )}
          </div>
        </div>

        {/* MeSH-Enhanced PubMed Search Bar */}
        <div className="mt-4">
          <MeSHAutocompleteSearch
            onSearch={handleMeSHSearch}
            placeholder="Search MeSH terms, topics, or enter PMIDs (e.g., 'CRISPR gene editing', 'PMID:40310133')"
            className="w-full"
          />
        </div>
      </SpotifyTabCard>

      {/* Search Results or Network View */}
      {viewMode === 'search' ? (
        <>
          {/* 🔍 Week 6: Filter Panel */}
          {searchResults.length > 0 && !isSearching && (
            <FilterPanel
              sections={filterSections}
              activeFilters={filters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAllFilters}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />
          )}

          {/* 🔍 Week 6: Active Filter Chips */}
          {activeFilterChips.length > 0 && !isSearching && (
            <FilterChips
              chips={activeFilterChips}
              onRemove={(chipId) => {
                if (chipId === 'yearRange') {
                  handleFilterChange('yearRange', [2000, currentYear]);
                } else if (chipId === 'hasAbstract') {
                  handleFilterChange('hasAbstract', false);
                } else {
                  handleFilterChange(chipId, chipId === 'sortBy' ? 'relevance' : 'all');
                }
              }}
              onClearAll={handleClearAllFilters}
            />
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results for "{searchQuery}"
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isSearching ? 'Searching...' : `Showing ${filteredResults.length} of ${searchResults.length} articles`}
              </p>
            </div>

          {isSearching ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Searching PubMed...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {filteredResults.map((article) => (
                <div
                  key={article.pmid}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Article Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium">{article.journal}</span>
                        <span>•</span>
                        <span>{article.year}</span>
                        <span>•</span>
                        <span className="text-blue-600">PMID: {article.pmid}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Matching /search page layout */}
                  <div className="flex flex-wrap gap-2 mt-4 mb-3">
                    <button
                      onClick={() => handleTriageArticle(article)}
                      disabled={triagingPmids.has(article.pmid)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 rounded hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50"
                      title="Triage with AI - Get relevance score and insights"
                    >
                      {triagingPmids.has(article.pmid) ? (
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <SparklesIcon className="w-4 h-4 mr-1" />
                      )}
                      {triagingPmids.has(article.pmid) ? 'Triaging...' : 'Triage with AI'}
                    </button>
                    <button
                      onClick={() => {
                        // Switch to paper-network mode with Phase 1-2.3 features
                        setSelectedPaperPMID(article.pmid);
                        setViewMode('paper-network');
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border border-purple-500/30 rounded hover:from-purple-500/30 hover:to-blue-500/30 transition-all"
                      title="Explore Network with Phase 1-2.3 Features"
                    >
                      <GlobeAltIcon className="w-4 h-4 mr-1" />
                      Explore Network
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPMID(article.pmid);
                        setSelectedTitle(article.title);
                        setShowPDFViewer(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                      title="Read PDF"
                    >
                      <DocumentTextIcon className="w-4 h-4 mr-1" />
                      Read PDF
                    </button>
                    <button
                      onClick={() => handleSaveArticle(article)}
                      disabled={savingPmids.has(article.pmid)}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] rounded hover:bg-[var(--spotify-green)]/30 transition-colors disabled:opacity-50"
                      title="Save to collection"
                    >
                      {savingPmids.has(article.pmid) ? (
                        <div className="w-4 h-4 border-2 border-[var(--spotify-green)] border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <BookmarkIcon className="w-4 h-4 mr-1" />
                      )}
                      {savingPmids.has(article.pmid) ? 'Saving...' : 'Add to Collection'}
                    </button>
                  </div>

                  {/* Authors */}
                  {article.authors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Authors:</span>{' '}
                        {article.authors.slice(0, 3).join(', ')}
                        {article.authors.length > 3 && ` +${article.authors.length - 3} more`}
                      </p>
                    </div>
                  )}

                  {/* Abstract */}
                  {article.abstract && (
                    <div className="text-sm text-gray-600 leading-relaxed">
                      <p className="line-clamp-3">{article.abstract}</p>
                    </div>
                  )}

                  {/* DOI */}
                  {article.doi && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        DOI: <span className="font-mono">{article.doi}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No articles match your filters</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
              <button
                onClick={handleClearAllFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600">No results found for "{searchQuery}"</p>
              <p className="text-sm text-gray-500 mt-2">Try a different search term or PMID</p>
            </div>
          )}
        </div>
        </>
      ) : viewMode === 'paper-network' && selectedPaperPMID ? (
        <>
          {/* Paper-Specific Network View with Phase 1-2.3 Features */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => {
                setViewMode('network');
                setSelectedPaperPMID(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ← Back to Project Network
            </button>
            <div className="text-sm text-gray-600">
              Exploring network for selected paper
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <MultiColumnNetworkView
              sourceType="article"
              sourceId={selectedPaperPMID}
              projectId={project.project_id}
            />
          </div>

          {/* Help Section for Paper Network */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🎯 Phase 1-2.3 Features Active:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>⭐ Seed Papers:</strong> Yellow star indicators show starting papers</li>
              <li>• <strong>🎨 Edge Visualization:</strong> 6 color-coded edge types (citations, references, similar work, etc.)</li>
              <li>• <strong>📋 Paper List Panel:</strong> Enhanced search, sort, and filter options</li>
              <li>• <strong>✓ Collection Status:</strong> Green nodes = in collection, blue = not in collection</li>
              <li>• <strong>➕ Quick Add:</strong> One-click "Add to Collection" button</li>
              <li>• <strong>🔍 Smart Filters:</strong> Seeds Only, Recent Papers, Highly Cited</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          {/* Project-Level Network Visualization */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <MultiColumnNetworkView
              sourceType="project"
              sourceId={project.project_id}
              projectId={project.project_id}
            />
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 How to use the network view:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Click on nodes</strong> to view paper details in the side panel</li>
              <li>• <strong>Use navigation modes</strong> (Similar Work, Earlier Work, Later Work, Authors) to explore connections</li>
              <li>• <strong>Add papers to collections</strong> by clicking the "Add to Collection" button</li>
              <li>• <strong>Create notes</strong> directly from paper cards</li>
              <li>• <strong>Zoom and pan</strong> the graph to explore the network</li>
              <li>• <strong>Node size</strong> represents citation count (bigger = more citations)</li>
              <li>• <strong>Node color</strong> represents publication year (darker = more recent)</li>
            </ul>
          </div>
        </>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedPMID && (
        <PDFViewer
          pmid={selectedPMID}
          title={selectedTitle || undefined}
          projectId={project.project_id}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedPMID(null);
            setSelectedTitle(null);
          }}
        />
      )}

      {/* Collection Selector Modal */}
      {showCollectionSelector && articleToSave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Save Article to Collection</h3>
                <button
                  onClick={() => {
                    setShowCollectionSelector(false);
                    setArticleToSave(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{articleToSave.title}</p>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Toggle between existing and new collection */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setCreateNewCollection(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    !createNewCollection
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Add to Existing Collection
                </button>
                <button
                  onClick={() => setCreateNewCollection(true)}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    createNewCollection
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Create New Collection
                </button>
              </div>

              {/* Existing Collections List */}
              {!createNewCollection && (
                <div>
                  {loadingCollections ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : collections.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No collections yet</p>
                      <button
                        onClick={() => setCreateNewCollection(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create your first collection
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select a collection:
                      </label>
                      {collections.map((collection) => (
                        <button
                          key={collection.collection_id}
                          onClick={() => setSelectedCollectionId(collection.collection_id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                            selectedCollectionId === collection.collection_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {collection.collection_name}
                              </p>
                              {collection.description && (
                                <p className="text-sm text-gray-600 truncate">
                                  {collection.description}
                                </p>
                              )}
                            </div>
                            <span className="ml-4 text-sm text-gray-500">
                              {collection.article_count || 0} articles
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* New Collection Form */}
              {createNewCollection && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Name:
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Cancer Research Papers"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    A new collection will be created with this article
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCollectionSelector(false);
                  setArticleToSave(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={
                  (!createNewCollection && !selectedCollectionId) ||
                  (createNewCollection && !newCollectionName.trim())
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createNewCollection ? 'Create & Save' : 'Save to Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SpotifyTabSection>
  );
}

export default ExploreTab;
