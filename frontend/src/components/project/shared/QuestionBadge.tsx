'use client';

import React, { useState, useEffect } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { ResearchQuestion, QuestionStatus, QuestionPriority } from '@/lib/types/questions';

interface QuestionBadgeProps {
  questionId: string;
  projectId: string;
  onClick?: () => void;
  compact?: boolean;
}

const statusColors: Record<QuestionStatus, string> = {
  exploring: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  answered: 'bg-green-500/20 text-green-400 border-green-500/30',
  parked: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const priorityColors: Record<QuestionPriority, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  critical: 'text-red-400'
};

const statusEmojis: Record<QuestionStatus, string> = {
  exploring: '🔍',
  investigating: '🔬',
  answered: '✅',
  parked: '⏸️'
};

export function QuestionBadge({ questionId, projectId, onClick, compact = false }: QuestionBadgeProps) {
  const [question, setQuestion] = useState<ResearchQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/research-questions/${questionId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch question');
        }

        const data = await response.json();
        setQuestion(data);
      } catch (err) {
        console.error('Error fetching question:', err);
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  if (loading) {
    return (
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="p-3 bg-red-900/20 rounded-lg border border-red-700/30">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <QuestionMarkCircleIcon className="w-4 h-4" />
          <span>Question not found</span>
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
        <span>{statusEmojis[question.status]}</span>
        <span className="text-gray-300 truncate max-w-[200px]">
          {question.question_text}
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
          <QuestionMarkCircleIcon className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white leading-relaxed mb-2">
            {question.question_text}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border",
              statusColors[question.status]
            )}>
              <span>{statusEmojis[question.status]}</span>
              <span className="capitalize">{question.status}</span>
            </span>
            <span className={cn(
              "text-xs font-medium",
              priorityColors[question.priority]
            )}>
              Priority: {question.priority}
            </span>
            {question.question_type !== 'main' && (
              <span className="text-xs text-gray-500">
                Type: {question.question_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

