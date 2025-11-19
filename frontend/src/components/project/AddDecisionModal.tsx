"use client";

import React, { useState, useEffect } from 'react';
import { createDecision, updateDecision, DecisionData } from '@/lib/api';

// User type from AuthContext
interface User {
  user_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  category?: string;
  role?: string;
  institution?: string;
  subject_area?: string;
  created_at: string;
}

interface AddDecisionModalProps {
  projectId: string;
  user: User | null;
  decision?: DecisionData | null;
  onClose: () => void;
}

export default function AddDecisionModal({ 
  projectId, 
  user, 
  decision, 
  onClose 
}: AddDecisionModalProps) {
  const [formData, setFormData] = useState({
    decision_type: decision?.decision_type || 'other' as 'pivot' | 'methodology' | 'scope' | 'hypothesis' | 'other',
    title: decision?.title || '',
    description: decision?.description || '',
    rationale: decision?.rationale || '',
    alternatives_considered: decision?.alternatives_considered?.join('\n') || '',
    impact_assessment: decision?.impact_assessment || '',
    affected_questions: decision?.affected_questions?.join(', ') || '',
    affected_hypotheses: decision?.affected_hypotheses?.join(', ') || '',
    related_pmids: decision?.related_pmids?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.user_id) return;
    
    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        project_id: projectId,
        decision_type: formData.decision_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        rationale: formData.rationale.trim() || undefined,
        alternatives_considered: formData.alternatives_considered
          .split('\n')
          .map(a => a.trim())
          .filter(a => a.length > 0),
        impact_assessment: formData.impact_assessment.trim() || undefined,
        affected_questions: formData.affected_questions
          .split(',')
          .map(q => q.trim())
          .filter(q => q.length > 0),
        affected_hypotheses: formData.affected_hypotheses
          .split(',')
          .map(h => h.trim())
          .filter(h => h.length > 0),
        related_pmids: formData.related_pmids
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0),
      };

      if (decision) {
        // Update existing decision
        await updateDecision(decision.decision_id, user.user_id, payload);
        console.log('✅ Decision updated');
      } else {
        // Create new decision
        await createDecision(payload, user.user_id);
        console.log('✅ Decision created');
      }

      onClose();
    } catch (error) {
      console.error('Error saving decision:', error);
      setError('Failed to save decision. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            {decision ? 'Edit Decision' : 'Add Decision'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Decision Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Decision Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.decision_type}
              onChange={(e) => setFormData({ ...formData, decision_type: e.target.value as any })}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              required
            >
              <option value="pivot">🔄 Pivot - Major direction change</option>
              <option value="methodology">🔬 Methodology - Research method change</option>
              <option value="scope">🎯 Scope - Project scope adjustment</option>
              <option value="hypothesis">💡 Hypothesis - Hypothesis modification</option>
              <option value="other">📋 Other - General decision</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Switch from in vitro to in vivo studies"
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the decision and its context..."
              rows={4}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              required
            />
          </div>

          {/* Rationale */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rationale (Optional)
            </label>
            <textarea
              value={formData.rationale}
              onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
              placeholder="Why was this decision made?"
              rows={3}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Alternatives Considered */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alternatives Considered (Optional)
            </label>
            <textarea
              value={formData.alternatives_considered}
              onChange={(e) => setFormData({ ...formData, alternatives_considered: e.target.value })}
              placeholder="One alternative per line..."
              rows={3}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Enter each alternative on a new line</p>
          </div>

          {/* Impact Assessment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Impact Assessment (Optional)
            </label>
            <textarea
              value={formData.impact_assessment}
              onChange={(e) => setFormData({ ...formData, impact_assessment: e.target.value })}
              placeholder="What impact will this decision have?"
              rows={3}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Affected Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Affected Questions (Optional)
            </label>
            <input
              type="text"
              value={formData.affected_questions}
              onChange={(e) => setFormData({ ...formData, affected_questions: e.target.value })}
              placeholder="Question IDs, comma-separated"
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter question IDs separated by commas</p>
          </div>

          {/* Affected Hypotheses */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Affected Hypotheses (Optional)
            </label>
            <input
              type="text"
              value={formData.affected_hypotheses}
              onChange={(e) => setFormData({ ...formData, affected_hypotheses: e.target.value })}
              placeholder="Hypothesis IDs, comma-separated"
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter hypothesis IDs separated by commas</p>
          </div>

          {/* Related PMIDs */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Related Papers (Optional)
            </label>
            <input
              type="text"
              value={formData.related_pmids}
              onChange={(e) => setFormData({ ...formData, related_pmids: e.target.value })}
              placeholder="PMIDs, comma-separated (e.g., 12345678, 87654321)"
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter PubMed IDs separated by commas</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : decision ? 'Update Decision' : 'Add Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

