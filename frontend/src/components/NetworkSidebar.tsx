'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NetworkNode {
  id: string;
  data: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    node_type: string;
    abstract?: string;
    url?: string;
  };
}

interface NetworkSidebarProps {
  selectedNode: NetworkNode | null;
  onNavigationChange: (mode: 'similar' | 'references' | 'citations' | 'authors') => void;
  onAddToCollection: (pmid: string) => void;
  onClose: () => void;
  currentMode: string;
  projectId: string;
  collections: any[];
}

export default function NetworkSidebar({
  selectedNode,
  onNavigationChange,
  onAddToCollection,
  onClose,
  currentMode,
  projectId,
  collections
}: NetworkSidebarProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [references, setReferences] = useState<any[]>([]);
  const [citations, setCitations] = useState<any[]>([]);
  const [showReferences, setShowReferences] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');

  // Fetch references and citations when node is selected
  useEffect(() => {
    if (selectedNode?.data.pmid) {
      fetchPaperDetails(selectedNode.data.pmid);
    }
  }, [selectedNode]);

  const fetchPaperDetails = async (pmid: string) => {
    setIsLoading(true);
    try {
      // Fetch references
      const referencesResponse = await fetch(
        `/api/proxy/articles/${pmid}/references?limit=10`,
        {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        }
      );
      if (referencesResponse.ok) {
        const referencesData = await referencesResponse.json();
        setReferences(referencesData.references || []);
      }

      // Fetch citations
      const citationsResponse = await fetch(
        `/api/proxy/articles/${pmid}/citations?limit=10`,
        {
          headers: { 'User-ID': user?.user_id || 'default_user' }
        }
      );
      if (citationsResponse.ok) {
        const citationsData = await citationsResponse.json();
        setCitations(citationsData.citations || []);
      }
    } catch (error) {
      console.error('Error fetching paper details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedNode || !selectedCollection) return;

    try {
      const response = await fetch(`/api/proxy/collections/${selectedCollection}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.user_id || 'default_user'
        },
        body: JSON.stringify({
          pmid: selectedNode.data.pmid,
          title: selectedNode.data.title,
          authors: selectedNode.data.authors,
          journal: selectedNode.data.journal,
          year: selectedNode.data.year
        })
      });

      if (response.ok) {
        onAddToCollection(selectedNode.data.pmid);
        // Show success message
        alert('Paper added to collection successfully!');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('Failed to add paper to collection');
    }
  };

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <div className="text-lg mb-2">📄</div>
          <div className="text-sm">Select a paper to view details</div>
        </div>
      </div>
    );
  }

  const { data } = selectedNode;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-start">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">
            {data.node_type === 'base_article' ? 'Base Article' :
             data.node_type === 'reference_article' ? 'Reference' :
             data.node_type === 'citing_article' ? 'Citing Paper' : 'Similar Work'}
          </div>
          <h3 className="font-semibold text-sm text-gray-900 leading-tight">
            {data.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </div>

      {/* Paper Details */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium text-gray-700">Authors:</span>
            <div className="text-gray-600 mt-1">
              {data.authors?.slice(0, 3).join(', ')}
              {data.authors?.length > 3 && ` +${data.authors.length - 3} more`}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Journal:</span>
            <div className="text-gray-600">{data.journal || 'Unknown'}</div>
          </div>

          <div className="flex justify-between">
            <div>
              <span className="font-medium text-gray-700">Year:</span>
              <span className="text-gray-600 ml-1">{data.year || 'Unknown'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Citations:</span>
              <span className="text-gray-600 ml-1">{data.citation_count || 0}</span>
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">PMID:</span>
            <span className="text-gray-600 ml-1 font-mono">{data.pmid}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              View Full Paper
            </a>
          )}

          <button
            onClick={() => onNavigationChange('similar')}
            className={`w-full px-3 py-2 text-xs rounded transition-colors ${
              currentMode === 'similar'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔍 Find Similar Work
          </button>
        </div>
      </div>

      {/* Navigation Options */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-sm text-gray-900 mb-3">Explore Network</h4>

        <div className="space-y-2">
          <button
            onClick={() => onNavigationChange('references')}
            className={`w-full px-3 py-2 text-xs rounded transition-colors flex items-center justify-between ${
              currentMode === 'references'
                ? 'bg-gray-100 text-gray-800 border border-gray-300'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>📚 Earlier Work ({references.length})</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReferences(!showReferences);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {showReferences ? '▼' : '▶'}
            </button>
          </button>

          {showReferences && references.length > 0 && (
            <div className="ml-4 space-y-1 max-h-32 overflow-y-auto">
              {references.slice(0, 5).map((ref, index) => (
                <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <div className="font-medium truncate">{ref.title}</div>
                  <div className="text-gray-500">{ref.year} • {ref.citation_count || 0} citations</div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigationChange('citations')}
            className={`w-full px-3 py-2 text-xs rounded transition-colors flex items-center justify-between ${
              currentMode === 'citations'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>📈 Later Work ({citations.length})</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCitations(!showCitations);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {showCitations ? '▼' : '▶'}
            </button>
          </button>

          {showCitations && citations.length > 0 && (
            <div className="ml-4 space-y-1 max-h-32 overflow-y-auto">
              {citations.slice(0, 5).map((cite, index) => (
                <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <div className="font-medium truncate">{cite.title}</div>
                  <div className="text-gray-500">{cite.year} • {cite.citation_count || 0} citations</div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigationChange('authors')}
            className={`w-full px-3 py-2 text-xs rounded transition-colors ${
              currentMode === 'authors'
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            👥 Author Networks
          </button>
        </div>
      </div>

      {/* Collection Management */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-sm text-gray-900 mb-3">Add to Collection</h4>

        <div className="space-y-2">
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select collection...</option>
            {collections.map((collection) => (
              <option key={collection.collection_id} value={collection.collection_id}>
                {collection.name} ({collection.article_count || 0} papers)
              </option>
            ))}
          </select>

          <button
            onClick={handleAddToCollection}
            disabled={!selectedCollection || isLoading}
            className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : '+ Add Paper'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 text-center">
          <div className="text-xs text-gray-500">Loading paper details...</div>
        </div>
      )}
    </div>
  );
}