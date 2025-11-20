'use client';

/**
 * Alert Card Component
 * 
 * Displays individual project alerts with:
 * - Alert type icon and color
 * - Severity indicator
 * - Title and description
 * - Affected questions/hypotheses
 * - Related papers
 * - Quick actions (dismiss, view paper)
 * 
 * Week 14: Project Alerts Frontend UI
 */

import React from 'react';
import { ProjectAlert } from '@/lib/api';
import { 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  FileText,
  X,
  ExternalLink,
  Clock
} from 'lucide-react';

interface AlertCardProps {
  alert: ProjectAlert;
  onDismiss: (alertId: string) => void;
  onViewPaper?: (pmid: string) => void;
  className?: string;
}

export function AlertCard({ alert, onDismiss, onViewPaper, className = '' }: AlertCardProps) {
  
  // Get alert type icon and color
  const getAlertTypeConfig = (type: string) => {
    switch (type) {
      case 'high_impact_paper':
        return {
          icon: TrendingUp,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          label: 'High Impact'
        };
      case 'contradicting_evidence':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'Contradiction'
        };
      case 'gap_identified':
        return {
          icon: Lightbulb,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          label: 'Research Gap'
        };
      case 'new_paper':
        return {
          icon: FileText,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          label: 'New Paper'
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          label: 'Alert'
        };
    }
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const typeConfig = getAlertTypeConfig(alert.alert_type);
  const Icon = typeConfig.icon;

  return (
    <div
      className={`
        relative p-4 rounded-lg border transition-all duration-200
        ${typeConfig.bgColor} ${typeConfig.borderColor}
        hover:shadow-lg hover:scale-[1.01]
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
            <Icon className={`w-5 h-5 ${typeConfig.color}`} />
          </div>
          
          {/* Type and Severity */}
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(alert.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(alert.alert_id)}
          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-white font-semibold mb-2 line-clamp-2">
        {alert.title}
      </h4>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-3 line-clamp-3">
        {alert.description}
      </p>

      {/* Affected Items */}
      {(alert.affected_questions.length > 0 || alert.affected_hypotheses.length > 0) && (
        <div className="mb-3 space-y-1">
          {alert.affected_questions.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Questions:</span>
              <div className="flex flex-wrap gap-1">
                {alert.affected_questions.slice(0, 3).map((qId, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full"
                  >
                    Q{idx + 1}
                  </span>
                ))}
                {alert.affected_questions.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{alert.affected_questions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {alert.affected_hypotheses.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Hypotheses:</span>
              <div className="flex flex-wrap gap-1">
                {alert.affected_hypotheses.slice(0, 3).map((hId, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full"
                  >
                    H{idx + 1}
                  </span>
                ))}
                {alert.affected_hypotheses.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{alert.affected_hypotheses.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Papers */}
      {alert.related_pmids.length > 0 && onViewPaper && (
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-700">
          <span className="text-xs text-gray-400">Related Papers:</span>
          <div className="flex flex-wrap gap-2">
            {alert.related_pmids.slice(0, 2).map((pmid, idx) => (
              <button
                key={idx}
                onClick={() => onViewPaper(pmid)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-blue-400 rounded transition-colors"
              >
                <span>PMID: {pmid}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ))}
            {alert.related_pmids.length > 2 && (
              <span className="text-xs text-gray-400 self-center">
                +{alert.related_pmids.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Required Badge */}
      {alert.action_required && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full animate-pulse">
            Action Required
          </span>
        </div>
      )}
    </div>
  );
}

