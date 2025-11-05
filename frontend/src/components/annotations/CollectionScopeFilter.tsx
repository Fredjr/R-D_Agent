'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FunnelIcon, FolderIcon, GlobeAltIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface Collection {
  collection_id: string;
  collection_name: string;
  description?: string;
  article_count: number;
  color?: string;
  icon?: string;
}

interface CollectionScopeFilterProps {
  projectId: string;
  selectedScope: string | 'all' | 'unlinked';
  onScopeChange: (scope: string | 'all' | 'unlinked') => void;
  noteCounts?: Record<string, number>;
  className?: string;
}

export default function CollectionScopeFilter({
  projectId,
  selectedScope,
  onScopeChange,
  noteCounts = {},
  className = '',
}: CollectionScopeFilterProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
          headers: {
            'User-ID': user?.email || 'default_user',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const collectionsArray = Array.isArray(data) ? data : (data.collections || []);
          setCollections(collectionsArray);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [projectId, user?.email]);

  // Calculate total notes
  const totalNotes = useMemo(() => {
    return Object.values(noteCounts).reduce((sum, count) => sum + count, 0);
  }, [noteCounts]);

  // Get selected collection name
  const selectedCollectionName = useMemo(() => {
    if (selectedScope === 'all') return 'All Project Notes';
    if (selectedScope === 'unlinked') return 'Unlinked Notes';
    const collection = collections.find(c => c.collection_id === selectedScope);
    return collection?.collection_name || 'Unknown Collection';
  }, [selectedScope, collections]);

  // Get note count for selected scope
  const selectedNoteCount = useMemo(() => {
    if (selectedScope === 'all') return totalNotes;
    if (selectedScope === 'unlinked') return noteCounts['unlinked'] || 0;
    return noteCounts[selectedScope] || 0;
  }, [selectedScope, noteCounts, totalNotes]);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">{selectedCollectionName}</div>
            <div className="text-xs text-gray-500">
              {selectedNoteCount} note{selectedNoteCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading collections...
              </div>
            ) : (
              <div className="py-2">
                {/* All Project Notes */}
                <button
                  onClick={() => {
                    onScopeChange('all');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                    selectedScope === 'all' ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GlobeAltIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">All Project Notes</div>
                      <div className="text-xs text-gray-500">Notes from all collections</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {totalNotes}
                  </div>
                </button>

                {/* Divider */}
                {collections.length > 0 && (
                  <div className="my-2 border-t border-gray-200" />
                )}

                {/* Collections */}
                {collections.map((collection) => {
                  const noteCount = noteCounts[collection.collection_id] || 0;
                  const bgColor = collection.color || '#3B82F6';

                  return (
                    <button
                      key={collection.collection_id}
                      onClick={() => {
                        onScopeChange(collection.collection_id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                        selectedScope === collection.collection_id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: bgColor }}
                        >
                          <FolderIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {collection.collection_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {collection.article_count} article{collection.article_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-blue-600 flex-shrink-0">
                        {noteCount}
                      </div>
                    </button>
                  );
                })}

                {/* Divider */}
                <div className="my-2 border-t border-gray-200" />

                {/* Unlinked Notes */}
                <button
                  onClick={() => {
                    onScopeChange('unlinked');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                    selectedScope === 'unlinked' ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Unlinked Notes</div>
                      <div className="text-xs text-gray-500">Project-wide notes</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    {noteCounts['unlinked'] || 0}
                  </div>
                </button>

                {/* Empty State */}
                {collections.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    <FolderIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p>No collections yet</p>
                    <p className="text-xs mt-1">Create a collection to organize notes</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

