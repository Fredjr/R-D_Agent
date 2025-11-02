'use client';

import { useState } from 'react';
import { DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface Step7FirstNoteProps {
  seedPaper: { pmid: string; title: string } | null;
  projectId: string;
  onComplete: () => void;
  onBack: () => void;
}

const NOTE_TYPES = [
  { value: 'finding', label: 'Key Finding', description: 'Important results or discoveries', color: 'blue' },
  { value: 'method', label: 'Method', description: 'Experimental techniques or approaches', color: 'green' },
  { value: 'question', label: 'Question', description: 'Research questions or hypotheses', color: 'purple' },
  { value: 'critique', label: 'Critique', description: 'Critical analysis or limitations', color: 'red' },
  { value: 'connection', label: 'Connection', description: 'Links to other research', color: 'yellow' },
  { value: 'idea', label: 'Idea', description: 'New ideas or future directions', color: 'pink' },
  { value: 'summary', label: 'Summary', description: 'Overview or main points', color: 'gray' },
];

const PRIORITIES = [
  { value: 'critical', label: 'Critical', color: 'red' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'low', label: 'Low', color: 'gray' },
];

export default function Step7FirstNote({
  seedPaper,
  projectId,
  onComplete,
  onBack,
}: Step7FirstNoteProps) {
  const [noteType, setNoteType] = useState<string>('finding');
  const [priority, setPriority] = useState<string>('medium');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateNote = async () => {
    if (!content.trim()) {
      setError('Please enter note content');
      return;
    }

    if (content.trim().length < 10) {
      setError('Note must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Creating first note');

      const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': 'default_user',
        },
        body: JSON.stringify({
          article_pmid: seedPaper?.pmid || null,
          content: content.trim(),
          note_type: noteType,
          priority: priority,
          status: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      const note = await response.json();
      console.log('✅ Note created:', note);

      // Complete onboarding
      onComplete();
    } catch (err: any) {
      console.error('❌ Error creating note:', err);
      setError(err.message || 'Failed to create note. Please try again.');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const selectedNoteType = NOTE_TYPES.find(t => t.value === noteType);
  const selectedPriority = PRIORITIES.find(p => p.value === priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <DocumentTextIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add Your First Note
        </h2>
        <p className="text-gray-600">
          Capture insights, questions, or key findings from your research
        </p>
      </div>

      {/* Seed Paper Info */}
      {seedPaper && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-1">Adding note to:</p>
          <p className="text-sm text-blue-700">{seedPaper.title}</p>
        </div>
      )}

      {/* Note Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Note Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {NOTE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setNoteType(type.value)}
              className={`p-3 border-2 rounded-lg text-left transition-all ${
                noteType === type.value
                  ? `border-${type.color}-500 bg-${type.color}-50`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
              <div className="text-xs text-gray-600">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Priority
        </label>
        <div className="flex gap-3">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                priority === p.value
                  ? `border-${p.color}-500 bg-${p.color}-50 text-${p.color}-700`
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your note here... (e.g., 'This paper demonstrates a novel approach to...')"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          rows={6}
          maxLength={2000}
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">
            {content.length}/2000 characters
          </p>
          {content.length < 10 && content.length > 0 && (
            <p className="text-xs text-red-500">
              Minimum 10 characters
            </p>
          )}
        </div>
      </div>

      {/* Example Notes */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">💡 Example Notes:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Finding:</strong> "The study shows a 40% improvement in treatment efficacy"</li>
          <li>• <strong>Method:</strong> "Used CRISPR-Cas9 for gene knockout experiments"</li>
          <li>• <strong>Question:</strong> "How does this approach compare to traditional methods?"</li>
          <li>• <strong>Critique:</strong> "Sample size is relatively small (n=50)"</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
        >
          ← Back
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Skip for Now
          </button>
          <button
            onClick={handleCreateNote}
            disabled={loading || !content.trim() || content.trim().length < 10}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Create Note & Complete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Completion Message */}
      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          🎉 You're almost done! After creating your first note, you'll be ready to start your research journey.
        </p>
      </div>
    </div>
  );
}

