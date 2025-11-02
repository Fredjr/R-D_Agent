'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Step5SeedPaperProps {
  researchQuestion: string;
  researchInterests: string[];
  onComplete: (seedPaper: { pmid: string; title: string } | null) => void;
  onBack: () => void;
}

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  abstract: string;
}

export default function Step5SeedPaper({
  researchQuestion,
  researchInterests,
  onComplete,
  onBack,
}: Step5SeedPaperProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PubMedArticle[]>([]);
  const [selectedPmid, setSelectedPmid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Generate smart search query from research question
  useEffect(() => {
    const query = generateSearchQuery(researchQuestion, researchInterests);
    setSearchQuery(query);
    // Auto-search on mount
    if (query) {
      performSearch(query);
    }
  }, []);

  const generateSearchQuery = (question: string, interests: string[]): string => {
    // Remove question words and extract keywords
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'are', 'is', 'the', 'of', 'in', 'to', 'for', 'and', 'or'];
    
    let query = question.toLowerCase();
    
    // Remove question marks and punctuation
    query = query.replace(/[?!.,;:]/g, ' ');
    
    // Split into words and filter out question words
    const words = query.split(/\s+/).filter(word => 
      word.length > 3 && !questionWords.includes(word)
    );
    
    // Take first 5 meaningful words
    const keywords = words.slice(0, 5).join(' ');
    
    // If no good keywords, use first research interest
    if (keywords.length < 5 && interests.length > 0) {
      return interests[0];
    }
    
    return keywords || 'research';
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      console.log('🔍 Searching PubMed for:', query);
      
      const response = await fetch(`/api/proxy/pubmed/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'User-ID': 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search PubMed');
      }

      const data = await response.json();
      console.log('📄 Search results:', data);

      if (data.articles && data.articles.length > 0) {
        setSearchResults(data.articles);
        setError(null);
      } else {
        setSearchResults([]);
        setError('No papers found. Try a different search query.');
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setError('Failed to search PubMed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleSelectPaper = (pmid: string) => {
    setSelectedPmid(pmid);
  };

  const handleConfirmSelection = () => {
    if (!selectedPmid) {
      setError('Please select a paper');
      return;
    }

    const selectedPaper = searchResults.find(paper => paper.pmid === selectedPmid);
    if (selectedPaper) {
      onComplete({
        pmid: selectedPaper.pmid,
        title: selectedPaper.title,
      });
    }
  };

  const handleSkip = () => {
    onComplete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <SparklesIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Find Your Seed Paper
        </h2>
        <p className="text-gray-600">
          Start your research journey by selecting a foundational paper
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keywords to search PubMed..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Auto-generated from your research question. Feel free to modify!
          </p>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Search Results */}
      {!loading && hasSearched && searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Your Seed Paper ({searchResults.length} results)
            </h3>
            {selectedPmid && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Paper selected
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchResults.map((paper) => (
              <div
                key={paper.pmid}
                onClick={() => handleSelectPaper(paper.pmid)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPmid === paper.pmid
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={selectedPmid === paper.pmid}
                    onChange={() => handleSelectPaper(paper.pmid)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {paper.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {paper.authors.slice(0, 3).join(', ')}
                      {paper.authors.length > 3 && ` et al.`}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {paper.journal} • {paper.year} • PMID: {paper.pmid}
                    </p>
                    {paper.abstract && (
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {paper.abstract.substring(0, 200)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && hasSearched && searchResults.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500">No papers found. Try a different search query.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
        >
          ← Back
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Skip for Now
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedPmid}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Continue with Selected Paper →
          </button>
        </div>
      </div>
    </div>
  );
}

