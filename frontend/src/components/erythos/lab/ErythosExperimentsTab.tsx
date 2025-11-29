'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosProgressBar } from '../ErythosProgressBar';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProcedureStep {
  step_number: number;
  description: string;
  duration?: string;
  critical_notes?: string;
}

interface Material {
  name: string;
  amount?: string;
  source?: string;
  notes?: string;
}

interface SuccessCriterion {
  criterion: string;
  measurement_method: string;
  target_value: string;
}

interface Experiment {
  plan_id: string;
  plan_name: string;
  title?: string;
  protocol_name?: string;
  protocol_id?: string;
  project_id?: string;
  project_name?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused' | 'draft';
  progress_percentage: number;
  started_at?: string;
  days_active?: number;
  metrics?: { name: string; value: string | number }[];
  objective?: string;
  materials?: Material[];
  procedure?: ProcedureStep[];
  expected_outcomes?: string[];
  success_criteria?: SuccessCriterion[];
  timeline_estimate?: string;
  estimated_cost?: string;
  difficulty_level?: string;
  linked_questions?: string[];
  linked_hypotheses?: string[];
}

interface ErythosExperimentsTabProps {
  projectFilter?: string;
}

export function ErythosExperimentsTab({ projectFilter }: ErythosExperimentsTabProps) {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [showLogDataModal, setShowLogDataModal] = useState(false);
  const [logDataExperiment, setLogDataExperiment] = useState<Experiment | null>(null);
  const [logDataValue, setLogDataValue] = useState('');
  const [logDataNotes, setLogDataNotes] = useState('');

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

  const handleViewExperiment = async (experiment: Experiment) => {
    // Fetch full experiment details if needed
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

  const handleLogData = (experiment: Experiment) => {
    setLogDataExperiment(experiment);
    setLogDataValue('');
    setLogDataNotes('');
    setShowLogDataModal(true);
  };

  const handleViewResults = (experiment: Experiment) => {
    // Open the experiment in detail view with results tab
    handleViewExperiment(experiment);
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
                  <button
                    onClick={() => handleViewExperiment(exp)}
                    className="flex-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm transition-colors"
                  >
                    {exp.status === 'in_progress' ? '▶️ Continue' : '👁️ View'}
                  </button>
                  <button
                    onClick={() => handleLogData(exp)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    📊 Log Data
                  </button>
                  <button
                    onClick={() => handleViewResults(exp)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    📈 Results
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Experiment Detail Modal */}
      {selectedExperiment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedExperiment.plan_name || selectedExperiment.title}</h2>
                <span className={`px-2 py-0.5 rounded text-xs mt-1 inline-block ${getStatusConfig(selectedExperiment.status).badge}`}>
                  {selectedExperiment.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <button onClick={() => setSelectedExperiment(null)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Objective */}
              {selectedExperiment.objective && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">🎯 Objective</h3>
                  <p className="text-gray-300">{selectedExperiment.objective}</p>
                </div>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-3">
                {selectedExperiment.timeline_estimate && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                    ⏱️ {selectedExperiment.timeline_estimate}
                  </span>
                )}
                {selectedExperiment.estimated_cost && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                    💰 {selectedExperiment.estimated_cost}
                  </span>
                )}
                {selectedExperiment.difficulty_level && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                    📊 {selectedExperiment.difficulty_level}
                  </span>
                )}
              </div>

              {/* Progress */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">📈 Progress</h3>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Completion</span>
                  <span>{selectedExperiment.progress_percentage || 0}%</span>
                </div>
                <ErythosProgressBar value={selectedExperiment.progress_percentage || 0} variant="orange" size="md" />
              </div>

              {/* Materials */}
              {selectedExperiment.materials && selectedExperiment.materials.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">🧪 Materials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedExperiment.materials.map((material, i) => (
                      <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">{material.name}</div>
                        {material.amount && <div className="text-sm text-gray-400">Amount: {material.amount}</div>}
                        {material.source && <div className="text-sm text-gray-500">Source: {material.source}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Procedure */}
              {selectedExperiment.procedure && selectedExperiment.procedure.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">📋 Procedure</h3>
                  <div className="space-y-3">
                    {selectedExperiment.procedure.map((step, i) => (
                      <div key={i} className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-orange-500">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {step.step_number}
                          </span>
                          {step.duration && <span className="text-xs text-gray-500">⏱️ {step.duration}</span>}
                        </div>
                        <p className="text-gray-300">{step.description}</p>
                        {step.critical_notes && (
                          <p className="text-sm text-yellow-400 mt-2">⚠️ {step.critical_notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected Outcomes */}
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

              {/* Success Criteria */}
              {selectedExperiment.success_criteria && selectedExperiment.success_criteria.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">📊 Success Criteria</h3>
                  <div className="space-y-3">
                    {selectedExperiment.success_criteria.map((criterion, i) => (
                      <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">{criterion.criterion}</div>
                        <div className="text-sm text-gray-400 mt-1">Method: {criterion.measurement_method}</div>
                        <div className="text-sm text-green-400 mt-1">Target: {criterion.target_value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    handleLogData(selectedExperiment);
                    setSelectedExperiment(null);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  📊 Log Data
                </button>
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

      {/* Log Data Modal */}
      {showLogDataModal && logDataExperiment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-lg">
            <div className="border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">📊 Log Experiment Data</h2>
              <button onClick={() => setShowLogDataModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="text-sm text-orange-400">Logging for</div>
                <div className="text-white font-medium">{logDataExperiment.plan_name || logDataExperiment.title}</div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Data Value</label>
                <input
                  type="text"
                  value={logDataValue}
                  onChange={(e) => setLogDataValue(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Enter measurement or observation..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes</label>
                <textarea
                  value={logDataNotes}
                  onChange={(e) => setLogDataNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24 resize-none"
                  placeholder="Additional notes about this data point..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowLogDataModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Data logging feature coming soon!');
                    setShowLogDataModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Log Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

