'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, BeakerIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { type Collection } from '@/hooks/useGlobalCollectionSync';
import MultiColumnNetworkView from './MultiColumnNetworkView';
import { AnnotationList } from './annotations';
import SmartAnnotationList from './annotations/SmartAnnotationList';
import { triagePaper } from '@/lib/api';
import dynamic from 'next/dynamic';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/reading/PDFViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading PDF viewer...</div>
});

interface Article {
  id: number;
  article_pmid: string;
  article_title: string;
  article_authors: string[];
  article_journal: string;
  article_year: number;
  notes?: string;
  added_at: string;
  source_type: 'report' | 'deep_dive' | 'pubmed_exploration';
  source_report_id?: string;
  source_analysis_id?: string;
  // New fields for PubMed exploration sources
  pubmed_source_data?: {
    discovery_context: 'similar' | 'citations' | 'references' | 'authors';
    source_article_pmid?: string;
    source_article_title?: string;
    exploration_session_id?: string;
  };
  added_by: string;
}



interface CollectionArticlesProps {
  collection: Collection;
  projectId: string;
  onBack: () => void;
}

export default function CollectionArticles({ collection, projectId, onBack }: CollectionArticlesProps) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showNetworkExploration, setShowNetworkExploration] = useState(false);

  // PDF Viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPMID, setSelectedPMID] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // Triage state
  const [triagingPmids, setTriagingPmids] = useState<Set<string>>(new Set());

  // Protocol extraction state
  const [extractingProtocolPmids, setExtractingProtocolPmids] = useState<Set<string>>(new Set());

  // Week 24: Fetch hypotheses and research questions for displaying links
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  // Triage data for showing status
  const [triageData, setTriageData] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    fetchArticles();
    fetchAnnotations();
    fetchHypothesesAndQuestions();
    fetchTriageData();
  }, [collection.collection_id]);

  const fetchHypothesesAndQuestions = async () => {
    if (!user?.email) return;

    try {
      // Fetch hypotheses
      const hypothesesResponse = await fetch(`/api/proxy/hypotheses/project/${projectId}`, {
        headers: { 'User-ID': user.email }
      });
      if (hypothesesResponse.ok) {
        const hypothesesData = await hypothesesResponse.json();
        setHypotheses(hypothesesData || []);
      }

      // Fetch research questions
      const questionsResponse = await fetch(`/api/proxy/questions/project/${projectId}`, {
        headers: { 'User-ID': user.email }
      });
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData || []);
      }
    } catch (error) {
      console.error('Error fetching hypotheses/questions:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/proxy/collections/${collection.collection_id}/articles?projectId=${projectId}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnotations = async () => {
    try {
      // ✅ NEW: Use collection_id filter in API query instead of client-side filtering
      const response = await fetch(
        `/api/proxy/projects/${projectId}/annotations?collection_id=${collection.collection_id}`,
        {
          headers: {
            'User-ID': user?.email || 'default_user',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const collectionAnnotations = data.annotations || data || [];
        console.log(`📊 Fetched ${collectionAnnotations.length} annotations for collection ${collection.collection_id}`);
        setAnnotations(collectionAnnotations);
      }
    } catch (error) {
      console.error('Error fetching annotations:', error);
    }
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    setShowNetworkExploration(true);
  };

  const fetchTriageData = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/proxy/triage/project/${projectId}/triages`, {
        headers: { 'User-ID': user.email }
      });

      if (response.ok) {
        const triages = await response.json();
        const triageMap = new Map();
        triages.forEach((triage: any) => {
          triageMap.set(triage.article_pmid, triage);
        });
        setTriageData(triageMap);
      }
    } catch (error) {
      console.error('Error fetching triage data:', error);
    }
  };

  const handleTriageArticle = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.user_id || !article.article_pmid) {
      alert('Unable to triage: Missing user ID or PMID');
      return;
    }

    setTriagingPmids(prev => new Set(prev).add(article.article_pmid));

    try {
      const result = await triagePaper(projectId, article.article_pmid, user.user_id);
      console.log('✅ Paper triaged:', result);

      // Update triage data
      setTriageData(prev => new Map(prev).set(article.article_pmid, result));

      // Show success message with relevance score
      const statusEmoji = result.triage_status === 'must_read' ? '🔴' :
                         result.triage_status === 'nice_to_know' ? '🟡' : '⚪';
      alert(`${statusEmoji} Paper triaged!\n\nRelevance Score: ${result.relevance_score}/100\nStatus: ${result.triage_status.replace('_', ' ').toUpperCase()}\n\nCheck the Inbox tab to see AI insights.`);
    } catch (error) {
      console.error('❌ Error triaging article:', error);
      alert('Failed to triage article. Please try again.');
    } finally {
      setTriagingPmids(prev => {
        const next = new Set(prev);
        next.delete(article.article_pmid);
        return next;
      });
    }
  };

  const handleExtractProtocol = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.user_id || !article.article_pmid) {
      alert('Unable to extract protocol: Missing user ID or PMID');
      return;
    }

    setExtractingProtocolPmids(prev => new Set(prev).add(article.article_pmid));

    try {
      console.log(`🧪 Extracting protocol from paper ${article.article_pmid}...`);

      const response = await fetch('/api/proxy/protocols/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.user_id,
        },
        body: JSON.stringify({
          article_pmid: article.article_pmid,
          protocol_type: null, // Let AI determine type
          force_refresh: false, // Use cache if available
          project_id: projectId, // Include project context
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to extract protocol');
      }

      const protocol = await response.json();
      console.log(`✅ Protocol extracted: ${protocol.protocol_name}`);

      // Show success message
      alert(`✅ Protocol extracted successfully!\n\n${protocol.protocol_name}\n\nView it in the Protocols tab.`);
    } catch (error) {
      console.error('❌ Error extracting protocol:', error);
      alert(`Failed to extract protocol: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExtractingProtocolPmids(prev => {
        const next = new Set(prev);
        next.delete(article.article_pmid);
        return next;
      });
    }
  };

  if (showNetworkExploration && selectedArticle) {
    return (
      <div className="h-[calc(100vh-200px)] min-h-[600px]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowNetworkExploration(false)}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Back to Articles
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            Network Exploration: {selectedArticle.article_title.substring(0, 60)}...
          </h3>
        </div>
        <MultiColumnNetworkView
          sourceType="article"
          sourceId={selectedArticle.article_pmid}
          projectId={projectId}
          onDeepDiveCreated={() => {}}
          onArticleSaved={() => {}}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#3B82F6' }}
          >
            <BeakerIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{collection.collection_name}</h2>
            <p className="text-gray-600">{collection.article_count} articles • Click any article to explore its network</p>
          </div>
        </div>
      </div>

      {/* Week 24: Linked Research Questions and Hypotheses */}
      {((collection.linked_question_ids && collection.linked_question_ids.length > 0) ||
        (collection.linked_hypothesis_ids && collection.linked_hypothesis_ids.length > 0)) && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🔗 Linked to Research</h3>
          <div className="flex flex-wrap gap-2">
            {/* Research Questions - Blue badges */}
            {collection.linked_question_ids && collection.linked_question_ids.length > 0 && (
              <>
                {collection.linked_question_ids.map((questionId) => {
                  const question = questions.find(q => q.question_id === questionId);
                  if (!question) return null;
                  return (
                    <div
                      key={questionId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200"
                    >
                      <span className="text-blue-600">❓</span>
                      <span className="max-w-[200px] truncate" title={question.question_text}>
                        {question.question_text}
                      </span>
                    </div>
                  );
                })}
              </>
            )}

            {/* Hypotheses - Purple badges */}
            {collection.linked_hypothesis_ids && collection.linked_hypothesis_ids.length > 0 && (
              <>
                {collection.linked_hypothesis_ids.map((hypothesisId) => {
                  const hypothesis = hypotheses.find(h => h.hypothesis_id === hypothesisId);
                  if (!hypothesis) return null;
                  return (
                    <div
                      key={hypothesisId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium border border-purple-200"
                    >
                      <span className="text-purple-600">💡</span>
                      <span className="max-w-[200px] truncate" title={hypothesis.hypothesis_text}>
                        {hypothesis.hypothesis_text}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Collection Notes Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Collection Notes ({annotations.length})</h3>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Smart view of your notes - aggregated and organized by context
          </p>
        </div>
        <div className="p-4">
          {annotations.length > 0 ? (
            <SmartAnnotationList
              annotations={annotations}
              projectId={projectId}
              onEdit={(annotation) => {
                console.log('Edit annotation:', annotation);
              }}
              onDelete={(annotationId) => {
                console.log('Delete annotation:', annotationId);
                fetchAnnotations(); // Refresh after delete
              }}
              onReply={(annotationId) => {
                console.log('Reply to annotation:', annotationId);
              }}
              onJumpToSource={(annotation) => {
                if (annotation.article_pmid && annotation.pdf_page) {
                  setSelectedPMID(annotation.article_pmid);
                  setSelectedTitle(annotation.paper_title || 'Paper');
                  setShowPDFViewer(true);
                }
              }}
              compact={false}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No notes in this collection yet</p>
              <p className="text-xs mt-1">Add notes while reading papers to see them here</p>
            </div>
          )}
        </div>
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="text-center py-12">
          <BeakerIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles in this collection</h3>
          <p className="text-gray-500">Add articles from your reports and analyses to start exploring</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleSelect(article)}
              className="bg-white rounded-lg shadow border hover:shadow-md hover:border-blue-300 transition-all cursor-pointer p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {article.article_title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Authors:</span> {article.article_authors.slice(0, 3).join(', ')}
                      {article.article_authors.length > 3 && ` +${article.article_authors.length - 3} more`}
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <span className="font-medium">Journal:</span> {article.article_journal || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Year:</span> {article.article_year || 'Unknown'}
                      </div>
                      {article.article_pmid && (
                        <div>
                          <span className="font-medium">PMID:</span>
                          <span className="font-mono text-blue-600 ml-1">{article.article_pmid}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* PubMed Discovery Context */}
                    {article.source_type === 'pubmed_exploration' && article.pubmed_source_data && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-green-600 font-medium text-sm">🔍 PubMed Discovery</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {article.pubmed_source_data.discovery_context}
                          </span>
                        </div>
                        {article.pubmed_source_data.source_article_title && (
                          <div className="text-xs text-green-600">
                            <span className="font-medium">Discovered from:</span> {article.pubmed_source_data.source_article_title.substring(0, 80)}...
                          </div>
                        )}
                      </div>
                    )}

                    {article.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">Notes:</span>
                        <p className="text-gray-600 mt-1">{article.notes}</p>
                      </div>
                    )}

                    {/* Week 24: Triage Status Badge */}
                    {article.article_pmid && triageData.has(article.article_pmid) && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">✅ AI Triaged</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              triageData.get(article.article_pmid).triage_status === 'must_read'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : triageData.get(article.article_pmid).triage_status === 'nice_to_know'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {triageData.get(article.article_pmid).triage_status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {triageData.get(article.article_pmid).relevance_score}/100
                            </div>
                            <div className="text-xs text-gray-500">Relevance</div>
                          </div>
                        </div>
                        {triageData.get(article.article_pmid).affected_hypotheses?.length > 0 && (
                          <div className="mt-2 text-xs text-purple-700">
                            🔗 Linked to {triageData.get(article.article_pmid).affected_hypotheses.length} hypothesis{triageData.get(article.article_pmid).affected_hypotheses.length !== 1 ? 'es' : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {article.article_pmid && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPMID(article.article_pmid);
                            setSelectedTitle(article.article_title);
                            setShowPDFViewer(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <DocumentTextIcon className="w-4 h-4 mr-1" />
                          Read PDF
                        </button>
                        <button
                          onClick={(e) => handleTriageArticle(article, e)}
                          disabled={triagingPmids.has(article.article_pmid)}
                          className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SparklesIcon className="w-4 h-4 mr-1" />
                          {triagingPmids.has(article.article_pmid) ? 'Triaging...' : 'AI Triage'}
                        </button>
                        <button
                          onClick={(e) => handleExtractProtocol(article, e)}
                          disabled={extractingProtocolPmids.has(article.article_pmid)}
                          className="inline-flex items-center px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <BeakerIcon className="w-4 h-4 mr-1" />
                          {extractingProtocolPmids.has(article.article_pmid) ? 'Extracting...' : 'Extract Protocol'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="text-xs text-gray-500">
                    Added {new Date(article.added_at).toLocaleDateString()}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      article.source_type === 'pubmed_exploration'
                        ? 'bg-green-100 text-green-800'
                        : article.source_type === 'report'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {article.source_type === 'pubmed_exploration'
                        ? '🧬 PubMed'
                        : article.source_type === 'report'
                        ? '📄 Report'
                        : '🔬 Analysis'}
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      🔍 Click to Explore
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedPMID && (
        <PDFViewer
          pmid={selectedPMID}
          title={selectedTitle || undefined}
          projectId={projectId}
          collectionId={collection.collection_id} // ✅ NEW: Pass collection context to PDFViewer
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedPMID(null);
            setSelectedTitle(null);
            fetchAnnotations(); // ✅ Refresh annotations after closing PDF viewer
          }}
        />
      )}
    </div>
  );
}
