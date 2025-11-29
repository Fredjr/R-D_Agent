'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, BeakerIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import CollectionArticles from '@/components/CollectionArticles';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';
import { type Collection } from '@/hooks/useGlobalCollectionSync';
import { ErythosCollectionResearchSection } from '../collection/ErythosCollectionResearchSection';

interface ErythosProjectCollectionsTabProps {
  projectId: string;
}

export function ErythosProjectCollectionsTab({ projectId }: ErythosProjectCollectionsTabProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showNetworkView, setShowNetworkView] = useState(false);
  const [showResearchSection, setShowResearchSection] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, [projectId]);

  const fetchCollections = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(Array.isArray(data) ? data : data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowDetailView(true);
    setShowNetworkView(false);
  };

  const handleNetworkView = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowNetworkView(true);
    setShowDetailView(false);
  };

  const handleBack = () => {
    setSelectedCollection(null);
    setShowDetailView(false);
    setShowNetworkView(false);
    fetchCollections(); // Refresh collections after viewing
  };

  const colors = [
    'from-orange-500 to-red-500',
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-teal-500',
    'from-yellow-500 to-orange-500',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show Network View
  if (showNetworkView && selectedCollection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{selectedCollection.collection_name}</h2>
            <p className="text-gray-400 text-sm">🔗 Network View</p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
          <div className="h-[600px]">
            <MultiColumnNetworkView
              sourceType="collection"
              sourceId={selectedCollection.collection_id}
              projectId={projectId}
              onDeepDiveCreated={() => fetchCollections()}
              onArticleSaved={() => fetchCollections()}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show Collection Articles (Detail View with PDF viewer, deep-dive, etc.)
  if (showDetailView && selectedCollection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{selectedCollection.collection_name}</h2>
            <p className="text-gray-400 text-sm">📄 {selectedCollection.article_count || 0} articles</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowResearchSection(!showResearchSection)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
            >
              <BeakerIcon className="w-4 h-4" />
              Research
              {showResearchSection ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setShowDetailView(false);
                setShowNetworkView(true);
              }}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
            >
              🔗 Network View
            </button>
          </div>
        </div>

        {/* Research Questions & Hypotheses Section */}
        {showResearchSection && user?.email && (
          <ErythosCollectionResearchSection
            collectionId={selectedCollection.collection_id}
            collectionName={selectedCollection.collection_name}
            projectId={projectId}
            userId={user.email}
            onRefresh={fetchCollections}
          />
        )}

        <CollectionArticles
          collection={selectedCollection}
          projectId={projectId}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Collections Grid
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">📁 Project Collections</h3>
          <p className="text-sm text-gray-400">Organize your papers into focused collections</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/discover"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            🔍 Go to Discover
          </a>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors">
            ➕ New Collection
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-400 mb-4">No collections yet</p>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
            Create Your First Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection, index) => (
            <div
              key={collection.collection_id}
              className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 hover:border-orange-500/50 transition-all group cursor-pointer"
              onClick={() => handleCollectionClick(collection)}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center mb-3`}>
                <span className="text-2xl">📁</span>
              </div>

              {/* Title */}
              <h4 className="text-white font-medium mb-1 group-hover:text-orange-400 transition-colors">
                {collection.collection_name}
              </h4>

              {/* Description */}
              {collection.description && (
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {collection.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>📄 {collection.article_count || 0} articles</span>
                <span>📝 {collection.note_count || 0} notes</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollectionClick(collection);
                  }}
                  className="flex-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm text-center transition-colors"
                >
                  📄 Explore
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNetworkView(collection);
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  🔗 Network
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

