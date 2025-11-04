'use client';

import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalCollectionSync, type Collection } from '@/hooks/useGlobalCollectionSync';
import CollectionArticles from '@/components/CollectionArticles';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';

interface MyCollectionsTabProps {
  projectId: string;
  onRefresh?: () => void;
  onCreateCollection?: () => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'recent' | 'name' | 'size';
type SizeFilter = 'all' | 'small' | 'medium' | 'large';

export function MyCollectionsTab({ projectId, onRefresh, onCreateCollection }: MyCollectionsTabProps) {
  const { user } = useAuth();
  const {
    collections,
    isLoading,
    error,
    refreshCollections,
    broadcastCollectionDeleted
  } = useGlobalCollectionSync(projectId);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showNetworkView, setShowNetworkView] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk operations
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = [...collections];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.collection_name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }

    // Size filter
    if (sizeFilter === 'small') {
      filtered = filtered.filter(c => c.article_count < 5);
    } else if (sizeFilter === 'medium') {
      filtered = filtered.filter(c => c.article_count >= 5 && c.article_count < 20);
    } else if (sizeFilter === 'large') {
      filtered = filtered.filter(c => c.article_count >= 20);
    }

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.collection_name.localeCompare(b.collection_name));
    } else if (sortBy === 'size') {
      filtered.sort((a, b) => (b.article_count || 0) - (a.article_count || 0));
    } else {
      // recent (default)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [collections, searchQuery, sortBy, sizeFilter]);

  // Handle collection selection
  const handleCollectionClick = (collection: Collection) => {
    if (bulkMode) {
      toggleCollectionSelection(collection.collection_id);
    } else {
      setSelectedCollection(collection);
      setShowDetailView(true);
    }
  };

  const toggleCollectionSelection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedCollections.size === 0) return;

    const confirmed = confirm(`Delete ${selectedCollections.size} collection(s)?`);
    if (!confirmed) return;

    try {
      for (const collectionId of selectedCollections) {
        await fetch(`/api/proxy/collections/${collectionId}?projectId=${projectId}`, {
          method: 'DELETE',
          headers: {
            'User-ID': user?.email || ''
          }
        });
        broadcastCollectionDeleted(collectionId);
      }

      setSelectedCollections(new Set());
      setBulkMode(false);
      await refreshCollections();
      onRefresh?.();
      alert('✅ Collections deleted successfully!');
    } catch (error) {
      console.error('Error deleting collections:', error);
      alert('❌ Failed to delete collections.');
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!collectionToDelete) return;

    try {
      await fetch(`/api/proxy/collections/${collectionToDelete.collection_id}?projectId=${projectId}`, {
        method: 'DELETE',
        headers: {
          'User-ID': user?.email || ''
        }
      });

      broadcastCollectionDeleted(collectionToDelete.collection_id);
      await refreshCollections();
      onRefresh?.();
      setShowDeleteModal(false);
      setCollectionToDelete(null);
      alert('✅ Collection deleted successfully!');
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('❌ Failed to delete collection.');
    }
  };

  // Show network view
  if (showNetworkView && selectedCollection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowNetworkView(false);
              setSelectedCollection(null);
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedCollection.collection_name}</h2>
            <p className="text-gray-600">Network View</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-[600px]">
            <MultiColumnNetworkView
              sourceType="collection"
              sourceId={selectedCollection.collection_id}
              projectId={projectId}
              onDeepDiveCreated={onRefresh}
              onArticleSaved={onRefresh}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show detail view
  if (showDetailView && selectedCollection) {
    return (
      <CollectionArticles
        collection={selectedCollection}
        projectId={projectId}
        onBack={() => {
          setShowDetailView(false);
          setSelectedCollection(null);
        }}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error loading collections</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => refreshCollections()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Collections</h2>
          <p className="text-gray-600">
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
            {filteredCollections.length !== collections.length && ` • ${filteredCollections.length} shown`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {bulkMode && (
            <>
              <button
                onClick={() => {
                  setBulkMode(false);
                  setSelectedCollections(new Set());
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedCollections.size === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete ({selectedCollections.size})
              </button>
            </>
          )}

          {!bulkMode && (
            <>
              <button
                onClick={() => setBulkMode(true)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Select
              </button>
              <button
                onClick={onCreateCollection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                New Collection
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-600'}`}
            title="Grid view"
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'}`}
            title="List view"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">Size (Largest First)</option>
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (&lt; 5 papers)</option>
                <option value="medium">Medium (5-19 papers)</option>
                <option value="large">Large (20+ papers)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Collections Display */}
      {filteredCollections.length === 0 && collections.length === 0 ? (
        // Empty state
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-600 mb-6">Create your first collection to start organizing papers</p>
          <button
            onClick={onCreateCollection}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Collection
          </button>
        </div>
      ) : filteredCollections.length === 0 ? (
        // No results
        <div className="text-center py-16">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSizeFilter('all');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection, index) => {
            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
            const color = colors[index % colors.length];
            const isSelected = selectedCollections.has(collection.collection_id);

            return (
              <div
                key={collection.collection_id}
                onClick={() => handleCollectionClick(collection)}
                className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Collection Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <FolderIcon className="w-6 h-6 text-white" />
                    </div>
                    {bulkMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCollectionSelection(collection.collection_id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {collection.collection_name}
                  </h3>

                  {collection.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {collection.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {collection.article_count || 0} paper{collection.article_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-500">
                      {new Date(collection.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Collection Card Actions */}
                {!bulkMode && (
                  <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCollection(collection);
                        setShowNetworkView(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                      Network
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {filteredCollections.map((collection, index) => {
            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
            const color = colors[index % colors.length];
            const isSelected = selectedCollections.has(collection.collection_id);

            return (
              <div
                key={collection.collection_id}
                onClick={() => handleCollectionClick(collection)}
                className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCollectionSelection(collection.collection_id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <FolderIcon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {collection.collection_name}
                    </h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 truncate">
                        {collection.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{collection.article_count || 0}</p>
                      <p className="text-xs text-gray-500">papers</p>
                    </div>

                    {!bulkMode && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCollection(collection);
                            setShowNetworkView(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View network"
                        >
                          <ChartBarIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(collection);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete collection"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && collectionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete Collection</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCollectionToDelete(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{collectionToDelete.collection_name}</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ This will remove <strong>{collectionToDelete.article_count || 0} paper(s)</strong> from this collection.
                  The papers themselves will not be deleted from your project.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCollectionToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCollectionsTab;

