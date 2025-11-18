'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { LinkHypothesisEvidenceRequest } from '@/lib/types/questions';
import { SpotifyTabButton } from '@/components/project/shared/SpotifyTabButton';

interface Article {
  pmid: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
}

interface LinkHypothesisEvidenceModalProps {
  hypothesisId: string;
  hypothesisText: string;
  projectId: string;
  onClose: () => void;
  onLink: (evidence: LinkHypothesisEvidenceRequest[]) => Promise<void>;
}

/**
 * LinkHypothesisEvidenceModal - Modal for linking papers to hypotheses
 * Allows users to select papers, set evidence type (supports/contradicts/neutral),
 * evidence strength (weak/moderate/strong), and key findings
 * 
 * Phase 1, Week 6: Hypothesis-Evidence Linking
 */
export function LinkHypothesisEvidenceModal({
  hypothesisId,
  hypothesisText,
  projectId,
  onClose,
  onLink
}: LinkHypothesisEvidenceModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPmids, setSelectedPmids] = useState<Set<string>>(new Set());
  const [evidenceType, setEvidenceType] = useState<'supports' | 'contradicts' | 'neutral'>('supports');
  const [strength, setStrength] = useState<'weak' | 'moderate' | 'strong'>('moderate');
  const [keyFindings, setKeyFindings] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // Load articles from project
  useEffect(() => {
    loadArticles();
  }, [projectId]);

  const loadArticles = async () => {
    setIsLoadingArticles(true);
    try {
      // Fetch articles from the project's collections
      const response = await fetch(`/api/proxy/articles/project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const togglePaperSelection = (pmid: string) => {
    const newSelected = new Set(selectedPmids);
    if (newSelected.has(pmid)) {
      newSelected.delete(pmid);
    } else {
      newSelected.add(pmid);
    }
    setSelectedPmids(newSelected);
  };

  const handleLink = async () => {
    if (selectedPmids.size === 0) {
      alert('Please select at least one paper');
      return;
    }

    setIsLoading(true);
    try {
      const evidenceRequests: LinkHypothesisEvidenceRequest[] = Array.from(selectedPmids).map(pmid => ({
        article_pmid: pmid,
        evidence_type: evidenceType,
        strength: strength,
        key_finding: keyFindings.trim() || undefined
      }));

      await onLink(evidenceRequests);
      onClose();
    } catch (error) {
      console.error('Failed to link evidence:', error);
      alert('Failed to link evidence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAuthors = (authors: string[]) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    return `${authors[0]} et al.`;
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[var(--spotify-dark-gray)] rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--spotify-medium-gray)]">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-[var(--spotify-white)] mb-1">
              Link Evidence to Hypothesis
            </h2>
            <p className="text-sm text-[var(--spotify-light-text)] line-clamp-2">
              {hypothesisText}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Paper Selection */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--spotify-white)] mb-3">
              📄 Select Papers
            </h3>

            {/* Search */}
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--spotify-light-text)]" />
              <input
                type="text"
                placeholder="Search papers by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-medium-gray)] rounded-lg text-[var(--spotify-white)] placeholder-[var(--spotify-light-text)] focus:outline-none focus:border-[var(--spotify-green)]"
              />
            </div>

            {/* Paper List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoadingArticles ? (
                <div className="text-center py-8 text-[var(--spotify-light-text)]">
                  Loading papers...
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-8 text-[var(--spotify-light-text)]">
                  {searchQuery ? 'No papers match your search' : 'No papers available'}
                </div>
              ) : (
                filteredArticles.map((article) => {
                  const isSelected = selectedPmids.has(article.pmid);
                  return (
                    <button
                      key={article.pmid}
                      onClick={() => togglePaperSelection(article.pmid)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[var(--spotify-green)]/20 border-[var(--spotify-green)]'
                          : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] hover:border-[var(--spotify-light-text)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 text-[var(--spotify-green)] rounded focus:ring-[var(--spotify-green)]"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[var(--spotify-white)] mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-xs text-[var(--spotify-light-text)]">
                            {formatAuthors(article.authors)}
                            {article.journal && ` • ${article.journal}`}
                            {article.year && ` • ${article.year}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Evidence Type */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--spotify-white)] mb-3">
              📊 Evidence Type
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setEvidenceType('supports')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  evidenceType === 'supports'
                    ? 'bg-green-500/20 border-green-500 text-green-500'
                    : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
                }`}
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Supports</span>
              </button>
              <button
                onClick={() => setEvidenceType('contradicts')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  evidenceType === 'contradicts'
                    ? 'bg-red-500/20 border-red-500 text-red-500'
                    : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
                }`}
              >
                <XCircleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Contradicts</span>
              </button>
              <button
                onClick={() => setEvidenceType('neutral')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  evidenceType === 'neutral'
                    ? 'bg-gray-500/20 border-gray-500 text-gray-400'
                    : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
                }`}
              >
                <MinusCircleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Neutral</span>
              </button>
            </div>
          </div>

          {/* Evidence Strength */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--spotify-white)] mb-3">
              💪 Evidence Strength
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStrength('weak')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  strength === 'weak'
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                    : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
                }`}
              >
                <SignalIcon className="w-5 h-5 opacity-40" />
                <span className="text-sm font-medium">Weak</span>
              </button>
              <button
                onClick={() => setStrength('moderate')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  strength === 'moderate'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-500'
                    : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
                }`}
              >
                <SignalIcon className="w-5 h-5 opacity-70" />
                <span className="text-sm font-medium">Moderate</span>
              </button>
              <button
                onClick={() => setStrength('strong')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  strength === 'strong'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-500'
                    : 'bg-[var(--spotify-medium-gray)] border-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] hover:border-[var(--spotify-light-text)]'
                }`}
              >
                <SignalIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Strong</span>
              </button>
            </div>
          </div>

          {/* Key Findings */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--spotify-white)] mb-3">
              📝 Key Findings (Optional)
            </h3>
            <textarea
              value={keyFindings}
              onChange={(e) => setKeyFindings(e.target.value)}
              placeholder="Describe the key finding from this paper that relates to your hypothesis..."
              rows={3}
              className="w-full px-4 py-3 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-medium-gray)] rounded-lg text-[var(--spotify-white)] placeholder-[var(--spotify-light-text)] focus:outline-none focus:border-[var(--spotify-green)] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--spotify-medium-gray)]">
          <SpotifyTabButton
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            Cancel
          </SpotifyTabButton>
          <SpotifyTabButton
            onClick={handleLink}
            variant="primary"
            disabled={isLoading || selectedPmids.size === 0}
          >
            {isLoading ? 'Linking...' : `Link ${selectedPmids.size} Paper${selectedPmids.size !== 1 ? 's' : ''}`}
          </SpotifyTabButton>
        </div>
      </div>
    </div>
  );
}


