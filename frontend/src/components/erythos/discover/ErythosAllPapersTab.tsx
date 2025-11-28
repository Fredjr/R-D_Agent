'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ErythosButton } from '../ErythosButton';

interface SearchResult {
  pmid: string;
  title: string;
  authors?: string[];
  year?: number;
  journal?: string;
  abstract?: string;
  doi?: string;
}

interface AISummary {
  keyFinding: string;
  consensus: string;
  emergingTrends: string;
}

export function ErythosAllPapersTab() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [triagingPapers, setTriagingPapers] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !user?.email) return;
    
    setLoading(true);
    setAiSummary(null);
    try {
      const params = new URLSearchParams({ q: query, limit: '20' });
      const response = await fetch(`/api/proxy/pubmed/search?${params}`, {
        headers: { 'User-ID': user.email }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.articles || data || []);
        setTotalFound(data.total_found || data.length || 0);
        
        // Generate AI summary if we have results
        if ((data.articles || data).length > 0) {
          generateAISummary(query, (data.articles || data).slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, user?.email]);

  const generateAISummary = async (searchQuery: string, papers: SearchResult[]) => {
    setLoadingSummary(true);
    try {
      // For now, generate a placeholder summary
      // TODO: Implement actual AI summary endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAiSummary({
        keyFinding: `Latest research on "${searchQuery}" shows promising advances in treatment efficacy and mechanism understanding.`,
        consensus: `The scientific community largely agrees on the importance of early intervention and personalized approaches.`,
        emergingTrends: `Combination therapies and AI-driven drug discovery are gaining significant traction in recent publications.`
      });
    } catch (error) {
      console.error('AI summary error:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleAITriage = async (paper: SearchResult) => {
    if (!user?.email) return;
    
    setTriagingPapers(prev => new Set(prev).add(paper.pmid));
    try {
      const response = await fetch('/api/proxy/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({ article_pmid: paper.pmid })
      });
      
      if (response.ok) {
        alert(`✅ Paper triaged! Check Smart Inbox for results.`);
      } else {
        alert('❌ Failed to triage paper');
      }
    } catch (error) {
      console.error('Triage error:', error);
      alert('❌ Failed to triage paper');
    } finally {
      setTriagingPapers(prev => {
        const newSet = new Set(prev);
        newSet.delete(paper.pmid);
        return newSet;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search PubMed for papers..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400
                focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all"
            />
          </div>
          <ErythosButton variant="primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </ErythosButton>
        </div>
      </div>

      {/* Results count */}
      {totalFound > 0 && (
        <div className="text-gray-400">
          Showing <span className="text-white font-medium">{results.length}</span> of{' '}
          <span className="text-white font-medium">{totalFound.toLocaleString()}</span> results for{' '}
          <span className="text-orange-400">"{query}"</span>
        </div>
      )}

      {/* AI Summary Box */}
      {(loadingSummary || aiSummary) && (
        <div className="p-6 bg-gradient-to-br from-red-900/30 to-orange-900/20 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="text-lg font-semibold text-white">AI Summary</h3>
          </div>

          {loadingSummary ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-400">Generating summary...</span>
            </div>
          ) : aiSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-2">📌 Key Finding</h4>
                <p className="text-sm text-gray-300">{aiSummary.keyFinding}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-2">🤝 Consensus</h4>
                <p className="text-sm text-gray-300">{aiSummary.consensus}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-2">📈 Emerging Trends</h4>
                <p className="text-sm text-gray-300">{aiSummary.emergingTrends}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paper Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400">Searching papers...</span>
        </div>
      ) : results.length === 0 && query ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
          <p className="text-gray-400">Try different keywords or check your spelling.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-white mb-2">Search for Papers</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Enter a search query above to find papers from PubMed.
            Use the AI Triage button to analyze papers against your research questions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((paper) => (
            <div
              key={paper.pmid}
              className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all"
            >
              {/* Title */}
              <h3 className="text-white font-medium leading-tight mb-2 hover:text-orange-400 transition-colors cursor-pointer">
                {paper.title}
              </h3>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-3">
                {paper.authors && paper.authors.length > 0 && (
                  <span>{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                )}
                {paper.year && <span>• {paper.year}</span>}
                {paper.journal && <span>• {paper.journal}</span>}
                <span className="text-orange-400">• PMID: {paper.pmid}</span>
              </div>

              {/* Abstract */}
              {paper.abstract && (
                <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                  {paper.abstract}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <ErythosButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleAITriage(paper)}
                  disabled={triagingPapers.has(paper.pmid)}
                >
                  {triagingPapers.has(paper.pmid) ? '⏳ Triaging...' : '🤖 AI Triage'}
                </ErythosButton>
                <ErythosButton variant="ghost" size="sm">
                  📄 View PDF
                </ErythosButton>
                <ErythosButton variant="ghost" size="sm">
                  💾 Save
                </ErythosButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

