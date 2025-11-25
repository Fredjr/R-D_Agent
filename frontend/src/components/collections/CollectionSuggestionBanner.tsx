'use client';

/**
 * Collection Suggestion Banner
 * 
 * Phase 3, Feature 3.1: Smart Collection Suggestions
 * Shows AI-generated suggestions for creating collections based on triage data.
 */

import { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon, FolderPlusIcon } from '@heroicons/react/24/outline';

interface CollectionSuggestion {
  suggestion_id: string;
  project_id: string;
  suggestion_type: string;
  collection_name: string;
  description: string;
  article_pmids: string[];
  paper_count: number;
  linked_hypothesis_ids: string[];
  linked_question_ids: string[];
  metadata: Record<string, any>;
  created_at: string;
}

interface CollectionSuggestionBannerProps {
  projectId: string;
  userId: string;
  onCollectionCreated?: (collectionId: string) => void;
}

export default function CollectionSuggestionBanner({
  projectId,
  userId,
  onCollectionCreated,
}: CollectionSuggestionBannerProps) {
  const [suggestions, setSuggestions] = useState<CollectionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, [projectId, userId]);

  async function fetchSuggestions() {
    try {
      setLoading(true);
      const response = await fetch(`/api/proxy/collections/suggestions/${projectId}?min_papers=5`, {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch collection suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCollection(suggestion: CollectionSuggestion) {
    try {
      setCreating(suggestion.suggestion_id);

      // Determine entity_id based on suggestion type
      let entityId: string | undefined;
      if (suggestion.suggestion_type === 'hypothesis' && suggestion.linked_hypothesis_ids.length > 0) {
        entityId = suggestion.linked_hypothesis_ids[0];
      } else if (suggestion.suggestion_type === 'question' && suggestion.linked_question_ids.length > 0) {
        entityId = suggestion.linked_question_ids[0];
      }

      const response = await fetch(
        `/api/proxy/collections/create-from-triage?project_id=${projectId}&suggestion_type=${suggestion.suggestion_type}${entityId ? `&entity_id=${entityId}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': userId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Collection created:', data);

        // Dismiss this suggestion
        handleDismiss(suggestion.suggestion_id);

        // Notify parent
        if (onCollectionCreated) {
          onCollectionCreated(data.collection_id);
        }
      } else {
        console.error('Failed to create collection:', await response.text());
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setCreating(null);
    }
  }

  function handleDismiss(suggestionId: string) {
    setDismissedIds((prev) => new Set(prev).add(suggestionId));
  }

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.suggestion_id));

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (visibleSuggestions.length === 0) {
    return null; // No suggestions to show
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleSuggestions.map((suggestion) => (
        <div
          key={suggestion.suggestion_id}
          className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-5 shadow-lg"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    🤖 Smart Collection Suggestion
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Based on your AI triage results, we found {suggestion.paper_count} papers that could be organized together.
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => handleDismiss(suggestion.suggestion_id)}
                  className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Dismiss suggestion"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Collection details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-2">
                  <FolderPlusIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {suggestion.collection_name}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{suggestion.paper_count} papers</span>
                  <span className="capitalize">{suggestion.suggestion_type.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleCreateCollection(suggestion)}
                  disabled={creating === suggestion.suggestion_id}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {creating === suggestion.suggestion_id ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    '✨ Create Collection'
                  )}
                </button>
                <button
                  onClick={() => handleDismiss(suggestion.suggestion_id)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

