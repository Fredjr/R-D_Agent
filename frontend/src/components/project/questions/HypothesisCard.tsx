/**
 * HypothesisCard Component
 * Displays a single hypothesis with status, confidence level, and evidence counts
 * Phase 1, Week 5-6: Hypothesis UI Components + Evidence Display
 */

import { useState, useEffect } from 'react';
import type { Hypothesis, HypothesisEvidence } from '@/lib/types/questions';
import {
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  QuestionMarkCircleIcon,
  MinusCircleIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { getHypothesisEvidence, removeHypothesisEvidence } from '@/lib/api/questions';

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  userId: string;
  onEdit?: (hypothesisId: string) => void;
  onDelete?: (hypothesisId: string) => void;
  onLinkEvidence?: (hypothesisId: string) => void;
  onUpdateStatus?: (hypothesisId: string, status: string) => void;
  onViewPaper?: (pmid: string) => void;
  compact?: boolean;
}

export function HypothesisCard({
  hypothesis,
  userId,
  onEdit,
  onDelete,
  onLinkEvidence,
  onUpdateStatus,
  onViewPaper,
  compact = false
}: HypothesisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidence, setEvidence] = useState<HypothesisEvidence[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);

  // Load evidence when evidence section is expanded
  // Week 24: Always reload to catch AI-generated evidence from recent triages
  useEffect(() => {
    if (showEvidence) {
      loadEvidence();
    }
  }, [showEvidence]);

  const loadEvidence = async () => {
    setIsLoadingEvidence(true);
    try {
      const data = await getHypothesisEvidence(hypothesis.hypothesis_id, userId);
      setEvidence(data);
    } catch (error) {
      console.error('Failed to load hypothesis evidence:', error);
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  const handleRemoveEvidence = async (evidenceId: string) => {
    if (!confirm('Remove this evidence link?')) return;

    try {
      await removeHypothesisEvidence(hypothesis.hypothesis_id, evidenceId, userId);
      setEvidence(evidence.filter(e => e.evidence_id !== evidenceId));
    } catch (error) {
      console.error('Failed to remove evidence:', error);
      alert('Failed to remove evidence. Please try again.');
    }
  };

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'proposed':
        return {
          icon: <QuestionMarkCircleIcon className="w-4 h-4" />,
          label: 'Proposed',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        };
      case 'testing':
        return {
          icon: <BeakerIcon className="w-4 h-4" />,
          label: 'Testing',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20'
        };
      case 'supported':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          label: 'Supported',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        };
      case 'rejected':
        return {
          icon: <XCircleIcon className="w-4 h-4" />,
          label: 'Rejected',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        };
      case 'inconclusive':
        return {
          icon: <MinusCircleIcon className="w-4 h-4" />,
          label: 'Inconclusive',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        };
      default:
        return {
          icon: <QuestionMarkCircleIcon className="w-4 h-4" />,
          label: status,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        };
    }
  };

  // Type configuration
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mechanistic': return 'Mechanistic';
      case 'predictive': return 'Predictive';
      case 'descriptive': return 'Descriptive';
      case 'null': return 'Null';
      default: return type;
    }
  };

  const statusConfig = getStatusConfig(hypothesis.status);
  const hasEvidence = hypothesis.supporting_evidence_count > 0 || hypothesis.contradicting_evidence_count > 0;

  return (
    <div className={`
      bg-[var(--spotify-card-bg)] 
      border border-[var(--spotify-border-gray)] 
      rounded-lg 
      p-4
      hover:border-[var(--spotify-light-gray)] 
      transition-all
      ${compact ? 'p-3' : 'p-4'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Expand button + Content */}
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Expand/Collapse button */}
          {hypothesis.description && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-1 hover:bg-[var(--spotify-light-gray)] rounded transition-colors mt-0.5"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}

          {/* Hypothesis text and metadata */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium mb-2 break-words">
              {hypothesis.hypothesis_text}
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Status badge */}
              <span className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-md
                ${statusConfig.color} ${statusConfig.bgColor} border ${statusConfig.borderColor}
              `}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>

              {/* Type badge */}
              <span className="text-gray-400 px-2 py-1 bg-gray-500/10 rounded-md border border-gray-500/20">
                {getTypeLabel(hypothesis.hypothesis_type)}
              </span>

              {/* Confidence level */}
              <span className="text-gray-400">
                Confidence: <span className="text-white font-medium">{hypothesis.confidence_level}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Link Evidence button */}
          {onLinkEvidence && (
            <button
              onClick={() => onLinkEvidence(hypothesis.hypothesis_id)}
              className="p-2 rounded-lg hover:bg-[var(--spotify-light-gray)] transition-colors"
              title="Link evidence"
            >
              <LinkIcon className="w-4 h-4 text-purple-400" />
            </button>
          )}

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={() => onEdit(hypothesis.hypothesis_id)}
              className="p-2 rounded-lg hover:bg-[var(--spotify-light-gray)] transition-colors"
              title="Edit hypothesis"
            >
              <PencilIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={() => onDelete(hypothesis.hypothesis_id)}
              className="p-2 rounded-lg hover:bg-[var(--spotify-light-gray)] transition-colors"
              title="Delete hypothesis"
            >
              <TrashIcon className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Evidence counts - Clickable to expand */}
      {hasEvidence && (
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="mt-3 flex items-center gap-3 text-xs hover:bg-[var(--spotify-light-gray)] p-2 rounded-lg transition-colors w-full"
        >
          {hypothesis.supporting_evidence_count > 0 && (
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircleIcon className="w-4 h-4" />
              <span>{hypothesis.supporting_evidence_count} supporting</span>
            </div>
          )}
          {hypothesis.contradicting_evidence_count > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <XCircleIcon className="w-4 h-4" />
              <span>{hypothesis.contradicting_evidence_count} contradicting</span>
            </div>
          )}
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${showEvidence ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Evidence List - Collapsible */}
      {showEvidence && (
        <div className="mt-3 pt-3 border-t border-[var(--spotify-border-gray)]">
          {isLoadingEvidence ? (
            <div className="text-center py-4 text-[var(--spotify-light-text)] text-sm">
              Loading evidence...
            </div>
          ) : evidence.length === 0 ? (
            <div className="text-center py-4 text-[var(--spotify-light-text)] text-sm">
              No evidence linked yet
            </div>
          ) : (
            <div className="space-y-2">
              {evidence.map((ev) => {
                // Get evidence type styling
                const getEvidenceTypeStyle = (type: string) => {
                  switch (type) {
                    case 'supports':
                      return { icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-500/10' };
                    case 'contradicts':
                      return { icon: <XCircleIcon className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' };
                    case 'neutral':
                      return { icon: <MinusCircleIcon className="w-4 h-4" />, color: 'text-gray-400', bg: 'bg-gray-500/10' };
                    default:
                      return { icon: <BeakerIcon className="w-4 h-4" />, color: 'text-gray-400', bg: 'bg-gray-500/10' };
                  }
                };

                // Get strength styling
                const getStrengthStyle = (strength: string) => {
                  switch (strength) {
                    case 'weak':
                      return { color: 'text-yellow-400', label: 'Weak' };
                    case 'moderate':
                      return { color: 'text-blue-400', label: 'Moderate' };
                    case 'strong':
                      return { color: 'text-purple-400', label: 'Strong' };
                    default:
                      return { color: 'text-gray-400', label: strength };
                  }
                };

                const typeStyle = getEvidenceTypeStyle(ev.evidence_type);
                const strengthStyle = getStrengthStyle(ev.strength);

                return (
                  <div
                    key={ev.evidence_id}
                    className="p-3 rounded-lg bg-[var(--spotify-light-gray)] hover:bg-[var(--spotify-medium-gray)] transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Paper title */}
                        <button
                          onClick={() => onViewPaper?.(ev.article_pmid)}
                          className="text-sm text-[var(--spotify-white)] hover:text-[var(--spotify-green)] font-medium line-clamp-2 text-left mb-2"
                        >
                          {ev.article_title || 'Untitled Paper'}
                        </button>

                        {/* Evidence type and strength badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${typeStyle.color} ${typeStyle.bg}`}>
                            {typeStyle.icon}
                            {ev.evidence_type}
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${strengthStyle.color} bg-opacity-10`}>
                            <SignalIcon className="w-3 h-3" />
                            {strengthStyle.label}
                          </span>
                          {/* AI-generated indicator */}
                          {!ev.added_by && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30" title="Automatically linked by AI during triage">
                              <span>🤖</span>
                              <span>AI-Generated</span>
                            </span>
                          )}
                        </div>

                        {/* Key finding */}
                        {ev.key_finding && (
                          <p className="text-xs text-[var(--spotify-light-text)] italic">
                            "{ev.key_finding}"
                          </p>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveEvidence(ev.evidence_id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors"
                        title="Remove evidence"
                      >
                        <XCircleIcon className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expanded description */}
      {isExpanded && hypothesis.description && (
        <div className="mt-3 pt-3 border-t border-[var(--spotify-border-gray)]">
          <div className="text-sm text-gray-300 whitespace-pre-wrap">
            {hypothesis.description}
          </div>
        </div>
      )}

      {/* Quick status update buttons */}
      {onUpdateStatus && hypothesis.status !== 'supported' && hypothesis.status !== 'rejected' && (
        <div className="mt-3 pt-3 border-t border-[var(--spotify-border-gray)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Quick update:</span>
            <button
              onClick={() => onUpdateStatus(hypothesis.hypothesis_id, 'supported')}
              className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              Mark as Supported
            </button>
            <button
              onClick={() => onUpdateStatus(hypothesis.hypothesis_id, 'rejected')}
              className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Mark as Rejected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

