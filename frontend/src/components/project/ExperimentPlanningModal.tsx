/**
 * Experiment Planning Modal
 * 
 * Generates AI-powered experiment plans from protocols.
 * Shows loading state during generation and displays the generated plan.
 * 
 * Week 19-20: Experiment Planning Feature
 */

import React, { useState } from 'react';
import { X, Loader2, Beaker, AlertCircle } from 'lucide-react';
import { createExperimentPlan, CreateExperimentPlanRequest, ExperimentPlan } from '../../lib/api';

interface ExperimentPlanningModalProps {
  protocolId: string;
  protocolName: string;
  projectId: string;
  userId: string;
  onClose: () => void;
  onPlanCreated: (plan: ExperimentPlan) => void;
}

export default function ExperimentPlanningModal({
  protocolId,
  protocolName,
  projectId,
  userId,
  onClose,
  onPlanCreated
}: ExperimentPlanningModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customObjective, setCustomObjective] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const request: CreateExperimentPlanRequest = {
        protocol_id: protocolId,
        project_id: projectId,
      };

      if (customObjective.trim()) {
        request.custom_objective = customObjective.trim();
      }

      if (customNotes.trim()) {
        request.custom_notes = customNotes.trim();
      }

      const plan = await createExperimentPlan(request, userId);
      onPlanCreated(plan);
      onClose();
    } catch (err: any) {
      console.error('Error generating experiment plan:', err);
      setError(err.message || 'Failed to generate experiment plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Beaker className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Generate Experiment Plan</h2>
              <p className="text-sm text-gray-400 mt-0.5">AI-powered planning from protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Protocol Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Source Protocol</div>
            <div className="text-white font-medium">{protocolName}</div>
          </div>

          {/* Custom Objective (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Objective <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={customObjective}
              onChange={(e) => setCustomObjective(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g., Optimize for high-throughput screening, Focus on cost reduction, etc."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide specific goals or constraints for the experiment plan
            </p>
          </div>

          {/* Custom Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Notes <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g., Available equipment, budget constraints, timeline requirements, etc."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Any additional context or constraints to consider
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-red-400 font-medium">Failed to generate plan</div>
                <div className="text-red-300 text-sm mt-1">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating plan with AI...
              </span>
            ) : (
              'Plan will be generated using GPT-4o-mini'
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Beaker className="w-4 h-4" />
                  Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

