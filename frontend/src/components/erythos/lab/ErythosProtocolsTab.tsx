'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProtocolStep {
  step_number: number;
  instruction: string;
  duration?: string;
  temperature?: string;
  notes?: string;
}

interface ProtocolMaterial {
  name: string;
  amount?: string;
  supplier?: string;
  notes?: string;
}

interface Protocol {
  protocol_id: string;
  protocol_name: string;
  protocol_type: string;
  relevance_score?: number;
  difficulty_level: string;
  duration_estimate?: string;
  context_aware?: boolean;
  project_id?: string;
  project_name?: string;
  created_at: string;
  source_pmid?: string;
  materials?: ProtocolMaterial[];
  steps?: ProtocolStep[];
  equipment?: string[];
  key_parameters?: string[];
  expected_outcomes?: string[];
  key_insights?: string[];
  relevance_reasoning?: string;
  affected_questions?: string[];
  affected_hypotheses?: string[];
}

interface ErythosProtocolsTabProps {
  projectFilter?: string;
}

export function ErythosProtocolsTab({ projectFilter }: ErythosProtocolsTabProps) {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planningProtocol, setPlanningProtocol] = useState<Protocol | null>(null);
  const [planName, setPlanName] = useState('');
  const [planObjective, setPlanObjective] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    fetchProtocols();
  }, [projectFilter]);

  const fetchProtocols = async () => {
    if (!user?.email) return;
    
    try {
      // Fetch all protocols - in a real implementation this would be a global endpoint
      const response = await fetch(`/api/proxy/protocols${projectFilter ? `?project_id=${projectFilter}` : ''}`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setProtocols(data.protocols || data || []);
      }
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'clinical_trial': return 'bg-blue-500/20 text-blue-400';
      case 'in_vitro': return 'bg-purple-500/20 text-purple-400';
      case 'in_vivo': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredProtocols = protocols
    .filter(p => typeFilter === 'all' || p.protocol_type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'relevance') return (b.relevance_score || 0) - (a.relevance_score || 0);
      return a.protocol_name.localeCompare(b.protocol_name);
    });

  const handleViewProtocol = async (protocol: Protocol) => {
    // Fetch full protocol details if not already loaded
    if (!protocol.steps && user?.email) {
      try {
        const response = await fetch(`/api/proxy/protocols/${protocol.protocol_id}`, {
          headers: { 'User-ID': user.email }
        });
        if (response.ok) {
          const fullProtocol = await response.json();
          setSelectedProtocol(fullProtocol);
          return;
        }
      } catch (error) {
        console.error('Error fetching protocol details:', error);
      }
    }
    setSelectedProtocol(protocol);
  };

  const handlePlanExperiment = (protocol: Protocol) => {
    setPlanningProtocol(protocol);
    setPlanName(`${protocol.protocol_name} - Experiment Plan`);
    setPlanObjective('');
    setShowPlanModal(true);
  };

  const handleCreatePlan = async () => {
    if (!planningProtocol || !user?.email || !planName.trim()) return;

    setCreatingPlan(true);
    try {
      const response = await fetch(`/api/proxy/experiment-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email
        },
        body: JSON.stringify({
          protocol_id: planningProtocol.protocol_id,
          project_id: planningProtocol.project_id || projectFilter,
          plan_name: planName,
          objective: planObjective,
          status: 'draft'
        })
      });

      if (response.ok) {
        setShowPlanModal(false);
        setPlanningProtocol(null);
        alert('Experiment plan created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create plan: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating experiment plan:', error);
      alert('Failed to create experiment plan');
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleExportProtocol = (protocol: Protocol) => {
    const exportData = {
      protocol_name: protocol.protocol_name,
      protocol_type: protocol.protocol_type,
      difficulty_level: protocol.difficulty_level,
      duration_estimate: protocol.duration_estimate,
      materials: protocol.materials,
      steps: protocol.steps,
      equipment: protocol.equipment,
      key_parameters: protocol.key_parameters,
      expected_outcomes: protocol.expected_outcomes
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${protocol.protocol_name.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="clinical_trial">Clinical Trial</option>
            <option value="in_vitro">In Vitro</option>
            <option value="in_vivo">In Vivo</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="relevance">Relevance</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors">
          📄 Extract Protocol from Paper
        </button>
      </div>

      {/* Protocols Grid */}
      {filteredProtocols.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-gray-400 mb-4">No protocols found</p>
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
            Extract Your First Protocol
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProtocols.map((protocol) => (
            <div
              key={protocol.protocol_id}
              className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 hover:border-purple-500/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/20 flex items-center justify-center">
                  <span className="text-2xl">🧪</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{protocol.protocol_name}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {protocol.relevance_score && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                        {protocol.relevance_score}% Relevant
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(protocol.protocol_type)}`}>
                      {protocol.protocol_type}
                    </span>
                    {protocol.context_aware && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                        🧠 AI Context-Aware
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => handleViewProtocol(protocol)}
                  className="flex-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
                >
                  👁️ View
                </button>
                <button
                  onClick={() => handlePlanExperiment(protocol)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  🧪 Plan Experiment
                </button>
                <button
                  onClick={() => handleExportProtocol(protocol)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  📤 Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Protocol Detail Modal */}
      {selectedProtocol && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{selectedProtocol.protocol_name}</h2>
              <button onClick={() => setSelectedProtocol(null)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Meta info */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-lg text-sm ${getTypeColor(selectedProtocol.protocol_type)}`}>
                  {selectedProtocol.protocol_type}
                </span>
                {selectedProtocol.difficulty_level && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                    Difficulty: {selectedProtocol.difficulty_level}
                  </span>
                )}
                {selectedProtocol.duration_estimate && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                    ⏱️ {selectedProtocol.duration_estimate}
                  </span>
                )}
                {selectedProtocol.source_pmid && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                    📄 PMID: {selectedProtocol.source_pmid}
                  </span>
                )}
              </div>

              {/* Key Insights */}
              {selectedProtocol.key_insights && selectedProtocol.key_insights.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">💡 Key Insights</h3>
                  <ul className="space-y-2">
                    {selectedProtocol.key_insights.map((insight, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials */}
              {selectedProtocol.materials && selectedProtocol.materials.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">🧪 Materials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProtocol.materials.map((material, i) => (
                      <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="font-medium text-white">{material.name}</div>
                        {material.amount && <div className="text-sm text-gray-400">Amount: {material.amount}</div>}
                        {material.notes && <div className="text-sm text-gray-500">{material.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              {selectedProtocol.steps && selectedProtocol.steps.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">📋 Protocol Steps</h3>
                  <div className="space-y-3">
                    {selectedProtocol.steps.map((step, i) => (
                      <div key={i} className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {step.step_number}
                          </span>
                          {step.duration && <span className="text-xs text-gray-500">⏱️ {step.duration}</span>}
                        </div>
                        <p className="text-gray-300">{step.instruction}</p>
                        {step.notes && <p className="text-sm text-gray-500 mt-2">📝 {step.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected Outcomes */}
              {selectedProtocol.expected_outcomes && selectedProtocol.expected_outcomes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">🎯 Expected Outcomes</h3>
                  <ul className="space-y-2">
                    {selectedProtocol.expected_outcomes.map((outcome, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    handlePlanExperiment(selectedProtocol);
                    setSelectedProtocol(null);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  🧪 Plan Experiment from This Protocol
                </button>
                <button
                  onClick={() => handleExportProtocol(selectedProtocol)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  📤 Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Experiment Modal */}
      {showPlanModal && planningProtocol && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-lg">
            <div className="border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🧪 Plan New Experiment</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="text-sm text-purple-400">Based on Protocol</div>
                <div className="text-white font-medium">{planningProtocol.protocol_name}</div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Experiment Plan Name *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Enter experiment name..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Objective</label>
                <textarea
                  value={planObjective}
                  onChange={(e) => setPlanObjective(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24 resize-none"
                  placeholder="What do you want to achieve with this experiment?"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  disabled={!planName.trim() || creatingPlan}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {creatingPlan ? 'Creating...' : 'Create Experiment Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

