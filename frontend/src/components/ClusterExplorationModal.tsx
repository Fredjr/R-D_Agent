import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ClusterExplorationModalProps {
  isOpen: boolean;
  sourceArticle: { pmid: string; title: string } | null;
  results: {
    citations: any[];
    references: any[];
    similar: any[];
  };
  loading: boolean;
  currentCollectionId: string | null;
  onClose: () => void;
  onAddToCollection: (articles: any[], collectionId: string) => Promise<void>;
  projectId: string;
}

export default function ClusterExplorationModal({
  isOpen,
  sourceArticle,
  results,
  loading,
  currentCollectionId,
  onClose,
  onAddToCollection,
  projectId
}: ClusterExplorationModalProps) {
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [addingToCollection, setAddingToCollection] = useState(false);

  if (!isOpen || !sourceArticle) return null;

  const toggleArticleSelection = (pmid: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(pmid)) {
      newSelected.delete(pmid);
    } else {
      newSelected.add(pmid);
    }
    setSelectedArticles(newSelected);
  };

  const handleAddSelected = async () => {
    if (!currentCollectionId || selectedArticles.size === 0) return;
    
    setAddingToCollection(true);
    try {
      // Collect all selected articles from all categories
      const allArticles = [...results.citations, ...results.references, ...results.similar];
      const articlesToAdd = allArticles.filter(article => selectedArticles.has(article.pmid));
      
      await onAddToCollection(articlesToAdd, currentCollectionId);
      
      // Reset selection and close modal
      setSelectedArticles(new Set());
      onClose();
    } catch (error) {
      console.error('Failed to add articles to collection:', error);
    } finally {
      setAddingToCollection(false);
    }
  };

  const renderArticleSection = (title: string, articles: any[], description: string, icon: string) => {
    if (articles.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({articles.length})</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        
        <div className="space-y-2">
          {articles.map((article) => (
            <div
              key={article.pmid}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedArticles.has(article.pmid)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => toggleArticleSelection(article.pmid)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                    {article.title}
                  </h4>
                  <div className="mt-1 text-xs text-gray-500">
                    <span>PMID: {article.pmid}</span>
                    {article.authors && article.authors.length > 0 && (
                      <span className="ml-3">
                        {article.authors.slice(0, 2).join(', ')}
                        {article.authors.length > 2 && ` +${article.authors.length - 2} more`}
                      </span>
                    )}
                    {article.year && <span className="ml-3">{article.year}</span>}
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {selectedArticles.has(article.pmid) ? (
                    <CheckIcon className="w-5 h-5 text-blue-600" />
                  ) : (
                    <PlusIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const totalArticles = results.citations.length + results.references.length + results.similar.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">🌐 Research Cluster</h2>
              <p className="text-sm text-gray-600 mt-1">
                Related papers for: <span className="font-medium">{sourceArticle.title.substring(0, 80)}...</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Finding related papers...</span>
            </div>
          ) : totalArticles === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No related papers found for this article.</p>
            </div>
          ) : (
            <>
              {/* Explanation */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How we found these papers:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>📈 <strong>Citations:</strong> Papers that cite your selected article</li>
                  <li>📚 <strong>References:</strong> Papers that your selected article references</li>
                  <li>🔍 <strong>Similar Topics:</strong> Papers with similar titles and keywords</li>
                </ul>
              </div>

              {/* Article Sections */}
              {renderArticleSection(
                "Citations",
                results.citations,
                "Papers that cite your selected article - these build upon its work",
                "📈"
              )}
              
              {renderArticleSection(
                "References", 
                results.references,
                "Papers that your selected article references - foundational work",
                "📚"
              )}
              
              {renderArticleSection(
                "Similar Topics",
                results.similar,
                "Papers with similar titles and research topics",
                "🔍"
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && totalArticles > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedArticles.size} of {totalArticles} papers selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelected}
                  disabled={selectedArticles.size === 0 || !currentCollectionId || addingToCollection}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {addingToCollection ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    `Add Selected to Collection (${selectedArticles.size})`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
