'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { type Collection } from '@/hooks/useGlobalCollectionSync';
import NetworkViewWithSidebar from './NetworkViewWithSidebar';

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
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showNetworkExploration, setShowNetworkExploration] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [collection.collection_id]);

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

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    setShowNetworkExploration(true);
  };

  if (showNetworkExploration && selectedArticle) {
    return (
      <div className="h-full">
        <NetworkViewWithSidebar
          sourceType="article"
          sourceId={selectedArticle.article_pmid}
          projectId={projectId}
          onBack={() => setShowNetworkExploration(false)}
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{collection.collection_name}</h2>
            <p className="text-gray-600">{collection.article_count} articles • Click any article to explore its network</p>
          </div>
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
    </div>
  );
}
