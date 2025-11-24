'use client';

import React, { useState, useEffect } from 'react';
import { LinkIcon, MagnifyingGlassIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface RelatedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
  similarity_score?: number;
  relationship_type?: string;
  relationship_explanation?: string;
}

interface RelatedArticlesTabProps {
  pmid: string;
  projectId?: string;
  userId?: string;
  onViewPDF?: (pmid: string) => void;
  onAddToCollection?: (pmid: string) => void;
}

export default function RelatedArticlesTab({
  pmid,
  projectId,
  userId,
  onViewPDF,
  onAddToCollection,
}: RelatedArticlesTabProps) {
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedPmid, setSelectedPmid] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<RelatedArticle | null>(null);
  const [showExplanation, setShowExplanation] = useState<string | null>(null);

  useEffect(() => {
    fetchRelatedArticles();
    if (projectId) {
      fetchCollections();
    }
  }, [pmid, projectId]);

  const fetchRelatedArticles = async () => {
    setLoading(true);
    try {
      console.log(`🔍 [RelatedArticlesTab] Fetching related articles for PMID: ${pmid}`);

      // Try backend similar-network API first
      try {
        const backendResponse = await fetch(`/api/proxy/articles/${pmid}/similar-network?limit=20&threshold=0.15`, {
          headers: {
            'User-ID': userId || 'default_user',
          },
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();

          if (backendData.articles && backendData.articles.length > 0) {
            console.log(`✅ [RelatedArticlesTab] Found ${backendData.articles.length} articles from backend`);

            // Enrich with relationship explanations
            const enrichedArticles = backendData.articles.map((article: any) => ({
              ...article,
              relationship_type: determineRelationshipType(article),
              relationship_explanation: generateRelationshipExplanation(article, backendData.source_article),
            }));

            setRelatedArticles(enrichedArticles);
            setLoading(false);
            return;
          }
        }
      } catch (backendError) {
        console.log(`⚠️ [RelatedArticlesTab] Backend API failed, trying PubMed fallback:`, backendError);
      }

      // Fallback to PubMed recommendations API
      console.log(`🔄 [RelatedArticlesTab] Using PubMed recommendations API as fallback`);
      const pubmedResponse = await fetch(`/api/proxy/pubmed/recommendations?type=similar&pmid=${pmid}&limit=20`, {
        headers: {
          'User-ID': userId || 'default_user',
        },
      });

      if (!pubmedResponse.ok) {
        throw new Error(`Failed to fetch related articles: ${pubmedResponse.status}`);
      }

      const pubmedData = await pubmedResponse.json();
      console.log(`📊 [RelatedArticlesTab] Found ${pubmedData.recommendations?.length || 0} related articles from PubMed`);

      // Enrich with relationship explanations
      const enrichedArticles = (pubmedData.recommendations || []).map((article: any) => ({
        ...article,
        relationship_type: 'similar_content',
        relationship_explanation: 'Similar content based on PubMed\'s similarity algorithm',
      }));

      setRelatedArticles(enrichedArticles);
    } catch (error) {
      console.error('❌ [RelatedArticlesTab] Error fetching related articles:', error);
      setRelatedArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const determineRelationshipType = (article: any): string => {
    if (article.similarity_score > 0.7) return 'Highly Similar';
    if (article.similarity_score > 0.5) return 'Similar Topic';
    if (article.similarity_score > 0.3) return 'Related Field';
    return 'Tangentially Related';
  };

  const generateRelationshipExplanation = (article: any, sourceArticle: any): string => {
    const score = article.similarity_score || 0;
    const type = determineRelationshipType(article);
    
    if (score > 0.7) {
      return `This paper is highly similar to the current paper, sharing key research themes, methodologies, and likely overlapping citations. Both papers address closely related research questions.`;
    } else if (score > 0.5) {
      return `This paper explores similar topics and may use comparable methodologies. It likely cites some of the same foundational works and addresses related research questions.`;
    } else if (score > 0.3) {
      return `This paper is in a related field and may provide complementary insights or alternative approaches to similar problems.`;
    } else {
      return `This paper has some thematic overlap but approaches the topic from a different angle or focuses on different aspects.`;
    }
  };

  const fetchCollections = async () => {
    if (!projectId || !userId) return;

    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleViewPDF = (articlePmid: string) => {
    if (onViewPDF) {
      onViewPDF(articlePmid);
    } else {
      window.open(`/project/${projectId}/pdf/${articlePmid}`, '_blank');
    }
  };

  const handleAddToCollection = (articlePmid: string) => {
    // Find the article in the list
    const article = relatedArticles.find(a => a.pmid === articlePmid);
    if (article) {
      setSelectedArticle(article);
      setSelectedPmid(articlePmid);
      setShowCollectionModal(true);
    }
  };

  const handleCollectionSelect = async (collectionId: string) => {
    if (!selectedPmid || !selectedArticle || !projectId || !userId) return;

    try {
      const response = await fetch(
        `/api/proxy/collections/${collectionId}/articles?projectId=${projectId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': userId,
          },
          body: JSON.stringify({
            article_pmid: selectedPmid,
            article_title: selectedArticle.title,
            article_authors: selectedArticle.authors || [],
            article_journal: selectedArticle.journal || '',
            article_year: selectedArticle.year || new Date().getFullYear(),
            source_type: 'related_articles',
            notes: `Added from Related Articles tab`
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Added PMID ${selectedPmid} to collection ${collectionId}`);
        alert('✅ Article added to collection successfully!');
        setShowCollectionModal(false);
        setSelectedPmid(null);
        setSelectedArticle(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to add to collection:', errorData);
        alert(`❌ Failed to add article: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('❌ Failed to add article to collection. Please try again.');
    }
  };

  const filteredArticles = relatedArticles.filter((article) => {
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.authors.some((author) => author.toLowerCase().includes(query)) ||
      article.journal.toLowerCase().includes(query) ||
      article.pmid.includes(query) ||
      article.year.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Finding related articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search related articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {filteredArticles.length} of {relatedArticles.length} related articles
        </p>
      </div>

      {/* Related Articles List */}
      <div className="flex-1 overflow-y-auto">
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6">
            <LinkIcon className="w-12 h-12 mb-3" />
            {searchQuery ? (
              <p className="text-sm text-center">No articles match your search</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 mb-2">Not Yet Indexed</p>
                <p className="text-xs text-gray-500 text-center max-w-xs mb-4">
                  This paper is not yet in our similarity database.
                  Try searching PubMed for related papers on similar topics.
                </p>
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent('chronic kidney disease')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                >
                  Search PubMed
                </a>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredArticles.map((article, index) => (
              <div key={article.pmid || index} className="p-4 hover:bg-gray-50 transition-colors">
                {/* Relationship Badge */}
                {article.relationship_type && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`
                      inline-block px-2 py-0.5 text-xs rounded-full font-medium
                      ${article.relationship_type === 'Highly Similar' ? 'bg-green-100 text-green-700' :
                        article.relationship_type === 'Similar Topic' ? 'bg-blue-100 text-blue-700' :
                        article.relationship_type === 'Related Field' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'}
                    `}>
                      {article.relationship_type}
                    </span>
                    <button
                      onClick={() => setShowExplanation(showExplanation === article.pmid ? null : article.pmid)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Show relationship explanation"
                    >
                      <InformationCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Relationship Explanation */}
                {showExplanation === article.pmid && article.relationship_explanation && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">{article.relationship_explanation}</p>
                  </div>
                )}

                {/* Paper Title */}
                <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h4>

                {/* Authors */}
                <p className="text-xs text-gray-600 mb-1">
                  {article.authors.slice(0, 3).join(', ')}
                  {article.authors.length > 3 && ` et al.`}
                </p>

                {/* Journal and Year */}
                <p className="text-xs text-gray-500 mb-2">
                  {article.journal} • {article.year}
                </p>

                {/* PMID */}
                <p className="text-xs text-gray-500 mb-3">
                  <span className="font-medium">PMID:</span> {article.pmid}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewPDF(article.pmid)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                  >
                    View PDF
                  </button>
                  {projectId && (
                    <button
                      onClick={() => handleAddToCollection(article.pmid)}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors flex items-center gap-1"
                    >
                      <PlusIcon className="w-3 h-3" />
                      Add to Collection
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Selection Modal */}
      {showCollectionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowCollectionModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add to Collection
            </h3>

            {collections.length === 0 ? (
              <p className="text-sm text-gray-600 mb-4">
                No collections available. Create a collection first.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleCollectionSelect(collection.id)}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {collection.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {collection.article_count || 0} papers
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCollectionModal(false)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

