'use client';

import { useState, useEffect } from 'react';
import { FolderIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Step6ExploreOrganizeProps {
  seedPaper: { pmid: string; title: string } | null;
  projectId: string;
  onComplete: (collectionCreated: boolean) => void;
  onBack: () => void;
}

interface RelatedPaper {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  abstract?: string;
}

export default function Step6ExploreOrganize({
  seedPaper,
  projectId,
  onComplete,
  onBack,
}: Step6ExploreOrganizeProps) {
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([]);
  const [selectedPmids, setSelectedPmids] = useState<Set<string>>(new Set());
  const [collectionName, setCollectionName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  // Fetch related papers on mount
  useEffect(() => {
    if (seedPaper) {
      fetchRelatedPapers();
      // Pre-fill collection name
      setCollectionName(`${seedPaper.title.substring(0, 30)}... Collection`);
    }
  }, [seedPaper]);

  const fetchRelatedPapers = async () => {
    if (!seedPaper) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching related papers for PMID:', seedPaper.pmid);

      const response = await fetch(`/api/proxy/articles/${seedPaper.pmid}/citations?limit=15`, {
        headers: {
          'User-ID': 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch related papers');
      }

      const data = await response.json();
      console.log('📄 Related papers:', data);

      if (data.citations && data.citations.length > 0) {
        setRelatedPapers(data.citations);
        setError(null);
      } else {
        setRelatedPapers([]);
        setError('No related papers found. You can skip this step.');
      }
    } catch (err) {
      console.error('❌ Error fetching related papers:', err);
      setError('Failed to load related papers. You can skip this step.');
      setRelatedPapers([]);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const handleTogglePaper = (pmid: string) => {
    const newSelected = new Set(selectedPmids);
    if (newSelected.has(pmid)) {
      newSelected.delete(pmid);
    } else {
      newSelected.add(pmid);
    }
    setSelectedPmids(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPmids.size === relatedPapers.length) {
      setSelectedPmids(new Set());
    } else {
      setSelectedPmids(new Set(relatedPapers.map(p => p.pmid)));
    }
  };

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) {
      setError('Please enter a collection name');
      return;
    }

    if (selectedPmids.size === 0) {
      setError('Please select at least one paper');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📁 Creating collection:', collectionName);

      // Create collection
      const collectionResponse = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': 'default_user',
        },
        body: JSON.stringify({
          collection_name: collectionName,
          description: `Collection created during onboarding with ${selectedPmids.size} papers`,
        }),
      });

      if (!collectionResponse.ok) {
        throw new Error('Failed to create collection');
      }

      const collection = await collectionResponse.json();
      console.log('✅ Collection created:', collection);

      // Add papers to collection
      const addPapersPromises = Array.from(selectedPmids).map(pmid =>
        fetch(`/api/proxy/projects/${projectId}/collections/${collection.collection_id}/articles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': 'default_user',
          },
          body: JSON.stringify({ pmid }),
        })
      );

      await Promise.all(addPapersPromises);
      console.log('✅ Papers added to collection');

      // Complete step
      onComplete(true);
    } catch (err: any) {
      console.error('❌ Error creating collection:', err);
      setError(err.message || 'Failed to create collection. Please try again.');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <FolderIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Explore & Organize
        </h2>
        <p className="text-gray-600">
          Discover related papers and create your first collection
        </p>
      </div>

      {/* Seed Paper Info */}
      {seedPaper && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-1">Your Seed Paper:</p>
          <p className="text-sm text-blue-700">{seedPaper.title}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !hasLoaded && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Related Papers */}
      {!loading && hasLoaded && relatedPapers.length > 0 && (
        <div className="space-y-4">
          {/* Collection Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Name
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {collectionName.length}/100 characters
            </p>
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Related Papers ({relatedPapers.length})
            </h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {selectedPmids.size === relatedPapers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Selection Counter */}
          {selectedPmids.size > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700 font-medium">
                ✓ {selectedPmids.size} paper{selectedPmids.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Paper List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {relatedPapers.map((paper) => (
              <div
                key={paper.pmid}
                onClick={() => handleTogglePaper(paper.pmid)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPmids.has(paper.pmid)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedPmids.has(paper.pmid)}
                    onChange={() => handleTogglePaper(paper.pmid)}
                    className="mt-1 w-4 h-4 text-purple-600 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {paper.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {paper.authors.slice(0, 3).join(', ')}
                      {paper.authors.length > 3 && ` et al.`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {paper.journal} • {paper.year} • PMID: {paper.pmid}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Papers Message */}
      {!loading && hasLoaded && relatedPapers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No related papers found.</p>
          <p className="text-sm text-gray-400">You can skip this step and add papers later.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
        >
          ← Back
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Skip for Now
          </button>
          <button
            onClick={handleCreateCollection}
            disabled={loading || !collectionName.trim() || selectedPmids.size === 0}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creating...' : `Create Collection (${selectedPmids.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

