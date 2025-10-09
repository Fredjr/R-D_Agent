/**
 * COLLECTIONS PANEL v1.0
 * 
 * Enhanced collections panel for project workspace
 * Displays collections with article counts and analysis capabilities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FolderIcon, DocumentIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Collection {
  collection_id: string;
  collection_name: string;
  article_count?: number;
  created_at?: string;
  articles?: Article[];
}

interface Article {
  pmid: string;
  title: string;
  authors?: string[];
  journal?: string;
  year?: number;
}

interface CollectionsPanelProps {
  projectId: string;
  userId: string;
  onCollectionSelect?: (collection: Collection) => void;
}

export default function CollectionsPanel({ projectId, userId, onCollectionSelect }: CollectionsPanelProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCollections();
  }, [projectId]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      } else {
        throw new Error('Failed to fetch collections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const handleCollectionClick = (collection: Collection) => {
    onCollectionSelect?.(collection);
    toggleCollection(collection.collection_id);
  };

  if (loading) {
    return (
      <div className="collections-panel" data-testid="collections-panel">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
          </div>
          <div className="p-6">
            <div className="loading-skeleton space-y-4" data-testid="loading-skeleton">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collections-panel" data-testid="collections-panel">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
          </div>
          <div className="p-6">
            <div className="error-display p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="error-display">
              <h4 className="font-medium text-red-900">Failed to Load Collections</h4>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchCollections}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collections-panel" data-testid="collections-panel">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              data-testid="add-collection-button"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Collection
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} in this project
          </p>
        </div>
        
        <div className="p-6">
          {collections.length === 0 ? (
            <div className="empty-state text-center py-8">
              <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first collection to organize research articles
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Collection
              </button>
            </div>
          ) : (
            <div className="collections-list space-y-3" data-testid="collections-list">
              {collections.map((collection) => (
                <div
                  key={collection.collection_id}
                  className="collection-item border border-gray-200 rounded-lg"
                  data-testid={`collection-${collection.collection_id}`}
                >
                  <div
                    className="collection-header p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleCollectionClick(collection)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {expandedCollections.has(collection.collection_id) ? (
                            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                          )}
                          <FolderIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {collection.collection_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {collection.article_count || 0} articles
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {collection.article_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {expandedCollections.has(collection.collection_id) && (
                    <div className="collection-content border-t border-gray-200 p-4 bg-gray-50">
                      {collection.articles && collection.articles.length > 0 ? (
                        <div className="articles-list space-y-2">
                          <h4 className="font-medium text-gray-900 mb-2">Articles</h4>
                          {collection.articles.slice(0, 5).map((article) => (
                            <div
                              key={article.pmid}
                              className="article-item flex items-start space-x-3 p-2 bg-white rounded border"
                              data-testid={`article-${article.pmid}`}
                            >
                              <DocumentIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {article.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                  PMID: {article.pmid}
                                  {article.year && ` • ${article.year}`}
                                  {article.journal && ` • ${article.journal}`}
                                </p>
                              </div>
                            </div>
                          ))}
                          {collection.articles.length > 5 && (
                            <p className="text-sm text-gray-500 text-center py-2">
                              ... and {collection.articles.length - 5} more articles
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="empty-articles text-center py-4">
                          <DocumentIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No articles in this collection</p>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                            Add Articles
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
