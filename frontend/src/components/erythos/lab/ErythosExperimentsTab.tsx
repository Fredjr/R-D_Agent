'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosProgressBar } from '../ErythosProgressBar';

interface Experiment {
  plan_id: string;
  plan_name: string; // Backend uses plan_name, not title
  title?: string; // Keep for backwards compatibility
  protocol_name?: string;
  project_id?: string;
  project_name?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused' | 'draft';
  progress_percentage: number;
  started_at?: string;
  days_active?: number;
  metrics?: { name: string; value: string | number }[];
}

interface ErythosExperimentsTabProps {
  projectFilter?: string;
}

export function ErythosExperimentsTab({ projectFilter }: ErythosExperimentsTabProps) {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchExperiments();
  }, [projectFilter]);

  const fetchExperiments = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/proxy/experiment-plans${projectFilter ? `?project_id=${projectFilter}` : ''}`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.plans || data || []);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'in_progress': return { color: 'orange', dot: 'bg-orange-500 animate-pulse', badge: 'bg-orange-500/20 text-orange-400' };
      case 'completed': return { color: 'green', dot: 'bg-green-500', badge: 'bg-green-500/20 text-green-400' };
      case 'paused': return { color: 'yellow', dot: 'bg-yellow-500', badge: 'bg-yellow-500/20 text-yellow-400' };
      case 'planning': case 'draft': return { color: 'gray', dot: 'bg-gray-500', badge: 'bg-gray-500/20 text-gray-400' };
      default: return { color: 'gray', dot: 'bg-gray-500', badge: 'bg-gray-500/20 text-gray-400' };
    }
  };

  const filteredExperiments = experiments.filter(e => statusFilter === 'all' || e.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="planning">Planned</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors">
          ➕ New Experiment
        </button>
      </div>

      {/* Experiments Grid */}
      {filteredExperiments.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <div className="text-4xl mb-3">🔬</div>
          <p className="text-gray-400 mb-4">No experiments found</p>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
            Create Your First Experiment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredExperiments.map((exp) => {
            const statusConfig = getStatusConfig(exp.status);
            return (
              <div
                key={exp.plan_id}
                className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 hover:border-orange-500/50 transition-all"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${statusConfig.dot}`}></div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{exp.plan_name || exp.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      {exp.protocol_name && <span>📋 {exp.protocol_name}</span>}
                      {exp.project_name && <span>• {exp.project_name}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig.badge}`}>
                        {exp.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {exp.days_active && (
                        <span className="text-xs text-gray-500">Day {exp.days_active}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{exp.progress_percentage || 0}%</span>
                  </div>
                  <ErythosProgressBar value={exp.progress_percentage || 0} variant="orange" size="sm" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm transition-colors">
                    {exp.status === 'in_progress' ? '▶️ Continue' : '👁️ View'}
                  </button>
                  <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                    📊 Log Data
                  </button>
                  <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                    📈 Results
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

