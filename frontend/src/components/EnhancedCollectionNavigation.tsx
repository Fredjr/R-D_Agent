'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderIcon, 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  ArrowPathIcon,
  FunnelIcon,
  SparklesIcon,
  ShareIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalCollectionSync, type Collection } from '@/hooks/useGlobalCollectionSync';
import { useResponsive } from './MobileOptimizations';
import { semanticPaperAnalyzer } from '@/lib/semantic-paper-analysis';
import { citationNetworkIntelligence } from '@/lib/citation-network-intelligence';

interface EnhancedCollectionNavigationProps {
  projectId?: string;
  onCollectionSelect?: (collection: Collection) => void;
  onNetworkView?: (collection: Collection) => void;
  onArticlesList?: (collection: Collection) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list' | 'network' | 'semantic';
type SortMode = 'recent' | 'alphabetical' | 'size' | 'activity' | 'semantic_similarity';
type FilterMode = 'all' | 'recent' | 'large' | 'collaborative' | 'trending';

export default function EnhancedCollectionNavigation({
  projectId,
  onCollectionSelect,
  onNetworkView,
  onArticlesList,
  className = ''
}: EnhancedCollectionNavigationProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { isMobile, isTablet, screenSize } = useResponsive();
  const { collections, isLoading: loading, error, refreshCollections } = useGlobalCollectionSync(projectId || 'default');

  // Enhanced state management
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [semanticAnalysis, setSemanticAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Responsive grid configuration
  const gridConfig = useMemo(() => {
    if (isMobile) return { columns: 1, gap: 'gap-4', padding: 'p-4' };
    if (isTablet) return { columns: 2, gap: 'gap-6', padding: 'p-6' };
    if (screenSize.width < 1400) return { columns: 3, gap: 'gap-6', padding: 'p-6' };
    return { columns: 4, gap: 'gap-8', padding: 'p-8' };
  }, [isMobile, isTablet, screenSize.width]);

  // Enhanced filtering and sorting
  const processedCollections = useMemo(() => {
    let filtered = collections;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(collection =>
        collection.collection_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterMode) {
      case 'recent':
        filtered = filtered.filter(c => {
          const daysSinceCreated = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreated <= 7;
        });
        break;
      case 'large':
        filtered = filtered.filter(c => c.article_count >= 10);
        break;
      case 'collaborative':
        // Would filter based on collaboration indicators
        break;
      case 'trending':
        // Would filter based on activity metrics
        break;
    }

    // Apply sorting
    switch (sortMode) {
      case 'alphabetical':
        filtered.sort((a, b) => a.collection_name.localeCompare(b.collection_name));
        break;
      case 'size':
        filtered.sort((a, b) => b.article_count - a.article_count);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'activity':
        // Would sort by recent activity
        filtered.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
        break;
      case 'semantic_similarity':
        // Would sort by semantic similarity to user's interests
        break;
    }

    return filtered;
  }, [collections, searchQuery, filterMode, sortMode]);

  // Semantic analysis for collections
  const analyzeCollectionSemantics = useCallback(async () => {
    if (collections.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Analyze semantic patterns across collections
      const analysis = await Promise.all(
        collections.slice(0, 10).map(async (collection) => {
          // In a real implementation, would fetch collection papers and analyze
          return {
            collection_id: collection.collection_id,
            semantic_themes: ['AI', 'Biology', 'Medicine'],
            complexity_score: Math.random(),
            interdisciplinary_score: Math.random(),
            novelty_score: Math.random(),
            trending_score: Math.random()
          };
        })
      );

      setSemanticAnalysis(analysis);
    } catch (error) {
      console.error('Semantic analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [collections]);

  // Auto-analyze when collections change
  useEffect(() => {
    if (collections.length > 0 && !semanticAnalysis) {
      analyzeCollectionSemantics();
    }
  }, [collections, semanticAnalysis, analyzeCollectionSemantics]);

  // Handle collection selection
  const handleCollectionSelect = useCallback((collection: Collection) => {
    if (selectedCollections.has(collection.collection_id)) {
      setSelectedCollections(prev => {
        const newSet = new Set(prev);
        newSet.delete(collection.collection_id);
        return newSet;
      });
    } else {
      setSelectedCollections(prev => new Set(prev).add(collection.collection_id));
    }
    onCollectionSelect?.(collection);
  }, [selectedCollections, onCollectionSelect]);

  // Bulk operations
  const handleBulkOperation = useCallback((operation: 'merge' | 'export' | 'analyze' | 'delete') => {
    const selectedIds = Array.from(selectedCollections);
    console.log(`Bulk ${operation} for collections:`, selectedIds);
    
    switch (operation) {
      case 'analyze':
        // Trigger semantic analysis for selected collections
        analyzeCollectionSemantics();
        break;
      case 'merge':
        // Merge selected collections
        alert(`Merge ${selectedIds.length} collections - Feature coming soon!`);
        break;
      case 'export':
        // Export selected collections
        alert(`Export ${selectedIds.length} collections - Feature coming soon!`);
        break;
      case 'delete':
        // Delete selected collections
        if (confirm(`Delete ${selectedIds.length} collections? This cannot be undone.`)) {
          // Implement deletion
        }
        break;
    }
  }, [selectedCollections, analyzeCollectionSemantics]);

  // Render collection card
  const renderCollectionCard = useCallback((collection: Collection) => {
    const isSelected = selectedCollections.has(collection.collection_id);
    const semanticData = semanticAnalysis?.find((s: any) => s.collection_id === collection.collection_id);
    
    return (
      <div
        key={collection.collection_id}
        className={`
          group relative bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer
          hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
          ${isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
          ${isMobile ? 'p-4' : 'p-6'}
        `}
        onClick={() => handleCollectionSelect(collection)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}

        {/* Collection header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-lg">
                {collection.collection_name}
              </h3>
              <p className="text-sm text-gray-500">
                {collection.article_count} articles
              </p>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNetworkView?.(collection);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Network View"
            >
              <ViewColumnsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArticlesList?.(collection);
              }}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Articles List"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Share collection
              }}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Share"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collection description */}
        {collection.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {collection.description}
          </p>
        )}

        {/* Semantic indicators */}
        {semanticData && (
          <div className="space-y-2 mb-4">
            <div className="flex flex-wrap gap-2">
              {semanticData.semantic_themes.map((theme: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {theme}
                </span>
              ))}
            </div>
            
            {/* Semantic scores */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Complexity</span>
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${semanticData.complexity_score * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Novelty</span>
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${semanticData.novelty_score * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collection metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Created {new Date(collection.created_at).toLocaleDateString()}
          </span>
          {collection.updated_at && (
            <span>
              Updated {new Date(collection.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Trending indicator */}
        {semanticData?.trending_score > 0.7 && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
              <SparklesIcon className="w-3 h-3" />
              <span>Trending</span>
            </div>
          </div>
        )}
      </div>
    );
  }, [selectedCollections, semanticAnalysis, isMobile, handleCollectionSelect, onNetworkView, onArticlesList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <FolderIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Failed to load collections</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={refreshCollections}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Enhanced header with controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
            <p className="text-gray-600">
              {processedCollections.length} of {collections.length} collections
              {selectedCollections.size > 0 && ` • ${selectedCollections.size} selected`}
            </p>
          </div>
          
          {/* Bulk actions */}
          {selectedCollections.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkOperation('analyze')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
              <button
                onClick={() => handleBulkOperation('merge')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Merge
              </button>
              <button
                onClick={() => handleBulkOperation('export')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Export
              </button>
            </div>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sort mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="size">Collection Size</option>
                  <option value="activity">Recent Activity</option>
                  <option value="semantic_similarity">Semantic Similarity</option>
                </select>
              </div>

              {/* Filter mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Collections</option>
                  <option value="recent">Recent (7 days)</option>
                  <option value="large">Large (10+ articles)</option>
                  <option value="collaborative">Collaborative</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collections grid/list */}
      {processedCollections.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No collections found' : 'No collections yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search or filters'
              : 'Create your first collection to organize your research'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => router.push('/collections/new')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Collection</span>
            </button>
          )}
        </div>
      ) : (
        <div className={`
          grid gap-${gridConfig.gap.split('-')[1]} ${gridConfig.padding}
          ${viewMode === 'grid' ? `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridConfig.columns}` : 'grid-cols-1'}
        `}>
          {processedCollections.map(renderCollectionCard)}
        </div>
      )}

      {/* Semantic analysis indicator */}
      {isAnalyzing && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span>Analyzing collections...</span>
        </div>
      )}
    </div>
  );
}
