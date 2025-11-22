/**
 * Enhanced Protocol Card Component
 * 
 * Displays context-aware protocol with:
 * - Relevance score badge
 * - Affected questions/hypotheses
 * - Key insights
 * - Actionable recommendations
 * 
 * Week 19: Intelligent Protocol Extraction UI
 */

import React from 'react';
import { Beaker, Lightbulb, Target, TrendingUp, AlertCircle, Shield, CheckCircle, XCircle } from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  priority: string;
  action_type: string;
  estimated_effort?: string;
  expected_impact?: string;
  prerequisites?: string[];
}

interface EnhancedProtocol {
  protocol_id: string;
  protocol_name: string;
  protocol_type: string;
  relevance_score?: number;
  affected_questions?: string[];
  affected_hypotheses?: string[];
  key_insights?: string[];
  recommendations?: Recommendation[];
  context_aware?: boolean;
  extraction_method?: string;
  difficulty_level: string;
  duration_estimate?: string;
  extraction_confidence?: number;
  confidence_explanation?: {
    confidence_level: string;
    explanation: string;
  };
  context_relevance?: string;  // Phase 2.2: Protocol comparison
}

interface EnhancedProtocolCardProps {
  protocol: EnhancedProtocol;
  onViewDetails: () => void;
  onDelete?: () => void;
}

export default function EnhancedProtocolCard({ 
  protocol, 
  onViewDetails,
  onDelete 
}: EnhancedProtocolCardProps) {
  
  // Get relevance badge color
  const getRelevanceBadge = () => {
    const score = protocol.relevance_score || 50;
    if (score >= 80) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
        🎯 {score}% Relevant
      </span>;
    } else if (score >= 60) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
        ✓ {score}% Relevant
      </span>;
    } else if (score >= 40) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        ~ {score}% Relevant
      </span>;
    } else {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
        {score}% Relevant
      </span>;
    }
  };
  
  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">Low</span>;
      default:
        return null;
    }
  };

  const getConfidenceBadge = () => {
    if (!protocol.extraction_confidence) return null;

    const confidence = protocol.extraction_confidence;
    const level = protocol.confidence_explanation?.confidence_level ||
                  (confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low');

    let icon, bgColor, textColor, borderColor;

    if (confidence >= 80) {
      icon = <CheckCircle className="w-3 h-3" />;
      bgColor = 'bg-green-500/20';
      textColor = 'text-green-400';
      borderColor = 'border-green-500/30';
    } else if (confidence >= 50) {
      icon = <AlertCircle className="w-3 h-3" />;
      bgColor = 'bg-yellow-500/20';
      textColor = 'text-yellow-400';
      borderColor = 'border-yellow-500/30';
    } else {
      icon = <XCircle className="w-3 h-3" />;
      bgColor = 'bg-red-500/20';
      textColor = 'text-red-400';
      borderColor = 'border-red-500/30';
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} flex items-center gap-1`}
        title={protocol.confidence_explanation?.explanation || `Confidence: ${confidence}/100`}
      >
        <Shield className="w-3 h-3" />
        {level} ({confidence})
      </span>
    );
  };
  
  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 hover:border-blue-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{protocol.protocol_name}</h3>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {getRelevanceBadge()}
            {getConfidenceBadge()}
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {protocol.protocol_type}
            </span>
            {protocol.context_aware && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                🧠 AI Context-Aware
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Protocol Comparison (Phase 2.2) */}
      {protocol.context_relevance && (
        <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Protocol Comparison</span>
          </div>
          <p className="text-xs text-gray-400 whitespace-pre-wrap">{protocol.context_relevance}</p>
        </div>
      )}

      {/* Key Insights */}
      {protocol.key_insights && protocol.key_insights.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Key Insights</span>
          </div>
          <ul className="space-y-1">
            {protocol.key_insights.slice(0, 2).map((insight, idx) => (
              <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected Questions/Hypotheses */}
      {((protocol.affected_questions && protocol.affected_questions.length > 0) ||
        (protocol.affected_hypotheses && protocol.affected_hypotheses.length > 0)) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Addresses</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {protocol.affected_questions && protocol.affected_questions.length > 0 && (
              <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {protocol.affected_questions.length} Question{protocol.affected_questions.length > 1 ? 's' : ''}
              </span>
            )}
            {protocol.affected_hypotheses && protocol.affected_hypotheses.length > 0 && (
              <span className="px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {protocol.affected_hypotheses.length} Hypothesis{protocol.affected_hypotheses.length > 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Top Recommendation */}
      {protocol.recommendations && protocol.recommendations.length > 0 && (
        <div className="mb-4 p-3 bg-green-500/5 border border-green-500/20 rounded">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-green-400">{protocol.recommendations[0].title}</span>
                {getPriorityBadge(protocol.recommendations[0].priority)}
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{protocol.recommendations[0].description}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View Full Details
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

