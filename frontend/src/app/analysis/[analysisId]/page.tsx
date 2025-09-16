'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ScientificModelCard from '@/components/ScientificModelCard';
import ExperimentalMethodsTable from '@/components/ExperimentalMethodsTable';
import ResultsInterpretationCard from '@/components/ResultsInterpretationCard';

interface Analysis {
  analysis_id: string;
  article_title: string;
  article_pmid?: string;
  article_url?: string;
  processing_status: string;
  content?: string;
  created_at: string;
  created_by: string;
  project_id: string;
  // Analysis fields (same structure as molecule dossier)
  scientific_model_analysis?: any;
  experimental_methods_analysis?: any;
  results_interpretation_analysis?: any;
}

export default function AnalysisDetailPage() {
  const { analysisId } = useParams();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Model' | 'Methods' | 'Results'>('Model');

  // Collection management state
  const [collections, setCollections] = useState<any[]>([]);
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);

  useEffect(() => {
    if (!analysisId || !user) return;

    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/proxy/analyses/${analysisId}`, {
          headers: {
            'User-ID': user.email || 'default_user',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }

        const data = await response.json();
        setAnalysis(data);

        // Fetch collections for the project
        if (data.project_id) {
          fetchCollections(data.project_id);
        }
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, user]);

  const fetchCollections = async (projectId: string) => {
    try {
      console.log('Analysis page - Fetching collections for project:', projectId);
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });
      console.log('Analysis page - Collections response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Analysis page - Collections data received:', data);
        setCollections(data.collections || []);
        console.log('Analysis page - Collections set to state:', data.collections || []);
      } else {
        const errorText = await response.text();
        console.error('Analysis page - Collections fetch failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Analysis page - Error fetching collections:', error);
    }
  };

  const handleAddToCollection = () => {
    setShowAddToCollectionModal(true);
    // Refresh collections when modal opens to ensure we have the latest data
    if (analysis?.project_id) {
      fetchCollections(analysis.project_id);
    }
  };

  const handleConfirmAddToCollection = async (collectionId: string) => {
    if (!analysis) return;

    try {
      const response = await fetch(`/api/proxy/collections/${collectionId}/articles?projectId=${analysis.project_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          pmid: analysis.article_pmid || '',
          title: analysis.article_title,
          authors: [],
          journal: '',
          year: new Date().getFullYear(),
          notes: `Added from Deep Dive Analysis: ${analysis.analysis_id}`,
          projectId: analysis.project_id
        }),
      });

      if (response.ok) {
        alert('✅ Article added to collection successfully!');
        setShowAddToCollectionModal(false);
        if (analysis.project_id) {
          fetchCollections(analysis.project_id); // Refresh collections
        }
      } else {
        throw new Error('Failed to add article to collection');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('❌ Failed to add article to collection. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Analysis not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Parse analysis data (same structure as molecule dossier)
  const scientificModel = analysis.scientific_model_analysis;
  const experimentalMethods = analysis.experimental_methods_analysis;
  const resultsInterpretation = analysis.results_interpretation_analysis;

  const hasContent = scientificModel || experimentalMethods || resultsInterpretation;



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{analysis.article_title}</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCollection}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                title="Add this analyzed article to a collection"
              >
                📚 Add to Collection
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            {analysis.article_pmid && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">PMID:</span>
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${analysis.article_pmid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {analysis.article_pmid}
                </a>
              </div>
            )}
            
            {analysis.article_url && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">URL:</span>
                <a
                  href={analysis.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors truncate max-w-xs"
                >
                  {analysis.article_url}
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              analysis.processing_status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : analysis.processing_status === 'processing'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {analysis.processing_status}
            </span>
            <span className="text-sm text-gray-500">
              Created by {analysis.created_by} on {new Date(analysis.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Content - Tabbed Interface (same as molecule dossier) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Deep Dive Analysis</h2>

          {analysis.processing_status === 'pending' ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Pending</h3>
                <p className="text-gray-600">This analysis is queued for processing. Please check back later.</p>
              </div>
            </div>
          ) : analysis.processing_status === 'processing' ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Analysis</h3>
              <p className="text-gray-600">Our AI is analyzing this article. This may take several minutes.</p>
            </div>
          ) : analysis.processing_status === 'completed' && hasContent ? (
            <div>
              {/* Tab Navigation (same as molecule dossier) */}
              <nav className="-mb-px flex gap-4 text-sm mb-6">
                {['Model', 'Methods', 'Results'].map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-2 border-b-2 ${
                      activeTab === tab
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                    onClick={() => setActiveTab(tab as 'Model' | 'Methods' | 'Results')}
                  >
                    {tab}
                  </button>
                ))}
              </nav>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'Model' && scientificModel && (
                  <ScientificModelCard data={scientificModel} />
                )}

                {activeTab === 'Methods' && experimentalMethods && (
                  <ExperimentalMethodsTable data={experimentalMethods} />
                )}

                {activeTab === 'Results' && resultsInterpretation && (
                  <ResultsInterpretationCard data={resultsInterpretation} />
                )}

                {/* Fallback for missing data */}
                {activeTab === 'Model' && !scientificModel && (
                  <div className="text-center py-8 text-gray-500">
                    Scientific model analysis not available
                  </div>
                )}

                {activeTab === 'Methods' && !experimentalMethods && (
                  <div className="text-center py-8 text-gray-500">
                    Experimental methods analysis not available
                  </div>
                )}

                {activeTab === 'Results' && !resultsInterpretation && (
                  <div className="text-center py-8 text-gray-500">
                    Results interpretation analysis not available
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {analysis.processing_status === 'completed'
                  ? 'Analysis completed but no detailed content available.'
                  : 'Analysis content not yet available.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Add to Collection Modal */}
        {showAddToCollectionModal && analysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Collection</h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{analysis.article_title}</p>
                {analysis.article_pmid && (
                  <p className="text-xs text-blue-600 mt-1">PMID: {analysis.article_pmid}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">From Deep Dive Analysis</p>
              </div>

              {(() => {
                console.log('Analysis modal rendering - collections state:', collections);
                console.log('Analysis modal rendering - collections length:', collections.length);
                return collections.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">Select Collection:</label>
                    {collections.map((collection) => (
                      <button
                        key={collection.collection_id}
                        onClick={() => handleConfirmAddToCollection(collection.collection_id)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{collection.collection_name}</div>
                        <div className="text-sm text-gray-600">{collection.description || 'No description'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {collection.article_count || 0} articles
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">No collections found. Create a collection first in your project.</p>
                    <p className="text-xs text-gray-600 mt-1">Debug: Collections array length = {collections.length}</p>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddToCollectionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                {analysis.project_id && (
                  <button
                    onClick={() => window.open(`/project/${analysis.project_id}?tab=collections`, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Manage Collections
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
