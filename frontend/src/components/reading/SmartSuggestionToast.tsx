'use client';

import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { NoteSuggestion } from '@/hooks/useSmartNoteSuggestions';

interface SmartSuggestionToastProps {
  suggestion: NoteSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Phase 2.2: Smart Suggestion Toast
 * 
 * Shows suggestion to link user's highlight to AI-identified hypothesis.
 * Appears when user highlights text matching AI evidence.
 */
export default function SmartSuggestionToast({
  suggestion,
  onAccept,
  onDismiss,
}: SmartSuggestionToastProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-400 rounded-xl p-5 shadow-2xl z-50 max-w-md animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-purple-900 text-lg flex items-center gap-2">
            🤖 AI Suggestion
          </h4>
          <p className="text-sm text-gray-700 mt-1">
            This text matches AI-extracted evidence!
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Hypothesis Info */}
      {suggestion.evidence.hypothesis_text && (
        <div className="bg-white rounded-lg p-3 mb-3 border border-purple-200">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
            Supports Hypothesis
          </p>
          <p className="text-sm font-medium text-gray-800 leading-relaxed">
            "{suggestion.evidence.hypothesis_text}"
          </p>
        </div>
      )}

      {/* Evidence Relevance */}
      {suggestion.evidence.relevance && (
        <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-100">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
            Why This Matters
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {suggestion.evidence.relevance}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          ✨ Link to Hypothesis
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
        >
          Not Now
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        This will create a note linked to the hypothesis and mark it as supporting evidence.
      </p>
    </div>
  );
}

