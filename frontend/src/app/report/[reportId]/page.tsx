'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ArticleCard from '@/components/ArticleCard';
import type { SearchResult } from '@/lib/dummy-data';

interface Report {
  report_id: string;
  title: string;
  objective: string;
  content: any; // Changed to any to handle structured content
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

  // Collection management state
  const [collections, setCollections] = useState<any[]>([]);
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
  const [selectedArticleForCollection, setSelectedArticleForCollection] = useState<{
    pmid?: string;
    title: string;
    authors?: string[];
    journal?: string;
    year?: number;
  } | null>(null);
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

        // Fetch collections for the project
        if (data.project_id) {
          fetchCollections(data.project_id);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, user]);

  const fetchCollections = async (projectId: string) => {
    try {
      console.log('Report page - Fetching collections for project:', projectId);
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });
      console.log('Report page - Collections response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Report page - Collections data received:', data);
        // Backend returns collections directly as array, not wrapped in collections property
        const collectionsArray = Array.isArray(data) ? data : (data.collections || []);
        setCollections(collectionsArray);
        console.log('Report page - Collections set to state:', collectionsArray);
      } else {
        const errorText = await response.text();
        console.error('Report page - Collections fetch failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Report page - Error fetching collections:', error);
    }
  };

  const handleAddToCollection = (article: {
    pmid?: string;
    title: string;
    authors?: string[];
    journal?: string;
    year?: number;
  }) => {
    setSelectedArticleForCollection(article);
    setShowAddToCollectionModal(true);
    // Refresh collections when modal opens to ensure we have the latest data
    if (report?.project_id) {
      fetchCollections(report.project_id);
    }
  };

  const handleConfirmAddToCollection = async (collectionId: string) => {
    if (!selectedArticleForCollection) return;

    try {
      const response = await fetch(`/api/proxy/collections/${collectionId}/articles?projectId=${report?.project_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          article_pmid: selectedArticleForCollection.pmid || '',
          article_title: selectedArticleForCollection.title,
          article_authors: selectedArticleForCollection.authors || [],
          article_journal: selectedArticleForCollection.journal || '',
          article_year: selectedArticleForCollection.year || new Date().getFullYear(),
          source_type: 'report',
          source_report_id: reportId,
          source_analysis_id: null,
          notes: `Added from Report: ${report?.title || reportId}`
        }),
      });

      if (response.ok) {
        alert('✅ Article added to collection successfully!');
        setShowAddToCollectionModal(false);
        setSelectedArticleForCollection(null);
        if (report?.project_id) {
          fetchCollections(report.project_id); // Refresh collections
        }
      } else {
        throw new Error('Failed to add article to collection');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('❌ Failed to add article to collection. Please try again.');
    }
  };

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

  // Parse report content to match Generate Dossier structure
  const parseReportContent = (content: any): SearchResult[] | null => {
    if (!content) return null;

    try {
      // If it's already an object, extract results
      if (typeof content === 'object' && content !== null) {
        // Check if it has the expected structure
        if (content.results && Array.isArray(content.results)) {
          return content.results.map((result: any, index: number) => ({
            query: result.query || `Query ${index + 1}`,
            result: result.result || {
              summary: result.summary || 'No summary available',
              confidence_score: result.confidence_score || 0,
              methodologies: result.methodologies || [],
              publication_score: result.publication_score || 0,
              overall_relevance_score: result.overall_relevance_score || 0
            },
            articles: result.articles || [],
            source: result.source === 'fallback' ? 'fallback' : 'primary'
          }));
        }

        // Fallback: create a single result from the content
        return [{
          query: content.objective || 'Report Analysis',
          result: {
            summary: content.executive_summary || content.summary || 'Report content available',
            confidence_score: 85,
            methodologies: content.methodologies || ['Report Analysis'],
            publication_score: 80,
            overall_relevance_score: 82
          },
          articles: content.articles || [],
          source: 'primary'
        }];
      }

      // If it's a string, try to parse as JSON
      if (typeof content === 'string') {
        if (content.trim() === '') return null;
        try {
          const parsed = JSON.parse(content);
          return parseReportContent(parsed); // Recursive call
        } catch {
          // If JSON parsing fails, create a simple structure
          return [{
            query: 'Report Content',
            result: {
              summary: content,
              confidence_score: 70,
              methodologies: ['Text Analysis'],
              publication_score: 70,
              overall_relevance_score: 70
            },
            articles: [],
            source: 'primary'
          }];
        }
      }

      return null;
    } catch (e) {
      console.warn('Error parsing report content:', e);
      return null;
    }
  };

  const parsedResults = parseReportContent(report.content);



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

        {/* Content - Generate Dossier Structure */}
        <div className="space-y-6">
          {parsedResults && parsedResults.length > 0 ? (
            <>
              {/* Diagnostics Section (same as Generate Dossier) */}
              {(() => {
                const diagnostics = report.content?.diagnostics;
                if (!diagnostics) return null;
                return (
                  <div className="p-3 sm:p-4 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
                    <div className="font-medium mb-2">Run details</div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                      <span>Pool: {diagnostics.pool_size || 0}</span>
                      <span>Shortlist: {diagnostics.shortlist_size || 0}</span>
                      <span>Deep-dive: {diagnostics.deep_dive_count || 0}</span>
                      {diagnostics.timings_ms && (
                        <>
                          <span>Plan: {diagnostics.timings_ms.plan_ms || 0}ms</span>
                          <span>Harvest: {diagnostics.timings_ms.harvest_ms || 0}ms</span>
                          <span>Deep-dive: {diagnostics.timings_ms.deepdive_ms || 0}ms</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Executive Summary */}
              {report.content?.executive_summary && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {report.content.executive_summary}
                  </div>
                </div>
              )}

              {/* Article Results (same structure as Generate Dossier) */}
              <div className="space-y-6">
                {parsedResults.map((item, idx) => (
                  <ArticleCard
                    key={idx}
                    item={item}
                    projectId={report?.project_id}
                    onAddToCollection={handleAddToCollection}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">No content available for this report.</p>
                <p className="text-sm text-gray-400 mt-2">
                  The report may still be processing or there was an issue generating content.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Add to Collection Modal */}
        {showAddToCollectionModal && selectedArticleForCollection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Collection</h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{selectedArticleForCollection.title}</p>
                {selectedArticleForCollection.pmid && (
                  <p className="text-xs text-blue-600 mt-1">PMID: {selectedArticleForCollection.pmid}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">From Report: {report?.title}</p>
              </div>

              {collections.length > 0 ? (
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
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddToCollectionModal(false);
                    setSelectedArticleForCollection(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                {report?.project_id && (
                  <button
                    onClick={() => window.open(`/project/${report.project_id}?tab=collections`, '_blank')}
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
