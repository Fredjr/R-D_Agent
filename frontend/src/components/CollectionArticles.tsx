'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, BeakerIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, SparklesIcon, MagnifyingGlassIcon, ShareIcon } from '@heroicons/react/24/outline';
import { type Collection } from '@/hooks/useGlobalCollectionSync';
import MultiColumnNetworkView from './MultiColumnNetworkView';
import { AnnotationList } from './annotations';
import SmartAnnotationList from './annotations/SmartAnnotationList';
import { TriageContextSelector, TriageContext } from '@/components/erythos/discover/TriageContextSelector';
import { ErythosModal } from '@/components/erythos/ErythosModal';
import { MultiProjectRelevanceMatrix } from '@/components/erythos/discover/MultiProjectRelevanceMatrix';
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
  const [showTriageSelector, setShowTriageSelector] = useState(false);
  const [triageArticle, setTriageArticle] = useState<Article | null>(null);
  const [showTriageResult, setShowTriageResult] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);

  // Protocol extraction state
  const [extractingProtocolPmids, setExtractingProtocolPmids] = useState<Set<string>>(new Set());

  // Deep Dive state
  const [deepDivePmids, setDeepDivePmids] = useState<Set<string>>(new Set());
  const [deepDiveModalOpen, setDeepDiveModalOpen] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState<any>(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState<string | null>(null);

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

  // Open triage context selector modal
  const handleTriageArticle = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.email || !article.article_pmid) {
      alert('Unable to triage: Missing user ID or PMID');
      return;
    }

    setTriageArticle(article);
    setShowTriageSelector(true);
  };

  // Execute triage with selected context
  const executeContextlessTriage = async (context: TriageContext) => {
    if (!user?.email || !triageArticle) return;

    setShowTriageSelector(false);
    setTriagingPmids(prev => new Set(prev).add(triageArticle.article_pmid));

    try {
      const response = await fetch('/api/proxy/triage/contextless', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          article_pmid: triageArticle.article_pmid,
          context_type: context.type,
          search_query: context.searchQuery,
          project_id: context.projectId || projectId,
          collection_id: context.collectionId || collection.collection_id,
          ad_hoc_question: context.adHocQuestion
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Paper triaged:', result);

        // Update triage data
        setTriageData(prev => new Map(prev).set(triageArticle.article_pmid, result));

        // Show result modal
        setTriageResult(result);
        setShowTriageResult(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to triage paper: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error triaging article:', error);
      alert('Failed to triage article. Please try again.');
    } finally {
      setTriagingPmids(prev => {
        const next = new Set(prev);
        if (triageArticle) next.delete(triageArticle.article_pmid);
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

  const handleDeepDive = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.user_id || !article.article_pmid) {
      alert('Unable to perform deep dive: Missing user ID or PMID');
      return;
    }

    setDeepDivePmids(prev => new Set(prev).add(article.article_pmid));
    setDeepDiveModalOpen(true);
    setDeepDiveLoading(true);
    setDeepDiveError(null);
    setDeepDiveData(null);

    try {
      console.log(`🔍 Starting deep dive for paper ${article.article_pmid}...`);

      const response = await fetch('/api/proxy/deep-dive-enhanced-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.user_id,
        },
        body: JSON.stringify({
          pmid: article.article_pmid,
          title: article.article_title,
          objective: `Deep dive analysis of: ${article.article_title}`,
          projectId: projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform deep dive');
      }

      const data = await response.json();
      console.log(`✅ Deep dive completed for ${article.article_pmid}`);
      setDeepDiveData(data);
    } catch (error) {
      console.error('❌ Error performing deep dive:', error);
      setDeepDiveError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setDeepDiveLoading(false);
      setDeepDivePmids(prev => {
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
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-purple-700">🔗 Evidence Links:</span>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                {triageData.get(article.article_pmid).affected_hypotheses.length} hypothesis{triageData.get(article.article_pmid).affected_hypotheses.length !== 1 ? 'es' : ''}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {triageData.get(article.article_pmid).affected_hypotheses.slice(0, 3).map((hypId: string) => {
                                const hypothesis = hypotheses.find(h => h.hypothesis_id === hypId);
                                return hypothesis ? (
                                  <div key={hypId} className="text-xs text-gray-700 bg-white/50 rounded px-2 py-1 border border-purple-200">
                                    <span className="font-medium">💡</span> {hypothesis.hypothesis_text.substring(0, 80)}{hypothesis.hypothesis_text.length > 80 ? '...' : ''}
                                  </div>
                                ) : null;
                              })}
                              {triageData.get(article.article_pmid).affected_hypotheses.length > 3 && (
                                <div className="text-xs text-purple-600 italic">
                                  +{triageData.get(article.article_pmid).affected_hypotheses.length - 3} more...
                                </div>
                              )}
                            </div>
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
                        <button
                          onClick={(e) => handleDeepDive(article, e)}
                          disabled={deepDivePmids.has(article.article_pmid)}
                          className="inline-flex items-center px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                          {deepDivePmids.has(article.article_pmid) ? 'Analyzing...' : 'Deep Dive'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArticle(article);
                            setShowNetworkExploration(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <ShareIcon className="w-4 h-4 mr-1" />
                          Network View
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

      {/* Deep Dive Modal */}
      {deepDiveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeepDiveModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">🔍 Deep Dive Analysis</h2>
              <button
                onClick={() => setDeepDiveModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {deepDiveLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-600">Analyzing paper... This may take 30-60 seconds.</p>
                </div>
              )}

              {deepDiveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold">❌ Error</p>
                  <p className="text-red-600 text-sm mt-1">{deepDiveError}</p>
                </div>
              )}

              {deepDiveData && !deepDiveLoading && (
                <div className="space-y-6">
                  {/* Model Description */}
                  {deepDiveData.model_description_structured && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-blue-900 mb-3">📊 Scientific Model</h3>
                      <div className="space-y-2 text-sm text-gray-800">
                        {deepDiveData.model_description_structured.model_type && (
                          <p><strong>Type:</strong> {deepDiveData.model_description_structured.model_type}</p>
                        )}
                        {deepDiveData.model_description_structured.description && (
                          <p><strong>Description:</strong> {deepDiveData.model_description_structured.description}</p>
                        )}
                        {deepDiveData.model_description_structured.key_features && (
                          <div>
                            <strong>Key Features:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {deepDiveData.model_description_structured.key_features.map((feature: string, idx: number) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Methods */}
                  {deepDiveData.methods_structured && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-green-900 mb-3">🔬 Methods</h3>
                      <div className="space-y-2 text-sm text-gray-800">
                        {deepDiveData.methods_structured.study_design && (
                          <p><strong>Study Design:</strong> {deepDiveData.methods_structured.study_design}</p>
                        )}
                        {deepDiveData.methods_structured.sample_size && (
                          <p><strong>Sample Size:</strong> {deepDiveData.methods_structured.sample_size}</p>
                        )}
                        {deepDiveData.methods_structured.key_techniques && (
                          <div>
                            <strong>Key Techniques:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {deepDiveData.methods_structured.key_techniques.map((technique: string, idx: number) => (
                                <li key={idx}>{technique}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {deepDiveData.results_structured && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-purple-900 mb-3">📈 Results</h3>
                      <div className="space-y-2 text-sm text-gray-800">
                        {deepDiveData.results_structured.main_findings && (
                          <div>
                            <strong>Main Findings:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {deepDiveData.results_structured.main_findings.map((finding: string, idx: number) => (
                                <li key={idx}>{finding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {deepDiveData.results_structured.statistical_significance && (
                          <p><strong>Statistical Significance:</strong> {deepDiveData.results_structured.statistical_significance}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!deepDiveData.model_description_structured && !deepDiveData.methods_structured && !deepDiveData.results_structured && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">⚠️ No structured analysis available. The paper may not have sufficient content or may be behind a paywall.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Triage Context Selector Modal */}
      {showTriageSelector && triageArticle && (
        <TriageContextSelector
          isOpen={showTriageSelector}
          onClose={() => {
            setShowTriageSelector(false);
            setTriageArticle(null);
          }}
          onSelectContext={executeContextlessTriage}
          articlePmid={triageArticle.article_pmid}
          articleTitle={triageArticle.article_title}
        />
      )}

      {/* Triage Result Modal */}
      {showTriageResult && triageResult && (
        <ErythosModal
          isOpen={showTriageResult}
          onClose={() => {
            setShowTriageResult(false);
            setTriageResult(null);
          }}
          title="🤖 AI Triage Result"
          subtitle={triageArticle?.article_title?.slice(0, 60) + '...' || `PMID: ${triageResult.article_pmid}`}
        >
          {triageResult.context_type === 'multi_project' ? (
            <MultiProjectRelevanceMatrix
              articlePmid={triageResult.article_pmid}
              articleTitle={triageArticle?.article_title}
              projectScores={triageResult.project_scores || []}
              collectionScores={triageResult.collection_scores || []}
              bestMatch={triageResult.best_match}
              overallRelevance={triageResult.overall_relevance || 0}
            />
          ) : (
            <div className="space-y-4">
              {/* Score & Status */}
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${
                  triageResult.relevance_score >= 70 ? 'text-red-400' :
                  triageResult.relevance_score >= 40 ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {triageResult.relevance_score}/100
                </div>
                <div className="flex-1">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    triageResult.triage_status === 'must_read' ? 'bg-red-500/20 text-red-400' :
                    triageResult.triage_status === 'nice_to_know' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {triageResult.triage_status?.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              {triageResult.ai_reasoning && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">AI Analysis</h4>
                  <p className="text-sm text-gray-400">{triageResult.ai_reasoning}</p>
                </div>
              )}

              {/* Evidence Excerpts */}
              {triageResult.evidence_excerpts?.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Evidence</h4>
                  <div className="space-y-2">
                    {triageResult.evidence_excerpts.slice(0, 3).map((excerpt: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-400 border-l-2 border-orange-500/50 pl-3">
                        "{excerpt.quote}"
                        <span className="block text-xs text-gray-500 mt-1">— {excerpt.relevance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                Paper added to Smart Inbox • Check Smart Inbox for full details
              </p>
            </div>
          )}
        </ErythosModal>
      )}
    </div>
  );
}
