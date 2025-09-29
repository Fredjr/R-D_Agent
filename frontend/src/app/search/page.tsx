'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/Navigation';
import { Button } from '@/components/ui/Button';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useWeeklyMixIntegration } from '@/hooks/useWeeklyMixIntegration';

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
    pmid?: string;
    journal?: string;
    year?: number;
    authors?: string[];
    url?: string;
    doi?: string;
  };
}

function SearchPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');

  // Initialize weekly mix integration
  const { trackSearchPageSearch, trackPaperView } = useWeeklyMixIntegration();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    project: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchStats, setSearchStats] = useState<{
    total_found: number;
    query_type: string;
    mesh_enhanced: boolean;
    optimized_query?: string;
  } | null>(null);

  // Modal states for article actions
  const [showAddToProjectModal, setShowAddToProjectModal] = useState(false);
  const [selectedArticleForAction, setSelectedArticleForAction] = useState<SearchResult | null>(null);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectCollections, setProjectCollections] = useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [showCollectionSelection, setShowCollectionSelection] = useState(false);

  const handleSearch = async (searchQuery: string, meshData?: any) => {
    if (!searchQuery.trim()) return;

    console.log('🔍 [Search Page] Starting search:', {
      query: searchQuery,
      hasMeshData: !!meshData,
      meshTerms: meshData?.mesh_terms?.length || 0,
      suggestedQueries: meshData?.suggested_queries?.length || 0
    });

    setIsLoading(true);

    // Track search for weekly mix automation
    trackSearchPageSearch(searchQuery, {
      meshData,
      filters,
      hasAdvancedOptions: !!meshData
    });
    try {
      // Build API URL with parameters
      const params = new URLSearchParams({
        q: searchQuery,
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
      console.log('🔍 [Search Page] API call:', apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Search API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [Search Page] Search results:', {
        total_found: data.total_found,
        query_type: data.query_type,
        mesh_enhanced: data.mesh_enhanced,
        optimized_query: data.optimized_query
      });

      // Convert PubMed articles to SearchResult format
      const searchResults: SearchResult[] = data.articles.map((article: any) => ({
        id: article.pmid,
        type: 'article' as const,
        title: article.title,
        description: article.abstract || 'No abstract available',
        metadata: {
          pmid: article.pmid,
          authors: article.authors,
          journal: article.journal,
          year: article.year,
          url: article.url,
          doi: article.doi,
          date: `${article.year}-01-01` // Approximate date for sorting
        }
      }));

      setResults(searchResults);
      setSearchStats({
        total_found: data.total_found,
        query_type: data.query_type,
        mesh_enhanced: data.mesh_enhanced,
        optimized_query: data.optimized_query
      });

    } catch (error) {
      console.error('❌ [Search Page] Search failed:', error);
      setResults([]);
      setSearchStats(null);
      // Show user-friendly error message
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      // Check for MeSH data from home page
      let meshData = null;
      try {
        const storedMeshData = sessionStorage.getItem('meshSearchData');
        if (storedMeshData) {
          meshData = JSON.parse(storedMeshData);
          // Clear the data after use
          sessionStorage.removeItem('meshSearchData');
          console.log('🔍 [Search Page] Using MeSH data from home page:', meshData);
        }
      } catch (e) {
        console.warn('Failed to parse stored MeSH data');
      }

      handleSearch(query, meshData);
    }
  }, [query]);

  // Load user projects for "Add to Project" functionality
  const loadUserProjects = async () => {
    if (!user?.email) return;

    setIsLoadingProjects(true);
    try {
      const response = await fetch('/api/proxy/projects', {
        headers: {
          'User-ID': user.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Load collections for selected project
  const loadProjectCollections = async (projectId: string) => {
    if (!user?.email) return;

    console.log('🔗 [Search Page] Loading collections for project:', projectId);
    setIsLoadingCollections(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': user.email
        }
      });

      console.log('🔗 [Search Page] Collections API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔗 [Search Page] Collections API response data:', data);

        // Handle different possible response formats
        let collections = [];
        if (Array.isArray(data)) {
          collections = data;
        } else if (data.collections && Array.isArray(data.collections)) {
          collections = data.collections;
        } else if (data.data && Array.isArray(data.data)) {
          collections = data.data;
        }

        console.log('🔗 [Search Page] Parsed collections:', collections.length, collections);
        setProjectCollections(collections);
      } else {
        console.error('🔗 [Search Page] Collections API failed:', response.status);
        setProjectCollections([]);
      }
    } catch (error) {
      console.error('🔗 [Search Page] Failed to load collections:', error);
      setProjectCollections([]);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  // Handle "Add to Project" button click
  const handleAddToProject = (article: SearchResult) => {
    console.log('🔗 [Search Page] Add to Project clicked:', article.metadata.pmid);
    setSelectedArticleForAction(article);
    setShowAddToProjectModal(true);
    loadUserProjects();
  };

  // Handle "Deep Dive" button click
  const handleDeepDive = async (article: SearchResult) => {
    console.log('🔍 [Search Page] Deep Dive clicked:', article.metadata.pmid);

    if (!article.metadata.pmid) {
      alert('❌ No PMID available for deep dive analysis');
      return;
    }

    try {
      // Start deep dive job using the API
      const response = await fetch('/api/proxy/deep-dive-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pmid: article.metadata.pmid,
          title: article.title,
          objective: `Deep dive analysis of: ${article.title}`,
          projectId: null // No specific project for search results
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start deep-dive job. Status ${response.status}. ${errorText}`);
      }

      const jobData = await response.json();
      console.log('🔍 [Search Page] Deep dive job started:', jobData);

      // Navigate to a results page or show success message
      alert(`🔍 Deep dive analysis started for "${article.title}"!\n\nJob ID: ${jobData.job_id}\n\nThe analysis will run in the background. You can check the results later.`);

    } catch (error) {
      console.error('❌ [Search Page] Error starting deep dive:', error);
      alert(`❌ Failed to start deep dive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle project selection - show collections
  const handleProjectSelection = async (projectId: string) => {
    console.log('🔗 [Search Page] Project selected:', projectId);
    setSelectedProjectId(projectId);
    setShowCollectionSelection(true);
    await loadProjectCollections(projectId);
  };

  // Add article to existing collection
  const addArticleToCollection = async (collectionId: string) => {
    if (!selectedArticleForAction || !user?.email || !selectedProjectId) return;

    try {
      console.log('🔗 [Search Page] Adding article to existing collection:', {
        collectionId,
        projectId: selectedProjectId,
        pmid: selectedArticleForAction.metadata.pmid,
        title: selectedArticleForAction.title
      });

      // Add the article to the existing collection
      const articleResponse = await fetch(`/api/proxy/collections/${collectionId}/articles?projectId=${selectedProjectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email,
        },
        body: JSON.stringify({
          article_pmid: selectedArticleForAction.metadata.pmid,
          article_title: selectedArticleForAction.title,
          article_authors: selectedArticleForAction.metadata.authors || [],
          article_journal: selectedArticleForAction.metadata.journal || '',
          article_year: selectedArticleForAction.metadata.year || new Date().getFullYear(),
          source_type: 'search',
          notes: `Added from search: ${selectedArticleForAction.title}`
        })
      });

      if (!articleResponse.ok) {
        throw new Error('Failed to add article to collection');
      }

      console.log('✅ [Search Page] Article added to existing collection successfully');
      alert(`✅ Article added to collection!\n\nThe article has been saved to the selected collection.`);
      resetModal();

    } catch (error) {
      console.error('❌ [Search Page] Error adding article to collection:', error);
      alert(`❌ Failed to add article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add article to new collection in selected project
  const addArticleToNewCollection = async () => {
    if (!selectedArticleForAction || !user?.email || !selectedProjectId) return;

    try {
      console.log('🔗 [Search Page] Creating new collection and adding article:', {
        projectId: selectedProjectId,
        pmid: selectedArticleForAction.metadata.pmid,
        title: selectedArticleForAction.title
      });

      // Create a new collection in the project for this article
      const collectionResponse = await fetch(`/api/proxy/projects/${selectedProjectId}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email,
        },
        body: JSON.stringify({
          collection_name: `Search Result: ${selectedArticleForAction.title.substring(0, 50)}...`,
          description: `Article added from search: ${selectedArticleForAction.title}`,
          color: '#3B82F6',
          icon: 'folder'
        })
      });

      if (!collectionResponse.ok) {
        const errorText = await collectionResponse.text();
        throw new Error(`Failed to create collection: ${errorText}`);
      }

      const collection = await collectionResponse.json();

      // Add the article to the new collection
      await addArticleToCollection(collection.collection_id);

    } catch (error) {
      console.error('❌ [Search Page] Error creating new collection:', error);
      alert(`❌ Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setShowAddToProjectModal(false);
    setShowCollectionSelection(false);
    setSelectedArticleForAction(null);
    setSelectedProjectId(null);
    setProjectCollections([]);
  };

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
            Search millions of biomedical research articles from PubMed
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
              placeholder="Search PubMed articles, PMIDs, DOIs..."
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
              <p className="text-[var(--spotify-light-text)] mt-2">Searching PubMed...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[var(--spotify-light-text)]">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </p>
                {searchStats && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      searchStats.query_type === 'pmid' ? 'bg-blue-500/20 text-blue-400' :
                      searchStats.query_type === 'doi' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {searchStats.query_type.toUpperCase()} Search
                    </span>
                    {searchStats.mesh_enhanced && (
                      <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                        MeSH Enhanced
                      </span>
                    )}
                  </div>
                )}
              </div>

              {searchStats?.optimized_query && searchStats.optimized_query !== query && (
                <div className="bg-[var(--spotify-medium-gray)] rounded-lg p-3 text-sm">
                  <span className="text-[var(--spotify-light-text)]">Optimized query: </span>
                  <code className="text-[var(--spotify-green)]">{searchStats.optimized_query}</code>
                </div>
              )}
              
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)] hover:bg-[var(--spotify-medium-gray)] transition-colors cursor-pointer"
                  onClick={() => {
                    if (result.metadata.url) {
                      window.open(result.metadata.url, '_blank');
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getResultIcon(result.type)}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getResultTypeColor(result.type)}`}>
                            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </span>
                        </div>
                        {result.metadata.pmid && (
                          <span className="text-xs text-[var(--spotify-muted-text)] font-mono">
                            PMID: {result.metadata.pmid}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-2 hover:text-[var(--spotify-green)] transition-colors">
                        {result.title}
                      </h3>

                      <p className="text-[var(--spotify-light-text)] mb-3 line-clamp-3">
                        {result.description}
                      </p>

                      <div className="flex flex-wrap items-center text-sm text-[var(--spotify-muted-text)] gap-4 mb-2">
                        {result.metadata.authors && result.metadata.authors.length > 0 && (
                          <span>
                            By {result.metadata.authors.slice(0, 3).join(', ')}
                            {result.metadata.authors.length > 3 && ` +${result.metadata.authors.length - 3} more`}
                          </span>
                        )}
                        {result.metadata.journal && (
                          <span>{result.metadata.journal}</span>
                        )}
                        {result.metadata.year && (
                          <span>{result.metadata.year}</span>
                        )}
                      </div>

                      {result.metadata.doi && (
                        <div className="text-xs text-[var(--spotify-muted-text)] mb-2">
                          DOI: {result.metadata.doi}
                        </div>
                      )}

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

                      {/* Action buttons for articles */}
                      {result.type === 'article' && result.metadata.pmid && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToProject(result);
                            }}
                            className="px-3 py-1 text-xs bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] rounded hover:bg-[var(--spotify-green)]/30 transition-colors"
                          >
                            Add to Project
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeepDive(result);
                            }}
                            className="px-3 py-1 text-xs bg-[var(--spotify-blue)]/20 text-[var(--spotify-blue)] rounded hover:bg-[var(--spotify-blue)]/30 transition-colors"
                          >
                            Deep Dive
                          </button>
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
              <h3 className="text-lg font-medium text-[var(--spotify-white)] mb-2">No articles found</h3>
              <p className="text-[var(--spotify-light-text)] mb-4">
                No PubMed articles found for "{query}"
              </p>
              <div className="text-sm text-[var(--spotify-muted-text)] space-y-1">
                <p>Try:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Different keywords or synonyms</li>
                  <li>Broader search terms</li>
                  <li>Specific PMID (e.g., 12345678)</li>
                  <li>DOI (e.g., 10.1038/nature12373)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-16 w-16 text-[var(--spotify-muted-text)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--spotify-white)] mb-2">Search PubMed</h3>
              <p className="text-[var(--spotify-light-text)] mb-4">
                Search millions of biomedical research articles
              </p>
              <div className="text-sm text-[var(--spotify-muted-text)] space-y-1">
                <p>You can search by:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keywords and topics</li>
                  <li>Author names</li>
                  <li>PMID numbers</li>
                  <li>DOI identifiers</li>
                  <li>Journal names</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Add to Project Modal */}
        {showAddToProjectModal && selectedArticleForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 w-full max-w-md border border-[var(--spotify-border-gray)]">
              <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-4">
                {showCollectionSelection ? 'Select Collection' : 'Add Article to Project'}
              </h3>

              <div className="mb-4 p-3 bg-[var(--spotify-medium-gray)] rounded-lg">
                <h4 className="font-medium text-[var(--spotify-white)] text-sm mb-1">
                  {selectedArticleForAction.title}
                </h4>
                <p className="text-xs text-[var(--spotify-muted-text)]">
                  PMID: {selectedArticleForAction.metadata.pmid}
                </p>
              </div>

              {!showCollectionSelection ? (
                // Project Selection
                <>
                  {isLoadingProjects ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--spotify-green)] mx-auto"></div>
                      <p className="text-[var(--spotify-light-text)] mt-2 text-sm">Loading projects...</p>
                    </div>
                  ) : userProjects.length > 0 ? (
                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                      {userProjects.map((project) => (
                        <button
                          key={project.project_id}
                          onClick={() => handleProjectSelection(project.project_id)}
                          className="w-full text-left p-3 bg-[var(--spotify-medium-gray)] hover:bg-[var(--spotify-light-gray)] rounded-lg transition-colors"
                        >
                          <div className="font-medium text-[var(--spotify-white)] text-sm">
                            {project.project_name}
                          </div>
                          <div className="text-xs text-[var(--spotify-muted-text)]">
                            {project.project_description || 'No description'}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 mb-4">
                      <p className="text-[var(--spotify-light-text)] text-sm">
                        No projects found. Create a project first.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={resetModal}
                      className="flex-1 px-4 py-2 bg-[var(--spotify-medium-gray)] text-[var(--spotify-white)] rounded hover:bg-[var(--spotify-light-gray)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        window.open('/project/new', '_blank');
                      }}
                      className="flex-1 px-4 py-2 bg-[var(--spotify-green)] text-black rounded hover:bg-[var(--spotify-green)]/80 transition-colors"
                    >
                      New Project
                    </button>
                  </div>
                </>
              ) : (
                // Collection Selection
                <>
                  {isLoadingCollections ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--spotify-green)] mx-auto"></div>
                      <p className="text-[var(--spotify-light-text)] mt-2 text-sm">Loading collections...</p>
                    </div>
                  ) : (
                    <>
                      {projectCollections.length > 0 && (
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                          <p className="text-sm text-[var(--spotify-light-text)] mb-2">Existing Collections:</p>
                          {projectCollections.map((collection) => (
                            <button
                              key={collection.collection_id}
                              onClick={() => addArticleToCollection(collection.collection_id)}
                              className="w-full text-left p-3 bg-[var(--spotify-medium-gray)] hover:bg-[var(--spotify-light-gray)] rounded-lg transition-colors"
                            >
                              <div className="font-medium text-[var(--spotify-white)] text-sm">
                                {collection.collection_name}
                              </div>
                              <div className="text-xs text-[var(--spotify-muted-text)]">
                                {collection.description || 'No description'}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCollectionSelection(false)}
                          className="flex-1 px-4 py-2 bg-[var(--spotify-medium-gray)] text-[var(--spotify-white)] rounded hover:bg-[var(--spotify-light-gray)] transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={addArticleToNewCollection}
                          className="flex-1 px-4 py-2 bg-[var(--spotify-green)] text-black rounded hover:bg-[var(--spotify-green)]/80 transition-colors"
                        >
                          New Collection
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
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
