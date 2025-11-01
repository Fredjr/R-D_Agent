'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, SparklesIcon, XMarkIcon, BookmarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';
import { useAuth } from '@/contexts/AuthContext';

interface ExploreTabProps {
  project: any;
  onRefresh: () => void;
}

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  citation_count?: number;
  doi?: string;
}

export function ExploreTab({ project, onRefresh }: ExploreTabProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PubMedArticle[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<PubMedArticle | null>(null);
  const [savingPmids, setSavingPmids] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      console.log('🔍 Searching PubMed for:', searchQuery);

      // Call PubMed search API
      const response = await fetch(`/api/proxy/pubmed/search?query=${encodeURIComponent(searchQuery)}&limit=20`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Search results:', data);

      setSearchResults(data.articles || []);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSelectedArticle(null);
  };

  const handleSaveArticle = async (article: PubMedArticle) => {
    if (!user?.email) {
      alert('Please sign in to save articles');
      return;
    }

    setSavingPmids(prev => new Set(prev).add(article.pmid));

    try {
      const response = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          name: `Saved from Search: ${article.title.substring(0, 50)}...`,
          description: `Article saved from PubMed search`,
          pmids: [article.pmid]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      console.log('✅ Article saved to collection');
      onRefresh();
    } catch (error) {
      console.error('❌ Error saving article:', error);
      alert('Failed to save article. Please try again.');
    } finally {
      setSavingPmids(prev => {
        const next = new Set(prev);
        next.delete(article.pmid);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Explore Papers</h2>
              <p className="text-sm text-gray-600">Search PubMed and visualize research networks</p>
            </div>
          </div>
          {hasSearched && (
            <button
              onClick={clearSearch}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear Search
            </button>
          )}
        </div>

        {/* PubMed Search Bar */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PubMed for papers (e.g., 'CRISPR gene editing', 'PMID:40310133', 'machine learning cancer')"
              className="w-full pl-12 pr-32 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-gray-600">Quick tips:</span>
          <button
            onClick={() => setSearchQuery('machine learning')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            machine learning
          </button>
          <button
            onClick={() => setSearchQuery('CRISPR')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            CRISPR
          </button>
          <button
            onClick={() => setSearchQuery('PMID:40310133')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            PMID:40310133
          </button>
          <button
            onClick={() => setSearchQuery('neural networks')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            neural networks
          </button>
        </div>
      </div>

      {/* Search Results or Network View */}
      {hasSearched ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results for "{searchQuery}"
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isSearching ? 'Searching...' : `Found ${searchResults.length} articles`}
            </p>
          </div>

          {isSearching ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Searching PubMed...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {searchResults.map((article) => (
                <div
                  key={article.pmid}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Article Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium">{article.journal}</span>
                        <span>•</span>
                        <span>{article.year}</span>
                        <span>•</span>
                        <span className="text-blue-600">PMID: {article.pmid}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveArticle(article)}
                        disabled={savingPmids.has(article.pmid)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                        title="Save to collection"
                      >
                        {savingPmids.has(article.pmid) ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <BookmarkIcon className="w-5 h-5" />
                        )}
                      </button>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View on PubMed"
                      >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  {/* Authors */}
                  {article.authors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Authors:</span>{' '}
                        {article.authors.slice(0, 3).join(', ')}
                        {article.authors.length > 3 && ` +${article.authors.length - 3} more`}
                      </p>
                    </div>
                  )}

                  {/* Abstract */}
                  {article.abstract && (
                    <div className="text-sm text-gray-600 leading-relaxed">
                      <p className="line-clamp-3">{article.abstract}</p>
                    </div>
                  )}

                  {/* DOI */}
                  {article.doi && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        DOI: <span className="font-mono">{article.doi}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600">No results found for "{searchQuery}"</p>
              <p className="text-sm text-gray-500 mt-2">Try a different search term or PMID</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Network Visualization */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <MultiColumnNetworkView
              sourceType="project"
              sourceId={project.project_id}
              projectId={project.project_id}
            />
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 How to use the network view:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Click on nodes</strong> to view paper details in the side panel</li>
              <li>• <strong>Use navigation modes</strong> (Similar Work, Earlier Work, Later Work, Authors) to explore connections</li>
              <li>• <strong>Add papers to collections</strong> by clicking the "Add to Collection" button</li>
              <li>• <strong>Create notes</strong> directly from paper cards</li>
              <li>• <strong>Zoom and pan</strong> the graph to explore the network</li>
              <li>• <strong>Node size</strong> represents citation count (bigger = more citations)</li>
              <li>• <strong>Node color</strong> represents publication year (darker = more recent)</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default ExploreTab;
