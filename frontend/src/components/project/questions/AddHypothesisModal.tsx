/**
 * AddHypothesisModal Component
 * Modal for creating and editing hypotheses
 * Phase 1, Week 5: Hypothesis UI Components
 */

import { useState, useEffect } from 'react';
import type { Hypothesis, HypothesisType, HypothesisStatus } from '@/lib/types/questions';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddHypothesisModalProps {
  questionId: string;
  questionText: string;
  projectId: string;
  hypothesis?: Hypothesis | null; // If provided, we're editing
  onClose: () => void;
  onSave: (data: {
    hypothesis_text: string;
    hypothesis_type: HypothesisType;
    description?: string;
    status: HypothesisStatus;
    confidence_level: number;
  }) => Promise<void>;
}

export function AddHypothesisModal({
  questionId,
  questionText,
  projectId,
  hypothesis,
  onClose,
  onSave
}: AddHypothesisModalProps) {
  const isEditing = !!hypothesis;

  // Form state
  const [hypothesisText, setHypothesisText] = useState(hypothesis?.hypothesis_text || '');
  const [hypothesisType, setHypothesisType] = useState<HypothesisType>(hypothesis?.hypothesis_type || 'mechanistic');
  const [description, setDescription] = useState(hypothesis?.description || '');
  const [status, setStatus] = useState<HypothesisStatus>(hypothesis?.status || 'proposed');
  const [confidenceLevel, setConfidenceLevel] = useState(hypothesis?.confidence_level || 50);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle save
  const handleSave = async () => {
    if (!hypothesisText.trim()) {
      setError('Hypothesis text is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        hypothesis_text: hypothesisText.trim(),
        hypothesis_type: hypothesisType,
        description: description.trim() || undefined,
        status,
        confidence_level: confidenceLevel
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save hypothesis');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hypothesisText, hypothesisType, description, status, confidenceLevel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[var(--spotify-card-bg)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--spotify-border-gray)]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Hypothesis' : 'Add Hypothesis'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              For question: {questionText}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--spotify-light-gray)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Hypothesis text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hypothesis <span className="text-red-400">*</span>
            </label>
            <textarea
              value={hypothesisText}
              onChange={(e) => setHypothesisText(e.target.value)}
              placeholder="Enter your hypothesis..."
              className="w-full px-3 py-2 bg-[var(--spotify-bg)] border border-[var(--spotify-border-gray)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--spotify-green)] resize-none"
              rows={3}
              autoFocus
            />
          </div>

          {/* Hypothesis type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type
            </label>
            <select
              value={hypothesisType}
              onChange={(e) => setHypothesisType(e.target.value as HypothesisType)}
              className="w-full px-3 py-2 bg-[var(--spotify-bg)] border border-[var(--spotify-border-gray)] rounded-lg text-white focus:outline-none focus:border-[var(--spotify-green)]"
            >
              <option value="mechanistic">Mechanistic</option>
              <option value="predictive">Predictive</option>
              <option value="descriptive">Descriptive</option>
              <option value="null">Null</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HypothesisStatus)}
              className="w-full px-3 py-2 bg-[var(--spotify-bg)] border border-[var(--spotify-border-gray)] rounded-lg text-white focus:outline-none focus:border-[var(--spotify-green)]"
            >
              <option value="proposed">Proposed</option>
              <option value="testing">Testing</option>
              <option value="supported">Supported</option>
              <option value="rejected">Rejected</option>
              <option value="inconclusive">Inconclusive</option>
            </select>
          </div>

          {/* Confidence level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confidence Level: <span className="text-white font-bold">{confidenceLevel}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--spotify-bg)] rounded-lg appearance-none cursor-pointer accent-[var(--spotify-green)]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional context or notes..."
              className="w-full px-3 py-2 bg-[var(--spotify-bg)] border border-[var(--spotify-border-gray)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--spotify-green)] resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--spotify-border-gray)]">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hypothesisText.trim()}
            className="px-4 py-2 text-sm font-medium bg-[var(--spotify-green)] text-black rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Hypothesis'}
          </button>
        </div>
      </div>
    </div>
  );
}

