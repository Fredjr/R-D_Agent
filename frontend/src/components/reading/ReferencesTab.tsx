'use client';

import React, { useState, useEffect } from 'react';
import { BookOpenIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Reference {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
}

interface ReferencesTabProps {
  pmid: string;
  projectId?: string;
  userId?: string;
  onViewPDF?: (pmid: string) => void;
  onAddToCollection?: (pmid: string) => void;
}

export default function ReferencesTab({
  pmid,
  projectId,
  userId,
  onViewPDF,
  onAddToCollection,
}: ReferencesTabProps) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedPmid, setSelectedPmid] = useState<string | null>(null);

  useEffect(() => {
    fetchReferences();
    if (projectId) {
      fetchCollections();
    }
  }, [pmid, projectId]);

  const fetchReferences = async () => {
    setLoading(true);
    try {
      console.log(`🔍 Fetching references for PMID: ${pmid}`);
      
      // Use the PubMed references API
      const response = await fetch(`/api/proxy/pubmed/references?pmid=${pmid}&limit=50`, {
        headers: {
          'User-ID': userId || 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch references: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Found ${data.references?.length || 0} references`);
      
      setReferences(data.references || []);
    } catch (error) {
      console.error('Error fetching references:', error);
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    if (!projectId || !userId) return;

    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleViewPDF = (refPmid: string) => {
    if (onViewPDF) {
      onViewPDF(refPmid);
    } else {
      // Open in new tab
      window.open(`/project/${projectId}/pdf/${refPmid}`, '_blank');
    }
  };

  const handleAddToCollection = (refPmid: string) => {
    setSelectedPmid(refPmid);
    setShowCollectionModal(true);
  };

  const handleCollectionSelect = async (collectionId: string) => {
    if (!selectedPmid || !projectId || !userId) return;

    try {
      // Add paper to collection
      const response = await fetch(
        `/api/proxy/collections/${collectionId}/articles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': userId,
          },
          body: JSON.stringify({
            pmid: selectedPmid,
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Added PMID ${selectedPmid} to collection ${collectionId}`);
        setShowCollectionModal(false);
        setSelectedPmid(null);
      } else {
        console.error('Failed to add to collection');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
    }
  };

  // Filter references based on search query
  const filteredReferences = references.filter((ref) => {
    const query = searchQuery.toLowerCase();
    return (
      ref.title.toLowerCase().includes(query) ||
      ref.authors.some((author) => author.toLowerCase().includes(query)) ||
      ref.journal.toLowerCase().includes(query) ||
      ref.pmid.includes(query) ||
      ref.year.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading references...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, author, year, PMID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {filteredReferences.length} of {references.length} references
        </p>
      </div>

      {/* References List */}
      <div className="flex-1 overflow-y-auto">
        {filteredReferences.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <BookOpenIcon className="w-12 h-12 mb-2" />
            <p className="text-sm">
              {searchQuery ? 'No references match your search' : 'No references found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReferences.map((ref, index) => (
              <div key={ref.pmid || index} className="p-4 hover:bg-gray-50 transition-colors">
                {/* Paper Title */}
                <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                  {ref.title}
                </h4>

                {/* Authors */}
                <p className="text-xs text-gray-600 mb-1">
                  {ref.authors.slice(0, 3).join(', ')}
                  {ref.authors.length > 3 && ` et al.`}
                </p>

                {/* Journal and Year */}
                <p className="text-xs text-gray-500 mb-2">
                  {ref.journal} • {ref.year}
                </p>

                {/* PMID */}
                <p className="text-xs text-gray-500 mb-3">
                  <span className="font-medium">PMID:</span> {ref.pmid}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewPDF(ref.pmid)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                  >
                    View PDF
                  </button>
                  {projectId && (
                    <button
                      onClick={() => handleAddToCollection(ref.pmid)}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors flex items-center gap-1"
                    >
                      <PlusIcon className="w-3 h-3" />
                      Add to Collection
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Selection Modal */}
      {showCollectionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowCollectionModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add to Collection
            </h3>

            {collections.length === 0 ? (
              <p className="text-sm text-gray-600 mb-4">
                No collections available. Create a collection first.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleCollectionSelect(collection.id)}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {collection.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {collection.article_count || 0} papers
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCollectionModal(false)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

