'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type {
  QuestionTreeNode,
  QuestionType,
  QuestionStatus,
  QuestionPriority,
  QuestionFormData
} from '@/lib/types/questions';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData & { parent_question_id?: string }) => Promise<void>;
  editingQuestion?: QuestionTreeNode | null;
  parentQuestionId?: string | null;
  projectId: string;
}

export function AddQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  editingQuestion,
  parentQuestionId,
  projectId
}: AddQuestionModalProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: '',
    question_type: 'sub',
    description: '',
    status: 'exploring',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or editing question changes
  useEffect(() => {
    if (isOpen) {
      if (editingQuestion) {
        setFormData({
          question_text: editingQuestion.question_text,
          question_type: editingQuestion.question_type,
          description: editingQuestion.description || '',
          status: editingQuestion.status,
          priority: editingQuestion.priority
        });
      } else {
        setFormData({
          question_text: '',
          question_type: parentQuestionId ? 'sub' : 'main',
          description: '',
          status: 'exploring',
          priority: 'medium'
        });
      }
      setError(null);
    }
  }, [isOpen, editingQuestion, parentQuestionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        parent_question_id: parentQuestionId || undefined
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-2xl bg-[var(--spotify-dark-gray)] rounded-lg shadow-2xl border border-[var(--spotify-border-gray)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--spotify-border-gray)]">
          <h2 className="text-2xl font-bold text-[var(--spotify-white)]">
            {editingQuestion ? 'Edit Question' : parentQuestionId ? 'Add Sub-Question' : 'Add Question'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--spotify-light-gray)] transition-colors"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-6 h-6 text-[var(--spotify-light-text)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-[var(--spotify-light-text)] mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="What specific question are you trying to answer?"
              rows={3}
              className="w-full px-4 py-3 bg-[var(--spotify-black)] text-[var(--spotify-white)] border border-[var(--spotify-border-gray)] rounded-lg focus:border-[var(--spotify-green)] focus:outline-none placeholder:text-[var(--spotify-light-text)]"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--spotify-light-text)] mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more context about this question..."
              rows={2}
              className="w-full px-4 py-3 bg-[var(--spotify-black)] text-[var(--spotify-white)] border border-[var(--spotify-border-gray)] rounded-lg focus:border-[var(--spotify-green)] focus:outline-none placeholder:text-[var(--spotify-light-text)]"
              disabled={isSubmitting}
            />
          </div>

          {/* Row: Question Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--spotify-light-text)] mb-2">
                Type
              </label>
              <select
                value={formData.question_type}
                onChange={(e) => setFormData({ ...formData, question_type: e.target.value as QuestionType })}
                className="w-full px-4 py-3 bg-[var(--spotify-black)] text-[var(--spotify-white)] border border-[var(--spotify-border-gray)] rounded-lg focus:border-[var(--spotify-green)] focus:outline-none"
                disabled={isSubmitting || !!parentQuestionId}
              >
                <option value="main">Main Question</option>
                <option value="sub">Sub-Question</option>
                <option value="exploratory">Exploratory</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-[var(--spotify-light-text)] mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as QuestionStatus })}
                className="w-full px-4 py-3 bg-[var(--spotify-black)] text-[var(--spotify-white)] border border-[var(--spotify-border-gray)] rounded-lg focus:border-[var(--spotify-green)] focus:outline-none"
                disabled={isSubmitting}
              >
                <option value="exploring">🔍 Exploring</option>
                <option value="investigating">🔬 Investigating</option>
                <option value="answered">✅ Answered</option>
                <option value="parked">⏸️ Parked</option>
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[var(--spotify-light-text)] mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as QuestionPriority })}
              className="w-full px-4 py-3 bg-[var(--spotify-black)] text-[var(--spotify-white)] border border-[var(--spotify-border-gray)] rounded-lg focus:border-[var(--spotify-green)] focus:outline-none"
              disabled={isSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200",
                "bg-[var(--spotify-green)] text-black hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isSubmitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg font-semibold bg-[var(--spotify-light-gray)] text-[var(--spotify-white)] hover:bg-[var(--spotify-border-gray)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

