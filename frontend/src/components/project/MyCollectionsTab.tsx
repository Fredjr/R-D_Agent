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
import { DeletableCollectionCard } from '@/components/ui/DeletableCard';
import {
  SpotifyTabSection,
  SpotifyTabCard,
  SpotifyTabCardHeader,
  SpotifyTabCardContent,
  SpotifyTabButton,
  SpotifyTabSearchBar,
  SpotifyTabEmptyState,
  SpotifyTabLoading
} from './shared';

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

  // Fetch hypotheses and research questions for showing links on collection cards
  const [hypotheses, setHypotheses] = React.useState<any[]>([]);
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [hypothesesLoading, setHypothesesLoading] = React.useState(false);
  const [questionsLoading, setQuestionsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchHypotheses = async () => {
      if (!projectId || !user?.email) {
        console.log('⚠️ MyCollectionsTab: Skipping hypothesis fetch - missing projectId or user email');
        return;
      }

      console.log('🔄 MyCollectionsTab: Fetching hypotheses for project:', projectId);
      setHypothesesLoading(true);
      try {
        const response = await fetch(`/api/proxy/hypotheses/project/${projectId}`, {
          headers: { 'User-ID': user.email }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ MyCollectionsTab: Hypotheses fetched:', data);
          setHypotheses(data || []);
        } else {
          console.error('❌ MyCollectionsTab: Failed to fetch hypotheses:', response.status);
        }
      } catch (error) {
        console.error('❌ MyCollectionsTab: Error fetching hypotheses:', error);
      } finally {
        setHypothesesLoading(false);
      }
    };

    const fetchQuestions = async () => {
      if (!projectId || !user?.email) {
        console.log('⚠️ MyCollectionsTab: Skipping questions fetch - missing projectId or user email');
        return;
      }

      console.log('🔄 MyCollectionsTab: Fetching research questions for project:', projectId);
      setQuestionsLoading(true);
      try {
        const response = await fetch(`/api/proxy/questions/project/${projectId}`, {
          headers: { 'User-ID': user.email }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ MyCollectionsTab: Research questions fetched:', data);
          setQuestions(data || []);
        } else {
          console.error('❌ MyCollectionsTab: Failed to fetch questions:', response.status);
        }
      } catch (error) {
        console.error('❌ MyCollectionsTab: Error fetching questions:', error);
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchHypotheses();
    fetchQuestions();
  }, [projectId, user?.email]);

  // Create hypothesis map for quick lookup
  const hypothesesMap = React.useMemo(() => {
    const map = hypotheses.reduce((acc, h) => {
      acc[h.hypothesis_id] = h.hypothesis_text;
      return acc;
    }, {} as Record<string, string>);
    return map;
  }, [hypotheses]);

  // Create questions map for quick lookup
  const questionsMap = React.useMemo(() => {
    const map = questions.reduce((acc, q) => {
      acc[q.question_id] = q.question_text;
      return acc;
    }, {} as Record<string, string>);
    return map;
  }, [questions]);

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
    return <SpotifyTabLoading message="Loading collections..." />;
  }

  // Error state
  if (error) {
    return (
      <SpotifyTabCard variant="default">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error loading collections</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <SpotifyTabButton
            variant="danger"
            onClick={() => refreshCollections()}
          >
            Try Again
          </SpotifyTabButton>
        </div>
      </SpotifyTabCard>
    );
  }

  return (
    <SpotifyTabSection>
      {/* Header with Actions */}
      <SpotifyTabCard variant="gradient" gradient="from-green-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-[var(--spotify-white)]">My Collections</h2>
            <p className="text-[var(--spotify-light-text)]">
              {collections.length} collection{collections.length !== 1 ? 's' : ''}
              {filteredCollections.length !== collections.length && ` • ${filteredCollections.length} shown`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {bulkMode && (
              <>
                <SpotifyTabButton
                  variant="ghost"
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedCollections(new Set());
                  }}
                >
                  Cancel
                </SpotifyTabButton>
                <SpotifyTabButton
                  variant="danger"
                  onClick={handleBulkDelete}
                  disabled={selectedCollections.size === 0}
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete ({selectedCollections.size})
                </SpotifyTabButton>
              </>
            )}

            {!bulkMode && (
              <>
                <SpotifyTabButton
                  variant="secondary"
                  onClick={() => setBulkMode(true)}
                >
                  Select
                </SpotifyTabButton>
                <SpotifyTabButton
                  variant="primary"
                  onClick={onCreateCollection}
                >
                  <PlusIcon className="w-4 h-4" />
                  New Collection
                </SpotifyTabButton>
              </>
            )}
          </div>
        </div>
      </SpotifyTabCard>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <SpotifyTabSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search collections..."
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[var(--spotify-dark-gray)] rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-[var(--spotify-medium-gray)] text-[var(--spotify-white)]'
                : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]'
            }`}
            title="Grid view"
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--spotify-medium-gray)] text-[var(--spotify-white)]'
                : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]'
            }`}
            title="List view"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Toggle */}
        <SpotifyTabButton
          variant={showFilters ? 'primary' : 'secondary'}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FunnelIcon className="w-4 h-4" />
          Filters
        </SpotifyTabButton>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <SpotifyTabCard>
          <SpotifyTabCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--spotify-white)]"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="size">Size (Largest First)</option>
                </select>
              </div>

              {/* Size Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">Size</label>
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
                  className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--spotify-white)]"
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (&lt; 5 papers)</option>
                  <option value="medium">Medium (5-19 papers)</option>
                  <option value="large">Large (20+ papers)</option>
                </select>
              </div>
            </div>
          </SpotifyTabCardContent>
        </SpotifyTabCard>
      )}

      {/* Collections Display */}
      {filteredCollections.length === 0 && collections.length === 0 ? (
        // Empty state
        <SpotifyTabEmptyState
          icon={<FolderIcon />}
          title="No collections yet"
          description="Create your first collection to start organizing papers"
          action={onCreateCollection ? {
            label: 'Create Collection',
            onClick: onCreateCollection,
            icon: <PlusIcon className="w-5 h-5" />
          } : undefined}
        />
      ) : filteredCollections.length === 0 ? (
        // No results
        <SpotifyTabEmptyState
          icon={<MagnifyingGlassIcon />}
          title="No collections found"
          description="Try adjusting your search or filters"
          action={{
            label: 'Clear filters',
            onClick: () => {
              setSearchQuery('');
              setSizeFilter('all');
            }
          }}
        />
      ) : viewMode === 'grid' ? (
        // Grid View - Using DeletableCollectionCard
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection, index) => {
            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
            const color = colors[index % colors.length];

            return (
              <DeletableCollectionCard
                key={collection.collection_id}
                title={collection.collection_name}
                description={collection.description}
                articleCount={collection.article_count}
                lastUpdated={new Date(collection.created_at).toLocaleDateString()}
                color={color}
                collectionId={collection.collection_id}
                projectId={projectId}
                linkedHypothesisIds={collection.linked_hypothesis_ids || []}
                hypothesesMap={hypothesesMap}
                linkedQuestionIds={collection.linked_question_ids || []}
                questionsMap={questionsMap}
                onClick={() => handleCollectionClick(collection)}
                onExplore={() => handleCollectionClick(collection)}
                onNetworkView={() => {
                  setSelectedCollection(collection);
                  setShowNetworkView(true);
                }}
                onDelete={() => handleDeleteCollection(collection)}
              />
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
    </SpotifyTabSection>
  );
}

export default MyCollectionsTab;

