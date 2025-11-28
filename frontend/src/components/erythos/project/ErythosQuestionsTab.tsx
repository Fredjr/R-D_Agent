'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Hypothesis {
  hypothesis_id: string;
  hypothesis_text: string;
  status: 'active' | 'supported' | 'refuted' | 'inconclusive';
  evidence_count: number;
  relevant_percentage: number;
}

interface ResearchQuestion {
  question_id: string;
  question_text: string;
}

interface ErythosQuestionsTabProps {
  projectId: string;
}

export function ErythosQuestionsTab({ projectId }: ErythosQuestionsTabProps) {
  const { user } = useAuth();
  const [mainQuestion, setMainQuestion] = useState<string>('');
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState('');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    if (!user?.email) return;
    
    try {
      // Fetch project for research question
      const projectRes = await fetch(`/api/proxy/projects/${projectId}`, {
        headers: { 'User-ID': user.email }
      });
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setMainQuestion(projectData.settings?.research_question || '');
      }

      // Fetch hypotheses
      const hypRes = await fetch(`/api/proxy/projects/${projectId}/hypotheses`, {
        headers: { 'User-ID': user.email }
      });
      if (hypRes.ok) {
        const hypData = await hypRes.json();
        setHypotheses(hypData.hypotheses || hypData || []);
      }
    } catch (error) {
      console.error('Error fetching questions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'supported': return 'text-green-400 bg-green-500/20';
      case 'refuted': return 'text-red-400 bg-red-500/20';
      case 'inconclusive': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Research Question */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">🎯 Main Research Question</h3>
        {mainQuestion ? (
          <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 rounded-lg">
            <p className="text-white text-lg">{mainQuestion}</p>
          </div>
        ) : (
          <div className="p-4 bg-gray-800/50 rounded-lg text-center">
            <p className="text-gray-400 mb-3">No research question defined yet</p>
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
              ➕ Add Research Question
            </button>
          </div>
        )}
      </div>

      {/* Hypotheses Tree */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">💡 Hypotheses</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            ➕ Add Hypothesis
          </button>
        </div>

        {hypotheses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No hypotheses yet. Add one to start testing your research question.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hypotheses.map((hypothesis, index) => (
              <div 
                key={hypothesis.hypothesis_id} 
                className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors border border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-bold text-gray-600">H{index + 1}</div>
                  <div className="flex-1">
                    <p className="text-white mb-2">{hypothesis.hypothesis_text}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-0.5 rounded ${getStatusColor(hypothesis.status)}`}>
                        {hypothesis.status}
                      </span>
                      <span className="text-gray-400">
                        📄 {hypothesis.evidence_count || 0} papers
                      </span>
                      <span className="text-gray-400">
                        ✅ {hypothesis.relevant_percentage || 0}% relevant
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Hypothesis Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Hypothesis</h3>
            <textarea
              value={newHypothesis}
              onChange={(e) => setNewHypothesis(e.target.value)}
              placeholder="Enter your hypothesis..."
              className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                Add Hypothesis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

