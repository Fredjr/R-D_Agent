'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosProgressBar } from '../ErythosProgressBar';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LabMetrics {
  protocols: number;
  experiments: number;
  inProgress: number;
  completed: number;
  dataPoints: number;
  successRate: number;
}

interface Protocol {
  protocol_id: string;
  protocol_name: string;
  protocol_type: string;
  relevance_score?: number;
  source_pmid?: string;
}

interface ProcedureStep {
  step_number: number;
  description: string;
  duration?: string;
  critical_notes?: string;
}

interface Experiment {
  plan_id: string;
  plan_name: string;
  title?: string;
  protocol_id?: string;
  protocol_name?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused' | 'draft';
  progress_percentage: number;
  objective?: string;
  procedure?: ProcedureStep[];
  expected_outcomes?: string[];
  timeline_estimate?: string;
  linked_questions?: string[];
  linked_hypotheses?: string[];
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
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

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
      let protocolData: Protocol[] = [];
      if (protocolsRes.ok) {
        const data = await protocolsRes.json();
        protocolData = data.protocols || data || [];
        setProtocols(protocolData);
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
        protocols: protocolData.length,
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

  const handleViewExperiment = async (experiment: Experiment) => {
    if (!experiment.procedure && user?.email) {
      try {
        const response = await fetch(`/api/proxy/experiment-plans/${experiment.plan_id}`, {
          headers: { 'User-ID': user.email }
        });
        if (response.ok) {
          const fullExperiment = await response.json();
          setSelectedExperiment(fullExperiment);
          return;
        }
      } catch (error) {
        console.error('Error fetching experiment details:', error);
      }
    }
    setSelectedExperiment(experiment);
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

      {/* Protocols Section */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">📋 Protocols</h3>
          <a
            href="/lab"
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
          >
            View All in Lab →
          </a>
        </div>

        {protocols.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No protocols yet. Extract one from a paper in the Lab.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {protocols.slice(0, 3).map((protocol) => (
              <div
                key={protocol.protocol_id}
                onClick={() => setSelectedProtocol(protocol)}
                className="p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{protocol.protocol_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{protocol.protocol_type}</span>
                      {protocol.source_pmid && (
                        <span className="text-xs text-blue-400">PMID: {protocol.source_pmid}</span>
                      )}
                    </div>
                  </div>
                  {protocol.relevance_score && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                      {protocol.relevance_score}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
            {experiments.slice(0, 5).map((experiment) => (
              <div
                key={experiment.plan_id}
                onClick={() => handleViewExperiment(experiment)}
                className="p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium">{experiment.plan_name || experiment.title || 'Untitled Experiment'}</h4>
                    {experiment.protocol_name && (
                      <span className="text-xs text-gray-400">📋 {experiment.protocol_name}</span>
                    )}
                  </div>
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

      {/* Experiment Detail Modal */}
      {selectedExperiment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedExperiment.plan_name || selectedExperiment.title}</h2>
                <span className={`px-2 py-0.5 rounded text-xs mt-1 inline-block ${getStatusColor(selectedExperiment.status)}`}>
                  {selectedExperiment.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <button onClick={() => setSelectedExperiment(null)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedExperiment.objective && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">🎯 Objective</h3>
                  <p className="text-gray-300">{selectedExperiment.objective}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">📈 Progress</h3>
                <ErythosProgressBar value={selectedExperiment.progress_percentage || 0} variant="purple" size="md" />
              </div>

              {selectedExperiment.procedure && selectedExperiment.procedure.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">📋 Procedure</h3>
                  <div className="space-y-3">
                    {selectedExperiment.procedure.map((step, i) => (
                      <div key={i} className="p-3 bg-gray-800/50 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {step.step_number}
                          </span>
                          {step.duration && <span className="text-xs text-gray-500">⏱️ {step.duration}</span>}
                        </div>
                        <p className="text-gray-300 text-sm">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedExperiment.expected_outcomes && selectedExperiment.expected_outcomes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">🎯 Expected Outcomes</h3>
                  <ul className="space-y-2">
                    {selectedExperiment.expected_outcomes.map((outcome, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <a
                  href="/lab"
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-center"
                >
                  Open in Lab
                </a>
                <button
                  onClick={() => setSelectedExperiment(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Detail Modal */}
      {selectedProtocol && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-lg">
            <div className="border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{selectedProtocol.protocol_name}</h2>
              <button onClick={() => setSelectedProtocol(null)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                  {selectedProtocol.protocol_type}
                </span>
                {selectedProtocol.source_pmid && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                    📄 PMID: {selectedProtocol.source_pmid}
                  </span>
                )}
                {selectedProtocol.relevance_score && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                    {selectedProtocol.relevance_score}% Relevant
                  </span>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <a
                  href="/lab"
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-center"
                >
                  View Full Details in Lab
                </a>
                <button
                  onClick={() => setSelectedProtocol(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

