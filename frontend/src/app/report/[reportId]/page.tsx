'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Report {
  report_id: string;
  title: string;
  objective: string;
  content: string;
  created_at: string;
  created_by: string;
  project_id: string;
}

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!reportId || !user) return;

    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/proxy/reports/${reportId}`, {
          headers: {
            'User-ID': user.email || 'default_user',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }

        const data = await response.json();
        setReport(data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, user]);

  const handleRegenerateContent = async () => {
    if (!reportId || !user) return;

    setRegenerating(true);
    try {
      const response = await fetch(`/api/proxy/reports/${reportId}/regenerate`, {
        method: 'POST',
        headers: {
          'User-ID': user.email || 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate report content');
      }

      const result = await response.json();

      // Refresh the report data
      const refreshResponse = await fetch(`/api/proxy/reports/${reportId}`, {
        headers: {
          'User-ID': user.email || 'default_user',
        },
      });

      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setReport(refreshedData);
      }

      alert('Report content regenerated successfully!');
    } catch (err) {
      console.error('Error regenerating report:', err);
      alert('Failed to regenerate report content. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  let parsedContent;
  try {
    parsedContent = JSON.parse(report.content);
  } catch {
    parsedContent = null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRegenerateContent}
                disabled={regenerating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate Content'}
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{report.objective}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Created by {report.created_by}</span>
            <span>•</span>
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Report Content</h2>
          
          {parsedContent ? (
            <div className="space-y-6">
              {/* Queries */}
              {parsedContent.queries && parsedContent.queries.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Search Queries</h3>
                  <div className="space-y-2">
                    {parsedContent.queries.map((query: string, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <code className="text-sm text-gray-700">{query}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {parsedContent.results && parsedContent.results.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Research Results</h3>
                  <div className="space-y-4">
                    {parsedContent.results.map((result: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Result {index + 1}</h4>
                        {result.query && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Query:</strong> {result.query}
                          </p>
                        )}
                        {result.result && (
                          <div className="text-sm text-gray-700">
                            <strong>Analysis:</strong>
                            <div className="mt-1 whitespace-pre-wrap">{result.result}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              {parsedContent.executive_summary && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Executive Summary</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {parsedContent.executive_summary}
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnostics */}
              {parsedContent.diagnostics && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Research Diagnostics</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {parsedContent.diagnostics.pool_size && (
                        <div>
                          <span className="font-medium text-gray-900">Pool Size:</span>
                          <span className="ml-2 text-gray-700">{parsedContent.diagnostics.pool_size}</span>
                        </div>
                      )}
                      {parsedContent.diagnostics.shortlist_size && (
                        <div>
                          <span className="font-medium text-gray-900">Shortlist:</span>
                          <span className="ml-2 text-gray-700">{parsedContent.diagnostics.shortlist_size}</span>
                        </div>
                      )}
                      {parsedContent.diagnostics.deep_dive_count && (
                        <div>
                          <span className="font-medium text-gray-900">Deep Dives:</span>
                          <span className="ml-2 text-gray-700">{parsedContent.diagnostics.deep_dive_count}</span>
                        </div>
                      )}
                      {parsedContent.diagnostics.timings_ms && (
                        <div>
                          <span className="font-medium text-gray-900">Processing Time:</span>
                          <span className="ml-2 text-gray-700">
                            {Math.round((parsedContent.diagnostics.timings_ms.plan_ms || 0) / 1000)}s
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No detailed content available for this report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
