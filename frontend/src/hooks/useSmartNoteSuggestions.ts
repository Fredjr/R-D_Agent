/**
 * Phase 2.2: Smart Note Suggestions Hook
 * 
 * Detects when user highlights text matching AI evidence and suggests linking to hypothesis.
 */

import { useState, useEffect } from 'react';
import { findMatchingEvidence, type AIEvidence } from '@/lib/api/evidence';

export interface NoteSuggestion {
  type: 'link_to_hypothesis';
  evidence: AIEvidence;
  selectedText: string;
  action: string;
}

interface UseSmartNoteSuggestionsProps {
  aiEvidence: AIEvidence[];
  enabled?: boolean;
}

export function useSmartNoteSuggestions({
  aiEvidence,
  enabled = true,
}: UseSmartNoteSuggestionsProps) {
  const [suggestion, setSuggestion] = useState<NoteSuggestion | null>(null);

  /**
   * Check if user's text selection matches any AI evidence
   */
  function checkForMatch(selectedText: string): NoteSuggestion | null {
    if (!enabled || !selectedText || selectedText.length < 20) {
      return null;
    }

    console.log(`🔍 Checking for AI evidence match: "${selectedText.substring(0, 50)}..."`);

    // Find matching AI evidence
    const match = findMatchingEvidence(selectedText, aiEvidence);

    if (match && match.hypothesis_id) {
      console.log(`✅ Found matching AI evidence linked to hypothesis ${match.hypothesis_id}`);

      const newSuggestion: NoteSuggestion = {
        type: 'link_to_hypothesis',
        evidence: match,
        selectedText,
        action: 'Link this highlight to hypothesis?',
      };

      setSuggestion(newSuggestion);
      return newSuggestion;
    } else if (match) {
      console.log(`ℹ️ Found matching AI evidence but no hypothesis link`);
    } else {
      console.log(`ℹ️ No matching AI evidence found`);
    }

    return null;
  }

  /**
   * Clear current suggestion
   */
  function clearSuggestion() {
    setSuggestion(null);
  }

  /**
   * Dismiss suggestion and don't show again for this text
   */
  function dismissSuggestion() {
    // TODO: Store dismissed suggestions in localStorage to avoid showing again
    clearSuggestion();
  }

  return {
    suggestion,
    checkForMatch,
    clearSuggestion,
    dismissSuggestion,
  };
}

