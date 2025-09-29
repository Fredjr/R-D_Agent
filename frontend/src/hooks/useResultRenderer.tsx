/**
 * React hook for database-first result rendering
 * Fetches and renders results from database without re-processing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ReportResult {
  report_id: string;
  title: string;
  objective: string;
  project_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  content: any;
  summary?: string;
  status: string;
  article_count?: number;
  processing_time_seconds?: number;
}

export interface DeepDiveResult {
  analysis_id: string;
  article_pmid: string;
  article_title: string;
  project_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  processing_status: string;
  scientific_model_analysis?: any;
  experimental_methods_analysis?: any;
  results_interpretation_analysis?: any;
}

export interface UseResultRendererReturn {
  // Report functions
  getReport: (reportId: string) => Promise<ReportResult | null>;
  getProjectReports: (projectId: string) => Promise<ReportResult[]>;
  renderReport: (report: ReportResult) => React.JSX.Element | null;

  // Deep dive functions
  getDeepDive: (analysisId: string) => Promise<DeepDiveResult | null>;
  getProjectDeepDives: (projectId: string) => Promise<DeepDiveResult[]>;
  renderDeepDive: (analysis: DeepDiveResult) => React.JSX.Element | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export function useResultRenderer(): UseResultRendererReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserEmail = useCallback(() => {
    return user?.email;
  }, [user]);

  const getReport = useCallback(async (reportId: string): Promise<ReportResult | null> => {
    const userEmail = getUserEmail();
    if (!userEmail) return null;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/proxy/generate-review-analyses/${reportId}`, {
        headers: {
          'User-ID': userEmail
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found');
        }
        throw new Error('Failed to fetch report');
      }

      const report = await response.json();
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch report';
      setError(errorMessage);
      console.error('Failed to get report:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUserEmail]);

  const getProjectReports = useCallback(async (projectId: string): Promise<ReportResult[]> => {
    const userEmail = getUserEmail();
    if (!userEmail) return [];

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/proxy/projects/${projectId}/generate-review-analyses`, {
        headers: {
          'User-ID': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project reports');
      }

      const reports = await response.json();
      return Array.isArray(reports) ? reports : [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project reports';
      setError(errorMessage);
      console.error('Failed to get project reports:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getUserEmail]);

  const getDeepDive = useCallback(async (analysisId: string): Promise<DeepDiveResult | null> => {
    const userEmail = getUserEmail();
    if (!userEmail) return null;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/proxy/deep-dive-analyses/${analysisId}`, {
        headers: {
          'User-ID': userEmail
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Deep dive analysis not found');
        }
        throw new Error('Failed to fetch deep dive analysis');
      }

      const analysis = await response.json();
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deep dive analysis';
      setError(errorMessage);
      console.error('Failed to get deep dive:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUserEmail]);

  const getProjectDeepDives = useCallback(async (projectId: string): Promise<DeepDiveResult[]> => {
    const userEmail = getUserEmail();
    if (!userEmail) return [];

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/proxy/projects/${projectId}/deep-dive-analyses`, {
        headers: {
          'User-ID': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project deep dives');
      }

      const analyses = await response.json();
      return Array.isArray(analyses) ? analyses : [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project deep dives';
      setError(errorMessage);
      console.error('Failed to get project deep dives:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getUserEmail]);

  const renderReport = useCallback((report: ReportResult): React.JSX.Element | null => {
    if (!report.content) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="text-gray-600 mt-2">{report.objective}</p>
          
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
              {report.article_count && (
                <span>Articles: {report.article_count}</span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                report.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {report.status}
              </span>
            </div>
            
            {report.processing_time_seconds && (
              <span>Processing time: {Math.round(report.processing_time_seconds)}s</span>
            )}
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700">{report.summary}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          {typeof report.content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: report.content }} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {JSON.stringify(report.content, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }, []);

  const renderDeepDive = useCallback((analysis: DeepDiveResult): React.JSX.Element | null => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{analysis.article_title}</h1>
          <p className="text-gray-600 mt-2">PMID: {analysis.article_pmid}</p>
          
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>Created: {new Date(analysis.created_at).toLocaleDateString()}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              analysis.processing_status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {analysis.processing_status}
            </span>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="space-y-8">
          {/* Scientific Model Analysis */}
          {analysis.scientific_model_analysis && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Scientific Model Analysis
              </h2>
              <div className="prose prose-sm max-w-none">
                {typeof analysis.scientific_model_analysis === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: analysis.scientific_model_analysis }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {JSON.stringify(analysis.scientific_model_analysis, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Experimental Methods Analysis */}
          {analysis.experimental_methods_analysis && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Experimental Methods Analysis
              </h2>
              <div className="prose prose-sm max-w-none">
                {typeof analysis.experimental_methods_analysis === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: analysis.experimental_methods_analysis }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {JSON.stringify(analysis.experimental_methods_analysis, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Results Interpretation Analysis */}
          {analysis.results_interpretation_analysis && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Results Interpretation Analysis
              </h2>
              <div className="prose prose-sm max-w-none">
                {typeof analysis.results_interpretation_analysis === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: analysis.results_interpretation_analysis }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {JSON.stringify(analysis.results_interpretation_analysis, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  return {
    getReport,
    getProjectReports,
    renderReport,
    getDeepDive,
    getProjectDeepDives,
    renderDeepDive,
    isLoading,
    error
  };
}
