'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Decision {
  decision_id: string;
  title: string;
  description: string;
  decision_type: 'research' | 'methodology' | 'pivot' | 'conclusion';
  created_at: string;
  outcome?: string;
}

interface ErythosDecisionsTabProps {
  projectId: string;
}

export function ErythosDecisionsTab({ projectId }: ErythosDecisionsTabProps) {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchDecisions();
  }, [projectId]);

  const fetchDecisions = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/decisions`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setDecisions(data.decisions || data || []);
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'research': return '🎯';
      case 'methodology': return '🔬';
      case 'pivot': return '↪️';
      case 'conclusion': return '✅';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">✅ Decisions</h3>
          <p className="text-sm text-gray-400">Track important decisions made during your research</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
        >
          ➕ Add Decision
        </button>
      </div>

      {/* Decision Timeline */}
      {decisions.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-400 mb-4">No decisions recorded yet</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Record Your First Decision
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700"></div>
          
          {/* Decision Items */}
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div key={decision.decision_id} className="relative pl-14">
                {/* Timeline Dot */}
                <div className="absolute left-4 w-5 h-5 rounded-full bg-green-500 border-4 border-[#121212] z-10"></div>
                
                {/* Decision Card */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 hover:border-green-500/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getTypeIcon(decision.decision_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium">{decision.title}</h4>
                        <span className="text-xs text-gray-500">{formatDate(decision.created_at)}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{decision.description}</p>
                      {decision.outcome && (
                        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <span className="text-green-400 text-sm">Outcome: {decision.outcome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Decision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Add Decision</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Decision title..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
              />
              <textarea
                placeholder="Description..."
                className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
              />
              <select className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                <option value="research">🎯 Research Direction</option>
                <option value="methodology">🔬 Methodology Change</option>
                <option value="pivot">↪️ Pivot</option>
                <option value="conclusion">✅ Conclusion</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                Add Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

