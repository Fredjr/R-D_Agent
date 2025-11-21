'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Link2, AlertTriangle, Lightbulb, BarChart3, RefreshCw } from 'lucide-react';

interface Insight {
  title: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
  priority?: 'high' | 'medium' | 'low';
  confidence?: 'high' | 'medium' | 'low';
  entities?: string[];
  suggestion?: string;
}

interface Recommendation {
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  estimated_effort: string;
}

interface Metrics {
  total_questions: number;
  question_status: Record<string, number>;
  total_hypotheses: number;
  hypothesis_status: Record<string, number>;
  avg_hypothesis_confidence: number;
  total_papers: number;
  must_read_papers: number;
  avg_paper_score: number;
  total_protocols: number;
  total_plans: number;
  plan_status: Record<string, number>;
}

interface ProjectInsights {
  progress_insights: Insight[];
  connection_insights: Insight[];
  gap_insights: Insight[];
  trend_insights: Insight[];
  recommendations: Recommendation[];
  metrics: Metrics;
}

interface InsightsTabProps {
  projectId: string;
  userId: string;
}

export default function InsightsTab({ projectId, userId }: InsightsTabProps) {
  const [insights, setInsights] = useState<ProjectInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [projectId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proxy/insights/projects/${projectId}/insights`, {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`);
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <span className="ml-4 text-gray-400">Analyzing project data...</span>
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
            onClick={fetchInsights}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">No insights available yet</p>
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
            AI Insights
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered analysis of your research project
          </p>
        </div>
        <button
          onClick={fetchInsights}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      {insights.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{insights.metrics.total_questions}</div>
            <div className="text-sm text-gray-400">Research Questions</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{insights.metrics.total_hypotheses}</div>
            <div className="text-sm text-gray-400">Hypotheses</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{insights.metrics.must_read_papers}/{insights.metrics.total_papers}</div>
            <div className="text-sm text-gray-400">Must-Read Papers</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">{insights.metrics.total_plans}</div>
            <div className="text-sm text-gray-400">Experiment Plans</div>
          </div>
        </div>
      )}

      {/* Progress Insights */}
      {insights.progress_insights && insights.progress_insights.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Research Progress
          </h3>
          <div className="space-y-4">
            {insights.progress_insights.map((insight, index) => (
              <div key={index} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-semibold text-blue-300">{insight.title}</h4>
                  {insight.impact && (
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getImpactColor(insight.impact)}`}>
                      {insight.impact.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Insights */}
      {insights.connection_insights && insights.connection_insights.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-400" />
            Cross-Cutting Connections
          </h3>
          <div className="space-y-4">
            {insights.connection_insights.map((insight, index) => (
              <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 mb-2">{insight.title}</h4>
                <p className="text-gray-300 text-sm mb-3">{insight.description}</p>
                {insight.entities && insight.entities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {insight.entities.map((entity, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {entity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gap Insights */}
      {insights.gap_insights && insights.gap_insights.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Gaps & Opportunities
          </h3>
          <div className="space-y-4">
            {insights.gap_insights.map((insight, index) => (
              <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-semibold text-yellow-300">{insight.title}</h4>
                  {insight.priority && (
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(insight.priority)}`}>
                      {insight.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
                {insight.suggestion && (
                  <div className="mt-3 pt-3 border-t border-yellow-500/20">
                    <p className="text-yellow-200 text-sm font-medium">💡 Suggestion:</p>
                    <p className="text-gray-300 text-sm mt-1">{insight.suggestion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Insights */}
      {insights.trend_insights && insights.trend_insights.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Emerging Trends
          </h3>
          <div className="space-y-4">
            {insights.trend_insights.map((insight, index) => (
              <div key={index} className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-semibold text-green-300">{insight.title}</h4>
                  {insight.confidence && (
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getImpactColor(insight.confidence)}`}>
                      {insight.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Recommended Actions
          </h3>
          <div className="space-y-4">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:border-purple-500/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">{rec.action}</h4>
                    <p className="text-gray-300 text-sm mb-2">{rec.rationale}</p>
                    <p className="text-gray-400 text-xs">⏱️ Estimated effort: {rec.estimated_effort}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Insights generated in real-time from your project data</p>
        <p className="mt-1">Click "Refresh" to regenerate with latest changes</p>
      </div>
    </div>
  );
}

