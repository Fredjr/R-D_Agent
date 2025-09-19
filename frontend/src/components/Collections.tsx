'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, FolderIcon, DocumentTextIcon, EyeIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalCollectionSync, type Collection } from '@/hooks/useGlobalCollectionSync';
import NetworkViewWithSidebar from './NetworkViewWithSidebar';
import MultiColumnNetworkView from './MultiColumnNetworkView';
import CollectionArticles from './CollectionArticles';
import { useResponsive, MobileCollectionGrid, MobileTabs, MobileFAB } from './MobileOptimizations';
import { CollectionLoadingSkeleton, InlineLoading } from './LoadingStates';
import { SourceBadge } from './DataSourceIndicators';

interface CollectionsProps {
  projectId: string;
  onRefresh?: () => void;
}

export default function Collections({ projectId, onRefresh }: CollectionsProps) {
  const { user } = useAuth();

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

  // Initial load and refresh on projectId change
  useEffect(() => {
    if (projectId) {
      console.log('🔄 Collections component refreshing for projectId:', projectId);
      refreshCollections();
    }
  }, [projectId, refreshCollections]);

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

      // Reset form and close modal
      setNewCollection({
        collection_name: '',
        description: '',
        color: '#3B82F6',
        icon: 'folder'
      });
      setShowCreateModal(false);
      
      // Get the created collection data and broadcast the update
      const createdCollection = await response.json();
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
          <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
          <p className="text-gray-600">Organize and curate your research articles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <div
              key={collection.collection_id}
              className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  >
                    <FolderIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {collection.collection_name}
                  </h3>
                </div>
                
                {collection.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>{collection.article_count} articles</span>
                  </div>
                  <span>{new Date(collection.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewArticles(collection)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <ListBulletIcon className="w-4 h-4" />
                    Explore Articles
                  </button>
                  <button
                    onClick={() => handleViewNetwork(collection)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Network View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
