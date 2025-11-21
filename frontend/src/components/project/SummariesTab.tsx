'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Target, Beaker, Lightbulb, Clock } from 'lucide-react';

interface NextStep {
  action: string;
  priority: 'high' | 'medium' | 'low';
  estimated_effort: string;
}

interface ProjectSummary {
  summary_id: string;
  project_id: string;
  summary_text: string;
  key_findings: string[];
  protocol_insights: string[];
  experiment_status: string;
  next_steps: NextStep[];
  last_updated: string;
  cache_valid_until: string;
}

interface SummariesTabProps {
  projectId: string;
  userId: string;
}

export default function SummariesTab({ projectId, userId }: SummariesTabProps) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [projectId]);

  const fetchSummary = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = forceRefresh
        ? `/api/proxy/summaries/projects/${projectId}/summary/refresh`
        : `/api/proxy/summaries/projects/${projectId}/summary`;

      const response = await fetch(endpoint, {
        method: forceRefresh ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch summary: ${response.statusText}`);
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSummary(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <span className="ml-4 text-gray-400">Generating project summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchSummary()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">No summary available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Project Summary
          </h2>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {new Date(summary.last_updated).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Overview */}
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Overview
        </h3>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{summary.summary_text}</p>
      </div>

      {/* Key Findings */}
      {summary.key_findings && summary.key_findings.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Key Findings
          </h3>
          <ul className="space-y-3">
            {summary.key_findings.map((finding, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-300 leading-relaxed">{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Protocol Insights */}
      {summary.protocol_insights && summary.protocol_insights.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-green-400" />
            Protocol Insights
          </h3>
          <div className="grid gap-3">
            {summary.protocol_insights.map((insight, index) => (
              <div
                key={index}
                className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
              >
                <p className="text-gray-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experiment Status */}
      {summary.experiment_status && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-orange-400" />
            Experiment Status
          </h3>
          <p className="text-gray-300 leading-relaxed">{summary.experiment_status}</p>
        </div>
      )}

      {/* Next Steps */}
      {summary.next_steps && summary.next_steps.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Recommended Next Steps
          </h3>
          <div className="space-y-3">
            {summary.next_steps.map((step, index) => (
              <div
                key={index}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-200 font-medium mb-2">{step.action}</p>
                    <p className="text-sm text-gray-400">Estimated effort: {step.estimated_effort}</p>
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

      {/* Cache Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Summary cached until {new Date(summary.cache_valid_until).toLocaleString()}</p>
        <p className="mt-1">Click "Refresh" to regenerate with latest data</p>
      </div>
    </div>
  );
}
