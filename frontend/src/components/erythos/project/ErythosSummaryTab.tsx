'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectAnalysis } from '@/hooks/useProjectAnalysis';
import { FileText, RefreshCw, Clock, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

interface ErythosSummaryTabProps {
  projectId: string;
}

/**
 * ErythosSummaryTab - Project Summary feature in Erythos theme
 * 
 * Features:
 * - Comprehensive project summary generation
 * - Key findings from papers and protocols
 * - Experiment status overview
 * - Next steps recommendations
 * - Timeline of research events
 */
export function ErythosSummaryTab({ projectId }: ErythosSummaryTabProps) {
  const { user } = useAuth();
  const { summary, loading, error, regenerateAnalysis } = useProjectAnalysis(
    projectId,
    user?.email || '',
    true
  );
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    await regenerateAnalysis();
    setRegenerating(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (!user?.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400">Please sign in to view project summary</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-4 text-gray-400">Generating project summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Project Summary
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            AI-generated summary of your research progress
            {summary?.last_updated && (
              <span className="ml-2">
                • Last updated: {new Date(summary.last_updated).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loading || regenerating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {summary ? (
        <>
          {/* Summary Text */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              📝 Overview
            </h3>
            <p className="text-gray-300 leading-relaxed">{summary.summary_text}</p>
          </div>

          {/* Key Findings */}
          {summary.key_findings && summary.key_findings.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Key Findings
              </h3>
              <ul className="space-y-3">
                {summary.key_findings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Protocol Insights */}
          {summary.protocol_insights && summary.protocol_insights.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Protocol Insights
              </h3>
              <ul className="space-y-3">
                {summary.protocol_insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Experiment Status */}
          {summary.experiment_status && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                🧪 Experiment Status
              </h3>
              <p className="text-gray-300">{summary.experiment_status}</p>
            </div>
          )}

          {/* Next Steps */}
          {summary.next_steps && summary.next_steps.length > 0 && (
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Recommended Next Steps
              </h3>
              <div className="space-y-4">
                {summary.next_steps.map((step, index) => (
                  <div key={index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white font-medium">{step.action}</p>
                        {step.estimated_effort && (
                          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.estimated_effort}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(step.priority)}`}>
                        {step.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">No summary available yet. Click "Regenerate" to generate one.</p>
        </div>
      )}
    </div>
  );
}

