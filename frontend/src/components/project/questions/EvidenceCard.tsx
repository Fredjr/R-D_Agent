'use client';

import React from 'react';
import {
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { QuestionEvidence } from '@/lib/types/questions';
import { SpotifyTabCard } from '@/components/project/shared/SpotifyTabCard';
import { SpotifyTabIconButton } from '@/components/project/shared/SpotifyTabButton';

interface EvidenceCardProps {
  evidence: QuestionEvidence;
  onRemove?: (evidenceId: string) => void;
  onViewPaper?: (pmid: string) => void;
  compact?: boolean;
}

/**
 * EvidenceCard - Display linked evidence for a research question
 * Shows paper details, evidence type, relevance score, and key findings
 */
export function EvidenceCard({
  evidence,
  onRemove,
  onViewPaper,
  compact = false
}: EvidenceCardProps) {
  
  // Evidence type styling
  const getEvidenceTypeConfig = (type: string) => {
    switch (type) {
      case 'supports':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          label: 'Supports',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        };
      case 'contradicts':
        return {
          icon: <XCircleIcon className="w-4 h-4" />,
          label: 'Contradicts',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        };
      case 'neutral':
        return {
          icon: <MinusCircleIcon className="w-4 h-4" />,
          label: 'Neutral',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        };
      case 'context':
        return {
          icon: <DocumentTextIcon className="w-4 h-4" />,
          label: 'Context',
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20'
        };
      case 'methodology':
        return {
          icon: <BeakerIcon className="w-4 h-4" />,
          label: 'Methodology',
          color: 'text-indigo-500',
          bgColor: 'bg-indigo-500/10',
          borderColor: 'border-indigo-500/20'
        };
      default:
        return {
          icon: <MinusCircleIcon className="w-4 h-4" />,
          label: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        };
    }
  };

  // Relevance score styling (1-10)
  const getRelevanceColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const typeConfig = getEvidenceTypeConfig(evidence.evidence_type);
  const relevanceColor = getRelevanceColor(evidence.relevance_score);

  // Format authors
  const formatAuthors = (authors?: string[]) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
    return `${authors[0]} et al.`;
  };

  return (
    <SpotifyTabCard className="p-4">
      <div className="flex items-start gap-3">
        {/* Paper Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-[var(--spotify-green)]/20 rounded-lg flex items-center justify-center">
          <DocumentTextIcon className="w-5 h-5 text-[var(--spotify-green)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 
            className="text-sm font-semibold text-[var(--spotify-white)] mb-1 line-clamp-2 cursor-pointer hover:text-[var(--spotify-green)] transition-colors"
            onClick={() => onViewPaper?.(evidence.article_pmid)}
          >
            {evidence.article_title || 'Untitled Paper'}
          </h4>

          {/* Authors and Year */}
          <p className="text-xs text-[var(--spotify-light-text)] mb-2">
            {formatAuthors(evidence.article_authors)}
            {evidence.article_journal && ` • ${evidence.article_journal}`}
            {evidence.article_year && ` • ${evidence.article_year}`}
          </p>

          {/* Evidence Type and Relevance */}
          <div className="flex items-center gap-3 mb-2">
            {/* Evidence Type Badge */}
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${typeConfig.bgColor} ${typeConfig.borderColor}`}>
              <span className={typeConfig.color}>{typeConfig.icon}</span>
              <span className={`text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
            </div>

            {/* Relevance Score */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--spotify-light-text)]">Relevance:</span>
              <span className={`text-xs font-bold ${relevanceColor}`}>
                {'⭐'.repeat(Math.min(evidence.relevance_score, 10))} ({evidence.relevance_score}/10)
              </span>
            </div>
          </div>

          {/* Key Findings */}
          {!compact && evidence.key_finding && (
            <div className="mt-2 p-2 bg-[var(--spotify-medium-gray)] rounded-md">
              <p className="text-xs text-[var(--spotify-light-text)] mb-1 font-medium">💡 Key Findings:</p>
              <p className="text-xs text-[var(--spotify-white)] line-clamp-3">
                {evidence.key_finding}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {onRemove && (
          <SpotifyTabIconButton
            icon={<TrashIcon />}
            onClick={() => onRemove(evidence.evidence_id)}
            variant="ghost"
            size="sm"
            title="Remove evidence"
            aria-label="Remove evidence"
          />
        )}
      </div>
    </SpotifyTabCard>
  );
}

