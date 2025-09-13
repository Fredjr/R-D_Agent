'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ScientificModelCard } from '@/components/ScientificModelCard';
import { ExperimentalMethodsCard } from '@/components/ExperimentalMethodsCard';
import { ResultsInterpretationCard } from '@/components/ResultsInterpretationCard';

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
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, user]);

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
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
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
                  <ExperimentalMethodsCard data={experimentalMethods} />
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
      </div>
    </div>
  );
}
