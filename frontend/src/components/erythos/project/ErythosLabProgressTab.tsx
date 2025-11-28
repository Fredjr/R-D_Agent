'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosProgressBar } from '../ErythosProgressBar';

interface LabMetrics {
  protocols: number;
  experiments: number;
  inProgress: number;
  completed: number;
  dataPoints: number;
  successRate: number;
}

interface Experiment {
  plan_id: string;
  plan_name: string;  // Backend uses plan_name, not title
  title?: string;     // Keep for backwards compatibility
  status: 'planning' | 'in_progress' | 'completed' | 'paused' | 'draft';
  progress_percentage: number;
}

interface ErythosLabProgressTabProps {
  projectId: string;
}

export function ErythosLabProgressTab({ projectId }: ErythosLabProgressTabProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<LabMetrics>({
    protocols: 0,
    experiments: 0,
    inProgress: 0,
    completed: 0,
    dataPoints: 0,
    successRate: 0,
  });
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabData();
  }, [projectId]);

  const fetchLabData = async () => {
    if (!user?.email) return;
    
    try {
      // Fetch protocols
      const protocolsRes = await fetch(`/api/proxy/projects/${projectId}/protocols`, {
        headers: { 'User-ID': user.email }
      });
      let protocolCount = 0;
      if (protocolsRes.ok) {
        const data = await protocolsRes.json();
        protocolCount = (data.protocols || data || []).length;
      }

      // Fetch experiments
      const experimentsRes = await fetch(`/api/proxy/projects/${projectId}/experiment-plans`, {
        headers: { 'User-ID': user.email }
      });
      let experimentData: Experiment[] = [];
      if (experimentsRes.ok) {
        const data = await experimentsRes.json();
        experimentData = data.experiment_plans || data || [];
        setExperiments(experimentData);
      }

      // Calculate metrics
      const inProgress = experimentData.filter(e => e.status === 'in_progress').length;
      const completed = experimentData.filter(e => e.status === 'completed').length;
      const successRate = experimentData.length > 0 ? Math.round((completed / experimentData.length) * 100) : 0;

      setMetrics({
        protocols: protocolCount,
        experiments: experimentData.length,
        inProgress,
        completed,
        dataPoints: experimentData.reduce((sum, e) => sum + (e.progress_percentage || 0), 0),
        successRate,
      });
    } catch (error) {
      console.error('Error fetching lab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Protocols', value: metrics.protocols, icon: '📋', color: 'purple' },
          { label: 'Experiments', value: metrics.experiments, icon: '🧪', color: 'red' },
          { label: 'In Progress', value: metrics.inProgress, icon: '⏳', color: 'blue' },
          { label: 'Completed', value: metrics.completed, icon: '✅', color: 'green' },
          { label: 'Data Points', value: metrics.dataPoints, icon: '📊', color: 'orange' },
          { label: 'Success Rate', value: `${metrics.successRate}%`, icon: '🎯', color: 'yellow' },
        ].map((metric, index) => (
          <div key={index} className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-xl mb-1">{metric.icon}</div>
            <div className="text-2xl font-bold text-white">{metric.value}</div>
            <div className="text-xs text-gray-400">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Experiments Status */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">🧪 Experiments Status</h3>
          <a
            href="/lab"
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
          >
            Go to Lab →
          </a>
        </div>

        {experiments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No experiments yet. Create one in the Lab.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {experiments.slice(0, 3).map((experiment) => (
              <div key={experiment.plan_id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{experiment.plan_name || experiment.title || 'Untitled Experiment'}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(experiment.status)}`}>
                    {experiment.status.replace('_', ' ')}
                  </span>
                </div>
                <ErythosProgressBar value={experiment.progress_percentage || 0} variant="purple" size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

