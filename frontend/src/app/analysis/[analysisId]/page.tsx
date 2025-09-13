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
  // New analysis fields
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

  // Robust content parsing with fallbacks
  const parseAnalysisField = (field: any, fieldName: string) => {
    if (!field) return null;

    try {
      // If it's already an object, return it
      if (typeof field === 'object' && field !== null) {
        return field;
      }

      // If it's a string, try to parse as JSON
      if (typeof field === 'string') {
        // Handle empty strings
        if (field.trim() === '') return null;

        // Try JSON parsing
        try {
          return JSON.parse(field);
        } catch {
          // If JSON parsing fails, treat as plain text
          return { summary: field };
        }
      }

      // For any other type, convert to string and wrap in summary
      return { summary: String(field) };
    } catch (e) {
      console.warn(`Error parsing ${fieldName}:`, e);
      return null;
    }
  };

  const scientificModel = parseAnalysisField(analysis.scientific_model_analysis, 'scientific_model_analysis');
  const experimentalMethods = parseAnalysisField(analysis.experimental_methods_analysis, 'experimental_methods_analysis');
  const resultsInterpretation = parseAnalysisField(analysis.results_interpretation_analysis, 'results_interpretation_analysis');

  const hasContent = scientificModel || experimentalMethods || resultsInterpretation;

  // Robust content renderer component
  const RobustContentRenderer = ({ data, color = "gray", fallbackMessage }: {
    data: any,
    color?: string,
    fallbackMessage?: string
  }) => {
    if (!data) return null;

    const colorClasses = {
      purple: { dot: "bg-purple-600", text: "text-purple-700" },
      blue: { dot: "bg-blue-600", text: "text-blue-700" },
      green: { dot: "bg-green-600", text: "text-green-700" },
      gray: { dot: "bg-gray-600", text: "text-gray-700" }
    };

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

    // Helper to safely render any value
    const renderValue = (value: any, key?: string): React.ReactNode => {
      if (value === null || value === undefined) return null;

      if (Array.isArray(value)) {
        if (value.length === 0) return null;
        return (
          <div className="space-y-1">
            {value.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full mt-2 flex-shrink-0`}></div>
                <span className="text-gray-700">{renderValue(item)}</span>
              </div>
            ))}
          </div>
        );
      }

      if (typeof value === 'object') {
        return (
          <div className="space-y-2">
            {Object.entries(value).map(([k, v]) => (
              <div key={k}>
                <span className="font-medium text-gray-800 capitalize">
                  {k.replace(/_/g, ' ')}:
                </span>
                <span className="ml-2 text-gray-700">{renderValue(v)}</span>
              </div>
            ))}
          </div>
        );
      }

      return String(value);
    };

    // Try to render structured content
    try {
      if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data).filter(([_, value]) =>
          value !== null && value !== undefined && value !== ''
        );

        if (entries.length === 0) {
          return <div className="text-gray-500 italic">{fallbackMessage || "No content available"}</div>;
        }

        return (
          <div className="space-y-3">
            {entries.map(([key, value]) => (
              <div key={key}>
                <h4 className="font-medium text-gray-800 mb-2 capitalize">
                  {key.replace(/_/g, ' ')}
                </h4>
                <div className="text-gray-700">
                  {renderValue(value, key)}
                </div>
              </div>
            ))}
          </div>
        );
      }

      // Fallback for non-object data
      return <div className="text-gray-700">{renderValue(data)}</div>;
    } catch (error) {
      console.warn('Error rendering content:', error);
      return (
        <div className="text-gray-500 italic">
          {fallbackMessage || "Content available but could not be displayed properly"}
        </div>
      );
    }
  };

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
          ) : analysis.processing_status === 'completed' && hasContent ? (
            <div className="space-y-6">
              {/* Scientific Model Analysis */}
              {scientificModel && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Scientific Model Analysis</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <RobustContentRenderer
                      data={scientificModel}
                      color="purple"
                      fallbackMessage="Scientific model analysis data available but format not recognized"
                    />
                  </div>
                </div>
              )}

              {/* Experimental Methods Analysis */}
              {experimentalMethods && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Experimental Methods Analysis</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <RobustContentRenderer
                      data={experimentalMethods}
                      color="blue"
                      fallbackMessage="Experimental methods analysis data available but format not recognized"
                    />
                  </div>
                </div>
              )}

              {/* Results Interpretation Analysis */}
              {resultsInterpretation && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Results Interpretation Analysis</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <RobustContentRenderer
                      data={resultsInterpretation}
                      color="green"
                      fallbackMessage="Results interpretation analysis data available but format not recognized"
                    />
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
