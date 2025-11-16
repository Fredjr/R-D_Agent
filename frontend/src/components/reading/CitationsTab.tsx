'use client';

import React, { useState, useEffect } from 'react';
import { DocumentDuplicateIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Citation {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
}

interface CitationsTabProps {
  pmid: string;
  projectId?: string;
  userId?: string;
  onViewPDF?: (pmid: string) => void;
  onAddToCollection?: (pmid: string) => void;
}

export default function CitationsTab({
  pmid,
  projectId,
  userId,
  onViewPDF,
  onAddToCollection,
}: CitationsTabProps) {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedPmid, setSelectedPmid] = useState<string | null>(null);

  useEffect(() => {
    fetchCitations();
    if (projectId) {
      fetchCollections();
    }
  }, [pmid, projectId]);

  const fetchCitations = async () => {
    setLoading(true);
    try {
      console.log(`🔍 Fetching citations for PMID: ${pmid}`);
      
      // Use the PubMed citations API
      const response = await fetch(`/api/proxy/pubmed/citations?pmid=${pmid}&limit=50`, {
        headers: {
          'User-ID': userId || 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch citations: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Found ${data.citations?.length || 0} citations`);
      
      setCitations(data.citations || []);
    } catch (error) {
      console.error('Error fetching citations:', error);
      setCitations([]);
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

  const handleViewPDF = (citationPmid: string) => {
    if (onViewPDF) {
      onViewPDF(citationPmid);
    } else {
      window.open(`/project/${projectId}/pdf/${citationPmid}`, '_blank');
    }
  };

  const handleAddToCollection = (citationPmid: string) => {
    setSelectedPmid(citationPmid);
    setShowCollectionModal(true);
  };

  const handleCollectionSelect = async (collectionId: string) => {
    if (!selectedPmid || !projectId || !userId) return;

    try {
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

  const filteredCitations = citations.filter((citation) => {
    const query = searchQuery.toLowerCase();
    return (
      citation.title.toLowerCase().includes(query) ||
      citation.authors.some((author) => author.toLowerCase().includes(query)) ||
      citation.journal.toLowerCase().includes(query) ||
      citation.pmid.includes(query) ||
      citation.year.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading citations...</p>
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
          {filteredCitations.length} of {citations.length} citations
        </p>
      </div>

      {/* Citations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6">
            <DocumentDuplicateIcon className="w-12 h-12 mb-3" />
            {searchQuery ? (
              <p className="text-sm text-center">No citations match your search</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 mb-2">No Citations Yet</p>
                <p className="text-xs text-gray-500 text-center max-w-xs">
                  This paper may be recently published. It can take time for other papers to cite it.
                  Check back later for citation data.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCitations.map((citation, index) => (
              <div key={citation.pmid || index} className="p-4 hover:bg-gray-50 transition-colors">
                {/* Paper Title */}
                <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                  {citation.title}
                </h4>

                {/* Authors */}
                <p className="text-xs text-gray-600 mb-1">
                  {citation.authors.slice(0, 3).join(', ')}
                  {citation.authors.length > 3 && ` et al.`}
                </p>

                {/* Journal and Year */}
                <p className="text-xs text-gray-500 mb-2">
                  {citation.journal} • {citation.year}
                </p>

                {/* PMID */}
                <p className="text-xs text-gray-500 mb-3">
                  <span className="font-medium">PMID:</span> {citation.pmid}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewPDF(citation.pmid)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                  >
                    View PDF
                  </button>
                  {projectId && (
                    <button
                      onClick={() => handleAddToCollection(citation.pmid)}
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

