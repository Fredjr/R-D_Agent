'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusIcon, FolderIcon, DocumentTextIcon, EyeIcon, ListBulletIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalCollectionSync, type Collection } from '@/hooks/useGlobalCollectionSync';
import NetworkViewWithSidebar from './NetworkViewWithSidebar';
import MultiColumnNetworkView from './MultiColumnNetworkView';
import CollectionArticles from './CollectionArticles';
import { useResponsive, MobileCollectionGrid, MobileTabs, MobileFAB } from './MobileOptimizations';
import { CollectionLoadingSkeleton, InlineLoading } from './LoadingStates';
import { SourceBadge } from './DataSourceIndicators';
import { DeletableCollectionCard } from './ui/DeletableCard';
import { useWeeklyMixIntegration } from '@/hooks/useWeeklyMixIntegration';
import FilterPanel, { type FilterSection } from './filters/FilterPanel';
import FilterChips, { type FilterChip } from './filters/FilterChips';

interface CollectionsProps {
  projectId: string;
  onRefresh?: () => void;
  // Smart Actions for Phase 1.2
  onGenerateReview?: (pmid: string, title: string) => void;
  onDeepDive?: (pmid: string, title: string) => void;
  onExploreCluster?: (pmid: string, title: string) => void;
}

export default function Collections({
  projectId,
  onRefresh,
  onGenerateReview,
  onDeepDive,
  onExploreCluster
}: CollectionsProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Initialize weekly mix integration
  const { trackCollectionAdd } = useWeeklyMixIntegration();

  // Use global collection sync instead of local state
  const {
    collections,
    isLoading: loading,
    error,
    refreshCollections,
    broadcastCollectionAdded,
    broadcastCollectionUpdated,
    broadcastCollectionDeleted
  } = useGlobalCollectionSync(projectId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showNetworkView, setShowNetworkView] = useState(false);
  const [showArticlesList, setShowArticlesList] = useState(false);

  const [newCollection, setNewCollection] = useState({
    collection_name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder'
  });

  // Week 24: Fetch hypotheses for showing links on collection cards
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [hypothesesLoading, setHypothesesLoading] = useState(false);

  // 🔍 Week 6: Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    sortBy: 'recent',
    sizeFilter: 'all',
    dateFilter: 'all'
  });

  // Initial load and refresh on projectId change
  useEffect(() => {
    if (projectId) {
      console.log('🔄 Collections component refreshing for projectId:', projectId);
      refreshCollections();
    }
  }, [projectId, refreshCollections]);

  // Week 24: Fetch hypotheses for the project
  useEffect(() => {
    const fetchHypotheses = async () => {
      if (!projectId || !user?.email) {
        console.log('⚠️ Skipping hypothesis fetch - missing projectId or user email:', { projectId, userEmail: user?.email });
        return;
      }

      console.log('🔄 Fetching hypotheses for project:', projectId);
      setHypothesesLoading(true);
      try {
        const response = await fetch(`/api/proxy/hypotheses/project/${projectId}`, {
          headers: { 'User-ID': user.email }
        });

        if (response.ok) {
          const data = await response.json();
          setHypotheses(data);
          console.log('✅ Fetched hypotheses for collections:', {
            count: data.length,
            hypotheses: data.map((h: any) => ({ id: h.hypothesis_id, text: h.hypothesis_text }))
          });
        } else {
          console.error('❌ Failed to fetch hypotheses:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Error fetching hypotheses:', error);
      } finally {
        setHypothesesLoading(false);
      }
    };

    fetchHypotheses();
  }, [projectId, user?.email]);

  // Week 24: Create hypothesis map for quick lookup
  const hypothesesMap = useMemo(() => {
    console.log('🔬 Creating hypotheses map from:', hypotheses);
    const map = hypotheses.reduce((acc, h) => {
      acc[h.hypothesis_id] = h.hypothesis_text;
      return acc;
    }, {} as Record<string, string>);
    console.log('🔬 Hypotheses map created:', {
      hypothesesCount: hypotheses.length,
      mapSize: Object.keys(map).length,
      mapKeys: Object.keys(map),
      map
    });
    return map;
  }, [hypotheses]);

  // 🔧 Handle URL parameters to auto-open collection views
  useEffect(() => {
    const collectionId = searchParams.get('collection');
    const view = searchParams.get('view');

    if (collectionId && collections.length > 0) {
      // Find the collection by ID
      const collection = collections.find(c => c.collection_id === collectionId);

      if (collection) {
        console.log('📍 Auto-opening collection from URL:', { collectionId, view, collection });
        setSelectedCollection(collection);

        if (view === 'articles') {
          setShowArticlesList(true);
          setShowNetworkView(false);
        } else if (view === 'network') {
          setShowNetworkView(true);
          setShowArticlesList(false);
        }
      }
    }
  }, [searchParams, collections]);

  // Debug logging for collections state
  useEffect(() => {
    console.log('🔍 Collections component state:', {
      projectId,
      collectionsCount: collections.length,
      collections: collections,
      loading,
      error
    });
  }, [collections, loading, error, projectId]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCollection.collection_name.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify(newCollection),
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      // Get the created collection data
      const createdCollection = await response.json();

      // Track collection creation for weekly mix
      trackCollectionAdd('', newCollection.collection_name, createdCollection.collection_id || '', 'collection_management');

      // Reset form and close modal
      setNewCollection({
        collection_name: '',
        description: '',
        color: '#3B82F6',
        icon: 'folder'
      });
      setShowCreateModal(false);

      // Broadcast the update
      broadcastCollectionAdded({
        ...createdCollection,
        project_id: projectId
      });
      onRefresh?.();

      alert('✅ Collection created successfully!');
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('❌ Failed to create collection. Please try again.');
    }
  };

  const handleViewNetwork = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowNetworkView(true);
  };

  const handleViewArticles = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowArticlesList(true);
  };

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // 🔍 Week 6: Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = [...collections];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.collection_name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }

    // Apply size filter
    if (filters.sizeFilter === 'small') {
      filtered = filtered.filter(c => c.article_count < 5);
    } else if (filters.sizeFilter === 'medium') {
      filtered = filtered.filter(c => c.article_count >= 5 && c.article_count < 20);
    } else if (filters.sizeFilter === 'large') {
      filtered = filtered.filter(c => c.article_count >= 20);
    }

    // Apply date filter
    if (filters.dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(c => new Date(c.created_at) >= today);
    } else if (filters.dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(c => new Date(c.created_at) >= weekAgo);
    } else if (filters.dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(c => new Date(c.created_at) >= monthAgo);
    }

    // Apply sorting
    if (filters.sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filters.sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.collection_name.localeCompare(b.collection_name));
    } else if (filters.sortBy === 'size') {
      filtered.sort((a, b) => b.article_count - a.article_count);
    } else if (filters.sortBy === 'updated') {
      filtered.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    }

    return filtered;
  }, [collections, searchQuery, filters]);

  // 🔍 Week 6: Filter configuration
  const filterSections: FilterSection[] = [
    {
      title: 'Collections',
      filters: [
        {
          id: 'sortBy',
          label: 'Sort By',
          type: 'select',
          value: filters.sortBy,
          options: [
            { value: 'recent', label: 'Most Recent' },
            { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
            { value: 'size', label: 'Size (Largest First)' },
            { value: 'updated', label: 'Recently Updated' }
          ]
        },
        {
          id: 'sizeFilter',
          label: 'Collection Size',
          type: 'select',
          value: filters.sizeFilter,
          options: [
            { value: 'all', label: 'All Sizes' },
            { value: 'small', label: 'Small (< 5 papers)' },
            { value: 'medium', label: 'Medium (5-19 papers)' },
            { value: 'large', label: 'Large (20+ papers)' }
          ]
        },
        {
          id: 'dateFilter',
          label: 'Created',
          type: 'select',
          value: filters.dateFilter,
          options: [
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' }
          ]
        }
      ]
    }
  ];

  // 🔍 Week 6: Active filter chips
  const activeFilterChips: FilterChip[] = [];
  if (filters.sortBy !== 'recent') {
    const sortOption = filterSections[0].filters[0].options?.find(o => o.value === filters.sortBy);
    activeFilterChips.push({
      id: 'sortBy',
      label: 'Sort',
      value: filters.sortBy,
      displayValue: sortOption?.label
    });
  }
  if (filters.sizeFilter !== 'all') {
    const sizeOption = filterSections[0].filters[1].options?.find(o => o.value === filters.sizeFilter);
    activeFilterChips.push({
      id: 'sizeFilter',
      label: 'Size',
      value: filters.sizeFilter,
      displayValue: sizeOption?.label
    });
  }
  if (filters.dateFilter !== 'all') {
    const dateOption = filterSections[0].filters[2].options?.find(o => o.value === filters.dateFilter);
    activeFilterChips.push({
      id: 'dateFilter',
      label: 'Created',
      value: filters.dateFilter,
      displayValue: dateOption?.label
    });
  }

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      sortBy: 'recent',
      sizeFilter: 'all',
      dateFilter: 'all'
    });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshCollections}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showNetworkView && selectedCollection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNetworkView(false)}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to Collections
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#3B82F6' }}
              ></div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCollection.collection_name} - Network View
              </h2>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <p className="text-gray-600">
              Explore citation relationships between articles in this collection.
              Click on nodes to see article details and discover related research.
            </p>
          </div>
          <div className="h-[600px]">
            <MultiColumnNetworkView
              sourceType="collection"
              sourceId={selectedCollection.collection_id}
              projectId={projectId}
              onDeepDiveCreated={onRefresh}
              onArticleSaved={onRefresh}
              onGenerateReview={onGenerateReview}
              onDeepDive={onDeepDive}
              onExploreCluster={onExploreCluster}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showArticlesList && selectedCollection) {
    return (
      <CollectionArticles
        collection={selectedCollection}
        projectId={projectId}
        onBack={() => setShowArticlesList(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'white' }}>Collections</h2>
          <p style={{ color: '#D1D5DB' }}>Organize and manage your research article collections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {/* 🔍 Week 6: Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search collections by name or description..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          data-testid="collections-search-input"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
      </div>

      {/* 🔍 Week 6: Filter Panel */}
      <FilterPanel
        sections={filterSections}
        activeFilters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* 🔍 Week 6: Active Filter Chips */}
      {(activeFilterChips.length > 0 || searchQuery) && (
        <FilterChips
          chips={[
            ...activeFilterChips,
            ...(searchQuery ? [{
              id: 'search',
              label: 'Search',
              value: searchQuery,
              displayValue: `"${searchQuery}"`
            }] : [])
          ]}
          onRemove={(chipId) => {
            if (chipId === 'search') {
              setSearchQuery('');
            } else {
              handleFilterChange(chipId, chipId === 'sortBy' ? 'recent' : 'all');
            }
          }}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Collections Grid */}
      {filteredCollections.length === 0 && collections.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-500 mb-4">Create your first collection to start organizing articles</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Collection
          </button>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections match your filters</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={handleClearAllFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              Showing {filteredCollections.length} of {collections.length} collections
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection, index) => (
            <DeletableCollectionCard
              key={collection.collection_id}
              title={collection.collection_name}
              description={collection.description}
              articleCount={collection.article_count}
              lastUpdated={new Date(collection.created_at).toLocaleDateString()}
              color={colors[index % colors.length]}
              collectionId={collection.collection_id}
              projectId={projectId}
              linkedHypothesisIds={collection.linked_hypothesis_ids || []}
              hypothesesMap={hypothesesMap}
              onClick={() => handleViewArticles(collection)}
              onExplore={() => handleViewArticles(collection)}
              onNetworkView={() => handleViewNetwork(collection)}
              onDelete={() => {
                // Refresh collections after deletion
                refreshCollections();
                broadcastCollectionDeleted(collection.collection_id);
                onRefresh?.();
              }}
            />
          ))}
          </div>
        </>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Collection</h3>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newCollection.collection_name}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, collection_name: e.target.value }))}
                  placeholder="Enter collection name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this collection..."
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCollection(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCollection.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCollection({
                      collection_name: '',
                      description: '',
                      color: '#3B82F6',
                      icon: 'folder'
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
