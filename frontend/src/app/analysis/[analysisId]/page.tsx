'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
}

export default function AnalysisDetailPage() {
  const { analysisId } = useParams();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  let parsedContent;
  try {
    parsedContent = analysis.content ? JSON.parse(analysis.content) : null;
  } catch {
    parsedContent = null;
  }

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

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
          
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
          ) : analysis.processing_status === 'completed' && parsedContent ? (
            <div className="space-y-6">
              {/* Analysis Results */}
              {parsedContent.analysis && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Deep Dive Analysis</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {parsedContent.analysis}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {parsedContent.key_findings && parsedContent.key_findings.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Key Findings</h3>
                  <div className="space-y-2">
                    {parsedContent.key_findings.map((finding: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Methodology */}
              {parsedContent.methodology && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Methodology</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {parsedContent.methodology}
                    </div>
                  </div>
                </div>
              )}

              {/* Limitations */}
              {parsedContent.limitations && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Limitations</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {parsedContent.limitations}
                    </div>
                  </div>
                </div>
              )}
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
