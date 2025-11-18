/**
 * HypothesesSection Component
 * Displays hypotheses for a specific question with CRUD operations
 * Phase 1, Week 5: Hypothesis UI Components
 */

import { useState, useEffect } from 'react';
import type { Hypothesis, HypothesisType, HypothesisStatus } from '@/lib/types/questions';
import { HypothesisCard } from './HypothesisCard';
import { AddHypothesisModal } from './AddHypothesisModal';
import {
  getQuestionHypotheses,
  createHypothesis,
  updateHypothesis,
  deleteHypothesis
} from '@/lib/api/questions';
import { PlusIcon } from '@heroicons/react/24/outline';
import { SpotifyTabLoading, SpotifyTabEmptyState } from '../shared';

interface HypothesesSectionProps {
  questionId: string;
  questionText: string;
  projectId: string;
  userId: string;
  onLinkEvidence?: (hypothesisId: string, hypothesisText: string) => void;
}

export function HypothesesSection({
  questionId,
  questionText,
  projectId,
  userId,
  onLinkEvidence
}: HypothesesSectionProps) {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHypothesis, setEditingHypothesis] = useState<Hypothesis | null>(null);

  // Load hypotheses
  const loadHypotheses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getQuestionHypotheses(questionId, userId);
      setHypotheses(data);
    } catch (err) {
      console.error('Failed to load hypotheses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hypotheses');
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadHypotheses();
  }, [questionId, userId]);

  // Handle create
  const handleCreate = async (data: {
    hypothesis_text: string;
    hypothesis_type: HypothesisType;
    description?: string;
    status: HypothesisStatus;
    confidence_level: number;
  }) => {
    await createHypothesis(
      {
        project_id: projectId,
        question_id: questionId,
        ...data
      },
      userId
    );
    await loadHypotheses();
  };

  // Handle edit
  const handleEdit = (hypothesisId: string) => {
    const hypothesis = hypotheses.find(h => h.hypothesis_id === hypothesisId);
    if (hypothesis) {
      setEditingHypothesis(hypothesis);
    }
  };

  // Handle update
  const handleUpdate = async (data: {
    hypothesis_text: string;
    hypothesis_type: HypothesisType;
    description?: string;
    status: HypothesisStatus;
    confidence_level: number;
  }) => {
    if (!editingHypothesis) return;
    await updateHypothesis(editingHypothesis.hypothesis_id, data, userId);
    await loadHypotheses();
  };

  // Handle delete
  const handleDelete = async (hypothesisId: string) => {
    if (!confirm('Are you sure you want to delete this hypothesis?')) return;
    try {
      await deleteHypothesis(hypothesisId, userId);
      await loadHypotheses();
    } catch (err) {
      console.error('Failed to delete hypothesis:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete hypothesis');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (hypothesisId: string, status: string) => {
    try {
      await updateHypothesis(hypothesisId, { status: status as HypothesisStatus }, userId);
      await loadHypotheses();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (isLoading) {
    return <SpotifyTabLoading message="Loading hypotheses..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Hypotheses ({hypotheses.length})
        </h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[var(--spotify-green)] text-black rounded-full hover:scale-105 transition-transform"
        >
          <PlusIcon className="w-4 h-4" />
          Add Hypothesis
        </button>
      </div>

      {/* Hypotheses list */}
      {hypotheses.length === 0 ? (
        <SpotifyTabEmptyState
          icon="💡"
          title="No hypotheses yet"
          description="Add your first hypothesis to start testing ideas"
          action={{
            label: 'Add Hypothesis',
            onClick: () => setIsAddModalOpen(true),
            icon: <PlusIcon className="w-5 h-5" />
          }}
        />
      ) : (
        <div className="space-y-3">
          {hypotheses.map((hypothesis) => (
            <HypothesisCard
              key={hypothesis.hypothesis_id}
              hypothesis={hypothesis}
              userId={userId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLinkEvidence={() => onLinkEvidence?.(hypothesis.hypothesis_id, hypothesis.hypothesis_text)}
              onUpdateStatus={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingHypothesis) && (
        <AddHypothesisModal
          questionId={questionId}
          questionText={questionText}
          projectId={projectId}
          hypothesis={editingHypothesis}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingHypothesis(null);
          }}
          onSave={editingHypothesis ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}

