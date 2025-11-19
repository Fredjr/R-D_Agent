"use client";

import React, { useState } from 'react';
import { DecisionData } from '@/lib/api';

interface DecisionCardProps {
  decision: DecisionData;
  onEdit: () => void;
  onDelete: () => void;
  getTypeIcon: (type: string) => string;
  getTypeColor: (type: string) => string;
}

export default function DecisionCard({ 
  decision, 
  onEdit, 
  onDelete, 
  getTypeIcon, 
  getTypeColor 
}: DecisionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Type Badge */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getTypeColor(decision.decision_type)}`}>
            <span>{getTypeIcon(decision.decision_type)}</span>
            <span className="capitalize">{decision.decision_type}</span>
          </div>

          {/* Title */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{decision.title}</h3>
            <p className="text-sm text-gray-400">{formatDate(decision.decided_at)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Edit decision"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete decision"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-4">{decision.description}</p>

      {/* Expand/Collapse Button */}
      {(decision.rationale || 
        decision.alternatives_considered.length > 0 || 
        decision.impact_assessment ||
        decision.affected_questions.length > 0 ||
        decision.affected_hypotheses.length > 0 ||
        decision.related_pmids.length > 0) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors mb-4"
        >
          {expanded ? '▼ Hide Details' : '▶ Show Details'}
        </button>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          {/* Rationale */}
          {decision.rationale && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">💭 Rationale</h4>
              <p className="text-gray-300 text-sm">{decision.rationale}</p>
            </div>
          )}

          {/* Alternatives Considered */}
          {decision.alternatives_considered.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">🔀 Alternatives Considered</h4>
              <ul className="list-disc list-inside space-y-1">
                {decision.alternatives_considered.map((alt, idx) => (
                  <li key={idx} className="text-gray-300 text-sm">{alt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Impact Assessment */}
          {decision.impact_assessment && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">📊 Impact Assessment</h4>
              <p className="text-gray-300 text-sm">{decision.impact_assessment}</p>
            </div>
          )}

          {/* Affected Questions */}
          {decision.affected_questions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">❓ Affected Questions</h4>
              <div className="flex flex-wrap gap-2">
                {decision.affected_questions.map((qId) => (
                  <span key={qId} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    Question {qId.slice(0, 8)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Affected Hypotheses */}
          {decision.affected_hypotheses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">💡 Affected Hypotheses</h4>
              <div className="flex flex-wrap gap-2">
                {decision.affected_hypotheses.map((hId) => (
                  <span key={hId} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                    Hypothesis {hId.slice(0, 8)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Papers */}
          {decision.related_pmids.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">📄 Related Papers</h4>
              <div className="flex flex-wrap gap-2">
                {decision.related_pmids.map((pmid) => (
                  <a
                    key={pmid}
                    href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                  >
                    PMID: {pmid}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

