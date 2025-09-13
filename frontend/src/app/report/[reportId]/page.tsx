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

  // Robust content parsing with fallbacks
  const parseReportContent = (content: any) => {
    if (!content) return null;

    try {
      // If it's already an object, return it
      if (typeof content === 'object' && content !== null) {
        return content;
      }

      // If it's a string, try to parse as JSON
      if (typeof content === 'string') {
        if (content.trim() === '') return null;
        try {
          return JSON.parse(content);
        } catch {
          // If JSON parsing fails, create a simple structure
          return { summary: content };
        }
      }

      // For any other type, convert to string and wrap
      return { summary: String(content) };
    } catch (e) {
      console.warn('Error parsing report content:', e);
      return null;
    }
  };

  const parsedContent = parseReportContent(report.content);

  // Robust report content renderer
  const RobustReportRenderer = ({ content }: { content: any }) => {
    if (!content) return null;

    const renderSection = (key: string, value: any, index?: number) => {
      if (value === null || value === undefined || value === '') return null;

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return null;

        if (key === 'queries') {
          return (
            <div key={key}>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Search Queries</h3>
              <div className="space-y-2">
                {value.map((query: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <code className="text-sm text-gray-700">{String(query)}</code>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (key === 'results') {
          return (
            <div key={key}>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Research Results</h3>
              <div className="space-y-4">
                {value.map((result: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Result {idx + 1}</h4>
                    {typeof result === 'object' && result !== null ? (
                      Object.entries(result).map(([k, v]) => (
                        <div key={k} className="mb-2">
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {k.replace(/_/g, ' ')}:
                          </span>
                          <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                            {String(v)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {String(result)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Generic array rendering
        return (
          <div key={key}>
            <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
              {key.replace(/_/g, ' ')}
            </h3>
            <div className="space-y-2">
              {value.map((item: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-700">{String(item)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Handle objects
      if (typeof value === 'object' && value !== null) {
        if (key === 'diagnostics') {
          return (
            <div key={key}>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Research Diagnostics</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {Object.entries(value).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium text-gray-900 capitalize">
                        {k.replace(/_/g, ' ')}:
                      </span>
                      <span className="ml-2 text-gray-700">
                        {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        // Generic object rendering
        return (
          <div key={key}>
            <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
              {key.replace(/_/g, ' ')}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {Object.entries(value).map(([k, v]) => (
                <div key={k}>
                  <span className="font-medium text-gray-700 capitalize">
                    {k.replace(/_/g, ' ')}:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Handle primitive values
      return (
        <div key={key}>
          <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
            {key.replace(/_/g, ' ')}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-700 whitespace-pre-wrap">{String(value)}</div>
          </div>
        </div>
      );
    };

    try {
      if (typeof content === 'object' && content !== null) {
        const sections = Object.entries(content)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => renderSection(key, value))
          .filter(Boolean);

        return sections.length > 0 ? <>{sections}</> : (
          <div className="text-center py-8">
            <p className="text-gray-500">Report content is available but appears to be empty.</p>
          </div>
        );
      }

      // Fallback for non-object content
      return (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Report Content</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-700 whitespace-pre-wrap">{String(content)}</div>
          </div>
        </div>
      );
    } catch (error) {
      console.warn('Error rendering report content:', error);
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Report content is available but could not be displayed properly.</p>
          <details className="mt-2">
            <summary className="text-sm text-gray-400 cursor-pointer">Show raw content</summary>
            <pre className="mt-2 text-xs text-gray-400 bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </details>
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
              <RobustReportRenderer content={parsedContent} />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No content available for this report.</p>
              <p className="text-sm text-gray-400 mt-2">
                The report may still be processing or there was an issue generating content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
