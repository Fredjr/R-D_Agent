'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FolderIcon, GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface Collection {
  collection_id: string;
  collection_name: string;
  article_count?: number;
  color?: string;
  icon?: string;
}

interface CollectionSelectorProps {
  projectId: string;
  selectedCollectionId?: string | null;
  onCollectionChange: (collectionId: string | null) => void;
  articlePmid?: string; // If provided, only show collections containing this article
  label?: string;
  showProjectWideOption?: boolean;
  className?: string;
  compact?: boolean;
}

export default function CollectionSelector({
  projectId,
  selectedCollectionId,
  onCollectionChange,
  articlePmid,
  label = 'Link to Collection (optional)',
  showProjectWideOption = true,
  className = '',
  compact = false,
}: CollectionSelectorProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        let url = `/api/proxy/projects/${projectId}/collections`;
        
        // If articlePmid is provided, fetch only collections containing this article
        if (articlePmid) {
          // First fetch all collections, then filter by article
          const response = await fetch(url, {
            headers: {
              'User-ID': user?.email || 'default_user',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const allCollections = Array.isArray(data) ? data : (data.collections || []);
            
            // Fetch articles for each collection to filter
            const collectionsWithArticle: Collection[] = [];
            for (const collection of allCollections) {
              const articlesResponse = await fetch(
                `/api/proxy/collections/${collection.collection_id}/articles`,
                {
                  headers: {
                    'User-ID': user?.email || 'default_user',
                  },
                }
              );
              
              if (articlesResponse.ok) {
                const articlesData = await articlesResponse.json();
                const articles = Array.isArray(articlesData) ? articlesData : (articlesData.articles || []);
                
                // Check if this collection contains the article
                if (articles.some((article: any) => article.pmid === articlePmid || article.article_pmid === articlePmid)) {
                  collectionsWithArticle.push(collection);
                }
              }
            }
            
            setCollections(collectionsWithArticle);
          }
        } else {
          // Fetch all collections
          const response = await fetch(url, {
            headers: {
              'User-ID': user?.email || 'default_user',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const collectionsArray = Array.isArray(data) ? data : (data.collections || []);
            setCollections(collectionsArray);
          }
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [projectId, articlePmid, user?.email]);

  const selectedCollection = collections.find(c => c.collection_id === selectedCollectionId);

  const handleSelect = (collectionId: string | null) => {
    onCollectionChange(collectionId);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedCollectionId ? (
              <>
                <FolderIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate text-gray-900">
                  {selectedCollection?.collection_name || 'Collection'}
                </span>
              </>
            ) : (
              <>
                <GlobeAltIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-600">Project-wide</span>
              </>
            )}
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {showProjectWideOption && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    !selectedCollectionId ? 'bg-blue-50' : ''
                  }`}
                >
                  <GlobeAltIcon className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Project-wide</div>
                    <div className="text-xs text-gray-500">Visible across all collections</div>
                  </div>
                </button>
              )}
              
              {collections.length > 0 && showProjectWideOption && (
                <div className="border-t border-gray-200" />
              )}
              
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Loading collections...</div>
              ) : collections.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {articlePmid ? 'Article not in any collections' : 'No collections yet'}
                </div>
              ) : (
                collections.map((collection) => (
                  <button
                    key={collection.collection_id}
                    type="button"
                    onClick={() => handleSelect(collection.collection_id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                      selectedCollectionId === collection.collection_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <FolderIcon className="w-4 h-4 text-blue-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 truncate">
                        {collection.collection_name}
                      </div>
                      {collection.article_count !== undefined && (
                        <div className="text-xs text-gray-500">
                          {collection.article_count} articles
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full version (non-compact)
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedCollectionId ? (
              <>
                <FolderIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="truncate text-gray-900">
                  {selectedCollection?.collection_name || 'Collection'}
                </span>
              </>
            ) : (
              <>
                <GlobeAltIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <span className="text-gray-600">None (project-wide note)</span>
              </>
            )}
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {showProjectWideOption && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${
                    !selectedCollectionId ? 'bg-blue-50' : ''
                  }`}
                >
                  <GlobeAltIcon className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">None (project-wide note)</div>
                    <div className="text-xs text-gray-500">Visible across all collections</div>
                  </div>
                </button>
              )}
              
              {collections.length > 0 && showProjectWideOption && (
                <div className="border-t border-gray-200" />
              )}
              
              {loading ? (
                <div className="px-4 py-3 text-sm text-gray-500">Loading collections...</div>
              ) : collections.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  {articlePmid ? 'Article not in any collections' : 'No collections yet'}
                </div>
              ) : (
                collections.map((collection) => (
                  <button
                    key={collection.collection_id}
                    type="button"
                    onClick={() => handleSelect(collection.collection_id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${
                      selectedCollectionId === collection.collection_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <FolderIcon className="w-5 h-5 text-blue-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 truncate">
                        {collection.collection_name}
                      </div>
                      {collection.article_count !== undefined && (
                        <div className="text-xs text-gray-500">
                          {collection.article_count} articles
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
      {articlePmid && collections.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          This article is in {collections.length} collection{collections.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

