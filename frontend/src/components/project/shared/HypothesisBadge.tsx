'use client';

import React, { useState, useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Hypothesis, HypothesisStatus } from '@/lib/types/questions';

interface HypothesisBadgeProps {
  hypothesisId: string;
  projectId: string;
  onClick?: () => void;
  compact?: boolean;
}

const statusColors: Record<HypothesisStatus, string> = {
  proposed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  testing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  supported: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  inconclusive: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const statusEmojis: Record<HypothesisStatus, string> = {
  proposed: '💡',
  testing: '🧪',
  supported: '✅',
  rejected: '❌',
  inconclusive: '❓'
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'text-green-400';
  if (confidence >= 60) return 'text-blue-400';
  if (confidence >= 40) return 'text-yellow-400';
  return 'text-red-400';
};

export function HypothesisBadge({ hypothesisId, projectId, onClick, compact = false }: HypothesisBadgeProps) {
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHypothesis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/hypotheses/${hypothesisId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch hypothesis');
        }

        const data = await response.json();
        setHypothesis(data);
      } catch (err) {
        console.error('Error fetching hypothesis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hypothesis');
      } finally {
        setLoading(false);
      }
    };

    fetchHypothesis();
  }, [hypothesisId]);

  if (loading) {
    return (
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !hypothesis) {
    return (
      <div className="p-3 bg-red-900/20 rounded-lg border border-red-700/30">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <LightBulbIcon className="w-4 h-4" />
          <span>Hypothesis not found</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
          "bg-gray-800/50 border border-gray-700",
          "hover:border-[var(--spotify-green)]/50 transition-colors",
          onClick && "cursor-pointer"
        )}
      >
        <span>{statusEmojis[hypothesis.status]}</span>
        <span className="text-gray-300 truncate max-w-[200px]">
          {hypothesis.hypothesis_text}
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border transition-all duration-200",
        "bg-gray-800/30 border-gray-700",
        onClick && "hover:border-[var(--spotify-green)]/50 hover:bg-gray-800/50 cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <LightBulbIcon className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white leading-relaxed mb-2">
            {hypothesis.hypothesis_text}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border",
              statusColors[hypothesis.status]
            )}>
              <span>{statusEmojis[hypothesis.status]}</span>
              <span className="capitalize">{hypothesis.status}</span>
            </span>
            <span className={cn(
              "text-xs font-medium",
              getConfidenceColor(hypothesis.confidence_level)
            )}>
              Confidence: {hypothesis.confidence_level}%
            </span>
            <span className="text-xs text-gray-500">
              Type: {hypothesis.hypothesis_type}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

