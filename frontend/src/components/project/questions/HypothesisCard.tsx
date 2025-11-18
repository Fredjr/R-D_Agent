/**
 * HypothesisCard Component
 * Displays a single hypothesis with status, confidence level, and evidence counts
 * Phase 1, Week 5: Hypothesis UI Components
 */

import { useState } from 'react';
import type { Hypothesis } from '@/lib/types/questions';
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
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  onEdit?: (hypothesisId: string) => void;
  onDelete?: (hypothesisId: string) => void;
  onLinkEvidence?: (hypothesisId: string) => void;
  onUpdateStatus?: (hypothesisId: string, status: string) => void;
  compact?: boolean;
}

export function HypothesisCard({
  hypothesis,
  onEdit,
  onDelete,
  onLinkEvidence,
  onUpdateStatus,
  compact = false
}: HypothesisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

      {/* Evidence counts */}
      {hasEvidence && (
        <div className="mt-3 flex items-center gap-3 text-xs">
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

